import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Generate or regenerate vet access token for a pet
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await import("@/lib/db");

    const pet = await db.pet.findUnique({ where: { id: params.id } });
    if (!pet || pet.userId !== session.id) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    // Generate a secure random token
    const { generateFinderToken } = await import("@/lib/crypto");
    const vetAccessToken = generateFinderToken();
    const vetTokenExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

    await db.pet.update({
      where: { id: params.id },
      data: { vetAccessToken, vetTokenExpiresAt },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pawlink-chi.vercel.app";
    const vetUrl = `${appUrl}/v/${params.id}?token=${vetAccessToken}`;

    return NextResponse.json({ success: true, vetAccessToken, vetUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate vet token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await import("@/lib/db");

    const pet = await db.pet.findUnique({ where: { id: params.id } });
    if (!pet || pet.userId !== session.id) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    await db.pet.update({
      where: { id: params.id },
      data: { vetAccessToken: null, vetTokenExpiresAt: null },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to revoke vet token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
