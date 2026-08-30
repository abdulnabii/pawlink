import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET() {
  try {
    await requireAdmin("settings");
    const flags = await db.featureFlag.findMany();
    return NextResponse.json({ flags: sanitizePrisma(flags) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load settings";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Only SUPER_ADMIN can modify feature flags and system settings
    const admin = await requireAdmin("settings", true);
    if (admin.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN: Only SUPER_ADMIN can modify system settings" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { flagKey, enabled } = body;

    const updated = await db.featureFlag.update({
      where: { key: flagKey },
      data: { enabled },
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: "FEATURE_FLAG_TOGGLED",
        entityType: "FEATURE_FLAG",
        entityId: flagKey,
        metadata: JSON.stringify({ adminEmail: admin.email, enabled }),
      },
    });

    return NextResponse.json({ success: true, flag: sanitizePrisma(updated) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update settings";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
