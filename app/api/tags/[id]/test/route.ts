import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashIp } from "@/lib/crypto";
import { enqueueNotificationJob, processNotificationQueue } from "@/lib/queue/worker";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const tag = await db.tag.findFirst({
      where: {
        OR: [{ id: params.id }, { tagCode: params.id }],
      },
      include: {
        assignments: {
          where: { unassignedAt: null },
          include: { pet: true },
          take: 1,
        },
      },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const assignment = tag.assignments[0];
    const pet = assignment?.pet;

    if (!pet) {
      return NextResponse.json({ error: "Tag is not currently assigned to any pet" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const ipHash = hashIp(ip);

    // Create a ScanEvent with isTestScan = true
    const scan = await db.scanEvent.create({
      data: {
        tagId: tag.id,
        isTestScan: true,
        ipHash,
        approximateLocation: "Owner Test Simulation",
        deviceType: "Desktop/Owner Test",
        userAgentCategory: "Owner Test Mode",
        scanSource: "TEST_SIMULATOR",
        notificationSent: true,
      },
    });

    // Increment scanCount on the Tag
    const newScanCount = (Number(tag.scanCount) || 0) + 1;
    await db.tag.update({
      where: { id: tag.id },
      data: {
        scanCount: { increment: 1 },
        lastScannedAt: new Date(),
      },
    });

    // Log Recovery timeline event
    await db.recoveryEvent.create({
      data: {
        petId: pet.id,
        type: "TAG_SCANNED",
        actorType: "OWNER",
        title: "Collar Tag Test Simulation",
        description: `Collar tag ${tag.tagCode} test simulated. Scan alert pipeline verified.`,
        metadata: JSON.stringify({ isTest: true }),
      },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://pawlink-chi.vercel.app");
    const dashboardUrl = `${appUrl}/dashboard/pets/${pet.id}`;

    // Enqueue a Test Notification
    await enqueueNotificationJob(
      user.id,
      "TEST_ALERT",
      {
        userId: user.id,
        petId: pet.id,
        petName: pet.name,
        type: "TEST_ALERT",
        title: `🧪 Test Scan: ${pet.name}'s Tag Works!`,
        body: `Congratulations! Your PawLink tag ${tag.tagCode} for ${pet.name} is connected and ready. WhatsApp and Email notifications are functioning normally.`,
        tagCode: tag.tagCode,
        approximateLocation: "Test Mode Simulation",
        dashboardUrl,
      },
      `TEST_SCAN:${tag.id}:${Date.now()}`
    );

    // Immediately process queue for instantaneous feedback
    await processNotificationQueue(5);

    return NextResponse.json({
      success: true,
      message: `🎉 Test scan simulated successfully for ${pet.name}! Emergency alert pipeline verified.`,
      scanId: scan.id,
      tagCode: tag.tagCode,
      petName: pet.name,
      newScanCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Test scan failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
