"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Dog,
  QrCode,
  MapPin,
  AlertTriangle,
  MessageSquare,
  BellRing,
  CreditCard,
  ShieldAlert,
  BarChart3,
  Activity,
  Megaphone,
  LifeBuoy,
  FileText,
  Settings,
  ArrowLeft,
  X,
  Shield,
} from "lucide-react";
import { hasAdminPermission, AdminSection } from "@/lib/permissions";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  adminRole: string;
  adminEmail: string;
  adminName: string;
  unreadReportsCount?: number;
  openRecoveryCount?: number;
  failedJobsCount?: number;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function AdminSidebar({
  activeTab,
  setActiveTab,
  adminRole,
  adminEmail,
  adminName,
  unreadReportsCount = 0,
  openRecoveryCount = 0,
  failedJobsCount = 0,
  mobileOpen,
  setMobileOpen,
}: AdminSidebarProps) {
  const menuItems: {
    id: string;
    label: string;
    icon: React.ElementType;
    section: AdminSection;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, section: "dashboard" },
    { id: "users", label: "Users", icon: Users, section: "users" },
    { id: "pets", label: "Pets", icon: Dog, section: "pets" },
    { id: "tags", label: "Collar Tags", icon: QrCode, section: "tags" },
    { id: "scans", label: "Scan Activity", icon: MapPin, section: "scans" },
    {
      id: "recovery",
      label: "Recovery Console",
      icon: AlertTriangle,
      section: "recovery",
      badge: openRecoveryCount > 0 ? openRecoveryCount : undefined,
      badgeColor: "bg-red-500 text-white",
    },
    { id: "messages", label: "Messages", icon: MessageSquare, section: "messages" },
    {
      id: "notifications",
      label: "Notifications",
      icon: BellRing,
      section: "notifications",
      badge: failedJobsCount > 0 ? failedJobsCount : undefined,
      badgeColor: "bg-amber-500 text-white",
    },
    { id: "subscriptions", label: "Subscriptions", icon: CreditCard, section: "subscriptions" },
    {
      id: "reports",
      label: "Reports & Moderation",
      icon: ShieldAlert,
      section: "reports",
      badge: unreadReportsCount > 0 ? unreadReportsCount : undefined,
      badgeColor: "bg-purple-500 text-white",
    },
    { id: "analytics", label: "Analytics", icon: BarChart3, section: "analytics" },
    { id: "system", label: "System Health", icon: Activity, section: "system" },
    { id: "announcements", label: "Announcements", icon: Megaphone, section: "announcements" },
    { id: "support", label: "Support Tickets", icon: LifeBuoy, section: "support" },
    { id: "audit", label: "Audit Logs", icon: FileText, section: "audit" },
    { id: "settings", label: "Admin Settings", icon: Settings, section: "settings" },
  ];

  const visibleItems = menuItems.filter((item) =>
    hasAdminPermission(adminRole, item.section, false)
  );

  const roleColor =
    adminRole === "SUPER_ADMIN"
      ? "bg-purple-100 text-purple-800 border-purple-300"
      : adminRole === "ADMIN"
      ? "bg-teal-100 text-teal-800 border-teal-300"
      : adminRole === "SUPPORT"
      ? "bg-blue-100 text-blue-800 border-blue-300"
      : adminRole === "MODERATOR"
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : "bg-slate-100 text-slate-800 border-slate-300";

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-slate-900 shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-white text-base tracking-tight block">PAWLINK</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400 block -mt-1">
              Operations Console
            </span>
          </div>
        </div>
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Admin User Pill */}
      <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-teal-700/60 border border-teal-500/40 flex items-center justify-center font-black text-teal-200 text-xs shrink-0">
            {adminName?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{adminName || "Admin User"}</p>
            <p className="text-[10px] text-slate-400 truncate">{adminEmail}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${roleColor}`}>
            {adminRole || "ADMIN"}
          </span>
          <Link
            href="/dashboard"
            className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> App View
          </Link>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 custom-scrollbar">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-teal-500 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    item.badgeColor || "bg-slate-700 text-white"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
        <span>PawLink Ops v2.4</span>
        <span className="text-teal-400 font-mono">LIVE</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
