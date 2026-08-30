import crypto from "crypto";

const TAG_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // No 0, O, 1, I to avoid confusion
const SALT = process.env.IP_HASH_SALT || "dev_only_ip_salt_NOT_FOR_PRODUCTION";

/**
 * Generates a cryptographically secure, high-entropy Tag Code
 * Example format: PW-7KX9Q2M8F4R6T1 (14 random characters = ~70 bits entropy)
 */
export function generateTagCode(): string {
  const bytes = crypto.randomBytes(14);
  let code = "";
  for (let i = 0; i < 14; i++) {
    code += TAG_ALPHABET[bytes[i] % TAG_ALPHABET.length];
  }
  return `PW-${code}`;
}

/**
 * Generates a 256-bit cryptographically secure token for zero-auth finder chat session
 */
export function generateFinderToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hashes an IP address using salted SHA-256 to ensure user privacy while enabling rate limiting
 */
export function hashIp(ip: string): string {
  const cleanIp = (ip || "127.0.0.1").trim();
  return crypto
    .createHmac("sha256", SALT)
    .update(cleanIp)
    .digest("hex");
}

/**
 * Generates a deduplication / idempotency key for scans within a short time window (e.g. 30 seconds)
 */
export function generateScanFingerprint(tagId: string, ipHash: string, windowSeconds = 30): string {
  const windowBucket = Math.floor(Date.now() / (windowSeconds * 1000));
  return crypto
    .createHash("sha256")
    .update(`${tagId}:${ipHash}:${windowBucket}`)
    .digest("hex");
}

/**
 * Generate a 6-digit physical tag activation PIN
 */
export function generateActivationPin(): string {
  return crypto.randomInt(100000, 999999).toString();
}
