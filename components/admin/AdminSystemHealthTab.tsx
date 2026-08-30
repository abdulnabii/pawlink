"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  Cpu,
  Clock,
  RotateCw,
} from "lucide-react";

export function AdminSystemHealthTab() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = () => {
    setLoading(true);
    setError(null);

    fetch("/api/admin/system")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setHealth(data);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load system health");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const components = Array.isArray(health?.components) ? health.components : [];
  const metrics = health?.metrics || {};

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Status Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
            health?.status === "HEALTHY" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">System Infrastructure Health</h2>
            <p className="text-xs text-slate-400">
              Overall Status: <span className="font-bold text-emerald-700 uppercase">{health?.status || "HEALTHY"}</span> • Environment: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">{metrics.nodeEnv || "production"}</code>
            </p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <RotateCw className="w-4 h-4" /> Run Live Diagnostics
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-800 text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchHealth} className="underline hover:text-red-950">
            Try Again
          </button>
        </div>
      )}

      {/* Component Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map((comp: any) => (
          <div key={comp.name} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-900 truncate">{comp.name}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  comp.status === "HEALTHY"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {comp.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">{comp.description}</p>
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-2 border-t border-slate-100">
              <span>Latency</span>
              <span className="font-bold text-slate-700">{comp.latency}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
