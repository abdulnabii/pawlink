import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin("users");
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const roleFilter = searchParams.get("role") || "";
    const planFilter = searchParams.get("plan") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get("pageSize") || "20", 10)));
    const skip = (page - 1) * pageSize;

    const allUsers = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        subscriptions: {
          select: { plan: true, status: true },
          take: 1,
        },
        _count: {
          select: {
            pets: true,
            tagAssignments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let filtered = allUsers;
    if (search) {
      filtered = filtered.filter(
        (u: any) =>
          u.name?.toLowerCase().includes(search) ||
          u.email?.toLowerCase().includes(search) ||
          u.phone?.includes(search)
      );
    }

    if (roleFilter) {
      filtered = filtered.filter((u: any) => u.role === roleFilter);
    }

    if (planFilter) {
      filtered = filtered.filter((u: any) => {
        const p = u.subscriptions?.[0]?.plan || "FREE";
        return p === planFilter;
      });
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + pageSize);

    return NextResponse.json({
      users: sanitizePrisma(paginated),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load users";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
