import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin("support");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";

    const tickets = await db.supportTicket.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tickets: sanitizePrisma(tickets) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load support tickets";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin("support", true);
    const body = await req.json().catch(() => ({}));
    const { ticketId, status, response } = body;

    const updated = await db.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: status || "RESOLVED",
        response: response || null,
        assignedTo: admin.name || admin.email,
      },
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: "SUPPORT_TICKET_UPDATED",
        entityType: "SUPPORT_TICKET",
        entityId: ticketId,
        metadata: JSON.stringify({ adminEmail: admin.email, newStatus: status, response }),
      },
    });

    return NextResponse.json({ success: true, ticket: sanitizePrisma(updated) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update support ticket";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
