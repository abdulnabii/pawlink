import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET() {
  try {
    const admin = await requireAdmin("dashboard");

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel aggregate queries for speed and efficiency
    const [
      totalUsers,
      totalPets,
      activePets,
      lostPets,
      recoveredPets,
      totalTags,
      activeTags,
      totalScans,
      scansToday,
      openRecoveryCases,
      recoveredThisMonth,
      failedNotifications,
      pendingJobs,
      openReports,
      recentScans,
      recentLostPets,
      recentRecoveries,
      recentUsers,
    ] = await Promise.all([
      db.user.count().catch(() => 0),
      db.pet.count().catch(() => 0),
      db.pet.count({ where: { status: { in: ["SAFE", "LOST", "RECOVERED"] } } }).catch(() => 0),
      db.pet.count({ where: { status: "LOST" } }).catch(() => 0),
      db.pet.count({ where: { status: "RECOVERED" } }).catch(() => 0),
      db.tag.count().catch(() => 0),
      db.tag.count({ where: { status: "ACTIVE" } }).catch(() => 0),
      db.scanEvent.count().catch(() => 0),
      db.scanEvent.count({ where: { timestamp: { gte: startOfToday } } }).catch(() => 0),
      db.recoveryCase.count({ where: { status: "OPEN" } }).catch(() => 0),
      db.recoveryCase.count({ where: { status: "RESOLVED", resolvedAt: { gte: startOfMonth } } }).catch(() => 0),
      db.notificationJob.count({ where: { status: "FAILED" } }).catch(() => 0),
      db.notificationJob.count({ where: { status: "QUEUED" } }).catch(() => 0),
      db.report.count({ where: { status: "OPEN" } }).catch(() => 0),
      
      // Recent activities
      db.scanEvent.findMany({
        take: 8,
        orderBy: { timestamp: "desc" },
        include: {
          tag: {
            include: {
              assignments: {
                where: { unassignedAt: null },
                include: {
                  pet: { select: { id: true, name: true, species: true, photoUrl: true, status: true } },
                },
                take: 1,
              },
            },
          },
        },
      }).catch(() => []),

      db.pet.findMany({
        where: { status: "LOST" },
        take: 6,
        orderBy: { updatedAt: "desc" },
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } },
          recoveryCases: { where: { status: "OPEN" }, take: 1 },
        },
      }).catch(() => []),

      db.recoveryCase.findMany({
        where: { status: "RESOLVED" },
        take: 6,
        orderBy: { resolvedAt: "desc" },
        include: {
          pet: { select: { id: true, name: true, species: true, photoUrl: true } },
        },
      }).catch(() => []),

      db.user.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { pets: true } },
        },
      }).catch(() => []),
    ]);

    // Recovery Rate Calculation:
    // Defined as: Total Recovered / (Total Recovered + Currently Lost) * 100
    // If no lost or recovered history, defaults to 100%
    const totalTracked = recoveredPets + lostPets;
    const recoveryRate = totalTracked > 0 ? Math.round((recoveredPets / totalTracked) * 100) : 100;

    // Operational System Alerts
    const operationalAlerts = [];
    if (failedNotifications > 0) {
      operationalAlerts.push({
        id: "alert_failed_notifs",
        level: "WARNING",
        message: `${failedNotifications} notification(s) failed delivery and need retry.`,
        actionTab: "notifications",
        actionText: "View Queue",
      });
    }
    if (openReports > 0) {
      operationalAlerts.push({
        id: "alert_open_reports",
        level: "INFO",
        message: `${openReports} moderation report(s) require admin review.`,
        actionTab: "reports",
        actionText: "Review Reports",
      });
    }
    if (lostPets > 0) {
      operationalAlerts.push({
        id: "alert_lost_pets",
        level: "URGENT",
        message: `${lostPets} pet(s) currently broadcast in Lost Mode with active recovery cases.`,
        actionTab: "recovery",
        actionText: "Emergency Console",
      });
    }
    if (pendingJobs > 25) {
      operationalAlerts.push({
        id: "alert_queue_load",
        level: "WARNING",
        message: `Notification queue has ${pendingJobs} pending jobs scheduled.`,
        actionTab: "notifications",
        actionText: "Monitor Queue",
      });
    }

    return NextResponse.json({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      kpi: {
        totalUsers,
        totalPets,
        activePets,
        lostPets,
        recoveredPets,
        totalTags,
        activeTags,
        totalScans,
        scansToday,
        openRecoveryCases,
        recoveredThisMonth,
        failedNotifications,
        pendingJobs,
        openReports,
        recoveryRate,
      },
      alerts: operationalAlerts,
      recentScans: sanitizePrisma(recentScans),
      recentLostPets: sanitizePrisma(recentLostPets),
      recentRecoveries: sanitizePrisma(recentRecoveries),
      recentUsers: sanitizePrisma(recentUsers),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Admin access forbidden";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

