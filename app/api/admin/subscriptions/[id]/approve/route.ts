import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { resilientStore } from "@/lib/store";
import { sanitizePrisma } from "@/lib/sanitize";
import { enqueueNotificationJob } from "@/lib/queue/worker";

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

    // Send confirmation alert to user
    await enqueueNotificationJob(
      approvedRequest.userId,
      "PLAN_UPGRADED_SUCCESS",
      {
        userId: approvedRequest.userId,
        type: "PLAN_UPGRADED",
        title: `🎉 Membership Activated: ${approvedRequest.requestedPlan} Plan`,
        body: `Your payment of Rs ${approvedRequest.amountPKR} has been verified and your ${approvedRequest.requestedPlan} membership is now active!`,
        metadata: {
          plan: approvedRequest.requestedPlan,
          amountPKR: approvedRequest.amountPKR,
        },
      },
      `PLAN_ACTIVE:${approvedRequest.id}`
    );

    return NextResponse.json({
      success: true,
      request: sanitizePrisma(approvedRequest),
      message: `Plan upgrade for ${approvedRequest.userName} (${approvedRequest.requestedPlan}) approved and activated!`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Approval failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
