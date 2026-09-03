import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdminEmail } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateMessageInputSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { enqueueNotificationJob, processNotificationQueue } from "@/lib/queue/worker";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    let senderType: "FINDER" | "OWNER";
    const ownerUserId = conversation.pet?.user?.id || conversation.pet?.userId;
    const isPlatformAdmin = session && (
      session.role === "ADMIN" ||
      session.role === "SUPER_ADMIN" ||
      (session.email && isAdminEmail(session.email))
    );
    const isPetOwner = session && (
      session.id === ownerUserId ||
      session.id === conversation.pet?.userId
    );

    // If request supplies valid finderToken, it is guaranteed to be from the FINDER
    // (even if the user happens to have an active owner login session in the same browser)
    if (validated.finderToken && validated.finderToken === conversation.finderToken) {
      senderType = "FINDER";
    } else if (isPetOwner || isPlatformAdmin) {
      senderType = "OWNER";
    } else {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing finder token, or owner login required" },
        { status: 401 }
      );
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
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://pawlink-chi.vercel.app");
      const dashboardUrl = `${appUrl}/dashboard/messages?conv=${conversation.id}`;

      if (ownerUserId) {
        await enqueueNotificationJob(
          ownerUserId,
          "MESSAGE_ALERT",
          {
            userId: ownerUserId,
            petId: conversation.petId,
            petName: conversation.pet?.name || "Pet",
            type: "MESSAGE_ALERT",
            title: `💬 New Message from Finder of ${conversation.pet?.name || "your pet"}`,
            body: `"${validated.content.substring(0, 120)}"`,
            dashboardUrl,
          },
          `MSG_ALERT:${message.id}`
        );
      }

      try {
        await processNotificationQueue(5);
      } catch (err) {
        console.error("[Queue Worker Error on Message]", err);
      }
    }

    const { resilientStore } = await import("@/lib/store");
    await resilientStore.syncToCloud(true);

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send message";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
