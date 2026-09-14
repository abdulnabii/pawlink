import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdminEmail, signToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null, error: "UNAUTHORIZED" }, { status: 401 });
    }

    // 1. Try finding user by ID
    let user: any = await db.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        role: true,
        notificationPreference: true,
        subscriptions: {
          where: { status: "ACTIVE" },
          take: 1,
        },
      },
    });

    // 2. If not found by ID, try finding by email
    if (!user && session.email) {
      user = await db.user.findFirst({
        where: { email: session.email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatarUrl: true,
          role: true,
          notificationPreference: true,
          subscriptions: {
            where: { status: "ACTIVE" },
            take: 1,
          },
        },
      });
    }

    // 3. If user record is missing in DB, construct from verified session token
    if (!user) {
      user = {
        id: session.id,
        email: session.email,
        name: session.name || session.email.split("@")[0],
        phone: session.phone || null,
        avatarUrl: null,
        role: session.role || "OWNER",
        notificationPreference: {
          whatsappEnabled: true,
          whatsappVerified: Boolean(session.phone),
          emailEnabled: true,
          notificationPhone: session.phone || null,
        },
        subscriptions: [
          {
            plan: "FREE",
            status: "ACTIVE",
          },
        ],
      };
    } else {
      if (!user.notificationPreference) {
        user.notificationPreference = {
          whatsappEnabled: true,
          whatsappVerified: Boolean(user.phone),
          notificationPhone: user.phone || null,
          emailEnabled: true,
        };
      } else if (user.phone && user.notificationPreference.whatsappVerified !== false) {
        // If phone is set, ensure verified state is recognized consistently
        user.notificationPreference.whatsappVerified = true;
      }
    }

    if (user && isAdminEmail(user.email)) {
      user.role = "ADMIN";
    }

    return NextResponse.json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication resolution failed";
    return NextResponse.json({ user: null, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, phone, emailEnabled, whatsappEnabled, smsEnabled, pushEnabled } = body;

    const userUpdates: any = {};
    if (typeof name === "string" && name.trim()) {
      userUpdates.name = name.trim();
    }
    if (phone !== undefined) {
      const cleanPhone = phone ? phone.trim().replace(/[\s-()]/g, "") : null;
      userUpdates.phone = cleanPhone;
    }

    let updatedUser = session;
    if (Object.keys(userUpdates).length > 0) {
      try {
        updatedUser = await db.user.update({
          where: { id: session.id },
          data: userUpdates,
        });
      } catch {
        if (session.email) {
          updatedUser = await db.user.update({
            where: { email: session.email.toLowerCase() },
            data: userUpdates,
          });
        }
      }
    }

    const prefUpdates: any = {};
    if (typeof emailEnabled === "boolean") prefUpdates.emailEnabled = emailEnabled;
    if (typeof whatsappEnabled === "boolean") {
      prefUpdates.whatsappEnabled = whatsappEnabled;
      if (whatsappEnabled && userUpdates.phone) prefUpdates.whatsappVerified = true;
    }
    if (typeof smsEnabled === "boolean") prefUpdates.smsEnabled = smsEnabled;
    if (typeof pushEnabled === "boolean") prefUpdates.pushEnabled = pushEnabled;
    if (userUpdates.phone !== undefined) prefUpdates.notificationPhone = userUpdates.phone;

    if (Object.keys(prefUpdates).length > 0) {
      await db.notificationPreference.upsert({
        where: { userId: session.id },
        create: {
          userId: session.id,
          whatsappEnabled: true,
          whatsappVerified: Boolean(userUpdates.phone || session.phone),
          emailEnabled: true,
          ...prefUpdates,
        },
        update: prefUpdates,
      });
    }

    const refreshedToken = signToken({
      id: session.id,
      email: session.email,
      name: userUpdates.name || session.name,
      role: session.role,
      phone: userUpdates.phone !== undefined ? userUpdates.phone : session.phone,
      authUserId: session.authUserId,
    });

    const res = NextResponse.json({
      success: true,
      message: "Profile and settings updated successfully",
      user: {
        id: session.id,
        email: session.email,
        name: userUpdates.name || session.name,
        phone: userUpdates.phone !== undefined ? userUpdates.phone : session.phone,
        role: session.role,
      },
    });

    res.cookies.set(COOKIE_NAME, refreshedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


