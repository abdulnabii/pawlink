"use client";

import { useEffect, useState } from "react";
import {
  QrCode,
  Plus,
  Play,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";

// Inline the badge to avoid any import chain issues
function TagBadge({
  tagCode,
  petName,
  species,
}: {
  tagCode: string;
  petName: string;
  species: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const baseUrl =
    mounted && typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://pawlink-chi.vercel.app";
  const scanUrl = `${baseUrl}/p/${encodeURIComponent(tagCode)}`;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&ecc=H&data=${encodeURIComponent(scanUrl)}`;

  return (
    <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6 flex flex-col sm:flex-row items-center gap-6">
      <div className="w-40 h-52 bg-white rounded-3xl p-3 shadow-lg border-2 border-slate-800 flex flex-col items-center justify-between text-center shrink-0">
        <div className="text-[9px] font-black tracking-widest text-teal-700 uppercase">PAWLINK TAG</div>
        <img
          src={qrImgUrl}
          alt={`QR Code for ${petName}`}
          className="w-24 h-24 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).alt = "QR unavailable";
          }}
        />
        <div>
          <p className="font-extrabold text-xs text-slate-900 uppercase">{petName}</p>
          <p className="text-[9px] font-mono text-slate-500">{tagCode}</p>
          <p className="text-[8px] text-teal-600 font-bold uppercase tracking-wide">SCAN IF LOST</p>
        </div>
      </div>
      <div className="text-xs text-slate-600 space-y-1 text-left">
        <p><strong>Tag Code:</strong> <code className="bg-slate-200 px-1 rounded font-mono">{tagCode}</code></p>
        <p><strong>Pet:</strong> {petName} ({species})</p>
        <p><strong>Scan URL:</strong></p>
        <a
          href={scanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-600 font-semibold text-[11px] break-all hover:underline"
        >
          {scanUrl}
        </a>
        <div className="pt-2 flex gap-2">
          <a
            href={qrImgUrl}
            download={`PawLink-${petName}-${tagCode}.png`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            Download QR
          </a>
          <button
            onClick={() => window.print()}
            className="text-[11px] font-bold bg-slate-900 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Print Badge
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TagsManagerPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [testingTagId, setTestingTagId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const [showNewTagModal, setShowNewTagModal] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [tagLabel, setTagLabel] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);

  const fetchTagsAndPets = () => {
    setFetchError(null);
    Promise.all([
      fetch("/api/tags")
        .then((res) => res.json())
        .catch(() => ({ tags: [] })),
      fetch("/api/pets")
        .then((res) => res.json())
        .catch(() => ({ pets: [] })),
      fetch("/api/subscription")
        .then((res) => res.json())
        .catch(() => ({})),
    ])
      .then(([tagsData, petsData, subData]) => {
        const loadedTags = Array.isArray(tagsData?.tags) ? tagsData.tags : [];
        const loadedPets = Array.isArray(petsData?.pets) ? petsData.pets : [];
        setTags(loadedTags);
        setPets(loadedPets);
        if (subData?.subscription) setSubscription(subData.subscription);
        setLoading(false);
      })
      .catch((err) => {
        setFetchError(String(err));
        setLoading(false);
      });
  };

  useEffect(() => {
    setMounted(true);
    fetchTagsAndPets();
  }, []);

  if (!mounted || loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Collar Tags &amp; Badges</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage QR collar tags, download printable badges, and test scan notifications.
            </p>
          </div>
        </div>
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Loading tags...</div>
      </div>
    );
  }

  const handleTestTag = async (tagId: string) => {
    setTestingTagId(tagId);
    setTestResult(null);
    try {
      const res = await fetch(`/api/tags/${tagId}/test`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setTestResult(data.message || "Test scan simulated successfully!");
        fetchTagsAndPets();
      } else {
        alert(data.error || "Test scan failed");
      }
    } catch {
      alert("Network error during test simulation");
    } finally {
      setTestingTagId(null);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTag(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petId: selectedPetId || null,
          label: tagLabel || "Collar Tag",
        }),
      });
      if (res.ok) {
        setShowNewTagModal(false);
        setTagLabel("");
        setSelectedPetId("");
        fetchTagsAndPets();
      }
    } catch {
      alert("Failed to generate tag");
    } finally {
      setCreatingTag(false);
    }
  };

  const getSafeNumber = (val: any): number => {
    if (typeof val === "number" && !isNaN(val)) return val;
    if (val && typeof val === "object") {
      if (typeof val.increment === "number") return val.increment;
      if (typeof val.toNumber === "function") return val.toNumber();
    }
    const parsed = Number(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const safeTags = Array.isArray(tags) ? tags : [];
  const safePets = Array.isArray(pets) ? pets : [];

  const planId = (subscription?.plan || "FREE").toUpperCase();
  const maxAllowedTags = planId === "PRO" ? 999 : planId === "PLUS" ? 5 : 1;
  const isTagLimitReached = safeTags.length >= maxAllowedTags;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Collar Tags &amp; Badges</h1>
            {loading || !subscription ? (
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border bg-slate-100 text-slate-400 border-slate-200 animate-pulse">
                Loading Plan...
              </span>
            ) : (
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  isTagLimitReached
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {safeTags.length} / {maxAllowedTags === 999 ? "∞" : maxAllowedTags} Tags ({planId === "PRO" ? "Pro" : planId === "PLUS" ? "Plus" : "Basic ID"})
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage QR collar tags, download printable badges, and test scan notifications.
          </p>
        </div>
        {isTagLimitReached ? (
          <a
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Upgrade to Add Tag</span>
          </a>
        ) : (
          <button
            onClick={() => setShowNewTagModal(true)}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Tag</span>
          </button>
        )}
      </div>

      {testResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{testResult}</span>
          </div>
          <button onClick={() => setTestResult(null)} className="text-xs text-emerald-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {fetchError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-mono break-all">
          API Error: {fetchError}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading collar tags...</div>
      ) : safeTags.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No tags generated yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Generate your first QR collar tag to protect your pet.
          </p>
          <button
            onClick={() => setShowNewTagModal(true)}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Generate First Tag</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {safeTags.map((tag, idx) => {
            // All property access is fully guarded
            const tagId = tag?.id ?? `tag-${idx}`;
            const tagCode = tag?.tagCode ?? "";
            const tagStatus = tag?.status ?? "UNKNOWN";
            const scanCount = getSafeNumber(tag?.scanCount ?? tag?._count?.scanEvents);

            // Assignments — Prisma relation is named 'assignments'
            const assignmentsArr = Array.isArray(tag?.assignments) ? tag.assignments : [];
            const activeAssignment = assignmentsArr.find((a: any) => a != null && !a.unassignedAt) ?? null;
            const pet = activeAssignment?.pet ?? null;
            const petName = pet?.name ?? "";
            const petSpecies = pet?.species ?? "";

            return (
              <div key={tagId} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                {/* Tag Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shrink-0">
                      <QrCode className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-base text-slate-900">{tagCode}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          tagStatus === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {tagStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {petName ? (
                          <>Attached to <strong>{petName}</strong>{petSpecies ? ` (${petSpecies})` : ""}</>
                        ) : (
                          <span className="text-amber-600 font-semibold">Unassigned Spare Tag</span>
                        )}
                        {" • "}Scans: <strong>{scanCount}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {petName && (
                      <button
                        onClick={() => handleTestTag(tagId)}
                        disabled={testingTagId === tagId}
                        className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-indigo-200"
                      >
                        {testingTagId === tagId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span>Test My Tag</span>
                      </button>
                    )}
                    {tagCode && (
                      <a
                        href={`/p/${tagCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live Scan View</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Printable Badge — only if all required fields are present */}
                {tagCode && petName && petSpecies && (
                  <div className="pt-6">
                    <TagBadge tagCode={tagCode} petName={petName} species={petSpecies} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Tag Modal */}
      {showNewTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Generate Cryptographic QR Tag</h3>
            <p className="text-xs text-slate-500 mb-4">
              Generates a new 128-bit secure tag identifier.
            </p>
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assign to Pet</label>
                <select
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">-- Leave as Unassigned Spare --</option>
                  {safePets.map((p) => (
                    <option key={p?.id} value={p?.id}>
                      {p?.name} ({p?.species})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tag Label</label>
                <input
                  type="text"
                  value={tagLabel}
                  onChange={(e) => setTagLabel(e.target.value)}
                  placeholder="e.g. Max's Primary Collar"
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTagModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTag}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
                >
                  {creatingTag ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Generate Tag</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
