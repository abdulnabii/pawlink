import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";
import { PLANS } from "@/lib/plans";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const requestedPlan = (body.plan || "FREE").toUpperCase();

    const validPlan = PLANS.find((p) => p.id === requestedPlan);
    if (!validPlan) {
      return NextResponse.json(
        { error: "Invalid plan selected. Choose FREE, PLUS, or PRO." },
        { status: 400 }
      );
    }

    let existing = await db.subscription.findFirst({
      where: { userId: user.id },
    });

    let updatedSubscription;

    if (existing) {
      updatedSubscription = await db.subscription.update({
        where: { id: existing.id, userId: user.id },
        data: {
          plan: validPlan.id,
          status: "ACTIVE",
          currentPeriodEnd:
            validPlan.id === "FREE"
              ? null
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        },
      });
    } else {
      updatedSubscription = await db.subscription.create({
        data: {
          userId: user.id,
          plan: validPlan.id,
          status: "ACTIVE",
          currentPeriodEnd:
            validPlan.id === "FREE"
              ? null
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Log audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: `SUBSCRIPTION_CHANGED_TO_${validPlan.id}`,
        entityType: "Subscription",
        entityId: updatedSubscription.id,
        metadata: JSON.stringify({
          planName: validPlan.name,
          pricePKR: validPlan.pricePKR,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      subscription: sanitizePrisma(updatedSubscription),
      currentPlan: validPlan,
      message: `Your membership has been updated to ${validPlan.name}!`,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to update subscription plan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
