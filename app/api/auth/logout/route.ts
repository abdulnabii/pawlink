import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
