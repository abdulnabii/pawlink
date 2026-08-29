import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { resilientStore } from "@/lib/store";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET() {
  try {
    await requireAdmin();

    const metrics = resilientStore.getMetrics();
    const users = await resilientStore.getAllUsersForAdmin();
    const pets = await resilientStore.getAllPetsForAdmin();
    const tags = await resilientStore.getAllTagsForAdmin();
    const recentScans = resilientStore.getRecentScans(20);

    return NextResponse.json({
      metrics: sanitizePrisma(metrics),
      users: sanitizePrisma(users),
      pets: sanitizePrisma(pets),
      tags: sanitizePrisma(tags),
      scans: sanitizePrisma(recentScans),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Admin access forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
