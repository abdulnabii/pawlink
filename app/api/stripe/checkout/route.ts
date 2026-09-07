import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Stripe checkout stub — replace with real Stripe when keys are available
export async function POST(req: NextRequest) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pawlink-chi.vercel.app";

    if (!stripeSecret || stripeSecret === "sk_test_placeholder") {
      // Return a demo redirect for now
      return NextResponse.json({
        url: `${appUrl}/dashboard/settings?upgrade=pending`,
        message: "Stripe not configured. Add STRIPE_SECRET_KEY to env vars.",
      });
    }

    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Dynamic import stripe only when key exists
    const Stripe = (await import("stripe" as any)).default;
    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/settings?success=1`,
      cancel_url: `${appUrl}/dashboard/settings?canceled=1`,
      customer_email: session.email,
      metadata: { userId: session.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
