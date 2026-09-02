import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { resilientStore } from "@/lib/store";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";
import { enqueueNotificationJob, processNotificationQueue } from "@/lib/queue/worker";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const adminNotes = body.notes || "Transaction reference could not be verified";

    const rejectedRequest = await resilientStore.rejectPaymentRequest(
      params.id,
      adminNotes
    );

    if (!rejectedRequest) {
      return NextResponse.json(
        { error: "Payment request not found" },
        { status: 404 }
      );
    }

    // 1. Immediately create in-app notification for the user
    await db.notification.create({
      data: {
        userId: rejectedRequest.userId,
        type: "PLAN_PAYMENT_REJECTED",
        channel: "IN_APP",
        status: "SENT",
        title: `⚠️ Payment Verification Update`,
        body: `Your payment request for ${rejectedRequest.requestedPlan} was declined: ${adminNotes}. Please contact support or submit a new transaction reference.`,
        metadata: JSON.stringify({
          plan: rejectedRequest.requestedPlan,
          adminNotes,
          paymentRequestId: rejectedRequest.id,
        }),
      },
    });

    // 2. Enqueue external notification
    await enqueueNotificationJob(
      rejectedRequest.userId,
      "PLAN_PAYMENT_REJECTED",
      {
        userId: rejectedRequest.userId,
        type: "PLAN_PAYMENT_REJECTED",
        title: `⚠️ Payment Verification Update`,
        body: `Your payment request for ${rejectedRequest.requestedPlan} was declined: ${adminNotes}. Please contact support or retry.`,
      },
      `PLAN_REJECT:${rejectedRequest.id}`
    );

    await processNotificationQueue(5).catch(() => {});
    await resilientStore.syncToCloud(true);

    return NextResponse.json({
      success: true,
      request: sanitizePrisma(rejectedRequest),
      message: `Payment request marked as rejected.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Rejection failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
