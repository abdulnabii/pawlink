import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalUsers,
      totalPets,
      lostPets,
      recoveredCases,
      totalTags,
      activeTags,
      totalScans,
      recentScans,
      notificationsCount,
      recentJobs,
    ] = await Promise.all([
      db.user.count(),
      db.pet.count(),
      db.pet.count({ where: { status: "LOST" } }),
      db.recoveryCase.count({ where: { status: "RESOLVED" } }),
      db.tag.count(),
      db.tag.count({ where: { status: "ACTIVE" } }),
      db.scanEvent.count(),
      db.scanEvent.findMany({
        take: 10,
        orderBy: { timestamp: "desc" },
        include: {
          tag: {
            include: {
              assignments: {
                where: { unassignedAt: null },
                include: { pet: true },
              },
            },
          },
        },
      }),
      db.notification.groupBy({
        by: ["channel", "status"],
        _count: { id: true },
      }),
      db.notificationJob.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalPets,
        lostPets,
        recoveredCases,
        totalTags,
        activeTags,
        totalScans,
      },
      recentScans,
      notificationsCount,
      recentJobs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Admin access forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
