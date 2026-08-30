"use client";

import React from "react";
import Link from "next/link";
import { Menu, Search, Shield, Bell, ArrowRight, ExternalLink } from "lucide-react";

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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Quick KPI pills */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5 text-teal-800 font-bold">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span>{scansToday} scans today</span>
          </div>

          {openRecoveryCount > 0 && (
            <div className="bg-red-50 border border-red-200 px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5 text-red-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>{openRecoveryCount} lost pet{openRecoveryCount === 1 ? "" : "s"}</span>
            </div>
          )}
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        )}
      </div>
    </header>
  );
}
