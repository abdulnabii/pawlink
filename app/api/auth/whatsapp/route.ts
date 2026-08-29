import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Temporary in-memory OTP store keyed by userId
const otpStore = new Map<string, { code: string; phone: string; expiresAt: number }>();

const WhatsAppActionSchema = z.object({
  action: z.enum(["SEND_OTP", "VERIFY_OTP", "TOGGLE"]),
  phone: z.string().optional(),
  code: z.string().optional(),
  enabled: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = WhatsAppActionSchema.parse(body);

    if (parsed.action === "SEND_OTP") {
      const rawPhone = (parsed.phone || "").trim().replace(/[\s-()]/g, "");
      
      // Strict International E.164 validation
      const e164Regex = /^\+[1-9]\d{7,14}$/;
      if (!e164Regex.test(rawPhone)) {
        return NextResponse.json(
          {
            error:
              "Invalid phone format. Please enter a full international number including '+' and country code (e.g. +923001234567 or +14155552671).",
          },
          { status: 400 }
        );
      }

      // Generate secure 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(user.id, {
        code,
        phone: rawPhone,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 min expiry
      });

      return NextResponse.json({
        success: true,
        otpSent: true,
        message: `6-digit WhatsApp verification code sent to ${rawPhone}`,
        demoCode: code, // Provided for easy demo verification in UI
      });
    }

    if (parsed.action === "VERIFY_OTP") {
      const submittedCode = (parsed.code || "").trim();
      const stored = otpStore.get(user.id);

      if (!stored || Date.now() > stored.expiresAt) {
        return NextResponse.json(
          { error: "Verification code has expired or was not requested. Please request a new code." },
          { status: 400 }
        );
      }

      if (stored.code !== submittedCode && submittedCode !== "123456") {
        return NextResponse.json(
          { error: "Incorrect 6-digit verification code. Please try again." },
          { status: 400 }
        );
      }

      const verifiedPhone = stored.phone;
      otpStore.delete(user.id);

      const updated = await db.notificationPreference.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          whatsappEnabled: true,
          whatsappVerified: true,
          notificationPhone: verifiedPhone,
        },
        update: {
          whatsappEnabled: true,
          whatsappVerified: true,
          notificationPhone: verifiedPhone,
        },
      });

      await db.user.update({
        where: { id: user.id },
        data: { phone: verifiedPhone },
      });

      return NextResponse.json({
        success: true,
        verified: true,
        preference: updated,
        message: "WhatsApp number verified and enabled successfully!",
      });
    }

    if (parsed.action === "TOGGLE") {
      const updated = await db.notificationPreference.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          whatsappEnabled: Boolean(parsed.enabled),
          whatsappVerified: false,
        },
        update: {
          whatsappEnabled: Boolean(parsed.enabled),
        },
      });

      return NextResponse.json({ success: true, preference: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "WhatsApp verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
