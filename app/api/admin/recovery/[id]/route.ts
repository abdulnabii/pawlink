import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin("recovery", true);
    const body = await req.json().catch(() => ({}));
    const { status, resolutionNote, reason } = body;

    const existingCase = await db.recoveryCase.findUnique({
      where: { id: params.id },
      include: { pet: true },
    });

    if (!existingCase) {
      return NextResponse.json({ error: "Recovery case not found" }, { status: 404 });
    }

    const updatedCase = await db.recoveryCase.update({
      where: { id: params.id },
      data: {
        status: status || existingCase.status,
        resolutionNote: resolutionNote || existingCase.resolutionNote,
        resolvedAt: status === "RESOLVED" ? new Date() : existingCase.resolvedAt,
      },
    });

    if (status === "RESOLVED") {
      await db.pet.update({
        where: { id: existingCase.petId },
        data: { status: "SAFE" },
      });
    }

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: `RECOVERY_CASE_${status || "UPDATED"}`,
        entityType: "RECOVERY_CASE",
        entityId: params.id,
        metadata: JSON.stringify({
          adminEmail: admin.email,
          petId: existingCase.petId,
          petName: existingCase.pet.name,
          newStatus: status,
          resolutionNote,
          reason: reason || "Admin manual resolution",
        }),
      },
    });

    return NextResponse.json({ success: true, recoveryCase: sanitizePrisma(updatedCase) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update recovery case";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
