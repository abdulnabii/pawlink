import { NextRequest, NextResponse } from "next/server";
import { ADMIN_2FA_COOKIE_NAME, ADMIN_2FA_CHALLENGE_COOKIE } from "@/lib/admin-2fa";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(_req: NextRequest) {
  const response = NextResponse.json({ success: true, message: "Admin console locked." });
  response.cookies.delete(ADMIN_2FA_COOKIE_NAME);
  response.cookies.delete(ADMIN_2FA_CHALLENGE_COOKIE);
  return response;
}
