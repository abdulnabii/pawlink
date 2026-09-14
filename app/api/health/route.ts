import { NextResponse } from "next/server";
import { rawPrisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus = "unknown";
  let dbError: string | null = null;
  let userCount: number | null = null;
  const dbUrlPresent = Boolean(process.env.DATABASE_URL);
  const dbUrlHost = process.env.DATABASE_URL ? process.env.DATABASE_URL.split("@")[1] : null;

  if (rawPrisma) {
    try {
      userCount = await rawPrisma.user.count();
      dbStatus = "connected";
    } catch (e: any) {
      dbStatus = "error";
      dbError = e?.message || "Unknown db error";
    }
  } else {
    dbStatus = "no_raw_prisma";
  }

  return NextResponse.json({
    status: "ok",
    dbStatus,
    dbError,
    userCount,
    dbUrlPresent,
    dbUrlHost,
    timestamp: new Date().toISOString(),
  });
}
