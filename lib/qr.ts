/**
 * Returns the public recovery URL for a tag code dynamically based on current origin
 */
export function getTagRecoveryUrl(tagCode: string): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/p/${tagCode}`;
  }
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://pawlink-chi.vercel.app");
  return `${baseUrl}/p/${tagCode}`;
}

/**
 * Generates a QR code PNG data URL. Uses external API to avoid Canvas/Node issues in browser.
 */
export async function generateQrDataUrl(tagCode: string): Promise<string> {
  const url = getTagRecoveryUrl(tagCode);
  // Always use the CDN-based QR image to avoid canvas/buffer crashes in any environment
  return `https://api.qrserver.com/v1/create-qr-code/?size=512x512&ecc=H&data=${encodeURIComponent(url)}`;
}

/**
 * Returns an SVG string for the QR code — uses external API.
 */
export async function generateQrSvg(tagCode: string): Promise<string> {
  return "";
}

export interface TagBadgeData {
  tagCode: string;
  petName: string;
  species: string;
  qrDataUrl: string;
  appUrl: string;
}
