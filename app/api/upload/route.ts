import { NextRequest, NextResponse } from "next/server";
import { uploadToSupabaseStorage, StorageBucket } from "@/lib/supabase/storage";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Must be a logged-in user
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateCheck = checkRateLimit(`upload:${ip}`, 10, 60 * 1000);
  if (!rateCheck.success) {
    return NextResponse.json({ error: "Upload rate limit exceeded. Please wait a moment." }, { status: 429 });
  }


  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as StorageBucket) || "pet-photos";
    const isPublic = formData.get("isPublic") !== "false";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadToSupabaseStorage(buffer, file.type, bucket, isPublic);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Upload failed" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "File upload processing error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
