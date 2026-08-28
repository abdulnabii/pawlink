import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const pet = await db.pet.findFirst({
      where: { id: params.id, userId: user.id },
      include: { recoveryCases: true },
    });

    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const caseIds = pet.recoveryCases.map((rc) => rc.id);

    // Purge all location events for this pet's recovery cases
    const deleted = await db.locationEvent.deleteMany({
      where: {
        recoveryCaseId: { in: caseIds },
      },
    });

    // Also log an AuditLog
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "PURGE_LOCATION_HISTORY",
        entityType: "PET",
        entityId: pet.id,
        metadata: JSON.stringify({ deletedCount: deleted.count }),
      },
    });

    return NextResponse.json({ success: true, deletedCount: deleted.count });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to purge location history";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
