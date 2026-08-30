import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateActivationPin, generateTagCode } from "@/lib/crypto";
import { getTagRecoveryUrl } from "@/lib/qr";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin("tags");
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim().toUpperCase();
    const statusFilter = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get("pageSize") || "20", 10)));
    const skip = (page - 1) * pageSize;

    const allTags = await db.tag.findMany({
      include: {
        assignments: {
          where: { unassignedAt: null },
          include: {
            pet: {
              select: {
                id: true,
                name: true,
                species: true,
                status: true,
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
          take: 1,
        },
        _count: { select: { scanEvents: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    let filtered = allTags;
    if (search) {
      filtered = filtered.filter(
        (t: any) =>
          t.tagCode?.includes(search) ||
          t.label?.toUpperCase().includes(search) ||
          t.assignments?.[0]?.pet?.name?.toUpperCase().includes(search)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((t: any) => t.status === statusFilter);
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + pageSize);

    return NextResponse.json({
      tags: sanitizePrisma(paginated),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load tags";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin("tags", true);
    const body = await req.json().catch(() => ({}));
    const { count = 1, label = "Collar Tag Batch" } = body;

    const generatedCount = Math.min(50, Math.max(1, count));
    const createdTags = [];

    for (let i = 0; i < generatedCount; i++) {
      const tagCode = generateTagCode();
      const activationPin = generateActivationPin();
      const qrUrl = getTagRecoveryUrl(tagCode);

      const tag = await db.tag.create({
        data: {
          tagCode,
          activationPin,
          qrUrl,
          label: `${label} #${i + 1}`,
          status: "ACTIVE",
        },
      });
      createdTags.push(tag);
    }

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: "TAGS_MANUFACTURED_BATCH",
        entityType: "TAG",
        entityId: createdTags[0]?.id || "batch",
        metadata: JSON.stringify({
          adminEmail: admin.email,
          batchSize: generatedCount,
          tagCodes: createdTags.map((t) => t.tagCode),
        }),
      },
    });

    return NextResponse.json({ success: true, createdCount: generatedCount, tags: sanitizePrisma(createdTags) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create tags";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
