import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Guardian management API
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await import("@/lib/db");
    const pet = await db.pet.findUnique({ where: { id: params.id } });
    if (!pet || pet.userId !== session.id) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const guardians = await db.familyMember.findMany({
      where: { petId: params.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ guardians });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch guardians";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await import("@/lib/db");
    const pet = await db.pet.findUnique({ where: { id: params.id } });
    if (!pet || pet.userId !== session.id) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const { email, name } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Check if already a guardian
    const existing = await db.familyMember.findFirst({
      where: { petId: params.id, email },
    });
    if (existing) {
      return NextResponse.json({ error: "Already invited" }, { status: 409 });
    }

    // Find if user exists
    const invitedUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    const guardian = await db.familyMember.create({
      data: {
        petId: params.id,
        userId: invitedUser?.id || null,
        email,
        name: name || email.split("@")[0],
        role: "CARETAKER",
        inviteAccepted: !!invitedUser,
      },
    });

    return NextResponse.json({ success: true, guardian });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add guardian";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
