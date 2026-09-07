import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET analytics for a pet
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await import("@/lib/db");

    const pet = await db.pet.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!pet || pet.userId !== session.id) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [allScans, conversations, tag] = await Promise.all([
      db.scanEvent.findMany({
        where: {
          tag: { assignments: { some: { petId: params.id, unassignedAt: null } } },
          isTestScan: false,
          timestamp: { gte: thirtyDaysAgo },
        },
        select: {
          id: true,
          timestamp: true,
          deviceType: true,
          approximateLocation: true,
          country: true,
        },
        orderBy: { timestamp: "asc" },
      }),
      db.conversation.findMany({
        where: { petId: params.id },
        select: { id: true, createdAt: true, status: true },
      }),
      db.tagAssignment.findFirst({
        where: { petId: params.id, unassignedAt: null },
        include: { tag: { select: { scanCount: true, lastScannedAt: true } } },
      }),
    ]);

    // Build daily scan chart (last 30 days)
    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      dailyMap[key] = 0;
    }
    for (const scan of allScans) {
      const key = new Date(scan.timestamp).toISOString().split("T")[0];
      if (key in dailyMap) dailyMap[key]++;
    }
    const dailyScans = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Device breakdown
    const deviceCount: Record<string, number> = {};
    for (const scan of allScans) {
      const key = scan.deviceType || "Unknown";
      deviceCount[key] = (deviceCount[key] || 0) + 1;
    }

    // Top locations
    const locCount: Record<string, number> = {};
    for (const scan of allScans) {
      const key = scan.approximateLocation || scan.country || "Unknown";
      locCount[key] = (locCount[key] || 0) + 1;
    }
    const topLocations = Object.entries(locCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));

    return NextResponse.json({
      totalScans: tag?.tag?.scanCount || allScans.length,
      scansLast30Days: allScans.length,
      lastScannedAt: tag?.tag?.lastScannedAt,
      totalMessages: conversations.length,
      dailyScans,
      deviceBreakdown: deviceCount,
      topLocations,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch analytics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
