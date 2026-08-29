import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateMessageInputSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { enqueueNotificationJob, processNotificationQueue } from "@/lib/queue/worker";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateCheck = checkRateLimit(`msg:${ip}`, 20, 60 * 1000);

  if (!rateCheck.success) {
    return NextResponse.json({ error: "Message rate limit exceeded. Please wait a moment." }, { status: 429 });
  }

  try {
    const session = await getSession();
    const body = await req.json();
    const validated = CreateMessageInputSchema.parse(body);

    const conversation = await db.conversation.findUnique({
      where: { id: validated.conversationId },
      include: {
        pet: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (conversation.status === "BLOCKED") {
      return NextResponse.json({ error: "This conversation has been closed." }, { status: 403 });
    }

    let senderType: "FINDER" | "OWNER" = "FINDER";

    if (session && session.id === conversation.pet.user.id) {
      senderType = "OWNER";
    } else {
      // Validate finderToken
      if (!validated.finderToken || validated.finderToken !== conversation.finderToken) {
        return NextResponse.json({ error: "Invalid or expired finder token" }, { status: 401 });
      }
      senderType = "FINDER";
    }

    const message = await db.$transaction(async (tx: any) => {
      const msg = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderType,
          content: validated.content,
          photoUrl: validated.photoUrl || null,
        },
      });

      // Update conversation timestamps
      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          updatedAt: new Date(),
          ...(senderType === "FINDER"
            ? { lastFinderActivity: new Date() }
            : { lastOwnerActivity: new Date() }),
        },
      });

      // If finder sent message, log RecoveryEvent
      if (senderType === "FINDER") {
        await tx.recoveryEvent.create({
          data: {
            petId: conversation.petId,
            recoveryCaseId: conversation.recoveryCaseId,
            type: "MESSAGE_RECEIVED",
            actorType: "FINDER",
            title: `💬 New Message from Finder`,
            description: `Finder sent: "${validated.content.substring(0, 80)}${validated.content.length > 80 ? "..." : ""}"`,
            metadata: JSON.stringify({
              conversationId: conversation.id,
              contentSnippet: validated.content.substring(0, 100),
            }),
          },
        });
      }

      return msg;
    });

    // Notify owner if message was from finder
    if (senderType === "FINDER") {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const dashboardUrl = `${appUrl}/dashboard/messages?conv=${conversation.id}`;

      await enqueueNotificationJob(
        conversation.pet.user.id,
        "MESSAGE_ALERT",
        {
          userId: conversation.pet.user.id,
          petId: conversation.petId,
          petName: conversation.pet.name,
          type: "MESSAGE_ALERT",
          title: `💬 New Message from Finder of ${conversation.pet.name}`,
          body: `"${validated.content.substring(0, 120)}"`,
          dashboardUrl,
        },
        `MSG_ALERT:${message.id}`
      );

      processNotificationQueue(5).catch((err) =>
        console.error("[Queue Worker Async Error on Message]", err)
      );
    }

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send message";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
