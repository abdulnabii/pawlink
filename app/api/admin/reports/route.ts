import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin("reports");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const reports = await db.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reports: sanitizePrisma(reports) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load reports";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin("reports", true);
    const body = await req.json().catch(() => ({}));
    const { reportId, status, actionTaken, notes } = body;

    const updated = await db.report.update({
      where: { id: reportId },
      data: {
        status: status || "ACTION_TAKEN",
        actionTaken: actionTaken || null,
        notes: notes || null,
        resolvedBy: admin.email,
        resolvedAt: new Date(),
      },
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: "REPORT_MODERATION_ACTION",
        entityType: "REPORT",
        entityId: reportId,
        metadata: JSON.stringify({
          adminEmail: admin.email,
          newStatus: status,
          actionTaken,
          notes,
        }),
      },
    });

    return NextResponse.json({ success: true, report: sanitizePrisma(updated) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to resolve report";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
