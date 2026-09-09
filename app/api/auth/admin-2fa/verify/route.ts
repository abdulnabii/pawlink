import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminOtp,
  ADMIN_2FA_CHALLENGE_COOKIE,
  ADMIN_2FA_COOKIE_NAME,
  signAdmin2faSession,
} from "@/lib/admin-2fa";
import { getSession, isAdminEmail, setSessionCookie, ADMIN_EMAILS } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = checkRateLimit(`admin-2fa-verify:${ip}`, 10, 5 * 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait 5 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { code, email: bodyEmail, challengeToken: bodyToken } = body;

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json(
        { error: "Please provide a valid 6-digit security code." },
        { status: 400 }
      );
    }

    // Resolve challenge token from cookie or body
    const challengeToken =
      req.cookies.get(ADMIN_2FA_CHALLENGE_COOKIE)?.value || bodyToken;

    if (!challengeToken) {
      return NextResponse.json(
        { error: "No active security challenge found. Please click 'Get Code' to receive a new code." },
        { status: 400 }
      );
    }

    // Resolve target email
    let targetEmail = bodyEmail ? bodyEmail.trim().toLowerCase() : null;
    if (!targetEmail) {
      const session = await getSession();
      if (session?.email) {
        targetEmail = session.email.trim().toLowerCase();
      }
    }
    if (!targetEmail) {
      targetEmail = ADMIN_EMAILS[0];
    }

    // Verify OTP
    const verification = verifyAdminOtp(challengeToken, targetEmail, code.trim());
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || "Invalid security code." },
        { status: 401 }
      );
    }

    const verifiedEmail = verification.email || targetEmail;

    // Check admin rights
    const isAdmin = isAdminEmail(verifiedEmail);
    let user = await db.user.findFirst({
      where: { email: verifiedEmail },
    });

    if (!user) {
      if (isAdmin) {
        user = await db.user.create({
          data: {
            email: verifiedEmail,
            name: "Super Administrator",
            role: "SUPER_ADMIN",
          },
        });
      } else {
        return NextResponse.json(
          { error: "User record not found." },
          { status: 404 }
        );
      }
    }

    // Prepare response
    const response = NextResponse.json({
      success: true,
      message: "Administrator 2FA verified successfully.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: isAdmin ? "SUPER_ADMIN" : user.role,
      },
      redirect: "/admin",
    });

    // 1. Set 2FA Verified Cookie (24 hours)
    const admin2faToken = signAdmin2faSession(verifiedEmail);
    response.cookies.set(ADMIN_2FA_COOKIE_NAME, admin2faToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // 2. Also set main PawLink session cookie if not already set or refreshing
    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: isAdmin ? "SUPER_ADMIN" : user.role,
      phone: user.phone,
      authUserId: user.authUserId,
    });

    // 3. Clear challenge cookie
    response.cookies.delete(ADMIN_2FA_CHALLENGE_COOKIE);

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
