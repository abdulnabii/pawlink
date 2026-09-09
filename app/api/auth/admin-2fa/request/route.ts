import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdminEmail, ADMIN_EMAILS } from "@/lib/auth";
import { generateAdminOtp, ADMIN_2FA_CHALLENGE_COOKIE, sendAdmin2faEmail } from "@/lib/admin-2fa";
import { checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    
    // Rate limit: 5 requests per 5 minutes per IP
    const rateCheck = checkRateLimit(`admin-2fa-req:${ip}`, 5, 5 * 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many security code requests. Please wait 5 minutes before trying again." },
        { status: 429 }
      );
    }

    let targetEmail: string | null = null;

    // 1. Try to read email from request body (e.g. from login page)
    try {
      const body = await req.json();
      if (body?.email && typeof body.email === "string") {
        targetEmail = body.email.trim().toLowerCase();
      }
    } catch {}

    // 2. If no email in body, check current authenticated session
    if (!targetEmail) {
      const session = await getSession();
      if (session?.email) {
        targetEmail = session.email.trim().toLowerCase();
      }
    }

    // Default to primary admin email if unspecified
    if (!targetEmail) {
      targetEmail = ADMIN_EMAILS[0];
    }

    // Verify target email is an admin
    const isAdmin = isAdminEmail(targetEmail);
    if (!isAdmin) {
      // Check database role if not in static ADMIN_EMAILS list
      const user = await db.user.findFirst({
        where: { email: targetEmail },
        select: { role: true },
      });

      if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
        return NextResponse.json(
          { error: "Access denied: This email address is not registered as an administrator." },
          { status: 403 }
        );
      }
    }

    // Generate cryptographic OTP and challenge token
    const { code, challengeToken, expiresAt } = generateAdminOtp(targetEmail);

    let supabaseEmailSent = false;
    let supabaseError: string | null = null;

    // 1. Dispatch real email via Supabase Auth to user's real email inbox
    try {
      const supabase = createServerSupabaseClient();
      if (supabase) {
        const { error: sbErr } = await supabase.auth.signInWithOtp({
          email: targetEmail,
        });
        if (!sbErr) {
          supabaseEmailSent = true;
          console.log(`[Supabase OTP Email] Real email dispatched to: ${targetEmail}`);
        } else {
          supabaseError = sbErr.message;
          console.warn(`[Supabase OTP Warning]:`, sbErr.message);
        }
      }
    } catch (sbEx: any) {
      supabaseError = sbEx?.message;
      console.warn(`[Supabase OTP Exception]:`, sbEx);
    }

    // 2. Also send via Resend if configured
    const emailResult = await sendAdmin2faEmail(targetEmail, code);

    // Also record in-app notification for admin
    try {
      const adminUser = await db.user.findFirst({ where: { email: targetEmail } });
      if (adminUser) {
        await db.notification.create({
          data: {
            userId: adminUser.id,
            type: "ADMIN_2FA_ALERT",
            title: `Admin 2FA Security Code: ${code}`,
            body: `Your 6-digit one-time code is ${code}. Valid for 10 minutes.`,
            channel: "IN_APP",
            status: "SENT",
          },
        });
      }
    } catch {}

    // Mask email for display: e.g. a***i@gmail.com
    const [local, domain] = targetEmail.split("@");
    const maskedEmail = local.length > 2
      ? `${local[0]}***${local[local.length - 1]}@${domain}`
      : `${local[0]}***@${domain}`;

    const deliveredReal = supabaseEmailSent || Boolean(emailResult.deliveredRealEmail);

    const response = NextResponse.json({
      success: true,
      emailDelivered: deliveredReal,
      message: deliveredReal
        ? `Security OTP code has been dispatched to ${targetEmail}. Please check your email inbox and enter the 6-digit code.`
        : (supabaseError
          ? `Email delivery rate limit reached (${supabaseError}). Please wait 60 seconds before requesting again.`
          : `Security code has been dispatched to ${targetEmail}. Please check your email inbox and spam folder.`),
      email: targetEmail,
      maskedEmail,
      expiresAt,
    });

    // Store challengeToken in HTTP-only cookie for secure, stateless multi-container verification
    response.cookies.set(ADMIN_2FA_CHALLENGE_COOKIE, challengeToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60, // 10 minutes
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate security code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
