import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdminEmail } from "@/lib/auth";
import { db } from "@/lib/db";
import { UpdatePetInputSchema } from "@/lib/validation";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const isAdmin = user.role === "ADMIN" || isAdminEmail(user.email);

    const pet = await db.pet.findFirst({
      where: isAdmin
        ? { id: params.id }
        : {
            id: params.id,
            userId: user.id,
          },
      include: {
        photos: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
        },
        tagAssignments: {
          where: { unassignedAt: null },
          include: { tag: true },
        },
        recoveryCases: {
          orderBy: { createdAt: "desc" },
          include: {
            locationEvents: {
              orderBy: { createdAt: "desc" },
            },
            conversations: {
              include: {
                messages: {
                  orderBy: { createdAt: "asc" },
                },
              },
            },
          },
        },
        recoveryEvents: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        medicalRecords: {
          orderBy: { createdAt: "desc" },
        },
        familyMembers: true,
      },
    });

    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    return NextResponse.json({ pet: sanitizePrisma(pet) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load pet details";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const isAdmin = user.role === "ADMIN" || isAdminEmail(user.email);
    const body = await req.json();
    const validated = UpdatePetInputSchema.parse(body);

    const existing = await db.pet.findFirst({
      where: isAdmin ? { id: params.id } : { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const updated = await db.pet.update({
      where: { id: params.id },
      data: {
        name: validated.name !== undefined ? validated.name : existing.name,
        species: validated.species !== undefined ? validated.species : existing.species,
        breed: validated.breed !== undefined ? validated.breed : existing.breed,
        gender: validated.gender !== undefined ? validated.gender : existing.gender,
        birthDate: validated.birthDate !== undefined ? (validated.birthDate ? new Date(validated.birthDate) : null) : existing.birthDate,
        weight: validated.weight !== undefined ? validated.weight : existing.weight,
        color: validated.color !== undefined ? validated.color : existing.color,
        photoUrl: validated.photoUrl !== undefined ? validated.photoUrl : existing.photoUrl,
        microchipNumber: validated.microchipNumber !== undefined ? validated.microchipNumber : existing.microchipNumber,
        personality: validated.personality !== undefined ? validated.personality : existing.personality,
        specialInstructions: validated.specialInstructions !== undefined ? validated.specialInstructions : existing.specialInstructions,
        allowWhatsApp: validated.allowWhatsApp !== undefined ? validated.allowWhatsApp : existing.allowWhatsApp,
        allowPhoneCall: validated.allowPhoneCall !== undefined ? validated.allowPhoneCall : existing.allowPhoneCall,
        allowInAppChat: validated.allowInAppChat !== undefined ? validated.allowInAppChat : existing.allowInAppChat,
        hideOwnerPhone: validated.hideOwnerPhone !== undefined ? validated.hideOwnerPhone : existing.hideOwnerPhone,
        contactPhone: validated.contactPhone !== undefined ? validated.contactPhone : existing.contactPhone,
      },
    });

    return NextResponse.json({ success: true, pet: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update pet";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const isAdmin = user.role === "ADMIN" || isAdminEmail(user.email);

    const pet = await db.pet.findFirst({
      where: isAdmin ? { id: params.id } : { id: params.id, userId: user.id },
    });

    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    await db.pet.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete pet";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
