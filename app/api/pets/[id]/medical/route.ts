import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MedicalRecordInputSchema } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const pet = await db.pet.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const body = await req.json();
    const validated = MedicalRecordInputSchema.parse(body);

    const record = await db.petMedicalRecord.create({
      data: {
        petId: pet.id,
        recordType: validated.recordType,
        title: validated.title,
        description: validated.description || null,
        dateAdministered: validated.dateAdministered ? new Date(validated.dateAdministered) : null,
        nextDueDate: validated.nextDueDate ? new Date(validated.nextDueDate) : null,
        veterinarian: validated.veterinarian || null,
        documentUrl: validated.documentUrl || null,
        isPublicAlert: validated.isPublicAlert,
      },
    });

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add medical record";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
