import { db } from "../db";
import { notificationService } from "../notifications/service";
import { NotificationPayload } from "../notifications/types";

const RETRY_DELAYS_SECONDS = [0, 30, 120, 600]; // 0s, 30s, 2m, 10m

/**
 * Enqueues a notification job into the durable PostgreSQL queue within a transaction
 */
export async function enqueueNotificationJob(
  userId: string,
  type: string,
  payload: NotificationPayload,
  deduplicationKey?: string
) {
  try {
    return await db.notificationJob.create({
      data: {
        userId,
        type,
        payload: JSON.stringify(payload),
        deduplicationKey,
        status: "QUEUED",
        attempts: 0,
        maxAttempts: 4,
        scheduledAt: new Date(),
      },
    });
  } catch (err) {
    // If deduplicationKey already exists, ignore duplicate enqueue
    if ((err as { code?: string }).code === "P2002") {
      console.log(`[Queue] Deduplicated duplicate job with key: ${deduplicationKey}`);
      return null;
    }
    throw err;
  }
}

/**
 * Processes up to `batchSize` pending notification jobs in the durable queue.
 * Claims jobs with status=QUEUED atomically to prevent concurrent double-processing.
 */
export async function processNotificationQueue(batchSize = 10) {
  const now = new Date();

  // 1. Fetch eligible jobs
  const pendingJobs = await db.notificationJob.findMany({
    where: {
      status: "QUEUED",
      scheduledAt: { lte: now },
    },
    take: batchSize,
    orderBy: { createdAt: "asc" },
  });

  const results = [];

  for (const job of pendingJobs) {
    // Concurrency protection: Atomically transition status to PROCESSING
    const claimed = await db.notificationJob.updateMany({
      where: {
        id: job.id,
        status: "QUEUED",
      },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
      },
    });

    if (claimed.count === 0) {
      // Job was claimed by another concurrent worker instance
      continue;
    }

    let payload: NotificationPayload;
    try {
      payload = typeof job.payload === "string" ? JSON.parse(job.payload) : job.payload;
    } catch {
      payload = job.payload as unknown as NotificationPayload;
    }

    try {
      // Dispatch notification via multi-channel fallback service
      await notificationService.dispatch(payload);

      // Mark job as COMPLETED
      await db.notificationJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
          lastError: null,
        },
      });

      results.push({ jobId: job.id, success: true });
    } catch (err) {
      const errorMessage = (err as Error).message || "Unknown error during dispatch";
      const nextAttempt = job.attempts + 1;

      if (nextAttempt < job.maxAttempts) {
        // Schedule next exponential retry
        const delaySeconds = RETRY_DELAYS_SECONDS[nextAttempt] || 600;
        const nextScheduledAt = new Date(Date.now() + delaySeconds * 1000);

        await db.notificationJob.update({
          where: { id: job.id },
          data: {
            status: "QUEUED",
            scheduledAt: nextScheduledAt,
            lastError: errorMessage,
          },
        });
        results.push({ jobId: job.id, success: false, willRetry: true, nextScheduledAt });
      } else {
        // Max attempts reached - mark FAILED
        await db.notificationJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            processedAt: new Date(),
            lastError: `Max retries (${job.maxAttempts}) reached: ${errorMessage}`,
          },
        });
        results.push({ jobId: job.id, success: false, willRetry: false });
      }
    }
  }

  return results;
}
