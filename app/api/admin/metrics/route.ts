import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { resilientStore } from "@/lib/store";

export async function GET() {
  try {
    await requireAdmin();

    const metrics = resilientStore.getMetrics();
    const users = resilientStore.getAllUsersForAdmin();
    const pets = resilientStore.getAllPetsForAdmin();
    const tags = resilientStore.getAllTagsForAdmin();
    const recentScans = resilientStore.getRecentScans(20);

    return NextResponse.json({
      metrics,
      users,
      pets,
      tags,
      recentScans,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Admin access forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
