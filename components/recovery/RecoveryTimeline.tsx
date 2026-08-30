"use client";

import {
  QrCode,
  MapPin,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Tag,
} from "lucide-react";

export interface RecoveryEventItem {
  id: string;
  type: string;
  actorType: string;
  title: string;
  description: string | null;
  metadata?: any;
  createdAt: string;
}

interface RecoveryTimelineProps {
  events: RecoveryEventItem[];
  petName: string;
}

function formatTimelineDate(dateVal: any) {
  if (!dateVal) return "Recent";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "Recent";
    return (
      d.toLocaleDateString([], { month: "short", day: "numeric" }) +
      ", " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return "Recent";
  }
}

export function RecoveryTimeline({ events, petName }: RecoveryTimelineProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case "TAG_SCANNED":
        return <QrCode className="w-4 h-4 text-teal-600" />;
      case "LOCATION_SHARED":
        return <MapPin className="w-4 h-4 text-emerald-600" />;
      case "MESSAGE_RECEIVED":
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      case "LOST_MODE_ACTIVATED":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "PET_RECOVERED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "TAG_ACTIVATED":
      case "TAG_REASSIGNED":
        return <Tag className="w-4 h-4 text-slate-600" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-teal-600" />;
    }
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case "LOST_MODE_ACTIVATED":
        return "bg-red-50 border-red-200 text-red-700";
      case "PET_RECOVERED":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "LOCATION_SHARED":
        return "bg-teal-50 border-teal-200 text-teal-700";
      case "MESSAGE_RECEIVED":
        return "bg-indigo-50 border-indigo-200 text-indigo-700";
      default:
        return "bg-slate-50 border-slate-200 text-slate-700";
    }
  };

  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-800">No Recovery Events Logged Yet</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Whenever someone scans {petName}&apos;s tag, shares their location, or sends a message, it will be chronologically recorded here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <span>Recovery Timeline &amp; Audit Feed</span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time chronological log of scans, location pins, and finder interactions.
          </p>
        </div>
        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
          {events.length} Event{events.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {events.map((event) => {
          return (
            <div key={event.id} className="relative group">
              {/* Timeline marker */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center group-hover:border-teal-500 transition-colors">
                <div className="w-2 h-2 rounded-full bg-slate-400 group-hover:bg-teal-500 transition-colors" />
              </div>

              {/* Event Content Box */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${getEventBadgeColor(event.type)}`}>
                      {getEventIcon(event.type)}
                      <span>{event.title}</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                      {event.actorType}
                    </span>
                  </div>
                  <span suppressHydrationWarning className="text-xs text-slate-500 font-medium">
                    {formatTimelineDate(event.createdAt)}
                  </span>
                </div>

                {event.description && (
                  <p className="text-xs text-slate-700 leading-relaxed mt-1">
                    {event.description}
                  </p>
                )}

                {/* Additional metadata tags if present */}
                {event.metadata?.deviceType && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                    <span>Device: <strong>{event.metadata.deviceType}</strong></span>
                    {event.metadata.accuracy && (
                      <span>• GPS Accuracy: <strong>~{Math.round(event.metadata.accuracy)}m</strong></span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
