import { NextResponse } from "next/server";
import { getSession, isAdminEmail } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await db.user.findUnique({
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

  if (user && isAdminEmail(user.email)) {
    user.role = "ADMIN";
  }

  return NextResponse.json({ user });
}

