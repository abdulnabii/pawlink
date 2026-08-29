import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { resilientStore } from "@/lib/store";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET() {
  try {
    await requireAdmin();

    const requests = await resilientStore.getAllPaymentRequests();
    const pendingRequests = await resilientStore.getPendingPaymentRequests();
    const subscriptions = await resilientStore.findSubscriptions();

    return NextResponse.json({
      requests: sanitizePrisma(requests),
      pendingCount: pendingRequests.length,
      activeSubscriptionsCount: subscriptions.filter((s) => s.status === "ACTIVE" && s.plan !== "FREE").length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Admin access forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
