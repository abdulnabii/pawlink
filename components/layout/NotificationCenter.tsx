"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  X,
  CheckCheck,
  QrCode,
  MapPin,
  MessageSquare,
  CreditCard,
  AlertTriangle,
  Info,
  ShieldCheck,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  channel: string;
  status: string;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotifIcon({ type }: { type: string }) {
  const t = type?.toUpperCase() || "";
  if (t.includes("SCAN")) return <QrCode className="w-4 h-4 text-teal-500" />;
  if (t.includes("LOCATION")) return <MapPin className="w-4 h-4 text-blue-500" />;
  if (t.includes("MESSAGE")) return <MessageSquare className="w-4 h-4 text-violet-500" />;
  if (t.includes("SUBSCRIPTION") || t.includes("PLAN") || t.includes("PAYMENT"))
    return <CreditCard className="w-4 h-4 text-amber-500" />;
  if (t.includes("RECOVERY") || t.includes("ALERT") || t.includes("LOST"))
    return <AlertTriangle className="w-4 h-4 text-red-500" />;
  if (t.includes("WELCOME") || t.includes("SYSTEM"))
    return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
  return <Info className="w-4 h-4 text-slate-400" />;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  }, []);

  // Initial fetch + 30s polling
  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  // Click-outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markOneRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "READ" } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" })));
      setUnreadCount(0);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        className={`relative p-2 rounded-xl transition-colors ${
          open
            ? "bg-teal-500/20 text-teal-300"
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-md animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[9999] overflow-hidden animate-fadeIn">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-bold">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={markingAll}
                  title="Mark all as read"
                  className="p-1.5 text-slate-400 hover:text-teal-300 transition-colors rounded-lg"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Bell className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-700">All quiet!</p>
                <p className="text-xs text-slate-400 mt-1">
                  Scan alerts, finder messages, and plan updates will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = notif.status !== "READ";
                return (
                  <div
                    key={notif.id}
                    onClick={() => isUnread && markOneRead(notif.id)}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer ${
                      isUnread
                        ? "bg-teal-50/60 hover:bg-teal-50"
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isUnread ? "bg-teal-100" : "bg-slate-100"
                    }`}>
                      <NotifIcon type={notif.type} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-bold leading-snug ${isUnread ? "text-slate-900" : "text-slate-700"}`}>
                          {notif.title}
                        </p>
                        {isUnread && (
                          <span className="w-2 h-2 bg-teal-500 rounded-full shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                        {notif.body}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1" suppressHydrationWarning>
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400 font-medium">
                Showing last {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}