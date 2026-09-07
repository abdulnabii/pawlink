"use client";

import { useEffect } from "react";

interface ScanEvent {
  id: string;
  timestamp: string;
  approximateLocation?: string;
  city?: string;
  country?: string;
  deviceType?: string;
}

export default function LeafletMapInner({ scans }: { scans: ScanEvent[] }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Dynamically load Leaflet
    import("leaflet").then((L) => {
      const existing = (document.getElementById("scan-map") as any)?.__leaflet_map;
      if (existing) { existing.remove(); }

      const map = L.default.map("scan-map", { zoom: 10, scrollWheelZoom: false });
      (document.getElementById("scan-map") as any).__leaflet_map = map;

      L.default.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const markerIcon = L.default.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;background:#0d9488;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px;">🐾</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      // Karachi default center if no coords
      let hasCoords = false;
      const bounds: [number, number][] = [];

      // Since ScanEvents don't store lat/lon, use geocoded approximation mock markers
      // Real implementation: ScanEvent model can be extended with lat/lon in a future migration
      const locationGroups: Record<string, number> = {};
      for (const scan of scans) {
        const key = scan.approximateLocation || scan.city || scan.country || "Unknown";
        locationGroups[key] = (locationGroups[key] || 0) + 1;
      }

      // Display generic marker at center with count since we don't have precise coords
      const centerLat = 24.8607; const centerLng = 67.0011;
      let offset = 0;
      for (const [location, count] of Object.entries(locationGroups)) {
        const lat = centerLat + (offset * 0.05);
        const lng = centerLng + (offset * 0.05);
        bounds.push([lat, lng]);
        hasCoords = true;

        const marker = L.default.marker([lat, lng], { icon: markerIcon }).addTo(map);
        marker.bindPopup(
          `<strong>${location}</strong><br>${count} scan${count > 1 ? "s" : ""}`
        );
        offset++;
      }

      if (hasCoords && bounds.length > 0) {
        if (bounds.length === 1) {
          map.setView(bounds[0], 12);
        } else {
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      } else {
        map.setView([centerLat, centerLng], 12);
      }

      return () => { map.remove(); };
    });
  }, [scans]);

  return <div id="scan-map" className="h-64 rounded-2xl overflow-hidden z-0" />;
}
