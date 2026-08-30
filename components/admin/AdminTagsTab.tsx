"use client";

import React, { useEffect, useState } from "react";
import {
  QrCode,
  Search,
  Plus,
  Lock,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface AdminTagsTabProps {
  adminRole: string;
}

export function AdminTagsTab({ adminRole }: AdminTagsTabProps) {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });

  // Generate Batch Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [batchCount, setBatchCount] = useState(10);
  const [batchLabel, setBatchLabel] = useState("Pro Series Collar Tag");
  const [generating, setGenerating] = useState(false);
  const [generateSuccess, setGenerateSuccess] = useState<string | null>(null);

  // Tag Action State
  const [processingTagId, setProcessingTagId] = useState<string | null>(null);

  const fetchTags = (targetPage = page) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", targetPage.toString());
    params.set("pageSize", "15");

    fetch(`/api/admin/tags?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setTags(data.tags || []);
          setPagination(data.pagination || { total: 0, totalPages: 1 });
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load tags");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTags(1);
    setPage(1);
  }, [search, statusFilter]);

  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenerateSuccess(null);

    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: Number(batchCount), label: batchLabel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate tags");

      setGenerateSuccess(`Generated ${data.createdCount} new tags successfully!`);
      fetchTags(1);
      setTimeout(() => {
        setShowGenerateModal(false);
        setGenerateSuccess(null);
      }, 1200);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to generate tags");
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateTagStatus = async (tagId: string, action: string) => {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this tag?`)) return;
    setProcessingTagId(tagId);

    try {
      const res = await fetch(`/api/admin/tags/${tagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: `Admin ${action} request` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update tag status");

      fetchTags(page);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update tag");
    } finally {
      setProcessingTagId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Search & Actions Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by tag code or pet name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium font-mono uppercase"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="">All Tag Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive (Suspended)</option>
            <option value="REVOKED">Revoked (Deactivated)</option>
          </select>

          {adminRole === "SUPER_ADMIN" && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> Manufacture Tags
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-800 text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchTags(page)} className="underline hover:text-red-950">
            Try Again
          </button>
        </div>
      )}

      {/* Tags Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Tag Code</th>
                <th className="px-6 py-3.5">Assigned Pet</th>
                <th className="px-6 py-3.5">Owner</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Lifetime Scans</th>
                <th className="px-6 py-3.5">Manufactured</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 animate-pulse">
                    Loading collar tag inventory...
                  </td>
                </tr>
              ) : tags.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No tags matching criteria found.
                  </td>
                </tr>
              ) : (
                tags.map((tag) => {
                  const pet = tag.assignments?.[0]?.pet;
                  return (
                    <tr key={tag.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-extrabold text-slate-900">{tag.tagCode}</div>
                        <div className="text-[10px] text-slate-400">{tag.label || "Collar Tag"}</div>
                      </td>
                      <td className="px-6 py-4">
                        {pet ? (
                          <div>
                            <p className="font-bold text-slate-900">{pet.name}</p>
                            <p className="text-[10px] text-slate-400">{pet.species}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned (Available)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {pet?.user ? (
                          <div>
                            <p className="font-bold text-slate-900">{pet.user.name}</p>
                            <p className="text-[10px] text-slate-400">{pet.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            tag.status === "ACTIVE"
                              ? "bg-teal-100 text-teal-800 border-teal-200"
                              : tag.status === "REVOKED"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {tag.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{tag._count?.scanEvents || tag.scanCount || 0}</td>
                      <td className="px-6 py-4 text-[11px] text-slate-500">
                        {new Date(tag.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {tag.status === "ACTIVE" ? (
                          <button
                            onClick={() => handleUpdateTagStatus(tag.id, "REVOKE")}
                            disabled={processingTagId === tag.id}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold rounded-lg transition-colors border border-red-200"
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateTagStatus(tag.id, "REACTIVATE")}
                            disabled={processingTagId === tag.id}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold rounded-lg transition-colors border border-teal-200"
                          >
                            Reactivate
                          </button>
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
            Showing page <strong>{page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total tags)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prev = Math.max(1, page - 1);
                setPage(prev);
                fetchTags(prev);
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
                fetchTags(next);
              }}
              disabled={page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Batch Manufacture Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleGenerateBatch}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Manufacture New Tags</h3>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generateSuccess && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-bold">
                {generateSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Batch Label / Collection</label>
              <input
                type="text"
                value={batchLabel}
                onChange={(e) => setBatchLabel(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quantity to Generate (1–50)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={batchCount}
                onChange={(e) => setBatchCount(parseInt(e.target.value, 10))}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generating}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow transition-colors disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate Batch"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
