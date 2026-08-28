import { describe, it, expect } from "vitest";
import { checkRateLimit, isNotificationThrottled } from "../lib/rate-limit";

describe("Anti-Abuse & Notification Throttling Suite", () => {
  it("should enforce rate limiting on high-frequency requests", () => {
    const key = "test_client_ip_1";
    let allowedCount = 0;
    let blockedCount = 0;

    // Simulate 40 rapid requests with limit 20
    for (let i = 0; i < 40; i++) {
      const check = checkRateLimit(key, 20, 60 * 1000);
      if (check.success) {
        allowedCount++;
      } else {
        blockedCount++;
      }
    }

    expect(allowedCount).toBe(20);
    expect(blockedCount).toBe(20);
  });

  it("should throttle 100 rapid scans within 5 minutes down to a single alert", () => {
    const tagId = "tag_987654";
    const ipHash = "salted_hash_xyz_123";

    let notificationsTriggered = 0;
    let notificationsThrottled = 0;

    // Simulate 100 rapid scans from same device/ipHash
    for (let i = 0; i < 100; i++) {
      const throttled = isNotificationThrottled(tagId, ipHash, 5 * 60 * 1000);
      if (!throttled) {
        notificationsTriggered++;
      } else {
        notificationsThrottled++;
      }
    }

    // Exactly 1 alert must go through, 99 throttled!
    expect(notificationsTriggered).toBe(1);
    expect(notificationsThrottled).toBe(99);
  });
});
