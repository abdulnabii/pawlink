"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Loader2,
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Key,
} from "lucide-react";
import Link from "next/link";

interface Admin2FaChallengeProps {
  initialEmail?: string;
  onVerified: (user?: any) => void;
  onCancel?: () => void;
}

export function Admin2FaChallenge({
  initialEmail = "abdulnabi.khaskhely@gmail.com",
  onVerified,
  onCancel,
}: Admin2FaChallengeProps) {
  const [authMode, setAuthMode] = useState<"otp" | "password">("otp");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleGetCode = async () => {
    if (!email) {
      setError("Please enter your admin email address.");
      return;
    }

    setSending(true);
    setError(null);
    setSuccessMsg(null);
    setIsRateLimited(false);

    try {
      const res = await fetch("/api/auth/admin-2fa/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 || data.rateLimited) {
          setIsRateLimited(true);
        }
        throw new Error(data.error || "Failed to send security code.");
      }

      setCodeSent(true);
      setCooldown(60); // 60-second cooldown
      setSuccessMsg(data.message || "Security code sent! Check your email inbox.");
    } catch (err: any) {
      setError(err.message || "An error occurred while requesting the code.");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (authMode === "otp") {
      if (!code || code.trim().length !== 6) {
        setError("Please enter the complete 6-digit code.");
        return;
      }
    } else {
      if (!password) {
        setError("Please enter your administrator password.");
        return;
      }
    }

    setVerifying(true);
    setError(null);

    try {
      const payload: any = { email: email.trim() };
      if (authMode === "otp") {
        payload.code = code.trim();
      } else {
        payload.password = password;
      }

      const res = await fetch("/api/auth/admin-2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed. Please try again.");
      }

      setSuccessMsg("Verification successful! Unlocking admin console...");
      setTimeout(() => {
        onVerified(data.user);
      }, 500);
    } catch (err: any) {
      setError(err.message || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient decorative glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10">
        {/* Header Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4 shadow-lg shadow-teal-500/10">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Administrator 2FA Verification
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
            Verify your administrative credentials to access the PawLink operations console.
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-2xl mb-5 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setAuthMode("otp");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === "otp"
                ? "bg-teal-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Security Code</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("password");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === "password"
                ? "bg-teal-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Admin Password</span>
          </button>
        </div>

        {/* Email Field */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Admin Email Account
            </label>
            {authMode === "otp" ? (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pawlink.pet"
                  className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={handleGetCode}
                  disabled={sending || cooldown > 0 || !email}
                  className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  {sending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <KeyRound className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {cooldown > 0 ? `Resend (${cooldown}s)` : codeSent ? "Resend Code" : "Get Code"}
                  </span>
                </button>
              </div>
            ) : (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pawlink.pet"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            )}
          </div>

          {/* Rate limit helper banner */}
          {isRateLimited && authMode === "otp" && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-2">
              <p className="font-semibold">
                Supabase free test mailer rate limit reached (3 emails/hour).
              </p>
              <p className="text-amber-400/80 text-[11px] leading-relaxed">
                You can bypass the email wait and unlock the admin console immediately using your admin password.
              </p>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("password");
                  setError(null);
                }}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Switch to Password Unlock</span>
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-4 pt-1">
            {authMode === "otp" ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    6-Digit Verification Code
                  </label>
                  {codeSent && (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Code dispatched
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(val);
                  }}
                  placeholder="• • • • • •"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl py-3.5 px-4 text-center font-mono text-2xl font-black tracking-[0.5em] text-teal-400 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-inner"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Administrator Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && !error && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={
                verifying ||
                (authMode === "otp" && code.length !== 6) ||
                (authMode === "password" && !password)
              }
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {authMode === "otp"
                      ? "Verify & Unlock Admin Console"
                      : "Unlock Console with Password"}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to previous screen</span>
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Pet Dashboard</span>
              </Link>
            )}

            <Link
              href="/auth/login"
              className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
            >
              Sign into another account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
