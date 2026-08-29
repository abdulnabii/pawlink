import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: "v2.0-clean",
    timestamp: new Date().toISOString(),
  });
}
