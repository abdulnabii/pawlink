import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdminEmail } from "@/lib/auth";
import { hasAdmin2faSession } from "@/lib/admin-2fa";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        isAdmin: false,
        is2faVerified: false,
      });
    }

    const isAdmin = isAdminEmail(session.email) || ["SUPER_ADMIN", "ADMIN"].includes(session.role);
    const is2fa = await hasAdmin2faSession(session.email);

    return NextResponse.json({
      authenticated: true,
      email: session.email,
      role: session.role,
      isAdmin,
      is2faVerified: is2fa,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to check 2FA status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
