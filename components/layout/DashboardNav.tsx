"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck,
  Dog,
  QrCode,
  MessageSquare,
  Settings,
  ShieldAlert,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { NotificationCenter } from "@/components/layout/NotificationCenter";


interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  notificationPreference?: {
    whatsappEnabled: boolean;
    whatsappVerified: boolean;
    notificationPhone: string | null;
  } | null;
}

export function DashboardNav() {
  const rawPathname = usePathname();
  const pathname = typeof rawPathname === "string" ? rawPathname : "";
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchNavUserData = () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);

    Promise.all([
      fetch("/api/auth/me", { cache: "no-store", signal: controller.signal })
        .then((res) => res.json())
        .catch(() => ({ error: "UNAUTHORIZED", user: null })),
      fetch("/api/subscription", { cache: "no-store", signal: controller.signal })
        .then((res) => res.json())
        .catch(() => ({})),
    ])
      .then(([authData, subData]) => {
        clearTimeout(timer);
        if (authData?.user) {
          setUser(authData.user);
        }
        if (subData?.subscription) setSubscription(subData.subscription);
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(timer);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNavUserData();

    const handleUpdate = () => {
      fetchNavUserData();
    };

    window.addEventListener("pawlink-auth-updated", handleUpdate);
    window.addEventListener("pawlink-subscription-updated", handleUpdate);
    return () => {
      window.removeEventListener("pawlink-auth-updated", handleUpdate);
      window.removeEventListener("pawlink-subscription-updated", handleUpdate);
    };
  }, [pathname]);


  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/");
    router.refresh();
  };

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: ShieldCheck },
    { name: "My Pets", href: "/dashboard/pets", icon: Dog },
    { name: "Collar Tags", href: "/dashboard/tags", icon: QrCode },
    { name: "Finder Messages", href: "/dashboard/messages", icon: MessageSquare },
    { name: "Settings & Alerts", href: "/dashboard/settings", icon: Settings },
  ];

  if (user?.role === "ADMIN" || user?.email?.toLowerCase() === "abdulnabi.khaskheli@gmail.com") {
    navItems.push({ name: "Admin Portal", href: "/admin", icon: ShieldAlert });
  }


  const isWhatsAppVerified = user?.notificationPreference?.whatsappVerified;

  return (
    <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 md:min-h-screen border-r border-slate-800">
      <div>
        {/* Brand */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 font-bold">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Paw<span className="text-teal-400">Link</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-800">
              SaaS Hub
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = Boolean(
              pathname &&
                (pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href)))
            );
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  active
                    ? "bg-teal-600 text-white shadow-sm shadow-teal-600/30 font-semibold"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-white" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* WhatsApp Verification Status Widget */}
        <div className="mx-4 my-3 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
          {loading && !user ? (
            <div className="space-y-1.5 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-700" />
                <div className="h-3 w-28 bg-slate-700 rounded" />
              </div>
              <div className="h-2.5 w-full bg-slate-700/60 rounded" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs font-semibold mb-1">
                {isWhatsAppVerified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-emerald-400">WhatsApp Alerts Active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-amber-300">WhatsApp Not Verified</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mb-2">
                {isWhatsAppVerified
                  ? "Instant scan & GPS alerts will be dispatched via WhatsApp."
                  : "Verify your phone number to receive instant scan alerts."}
              </p>
              {!isWhatsAppVerified && (
                <Link
                  href="/dashboard/settings"
                  className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                >
                  <span>Verify Number</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || "Owner"}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Membership Tier Pill */}
        <Link
          href="/dashboard/settings"
          className="flex items-center justify-between p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 transition-colors text-[11px]"
        >
          <span className="text-slate-400">Plan:</span>
          {loading || !subscription ? (
            <span className="text-[10px] text-slate-500 font-bold animate-pulse">...</span>
          ) : (
            <span
              className={`font-black uppercase px-2 py-0.5 rounded text-[10px] ${
                subscription?.plan === "PRO"
                  ? "bg-purple-900/60 text-purple-300 border border-purple-700"
                  : subscription?.plan === "PLUS"
                  ? "bg-teal-900/60 text-teal-300 border border-teal-700"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              {subscription?.plan === "PRO"
                ? "👑 Pro"
                : subscription?.plan === "PLUS"
                ? "⚡ Plus"
                : "🛡️ Basic ID"}
            </span>
          )}
        </Link>
      </div>
    </aside>
  );
}
