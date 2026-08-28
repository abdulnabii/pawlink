interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const notificationThrottleStore = new Map<string, number>();

/**
 * General Sliding Window Rate Limiter
 * @param key Unique identifier (e.g., ipHash or action:ipHash)
 * @param maxRequests Allowed requests within window
 * @param windowMs Window duration in milliseconds
 * @returns { success: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests = 30,
  windowMs = 60 * 1000
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return { success: true, remaining: maxRequests - 1, resetAt: newEntry.resetAt };
  }

  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { success: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Checks if a scan notification should be throttled.
 * If the same ipHash scans the same tagId within a 5-minute cooldown window,
 * we still log the ScanEvent in the DB, but throttle sending duplicate WhatsApp alerts.
 * @returns true if notification is throttled (do NOT send), false if safe to send
 */
export function isNotificationThrottled(
  tagId: string,
  ipHash: string,
  cooldownMs = 5 * 60 * 1000
): boolean {
  const throttleKey = `throttle:${tagId}:${ipHash}`;
  const now = Date.now();
  const lastAlertTime = notificationThrottleStore.get(throttleKey);

  if (lastAlertTime && now - lastAlertTime < cooldownMs) {
    return true; // Throttled!
  }

  notificationThrottleStore.set(throttleKey, now);
  return false; // Not throttled, proceed to send notification
}

/**
 * Clean up stale rate limit entries periodically
 */
export function cleanupStaleEntries(): void {
  const now = Date.now();
  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  });
}
