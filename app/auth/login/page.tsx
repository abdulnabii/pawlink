"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { PawLinkLogo } from "@/components/ui/PawLinkLogo";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isAdminRequested =
    searchParams.get("admin") === "true" ||
    searchParams.get("mode") === "admin2fa" ||
    searchParams.get("tab") === "admin" ||
    searchParams.get("role") === "admin";

  // Standard Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin Login State (OTP Only - password login disabled)
  const [adminEmail, setAdminEmail] = useState("");
  const [code, setCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const [admin2faMsg, setAdmin2faMsg] = useState<string | null>(null);
  const [admin2faError, setAdmin2faError] = useState<string | null>(null);

  // Sync query parameters
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setAdminEmail(emailParam);
      setEmail(emailParam);
    }
    const noticeParam = searchParams.get("notice");
    if (noticeParam === "admin_required" || noticeParam === "admin_otp_required") {
      setAdmin2faError("Administrator accounts must authenticate via secure One-Time Password (OTP).");
    }
  }, [searchParams]);

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresAdminOtp) {
          router.push(`/auth/login?admin=true&email=${encodeURIComponent(email)}&notice=admin_otp_required`);
          return;
        }
        throw new Error(data.message || data.error || "Login failed");
      }

      // If user is admin, redirect to admin
      if (data.user?.role === "ADMIN" || data.user?.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleGetAdminCode = async () => {
    const target = adminEmail.trim() || email.trim();
    if (!target) {
      setAdmin2faError("Please enter your administrator email address.");
      return;
    }

    setSendingCode(true);
    setAdmin2faError(null);
    setAdmin2faMsg(null);

    try {
      const res = await fetch("/api/auth/admin-2fa/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send security code.");
      }

      setCodeSent(true);
      setCooldown(60);
      setAdmin2faMsg(data.message || "Security code dispatched to your email! Please check your inbox.");
    } catch (err: any) {
      setAdmin2faError(err.message || "Failed to dispatch security code.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyAdminCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = adminEmail.trim() || email.trim();

    if (!code || code.trim().length !== 6) {
      setAdmin2faError("Please enter the complete 6-digit code received on your email.");
      return;
    }

    setVerifyingCode(true);
    setAdmin2faError(null);

    try {
      const res = await fetch("/api/auth/admin-2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target, code: code.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed.");
      }

      setAdmin2faMsg("Verified! Redirecting to Admin Operations Console...");
      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 500);
    } catch (err: any) {
      setAdmin2faError(err.message || "Verification failed.");
    } finally {
      setVerifyingCode(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="flex justify-center mb-6">
          <PawLinkLogo variant="full" size="lg" theme="dark" href="/" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {isAdminRequested ? "Admin Operations Portal" : "Welcome back to PawLink"}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {isAdminRequested
            ? "Protected by 2FA Email OTP Verification. Password login is permanently disabled for administrators."
            : "Sign in to monitor your pets, scan alerts, and recovery timelines."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/80 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-700">
          {/* STANDARD USER LOGIN FORM (NO ADMIN TABS FOR REGULAR VISITORS) */}
          {!isAdminRequested ? (
            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@pawlink.pet"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-sm shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-6 text-center text-xs text-slate-400">
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className="font-semibold text-teal-400 hover:underline">
                  Create Pet Profile
                </Link>
              </div>
            </form>
          ) : (
            /* ADMIN OPERATIONS PORTAL LOGIN (OTP ONLY) */
            <div className="space-y-5">
              {/* Security Banner: Password Login Disabled */}
              <div className="p-3.5 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-bold text-teal-300 block mb-0.5">Password Login Disabled</span>
                  <span className="text-slate-300">
                    Administrator access strictly requires 6-digit One-Time Password (OTP) verification delivered to your authorized admin email.
                  </span>
                </div>
              </div>

              {/* Admin OTP Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Admin Email Address
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@pawlink.pet"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleGetAdminCode}
                      disabled={sendingCode || cooldown > 0 || !adminEmail}
                      className="px-3.5 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                    >
                      {sendingCode ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <KeyRound className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {cooldown > 0 ? `${cooldown}s` : codeSent ? "Resend" : "Get Code"}
                      </span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleVerifyAdminCode} className="space-y-4 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        6-Digit Security OTP Code
                      </label>
                      {codeSent && (
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Code Sent
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="• • • • • •"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-3 text-center font-mono text-xl font-black tracking-[0.4em] text-teal-400 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {admin2faError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{admin2faError}</span>
                    </div>
                  )}

                  {admin2faMsg && !admin2faError && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{admin2faMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={verifyingCode || code.length !== 6}
                    className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-sm shadow-md shadow-teal-500/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  >
                    {verifyingCode ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying OTP Code...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Sign In via 6-Digit OTP</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="pt-4 border-t border-slate-700/60 text-center">
                <Link
                  href="/auth/login"
                  className="text-xs font-semibold text-slate-400 hover:text-teal-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>← Return to Pet Owner Sign-In</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
