import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET() {
  try {
    await requireAdmin();

    const rawRequests = await db.paymentRequest.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const requests = rawRequests.map((r: any) => ({
      ...r,
      plan: r.requestedPlan,
      user: r.user || { name: r.userName, email: r.userEmail },
    }));

    const pendingCount = requests.filter((r: any) => r.status === "PENDING").length;
    const activeSubsCount = await db.subscription.count({
      where: { status: "ACTIVE", plan: { not: "FREE" } },
    });

    return NextResponse.json({
      requests: sanitizePrisma(requests),
      pendingCount,
      activeSubscriptionsCount: activeSubsCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Admin access forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
