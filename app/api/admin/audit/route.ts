import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin("audit");
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get("pageSize") || "25", 10)));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (entityType) where.entityType = entityType;

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        take: pageSize,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs: sanitizePrisma(logs),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load audit logs";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
