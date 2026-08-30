"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, ShieldAlert, ArrowLeft } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminDashboardOverview } from "@/components/admin/AdminDashboardOverview";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminPetsTab } from "@/components/admin/AdminPetsTab";
import { AdminTagsTab } from "@/components/admin/AdminTagsTab";
import { AdminScansTab } from "@/components/admin/AdminScansTab";
import { AdminRecoveryTab } from "@/components/admin/AdminRecoveryTab";
import { AdminMessagesTab } from "@/components/admin/AdminMessagesTab";
import { AdminNotificationsTab } from "@/components/admin/AdminNotificationsTab";
import { AdminSubscriptionsTab } from "@/components/admin/AdminSubscriptionsTab";
import { AdminReportsTab } from "@/components/admin/AdminReportsTab";
import { AdminAnalyticsTab } from "@/components/admin/AdminAnalyticsTab";
import { AdminSystemHealthTab } from "@/components/admin/AdminSystemHealthTab";
import { AdminAnnouncementsTab } from "@/components/admin/AdminAnnouncementsTab";
import { AdminSupportTab } from "@/components/admin/AdminSupportTab";
import { AdminAuditLogsTab } from "@/components/admin/AdminAuditLogsTab";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";
import { hasAdminPermission } from "@/lib/permissions";

function AdminPortalInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "dashboard";

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Authentication & Session
  const [adminUser, setAdminUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Metrics & Global Counters
  const [metricsData, setMetricsData] = useState<any | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Sync tab with URL
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    window.history.replaceState({}, "", url.toString());
  };

  const fetchMetrics = () => {
    setMetricsLoading(true);
    fetch("/api/admin/metrics")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          if (data.error.includes("UNAUTHORIZED") || data.error.includes("FORBIDDEN")) {
            setAuthError(data.error);
          }
        } else {
          setMetricsData(data);
        }
      })
      .catch(() => {})
      .finally(() => setMetricsLoading(false));
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          setAuthError("You must be logged in with an authorized Administrator account to access this portal.");
          setAuthLoading(false);
          return;
        }

        const role = data.user.role;
        const isAdminRole = ["SUPER_ADMIN", "ADMIN", "SUPPORT", "MODERATOR", "ANALYST"].includes(role);

        if (!isAdminRole) {
          setAuthError("FORBIDDEN: Your account does not have administrative privileges.");
          setAuthLoading(false);
          return;
        }

        setAdminUser(data.user);
        setAuthLoading(false);
        fetchMetrics();
      })
      .catch((err) => {
        setAuthError(err instanceof Error ? err.message : "Authentication verification failed");
        setAuthLoading(false);
      });
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-300">Verifying Administrative Credentials...</p>
        <p className="text-xs text-slate-500 mt-1">Connecting to PawLink Operations Console</p>
      </div>
    );
  }

  if (authError || !adminUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xl space-y-4 animate-fadeIn">
          <div className="w-14 h-14 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Administrator Access Required</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {authError || "The Platform Operations and Telemetry Console is restricted to authorized Administrator personnel."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
            >
              Sign In with Admin Account
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Return to User Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const role = adminUser.role || "ADMIN";
  const kpi = metricsData?.kpi || {};

  const titles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: "Operations Overview", subtitle: "Real-time key performance indicators, active alerts, and recent telemetry" },
    users: { title: "User Management", subtitle: "Inspect user accounts, manage subscription tiers, and audit role permissions" },
    pets: { title: "Pet Registry", subtitle: "Database of registered animals, medical alert tags, and emergency status flags" },
    tags: { title: "Collar QR Inventory", subtitle: "Manufacturing, batch generation, activation, and hardware security revocation" },
    scans: { title: "Live Scan Telemetry", subtitle: "Real-time collar scan log stream, geolocations, and suspicious traffic alerts" },
    recovery: { title: "Emergency Recovery Console", subtitle: "Command console for lost pet incidents, finder communications, and reunions" },
    messages: { title: "Message Moderation", subtitle: "Inspect finder-to-owner conversations and protect community safety" },
    notifications: { title: "Notification Queue", subtitle: "Asynchronous background dispatch stream, failure rates, and retry worker" },
    subscriptions: { title: "Subscriptions & Bank Verification", subtitle: "Meezan Bank Raast payment receipt inspection and plan activations" },
    reports: { title: "Reports & Moderation", subtitle: "Triage flagged profiles, spam incidents, and abusive content" },
    analytics: { title: "Platform Analytics", subtitle: "Growth trends, geographic distributions, and pet recovery funnels" },
    system: { title: "System Infrastructure Health", subtitle: "Live component latencies, PostgreSQL connections, and service health" },
    announcements: { title: "Broadcast Announcements", subtitle: "Create and publish targeted dashboard banners for pet owners" },
    support: { title: "Support Help Desk", subtitle: "Triage owner assistance inquiries and hardware tag help tickets" },
    audit: { title: "Immutable Audit Trail", subtitle: "Cryptographically verifiable log of all administrative actions and overrides" },
    settings: { title: "System Settings & Flags", subtitle: "Dynamic operational switches and runtime configurations" },
  };

  const currentHeader = titles[activeTab] || { title: "Operations Console", subtitle: "PawLink Platform Administration" };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans antialiased text-slate-900">
      {/* Role-Aware Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        adminRole={role}
        adminEmail={adminUser.email}
        adminName={adminUser.name}
        openRecoveryCount={kpi.openRecoveryCases || 0}
        failedJobsCount={kpi.failedNotifications || 0}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Operations Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        {/* Sticky Dynamic Header */}
        <AdminHeader
          title={currentHeader.title}
          subtitle={currentHeader.subtitle}
          adminRole={role}
          scansToday={kpi.scansToday || 0}
          openRecoveryCount={kpi.openRecoveryCases || 0}
          setMobileOpen={setMobileOpen}
          onRefresh={fetchMetrics}
          loading={metricsLoading}
        />

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === "dashboard" && (
            <AdminDashboardOverview data={metricsData} onNavigateTab={handleTabChange} />
          )}
          {activeTab === "users" && <AdminUsersTab adminRole={role} />}
          {activeTab === "pets" && <AdminPetsTab adminRole={role} />}
          {activeTab === "tags" && <AdminTagsTab adminRole={role} />}
          {activeTab === "scans" && <AdminScansTab />}
          {activeTab === "recovery" && <AdminRecoveryTab adminRole={role} />}
          {activeTab === "messages" && <AdminMessagesTab />}
          {activeTab === "notifications" && <AdminNotificationsTab />}
          {activeTab === "subscriptions" && <AdminSubscriptionsTab />}
          {activeTab === "reports" && <AdminReportsTab />}
          {activeTab === "analytics" && <AdminAnalyticsTab />}
          {activeTab === "system" && <AdminSystemHealthTab />}
          {activeTab === "announcements" && <AdminAnnouncementsTab />}
          {activeTab === "support" && <AdminSupportTab />}
          {activeTab === "audit" && <AdminAuditLogsTab />}
          {activeTab === "settings" && <AdminSettingsTab adminRole={role} />}
        </main>
      </div>
    </div>
  );
}

export default function AdminPortalMasterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-300">Loading PawLink Operations Console...</p>
        </div>
      }
    >
      <AdminPortalInner />
    </Suspense>
  );
}
