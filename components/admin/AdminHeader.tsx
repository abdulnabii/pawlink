"use client";

import React from "react";
import Link from "next/link";
import { Menu, Search, Shield, Bell, ArrowRight, ExternalLink, Lock, RotateCw, CheckCircle2 } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  adminRole: string;
  scansToday?: number;
  openRecoveryCount?: number;
  setMobileOpen: (open: boolean) => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function AdminHeader({
  title,
  subtitle,
  adminRole,
  scansToday = 0,
  openRecoveryCount = 0,
  setMobileOpen,
  searchQuery,
  setSearchQuery,
  onRefresh,
  loading = false,
}: AdminHeaderProps) {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] transition-all">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all duration-200 active:scale-95"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium hidden sm:block mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quick KPI pills */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="bg-teal-50/90 border border-teal-200/80 px-3 py-1 rounded-full text-xs flex items-center gap-2 text-teal-800 font-bold shadow-xs hover:border-teal-300 transition-all">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span>{scansToday} scans today</span>
          </div>

          {openRecoveryCount > 0 && (
            <div className="bg-red-50 border border-red-200/90 px-3 py-1 rounded-full text-xs flex items-center gap-1.5 text-red-800 font-bold shadow-xs hover:border-red-300 transition-all animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>{openRecoveryCount} lost pet{openRecoveryCount === 1 ? "" : "s"}</span>
            </div>
          )}
        </div>

        {/* 2FA Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50/90 border border-emerald-200/80 px-3 py-1 rounded-full text-xs font-bold text-emerald-800 shadow-xs hover:border-emerald-300 transition-all">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>2FA Verified</span>
        </div>

        {/* Lock Console Button */}
        <button
          type="button"
          onClick={async () => {
            if (confirm("Lock Admin Console? You will need to enter a new 2FA code to regain access.")) {
              await fetch("/api/auth/admin-2fa/logout", { method: "POST" });
              window.location.reload();
            }
          }}
          title="Lock Admin Console"
          className="group px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 hover:border-red-200 border border-slate-200/80 text-xs font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 shadow-xs"
        >
          <Lock className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-600 transition-colors" />
          <span>Lock</span>
        </button>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="group px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-sm hover:shadow-md hover:shadow-teal-500/20 disabled:opacity-50 flex items-center gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : "transition-transform duration-500 group-hover:rotate-180"}`} />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        )}
      </div>
    </header>
  );
}
