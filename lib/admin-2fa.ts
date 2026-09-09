import crypto from "crypto";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { isAdminEmail, SessionUser, ADMIN_EMAILS } from "./auth";
import { EmailProvider } from "./notifications/providers/email";
import { db } from "./db";

const OTP_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes
export const ADMIN_2FA_CHALLENGE_COOKIE = "pawlink_admin_otp_challenge";
export const ADMIN_2FA_COOKIE_NAME = "pawlink_admin_2fa";

function getJwtSecret(): string {
  return process.env.JWT_SECRET || "dev_only_jwt_secret_NOT_FOR_PRODUCTION";
}

interface ChallengePayload {
  email: string;
  codeHash: string;
  expiresAt: number;
}

/**
 * Generates a cryptographically secure 6-digit OTP code and a signed challenge token
 */
export function generateAdminOtp(email: string): {
  code: string;
  challengeToken: string;
  expiresAt: number;
} {
  const normalizedEmail = email.trim().toLowerCase();
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + OTP_EXPIRATION_MS;

  // Salted HMAC hash of email + code + secret
  const codeHash = crypto
    .createHmac("sha256", getJwtSecret())
    .update(`${normalizedEmail}:${code}:${expiresAt}`)
    .digest("hex");

  const challengeToken = jwt.sign(
    {
      email: normalizedEmail,
      codeHash,
      expiresAt,
    } as ChallengePayload,
    getJwtSecret(),
    { expiresIn: "10m" }
  );

  return { code, challengeToken, expiresAt };
}

/**
 * Verifies the 6-digit code against the signed challenge token
 */
export function verifyAdminOtp(
  challengeToken: string,
  inputEmail: string,
  inputCode: string
): { valid: boolean; error?: string; email?: string } {
  try {
    const decoded = jwt.verify(challengeToken, getJwtSecret()) as ChallengePayload;
    if (!decoded || !decoded.email || !decoded.codeHash || !decoded.expiresAt) {
      return { valid: false, error: "Invalid challenge token." };
    }

    if (Date.now() > decoded.expiresAt) {
      return { valid: false, error: "Security code has expired. Please request a new code." };
    }

    const normalizedInputEmail = inputEmail.trim().toLowerCase();
    if (decoded.email !== normalizedInputEmail) {
      return { valid: false, error: "Email mismatch for this security code." };
    }

    const cleanCode = inputCode.trim();
    const expectedHash = crypto
      .createHmac("sha256", getJwtSecret())
      .update(`${decoded.email}:${cleanCode}:${decoded.expiresAt}`)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedHash, "hex");
    const actualBuf = Buffer.from(decoded.codeHash, "hex");

    if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      return { valid: false, error: "Incorrect 6-digit code. Please verify and try again." };
    }

    return { valid: true, email: decoded.email };
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return { valid: false, error: "Security code has expired. Please request a new code." };
    }
    return { valid: false, error: "Invalid or tampered security code session." };
  }
}

/**
 * Signs an Admin 2FA verified session token
 */
export function signAdmin2faSession(email: string): string {
  return jwt.sign(
    {
      email: email.trim().toLowerCase(),
      is2faVerified: true,
      timestamp: Date.now(),
    },
    getJwtSecret(),
    { expiresIn: "24h" }
  );
}

/**
 * Sets the verified 2FA cookie
 */
export async function setAdmin2faCookie(email: string) {
  const token = signAdmin2faSession(email);
  const cookieStore = cookies();
  cookieStore.set(ADMIN_2FA_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Checks if the current request has a valid 2FA cookie
 */
export async function hasAdmin2faSession(targetEmail?: string): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(ADMIN_2FA_COOKIE_NAME)?.value;
    if (!token) return false;

    const decoded = jwt.verify(token, getJwtSecret()) as any;
    if (!decoded || !decoded.is2faVerified || !decoded.email) {
      return false;
    }

    if (targetEmail && decoded.email.toLowerCase() !== targetEmail.toLowerCase()) {
      return false;
    }

    return isAdminEmail(decoded.email);
  } catch {
    return false;
  }
}

/**
 * Clears the 2FA session cookie
 */
export async function clearAdmin2faCookie() {
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_2FA_COOKIE_NAME);
  cookieStore.delete(ADMIN_2FA_CHALLENGE_COOKIE);
}

/**
 * Sends the 6-digit OTP code to the administrator's email
 */
export async function sendAdmin2faEmail(
  email: string,
  code: string
): Promise<{ success: boolean; deliveredRealEmail: boolean; deliveredTo?: string; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const emailProvider = new EmailProvider();

  console.log(`[Admin 2FA] Verification code for ${normalizedEmail}: ${code}`);

  try {
    const result = await emailProvider.send({
      userId: "admin_system",
      recipientEmail: normalizedEmail,
      type: "ADMIN_2FA_ALERT",
      title: "Admin 2FA Security Code",
      body: `Your PawLink Administrator security verification code is: ${code}. This code expires in 10 minutes.`,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://pawlink-chi.vercel.app"}/admin`,
    });

    if (!result.success && result.error) {
      console.warn(`[Admin 2FA Email] Provider error: ${result.error}`);
    }

    return {
      success: result.success,
      deliveredRealEmail: Boolean(result.deliveredRealEmail),
      deliveredTo: result.deliveredTo,
      error: result.error,
    };
  } catch (err: any) {
    console.error(`[Admin 2FA Email] Failed to send:`, err);
    return { success: false, deliveredRealEmail: false, error: err.message };
  }
}
