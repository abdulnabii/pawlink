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
  Check,
  X,
  Clock,
  Building,
  Mail,
  Copy,
} from "lucide-react";
import { BANK_PAYMENT_CONFIG } from "@/lib/plans";

function formatTime(dateVal: any) {
  if (!dateVal) return "N/A";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "N/A";
    return (
      d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return "N/A";
  }
}

const getSafeNumber = (val: any): number => {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (val && typeof val === "object") {
    if (typeof val.increment === "number") return val.increment;
    if (typeof val.toNumber === "function") return val.toNumber();
  }
  const parsed = Number(val);
  return isNaN(parsed) ? 0 : parsed;
};

export default function AdminPortalPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "payments" | "users" | "pets" | "tags" | "scans" | "plans"
  >("payments");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // Payment Requests State
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchAdminData = () => {
    Promise.all([
      fetch("/api/admin/metrics").then((res) => res.json()).catch(() => ({})),
      fetch("/api/admin/subscriptions").then((res) => res.json()).catch(() => ({ requests: [] })),
    ])
      .then(([metricsData, subData]) => {
        if (metricsData?.error) {
          setError(metricsData.error);
        } else if (metricsData) {
          setData(metricsData);
          setError(null);
        }
        if (Array.isArray(subData?.requests)) {
          setPaymentRequests(subData.requests);
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
    if (
      !confirm(
        "Are you sure you want to deactivate and revoke this tag? Finders will no longer see pet details."
      )
    ) {
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

  const handleApprovePayment = async (requestId: string, userName: string, plan: string) => {
    if (!confirm(`Approve payment verification for ${userName} (${plan})? This will immediately activate their membership.`)) {
      return;
    }

    setProcessingPaymentId(requestId);
    setActionSuccessMessage(null);
    try {
      const res = await fetch(`/api/admin/subscriptions/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Payment verified in Meezan Bank account" }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Approval failed");

      setActionSuccessMessage(`✅ Plan upgrade for ${userName} (${plan}) successfully approved!`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to approve payment");
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleRejectPayment = async (requestId: string, userName: string) => {
    const reason = prompt("Enter rejection reason (optional):", "Transaction could not be verified");
    if (reason === null) return;

    setProcessingPaymentId(requestId);
    setActionSuccessMessage(null);
    try {
      const res = await fetch(`/api/admin/subscriptions/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: reason }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Rejection failed");

      setActionSuccessMessage(`⚠️ Payment request for ${userName} marked as rejected.`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to reject payment");
    } finally {
      setProcessingPaymentId(null);
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

  // NON-ADMIN OR FORBIDDEN SCREEN - NO PLAIN TEXT PASSWORDS
  if (error) {
    return (
      <div className="max-w-md mx-auto p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm mt-12 animate-fadeIn">
        <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-black text-slate-900">Administrator Access Required</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          The Platform Command, Billing &amp; Fraud Console is restricted to authorized Administrator accounts. Please sign in with your administrative credentials to proceed.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <Link
            href="/auth/login"
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            Sign In with Admin Account
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const users = Array.isArray(data?.users) ? data.users : [];
  const pets = Array.isArray(data?.pets) ? data.pets : [];
  const tags = Array.isArray(data?.tags) ? data.tags : [];
  const scans = Array.isArray(data?.scans) ? data.scans : [];
  const metrics = data?.metrics || {};

  const safePaymentRequests = Array.isArray(paymentRequests) ? paymentRequests : [];
  const pendingPayments = safePaymentRequests.filter((p) => p && p.status === "PENDING");

  const query = (searchQuery || "").toLowerCase();

  const filteredUsers = users.filter(
    (u: any) =>
      u?.name?.toLowerCase().includes(query) ||
      u?.email?.toLowerCase().includes(query) ||
      u?.phone?.includes(query)
  );

  const filteredPets = pets.filter(
    (p: any) =>
      p?.name?.toLowerCase().includes(query) ||
      p?.breed?.toLowerCase().includes(query) ||
      p?.ownerName?.toLowerCase().includes(query)
  );

  const filteredTags = tags.filter(
    (t: any) =>
      t?.tagCode?.toLowerCase().includes(query) ||
      t?.pet?.name?.toLowerCase().includes(query) ||
      t?.label?.toLowerCase().includes(query)
  );

  const filteredPayments = safePaymentRequests.filter(
    (p: any) =>
      p?.userName?.toLowerCase().includes(query) ||
      p?.userEmail?.toLowerCase().includes(query) ||
      p?.transactionId?.toLowerCase().includes(query) ||
      p?.requestedPlan?.toLowerCase().includes(query)
  );

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-red-500/20 text-red-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-red-500/40">
              Admin Command Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Platform Billing, Fraud &amp; Telemetry Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review user Meezan Bank payments, approve plan upgrades, and monitor real-time collar scans.
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

      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{actionSuccessMessage}</span>
        </div>
      )}

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Pending Payments Widget */}
        <div
          onClick={() => setActiveTab("payments")}
          className={`p-5 rounded-3xl border shadow-sm cursor-pointer transition-all ${
            pendingPayments.length > 0
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/30"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Pending Approvals
            </p>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-3xl font-black text-amber-700 mt-2">{pendingPayments.length}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{getSafeNumber(metrics.totalUsers || users.length)}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Pets</p>
            <Dog className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{getSafeNumber(metrics.totalPets || pets.length)}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active QR Tags</p>
            <QrCode className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{getSafeNumber(metrics.activeTags || tags.length)}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Scans</p>
            <Activity className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{getSafeNumber(metrics.totalScans || 0)}</p>
        </div>
      </div>

      {/* TAB NAVIGATION BAR */}
      <div className="bg-white rounded-3xl border border-slate-200 p-2 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {/* Payment Approvals Tab */}
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 relative ${
              activeTab === "payments"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Approvals ({safePaymentRequests.length})</span>
            {pendingPayments.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                {pendingPayments.length}
              </span>
            )}
          </button>

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
            <span>PKR Plans &amp; Pricing</span>
          </button>
        </div>

        {/* Global Filter / Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records / TxID..."
            className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* TAB CONTENT: PAYMENT APPROVALS */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          {/* Meezan Bank Receiver Reference Box */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-2xl p-1.5 shrink-0 flex items-center justify-center">
                <img
                  src={BANK_PAYMENT_CONFIG.qrCodeUrl}
                  alt="Meezan Bank QR"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Payment Collection Account
                </span>
                <h4 className="text-base font-extrabold text-white">
                  {BANK_PAYMENT_CONFIG.bankName} - {BANK_PAYMENT_CONFIG.accountTitle}
                </h4>
                <p className="text-slate-300">
                  Raast / Reference ID: <code className="font-mono bg-slate-800 px-1.5 py-0.5 rounded font-bold text-teal-300">{BANK_PAYMENT_CONFIG.raastOrAccountRef}</code>
                </p>
                <p className="text-slate-400 text-[11px]">
                  Receipts forwarded to: <strong className="text-slate-200">{BANK_PAYMENT_CONFIG.adminEmail}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-400">Awaiting Verification</p>
                <p className="text-2xl font-black text-amber-400">{pendingPayments.length} Requests</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Payment Upgrade Verifications ({filteredPayments.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Review submitted transaction IDs and activate user memberships.
                </p>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No payment upgrade requests submitted yet. When users pay via Meezan Bank QR and submit their Transaction ID, they will appear here for approval.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                      <th className="pb-3">User &amp; Contact</th>
                      <th className="pb-3">Plan Requested</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Transaction ID / Ref</th>
                      <th className="pb-3">Sender Details</th>
                      <th className="pb-3">Submitted</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((req: any) => {
                      const isPending = req.status === "PENDING";
                      const isApproved = req.status === "APPROVED";
                      const isProcessing = processingPaymentId === req.id;

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 font-medium">
                            <p className="font-bold text-slate-900">{req.userName}</p>
                            <p className="text-[11px] text-slate-500">{req.userEmail}</p>
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                                req.requestedPlan === "PRO"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : "bg-teal-50 text-teal-700 border-teal-200"
                              }`}
                            >
                              {req.requestedPlan === "PRO" ? "👑 Pro Household" : "⚡ Plus Recovery"}
                            </span>
                          </td>
                          <td className="py-3.5 font-bold text-slate-900">
                            Rs {getSafeNumber(req.amountPKR).toLocaleString()}
                          </td>
                          <td className="py-3.5">
                            <code className="font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-900 font-bold select-all">
                              {req.transactionId}
                            </code>
                          </td>
                          <td className="py-3.5 text-[11px] text-slate-600">
                            <p><strong>Title:</strong> {req.senderName}</p>
                            {req.senderPhone && <p><strong>Phone:</strong> {req.senderPhone}</p>}
                            {req.notes && <p className="italic text-slate-400">&ldquo;{req.notes}&rdquo;</p>}
                          </td>
                          <td className="py-3.5 text-slate-500 text-[11px]">
                            {formatTime(req.createdAt)}
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                isPending
                                  ? "bg-amber-50 text-amber-800 border-amber-300 animate-pulse"
                                  : isApproved
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right space-x-2">
                            {isPending ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() =>
                                    handleApprovePayment(
                                      req.id,
                                      req.userName,
                                      req.requestedPlan
                                    )
                                  }
                                  disabled={isProcessing}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl shadow-sm transition-all flex items-center gap-1"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleRejectPayment(req.id, req.userName)}
                                  disabled={isProcessing}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 font-bold text-[11px] rounded-xl transition-all flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                {isApproved ? "Activated" : "Declined"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: USERS */}
      {activeTab === "users" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">
              All Registered Users ({filteredUsers.length})
            </h3>
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
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-semibold text-slate-900">{u.name || "N/A"}</td>
                    <td className="py-3 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3 text-slate-600">{u.phone || "—"}</td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          u.role === "ADMIN"
                            ? "bg-red-100 text-red-700"
                            : "bg-teal-100 text-teal-700"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-slate-900">{getSafeNumber(u.petCount || 0)}</td>
                    <td className="py-3 text-slate-400">{formatTime(u.createdAt)}</td>
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
            <h3 className="text-base font-bold text-slate-900">
              Registered Pet Registry ({filteredPets.length})
            </h3>
            <span className="text-xs text-slate-500">Live animal records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="pb-3">Pet Name</th>
                  <th className="pb-3">Species / Breed</th>
                  <th className="pb-3">Owner Details</th>
                  <th className="pb-3">Assigned Collar Tag</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPets.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {p.name ? p.name[0] : "🐾"}
                      </div>
                      <span>{p.name || "Pet"}</span>
                    </td>
                    <td className="py-3 text-slate-600">
                      {p.species} • {p.breed || "Standard"}
                    </td>
                    <td className="py-3">
                      <p className="font-medium text-slate-900">{p.owner?.name || "Owner"}</p>
                      <p className="text-[10px] text-slate-400">{p.owner?.email || "—"}</p>
                    </td>
                    <td className="py-3">
                      {p.tagCode ? (
                        <code className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-teal-700 font-bold">
                          {p.tagCode}
                        </code>
                      ) : (
                        <span className="text-slate-400 italic">No tag assigned</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          p.status === "LOST"
                            ? "bg-red-100 text-red-700 animate-pulse"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{formatTime(p.createdAt)}</td>
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
            <h3 className="text-base font-bold text-slate-900">
              Collar QR Tags &amp; Hardware Badges ({filteredTags.length})
            </h3>
            <span className="text-xs text-slate-500">Security &amp; revocation control</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="pb-3">Tag Code</th>
                  <th className="pb-3">Associated Pet</th>
                  <th className="pb-3">Owner Contact</th>
                  <th className="pb-3">Scans Count</th>
                  <th className="pb-3">Tag Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTags.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="py-3">
                      <code className="font-mono bg-teal-50 border border-teal-200 text-teal-800 px-2 py-1 rounded font-bold">
                        {t.tagCode}
                      </code>
                    </td>
                    <td className="py-3 font-semibold text-slate-900">
                      {t.pet?.name || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="py-3 text-slate-600">
                      {t.owner?.email || "—"}
                    </td>
                    <td className="py-3 font-bold text-slate-900">
                      {getSafeNumber(t.scanCount)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          t.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <Link
                        href={`/p/${t.tagCode}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-700"
                      >
                        <span>View Passport</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      {t.status === "ACTIVE" && (
                        <button
                          onClick={() => handleRevokeTag(t.id)}
                          disabled={revokingId === t.id}
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[10px] font-bold transition-colors"
                        >
                          {revokingId === t.id ? "Revoking..." : "Revoke"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SCANS TELEMETRY */}
      {activeTab === "scans" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Live QR Scan Telemetry Stream ({scans.length})
            </h3>
            <span className="text-xs text-slate-500">Real-time scan logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="pb-3">Scanned Tag</th>
                  <th className="pb-3">Animal</th>
                  <th className="pb-3">Device / Category</th>
                  <th className="pb-3">IP Hash</th>
                  <th className="pb-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scans.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-mono font-bold text-teal-700">{s.tag?.tagCode || s.tagId}</td>
                    <td className="py-3 font-medium text-slate-900">{s.tag?.pet?.name || "Pet"}</td>
                    <td className="py-3 text-slate-600">
                      {s.deviceType || "Mobile"} ({s.userAgentCategory || "Unknown"})
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-400">
                      {s.ipHash ? s.ipHash.substring(0, 10) + "..." : "127.0.0.1"}
                    </td>
                    <td className="py-3 text-slate-500">{formatTime(s.createdAt)}</td>
                  </tr>
                ))}
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
                  Commercial plan pricing, Meezan Bank verification receiver, and feature allocations.
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
                  <li>• 1 Pet Profile &amp; QR Tag</li>
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
                  <li>• Emergency Lost Mode &amp; Reward Banner</li>
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
                  <li>• Unlimited Pets &amp; Tags</li>
                  <li>• Caretaker &amp; Family Delegation</li>
                  <li>• Digital Pet Passport &amp; Medical Alerts</li>
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
