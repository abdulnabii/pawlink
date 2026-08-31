import { NextResponse } from "next/server";
import { getSession, isAdminEmail } from "@/lib/auth";
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


