import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TagActivationInputSchema } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = TagActivationInputSchema.parse(body);

    const pet = await db.pet.findFirst({
      where: { id: validated.petId, userId: user.id },
    });

    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const tag = await db.tag.findFirst({
      where: {
        OR: [{ id: params.id }, { tagCode: validated.tagCode }],
      },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    if (tag.status === "REVOKED") {
      return NextResponse.json({ error: "This tag has been revoked by administrators." }, { status: 400 });
    }

    // Verify PIN if physical tag activation PIN is required
    if (tag.activationPin && validated.activationPin && tag.activationPin !== validated.activationPin) {
      return NextResponse.json({ error: "Invalid tag activation PIN." }, { status: 400 });
    }

    const assignment = await db.$transaction(async (tx) => {
      // 1. Close any prior active assignment for this tag
      await tx.tagAssignment.updateMany({
        where: { tagId: tag.id, unassignedAt: null },
        data: { unassignedAt: new Date() },
      });

      // 2. Close any prior active tag assignment for this pet (if pet only has 1 collar)
      await tx.tagAssignment.updateMany({
        where: { petId: pet.id, unassignedAt: null },
        data: { unassignedAt: new Date() },
      });

      // 3. Create new TagAssignment
      const newAssignment = await tx.tagAssignment.create({
        data: {
          tagId: tag.id,
          petId: pet.id,
          assignedById: user.id,
        },
      });

      // 4. Ensure Tag is ACTIVE
      await tx.tag.update({
        where: { id: tag.id },
        data: { status: "ACTIVE", label: validated.label || tag.label },
      });

      // 5. Log RecoveryEvent
      await tx.recoveryEvent.create({
        data: {
          petId: pet.id,
          type: "TAG_REASSIGNED",
          actorType: "OWNER",
          actorId: user.id,
          title: `Tag Attached to ${pet.name}`,
          description: `PawLink QR Tag ${tag.tagCode} is now active on ${pet.name}'s collar.`,
          metadata: JSON.stringify({ tagCode: tag.tagCode }),
        },
      });

      return newAssignment;
    });

    return NextResponse.json({ success: true, assignment });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Tag activation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
