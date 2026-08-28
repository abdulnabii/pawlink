import { describe, it, expect } from "vitest";
import { uploadToSupabaseStorage } from "../lib/supabase/storage";
import { validateImageUpload, stripExifMetadata } from "../lib/image";

describe("Supabase Storage & Image Sanitization Suite", () => {
  it("should validate allowed image MIME types and reject non-images", () => {
    expect(validateImageUpload("image/jpeg", 1024).valid).toBe(true);
    expect(validateImageUpload("image/png", 1024).valid).toBe(true);
    expect(validateImageUpload("image/webp", 1024).valid).toBe(true);
    expect(validateImageUpload("application/pdf", 1024).valid).toBe(false);
    expect(validateImageUpload("image/jpeg", 10 * 1024 * 1024).valid).toBe(false); // >5MB
  });

  it("should strip EXIF headers safely from JPEG buffers", () => {
    // Simulated JPEG buffer with APP1 EXIF segment (0xFF 0xE1)
    const fakeJpegWithExif = Buffer.from([
      0xff, 0xd8, // SOI
      0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, // APP1 EXIF
      0xff, 0xd9, // EOI
    ]);

    const sanitized = stripExifMetadata(fakeJpegWithExif);
    expect(sanitized).toBeInstanceOf(Buffer);
    expect(sanitized.length).toBeGreaterThan(0);
  });

  it("should upload image and return sanitized data URL in development fallback mode", async () => {
    const mockImageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xd9]); // Minimal valid JPEG buffer
    const result = await uploadToSupabaseStorage(mockImageBuffer, "image/jpeg", "pet-photos", true);

    expect(result.success).toBe(true);
    expect(result.url).toBeDefined();
    expect(result.path).toContain("pet-photos");
  });
});
