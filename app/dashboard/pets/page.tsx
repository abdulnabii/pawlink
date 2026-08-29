"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Dog, QrCode, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";

export default function PetsListPage() {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let active = true;

    fetch("/api/pets")
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          if (Array.isArray(data?.pets)) setPets(data.pets);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!mounted) return null;

  const safePets = Array.isArray(pets) ? pets : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Your Pets</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage profiles, attach QR collar badges, and toggle emergency Lost Mode.
          </p>
        </div>
        <Link
          href="/dashboard/pets/new"
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-teal-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Pet</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading pets...</div>
      ) : safePets.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <Dog className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No pets added yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Add your dog, cat, or animal to generate a unique QR tag and configure alerts.
          </p>
          <Link
            href="/dashboard/pets/new"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Profile</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safePets.map((pet) => {
            if (!pet) return null;
            const isLost = pet.status === "LOST" || (Array.isArray(pet.recoveryCases) && pet.recoveryCases.length > 0);
            const activeTag = pet.tagAssignments?.[0]?.tag;
            const speciesLower = (pet.species || "").toLowerCase();

            return (
              <div
                key={pet.id}
                className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col justify-between ${
                  isLost ? "border-red-300 ring-2 ring-red-500/20" : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 p-0.5 border border-slate-200 shrink-0">
                        {pet.photoUrl ? (
                          <img
                            src={pet.photoUrl}
                            alt={pet.name || "Pet"}
                            className="w-full h-full object-cover rounded-xl"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            {speciesLower === "cat" ? "🐈" : "🐕"}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900">{pet.name || "Pet"}</h3>
                        <p className="text-xs text-slate-500">{pet.breed || pet.species || "Animal"}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                      isLost
                        ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                      {isLost ? "🚨 Missing" : "🟢 Safe"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Tag Identifier:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {activeTag?.tagCode || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Medical Alerts:</span>
                      <span className="font-bold text-slate-800">
                        {Array.isArray(pet.medicalRecords)
                          ? pet.medicalRecords.filter((m: any) => m?.isPublicAlert).length
                          : 0} active
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/dashboard/pets/${pet.id}`}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Open Pet Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
