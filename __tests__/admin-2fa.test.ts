import { describe, it, expect } from "vitest";
import { generateAdminOtp, verifyAdminOtp, signAdmin2faSession } from "../lib/admin-2fa";
import jwt from "jsonwebtoken";

describe("Admin 2FA Security Suite", () => {
  const testEmail = "abdulnabi.khaskhely@gmail.com";
  const secondAdminEmail = "khaskheli.abdulnabi110@gmail.com";

  it("should generate a 6-digit numeric OTP and valid challenge token", () => {
    const { code, challengeToken, expiresAt } = generateAdminOtp(testEmail);

    expect(code).toMatch(/^\d{6}$/);
    expect(typeof challengeToken).toBe("string");
    expect(challengeToken.length).toBeGreaterThan(20);
    expect(expiresAt).toBeGreaterThan(Date.now());
  });

  it("should successfully verify the matching 6-digit code", () => {
    const { code, challengeToken } = generateAdminOtp(testEmail);
    const result = verifyAdminOtp(challengeToken, testEmail, code);

    expect(result.valid).toBe(true);
    expect(result.email).toBe(testEmail);
  });

  it("should verify OTP for secondary admin email address", () => {
    const { code, challengeToken } = generateAdminOtp(secondAdminEmail);
    const result = verifyAdminOtp(challengeToken, secondAdminEmail, code);

    expect(result.valid).toBe(true);
    expect(result.email).toBe(secondAdminEmail);
  });

  it("should reject an incorrect 6-digit code", () => {
    const { code, challengeToken } = generateAdminOtp(testEmail);
    const wrongCode = code === "123456" ? "654321" : "123456";
    const result = verifyAdminOtp(challengeToken, testEmail, wrongCode);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Incorrect");
  });

  it("should reject a code when email address does not match", () => {
    const { code, challengeToken } = generateAdminOtp(testEmail);
    const result = verifyAdminOtp(challengeToken, "different@example.com", code);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("mismatch");
  });

  it("should reject a tampered challenge token", () => {
    const { code } = generateAdminOtp(testEmail);
    const tamperedToken = "invalid.token.structure";
    const result = verifyAdminOtp(tamperedToken, testEmail, code);

    expect(result.valid).toBe(false);
  });

  it("should sign a valid 2FA session token", () => {
    const sessionToken = signAdmin2faSession(testEmail);
    expect(typeof sessionToken).toBe("string");

    const decoded = jwt.decode(sessionToken) as any;
    expect(decoded.email).toBe(testEmail);
    expect(decoded.is2faVerified).toBe(true);
  });
});
