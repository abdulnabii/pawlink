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
      totalRecoveries,
      scansWithLocation,
      allScans,
    ] = await Promise.all([
      db.user.count(),
      db.pet.count(),
      db.tag.count(),
      db.scanEvent.count(),
      db.pet.count({ where: { status: "RECOVERED" } }),
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

    // Funnel Steps
    const funnel = [
      { step: "Registered Owners", count: totalUsers, rate: 100 },
      { step: "Created Pet Profile", count: totalPets, rate: totalUsers > 0 ? Math.round((totalPets / totalUsers) * 100) : 0 },
      { step: "Activated Collar Tag", count: totalTags, rate: totalPets > 0 ? Math.round((totalTags / totalPets) * 100) : 0 },
      { step: "QR Tag Scanned", count: totalScans, rate: totalTags > 0 ? Math.min(100, Math.round((totalScans / totalTags) * 100)) : 0 },
      { step: "Location Pinned", count: scansWithLocation, rate: totalScans > 0 ? Math.round((scansWithLocation / totalScans) * 100) : 0 },
      { step: "Pet Reunited", count: totalRecoveries, rate: totalPets > 0 ? Math.round((totalRecoveries / totalPets) * 100) : 0 },
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
        totalRecoveries,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load analytics";
    const status = message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
