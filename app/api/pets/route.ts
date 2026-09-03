import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdminEmail } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreatePetInputSchema } from "@/lib/validation";
import { sanitizePrisma } from "@/lib/sanitize";
import { generateTagCode, generateActivationPin } from "@/lib/crypto";
import { getTagRecoveryUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const isAdmin = user.role === "ADMIN" || isAdminEmail(user.email);
    const showAll = req.nextUrl?.searchParams?.get("all") === "true";

    const pets = await db.pet.findMany({
      where: (isAdmin && showAll) ? {} : { userId: user.id },
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

    // 1. Enforce Subscription Plan Limit
    const subscription = await db.subscription.findFirst({
      where: { userId: user.id },
    });
    const currentPlan = (subscription?.plan || "FREE").toUpperCase();
    const existingPets = await db.pet.findMany({ where: { userId: user.id } });

    const maxAllowed = currentPlan === "PRO" ? 999 : currentPlan === "PLUS" ? 5 : 1;
    if (existingPets.length >= maxAllowed) {
      const planName = currentPlan === "FREE" ? "Basic ID" : currentPlan === "PLUS" ? "Plus Recovery" : "Pro Household";
      return NextResponse.json(
        {
          error: "PLAN_LIMIT_REACHED",
          message: `Your current ${planName} plan is limited to ${maxAllowed} pet profile(s). You currently have ${existingPets.length} pet(s). Upgrade to Plus Recovery (up to 5 pets) or Pro Household (unlimited) in Settings to add more animals.`,
          currentPlan,
          maxAllowed,
          currentCount: existingPets.length,
        },
        { status: 403 }
      );
    }

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

    // Automatically generate and assign primary Collar Tag
    const tagCode = generateTagCode();
    const activationPin = generateActivationPin();
    const qrUrl = getTagRecoveryUrl(tagCode);

    const tag = await db.tag.create({
      data: {
        tagCode,
        activationPin,
        qrUrl,
        label: `${validated.name}'s Primary Collar Tag`,
        status: "ACTIVE",
      },
    });

    await db.tagAssignment.create({
      data: {
        tagId: tag.id,
        petId: pet.id,
        assignedById: user.id,
      },
    });

    const { resilientStore } = await import("@/lib/store");
    await resilientStore.syncToCloud(true);

    return NextResponse.json({ success: true, pet, tag }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create pet";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
