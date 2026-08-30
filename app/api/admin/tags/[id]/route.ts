import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin("tags", true);
    const body = await req.json().catch(() => ({}));
    const { status, action, reason } = body;

    const tag = await db.tag.findUnique({ where: { id: params.id } });
    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const newStatus = status || (action === "REVOKE" ? "REVOKED" : action === "SUSPEND" ? "INACTIVE" : "ACTIVE");

    const updated = await db.tag.update({
      where: { id: params.id },
      data: { status: newStatus },
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: action ? `TAG_${action}` : "TAG_STATUS_UPDATED",
        entityType: "TAG",
        entityId: params.id,
        metadata: JSON.stringify({
          adminEmail: admin.email,
          tagCode: tag.tagCode,
          previousStatus: tag.status,
          newStatus,
          reason: reason || "Admin tag status modification",
        }),
      },
    });

    return NextResponse.json({ success: true, tag: sanitizePrisma(updated) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update tag";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
