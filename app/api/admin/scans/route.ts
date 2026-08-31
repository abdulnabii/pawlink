import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePrisma } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin("scans");
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get("pageSize") || "25", 10)));
    const skip = (page - 1) * pageSize;

    const [allScans, total] = await Promise.all([
      db.scanEvent.findMany({
        take: pageSize,
        skip,
        orderBy: { timestamp: "desc" },
        include: {
          tag: {
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
            },
          },
          recoveryCase: {
            select: { id: true, status: true, lastSeenLocation: true },
          },
        },
      }),
      db.scanEvent.count(),
    ]);

    // Heuristics for suspicious scanning patterns
    const ipCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    allScans.forEach((s: any) => {
      if (s.ipHash) ipCounts[s.ipHash] = (ipCounts[s.ipHash] || 0) + 1;
      if (s.tagId) tagCounts[s.tagId] = (tagCounts[s.tagId] || 0) + 1;
    });

    const enrichedScans = allScans.map((s: any) => {
      const isRapidFromSameIp = (ipCounts[s.ipHash] || 0) > 4;
      const isHighFrequencyTag = (tagCounts[s.tagId] || 0) > 6;
      return {
        ...s,
        isSuspicious: isRapidFromSameIp || isHighFrequencyTag,
        suspiciousReason: isRapidFromSameIp ? "Rapid scans from same IP" : isHighFrequencyTag ? "Unusually high tag scan frequency" : null,
      };
    });

    return NextResponse.json({
      scans: sanitizePrisma(enrichedScans),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    });
  } catch (err: unknown) {
    console.error("[Admin Scans API Error]:", err);
    const message = err instanceof Error ? err.message : "Failed to load scans";
    if (message.includes("FORBIDDEN") || message.includes("UNAUTHORIZED")) {
      const status = message.includes("FORBIDDEN") ? 403 : 401;
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json({
      error: "Unable to load scan activity at this time. Please refresh.",
      scans: [],
      pagination: { total: 0, page: 1, pageSize: 25, totalPages: 1 }
    }, { status: 500 });
  }
}
