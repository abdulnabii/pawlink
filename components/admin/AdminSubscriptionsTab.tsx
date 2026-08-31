"use client";

import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Mail,
  User,
} from "lucide-react";
import { BANK_PAYMENT_CONFIG } from "@/lib/plans";

export function AdminSubscriptionsTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSubscriptions = () => {
    setLoading(true);
    setError(null);

    fetch("/api/admin/subscriptions")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setRequests(data.requests || []);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load payment requests");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm("Confirm approval of this bank payment? The user plan will be immediately activated.")) return;
    setProcessingId(id);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/subscriptions/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval failed");

      setActionSuccess("Payment approved and plan activated!");
      fetchSubscriptions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to approve payment");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter reason for rejection (e.g. Invalid Transaction ID, Funds Not Received):");
    if (reason === null) return;
    setProcessingId(id);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/subscriptions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rejection failed");

      setActionSuccess("Payment request rejected.");
      fetchSubscriptions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to reject payment");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Bank Account Reference Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-700">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-400 font-black text-xs uppercase tracking-widest">
            <Building className="w-4 h-4" /> Official Bank Account
          </div>
          <h2 className="text-xl font-black">{BANK_PAYMENT_CONFIG.bankName}</h2>
          <p className="text-xs text-slate-300 font-medium">
            Account: <strong>{BANK_PAYMENT_CONFIG.accountTitle}</strong> • Raast: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-teal-300">{BANK_PAYMENT_CONFIG.raastOrAccountRef}</code>
          </p>
        </div>
        <div className="bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700 text-right shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Verification</span>
          <span className="text-2xl font-black text-amber-400">{pendingRequests.length} Requests</span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-teal-900 text-xs font-bold flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-teal-700 hover:text-teal-950 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-800 text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSubscriptions} className="underline hover:text-red-950">
            Try Again
          </button>
        </div>
      )}

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Meezan Bank Raast Payment Verification</h3>
            <p className="text-xs text-slate-400">Review submitted transaction IDs and approve membership upgrades</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5 min-w-[160px]">User</th>
                <th className="px-6 py-3.5 min-w-[140px]">Requested Plan</th>
                <th className="px-6 py-3.5 min-w-[150px]">Transaction ID</th>
                <th className="px-6 py-3.5 min-w-[140px]">Sender Info</th>
                <th className="px-6 py-3.5 min-w-[110px]">Status</th>
                <th className="px-6 py-3.5 min-w-[110px]">Submitted</th>
                <th className="px-6 py-3.5 text-right sticky right-0 bg-slate-50 z-10 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] min-w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 animate-pulse">
                    Loading payment verification requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No pending or past payment requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{req.user?.name || "Pet Owner"}</div>
                      <div className="text-[10px] text-slate-400">{req.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-extrabold px-2.5 py-1 rounded-full text-[10px] bg-teal-100 text-teal-800">
                        {req.plan} ({req.billingCycle || "MONTHLY"})
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="bg-slate-100 text-slate-900 font-mono font-bold px-2 py-0.5 rounded text-[11px]">
                        {req.transactionId || "N/A"}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{req.senderName || "—"}</p>
                      <p className="text-[10px] text-slate-400">{req.senderPhone || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          req.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : req.status === "REJECTED"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-amber-100 text-amber-800 border-amber-200 animate-pulse"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 sticky right-0 bg-white group-hover:bg-slate-50/80 transition-colors z-10 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">
                      {req.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={processingId === req.id}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-sm transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={processingId === req.id}
                            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
