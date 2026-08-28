import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Support standard Twilio / Meta webhook format
    const providerId = body.MessageSid || body.id || body.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.id;
    const rawStatus = body.MessageStatus || body.status || body.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.status;

    if (!providerId || !rawStatus) {
      return NextResponse.json({ received: true, note: "No status payload found" });
    }

    let status = "SENT";
    const s = rawStatus.toLowerCase();
    if (s.includes("delivered")) status = "DELIVERED";
    else if (s.includes("read")) status = "READ";
    else if (s.includes("failed") || s.includes("undelivered")) status = "FAILED";

    // Update matching notification record in DB
    await db.notification.updateMany({
      where: { providerId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ received: true, providerId, status });
  } catch (err: unknown) {
    console.error("[WhatsApp Webhook Error]", err);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}

// Meta WhatsApp Webhook verification GET handler
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ status: "ok", service: "PawLink WhatsApp Ingress" });
}
