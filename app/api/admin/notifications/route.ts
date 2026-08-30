import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { processNotificationQueue } from "@/lib/queue/worker";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin("notifications");
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "";

    const [jobs, queuedCount, processingCount, completedCount, failedCount] = await Promise.all([
      db.notificationJob.findMany({
        where: statusFilter ? { status: statusFilter } : {},
        take: 50,
        orderBy: { createdAt: "desc" },
      }),
      db.notificationJob.count({ where: { status: "QUEUED" } }),
      db.notificationJob.count({ where: { status: "PROCESSING" } }),
      db.notificationJob.count({ where: { status: "COMPLETED" } }),
      db.notificationJob.count({ where: { status: "FAILED" } }),
    ]);

    const total = queuedCount + processingCount + completedCount + failedCount;
    const failureRate = total > 0 ? Math.round((failedCount / total) * 100) : 0;

    return NextResponse.json({
      jobs: sanitizePrisma(jobs),
      stats: {
        queued: queuedCount,
        processing: processingCount,
        completed: completedCount,
        failed: failedCount,
        failureRate,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load notifications";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin("notifications", true);
    const body = await req.json().catch(() => ({}));
    const { jobId } = body;

    if (jobId) {
      // Idempotent retry: reset status to QUEUED and attempts
      await db.notificationJob.update({
        where: { id: jobId },
        data: {
          status: "QUEUED",
          scheduledAt: new Date(),
          attempts: 0,
          lastError: null,
        },
      });

      await db.auditLog.create({
        data: {
          userId: admin.id,
          action: "NOTIFICATION_JOB_RETRIED",
          entityType: "NOTIFICATION_JOB",
          entityId: jobId,
          metadata: JSON.stringify({ adminEmail: admin.email }),
        },
      });
    }

    // Trigger queue processing in background
    const processResult = await processNotificationQueue(10);

    return NextResponse.json({ success: true, processed: processResult });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retry notification";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
