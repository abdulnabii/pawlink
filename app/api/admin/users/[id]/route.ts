import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAdminEmail } from "@/lib/auth";
import { db, rawPrisma } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";
import { resilientStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin("users");
    const user = await (rawPrisma
      ? rawPrisma.user.findUnique({
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
            subscriptions: {
              orderBy: { createdAt: "desc" },
            },
            notificationPreference: true,
            auditLogs: {
              take: 20,
              orderBy: { createdAt: "desc" },
            },
          },
        })
      : db.user.findUnique({
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
        }));

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

    const targetUser = await (rawPrisma
      ? rawPrisma.user.findUnique({ where: { id: params.id } })
      : db.user.findUnique({ where: { id: params.id } }));

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const adminRoleUpper = (admin.role || "").toUpperCase();
    const isAuthorizedAdmin =
      adminRoleUpper === "SUPER_ADMIN" ||
      adminRoleUpper === "ADMIN" ||
      isAdminEmail(admin.email);
    if (role && role !== targetUser.role && !isAuthorizedAdmin) {
      return NextResponse.json({ error: "FORBIDDEN: Only administrators can change roles" }, { status: 403 });
    }

    const updates: any = {};
    if (role) updates.role = role;

    let updatedUser = targetUser;
    if (Object.keys(updates).length > 0) {
      if (rawPrisma) {
        updatedUser = await rawPrisma.user.update({
          where: { id: params.id },
          data: updates,
        });
      } else {
        updatedUser = await db.user.update({
          where: { id: params.id },
          data: updates,
        });
      }
      await resilientStore.updateUser({ where: { id: params.id }, data: updates });

      // If the admin is updating their own role, refresh session cookie so new role is active
      if (admin.id === params.id && role) {
        try {
          const { setSessionCookie } = await import("@/lib/auth");
          await setSessionCookie({
            ...admin,
            role,
          });
        } catch (cookieErr) {
          console.warn("[Admin PATCH setSessionCookie error (ignored)]:", cookieErr);
        }
      }
    }

    if (plan) {
      if (rawPrisma) {
        const existingSub = await rawPrisma.subscription.findFirst({
          where: { userId: params.id },
          orderBy: { createdAt: "desc" },
        });
        if (existingSub) {
          await rawPrisma.subscription.update({
            where: { id: existingSub.id },
            data: { plan, status: "ACTIVE" },
          });
        } else {
          await rawPrisma.subscription.create({
            data: { userId: params.id, plan, status: "ACTIVE" },
          });
        }
      } else {
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

      // Sync resilientStore in-memory subscription
      const storeSub = await resilientStore.getUserSubscription(params.id);
      if (storeSub) {
        storeSub.plan = plan;
        storeSub.status = "ACTIVE";
      }
    }

    await resilientStore.syncToCloud(true);

    try {
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
    } catch (auditErr) {
      console.warn("[Admin PATCH user auditLog error (ignored)]:", auditErr);
    }

    // Always fetch fresh user with latest active subscription
    const finalUser = await (rawPrisma
      ? rawPrisma.user.findUnique({
          where: { id: params.id },
          include: {
            subscriptions: {
              where: { status: "ACTIVE" },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        })
      : db.user.findUnique({
          where: { id: params.id },
          include: {
            subscriptions: {
              where: { status: "ACTIVE" },
              take: 1,
            },
          },
        }));

    return NextResponse.json(
      { success: true, user: sanitizePrisma(finalUser || updatedUser) },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update user";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
