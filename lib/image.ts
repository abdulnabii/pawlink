/**
 * Image security and validation helper.
 * Strips EXIF metadata (especially GPS metadata) and validates MIME types and file sizes.
 */

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  sanitizedMimeType?: string;
}

export function validateImageUpload(
  mimeType: string,
  sizeInBytes: number
): ImageValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported image format. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
    };
  }

  if (sizeInBytes > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 5MB limit. (Got ${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB)`,
    };
  }

  return {
    valid: true,
    sanitizedMimeType: mimeType.toLowerCase(),
  };
}

/**
 * Strips EXIF/GPS metadata from a raw image Buffer.
 * For JPEG, removes APP1 (Exif) markers (0xFFE1) to protect finder/owner privacy.
 */
export function stripExifMetadata(buffer: Buffer): Buffer {
  if (buffer.length < 4) return buffer;

  // Check if buffer is JPEG (Starts with 0xFFD8)
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    const cleanChunks: Buffer[] = [Buffer.from([0xff, 0xd8])];
    let offset = 2;

    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        // Not a valid marker, copy remainder and exit
        cleanChunks.push(buffer.subarray(offset));
        break;
      }

      const marker = buffer[offset + 1];
      if (marker === 0xda) {
        // Start of Scan (SOS) - copy all remaining image data
        cleanChunks.push(buffer.subarray(offset));
        break;
      }

      // Check marker length
      if (offset + 3 >= buffer.length) {
        cleanChunks.push(buffer.subarray(offset));
        break;
      }

      const length = buffer.readUInt16BE(offset + 2);
      const nextOffset = offset + 2 + length;

      // APP1 Marker (0xE1) contains EXIF metadata - omit it!
      if (marker === 0xe1) {
        offset = nextOffset;
        continue;
      }

      // Keep all other markers (APP0/JFIF, DQT, DHT, SOF, etc.)
      cleanChunks.push(buffer.subarray(offset, Math.min(nextOffset, buffer.length)));
      offset = nextOffset;
    }

    return Buffer.concat(cleanChunks);
  }

  // Non-JPEG or already stripped
  return buffer;
}
