import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const pet = await db.pet.findFirst({ where: { id: params.id, userId: user.id } });
    if (!pet) return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    const photos = await db.petPhoto.findMany({
      where: { petId: params.id },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ photos });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const pet = await db.pet.findFirst({ where: { id: params.id, userId: user.id } });
    if (!pet) return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    const body = await req.json();
    const { url, caption, isPrimary } = body;
    if (!url || typeof url !== "string") return NextResponse.json({ error: "Photo URL required" }, { status: 400 });
    if (isPrimary) {
      await db.petPhoto.updateMany({ where: { petId: params.id }, data: { isPrimary: false } });
      await db.pet.update({ where: { id: params.id }, data: { photoUrl: url } });
    }
    const photo = await db.petPhoto.create({
      data: { petId: params.id, url, caption: caption?.trim() || null, isPrimary: Boolean(isPrimary) },
    });
    return NextResponse.json({ success: true, photo }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}