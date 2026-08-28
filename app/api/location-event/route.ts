import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { LocationShareInputSchema } from "@/lib/validation";
import { enqueueNotificationJob, processNotificationQueue } from "@/lib/queue/worker";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = LocationShareInputSchema.parse(body);
    const tagCode = validated.tagCode.toUpperCase().trim();

    const tag = await db.tag.findUnique({
      where: { tagCode },
      include: {
        assignments: {
          where: { unassignedAt: null },
          include: {
            pet: {
              include: {
                recoveryCases: {
                  where: { status: "OPEN" },
                  take: 1,
                },
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!tag || !tag.assignments[0]?.pet) {
      return NextResponse.json({ error: "Active pet tag not found." }, { status: 404 });
    }

    const pet = tag.assignments[0].pet;
    const activeCase = pet.recoveryCases[0] || null;

    // Default 30-day expiration for location data
    const locationExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const locationEvent = await db.$transaction(async (tx) => {
      // 1. Create LocationEvent
      const loc = await tx.locationEvent.create({
        data: {
          recoveryCaseId: activeCase?.id || null,
          latitude: validated.latitude,
          longitude: validated.longitude,
          accuracy: validated.accuracy || null,
          addressName: validated.addressName || "Approximate Finder Location",
          locationConsentAt: new Date(),
          locationExpiresAt,
          sharedByFinder: true,
          finderNote: validated.finderNote || null,
          finderContact: validated.finderContact || null,
        },
      });

      // 2. Log RecoveryEvent
      await tx.recoveryEvent.create({
        data: {
          petId: pet.id,
          recoveryCaseId: activeCase?.id || null,
          type: "LOCATION_SHARED",
          actorType: "FINDER",
          title: `📍 Finder Shared Location`,
          description: validated.addressName
            ? `Finder shared GPS location near ${validated.addressName} (Accuracy: ~${Math.round(validated.accuracy || 15)}m).`
            : `Finder shared precise GPS location.`,
          metadata: JSON.stringify({
            latitude: validated.latitude,
            longitude: validated.longitude,
            accuracy: validated.accuracy,
            addressName: validated.addressName,
            finderNote: validated.finderNote,
          }),
        },
      });

      return loc;
    });

    // 3. Enqueue Notification to Owner
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const dashboardUrl = `${appUrl}/dashboard/pets/${pet.id}`;

    await enqueueNotificationJob(
      pet.userId,
      "LOCATION_ALERT",
      {
        userId: pet.userId,
        petId: pet.id,
        petName: pet.name,
        type: "LOCATION_ALERT",
        title: `📍 FINDER LOCATION SHARED for ${pet.name}!`,
        body: `A finder has just pinned their location: ${validated.addressName || "GPS coordinates received"}. View the exact spot on your interactive recovery map.`,
        approximateLocation: validated.addressName || "Coordinates Shared",
        dashboardUrl,
      },
      `LOC_ALERT:${locationEvent.id}`
    );

    // Asynchronously dispatch
    processNotificationQueue(5).catch((err) =>
      console.error("[Queue Worker Async Error on Location Event]", err)
    );

    return NextResponse.json({
      success: true,
      message: `Your location has been shared securely with ${pet.name}'s owner.`,
      approximateArea: validated.addressName || "Location Received",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to share location";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
