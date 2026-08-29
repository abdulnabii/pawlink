import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { LoginInputSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateCheck = checkRateLimit(`login:${ip}`, 30, 60 * 1000);
  if (!rateCheck.success) {
    return NextResponse.json({ error: "Too many login attempts. Please wait 60 seconds." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const validated = LoginInputSchema.parse(body);
    const email = validated.email.trim().toLowerCase();
    const password = validated.password;

    // 1. Primary: Direct Fast Database Authentication
    let user: any = await db.user.findFirst({
      where: { email },
      include: { notificationPreference: true },
    });

    if (user && user.passwordHash) {
      const isValid = await verifyPassword(password, user.passwordHash);
      if (isValid) {
        const sessionUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          authUserId: user.authUserId,
        };

        await setSessionCookie(sessionUser);

        return NextResponse.json({
          success: true,
          user: sessionUser,
        });
      }
    }

    // 2. Secondary Fallback: Supabase Auth SSR
    const supabase = createServerSupabaseClient();
    if (supabase) {
      try {
        const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!sbError && sbData?.user) {
          if (!user) {
            user = await db.user.findFirst({
              where: {
                OR: [{ authUserId: sbData.user.id }, { email }],
              },
            });
          }

          if (!user) {
            user = await db.user.create({
              data: {
                authUserId: sbData.user.id,
                email,
                name: sbData.user.user_metadata?.name || email.split("@")[0],
                role: "OWNER",
                notificationPreference: {
                  create: {
                    whatsappEnabled: true,
                    whatsappVerified: false,
                    emailEnabled: true,
                  },
                },
              },
            });
          }

          const sessionUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            authUserId: sbData.user.id,
          };

          await setSessionCookie(sessionUser);

          return NextResponse.json({ success: true, user: sessionUser });
        }
      } catch {}
    }

    // If user is not found or password doesn't match
    if (!user) {
      return NextResponse.json({ error: "No account found with this email. Please check your spelling or register." }, { status: 401 });
    }

    return NextResponse.json({ error: "Invalid password. Please check your credentials." }, { status: 401 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
