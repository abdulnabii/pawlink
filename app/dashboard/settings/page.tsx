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
  CreditCard,
  Sparkles,
  Zap,
  Crown,
  Check,
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

  // Subscription state
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [changingPlan, setChangingPlan] = useState(false);
  const [planSuccessMessage, setPlanSuccessMessage] = useState<string | null>(null);
  const [planErrorMessage, setPlanErrorMessage] = useState<string | null>(null);

  const fetchUserData = () => {
    Promise.all([
      fetch("/api/auth/me").then((res) => res.json()).catch(() => ({})),
      fetch("/api/subscription").then((res) => res.json()).catch(() => ({})),
    ])
      .then(([userData, subData]) => {
        if (userData?.user) {
          setUser(userData.user);
          const pref = userData.user.notificationPreference;
          if (pref) {
            setPhone(pref.notificationPhone || userData.user.phone || "");
            setWhatsappEnabled(pref.whatsappEnabled);
            setEmailEnabled(pref.emailEnabled);
          }
        }
        if (subData?.subscription) {
          setSubscription(subData.subscription);
        }
        if (Array.isArray(subData?.plans)) {
          setPlans(subData.plans);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    setMounted(true);
    fetchUserData();
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
      fetchUserData();
    } catch (err: any) {
      setVerifyError(err.message || "Could not verify phone number");
    } finally {
      setVerifying(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    setChangingPlan(true);
    setPlanSuccessMessage(null);
    setPlanErrorMessage(null);

    try {
      const res = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update membership plan");
      }

      setPlanSuccessMessage(data.message || "Plan updated successfully!");
      if (data.subscription) {
        setSubscription(data.subscription);
      }
      fetchUserData();
    } catch (err: any) {
      setPlanErrorMessage(err.message || "Failed to update plan");
    } finally {
      setChangingPlan(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading settings &amp; plans...</div>;
  }

  const isVerified = user?.notificationPreference?.whatsappVerified;
  const currentPlanId = (subscription?.plan || "FREE").toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account, Plans &amp; Alerts</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your membership tier, WhatsApp scan alert channels, and recovery notifications.
        </p>
      </div>

      {/* MEMBERSHIP & SUBSCRIPTION PLANS SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Membership &amp; Subscription Tier</h3>
              <p className="text-xs text-slate-500">
                Choose the protection level for your animals and collar tags.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Active Plan:</span>
            <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${
              currentPlanId === "PRO"
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : currentPlanId === "PLUS"
                ? "bg-teal-50 text-teal-700 border-teal-200"
                : "bg-slate-100 text-slate-700 border-slate-300"
            }`}>
              {currentPlanId === "PRO" ? "👑 Pro Household" : currentPlanId === "PLUS" ? "⚡ Plus Recovery" : "🛡️ Basic ID (Free)"}
            </span>
          </div>
        </div>

        {planSuccessMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{planSuccessMessage}</span>
          </div>
        )}

        {planErrorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium">
            {planErrorMessage}
          </div>
        )}

        {/* Plan Selection Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* 1. Basic ID (FREE) */}
          <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
            currentPlanId === "FREE"
              ? "border-slate-900 bg-slate-50/50 shadow-sm"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-black text-slate-900 text-sm">Basic ID</h4>
                {currentPlanId === "FREE" && (
                  <span className="text-[10px] font-black uppercase bg-slate-900 text-white px-2 py-0.5 rounded-full">Current</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mb-3">Essential digital tag</p>
              <div className="mb-4">
                <span className="text-2xl font-black text-slate-900">Rs 0</span>
                <span className="text-[11px] text-slate-500 font-semibold"> / forever</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600 shrink-0" /> 1 Pet Profile &amp; QR Tag</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600 shrink-0" /> Instant Scan Page</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600 shrink-0" /> Email Scan Alerts</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600 shrink-0" /> GPS Location Pins</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan("FREE")}
              disabled={changingPlan || currentPlanId === "FREE"}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                currentPlanId === "FREE"
                  ? "bg-slate-200 text-slate-500 cursor-default"
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
              }`}
            >
              {currentPlanId === "FREE" ? "Active Plan" : "Switch to Basic"}
            </button>
          </div>

          {/* 2. Plus Recovery */}
          <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between relative ${
            currentPlanId === "PLUS"
              ? "border-teal-600 bg-teal-50/30 shadow-md ring-2 ring-teal-500/20"
              : "border-teal-500/80 hover:border-teal-600 bg-white"
          }`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
              Most Popular
            </div>
            <div>
              <div className="flex items-center justify-between mb-2 mt-1">
                <h4 className="font-black text-slate-900 text-sm">Plus Recovery</h4>
                {currentPlanId === "PLUS" && (
                  <span className="text-[10px] font-black uppercase bg-teal-600 text-white px-2 py-0.5 rounded-full">Current</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mb-3">Complete multi-pet pack</p>
              <div className="mb-4">
                <span className="text-2xl font-black text-slate-900">Rs 1,499</span>
                <span className="text-[11px] text-slate-500 font-semibold"> / month</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600 shrink-0" /> Up to 5 Pet Profiles</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600 shrink-0" /> <strong>Instant WhatsApp Alerts</strong></li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600 shrink-0" /> Interactive Radar Map</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600 shrink-0" /> Lost Mode &amp; Reward Banner</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600 shrink-0" /> Anonymous Finder Chat</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan("PLUS")}
              disabled={changingPlan || currentPlanId === "PLUS"}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                currentPlanId === "PLUS"
                  ? "bg-teal-100 text-teal-800 cursor-default"
                  : "bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
              }`}
            >
              {changingPlan ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : currentPlanId === "PLUS" ? (
                "Active Plan"
              ) : (
                "Upgrade to Plus"
              )}
            </button>
          </div>

          {/* 3. Pro Household */}
          <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
            currentPlanId === "PRO"
              ? "border-purple-600 bg-purple-50/30 shadow-md ring-2 ring-purple-500/20"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-black text-slate-900 text-sm">Pro Household</h4>
                {currentPlanId === "PRO" && (
                  <span className="text-[10px] font-black uppercase bg-purple-700 text-white px-2 py-0.5 rounded-full">Current</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mb-3">Unlimited pets &amp; team</p>
              <div className="mb-4">
                <span className="text-2xl font-black text-slate-900">Rs 2,999</span>
                <span className="text-[11px] text-slate-500 font-semibold"> / month</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600 shrink-0" /> Unlimited Pets &amp; Tags</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600 shrink-0" /> Caretaker Delegation</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600 shrink-0" /> Digital Pet Passport</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600 shrink-0" /> Priority Notification Queue</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan("PRO")}
              disabled={changingPlan || currentPlanId === "PRO"}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                currentPlanId === "PRO"
                  ? "bg-purple-100 text-purple-800 cursor-default"
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
              }`}
            >
              {changingPlan ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : currentPlanId === "PRO" ? (
                "Active Plan"
              ) : (
                "Upgrade to Pro"
              )}
            </button>
          </div>
        </div>
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
                Primary real-time notification channel for instant scan &amp; GPS alerts.
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
