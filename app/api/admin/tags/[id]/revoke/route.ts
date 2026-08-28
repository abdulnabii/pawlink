import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "Revoked by Administrator";

    const tag = await db.tag.findFirst({
      where: {
        OR: [{ id: params.id }, { tagCode: params.id }],
      },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const updated = await db.tag.update({
      where: { id: tag.id },
      data: { status: "REVOKED" },
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: "TAG_REVOKED",
        entityType: "TAG",
        entityId: tag.id,
        metadata: JSON.stringify({ tagCode: tag.tagCode, reason }),
      },
    });

    return NextResponse.json({ success: true, tag: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to revoke tag";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
