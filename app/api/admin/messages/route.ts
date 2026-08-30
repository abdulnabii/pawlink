import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin("messages");
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "";

    const conversations = await db.conversation.findMany({
      where: statusFilter ? { status: statusFilter } : {},
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ conversations: sanitizePrisma(conversations) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load messages";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin("messages", true);
    const body = await req.json().catch(() => ({}));
    const { conversationId, action, reason } = body;

    const conv = await db.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const newStatus = action === "BLOCK" ? "BLOCKED" : action === "CLOSE" ? "CLOSED" : "OPEN";

    const updated = await db.conversation.update({
      where: { id: conversationId },
      data: { status: newStatus },
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: `CONVERSATION_${action}`,
        entityType: "CONVERSATION",
        entityId: conversationId,
        metadata: JSON.stringify({
          adminEmail: admin.email,
          newStatus,
          reason: reason || "Moderation intervention",
        }),
      },
    });

    return NextResponse.json({ success: true, conversation: sanitizePrisma(updated) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to moderate conversation";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
