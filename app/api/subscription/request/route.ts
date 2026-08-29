import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { resilientStore } from "@/lib/store";
import { sanitizePrisma } from "@/lib/sanitize";
import { PLANS, BANK_PAYMENT_CONFIG } from "@/lib/plans";
import { enqueueNotificationJob } from "@/lib/queue/worker";

export async function GET() {
  try {
    const user = await requireAuth();
    const requests = await resilientStore.getUserPaymentRequests(user.id);
    return NextResponse.json({
      requests: sanitizePrisma(requests),
      bankConfig: BANK_PAYMENT_CONFIG,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load requests";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json().catch(() => ({}));

    const requestedPlan = (body.plan || "PLUS").toUpperCase();
    const transactionId = (body.transactionId || "").trim();
    const senderName = (body.senderName || "").trim();
    const senderPhone = (body.senderPhone || "").trim();
    const notes = (body.notes || "").trim();

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID / Reference Number is required for verification." },
        { status: 400 }
      );
    }

    if (!senderName) {
      return NextResponse.json(
        { error: "Sender Name / Account Title is required." },
        { status: 400 }
      );
    }

    const planConfig = PLANS.find((p) => p.id === requestedPlan);
    if (!planConfig || planConfig.id === "FREE") {
      return NextResponse.json(
        { error: "Invalid plan selected for payment verification." },
        { status: 400 }
      );
    }

    const paymentRequest = await resilientStore.createPaymentRequest({
      userId: user.id,
      userEmail: user.email,
      userName: user.name || "Pet Owner",
      requestedPlan: planConfig.id,
      amountPKR: planConfig.pricePKR,
      transactionId,
      senderName,
      senderPhone,
      notes,
    });

    // Notify admin via notification job
    await enqueueNotificationJob(
      "ADMIN",
      "SUBSCRIPTION_PAYMENT_SUBMITTED",
      {
        userId: "ADMIN",
        type: "PAYMENT_VERIFICATION_REQUESTED",
        title: `💳 New Payment: ${user.name} (${planConfig.name})`,
        body: `User ${user.email} submitted Rs ${planConfig.pricePKR} payment (TxID: ${transactionId}). Review & approve in Admin Portal.`,
        metadata: {
          plan: planConfig.id,
          amountPKR: planConfig.pricePKR,
          transactionId,
          senderName,
          userEmail: user.email,
        },
      },
      `PAYMENT_REQ:${paymentRequest.id}`
    );

    return NextResponse.json({
      success: true,
      request: sanitizePrisma(paymentRequest),
      message: `Payment submitted successfully! Your ${planConfig.name} plan will be activated as soon as admin verifies the transaction.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit payment verification";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
