"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Dog,
  MapPin,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  X,
  MessageSquare,
  QrCode,
  Activity,
  ArrowRight,
} from "lucide-react";

interface AdminRecoveryTabProps {
  adminRole: string;
}

export function AdminRecoveryTab({ adminRole }: AdminRecoveryTabProps) {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("OPEN");

  // Resolve Modal
  const [resolvingCase, setResolvingCase] = useState<any | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [processingResolution, setProcessingResolution] = useState(false);

  const fetchCases = () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/admin/recovery?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setCases(data.cases || []);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load recovery cases");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter]);

  const handleResolveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingCase) return;
    setProcessingResolution(true);

    try {
      const res = await fetch(`/api/admin/recovery/${resolvingCase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLVED",
          resolutionNote: resolutionNote || "Pet safely reunited with family!",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resolve recovery case");

      setResolvingCase(null);
      setResolutionNote("");
      fetchCases();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to resolve case");
    } finally {
      setProcessingResolution(false);
    }
  };

  const openCases = cases.filter((c) => c.status === "OPEN");

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header & Status Filter */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900">Emergency Recovery Console</h2>
          <p className="text-xs text-slate-400">Live operational command center for lost pet recoveries</p>
        </div>

        <div className="flex items-center gap-2">
          {["OPEN", "RESOLVED", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                statusFilter === s
                  ? s === "OPEN"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-teal-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s} ({cases.filter((c) => c.status === s).length})
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-800 text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchCases} className="underline hover:text-red-950">
            Try Again
          </button>
        </div>
      )}

      {/* Recovery Cases Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
          Loading active recovery cases...
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-teal-500 mx-auto" />
          <h3 className="text-sm font-extrabold text-slate-900">No {statusFilter.toLowerCase()} recovery cases</h3>
          <p className="text-xs text-slate-400">All registered animals are safe at home.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cases.map((rc) => {
            const pet = rc.pet;
            const owner = pet?.user;
            const tag = pet?.tagAssignments?.[0]?.tag;
            const scanEvents = Array.isArray(rc.scanEvents) ? rc.scanEvents : [];
            const locationEvents = Array.isArray(rc.locationEvents) ? rc.locationEvents : [];
            const conversations = Array.isArray(rc.conversations) ? rc.conversations : [];

            return (
              <div
                key={rc.id}
                className={`bg-white rounded-3xl border p-6 shadow-sm space-y-5 transition-all ${
                  rc.status === "OPEN" ? "border-red-200 ring-1 ring-red-100" : "border-slate-200"
                }`}
              >
                {/* Pet Header */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                      rc.status === "OPEN" ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-700"
                    }`}>
                      <Dog className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-slate-900">{pet?.name || "Lost Pet"}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          rc.status === "OPEN" ? "bg-red-600 text-white animate-pulse" : "bg-teal-100 text-teal-800"
                        }`}>
                          {rc.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {pet?.species} • {pet?.breed || "Standard"} • Tag: <span className="font-mono font-bold text-slate-700">{tag?.tagCode || "N/A"}</span>
                      </p>
                    </div>
                  </div>

                  {rc.status === "OPEN" && (
                    <button
                      onClick={() => setResolvingCase(rc)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                    >
                      Mark Reunited
                    </button>
                  )}
                </div>

                {/* Owner Info & Last Known Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Owner</span>
                    <p className="font-bold text-slate-900">{owner?.name || "Pet Owner"}</p>
                    <p className="text-slate-500 font-mono text-[11px] mt-0.5">{owner?.phone || "No phone"}</p>
                    <p className="text-slate-400 text-[10px]">{owner?.email}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Last Reported Area</span>
                    <p className="font-bold text-slate-900">{rc.lastSeenLocation || "Location not specified"}</p>
                    {rc.rewardAmount > 0 && (
                      <p className="text-teal-700 font-bold text-[11px] mt-0.5">Reward: ${rc.rewardAmount}</p>
                    )}
                  </div>
                </div>

                {/* Quick Signals Counters */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block">Scans</span>
                    <span className="font-black text-slate-900 text-sm">{scanEvents.length}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block">Locations Shared</span>
                    <span className="font-black text-slate-900 text-sm">{locationEvents.length}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block">Finder Chats</span>
                    <span className="font-black text-slate-900 text-sm">{conversations.length}</span>
                  </div>
                </div>

                {/* Chronological Recovery Timeline */}
                <div>
                  <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider mb-2.5">
                    Recovery Activity Timeline
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {rc.recoveryEvents?.length === 0 ? (
                      <p className="text-slate-400 text-xs italic">Awaiting finder activity...</p>
                    ) : (
                      rc.recoveryEvents?.slice(0, 4).map((ev: any) => (
                        <div key={ev.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-teal-500" />
                            <span className="font-bold text-slate-800">{ev.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(ev.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolve Case Modal */}
      {resolvingCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleResolveCase}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Celebrate Recovery</h3>
              <button
                type="button"
                onClick={() => setResolvingCase(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Marking <strong>{resolvingCase.pet?.name}</strong> as safely recovered. Lost Mode will be turned off and status set to SAFE.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Resolution Note (Optional)</label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="How was the pet recovered? (e.g. Finder scanned QR tag and shared GPS location)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResolvingCase(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processingResolution}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow transition-colors disabled:opacity-50"
              >
                {processingResolution ? "Resolving..." : "Confirm Reunited"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
