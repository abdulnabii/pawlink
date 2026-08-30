"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  QrCode,
  X,
  Clock,
  Send,
  Building,
  HelpCircle,
} from "lucide-react";
import { BANK_PAYMENT_CONFIG } from "@/lib/plans";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 text-sm">Loading Settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const upgradeParam = searchParams.get("upgrade")?.toUpperCase();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Phone verification state (2-step OTP)
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Notification toggles
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  // Subscription & Payment state
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [changingPlan, setChangingPlan] = useState(false);
  const [planSuccessMessage, setPlanSuccessMessage] = useState<string | null>(null);
  const [planErrorMessage, setPlanErrorMessage] = useState<string | null>(null);

  // Payment Checkout Modal
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<any | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentModalError, setPaymentModalError] = useState<string | null>(null);

  const fetchUserData = () => {
    Promise.all([
      fetch("/api/auth/me").then((res) => res.json()).catch(() => ({})),
      fetch("/api/subscription").then((res) => res.json()).catch(() => ({})),
      fetch("/api/subscription/request").then((res) => res.json()).catch(() => ({ requests: [] })),
    ])
      .then(([userData, subData, reqData]) => {
        if (userData?.user) {
          setUser(userData.user);
          const pref = userData.user.notificationPreference;
          if (pref) {
            setPhone(pref.notificationPhone || userData.user.phone || "");
            setWhatsappEnabled(pref.whatsappEnabled);
            setEmailEnabled(pref.emailEnabled);
          }
          setSenderName(userData.user.name || "");
          setSenderPhone(userData.user.phone || "");
        }
        if (subData?.subscription) {
          setSubscription(subData.subscription);
        }
        if (Array.isArray(subData?.plans)) {
          setPlans(subData.plans);
          if (upgradeParam && (upgradeParam === "PLUS" || upgradeParam === "PRO")) {
            const target = subData.plans.find((p: any) => p.id === upgradeParam);
            if (target) {
              setSelectedPlanForPayment(target);
            }
          }
        }
        if (Array.isArray(reqData?.requests)) {
          setUserRequests(reqData.requests);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    setMounted(true);
    fetchUserData();
  }, []);

  if (!mounted || loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn pb-16">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account, Plans &amp; Alerts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your membership tier, bank payment verification, and WhatsApp scan notifications.
          </p>
        </div>
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Loading settings...</div>
      </div>
    );
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyError(null);
    setVerifySuccess(false);

    try {
      const res = await fetch("/api/auth/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEND_OTP", phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch verification code");

      setOtpSent(true);
      if (data.demoCode) setDemoCode(data.demoCode);
    } catch (err: any) {
      setVerifyError(err.message || "Could not dispatch WhatsApp code");
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyError(null);

    try {
      const res = await fetch("/api/auth/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VERIFY_OTP", code: otpCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      setVerifySuccess(true);
      setOtpSent(false);
      setDemoCode(null);
      setOtpCode("");
      fetchUserData();
    } catch (err: any) {
      setVerifyError(err.message || "Invalid verification code");
    } finally {
      setVerifying(false);
    }
  };

  const handlePlanClick = (plan: any) => {
    setPlanSuccessMessage(null);
    setPlanErrorMessage(null);

    if (plan.id === "FREE") {
      // Free plan switches immediately
      handleDirectFreeSwitch();
    } else {
      // Paid plan requires Meezan Bank payment verification
      setSelectedPlanForPayment(plan);
      setPaymentModalError(null);
    }
  };

  const handleDirectFreeSwitch = async () => {
    setChangingPlan(true);
    try {
      const res = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "FREE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to switch to Basic plan");
      setPlanSuccessMessage(data.message || "Switched to Basic ID plan!");
      fetchUserData();
    } catch (err: any) {
      setPlanErrorMessage(err.message);
    } finally {
      setChangingPlan(false);
    }
  };

  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForPayment) return;

    setSubmittingPayment(true);
    setPaymentModalError(null);

    try {
      const res = await fetch("/api/subscription/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlanForPayment.id,
          transactionId,
          senderName,
          senderPhone,
          notes: paymentNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit payment verification");
      }

      setPlanSuccessMessage(
        `Payment verification submitted for ${selectedPlanForPayment.name}! Our team will verify the transaction and activate your plan.`
      );
      setSelectedPlanForPayment(null);
      setTransactionId("");
      setPaymentNotes("");
      fetchUserData();
    } catch (err: any) {
      setPaymentModalError(err.message || "Failed to submit payment details");
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading settings &amp; plans...</div>;
  }

  const isVerified = user?.notificationPreference?.whatsappVerified;
  const currentPlanId = (subscription?.plan || "FREE").toUpperCase();
  const latestPendingRequest = userRequests.find((r) => r.status === "PENDING");

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn pb-16">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account, Plans &amp; Alerts</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your membership tier, bank payment verification, and WhatsApp scan notifications.
        </p>
      </div>

      {/* PENDING PAYMENT VERIFICATION BANNER */}
      {latestPendingRequest && (
        <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-3xl text-amber-900 flex items-start justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div className="text-xs space-y-1">
              <p className="font-extrabold text-sm text-amber-950">
                Payment Verification Pending Approval
              </p>
              <p className="text-amber-800">
                You submitted a payment of <strong>Rs {latestPendingRequest.amountPKR}</strong> for the <strong>{latestPendingRequest.requestedPlan} Plan</strong> (TxID: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-950">{latestPendingRequest.transactionId}</code>).
              </p>
              <p className="text-amber-700 text-[11px] pt-1">
                Admin is reviewing your transaction. You can also send the screenshot to <a href={`mailto:${BANK_PAYMENT_CONFIG.adminEmail}`} className="underline font-bold text-amber-900">{BANK_PAYMENT_CONFIG.adminEmail}</a> for priority approval.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full shrink-0">
            In Review
          </span>
        </div>
      )}

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
                Choose your protection tier with instant Meezan Bank / Raast verification.
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
              onClick={() => handlePlanClick({ id: "FREE", name: "Basic ID" })}
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
              onClick={() => handlePlanClick({ id: "PLUS", name: "Plus Recovery", pricePKR: 1499 })}
              disabled={changingPlan || currentPlanId === "PLUS"}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                currentPlanId === "PLUS"
                  ? "bg-teal-100 text-teal-800 cursor-default"
                  : "bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
              }`}
            >
              {currentPlanId === "PLUS" ? "Active Plan" : "Upgrade to Plus"}
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
              onClick={() => handlePlanClick({ id: "PRO", name: "Pro Household", pricePKR: 2999 })}
              disabled={changingPlan || currentPlanId === "PRO"}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                currentPlanId === "PRO"
                  ? "bg-purple-100 text-purple-800 cursor-default"
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
              }`}
            >
              {currentPlanId === "PRO" ? "Active Plan" : "Upgrade to Pro"}
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

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4 pt-2">
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
                  placeholder="+923001234567"
                  className="w-full text-sm rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Please enter a full international number starting with <code>+</code> (e.g. <code>+923001234567</code> for PK, <code>+14155552671</code> for US).
              </p>
            </div>

            {verifySuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>WhatsApp number verified successfully! You are now subscribed to instant scan alerts.</span>
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
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{isVerified ? "Send New Verification Code" : "Send WhatsApp OTP Code"}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2 animate-fadeIn">
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-2 text-xs text-emerald-950">
              <p className="font-bold">
                Verification Code Sent to: <span className="font-mono">{phone}</span>
              </p>
              <p className="text-emerald-800 text-[11px]">
                Please enter the 6-digit verification code below to confirm your phone.
              </p>
              {demoCode && (
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                    Demo Code
                  </span>
                  <code className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-900">
                    {demoCode}
                  </code>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Enter 6-Digit Code *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center text-xl tracking-widest font-mono font-black rounded-xl border border-slate-300 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
              />
            </div>

            {verifyError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {verifyError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Change Phone
              </button>
              <button
                type="submit"
                disabled={verifying || otpCode.length < 6}
                className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Verify &amp; Activate</span>
              </button>
            </div>
          </form>
        )}
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

      {/* MEEZAN BANK QR PAYMENT VERIFICATION MODAL */}
      {selectedPlanForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Upgrade to {selectedPlanForPayment.name}
                  </h3>
                  <p className="text-xs text-teal-600 font-bold">
                    Amount: Rs {selectedPlanForPayment.pricePKR.toLocaleString()} / month
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlanForPayment(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 pt-4">
              {/* Meezan Bank QR Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center flex flex-col items-center space-y-3">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    {BANK_PAYMENT_CONFIG.bankName} Official QR Payment
                  </span>
                </div>

                <div className="w-52 h-52 bg-white rounded-2xl p-2 shadow-md border-2 border-slate-800 flex items-center justify-center">
                  <img
                    src={BANK_PAYMENT_CONFIG.qrCodeUrl}
                    alt="Meezan Bank QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="text-xs space-y-1 text-slate-700">
                  <p>
                    <strong>Account Title:</strong>{" "}
                    <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded font-bold">
                      {BANK_PAYMENT_CONFIG.accountTitle}
                    </span>
                  </p>
                  <p>
                    <strong>Reference / Raast:</strong>{" "}
                    <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded font-bold">
                      {BANK_PAYMENT_CONFIG.raastOrAccountRef}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto pt-1 leading-tight">
                    Scan using Meezan App, Raast, Easypaisa, JazzCash, SadaPay, or any 1Link banking app.
                  </p>
                </div>
              </div>

              {/* Direct Mail Notice */}
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 flex items-start gap-2">
                <Mail className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  You can also email your payment receipt to{" "}
                  <a
                    href={`mailto:${BANK_PAYMENT_CONFIG.adminEmail}`}
                    className="font-bold underline text-indigo-950"
                  >
                    {BANK_PAYMENT_CONFIG.adminEmail}
                  </a>{" "}
                  for immediate verification.
                </p>
              </div>

              {/* Verification Form */}
              <form onSubmit={handleSubmitPaymentProof} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Transaction ID / Reference Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. TRX198273645 or 8291038"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Sender Account Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="e.g. Ali Khan"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Sender Mobile / Bank
                    </label>
                    <input
                      type="text"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="e.g. +92300... or Meezan"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Additional Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Paid via Easypaisa / Meezan App"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {paymentModalError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    {paymentModalError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPlanForPayment(null)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2"
                  >
                    {submittingPayment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Submit Verification for Approval</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
