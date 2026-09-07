"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Stethoscope, AlertTriangle, Calendar, User, ShieldCheck } from "lucide-react";

export default function VetModePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const petId = params?.petId as string;
  const token = searchParams.get("token");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setError("Missing vet access token"); setLoading(false); return; }
    fetch(`/api/vet/${petId}?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load medical data"))
      .finally(() => setLoading(false));
  }, [petId, token]);

  if (loading) return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 text-center max-w-sm shadow-xl">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-black text-slate-900">Access Denied</h2>
        <p className="text-sm text-slate-500 mt-2">{error}</p>
      </div>
    </div>
  );

  const { pet, medicalRecords } = data;

  const recordTypeColor: Record<string, string> = {
    VACCINATION: "bg-green-100 text-green-800",
    ALLERGY: "bg-red-100 text-red-800",
    MEDICATION: "bg-blue-100 text-blue-800",
    MEDICAL_CONDITION: "bg-orange-100 text-orange-800",
    VET_NOTE: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-blue-700 text-white rounded-3xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-200" />
              <span className="text-xs text-blue-200 font-semibold uppercase tracking-wider">Vet Access Mode</span>
            </div>
            <h1 className="text-2xl font-black">{pet.name}</h1>
            <p className="text-blue-200 text-sm">{pet.species} · {pet.breed || "Unknown breed"}</p>
          </div>
          {pet.photoUrl && (
            <img src={pet.photoUrl} alt={pet.name} className="w-16 h-16 rounded-2xl object-cover ml-auto" />
          )}
        </div>

        {/* Pet Info */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> Patient Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {[
              ["Gender", pet.gender],
              ["Weight", pet.weight ? `${pet.weight} kg` : null],
              ["Color", pet.color],
              ["Microchip", pet.microchipNumber],
              ["Date of Birth", pet.birthDate ? new Date(pet.birthDate).toLocaleDateString() : null],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label as string} className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 font-medium">{label}</p>
                <p className="text-slate-900 font-bold mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          {pet.specialInstructions && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p className="text-xs font-bold text-yellow-800">⚠️ Special Instructions</p>
              <p className="text-xs text-yellow-700 mt-1">{pet.specialInstructions}</p>
            </div>
          )}
        </div>

        {/* Medical Records */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 px-1">Medical Records ({medicalRecords.length})</h3>
          {medicalRecords.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
              <p className="text-sm text-slate-400">No medical records on file.</p>
            </div>
          ) : (
            medicalRecords.map((rec: any) => (
              <div key={rec.id} className="bg-white rounded-2xl p-4 border border-slate-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${recordTypeColor[rec.recordType] || "bg-slate-100 text-slate-700"}`}>
                        {rec.recordType.replace("_", " ")}
                      </span>
                      {rec.isPublicAlert && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">⚠️ Alert</span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900">{rec.title}</p>
                    {rec.description && <p className="text-xs text-slate-500 mt-1">{rec.description}</p>}
                    {rec.veterinarian && <p className="text-xs text-slate-400 mt-1">Dr. {rec.veterinarian}</p>}
                  </div>
                  <div className="text-right text-xs text-slate-400 shrink-0">
                    {rec.dateAdministered && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(rec.dateAdministered).toLocaleDateString()}
                      </div>
                    )}
                    {rec.nextDueDate && (
                      <div className="text-orange-600 font-medium mt-0.5">
                        Due: {new Date(rec.nextDueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <p className="text-center text-xs text-slate-400 pb-4">
          🔒 This is a secure, read-only vet access page. No owner contact info is shared.
        </p>
      </div>
    </div>
  );
}
