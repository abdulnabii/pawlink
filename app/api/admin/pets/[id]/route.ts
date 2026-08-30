import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin("pets");
    const pet = await db.pet.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        tagAssignments: {
          include: { tag: true },
        },
        medicalRecords: { orderBy: { createdAt: "desc" } },
        recoveryCases: {
          include: {
            recoveryEvents: { orderBy: { createdAt: "desc" } },
            scanEvents: { orderBy: { timestamp: "desc" }, take: 10 },
            locationEvents: { orderBy: { createdAt: "desc" }, take: 10 },
          },
          orderBy: { startedAt: "desc" },
        },
        conversations: {
          include: { messages: { take: 5, orderBy: { createdAt: "desc" } } },
        },
      },
    });

    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    return NextResponse.json({ pet: sanitizePrisma(pet) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load pet details";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin("pets", true);
    const body = await req.json().catch(() => ({}));
    const { status, reason } = body;

    const pet = await db.pet.findUnique({ where: { id: params.id } });
    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const updated = await db.pet.update({
      where: { id: params.id },
      data: { status: status || pet.status },
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: "PET_STATUS_CHANGED",
        entityType: "PET",
        entityId: params.id,
        metadata: JSON.stringify({
          adminEmail: admin.email,
          previousStatus: pet.status,
          newStatus: status,
          reason: reason || "Admin override",
        }),
      },
    });

    return NextResponse.json({ success: true, pet: sanitizePrisma(updated) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update pet";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
