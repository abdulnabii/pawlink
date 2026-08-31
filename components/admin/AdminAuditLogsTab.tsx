"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Shield,
  X,
  Code,
} from "lucide-react";

export function AdminAuditLogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [entityFilter, setEntityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });

  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = (targetPage = page) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (entityFilter) params.set("entityType", entityFilter);
    params.set("page", targetPage.toString());
    params.set("pageSize", "20");

    fetch(`/api/admin/audit?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setLogs(data.logs || []);
          setPagination(data.pagination || { total: 0, totalPages: 1 });
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load audit logs");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs(1);
    setPage(1);
  }, [entityFilter]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900">Immutable Audit Trail</h2>
          <p className="text-xs text-slate-400">Append-only chronological log of all administrator actions and overrides</p>
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
        >
          <option value="">All Entity Types</option>
          <option value="USER">User Actions</option>
          <option value="PET">Pet Overrides</option>
          <option value="TAG">Tag Lifecycle</option>
          <option value="RECOVERY_CASE">Recovery Cases</option>
          <option value="NOTIFICATION_JOB">Queue Retries</option>
          <option value="REPORT">Moderation</option>
          <option value="FEATURE_FLAG">Feature Flags</option>
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-800 text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchLogs(page)} className="underline hover:text-red-950">
            Try Again
          </button>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5 min-w-[140px]">Timestamp</th>
                <th className="px-6 py-3.5 min-w-[180px]">Action Executed</th>
                <th className="px-6 py-3.5 min-w-[160px]">Actor (Admin)</th>
                <th className="px-6 py-3.5 min-w-[140px]">Entity</th>
                <th className="px-6 py-3.5 text-right sticky right-0 bg-slate-50 z-10 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] min-w-[100px]">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 animate-pulse">
                    Loading immutable audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-teal-800 bg-teal-50/50 rounded">
                      {log.action}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{log.user?.name || "System Admin"}</p>
                      <p className="text-[10px] text-slate-400">{log.user?.email || "internal"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">{log.entityType || "GENERAL"}</span>
                      {log.entityId && (
                        <div className="text-[10px] text-slate-400 font-mono">{log.entityId}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50/80 transition-colors z-10 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 ml-auto shadow-sm"
                      >
                        <Code className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing page <strong>{page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} records)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prev = Math.max(1, page - 1);
                setPage(prev);
                fetchLogs(prev);
              }}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const next = Math.min(pagination.totalPages, page + 1);
                setPage(next);
                fetchLogs(next);
              }}
              disabled={page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Log Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">{selectedLog.action}</h3>
                <p className="text-xs text-slate-400">Actor: {selectedLog.user?.email || "System"}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl overflow-x-auto text-teal-300 font-mono text-[11px]">
              <pre>{JSON.stringify(selectedLog.metadata ? (typeof selectedLog.metadata === "string" ? JSON.parse(selectedLog.metadata) : selectedLog.metadata) : { target: selectedLog.entityId }, null, 2)}</pre>
            </div>

            <div className="text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
