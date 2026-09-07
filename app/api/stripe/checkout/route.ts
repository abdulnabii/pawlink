import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Stripe Checkout — graceful stub when Stripe is not installed.
 * To enable real payments:
 *   1. Run: npm install stripe
 *   2. Add STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID to Vercel env vars
 *   3. Set STRIPE_WEBHOOK_SECRET after creating the webhook in Stripe dashboard
 */
export async function POST(req: NextRequest) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pawlink-chi.vercel.app";

    // If Stripe is not configured, return a friendly message
    if (!stripeSecret || stripeSecret === "sk_test_placeholder") {
      return NextResponse.json({
        url: `${appUrl}/dashboard/settings?upgrade=pending`,
        message: "Stripe not configured. Add STRIPE_SECRET_KEY to Vercel env vars.",
      });
    }

    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Attempt to load stripe dynamically — bypasses TS type checker if package not installed
    let stripe: any;
    try {
      const dynamicImport = new Function("modulePath", "return import(modulePath)");
      const StripeLib = await dynamicImport("stripe");
      stripe = new (StripeLib.default || StripeLib)(stripeSecret, {
        apiVersion: "2024-06-20",
      });
    } catch {
      return NextResponse.json({
        error: "Stripe package not installed. Run: npm install stripe",
      }, { status: 503 });
    }

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
