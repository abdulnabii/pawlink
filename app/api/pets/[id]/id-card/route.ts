import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Returns HTML for a printable pet ID card
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { db } = await import("@/lib/db");
    const pet = await db.pet.findUnique({
      where: { id: params.id },
      include: {
        tagAssignments: {
          where: { unassignedAt: null },
          include: { tag: true },
          take: 1,
        },
        medicalRecords: {
          where: { isPublicAlert: true },
          take: 3,
        },
        user: { select: { name: true, phone: true } },
      },
    });

    if (!pet || pet.userId !== session.id) {
      return new NextResponse("Pet not found", { status: 404 });
    }

    const tagCode = pet.tagAssignments[0]?.tag?.tagCode;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pawlink-chi.vercel.app";
    const scanUrl = tagCode ? `${appUrl}/p/${tagCode}` : appUrl;
    const qrUrl = tagCode
      ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(scanUrl)}&color=0d9488`
      : null;

    const alerts = pet.medicalRecords.map((r) => r.title).join(", ");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${pet.name} — PawLink ID Card</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
  .card { background: white; border-radius: 24px; box-shadow: 0 8px 40px rgba(0,0,0,0.12); width: 380px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #0d9488, #0f766e); color: white; padding: 24px; display: flex; align-items: center; gap: 16px; }
  .pet-photo { width: 72px; height: 72px; border-radius: 16px; object-fit: cover; border: 3px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 32px; }
  .pet-name { font-size: 24px; font-weight: 900; }
  .pet-breed { font-size: 13px; opacity: 0.8; margin-top: 4px; }
  .pawlink-logo { font-size: 11px; opacity: 0.7; margin-top: 6px; letter-spacing: 0.1em; text-transform: uppercase; }
  .body { padding: 20px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .info-item { background: #f8fafc; border-radius: 12px; padding: 10px 12px; }
  .info-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
  .info-value { font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 2px; }
  .alert-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 10px 12px; margin-bottom: 16px; }
  .alert-label { font-size: 10px; font-weight: 700; color: #92400e; text-transform: uppercase; }
  .alert-value { font-size: 12px; color: #78350f; margin-top: 2px; }
  .qr-section { display: flex; align-items: center; gap: 16px; background: #f0fdf4; border-radius: 16px; padding: 16px; }
  .qr-img { width: 90px; height: 90px; border-radius: 8px; }
  .qr-text h4 { font-size: 12px; font-weight: 800; color: #166534; }
  .qr-text p { font-size: 10px; color: #16a34a; margin-top: 4px; line-height: 1.5; }
  .footer { background: #0f172a; color: #64748b; padding: 12px 20px; text-align: center; font-size: 10px; }
  @media print {
    body { background: white; padding: 0; }
    .card { box-shadow: none; border-radius: 0; width: 100%; }
    .print-btn { display: none; }
  }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="pet-photo">${pet.photoUrl ? `<img src="${pet.photoUrl}" style="width:72px;height:72px;border-radius:13px;object-fit:cover;" />` : "🐾"}</div>
    <div>
      <div class="pet-name">${pet.name}</div>
      <div class="pet-breed">${[pet.species, pet.breed].filter(Boolean).join(" · ")}</div>
      <div class="pawlink-logo">🐾 PawLink Smart Recovery</div>
    </div>
  </div>
  <div class="body">
    <div class="info-grid">
      ${pet.gender ? `<div class="info-item"><div class="info-label">Gender</div><div class="info-value">${pet.gender}</div></div>` : ""}
      ${pet.color ? `<div class="info-item"><div class="info-label">Color</div><div class="info-value">${pet.color}</div></div>` : ""}
      ${pet.weight ? `<div class="info-item"><div class="info-label">Weight</div><div class="info-value">${pet.weight} kg</div></div>` : ""}
      ${pet.microchipNumber ? `<div class="info-item"><div class="info-label">Microchip</div><div class="info-value" style="font-size:11px">${pet.microchipNumber}</div></div>` : ""}
      ${pet.contactPhone ? `<div class="info-item"><div class="info-label">Emergency</div><div class="info-value">${pet.contactPhone}</div></div>` : ""}
    </div>
    ${alerts ? `<div class="alert-box"><div class="alert-label">⚠️ Medical Alert</div><div class="alert-value">${alerts}</div></div>` : ""}
    ${qrUrl ? `
    <div class="qr-section">
      <img class="qr-img" src="${qrUrl}" alt="QR Code" />
      <div class="qr-text">
        <h4>Scan to Contact Owner</h4>
        <p>If you find ${pet.name}, scan this QR code to instantly connect with their family — no app needed.</p>
      </div>
    </div>` : ""}
  </div>
  <div class="footer">
    PawLink • Smart Pet QR Recovery • pawlink-chi.vercel.app
  </div>
</div>
<div style="text-align:center;margin-top:20px;" class="print-btn">
  <button onclick="window.print()" style="background:#0d9488;color:white;border:none;padding:12px 28px;border-radius:16px;font-size:14px;font-weight:700;cursor:pointer;">🖨️ Print ID Card</button>
</div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate ID card";
    return new NextResponse(message, { status: 500 });
  }
}
