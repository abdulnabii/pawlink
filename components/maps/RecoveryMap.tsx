"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Compass } from "lucide-react";

interface LocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  addressName?: string | null;
  createdAt: string;
  finderNote?: string | null;
}

interface RecoveryMapProps {
  lastSeenLat?: number | null;
  lastSeenLng?: number | null;
  lastSeenLocation?: string | null;
  locationEvents?: LocationPoint[];
  petName: string;
}

export function RecoveryMap({
  lastSeenLat,
  lastSeenLng,
  lastSeenLocation,
  locationEvents = [],
  petName,
}: RecoveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isSubscribed = true;

    // Dynamically import leaflet to prevent SSR issues
    import("leaflet").then((L) => {
      if (!isSubscribed || !mapContainerRef.current) return;

      try {
        // Fix leaflet default icon path issues
        const DefaultIcon = L.icon({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });
        L.Marker.prototype.options.icon = DefaultIcon;

        const primaryLat = locationEvents[0]?.latitude || lastSeenLat || 24.8138;
        const primaryLng = locationEvents[0]?.longitude || lastSeenLng || 67.0299;

        if (!mapInstanceRef.current) {
          if ((mapContainerRef.current as any)._leaflet_id) {
            delete (mapContainerRef.current as any)._leaflet_id;
          }
          const map = L.map(mapContainerRef.current).setView([primaryLat, primaryLng], 14);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(map);

          mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear existing layers
        map.eachLayer((layer: any) => {
          if (layer instanceof L.Marker || layer instanceof L.Circle) {
            map.removeLayer(layer);
          }
        });

        const bounds = L.latLngBounds([]);

        // 1. Plot Last Seen if available
        if (lastSeenLat && lastSeenLng) {
          const lastSeenMarker = L.marker([lastSeenLat, lastSeenLng], {
            icon: L.divIcon({
              className: "custom-div-icon",
              html: `
                <div style="background-color: #ef4444; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
                  📍
                </div>
              `,
              iconSize: [34, 34],
              iconAnchor: [17, 17],
            }),
          }).addTo(map);

          lastSeenMarker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 13px;">
              <strong style="color: #ef4444;">🚨 Owner Last Seen</strong><br/>
              <span>${lastSeenLocation || "Last reported area"}</span>
            </div>
          `);
          bounds.extend([lastSeenLat, lastSeenLng]);
        }

        // 2. Plot Finder Location Events
        locationEvents.forEach((loc, idx) => {
          const isLatest = idx === 0;

          const finderMarker = L.marker([loc.latitude, loc.longitude], {
            icon: L.divIcon({
              className: "custom-div-icon",
              html: `
                <div style="background-color: ${isLatest ? "#0d9488" : "#64748b"}; width: ${isLatest ? "36px" : "28px"}; height: ${isLatest ? "36px" : "28px"}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
                  🐾
                </div>
              `,
              iconSize: [isLatest ? 36 : 28, isLatest ? 36 : 28],
              iconAnchor: [isLatest ? 18 : 14, isLatest ? 18 : 14],
            }),
          }).addTo(map);

          // Accuracy Circle
          if (loc.accuracy) {
            L.circle([loc.latitude, loc.longitude], {
              radius: Math.min(loc.accuracy, 150),
              color: isLatest ? "#0d9488" : "#94a3b8",
              fillColor: isLatest ? "#0d9488" : "#94a3b8",
              fillOpacity: 0.15,
              weight: 1,
            }).addTo(map);
          }

          finderMarker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 13px;">
              <strong style="color: #0d9488;">📍 Finder Location ${isLatest ? "(Latest)" : ""}</strong><br/>
              <span>${loc.addressName || "Approximate Location"}</span><br/>
              <small style="color: #64748b;">${new Date(loc.createdAt).toLocaleTimeString()}</small>
              ${loc.finderNote ? `<p style="margin-top: 4px; font-style: italic;">"${loc.finderNote}"</p>` : ""}
            </div>
          `);

          bounds.extend([loc.latitude, loc.longitude]);
        });

        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
        }

        setMapLoaded(true);
      } catch (err) {
        console.warn("RecoveryMap notice:", err);
      }
    });

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, [lastSeenLat, lastSeenLng, lastSeenLocation, locationEvents]);

  const hasCoordinates = (lastSeenLat && lastSeenLng) || locationEvents.length > 0;

  return (
    <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-xl shadow-md border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2">
        <Navigation className="w-4 h-4 text-teal-600 animate-pulse" />
        <span>
          {locationEvents.length > 0
            ? `${locationEvents.length} Finder Location Point${locationEvents.length > 1 ? "s" : ""}`
            : lastSeenLocation
            ? `Last Seen: ${lastSeenLocation}`
            : `Recovery Radar for ${petName}`}
        </span>
      </div>

      {!hasCoordinates && (
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center p-6 text-center z-[400]">
          <div className="bg-white/95 p-4 rounded-xl shadow-lg border border-slate-200 max-w-xs">
            <Compass className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">Waiting for GPS Coordinates</p>
            <p className="text-xs text-slate-500 mt-1">
              When a finder shares their location or you set a last known area, it will appear here on this map.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
