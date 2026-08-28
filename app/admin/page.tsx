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

export default function AdminPortalPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

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

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading admin console...</div>;
  }

  if (error) {
    return (
      <div className="p-12 text-center text-red-600">
        <ShieldAlert className="w-12 h-12 mx-auto mb-2 text-red-500" />
        <h3 className="text-lg font-bold">Access Forbidden</h3>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
        <Link href="/dashboard" className="text-xs font-semibold text-teal-600 hover:underline mt-4 inline-block">
          Return to Owner Dashboard
        </Link>
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
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics.totalUsers}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Pets</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics.totalPets}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Active Tags</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics.activeTags}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Scans</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics.totalScans}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Recoveries</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{metrics.recoveredCases}</p>
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
              {data?.recentScans?.map((scan: any) => {
                const pet = scan.tag?.assignments?.[0]?.pet;

                return (
                  <tr key={scan.id} className="hover:bg-slate-50">
                    <td className="py-3 font-mono font-bold text-slate-900">{scan.tag?.tagCode}</td>
                    <td className="py-3 font-semibold text-slate-800">{pet?.name || "Unassigned"}</td>
                    <td className="py-3 text-slate-500">{scan.deviceType || "Mobile"}</td>
                    <td className="py-3 text-slate-600">{scan.approximateLocation || "Direct Scan"}</td>
                    <td className="py-3 text-slate-400">{new Date(scan.timestamp).toLocaleTimeString()}</td>
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
