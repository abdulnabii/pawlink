"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<"standard" | "admin2fa">("standard");

  // Standard Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin 2FA State
  const [adminEmail, setAdminEmail] = useState("");
  const [code, setCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const [admin2faMsg, setAdmin2faMsg] = useState<string | null>(null);
  const [admin2faError, setAdmin2faError] = useState<string | null>(null);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
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
        throw new Error(data.error || "Login failed");
      }

      // If user is admin, check if 2FA is needed
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
      setAdmin2faMsg(data.message || "Security code sent! Please check your email.");
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
      setAdmin2faError("Please enter the complete 6-digit code.");
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
        throw new Error(data.error || "2FA verification failed.");
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
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Paw<span className="text-teal-400">Link</span>
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {activeMode === "admin2fa" ? "Admin Security Portal" : "Welcome back to PawLink"}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {activeMode === "admin2fa"
            ? "Authenticate via 2FA security code to access operations."
            : "Sign in to monitor your pets, scan alerts, and recovery timelines."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/80 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-700">
          {/* Mode Switch Tabs */}
          <div className="flex bg-slate-900/80 p-1 rounded-2xl mb-6 border border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveMode("standard")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeMode === "standard"
                  ? "bg-teal-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Pet Owner Sign-In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode("admin2fa");
                if (email && !adminEmail) setAdminEmail(email);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeMode === "admin2fa"
                  ? "bg-teal-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Lock className="w-3 h-3" />
              <span>Admin 2FA</span>
            </button>
          </div>

          {/* STANDARD SIGN-IN FORM */}
          {activeMode === "standard" && (
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
            </form>
          )}

          {/* ADMIN 2FA LOGIN FORM */}
          {activeMode === "admin2fa" && (
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
                      6-Digit Security Code
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
                      <span>Verifying 2FA...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Sign In via Admin 2FA</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-semibold text-teal-400 hover:underline">
              Create Pet Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
