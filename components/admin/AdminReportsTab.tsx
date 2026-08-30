"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
} from "lucide-react";

export function AdminReportsTab() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  const fetchReports = () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);

    fetch(`/api/admin/reports?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setReports(data.reports || []);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load reports");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, categoryFilter]);

  const handleResolveReport = async (status: string, actionTaken: string) => {
    if (!selectedReport) return;
    setResolving(true);

    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: selectedReport.id,
          status,
          actionTaken,
          notes: actionNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      setSelectedReport(null);
      setActionNotes("");
      fetchReports();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update report");
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900">Reports &amp; Moderation Center</h2>
          <p className="text-xs text-slate-400">Review reported pets, messages, abusive accounts and spam</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ACTION_TAKEN">Action Taken</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="">All Categories</option>
            <option value="SPAM">Spam</option>
            <option value="HARASSMENT">Harassment</option>
            <option value="FAKE_PET">Fake Pet</option>
            <option value="ABUSIVE_MESSAGE">Abusive Message</option>
            <option value="FRAUD">Fraud</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-800 text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchReports} className="underline hover:text-red-950">
            Try Again
          </button>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Target</th>
                <th className="px-6 py-3.5">Reason</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 animate-pulse">
                    Loading moderation reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No moderation reports in queue.
                  </td>
                </tr>
              ) : (
                reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-slate-900">{rep.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">{rep.targetType}</span>
                      <div className="text-[10px] text-slate-400 font-mono">{rep.targetId}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-700">
                      {rep.reason}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          rep.status === "OPEN"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : rep.status === "ACTION_TAKEN"
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : "bg-teal-100 text-teal-800 border-teal-200"
                        }`}
                      >
                        {rep.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-500">
                      {new Date(rep.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedReport(rep)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg transition-colors"
                      >
                        Triage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Triage Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Moderation Triage</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p><strong>Category:</strong> {selectedReport.category}</p>
              <p><strong>Target:</strong> {selectedReport.targetType} ({selectedReport.targetId})</p>
              <p className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
                <strong>Reason:</strong> {selectedReport.reason}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Admin Action Notes</label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Document action taken (e.g. Account warned, Tag revoked, Message deleted)..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleResolveReport("DISMISSED", "Dismissed - No Violation")}
                disabled={resolving}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Dismiss
              </button>
              <button
                onClick={() => handleResolveReport("ACTION_TAKEN", "Moderation Sanction Imposed")}
                disabled={resolving}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Take Action
              </button>
              <button
                onClick={() => handleResolveReport("RESOLVED", "Issue Resolved")}
                disabled={resolving}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
