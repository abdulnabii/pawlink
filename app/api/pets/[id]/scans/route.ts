import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET pet scan events for map visualization
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

    const scans = await db.scanEvent.findMany({
      where: {
        tag: { assignments: { some: { petId: params.id, unassignedAt: null } } },
        isTestScan: false,
      },
      orderBy: { timestamp: "desc" },
      take: 100,
      select: {
        id: true,
        timestamp: true,
        approximateLocation: true,
        city: true,
        country: true,
        deviceType: true,
        browser: true,
        scanSource: true,
        notificationSent: true,
      },
    });

    return NextResponse.json({ scans });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch scans";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
