"use client";

import React, { useEffect, useState } from "react";
import {
  LifeBuoy,
  Search,
  CheckCircle2,
  XCircle,
  X,
  MessageSquare,
} from "lucide-react";

export function AdminSupportTab() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/admin/support?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setTickets(data.tickets || []);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load support tickets");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const handleUpdateTicket = async (status: string) => {
    if (!selectedTicket) return;
    setUpdating(true);

    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          status,
          response: replyText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setSelectedTicket(null);
      setReplyText("");
      fetchTickets();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update ticket");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900">Support Help Desk</h2>
          <p className="text-xs text-slate-400">Triage user assistance requests, tag inquiries, and recovery help</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
        >
          <option value="">All Tickets</option>
          <option value="OPEN">Open (Pending)</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-800 text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchTickets} className="underline hover:text-red-950">
            Try Again
          </button>
        </div>
      )}

      {/* Tickets Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5 min-w-[180px]">Subject</th>
                <th className="px-6 py-3.5 min-w-[130px]">Category</th>
                <th className="px-6 py-3.5 min-w-[100px]">Priority</th>
                <th className="px-6 py-3.5 min-w-[120px]">Status</th>
                <th className="px-6 py-3.5 min-w-[110px]">Created</th>
                <th className="px-6 py-3.5 text-right sticky right-0 bg-slate-50 z-10 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 animate-pulse">
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No support tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{t.subject}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{t.id}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{t.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        t.priority === "URGENT" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          t.status === "OPEN"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : t.status === "IN_PROGRESS"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-teal-100 text-teal-800 border-teal-200"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50/80 transition-colors z-10 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg transition-colors shadow-sm"
                      >
                        Respond
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">{selectedTicket.subject}</h3>
                <p className="text-xs text-slate-400">Category: {selectedTicket.category} • Priority: {selectedTicket.priority}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700">
              <p className="font-bold text-slate-900 mb-1">User Query:</p>
              <p>{selectedTicket.message}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Support Response</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type response to be dispatched to pet owner..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleUpdateTicket("IN_PROGRESS")}
                disabled={updating}
                className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200"
              >
                Set In Progress
              </button>
              <button
                onClick={() => handleUpdateTicket("RESOLVED")}
                disabled={updating}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Resolve Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
