import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Public vet-facing page data endpoint
export async function GET(
  req: NextRequest,
  { params }: { params: { petId: string } }
) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Vet access token required" }, { status: 401 });
    }

    const { db } = await import("@/lib/db");

    const pet = await db.pet.findFirst({
      where: {
        id: params.petId,
        vetAccessToken: token,
      },
      include: {
        medicalRecords: {
          orderBy: { dateAdministered: "desc" },
        },
      },
    });

    if (!pet) {
      return NextResponse.json({ error: "Invalid token or pet not found" }, { status: 404 });
    }

    // Check expiry
    if (pet.vetTokenExpiresAt && new Date(pet.vetTokenExpiresAt) < new Date()) {
      return NextResponse.json({ error: "Vet access token has expired" }, { status: 403 });
    }

    // Return ONLY medical info — no owner personal data
    return NextResponse.json({
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        gender: pet.gender,
        birthDate: pet.birthDate,
        weight: pet.weight,
        color: pet.color,
        photoUrl: pet.photoUrl,
        microchipNumber: pet.microchipNumber,
        specialInstructions: pet.specialInstructions,
      },
      medicalRecords: pet.medicalRecords.map((r) => ({
        id: r.id,
        recordType: r.recordType,
        title: r.title,
        description: r.description,
        dateAdministered: r.dateAdministered,
        nextDueDate: r.nextDueDate,
        veterinarian: r.veterinarian,
        isPublicAlert: r.isPublicAlert,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch vet data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
