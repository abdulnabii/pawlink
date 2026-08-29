import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";
import { PLANS } from "@/lib/plans";

export async function GET() {
  try {
    const user = await requireAuth();

    let subscription = await db.subscription.findFirst({
      where: { userId: user.id },
    });

    if (!subscription) {
      subscription = await db.subscription.create({
        data: {
          userId: user.id,
          plan: "FREE",
          status: "ACTIVE",
        },
      });
    }

    const currentPlanDetails =
      PLANS.find((p) => p.id === subscription.plan) || PLANS[0];

    return NextResponse.json({
      subscription: sanitizePrisma(subscription),
      currentPlan: currentPlanDetails,
      plans: PLANS,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load subscription";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
