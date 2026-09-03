import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAdminEmail } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin("users");
    const user = await db.user.findUnique({
      where: { id: params.id },
      include: {
        pets: {
          include: {
            tagAssignments: {
              where: { unassignedAt: null },
              include: { tag: true },
            },
            recoveryCases: {
              where: { status: "OPEN" },
            },
          },
        },
        subscriptions: true,
        notificationPreference: true,
        auditLogs: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: sanitizePrisma(user) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load user";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin("users", true);
    const body = await req.json().catch(() => ({}));
    const { role, plan, action, reason } = body;

    const targetUser = await db.user.findUnique({ where: { id: params.id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAuthorizedAdmin = admin.role === "SUPER_ADMIN" || admin.role === "ADMIN" || (admin.email && isAdminEmail(admin.email));
    if (role && role !== targetUser.role && !isAuthorizedAdmin) {
      return NextResponse.json({ error: "FORBIDDEN: Only administrators can change roles" }, { status: 403 });
    }

    const updates: any = {};
    if (role) updates.role = role;

    let updatedUser = targetUser;
    if (Object.keys(updates).length > 0) {
      updatedUser = await db.user.update({
        where: { id: params.id },
        data: updates,
      });
    }

    if (plan) {
      const existingSub = await db.subscription.findFirst({
        where: { userId: params.id },
      });
      if (existingSub) {
        await db.subscription.update({
          where: { id: existingSub.id },
          data: { plan, status: "ACTIVE" },
        });
      } else {
        await db.subscription.create({
          data: { userId: params.id, plan, status: "ACTIVE" },
        });
      }
    }

    const { resilientStore } = await import("@/lib/store");
    await resilientStore.syncToCloud(true);

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: action || (role ? "USER_ROLE_CHANGED" : plan ? "USER_PLAN_CHANGED" : "USER_UPDATED"),
        entityType: "USER",
        entityId: params.id,
        metadata: JSON.stringify({
          adminEmail: admin.email,
          previousRole: targetUser.role,
          newRole: role || targetUser.role,
          planUpdated: plan || null,
          reason: reason || "Admin manual modification",
        }),
      },
    });

    return NextResponse.json({ success: true, user: sanitizePrisma(updatedUser) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update user";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
