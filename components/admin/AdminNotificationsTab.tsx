"use client";

import React, { useEffect, useState } from "react";
import {
  BellRing,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Zap,
} from "lucide-react";

export function AdminNotificationsTab() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ queued: 0, processing: 0, completed: 0, failed: 0, failureRate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchJobs = () => {
    setLoading(true);
    setError(null);

    fetch("/api/admin/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setJobs(data.jobs || []);
          setStats(data.stats || { queued: 0, processing: 0, completed: 0, failed: 0, failureRate: 0 });
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load notifications");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleRetryJob = async (jobId: string) => {
    setRetryingId(jobId);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Retry failed");

      fetchJobs();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to retry job");
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Queue Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Queued Jobs</span>
          <p className="text-3xl font-black text-slate-900 mt-2">{stats.queued}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Processing</span>
          <p className="text-3xl font-black text-slate-900 mt-2">{stats.processing}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Completed</span>
          <p className="text-3xl font-black text-emerald-600 mt-2">{stats.completed}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase text-red-600 tracking-wider">Failed Jobs</span>
          <p className="text-3xl font-black text-red-600 mt-2">{stats.failed}</p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-800 text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchJobs} className="underline hover:text-red-950">
            Try Again
          </button>
        </div>
      )}

      {/* Jobs Queue Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Durable Notification Queue</h3>
            <p className="text-xs text-slate-400">PostgreSQL backed asynchronous dispatch stream with exponential retry</p>
          </div>
          <button
            onClick={fetchJobs}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5 min-w-[150px]">Event Type</th>
                <th className="px-6 py-3.5 min-w-[120px]">Status</th>
                <th className="px-6 py-3.5 min-w-[100px]">Attempts</th>
                <th className="px-6 py-3.5 min-w-[140px]">Scheduled / Processed</th>
                <th className="px-6 py-3.5 min-w-[180px]">Error Info</th>
                <th className="px-6 py-3.5 text-right sticky right-0 bg-slate-50 z-10 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 animate-pulse">
                    Loading notification jobs queue...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No notification jobs in queue.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{job.type}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{job.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          job.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : job.status === "FAILED"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : job.status === "PROCESSING"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {job.attempts} / {job.maxAttempts || 4}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-500">
                      {new Date(job.scheduledAt || job.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-[10px] text-red-600 max-w-xs truncate">
                      {job.lastError || "None"}
                    </td>
                    <td className="px-6 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50/80 transition-colors z-10 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">
                      {job.status === "FAILED" && (
                        <button
                          onClick={() => handleRetryJob(job.id)}
                          disabled={retryingId === job.id}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-sm transition-colors disabled:opacity-50"
                        >
                          {retryingId === job.id ? "Retrying..." : "Retry"}
                        </button>
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
