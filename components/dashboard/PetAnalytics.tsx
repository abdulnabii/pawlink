"use client";

import { useState, useEffect } from "react";
import { BarChart2, MapPin, Smartphone, Monitor, Globe, TrendingUp, MessageSquare, QrCode } from "lucide-react";

interface AnalyticsData {
  totalScans: number;
  scansLast30Days: number;
  lastScannedAt?: string;
  totalMessages: number;
  dailyScans: { date: string; count: number }[];
  deviceBreakdown: Record<string, number>;
  topLocations: { location: string; count: number }[];
}

export default function PetAnalytics({ petId }: { petId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pets/${petId}/analytics`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [petId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const maxDaily = Math.max(...data.dailyScans.map((d) => d.count), 1);
  const last14 = data.dailyScans.slice(-14);

  const deviceColors: Record<string, string> = {
    iOS: "bg-blue-500", Android: "bg-green-500", macOS: "bg-purple-500",
    Windows: "bg-yellow-500", Unknown: "bg-slate-400",
  };

  const totalDeviceScans = Object.values(data.deviceBreakdown).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<QrCode className="w-5 h-5 text-teal-600" />} label="Total Scans" value={data.totalScans} bg="bg-teal-50" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-blue-600" />} label="Last 30 Days" value={data.scansLast30Days} bg="bg-blue-50" />
        <StatCard icon={<MessageSquare className="w-5 h-5 text-purple-600" />} label="Finder Messages" value={data.totalMessages} bg="bg-purple-50" />
        <StatCard
          icon={<Globe className="w-5 h-5 text-orange-600" />}
          label="Last Scanned"
          value={data.lastScannedAt ? new Date(data.lastScannedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Never"}
          bg="bg-orange-50"
          isText
        />
      </div>

      {/* Daily Scan Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-slate-600" />
          <h4 className="text-sm font-bold text-slate-800">Scans — Last 14 Days</h4>
        </div>
        <div className="flex items-end gap-1 h-24">
          {last14.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-teal-500 rounded-t-md transition-all hover:bg-teal-600"
                style={{ height: `${Math.max((d.count / maxDaily) * 100, d.count > 0 ? 8 : 2)}%` }}
                title={`${d.date}: ${d.count} scan${d.count !== 1 ? "s" : ""}`}
              />
              <span className="text-[9px] text-slate-400 rotate-45 origin-left hidden sm:block">
                {new Date(d.date).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Device Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-slate-600" />
            <h4 className="text-sm font-bold text-slate-800">Device Types</h4>
          </div>
          {Object.entries(data.deviceBreakdown).length === 0 ? (
            <p className="text-xs text-slate-400">No data yet</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(data.deviceBreakdown).map(([device, count]) => (
                <div key={device}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">{device}</span>
                    <span className="text-slate-400">{count} ({Math.round((count / totalDeviceScans) * 100)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${deviceColors[device] || "bg-slate-400"}`}
                      style={{ width: `${(count / totalDeviceScans) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Locations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-slate-600" />
            <h4 className="text-sm font-bold text-slate-800">Top Scan Locations</h4>
          </div>
          {data.topLocations.length === 0 ? (
            <p className="text-xs text-slate-400">No location data yet</p>
          ) : (
            <ol className="space-y-2">
              {data.topLocations.map((loc, i) => (
                <li key={loc.location} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-xs text-slate-700 flex-1 truncate">{loc.location}</span>
                  <span className="text-xs font-bold text-slate-400">{loc.count}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg, isText = false }: {
  icon: React.ReactNode; label: string; value: number | string; bg: string; isText?: boolean;
}) {
  return (
    <div className={`${bg} rounded-2xl p-4 border border-white`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-black text-slate-900">{isText ? value : Number(value).toLocaleString()}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
