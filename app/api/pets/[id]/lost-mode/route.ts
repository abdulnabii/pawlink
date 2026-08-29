import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LostModeInputSchema } from "@/lib/validation";
import { enqueueNotificationJob } from "@/lib/queue/worker";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = LostModeInputSchema.parse(body);

    const pet = await db.pet.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        tagAssignments: {
          where: { unassignedAt: null },
          include: { tag: true },
        },
      },
    });

    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const dashboardUrl = `${appUrl}/dashboard/pets/${pet.id}`;

    if (validated.activate) {
      // 1. ACTIVATE LOST MODE
      const result = await db.$transaction(async (tx: any) => {
        // Close any existing open cases to guarantee single OPEN case constraint
        await tx.recoveryCase.updateMany({
          where: { petId: pet.id, status: "OPEN" },
          data: { status: "CANCELLED", resolvedAt: new Date() },
        });

        // Create new OPEN RecoveryCase
        const newCase = await tx.recoveryCase.create({
          data: {
            petId: pet.id,
            status: "OPEN",
            startedAt: new Date(),
            lastSeenAt: new Date(),
            lastSeenLocation: validated.lastSeenLocation || null,
            lastSeenLatitude: validated.lastSeenLatitude || null,
            lastSeenLongitude: validated.lastSeenLongitude || null,
            rewardAmount: validated.rewardAmount || 0,
            description: validated.description || null,
          },
        });

        // Update Pet Status
        const updatedPet = await tx.pet.update({
          where: { id: pet.id },
          data: { status: "LOST" },
        });

        // Log RecoveryEvent
        await tx.recoveryEvent.create({
          data: {
            petId: pet.id,
            recoveryCaseId: newCase.id,
            type: "LOST_MODE_ACTIVATED",
            actorType: "OWNER",
            actorId: user.id,
            title: `Lost Mode Activated for ${pet.name}`,
            description: validated.lastSeenLocation
              ? `Last seen near ${validated.lastSeenLocation}. Reward: $${validated.rewardAmount || 0}`
              : `Owner reported ${pet.name} missing.`,
            metadata: JSON.stringify({
              rewardAmount: validated.rewardAmount,
              lastSeenLocation: validated.lastSeenLocation,
            }),
          },
        });

        return { pet: updatedPet, recoveryCase: newCase };
      });

      // Enqueue owner confirmation alert
      await enqueueNotificationJob(
        user.id,
        "LOST_MODE_ACTIVATED",
        {
          userId: user.id,
          petId: pet.id,
          petName: pet.name,
          type: "LOST_MODE_ACTIVATED",
          title: `🚨 Lost Mode Active: ${pet.name}`,
          body: `Lost Mode is now broadcast on ${pet.name}'s tag page. You will receive immediate WhatsApp & email alerts when scanned.`,
          dashboardUrl,
        },
        `LOST_MODE_ACTIVE:${pet.id}:${result.recoveryCase.id}`
      );

      return NextResponse.json({ success: true, ...result });
    } else {
      // 2. DEACTIVATE LOST MODE (PET RECOVERED)
      const result = await db.$transaction(async (tx: any) => {
        // Resolve active OPEN recovery case
        const openCase = await tx.recoveryCase.findFirst({
          where: { petId: pet.id, status: "OPEN" },
        });

        if (openCase) {
          await tx.recoveryCase.update({
            where: { id: openCase.id },
            data: {
              status: "RESOLVED",
              resolvedAt: new Date(),
              resolutionNote: validated.resolutionNote || "Pet safely reunited with family!",
            },
          });
        }

        // Update Pet Status back to SAFE
        const updatedPet = await tx.pet.update({
          where: { id: pet.id },
          data: { status: "SAFE" },
        });

        // Log RecoveryEvent
        await tx.recoveryEvent.create({
          data: {
            petId: pet.id,
            recoveryCaseId: openCase?.id,
            type: "PET_RECOVERED",
            actorType: "OWNER",
            actorId: user.id,
            title: `🎉 ${pet.name} is Safely Home!`,
            description: validated.resolutionNote || `${pet.name} was marked as safely recovered.`,
            metadata: JSON.stringify({
              resolutionNote: validated.resolutionNote,
            }),
          },
        });

        return { pet: updatedPet, resolvedCaseId: openCase?.id };
      });

      // Enqueue recovery celebration alert
      await enqueueNotificationJob(
        user.id,
        "PET_RECOVERED",
        {
          userId: user.id,
          petId: pet.id,
          petName: pet.name,
          type: "PET_RECOVERED",
          title: `🎉 Wonderful News! ${pet.name} is Home`,
          body: `Lost Mode has been turned off and ${pet.name}'s profile is now back to safe status.`,
          dashboardUrl,
        },
        `PET_RECOVERED:${pet.id}:${Date.now()}`
      );

      return NextResponse.json({ success: true, ...result });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lost Mode action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
