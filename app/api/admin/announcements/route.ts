import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET() {
  try {
    await requireAdmin("announcements");
    const announcements = await db.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ announcements: sanitizePrisma(announcements) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load announcements";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin("announcements", true);
    const body = await req.json().catch(() => ({}));
    const { title, message, audience = "ALL", status = "ACTIVE" } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const ann = await db.announcement.create({
      data: {
        title,
        message,
        audience,
        status,
      },
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: "ANNOUNCEMENT_CREATED",
        entityType: "ANNOUNCEMENT",
        entityId: ann.id,
        metadata: JSON.stringify({ adminEmail: admin.email, title, audience }),
      },
    });

    return NextResponse.json({ success: true, announcement: sanitizePrisma(ann) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create announcement";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
