import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateFinderToken } from "@/lib/crypto";
import { z } from "zod";

const StartConversationSchema = z.object({
  tagCode: z.string().min(1),
  finderName: z.string().max(100).optional().nullable(),
  finderPhone: z.string().max(50).optional().nullable(),
  initialMessage: z.string().min(1).max(2000).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  const finderToken = req.nextUrl.searchParams.get("finderToken");

  if (finderToken) {
    // Lookup by finderToken for zero-auth finder session
    const conversation = await db.conversation.findUnique({
      where: { finderToken },
      include: {
        pet: {
          select: { id: true, name: true, photoUrl: true, species: true, status: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found or expired" }, { status: 404 });
    }

    return NextResponse.json({ conversation });
  }

  if (session) {
    // Owner inbox
    const petId = req.nextUrl.searchParams.get("petId");
    const conversations = await db.conversation.findMany({
      where: {
        pet: {
          userId: session.id,
          ...(petId ? { id: petId } : {}),
        },
      },
      include: {
        pet: {
          select: { id: true, name: true, photoUrl: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ conversations });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = StartConversationSchema.parse(body);
    const tagCode = validated.tagCode.toUpperCase().trim();

    const tag = await db.tag.findUnique({
      where: { tagCode },
      include: {
        assignments: {
          where: { unassignedAt: null },
          include: {
            pet: {
              include: {
                recoveryCases: { where: { status: "OPEN" }, take: 1 },
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!tag || !tag.assignments[0]?.pet) {
      return NextResponse.json({ error: "Active pet tag not found" }, { status: 404 });
    }

    const pet = tag.assignments[0].pet;
    const activeCase = pet.recoveryCases[0] || null;
    const finderToken = generateFinderToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days token expiration

    const conversation = await db.conversation.create({
      data: {
        petId: pet.id,
        recoveryCaseId: activeCase?.id || null,
        finderToken,
        finderName: validated.finderName || "Helpful Finder",
        finderPhone: validated.finderPhone || null,
        expiresAt,
        status: "OPEN",
        ...(validated.initialMessage
          ? {
              messages: {
                create: {
                  senderType: "FINDER",
                  content: validated.initialMessage,
                },
              },
            }
          : {}),
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json({
      success: true,
      finderToken,
      conversationId: conversation.id,
      conversation,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to start conversation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
