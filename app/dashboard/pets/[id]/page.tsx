"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dog,
  QrCode,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Heart,
  Plus,
  Trash2,
  Clock,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Printer,
  Sparkles,
  Lock,
} from "lucide-react";
import dynamic from "next/dynamic";
import { LostModeModal } from "@/components/recovery/LostModeModal";
import { PrintableTagBadge } from "@/components/qr/PrintableTagBadge";
import { RecoveryTimeline } from "@/components/recovery/RecoveryTimeline";

const RecoveryMap = dynamic(
  () => import("@/components/maps/RecoveryMap").then((mod) => mod.RecoveryMap),
  { ssr: false }
);

export default function PetHubPage({ params }: { params?: { id: string } }) {
  const router = useRouter();
  const routeParams = useParams();
  const petId = params?.id || (routeParams?.id as string);

  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [purgingLocations, setPurgingLocations] = useState(false);
  const [mounted, setMounted] = useState(false);

  // New medical record form state
  const [showAddMedical, setShowAddMedical] = useState(false);
  const [medicalTitle, setMedicalTitle] = useState("");
  const [medicalType, setMedicalType] = useState("VACCINATION");
  const [medicalDescription, setMedicalDescription] = useState("");
  const [isPublicAlert, setIsPublicAlert] = useState(false);

  const fetchPet = () => {
    if (!petId) return;
    fetch(`/api/pets/${petId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.pet) setPet(data.pet);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    setMounted(true);
    if (petId) fetchPet();
  }, [petId]);

  if (!mounted) return null;

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading Pet Hub...</div>;
  }

  if (!pet) {
    return (
      <div className="p-12 text-center">
        <h3 className="text-base font-bold text-slate-800">Pet not found</h3>
        <Link href="/dashboard/pets" className="text-xs font-semibold text-teal-600 hover:underline mt-2 inline-block">
          Return to Pets List
        </Link>
      </div>
    );
  }

  const handlePurgeLocationHistory = async () => {
    if (!confirm("Are you sure you want to permanently delete all GPS location records for this pet?")) return;
    setPurgingLocations(true);
    try {
      const res = await fetch(`/api/pets/${petId}/locations/purge`, { method: "POST" });
      if (res.ok) {
        alert("Location history successfully purged for privacy.");
        fetchPet();
      }
    } catch {
      alert("Failed to purge locations.");
    } finally {
      setPurgingLocations(false);
    }
  };

  const handleAddMedical = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/pets/${petId}/medical`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordType: medicalType,
          title: medicalTitle,
          description: medicalDescription || null,
          isPublicAlert,
        }),
      });
      if (res.ok) {
        setShowAddMedical(false);
        setMedicalTitle("");
        setMedicalDescription("");
        setIsPublicAlert(false);
        fetchPet();
      }
    } catch {
      alert("Failed to add medical record");
    }
  };

  // Safe accessor helpers — no null crashes
  const activeTag = pet.tagAssignments?.[0]?.tag ?? null;
  const recoveryCases = Array.isArray(pet.recoveryCases) ? pet.recoveryCases : [];
  const activeCase = recoveryCases.find((rc: any) => rc?.status === "OPEN") ?? null;
  const isLost = pet.status === "LOST" || Boolean(activeCase);
  const locationEvents = Array.isArray(activeCase?.locationEvents) ? activeCase.locationEvents : [];
  const medicalRecords = Array.isArray(pet.medicalRecords) ? pet.medicalRecords : [];
  const recoveryEvents = Array.isArray(pet.recoveryEvents) ? pet.recoveryEvents : [];
  const speciesLower = (pet.species || "").toLowerCase();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back Link */}
      <Link href="/dashboard/pets" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Pets</span>
      </Link>

      {/* HERO HEADER */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm transition-all ${
        isLost ? "bg-red-50/70 border-red-300 ring-2 ring-red-500/20" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 p-0.5 border border-slate-200 shrink-0">
              {pet.photoUrl ? (
                <img
                  src={pet.photoUrl}
                  alt={pet.name || "Pet"}
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  {speciesLower === "cat" ? "🐈" : "🐕"}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{pet.name || "Pet"}</h1>
                <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${
                  isLost
                    ? "bg-red-600 text-white border-red-600 shadow animate-pulse"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}>
                  {isLost ? "🚨 Missing / Lost Mode Active" : "🟢 Safe at Home"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                {pet.breed || pet.species || "Animal"} • {pet.gender || "Unknown"} {pet.color ? `• ${pet.color}` : ""}
              </p>
            </div>
          </div>

          {/* Lost Mode Controller Button */}
          <div>
            <button
              onClick={() => setLostModalOpen(true)}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                isLost
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                  : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
              }`}
            >
              {isLost ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span>{isLost ? "Mark Pet as Safely Home 🎉" : "Activate Lost Mode 🚨"}</span>
            </button>
          </div>
        </div>

        {/* If Lost Mode Active: Context banner */}
        {isLost && activeCase && (
          <div className="mt-6 p-4 rounded-2xl bg-white border border-red-200 shadow-sm text-xs space-y-1 text-red-950">
            {activeCase.startedAt && <p><strong>🚨 Missing Since:</strong> {new Date(activeCase.startedAt).toLocaleString()}</p>}
            {activeCase.lastSeenLocation && <p><strong>📍 Last Seen:</strong> {activeCase.lastSeenLocation}</p>}
            {activeCase.rewardAmount > 0 && <p><strong>💰 Reward Offered:</strong> PKR {activeCase.rewardAmount}</p>}
            {activeCase.description && <p className="italic">&ldquo;{activeCase.description}&rdquo;</p>}
          </div>
        )}
      </div>

      {/* 2-COLUMN GRID: MAP & TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Interactive Recovery Map */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-teal-600" />
                  <span>Recovery Radar &amp; Location Pins</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Visual map of finder-shared GPS coordinates and last seen points.
                </p>
              </div>
              {locationEvents.length > 0 && (
                <button
                  onClick={handlePurgeLocationHistory}
                  disabled={purgingLocations}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge GPS Data</span>
                </button>
              )}
            </div>

            <RecoveryMap
              lastSeenLat={activeCase?.lastSeenLatitude ?? null}
              lastSeenLng={activeCase?.lastSeenLongitude ?? null}
              lastSeenLocation={activeCase?.lastSeenLocation ?? null}
              locationEvents={locationEvents}
              petName={pet.name || "Pet"}
            />

            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-teal-600" />
                <span>Exact coordinates are visible ONLY to you in this hub.</span>
              </span>
              <span>Auto-expires after 30 days</span>
            </div>
          </div>

          {/* Connected Tag & Badge View */}
          {activeTag && activeTag.tagCode && pet.name && pet.species ? (
            <PrintableTagBadge
              tagCode={activeTag.tagCode}
              petName={pet.name}
              species={pet.species}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <QrCode className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Collar Tag Attached</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Connect a tag to enable instant scan alerts and recovery.
              </p>
              <Link
                href="/dashboard/tags"
                className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                <span>Connect Tag</span>
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Timeline & Medical Alerts */}
        <div className="space-y-6">
          {/* Recovery Timeline */}
          <RecoveryTimeline events={recoveryEvents} petName={pet.name || "Pet"} />

          {/* Medical Records & Emergency Alerts */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <span>Medical &amp; Allergy Passport</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Emergency health notes &amp; public allergy warnings.
                </p>
              </div>
              <button
                onClick={() => setShowAddMedical(!showAddMedical)}
                className="inline-flex items-center gap-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
            </div>

            {/* Add Record Form */}
            {showAddMedical && (
              <form onSubmit={handleAddMedical} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Type</label>
                    <select
                      value={medicalType}
                      onChange={(e) => setMedicalType(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white"
                    >
                      <option value="ALLERGY">Allergy</option>
                      <option value="VACCINATION">Vaccination</option>
                      <option value="MEDICATION">Medication</option>
                      <option value="MEDICAL_CONDITION">Medical Condition</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={medicalTitle}
                      onChange={(e) => setMedicalTitle(e.target.value)}
                      placeholder="e.g. Allergic to Chicken"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Details</label>
                  <textarea
                    value={medicalDescription}
                    onChange={(e) => setMedicalDescription(e.target.value)}
                    placeholder="Instructions if found..."
                    rows={2}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublicAlert}
                    onChange={(e) => setIsPublicAlert(e.target.checked)}
                    className="rounded text-teal-600 w-4 h-4"
                  />
                  <span><strong>Expose as Public Emergency Alert</strong> on tag scan page</span>
                </label>

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowAddMedical(false)} className="px-3 py-1.5 text-xs text-slate-600 font-semibold">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm">
                    Save Record
                  </button>
                </div>
              </form>
            )}

            {/* Medical records list */}
            {medicalRecords.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">No medical alerts recorded.</p>
            ) : (
              <div className="space-y-2">
                {medicalRecords.map((rec: any) => (
                  <div key={rec?.id || Math.random()} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{rec?.title}</span>
                        {rec?.isPublicAlert && (
                          <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300">
                            Public Alert
                          </span>
                        )}
                      </div>
                      {rec?.description && <p className="text-slate-600 mt-0.5">{rec.description}</p>}
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{rec?.recordType}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LOST MODE CONTROLLER MODAL */}
      <LostModeModal
        petId={pet.id}
        petName={pet.name || "Pet"}
        isCurrentlyLost={isLost}
        isOpen={lostModalOpen}
        onClose={() => setLostModalOpen(false)}
        onSuccess={() => fetchPet()}
      />
    </div>
  );
}
