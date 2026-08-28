import { createServerSupabaseClient } from "./server";
import { createSupabaseAdminClient } from "./admin";
import { stripExifMetadata, validateImageUpload } from "../image";
import crypto from "crypto";

export type StorageBucket = "pet-photos" | "finder-uploads" | "medical-records";

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Uploads an image Buffer to Supabase Storage with EXIF GPS metadata stripping.
 */
export async function uploadToSupabaseStorage(
  fileBuffer: Buffer,
  mimeType: string,
  bucket: StorageBucket = "pet-photos",
  isPublic = true
): Promise<UploadResult> {
  // 1. Validate file format and size
  const validation = validateImageUpload(mimeType, fileBuffer.length);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // 2. Strip EXIF GPS / camera metadata
  const sanitizedBuffer = stripExifMetadata(fileBuffer);

  // 3. Generate high-entropy randomized filename
  const extension = mimeType.split("/")[1] || "jpg";
  const fileHash = crypto.randomBytes(16).toString("hex");
  const fileName = `${Date.now()}_${fileHash}.${extension}`;
  const filePath = `${bucket}/${fileName}`;

  // 4. Check Supabase client
  const supabase = createSupabaseAdminClient() || createServerSupabaseClient();

  if (!supabase) {
    // Fallback in local development without Supabase credentials: return deterministic simulated data URL
    const base64 = sanitizedBuffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;
    return {
      success: true,
      url: dataUrl,
      path: filePath,
    };
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, sanitizedBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    if (isPublic) {
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return {
        success: true,
        url: publicData.publicUrl,
        path: data.path,
      };
    } else {
      // Generate 1-hour signed URL for private documents
      const { data: signedData, error: signError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(data.path, 3600);

      if (signError) {
        return { success: false, error: signError.message };
      }

      return {
        success: true,
        url: signedData.signedUrl,
        path: data.path,
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Storage upload error";
    return { success: false, error: message };
  }
}
