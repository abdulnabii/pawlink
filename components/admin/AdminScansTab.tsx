"use client";

import React, { useEffect, useState } from "react";
import {
  MapPin,
  QrCode,
  AlertTriangle,
  Activity,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Clock,
  Smartphone,
  Laptop,
} from "lucide-react";

export function AdminScansTab() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });

  const fetchScans = (targetPage = page) => {
    setLoading(true);
    setError(null);

    fetch(`/api/admin/scans?page=${targetPage}&pageSize=20`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setScans(data.scans || []);
          setPagination(data.pagination || { total: 0, totalPages: 1 });
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load scans");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScans(1);
  }, []);

  const suspiciousScans = scans.filter((s) => s.isSuspicious);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Suspicious Patterns Alert Banner */}
      {suspiciousScans.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl text-amber-900 text-xs font-bold flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-extrabold text-sm text-amber-950">
                {suspiciousScans.length} Suspicious Scan Pattern(s) Flagged for Review
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Rapid repeated scans from single sources detected. Throttling and deduplication are active.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-800 text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchScans(page)} className="underline hover:text-red-950">
            Try Again
          </button>
        </div>
      )}

      {/* Scans Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5 min-w-[130px]">Time</th>
                <th className="px-6 py-3.5 min-w-[120px]">Tag Code</th>
                <th className="px-6 py-3.5 min-w-[170px]">Pet &amp; Owner</th>
                <th className="px-6 py-3.5 min-w-[160px]">Approximate Location</th>
                <th className="px-6 py-3.5 min-w-[160px]">Device &amp; Browser</th>
                <th className="px-6 py-3.5 min-w-[110px]">IP Hash</th>
                <th className="px-6 py-3.5 min-w-[100px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 animate-pulse">
                    Loading live scan events...
                  </td>
                </tr>
              ) : scans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No scan activity logged yet.
                  </td>
                </tr>
              ) : (
                scans.map((scan) => {
                  const pet = scan.tag?.assignments?.[0]?.pet;
                  return (
                    <tr
                      key={scan.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        scan.isSuspicious ? "bg-amber-50/40" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">
                          {new Date(scan.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(scan.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-900 font-extrabold">
                          {scan.tag?.tagCode || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {pet ? (
                          <div>
                            <p className="font-bold text-slate-900">{pet.name} ({pet.species})</p>
                            <p className="text-[10px] text-slate-400">Owner: {pet.user?.name}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned Tag</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{scan.approximateLocation || "Direct Scan via QR"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          {scan.userAgentCategory === "Mobile" ? (
                            <Smartphone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          ) : (
                            <Laptop className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                          <span>{scan.deviceType || "Mobile"} {scan.browser ? `(${scan.browser})` : ""}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                        {scan.ipHash ? `${scan.ipHash.substring(0, 10)}...` : "—"}
                      </td>
                      <td className="px-6 py-4">
                        {scan.isSuspicious ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-black uppercase rounded-full">
                            Flagged
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-teal-100 text-teal-800 border border-teal-200 text-[9px] font-black uppercase rounded-full">
                            Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing page <strong>{page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total scan events)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prev = Math.max(1, page - 1);
                setPage(prev);
                fetchScans(prev);
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
                fetchScans(next);
              }}
              disabled={page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
