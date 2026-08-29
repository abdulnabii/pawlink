"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, DollarSign, MapPin, X, Loader2, Heart } from "lucide-react";

interface LostModeModalProps {
  petId: string;
  petName: string;
  isCurrentlyLost: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LostModeModal({
  petId,
  petName,
  isCurrentlyLost,
  isOpen,
  onClose,
  onSuccess,
}: LostModeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for activating Lost Mode
  const [lastSeenLocation, setLastSeenLocation] = useState("");
  const [rewardAmount, setRewardAmount] = useState<string>("0");
  const [description, setDescription] = useState("");

  // Form states for marking safe
  const [resolutionNote, setResolutionNote] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/pets/${petId}/lost-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isCurrentlyLost
            ? {
                activate: false,
                resolutionNote: resolutionNote || "Pet safely reunited with family!",
              }
            : {
                activate: true,
                lastSeenLocation: lastSeenLocation || "Unknown Area",
                rewardAmount: parseFloat(rewardAmount) || 0,
                description: description || null,
              }
        ),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update Lost Mode");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative z-[10000]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isCurrentlyLost ? (
          /* MARK AS SAFE / RESOLVE LOST MODE */
          <div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Mark {petName} as Safely Home! 🎉
            </h3>
            <p className="text-sm text-slate-600 mt-1 mb-6">
              Deactivating Lost Mode will restore {petName}&apos;s public profile to safe status and log the recovery on your timeline.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Recovery Story / Note (Optional)
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder={`e.g. ${petName} was found safe by a friendly neighbor near the park!`}
                  rows={3}
                  className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-3 rounded-xl border border-slate-300 font-semibold text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Confirm Home</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ACTIVATE EMERGENCY LOST MODE */
          <div>
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Activate Lost Mode for {petName} 🚨
            </h3>
            <p className="text-sm text-slate-600 mt-1 mb-6">
              When anyone scans {petName}&apos;s tag, the page will transform into an urgent emergency recovery broadcast with your instructions and reward details.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Last Known Location / Neighborhood
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={lastSeenLocation}
                    onChange={(e) => setLastSeenLocation(e.target.value)}
                    placeholder="e.g. Clifton Block 4, near Beach Park"
                    className="w-full text-sm rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reward Amount (Optional)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                    placeholder="0"
                    className="w-full text-sm rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Urgent Finder Instructions
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`e.g. ${petName} is friendly but may be scared. Please call or share your location immediately.`}
                  rows={3}
                  className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-3 rounded-xl border border-slate-300 font-semibold text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>Activate Lost Mode</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
