import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { RegisterInputSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateCheck = checkRateLimit(`register:${ip}`, 10, 60 * 1000);
  if (!rateCheck.success) {
    return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const validated = RegisterInputSchema.parse(body);

    const existing = await db.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    let authUserId: string | null = null;

    // 1. If Supabase is configured, create Supabase Auth User
    const supabase = createServerSupabaseClient();
    if (supabase) {
      const { data: sbData, error: sbError } = await supabase.auth.signUp({
        email: validated.email.toLowerCase(),
        password: validated.password,
        options: {
          data: {
            name: validated.name,
            phone: validated.phone || null,
          },
        },
      });

      if (sbError) {
        console.warn("Supabase auth notice:", sbError.message);
      } else if (sbData?.user) {
        authUserId = sbData.user.id;
      }
    }

    const passwordHash = await hashPassword(validated.password);

    // 2. Create PawLink application User
    const user = await db.user.create({
      data: {
        authUserId,
        name: validated.name,
        email: validated.email.toLowerCase(),
        passwordHash,
        phone: validated.phone || null,
        notificationPreference: {
          create: {
            whatsappEnabled: true,
            whatsappVerified: false,
            emailEnabled: true,
            pushEnabled: true,
            notificationPhone: validated.phone || null,
          },
        },
      },
      select: {
        id: true,
        authUserId: true,
        name: true,
        email: true,
        role: true,
        phone: true,
      },
    });

    // 3. Create initial Subscription
    const selectedPlan = (body.plan || "FREE").toUpperCase();
    const validPlan = ["FREE", "PLUS", "PRO"].includes(selectedPlan) ? selectedPlan : "FREE";

    await db.subscription.create({
      data: {
        userId: user.id,
        plan: validPlan,
        status: "ACTIVE",
        currentPeriodEnd: validPlan === "FREE" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await setSessionCookie(user);

    return NextResponse.json({ success: true, user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
