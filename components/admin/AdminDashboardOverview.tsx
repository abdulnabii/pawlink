"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Dog,
  QrCode,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  BellRing,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Activity,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface AdminDashboardOverviewProps {
  data: any;
  onNavigateTab: (tab: string) => void;
}

export function AdminDashboardOverview({ data, onNavigateTab }: AdminDashboardOverviewProps) {
  const kpi = data?.kpi || {};
  const alerts = Array.isArray(data?.alerts) ? data.alerts : [];
  const recentScans = Array.isArray(data?.recentScans) ? data.recentScans : [];
  const recentLostPets = Array.isArray(data?.recentLostPets) ? data.recentLostPets : [];
  const recentRecoveries = Array.isArray(data?.recentRecoveries) ? data.recentRecoveries : [];
  const recentUsers = Array.isArray(data?.recentUsers) ? data.recentUsers : [];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Operational Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-2.5">
          {alerts.map((alert: any) => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-sm ${
                alert.level === "URGENT"
                  ? "bg-red-50 border-red-200 text-red-900"
                  : alert.level === "WARNING"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-blue-50 border-blue-200 text-blue-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-5 h-5 shrink-0 ${
                  alert.level === "URGENT" ? "text-red-600" : alert.level === "WARNING" ? "text-amber-600" : "text-blue-600"
                }`} />
                <p className="text-xs sm:text-sm font-bold">{alert.message}</p>
              </div>
              {alert.actionTab && (
                <button
                  onClick={() => onNavigateTab(alert.actionTab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-colors shadow-sm ${
                    alert.level === "URGENT"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : alert.level === "WARNING"
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {alert.actionText || "Action"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Users</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {kpi.totalUsers?.toLocaleString() || 0}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Registered pet owners</p>
          </div>
        </div>

        {/* Active Pets */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Active Pets</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Dog className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {kpi.activePets?.toLocaleString() || 0}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{kpi.totalPets || 0} total registered</p>
          </div>
        </div>

        {/* Active Tags */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Active Tags</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {kpi.activeTags?.toLocaleString() || 0}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{kpi.totalTags || 0} manufactured</p>
          </div>
        </div>

        {/* Scans Today */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Scans Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {kpi.scansToday?.toLocaleString() || 0}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{kpi.totalScans || 0} lifetime scans</p>
          </div>
        </div>
      </div>

      {/* Secondary Recovery & Quality Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lost Pets */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-red-600">Currently Lost</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-3xl font-black text-red-600">{kpi.lostPets || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Broadcast in Lost Mode</p>
        </div>

        {/* Open Recovery Cases */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600">Open Cases</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-slate-900">{kpi.openRecoveryCases || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Active investigations</p>
        </div>

        {/* Recovered This Month */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-600">Recovered (MTD)</span>
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-3xl font-black text-teal-600">{kpi.recoveredThisMonth || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">{kpi.recoveredPets || 0} lifetime safe reunions</p>
        </div>

        {/* Recovery Rate % */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-5 rounded-3xl text-white shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-100">Recovery Rate</span>
            <TrendingUp className="w-4 h-4 text-teal-200" />
          </div>
          <div className="mt-2">
            <p className="text-3xl font-black tracking-tight">{kpi.recoveryRate || 100}%</p>
            <p className="text-[10px] text-teal-100 mt-0.5">Reunited / (Reunited + Lost)</p>
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Scans & Lost Mode Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scans Stream */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Live QR Scan Activity</h3>
              <p className="text-xs text-slate-400">Real-time tag scans across all registered collars</p>
            </div>
            <button
              onClick={() => onNavigateTab("scans")}
              className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentScans.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-medium">
                No scan events recorded yet.
              </div>
            ) : (
              recentScans.slice(0, 5).map((scan: any) => {
                const pet = scan.tag?.assignments?.[0]?.pet;
                return (
                  <div
                    key={scan.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                        <QrCode className="w-4 h-4 text-teal-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">
                          {pet ? pet.name : scan.tag?.tagCode || "Unknown Tag"}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {scan.approximateLocation || "Direct Scan"} • {scan.deviceType || "Mobile"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(scan.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active Lost Mode Incidents */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Active Lost Pet Alerts</h3>
              <p className="text-xs text-slate-400">Emergency cases currently broadcast in Lost Mode</p>
            </div>
            <button
              onClick={() => onNavigateTab("recovery")}
              className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
            >
              Emergency Console <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentLostPets.length === 0 ? (
              <div className="py-8 text-center text-teal-600 text-xs font-bold bg-teal-50 rounded-2xl border border-teal-100">
                🎉 No lost pets currently reported. All animals are safe!
              </div>
            ) : (
              recentLostPets.slice(0, 5).map((pet: any) => (
                <div
                  key={pet.id}
                  className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 font-black flex items-center justify-center shrink-0">
                      <Dog className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-red-950 truncate">{pet.name}</p>
                      <p className="text-[10px] text-red-700 truncate">
                        Owner: {pet.user?.name} ({pet.user?.phone || pet.user?.email})
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-red-600 text-white font-black text-[9px] uppercase tracking-wider shrink-0">
                    LOST
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Users Joined */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Recent User Registrations</h3>
            <p className="text-xs text-slate-400">Newly registered pet owners on PawLink</p>
          </div>
          <button
            onClick={() => onNavigateTab("users")}
            className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"
          >
            Manage Users <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentUsers.slice(0, 6).map((u: any) => (
            <div key={u.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <p className="font-bold text-slate-900 truncate">{u.name || "Pet Owner"}</p>
              <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                  {u._count?.pets || 0} Pet{u._count?.pets === 1 ? "" : "s"}
                </span>
                <span className="text-slate-400">
                  {new Date(u.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
