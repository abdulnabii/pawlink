import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { resilientStore } from "@/lib/store";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";
import { PLANS, BANK_PAYMENT_CONFIG } from "@/lib/plans";
import { enqueueNotificationJob, processNotificationQueue } from "@/lib/queue/worker";

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

    // 1. Notify user in-app that payment proof was submitted
    await db.notification.create({
      data: {
        userId: user.id,
        type: "PAYMENT_SUBMITTED",
        channel: "IN_APP",
        status: "SENT",
        title: `📋 Payment Verification in Review`,
        body: `Your payment of Rs ${planConfig.pricePKR} (TxID: ${transactionId}) for ${planConfig.name} is received and pending admin approval.`,
        metadata: JSON.stringify({
          plan: planConfig.id,
          amountPKR: planConfig.pricePKR,
          transactionId,
          paymentRequestId: paymentRequest.id,
        }),
      },
    });

    // 2. Notify all Admin accounts in-app with valid admin userId
    const allUsers = await resilientStore.getAllUsersForAdmin();
    const adminUsers = allUsers.filter(
      (u: any) => u.role === "ADMIN" || u.role === "SUPER_ADMIN" || u.email === "abdulnabi.khaskheli@gmail.com"
    );

    for (const admin of adminUsers) {
      await db.notification.create({
        data: {
          userId: admin.id,
          type: "PAYMENT_VERIFICATION_REQUESTED",
          channel: "IN_APP",
          status: "SENT",
          title: `💳 New Payment Request: ${user.name || user.email} (${planConfig.name})`,
          body: `${user.name || user.email} submitted Rs ${planConfig.pricePKR} (TxID: ${transactionId}). Review & approve in Admin Portal.`,
          metadata: JSON.stringify({
            plan: planConfig.id,
            amountPKR: planConfig.pricePKR,
            transactionId,
            senderName,
            userEmail: user.email,
            paymentRequestId: paymentRequest.id,
          }),
        },
      });
    }

    await resilientStore.syncToCloud(true);

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
