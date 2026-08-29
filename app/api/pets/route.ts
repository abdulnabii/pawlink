import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreatePetInputSchema } from "@/lib/validation";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET() {
  try {
    const user = await requireAuth();

    const pets = await db.pet.findMany({
      where: { userId: user.id },
      include: {
        tagAssignments: {
          where: { unassignedAt: null },
          include: { tag: true },
        },
        recoveryCases: {
          where: { status: "OPEN" },
          take: 1,
        },
        medicalRecords: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            recoveryEvents: true,
            conversations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ pets: sanitizePrisma(pets) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load pets";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = CreatePetInputSchema.parse(body);

    const pet = await db.pet.create({
      data: {
        userId: user.id,
        name: validated.name,
        species: validated.species,
        breed: validated.breed || null,
        gender: validated.gender || null,
        birthDate: validated.birthDate ? new Date(validated.birthDate) : null,
        weight: validated.weight || null,
        color: validated.color || null,
        photoUrl: validated.photoUrl || null,
        microchipNumber: validated.microchipNumber || null,
        personality: validated.personality || null,
        specialInstructions: validated.specialInstructions || null,
        allowWhatsApp: validated.allowWhatsApp,
        allowPhoneCall: validated.allowPhoneCall,
        allowInAppChat: validated.allowInAppChat,
        hideOwnerPhone: validated.hideOwnerPhone,
        contactPhone: validated.contactPhone || null,
        status: "SAFE",
      },
    });

    return NextResponse.json({ success: true, pet }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create pet";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
