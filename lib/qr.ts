import QRCode from "qrcode";

export interface TagBadgeData {
  tagCode: string;
  petName: string;
  species: string;
  qrDataUrl: string;
  appUrl: string;
}

/**
 * Returns the public recovery URL for a tag code
 */
export function getTagRecoveryUrl(tagCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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
