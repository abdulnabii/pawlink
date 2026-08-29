"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Users,
  Dog,
  QrCode,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Lock,
  Loader2,
  Activity,
  ArrowLeft,
} from "lucide-react";

function formatTime(dateVal: any) {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function AdminPortalPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchAdminData = () => {
    fetch("/api/admin/metrics")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.error) {
          setError(resData.error);
        } else {
          setData(resData);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch admin metrics");
        setLoading(false);
      });
  };

  useEffect(() => {
    setMounted(true);
    fetchAdminData();
  }, []);

  const handleRevokeTag = async (tagId: string) => {
    if (!confirm("Are you sure you want to deactivate and revoke this tag? Finders will no longer see pet details.")) {
      return;
    }

    setRevokingId(tagId);
    try {
      const res = await fetch(`/api/admin/tags/${tagId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Admin Security Revocation" }),
      });

      if (res.ok) {
        alert("Tag revoked successfully.");
        fetchAdminData();
      }
    } catch {
      alert("Failed to revoke tag.");
    } finally {
      setRevokingId(null);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
        <span>Loading admin console...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm mt-8">
        <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-amber-500" />
        <h3 className="text-lg font-black text-slate-900">Admin Authentication Required</h3>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          {error.includes("Forbidden") || error.includes("Admin")
            ? "Your current session is logged in as an Owner. To access the Platform Fraud & Telemetry Console, please log in with an Administrator account."
            : error}
        </p>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mt-4 text-left text-xs space-y-1">
          <p className="font-bold text-slate-800">Admin Demo Credentials:</p>
          <p className="text-slate-600">Email: <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-[11px]">admin@pawlink.pet</code></p>
          <p className="text-slate-600">Password: <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-[11px]">password123</code></p>
        </div>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Link
            href="/auth/login"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            Switch to Admin Account
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Owner Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-900 text-red-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-red-700">
              Admin Access
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Platform Health & Fraud Console
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global metrics, notification queue status, and compromised tag revocation.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Owner Dashboard</span>
        </Link>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Users</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics.totalUsers || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Pets</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics.totalPets || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Active Tags</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics.activeTags || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Scans</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics.totalScans || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Recoveries</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{metrics.recoveredCases || 0}</p>
        </div>
      </div>

      {/* RECENT SCANS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <span>Recent Public Scan Events</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">Real-time scan feed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                <th className="pb-3">Tag Code</th>
                <th className="pb-3">Pet Name</th>
                <th className="pb-3">Device / Platform</th>
                <th className="pb-3">Location Hint</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!data?.recentScans || data.recentScans.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">No public scans recorded yet.</td>
                </tr>
              ) : (
                data.recentScans.map((scan: any) => {
                  const pet = scan.tag?.assignments?.[0]?.pet;

                  return (
                    <tr key={scan.id} className="hover:bg-slate-50">
                      <td className="py-3 font-mono font-bold text-slate-900">{scan.tag?.tagCode || "Tag"}</td>
                      <td className="py-3 font-semibold text-slate-800">{pet?.name || "Unassigned"}</td>
                      <td className="py-3 text-slate-500">{scan.deviceType || "Mobile"}</td>
                      <td className="py-3 text-slate-600">{scan.approximateLocation || "Direct Scan"}</td>
                      <td className="py-3 text-slate-400">{formatTime(scan.timestamp)}</td>
                      <td className="py-3 text-right">
                        {scan.tag?.status === "ACTIVE" ? (
                          <button
                            onClick={() => handleRevokeTag(scan.tag.id)}
                            disabled={revokingId === scan.tag.id}
                            className="text-red-600 hover:text-red-800 font-bold text-[11px]"
                          >
                            Revoke Tag
                          </button>
                        ) : (
                          <span className="text-slate-400 font-semibold">Revoked</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
