"use client";

import { useEffect, useState } from "react";
import {
  QrCode,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Sparkles,
} from "lucide-react";
import { PrintableTagBadge } from "@/components/qr/PrintableTagBadge";

export default function TagsManagerPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Test scan simulation state
  const [testingTagId, setTestingTagId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  // New tag modal state
  const [showNewTagModal, setShowNewTagModal] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [tagLabel, setTagLabel] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);

  const fetchTagsAndPets = () => {
    Promise.all([
      fetch("/api/tags").then((res) => res.json()),
      fetch("/api/pets").then((res) => res.json()),
    ])
      .then(([tagsData, petsData]) => {
        if (tagsData?.tags) setTags(tagsData.tags);
        if (petsData?.pets) setPets(petsData.pets);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTagsAndPets();
  }, []);

  const handleTestTag = async (tag: any) => {
    setTestingTagId(tag.id);
    setTestResult(null);

    try {
      const res = await fetch(`/api/tags/${tag.id}/test`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setTestResult(data.message || `Test scan successful! Alert sent for ${data.petName}.`);
        fetchTagsAndPets();
      } else {
        alert(data.error || "Test scan simulation failed");
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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Collar Tags & Badges</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage unique high-entropy QR tags, download printable collar badges, and test notifications.
          </p>
        </div>
        <button
          onClick={() => setShowNewTagModal(true)}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-teal-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Tag</span>
        </button>
      </div>

      {testResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-950">Test Scan Simulated Successfully!</p>
              <p>{testResult}</p>
            </div>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-xs text-emerald-700 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading collar tags...</div>
      ) : tags.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No tags generated yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Generate your first high-entropy QR collar tag to protect your pet.
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
          {tags.map((tag) => {
            const activeAssignment = tag.assignments?.find((a: any) => !a.unassignedAt);
            const pet = activeAssignment?.pet;

            return (
              <div key={tag.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-mono font-bold text-lg border border-teal-100 shrink-0">
                      <QrCode className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-base text-slate-900">{tag.tagCode}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          tag.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {tag.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {pet ? (
                          <>Attached to <strong>{pet.name}</strong> ({pet.species})</>
                        ) : (
                          <span className="text-amber-600 font-semibold">Unassigned Spare Tag</span>
                        )}
                        {" • "}Total Scans: <strong>{tag.scanCount}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {pet && (
                      <button
                        onClick={() => handleTestTag(tag)}
                        disabled={testingTagId === tag.id}
                        className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-indigo-200 transition-colors"
                      >
                        {testingTagId === tag.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span>Test My Tag</span>
                      </button>
                    )}

                    <a
                      href={`/p/${tag.tagCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Live Scan View</span>
                    </a>
                  </div>
                </div>

                {/* Printable Vector Badge */}
                {pet && (
                  <div className="pt-6">
                    <PrintableTagBadge
                      tagCode={tag.tagCode}
                      petName={pet.name}
                      species={pet.species}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* NEW TAG GENERATION MODAL */}
      {showNewTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Generate Cryptographic QR Tag</h3>
            <p className="text-xs text-slate-500 mb-4">
              Generates a new 128-bit secure non-guessable tag identifier (e.g. PW-7KX9Q2...).
            </p>

            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Assign to Pet
                </label>
                <select
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">-- Leave as Unassigned Spare --</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.species})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tag Label / Description
                </label>
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
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  {creatingTag ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Generate Tag Badge</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
