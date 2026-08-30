"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Smartphone,
  CheckCircle2,
  Users,
  Dog,
  QrCode,
  Activity,
} from "lucide-react";

export function AdminAnalyticsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = () => {
    setLoading(true);
    setError(null);

    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.error) {
          setError(resData.error);
        } else {
          setData(resData);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const funnel = Array.isArray(data?.funnel) ? data.funnel : [];
  const topCities = Array.isArray(data?.topCities) ? data.topCities : [];
  const topDevices = Array.isArray(data?.topDevices) ? data.topDevices : [];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Overview Title */}
      <div>
        <h2 className="text-base font-black text-slate-900">Platform Analytics &amp; Conversion Funnel</h2>
        <p className="text-xs text-slate-400">Holistic metrics tracking pet registration, QR collar tag activation, and recovery rates</p>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-800 text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchAnalytics} className="underline hover:text-red-950">
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
          Computing analytics and platform funnels...
        </div>
      ) : (
        <>
          {/* Recovery Funnel Progression Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Pet Recovery Platform Funnel</h3>
                <p className="text-xs text-slate-400">Step-by-step conversion from registration to safe pet reunion</p>
              </div>
              <span className="px-3 py-1 bg-teal-50 text-teal-800 font-bold text-xs rounded-full border border-teal-100">
                Live Data
              </span>
            </div>

            <div className="space-y-4">
              {funnel.map((step: any, idx: number) => (
                <div key={step.step} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">
                      {idx + 1}. {step.step}
                    </span>
                    <span className="text-slate-900 font-black">
                      {step.count?.toLocaleString()} ({step.rate}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, Math.min(100, step.rate))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Two Columns: City Distribution & Devices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Cities */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-900 mb-1">Geographic Scan Activity</h3>
              <p className="text-xs text-slate-400 mb-4">Top cities where PawLink collar tags are scanned</p>

              <div className="space-y-3">
                {topCities.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">No location data captured yet.</p>
                ) : (
                  topCities.map((c: any) => (
                    <div key={c.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold">
                      <div className="flex items-center gap-2 text-slate-800">
                        <MapPin className="w-4 h-4 text-teal-600" />
                        <span>{c.name}</span>
                      </div>
                      <span className="font-black text-slate-900">{c.count} scan{c.count === 1 ? "" : "s"}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Devices */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-900 mb-1">Finder Device Breakdown</h3>
              <p className="text-xs text-slate-400 mb-4">Operating systems used by finders when scanning collar tags</p>

              <div className="space-y-3">
                {topDevices.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">No device data captured yet.</p>
                ) : (
                  topDevices.map((d: any) => (
                    <div key={d.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold">
                      <div className="flex items-center gap-2 text-slate-800">
                        <Smartphone className="w-4 h-4 text-teal-600" />
                        <span>{d.name}</span>
                      </div>
                      <span className="font-black text-slate-900">{d.count} scan{d.count === 1 ? "" : "s"}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
