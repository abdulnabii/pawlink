"use client";

import { useState, useEffect } from "react";
import { MapPin, Clock, Smartphone, Monitor, Globe } from "lucide-react";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./LeafletMapInner"), { ssr: false, loading: () => (
  <div className="h-64 bg-slate-100 rounded-2xl flex items-center justify-center">
    <div className="text-slate-400 text-sm">Loading map…</div>
  </div>
)});

interface ScanEvent {
  id: string;
  timestamp: string;
  approximateLocation?: string;
  city?: string;
  country?: string;
  deviceType?: string;
  browser?: string;
  scanSource?: string;
}

export default function ScanLocationMap({ petId }: { petId: string }) {
  const [scans, setScans] = useState<ScanEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pets/${petId}/scans`)
      .then((r) => r.json())
      .then((d) => setScans(d.scans || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [petId]);

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

  const getDeviceIcon = (deviceType?: string) => {
    if (!deviceType) return <Globe className="w-3 h-3" />;
    const d = deviceType.toLowerCase();
    if (d.includes("ios") || d.includes("android") || d.includes("mobile")) return <Smartphone className="w-3 h-3" />;
    return <Monitor className="w-3 h-3" />;
  };

  if (loading) {
    return (
      <div className="h-48 bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-slate-400 text-sm">Loading scan data…</span>
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
        <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No scan events recorded yet.</p>
        <p className="text-xs text-slate-400 mt-1">When someone scans this tag, locations will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LeafletMap scans={scans} />
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {scans.slice(0, 20).map((scan) => (
          <div key={scan.id} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl text-xs">
            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
              {getDeviceIcon(scan.deviceType)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate">
                {scan.approximateLocation || scan.city || scan.country || "Unknown location"}
              </p>
              <div className="flex items-center gap-2 text-slate-400 mt-0.5">
                <Clock className="w-3 h-3" />
                <span>{formatTime(scan.timestamp)}</span>
                {scan.deviceType && <span>· {scan.deviceType}</span>}
              </div>
            </div>
            <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium shrink-0">
              {scan.scanSource || "QR"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
