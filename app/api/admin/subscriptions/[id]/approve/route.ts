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
    const adminNotes = body.notes || `Approved by admin (${admin.email})`;

    const approvedRequest = await resilientStore.approvePaymentRequest(
      params.id,
      adminNotes
    );

    if (!approvedRequest) {
      return NextResponse.json(
        { error: "Payment request not found" },
        { status: 404 }
      );
    }

    // Format human-readable expiry date: exact same day next month
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    if (nextMonth.getDate() !== now.getDate()) nextMonth.setDate(0);
    const formattedExpiry = nextMonth.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // 1. Immediately create in-app notification for the user in the database
    await db.notification.create({
      data: {
        userId: approvedRequest.userId,
        type: "PLAN_UPGRADED",
        channel: "IN_APP",
        status: "SENT",
        title: `🎉 Membership Activated: ${approvedRequest.requestedPlan} Plan`,
        body: `Your payment of Rs ${approvedRequest.amountPKR} has been verified and your ${approvedRequest.requestedPlan} membership is now active until ${formattedExpiry}!`,
        metadata: JSON.stringify({
          plan: approvedRequest.requestedPlan,
          amountPKR: approvedRequest.amountPKR,
          expiresAt: nextMonth.toISOString(),
          paymentRequestId: approvedRequest.id,
        }),
      },
    });

    // 2. Also log approval notification for admin
    await db.notification.create({
      data: {
        userId: admin.id,
        type: "PLAN_UPGRADED",
        channel: "IN_APP",
        status: "READ",
        title: `✅ Plan Activated: ${approvedRequest.userName}`,
        body: `You approved ${approvedRequest.requestedPlan} membership for ${approvedRequest.userEmail} (TxID: ${approvedRequest.transactionId}).`,
        metadata: JSON.stringify({
          plan: approvedRequest.requestedPlan,
          amountPKR: approvedRequest.amountPKR,
          paymentRequestId: approvedRequest.id,
        }),
      },
    });

    // 3. Enqueue external channels (Email / WhatsApp) and process queue
    await enqueueNotificationJob(
      approvedRequest.userId,
      "PLAN_UPGRADED_SUCCESS",
      {
        userId: approvedRequest.userId,
        type: "PLAN_UPGRADED",
        title: `🎉 Membership Activated: ${approvedRequest.requestedPlan} Plan`,
        body: `Your payment of Rs ${approvedRequest.amountPKR} has been verified and your ${approvedRequest.requestedPlan} membership is now active until ${formattedExpiry}!`,
        metadata: {
          plan: approvedRequest.requestedPlan,
          amountPKR: approvedRequest.amountPKR,
          expiresAt: nextMonth.toISOString(),
        },
      },
      `PLAN_ACTIVE:${approvedRequest.id}`
    );

    await processNotificationQueue(5).catch(() => {});

    // 4. Force synchronous cloud save so Supabase has the active state instantly
    await resilientStore.syncToCloud(true);

    return NextResponse.json({
      success: true,
      request: sanitizePrisma(approvedRequest),
      message: `Plan upgrade for ${approvedRequest.userName} (${approvedRequest.requestedPlan}) approved and activated until ${formattedExpiry}!`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Approval failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
