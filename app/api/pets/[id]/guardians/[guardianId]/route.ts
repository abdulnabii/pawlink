import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; guardianId: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await import("@/lib/db");
    const pet = await db.pet.findUnique({ where: { id: params.id } });
    if (!pet || pet.userId !== session.id) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    await db.familyMember.delete({ where: { id: params.guardianId } }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to remove guardian";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
