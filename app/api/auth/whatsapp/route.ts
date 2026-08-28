import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const WhatsAppVerifySchema = z.object({
  phone: z.string().min(8, "Valid international phone number required (e.g. +14155552671)"),
  verified: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { phone, verified } = WhatsAppVerifySchema.parse(body);

    const updated = await db.notificationPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        whatsappEnabled: true,
        whatsappVerified: verified,
        notificationPhone: phone,
      },
      update: {
        whatsappEnabled: true,
        whatsappVerified: verified,
        notificationPhone: phone,
      },
    });

    // Also update User phone if empty
    await db.user.update({
      where: { id: user.id },
      data: { phone },
    });

    return NextResponse.json({ success: true, preference: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "WhatsApp verification update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
