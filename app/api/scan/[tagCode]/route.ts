import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashIp, generateScanFingerprint } from "@/lib/crypto";
import { isNotificationThrottled } from "@/lib/rate-limit";
import { toPublicPetResponse } from "@/lib/dto";
import { enqueueNotificationJob, processNotificationQueue } from "@/lib/queue/worker";

export async function GET(
  req: NextRequest,
  { params }: { params: { tagCode: string } }
) {
  const rawCode = decodeURIComponent(params.tagCode || "").trim().toUpperCase();
  const tagCode = rawCode.replace(/[^A-Z0-9-]/g, "");
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "";
  const ipHash = hashIp(ip);

  // 1. Device category parsing
  const isMobile = /iPhone|iPad|Android|Mobile/i.test(userAgent);
  const deviceType = /iPhone/i.test(userAgent)
    ? "iOS"
    : /Android/i.test(userAgent)
    ? "Android"
    : isMobile
    ? "Mobile"
    : "Desktop";
  const userAgentCategory = isMobile ? "Mobile" : "Desktop";

  try {
    // 2. Lookup Tag and assigned Pet
    const tag = await db.tag.findUnique({
      where: { tagCode },
      include: {
        assignments: {
          where: { unassignedAt: null },
          include: {
            pet: {
              include: {
                medicalRecords: true,
                recoveryCases: {
                  where: { status: "OPEN" },
                  take: 1,
                },
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    notificationPreference: true,
                  },
                },
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!tag) {
      return NextResponse.json(
        {
          error: "TAG_NOT_FOUND",
          message: `This PawLink tag (${tagCode}) is not recognized or has not been registered.`,
        },
        { status: 404 }
      );
    }

    if (tag.status === "REVOKED") {
      return NextResponse.json(
        {
          error: "TAG_REVOKED",
          message: "This tag has been reported as deactivated or revoked.",
        },
        { status: 403 }
      );
    }

    const assignments = Array.isArray(tag.assignments) ? tag.assignments : [];
    const assignment = assignments[0];
    const pet = assignment?.pet;

    if (!pet) {
      return NextResponse.json(
        {
          error: "UNASSIGNED_TAG",
          message: "This tag has been generated but is not yet attached to a pet profile.",
          tagCode: tag.tagCode,
        },
        { status: 200 }
      );
    }

    const activeRecoveryCase = pet.recoveryCases?.[0] || null;
    const idempotencyKey = generateScanFingerprint(tag.id, ipHash, 30); // 30s idempotency window
    const throttled = isNotificationThrottled(tag.id, ipHash, 5 * 60 * 1000); // 5 min notification throttle

    // 3. Asynchronously record ScanEvent, RecoveryEvent & dispatch Notification in background
    const recordBackgroundScan = async () => {
      try {
        await db.$transaction(async (tx: any) => {
          const existingScan = await tx.scanEvent.findUnique({
            where: { idempotencyKey },
          });

          if (!existingScan) {
            await tx.scanEvent.create({
              data: {
                tagId: tag.id,
                recoveryCaseId: activeRecoveryCase?.id || null,
                ipHash,
                idempotencyKey,
                userAgentCategory,
                deviceType,
                approximateLocation: "Tag Scanned via QR",
                scanSource: "QR",
                notificationSent: !throttled,
              },
            });

            await tx.tag.update({
              where: { id: tag.id },
              data: {
                scanCount: { increment: 1 },
                lastScannedAt: new Date(),
              },
            });

            await tx.recoveryEvent.create({
              data: {
                petId: pet.id,
                recoveryCaseId: activeRecoveryCase?.id || null,
                type: "TAG_SCANNED",
                actorType: "FINDER",
                title: `QR Tag Scanned`,
                description: `${pet.name}'s collar tag was scanned by a finder on a ${deviceType} device.`,
                metadata: JSON.stringify({
                  deviceType,
                  userAgentCategory,
                }),
              },
            });
          }
        });

        if (!throttled) {
          const appUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://pawlink-chi.vercel.app");
          const dashboardUrl = `${appUrl}/dashboard/pets/${pet.id}`;

          await enqueueNotificationJob(
            pet.userId,
            "SCAN_ALERT",
            {
              userId: pet.userId,
              petId: pet.id,
              petName: pet.name,
              type: "SCAN_ALERT",
              title: `🚨 ${pet.name}'s QR Tag Was Just Scanned!`,
              body: `Someone just scanned ${pet.name}'s collar tag using a ${deviceType} device. The finder may share their location or message you shortly.`,
              tagCode: tag.tagCode,
              dashboardUrl,
            },
            `SCAN_ALERT:${tag.id}:${idempotencyKey}`
          );

          processNotificationQueue(5).catch((err) =>
            console.error("[Queue Worker Async Trigger Error]", err)
          );
        }
      } catch (e) {
        console.error("[Scan Event Background Log Error]", e);
      }
    };

    // Fire-and-forget scan telemetry so finder gets pet data in milliseconds
    recordBackgroundScan().catch(() => {});

    // 4. Return Safe Public DTO instantly
    const publicProfile = toPublicPetResponse(pet, tag);

    return NextResponse.json(
      {
        success: true,
        pet: publicProfile,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=15",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load recovery page";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
