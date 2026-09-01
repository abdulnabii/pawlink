import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin("analytics");

    const [
      totalUsers,
      totalPets,
      totalTags,
      totalScans,
      totalLostCases,
      resolvedRecoveryCases,
      scansWithLocation,
      allScans,
    ] = await Promise.all([
      db.user.count(),
      db.pet.count(),
      db.tag.count(),
      db.scanEvent.count(),
      db.recoveryCase.count(),
      db.recoveryCase.count({ where: { status: "RESOLVED" } }),
      db.locationEvent.count(),
      db.scanEvent.findMany({
        take: 200,
        select: { city: true, approximateLocation: true, deviceType: true, browser: true },
      }),
    ]);

    // City distribution
    const cityDist: Record<string, number> = {};
    const deviceDist: Record<string, number> = {};

    allScans.forEach((s: any) => {
      const city = s.city || s.approximateLocation || "Unknown Location";
      cityDist[city] = (cityDist[city] || 0) + 1;

      const device = s.deviceType || "Mobile";
      deviceDist[device] = (deviceDist[device] || 0) + 1;
    });

    const topCities = Object.entries(cityDist)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const topDevices = Object.entries(deviceDist)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Funnel Steps (Calibrated to represent true step-by-step conversion ratios)
    const funnel = [
      { step: "Registered Owners", count: totalUsers, rate: 100 },
      { step: "Created Pet Profile", count: totalPets, rate: totalUsers > 0 ? Math.min(100, Math.round((totalPets / totalUsers) * 100)) : 0 },
      { step: "Activated Collar Tag", count: totalTags, rate: totalPets > 0 ? Math.min(100, Math.round((totalTags / totalPets) * 100)) : 0 },
      { step: "QR Tag Scanned", count: totalScans, rate: totalTags > 0 ? Math.min(100, Math.round((totalScans / totalTags) * 100)) : 0 },
      { step: "Location Pinned", count: scansWithLocation, rate: totalScans > 0 ? Math.min(100, Math.round((scansWithLocation / totalScans) * 100)) : 0 },
      {
        step: "Pet Reunited",
        count: resolvedRecoveryCases,
        rate:
          totalLostCases > 0
            ? Math.min(100, Math.round((resolvedRecoveryCases / totalLostCases) * 100))
            : resolvedRecoveryCases > 0
            ? 100
            : 0,
      },
    ];

    return NextResponse.json({
      funnel,
      topCities,
      topDevices,
      totals: {
        totalUsers,
        totalPets,
        totalTags,
        totalScans,
        totalLostCases,
        totalRecoveries: resolvedRecoveryCases,
        recoveryRate:
          totalLostCases > 0
            ? Math.round((resolvedRecoveryCases / totalLostCases) * 100)
            : 100,
      },
    });
  } catch (err: unknown) {
    console.error("[Admin Analytics API Error]:", err);
    const message = err instanceof Error ? err.message : "Failed to load analytics";
    if (message.includes("FORBIDDEN") || message.includes("UNAUTHORIZED")) {
      const status = message.includes("FORBIDDEN") ? 403 : 401;
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json({
      error: "Unable to load analytics at this time. Please refresh.",
      funnel: [],
      topCities: [],
      topDevices: [],
      totals: { totalUsers: 0, totalPets: 0, totalTags: 0, totalScans: 0, totalRecoveries: 0 }
    }, { status: 500 });
  }
}
