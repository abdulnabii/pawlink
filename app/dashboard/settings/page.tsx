"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Mail,
  BellRing,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Phone verification state
  const [phone, setPhone] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Notification toggles
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  useEffect(() => {
    setMounted(true);
    let active = true;

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          if (data?.user) {
            setUser(data.user);
            const pref = data.user.notificationPreference;
            if (pref) {
              setPhone(pref.notificationPhone || data.user.phone || "");
              setWhatsappEnabled(pref.whatsappEnabled);
              setEmailEnabled(pref.emailEnabled);
            }
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!mounted) return null;

  const handleVerifyWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyError(null);
    setVerifySuccess(false);

    try {
      const res = await fetch("/api/auth/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, verified: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setVerifySuccess(true);
      // Reload user
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user) setUser(meData.user);
    } catch (err: any) {
      setVerifyError(err.message || "Could not verify phone number");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading settings...</div>;
  }

  const isVerified = user?.notificationPreference?.whatsappVerified;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notification & Alert Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure how you receive instantaneous scan and location alerts when your pet&apos;s collar tag is scanned.
        </p>
      </div>

      {/* WHATSAPP VERIFICATION BOX */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">WhatsApp Alert Dispatcher</h3>
              <p className="text-xs text-slate-500">
                Primary real-time notification channel for instant scan & GPS alerts.
              </p>
            </div>
          </div>

          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
            isVerified
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}>
            {isVerified ? "🟢 Verified & Active" : "⚠️ Verification Required"}
          </span>
        </div>

        <form onSubmit={handleVerifyWhatsApp} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              WhatsApp Phone Number (With Country Code)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+14155552671"
                className="w-full text-sm rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Ensure you include the international code (e.g. +1 for US, +92 for PK, +44 for UK).
            </p>
          </div>

          {verifySuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>WhatsApp number verified successfully! You are now subscribed to scan alerts.</span>
            </div>
          )}

          {verifyError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {verifyError}
            </div>
          )}

          <button
            type="submit"
            disabled={verifying}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{isVerified ? "Update & Confirm WhatsApp Number" : "Verify & Enable WhatsApp Alerts"}</span>
          </button>
        </form>
      </div>

      {/* MULTI-CHANNEL FALLBACK PREFERENCES */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BellRing className="w-5 h-5 text-teal-600" />
          <span>Multi-Channel Fallback Matrix</span>
        </h3>
        <p className="text-xs text-slate-500">
          PawLink automatically routes alerts according to your priority preferences.
        </p>

        <div className="space-y-3 pt-2">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">Primary: WhatsApp Alerts</p>
                <p className="text-[11px] text-slate-500">Instant direct alert sent to your mobile device.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={whatsappEnabled}
              onChange={(e) => setWhatsappEnabled(e.target.checked)}
              className="rounded text-teal-600 w-4 h-4"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">Fallback: Email Scan Notifications</p>
                <p className="text-[11px] text-slate-500">Sent if WhatsApp is unreachable or network is down.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="rounded text-teal-600 w-4 h-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
