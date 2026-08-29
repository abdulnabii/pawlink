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
  Search,
  CreditCard,
  Sparkles,
  ExternalLink,
} from "lucide-react";

function formatTime(dateVal: any) {
  if (!dateVal) return "N/A";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "N/A";
  }
}

export default function AdminPortalPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "pets" | "tags" | "scans" | "plans">("users");
  const [searchQuery, setSearchQuery] = useState("");
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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin mb-2" />
        <p className="text-sm text-slate-400">Loading PawLink Admin Command Center...</p>
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
            ? "Your current session is logged in as an Owner. To access the Platform Fraud & Telemetry Console, please log in with your Administrator account."
            : error}
        </p>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mt-4 text-left text-xs space-y-1">
          <p className="font-bold text-slate-800">Admin Account:</p>
          <p className="text-slate-600">Email: <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-[11px]">abdulnabi.khaskheli@gmail.com</code></p>
          <p className="text-slate-600">Password: <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-[11px]">abkhaskhely</code></p>
        </div>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Link
            href="/auth/login"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            Sign in as Admin
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
  const users = data?.users || [];
  const pets = data?.pets || [];
  const tags = data?.tags || [];
  const scans = data?.recentScans || [];

  // Filtered queries based on search input
  const filteredUsers = users.filter((u: any) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPets = pets.filter((p: any) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.species?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tagCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTags = tags.filter((t: any) =>
    t.tagCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.pet?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.label?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-red-500/20 text-red-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-red-500/40">
              Admin Portal
            </span>
            <span className="text-xs text-slate-400">Authenticated as: <strong className="text-white">abdulnabi.khaskheli@gmail.com</strong></span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Platform Command & Telemetry Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time monitoring of all registered pet owners, animals, collar tags, and PKR subscriptions.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl border border-white/10 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Switch to Owner View</span>
        </Link>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{metrics.totalUsers || users.length}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Pets</p>
            <Dog className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{metrics.totalPets || pets.length}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active QR Tags</p>
            <QrCode className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{metrics.activeTags || tags.length}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Public Scans</p>
            <Activity className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{metrics.totalScans || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lost Mode Active</p>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-amber-600 mt-2">{metrics.lostPets || 0}</p>
        </div>
      </div>

      {/* TAB NAVIGATION BAR */}
      <div className="bg-white rounded-3xl border border-slate-200 p-2 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "users"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Registered Users ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("pets")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "pets"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Dog className="w-3.5 h-3.5" />
            <span>Registered Pets ({pets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("tags")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "tags"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Generated Tags ({tags.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("scans")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "scans"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Scan Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab("plans")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "plans"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>PKR Plans & Pricing</span>
          </button>
        </div>

        {/* Global Filter / Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records..."
            className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* TAB CONTENT: USERS */}
      {activeTab === "users" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">All Registered Users ({filteredUsers.length})</h3>
            <span className="text-xs text-slate-500">Live platform accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="pb-3">User Name</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Pets Owned</th>
                  <th className="pb-3">Member Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                        {u.name?.charAt(0) || "U"}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3.5 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3.5 text-slate-500">{u.phone || "Not Set"}</td>
                    <td className="py-3.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        u.role === "ADMIN"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-teal-50 text-teal-700 border-teal-200"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 font-semibold text-slate-800">
                      {u.petCount} {u.petCount === 1 ? "Pet" : "Pets"}
                      {u.pets?.length > 0 && <span className="text-slate-400 font-normal"> ({u.pets.join(", ")})</span>}
                    </td>
                    <td className="py-3.5 text-slate-400">{formatTime(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PETS */}
      {activeTab === "pets" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">All Registered Animals ({filteredPets.length})</h3>
            <span className="text-xs text-slate-500">Protected pet profiles</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="pb-3">Pet</th>
                  <th className="pb-3">Species / Breed</th>
                  <th className="pb-3">Owner</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Attached Tag Code</th>
                  <th className="pb-3">Registered On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPets.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3.5 font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm">
                            {p.species?.toLowerCase() === "cat" ? "🐈" : "🐕"}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.gender || "Unknown"} {p.color ? `• ${p.color}` : ""}</p>
                      </div>
                    </td>
                    <td className="py-3.5 font-semibold text-slate-700">
                      {p.species} {p.breed ? `(${p.breed})` : ""}
                    </td>
                    <td className="py-3.5 text-slate-600">
                      {p.owner ? (
                        <div>
                          <p className="font-bold text-slate-900">{p.owner.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{p.owner.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">Unknown</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        p.status === "LOST"
                          ? "bg-red-600 text-white border-red-600 animate-pulse"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono font-bold text-teal-700">
                      {p.tagCode ? (
                        <a
                          href={`/p/${p.tagCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline inline-flex items-center gap-1"
                        >
                          <span>{p.tagCode}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 font-normal">No Tag Attached</span>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-400">{formatTime(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TAGS */}
      {activeTab === "tags" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">All Generated QR Collar Tags ({filteredTags.length})</h3>
            <span className="text-xs text-slate-500">Cryptographic tag inventory</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="pb-3">Tag Code</th>
                  <th className="pb-3">Description / Label</th>
                  <th className="pb-3">Assigned Pet</th>
                  <th className="pb-3">Owner</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Scans</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTags.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-3.5 font-mono font-bold text-slate-900">
                      <a
                        href={`/p/${t.tagCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-teal-700 inline-flex items-center gap-1"
                      >
                        <span>{t.tagCode}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3.5 text-slate-700">{t.label || "Collar Tag"}</td>
                    <td className="py-3.5 font-semibold text-slate-800">
                      {t.pet ? `${t.pet.name} (${t.pet.species})` : <span className="text-amber-600">Unassigned Spare</span>}
                    </td>
                    <td className="py-3.5 text-slate-600">{t.owner?.name || "N/A"}</td>
                    <td className="py-3.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        t.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 font-bold text-slate-900">{t.scanCount || 0}</td>
                    <td className="py-3.5 text-right">
                      {t.status === "ACTIVE" ? (
                        <button
                          onClick={() => handleRevokeTag(t.id)}
                          disabled={revokingId === t.id}
                          className="text-red-600 hover:text-red-800 font-bold text-[11px] bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200"
                        >
                          Revoke Tag
                        </button>
                      ) : (
                        <span className="text-slate-400 font-semibold text-[11px]">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SCANS */}
      {activeTab === "scans" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              <span>Public Scan Telemetry & Fraud Stream</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Real-time scan logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="pb-3">Tag Code</th>
                  <th className="pb-3">Device / Platform</th>
                  <th className="pb-3">Location Hint</th>
                  <th className="pb-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scans.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">No public scans recorded yet.</td>
                  </tr>
                ) : (
                  scans.map((scan: any) => (
                    <tr key={scan.id} className="hover:bg-slate-50">
                      <td className="py-3 font-mono font-bold text-slate-900">{scan.tag?.tagCode || "Tag"}</td>
                      <td className="py-3 text-slate-500">{scan.deviceType || "Mobile"}</td>
                      <td className="py-3 text-slate-600">{scan.approximateLocation || "Direct Scan"}</td>
                      <td className="py-3 text-slate-400">{formatTime(scan.timestamp)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SUBSCRIPTION PLANS (PKR) */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-teal-600" />
                  <span>Subscription Tiers in PKR (Pakistani Rupee)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Manage commercial plan pricing and feature allocations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Plan 1 */}
              <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase bg-slate-200 text-slate-800 px-2.5 py-1 rounded-full">
                    Basic ID
                  </span>
                  <span className="text-sm font-bold text-slate-400">Free Tier</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">Rs 0</span>
                  <span className="text-xs text-slate-500">/ forever</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li>• 1 Pet Profile & QR Tag</li>
                  <li>• Instant Scan Recovery Page</li>
                  <li>• Email Scan Alerts</li>
                  <li>• GPS Location Sharing</li>
                </ul>
              </div>

              {/* Plan 2 */}
              <div className="p-6 rounded-3xl border-2 border-teal-600 bg-teal-50/30 space-y-4 relative shadow-md">
                <span className="absolute -top-3 right-6 bg-teal-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  Most Popular
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase bg-teal-100 text-teal-800 px-2.5 py-1 rounded-full">
                    Plus Recovery
                  </span>
                  <span className="text-sm font-bold text-teal-700">Recommended</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">Rs 1,499</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-2 font-medium">
                  <li>• Up to 5 Pet Profiles</li>
                  <li>• Instant WhatsApp Scan Alerts</li>
                  <li>• Interactive Leaflet Scan Map</li>
                  <li>• Emergency Lost Mode & Reward Banner</li>
                  <li>• Anonymous In-App Finder Chat</li>
                </ul>
              </div>

              {/* Plan 3 */}
              <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full">
                    Pro Household
                  </span>
                  <span className="text-sm font-bold text-indigo-700">Full Access</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">Rs 2,999</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li>• Unlimited Pets & Tags</li>
                  <li>• Caretaker & Family Delegation</li>
                  <li>• Digital Pet Passport & Medical Alerts</li>
                  <li>• Priority Notification Dispatch</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
