import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin("pets");
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const statusFilter = searchParams.get("status") || "";
    const speciesFilter = searchParams.get("species") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get("pageSize") || "20", 10)));
    const skip = (page - 1) * pageSize;

    const allPets = await db.pet.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        tagAssignments: {
          where: { unassignedAt: null },
          include: { tag: true },
          take: 1,
        },
        recoveryCases: {
          where: { status: "OPEN" },
          take: 1,
        },
        _count: {
          select: { recoveryEvents: true, conversations: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    let filtered = allPets;
    if (search) {
      filtered = filtered.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(search) ||
          p.breed?.toLowerCase().includes(search) ||
          p.user?.name?.toLowerCase().includes(search) ||
          p.user?.email?.toLowerCase().includes(search) ||
          p.tagAssignments?.[0]?.tag?.tagCode?.toLowerCase().includes(search)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((p: any) => p.status === statusFilter);
    }

    if (speciesFilter) {
      filtered = filtered.filter((p: any) => p.species?.toLowerCase() === speciesFilter.toLowerCase());
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + pageSize);

    // Fallback hydration for user if not populated
    for (const p of paginated as any[]) {
      if (!p.user && p.userId) {
        const u = await db.user.findUnique({ where: { id: p.userId } });
        if (u) {
          p.user = { id: u.id, name: u.name, email: u.email, phone: u.phone };
        }
      }
    }

    return NextResponse.json({
      pets: sanitizePrisma(paginated),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    });
  } catch (err: unknown) {
    console.error("[Admin Pets API Error]:", err);
    const message = err instanceof Error ? err.message : "Failed to load pets";
    if (message.includes("FORBIDDEN") || message.includes("UNAUTHORIZED")) {
      const status = message.includes("FORBIDDEN") ? 403 : 401;
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json({
      error: "Unable to load pets at this time. Please refresh.",
      pets: [],
      pagination: { total: 0, page: 1, pageSize: 20, totalPages: 1 }
    }, { status: 500 });
  }
}
