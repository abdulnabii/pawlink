import QRCode from "qrcode";

export interface TagBadgeData {
  tagCode: string;
  petName: string;
  species: string;
  qrDataUrl: string;
  appUrl: string;
}

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
 * Generates an SVG string representation of the QR code
 */
export async function generateQrSvg(tagCode: string): Promise<string> {
  const url = getTagRecoveryUrl(tagCode);
  return QRCode.toString(url, {
    type: "svg",
    margin: 1,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H", // High error correction for durable collar tags
  });
}

/**
 * Generates a PNG Data URL of the QR code
 */
export async function generateQrDataUrl(tagCode: string): Promise<string> {
  const url = getTagRecoveryUrl(tagCode);
  return QRCode.toDataURL(url, {
    margin: 1,
    width: 512,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  });
}
