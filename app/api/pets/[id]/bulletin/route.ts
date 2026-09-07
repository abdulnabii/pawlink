import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: generate bulletin data for a lost pet
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await import("@/lib/db");

    const pet = await db.pet.findUnique({
      where: { id: params.id },
      include: {
        tagAssignments: {
          where: { unassignedAt: null },
          include: { tag: true },
          take: 1,
        },
        recoveryCases: {
          where: { status: "OPEN" },
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!pet || pet.userId !== session.id) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pawlink-chi.vercel.app";
    const tagCode = pet.tagAssignments[0]?.tag?.tagCode;
    const scanUrl = tagCode ? `${appUrl}/p/${tagCode}` : appUrl;
    const lastSeen = pet.recoveryCases[0]?.lastSeenLocation || "Unknown location";

    const bulletinText = `🚨 LOST PET ALERT 🚨

My ${pet.species?.toLowerCase() || "pet"} *${pet.name}* is missing! 🐾

📍 Last seen: ${lastSeen}
🐕 Breed: ${pet.breed || "Unknown"}
🎨 Color: ${pet.color || "Unknown"}
⚖️ Weight: ${pet.weight ? `${pet.weight}kg` : "Unknown"}

If you find ${pet.name}, please scan the QR code on their collar or visit:
🔗 ${scanUrl}

You can send me a message directly and share your location — no app needed!

Please share this post to help bring ${pet.name} home! 🙏

#LostPet #Lost${pet.species || "Pet"} #PawLink #${(pet.name || "").replace(/\s/g, "")}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(bulletinText)}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `🚨 LOST PET: My ${pet.species?.toLowerCase()} *${pet.name}* is missing near ${lastSeen}! Please scan their collar or visit ${scanUrl} to contact me directly. #LostPet #PawLink`
    )}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(scanUrl)}`;

    return NextResponse.json({
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        color: pet.color,
        weight: pet.weight,
        photoUrl: pet.photoUrl,
        lastSeen,
      },
      bulletin: {
        text: bulletinText,
        scanUrl,
        shareLinks: { whatsapp: whatsappUrl, twitter: twitterUrl, facebook: facebookUrl },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate bulletin";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
