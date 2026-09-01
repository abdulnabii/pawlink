import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdminEmail } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateActivationPin, generateTagCode } from "@/lib/crypto";
import { getTagRecoveryUrl } from "@/lib/qr";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET() {
  try {
    const user = await requireAuth();
    const isAdmin = user.role === "ADMIN" || isAdminEmail(user.email);

    const tags = await db.tag.findMany({
      where: isAdmin
        ? {}
        : {
            assignments: {
              some: {
                assignedById: user.id,
              },
            },
          },
      include: {
        assignments: {
          include: {
            pet: {
              select: { id: true, name: true, species: true, photoUrl: true, status: true },
            },
          },
          orderBy: { assignedAt: "desc" },
        },
        _count: {
          select: { scanEvents: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tags: sanitizePrisma(tags) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load tags";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const petId = body.petId as string | undefined;

    // Check subscription plan tag limits
    const subscription = await db.subscription.findFirst({
      where: { userId: user.id },
    });
    const currentPlan = (subscription?.plan || "FREE").toUpperCase();
    const existingTags = await db.tag.findMany({
      where: {
        assignments: {
          some: {
            assignedById: user.id,
            unassignedAt: null,
          },
        },
      },
    });

    const maxAllowedTags = currentPlan === "PRO" ? 999 : currentPlan === "PLUS" ? 5 : 1;
    if (existingTags.length >= maxAllowedTags) {
      const planName = currentPlan === "FREE" ? "Basic ID" : currentPlan === "PLUS" ? "Plus Recovery" : "Pro Household";
      return NextResponse.json(
        {
          error: "PLAN_TAG_LIMIT_REACHED",
          message: `Your ${planName} plan is limited to ${maxAllowedTags} active collar tag(s). You currently have ${existingTags.length} active tag(s). Please upgrade your plan in Settings to generate additional tags.`,
          currentPlan,
          maxAllowedTags,
        },
        { status: 403 }
      );
    }

    const tagCode = generateTagCode();
    const activationPin = generateActivationPin();
    const qrUrl = getTagRecoveryUrl(tagCode);

    const tag = await db.$transaction(async (tx: any) => {
      const createdTag = await tx.tag.create({
        data: {
          tagCode,
          activationPin,
          qrUrl,
          label: body.label || "Collar Tag",
          status: "ACTIVE",
        },
      });

      if (petId) {
        const pet = await tx.pet.findFirst({
          where: { id: petId, userId: user.id },
        });

        if (!pet) {
          throw new Error("Pet not found or does not belong to user");
        }

        // Close any prior active assignment on this tag
        await tx.tagAssignment.updateMany({
          where: { tagId: createdTag.id, unassignedAt: null },
          data: { unassignedAt: new Date() },
        });

        // Assign tag to pet
        await tx.tagAssignment.create({
          data: {
            tagId: createdTag.id,
            petId: pet.id,
            assignedById: user.id,
          },
        });

        // Log RecoveryEvent
        await tx.recoveryEvent.create({
          data: {
            petId: pet.id,
            type: "TAG_ACTIVATED",
            actorType: "OWNER",
            actorId: user.id,
            title: `Tag Attached to ${pet.name}`,
            description: `PawLink QR Tag ${tagCode} was connected to ${pet.name}'s collar.`,
            metadata: JSON.stringify({ tagCode }),
          },
        });
      }

      return createdTag;
    });

    return NextResponse.json({ success: true, tag }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate tag";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
