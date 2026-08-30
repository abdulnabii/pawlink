import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// ONE-TIME admin setup route. 
// SECURITY: Protected by a secret token that must be passed as a query param.
// After using it once, delete this file.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const SETUP_TOKEN = process.env.ADMIN_SETUP_TOKEN;

  if (!SETUP_TOKEN) {
    return NextResponse.json({ error: "ADMIN_SETUP_TOKEN env var not set" }, { status: 500 });
  }

  if (token !== SETUP_TOKEN) {
    return NextResponse.json({ error: "Invalid setup token" }, { status: 403 });
  }

  const email = "abdulnabi.khaskheli@gmail.com";
  const newPassword = req.nextUrl.searchParams.get("pass") || "PawLink@Admin2026!";

  try {
    const user = await db.user.findFirst({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
    }

    const hash = await bcrypt.hash(newPassword, 12);

    await db.user.update({
      where: { id: user.id },
      data: { role: "ADMIN", passwordHash: hash },
    });

    return NextResponse.json({
      success: true,
      message: `User ${email} has been promoted to ADMIN and password updated.`,
      loginAt: "https://pawlink-chi.vercel.app/auth/login",
      email,
      password: newPassword,
      warning: "DELETE this file immediately after use: app/api/admin/setup/route.ts",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}