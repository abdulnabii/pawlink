"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  Lock,
  Building,
  Key,
} from "lucide-react";
import { BANK_PAYMENT_CONFIG } from "@/lib/plans";

interface AdminSettingsTabProps {
  adminRole: string;
}

export function AdminSettingsTab({ adminRole }: AdminSettingsTabProps) {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const defaultFlags = [
    { key: "WHATSAPP_ALERTS", name: "WhatsApp Scan & Recovery Notifications", description: "Dispatches real-time WhatsApp alerts when QR tags are scanned", enabled: true },
    { key: "NFC_SUPPORT", name: "NFC Collar Tag Reading & Redirection", description: "Enables instant 1-tap recovery via NFC-enabled smartphone tags", enabled: true },
    { key: "GPS_RECOVERY", name: "High-Precision Browser GPS Geolocation", description: "Prompts finders to share exact coordinates on public recovery page", enabled: true },
    { key: "FINDER_CHAT", name: "In-App Direct Finder-to-Owner Messenger", description: "Allows real-time anonymized direct chat between owner and finder", enabled: true },
    { key: "BANK_PAYMENT_VERIFICATION", name: "Meezan Bank Raast Offline Payments", description: "Enables manual bank deposit receipt submission for upgrades", enabled: true },
  ];

  const fetchSettings = () => {
    setLoading(true);
    setError(null);

    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else if (Array.isArray(data.flags) && data.flags.length > 0) {
          setFlags(data.flags);
        } else {
          setFlags(defaultFlags);
        }
      })
      .catch((err) => {
        setFlags(defaultFlags);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggleFlag = async (key: string, currentEnabled: boolean) => {
    if (adminRole !== "SUPER_ADMIN") {
      alert("Only SUPER_ADMIN has authority to toggle system feature flags.");
      return;
    }

    setTogglingKey(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagKey: key, enabled: !currentEnabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update feature flag");

      setFlags((prev) =>
        prev.map((f) => (f.key === key ? { ...f, enabled: !currentEnabled } : f))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle flag");
    } finally {
      setTogglingKey(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h2 className="text-base font-black text-slate-900">System Feature Flags &amp; Global Configuration</h2>
        <p className="text-xs text-slate-400">Dynamic operational toggles controlling platform services in real time</p>
      </div>

      {/* Feature Flags Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <Key className="w-4 h-4 text-teal-600" /> Platform Operational Switches
        </h3>

        <div className="space-y-4">
          {(flags.length > 0 ? flags : defaultFlags).map((flag) => (
            <div
              key={flag.key}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900">{flag.name || flag.key}</span>
                  <code className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono">
                    {flag.key}
                  </code>
                </div>
                <p className="text-xs text-slate-500">{flag.description || "System runtime capability toggle"}</p>
              </div>

              <button
                onClick={() => handleToggleFlag(flag.key, flag.enabled)}
                disabled={togglingKey === flag.key}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  flag.enabled ? "bg-teal-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    flag.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bank Configuration Readout */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <Building className="w-4 h-4 text-teal-600" /> Meezan Bank Manual Verification Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Bank Name</span>
            <span className="font-black text-slate-900">{BANK_PAYMENT_CONFIG.bankName}</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Account Title</span>
            <span className="font-black text-slate-900">{BANK_PAYMENT_CONFIG.accountTitle}</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Raast / Ref Number</span>
            <code className="font-black text-slate-900 font-mono text-xs">{BANK_PAYMENT_CONFIG.raastOrAccountRef}</code>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Verification Admin Email</span>
            <span className="font-black text-slate-900 font-mono">{BANK_PAYMENT_CONFIG.adminEmail}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
