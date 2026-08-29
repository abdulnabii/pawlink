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
  BellRing,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";

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
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data?.user) {
            setUser(data.user);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
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

  if (user?.role === "ADMIN") {
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
          <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-800">
            SaaS Hub
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
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
          <div className="flex items-center gap-2 text-xs font-semibold mb-1">
            {isWhatsAppVerified ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">WhatsApp Alerts Active</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-400" />
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
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800">
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
      </div>
    </aside>
  );
}
