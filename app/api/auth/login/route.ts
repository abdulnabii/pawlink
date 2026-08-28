import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { LoginInputSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateCheck = checkRateLimit(`login:${ip}`, 15, 60 * 1000);
  if (!rateCheck.success) {
    return NextResponse.json({ error: "Too many login attempts. Please wait 60 seconds." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const validated = LoginInputSchema.parse(body);
    const email = validated.email.toLowerCase();

    // 1. If Supabase is configured, attempt Supabase Auth sign-in
    const supabase = createServerSupabaseClient();
    if (supabase) {
      const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
        email,
        password: validated.password,
      });

      if (!sbError && sbData.user) {
        // Sync with PawLink application user
        let user = await db.user.findFirst({
          where: {
            OR: [{ authUserId: sbData.user.id }, { email }],
          },
        });

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
        } else if (!user.authUserId) {
          user = await db.user.update({
            where: { id: user.id },
            data: { authUserId: sbData.user.id },
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
    }

    // 2. Fallback to PawLink Database Verification
    const user = await db.user.findUnique({
      where: { email },
      include: { notificationPreference: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isValid = await verifyPassword(validated.password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
