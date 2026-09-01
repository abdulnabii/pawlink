import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdminEmail } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(req: NextRequest, { params }: { params: { id: string; photoId: string } }) {
  try {
    const user = await requireAuth();
    const isAdmin = user.role === "ADMIN" || isAdminEmail(user.email);
    const pet = await db.pet.findFirst({ where: isAdmin ? { id: params.id } : { id: params.id, userId: user.id } });
    if (!pet) return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    const photo = await db.petPhoto.findFirst({ where: { id: params.photoId, petId: params.id } });
    if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    await db.petPhoto.delete({ where: { id: params.photoId } });
    if (photo.isPrimary) {
      const next = await db.petPhoto.findFirst({ where: { petId: params.id }, orderBy: { createdAt: "desc" } });
      if (next) {
        await db.petPhoto.update({ where: { id: next.id }, data: { isPrimary: true } });
        await db.pet.update({ where: { id: params.id }, data: { photoUrl: next.url } });
      } else {
        await db.pet.update({ where: { id: params.id }, data: { photoUrl: null } });
      }
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string; photoId: string } }) {
  try {
    const user = await requireAuth();
    const isAdmin = user.role === "ADMIN" || isAdminEmail(user.email);
    const pet = await db.pet.findFirst({ where: isAdmin ? { id: params.id } : { id: params.id, userId: user.id } });
    if (!pet) return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    const photo = await db.petPhoto.findFirst({ where: { id: params.photoId, petId: params.id } });
    if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    await db.petPhoto.updateMany({ where: { petId: params.id }, data: { isPrimary: false } });
    await db.petPhoto.update({ where: { id: params.photoId }, data: { isPrimary: true } });
    await db.pet.update({ where: { id: params.id }, data: { photoUrl: photo.url } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}