import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin("recovery");
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "";

    const cases = await db.recoveryCase.findMany({
      where: statusFilter ? { status: statusFilter } : {},
      include: {
        pet: {
          include: {
            user: { select: { id: true, name: true, phone: true, email: true } },
            tagAssignments: {
              where: { unassignedAt: null },
              include: { tag: true },
              take: 1,
            },
          },
        },
        recoveryEvents: { orderBy: { createdAt: "desc" } },
        scanEvents: { orderBy: { timestamp: "desc" }, take: 5 },
        locationEvents: { orderBy: { createdAt: "desc" }, take: 5 },
        conversations: {
          include: { messages: { take: 5, orderBy: { createdAt: "desc" } } },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({ cases: sanitizePrisma(cases) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load recovery cases";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
