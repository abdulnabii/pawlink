"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dog,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Plus,
  BellRing,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((res) => res.json()),
      fetch("/api/pets").then((res) => res.json()),
      fetch("/api/tags").then((res) => res.json()),
    ])
      .then(([userData, petsData, tagsData]) => {
        if (userData?.user) setUser(userData.user);
        if (petsData?.pets) setPets(petsData.pets);
        if (tagsData?.tags) setTags(tagsData.tags);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalScans = tags.reduce((acc, tag) => acc + (tag.scanCount || 0), 0);
  const lostPetsCount = pets.filter((p) => p.status === "LOST").length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "Pet Owner"} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status overview of your animals, QR collar tags, and scan notifications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/tags"
            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            <QrCode className="w-4 h-4 text-teal-600" />
            <span>Collar Tags</span>
          </Link>
          <Link
            href="/dashboard/pets/new"
            className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Pet Profile</span>
          </Link>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Dog className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pets</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{pets.length}</p>
          </div>
        </div>

        {/* Active Tags */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Tags</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {tags.filter((t) => t.status === "ACTIVE").length}
            </p>
          </div>
        </div>

        {/* Total Scans */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Scans</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalScans}</p>
          </div>
        </div>

        {/* Status */}
        <div className={`p-5 rounded-2xl border shadow-sm flex items-center gap-4 ${
          lostPetsCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            lostPetsCount > 0 ? "bg-red-100 text-red-600" : "bg-emerald-50 text-emerald-600"
          }`}>
            {lostPetsCount > 0 ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</p>
            <p className={`text-sm font-black mt-0.5 ${lostPetsCount > 0 ? "text-red-600" : "text-emerald-700"}`}>
              {lostPetsCount > 0 ? `${lostPetsCount} Pet Missing!` : "All Pets Safe"}
            </p>
          </div>
        </div>
      </div>

      {/* MY PETS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Your Pet Profiles</h2>
          <Link href="/dashboard/pets" className="text-xs font-bold text-teal-600 hover:underline">
            View All ({pets.length})
          </Link>
        </div>

        {pets.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <Dog className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No pet profiles yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              Create your first pet profile to generate a unique QR collar tag and configure WhatsApp alerts.
            </p>
            <Link
              href="/dashboard/pets/new"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Create Pet Profile</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => {
              const isLost = pet.status === "LOST" || pet.recoveryCases?.length > 0;
              const activeTag = pet.tagAssignments?.[0]?.tag;

              return (
                <div
                  key={pet.id}
                  className={`bg-white rounded-3xl p-6 border shadow-sm transition-all hover:shadow-md ${
                    isLost ? "border-red-300 ring-2 ring-red-500/20" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 p-0.5 border border-slate-200 shrink-0">
                        {pet.photoUrl ? (
                          <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            {pet.species.toLowerCase() === "cat" ? "🐈" : "🐕"}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900">{pet.name}</h3>
                        <p className="text-xs text-slate-500">{pet.breed || pet.species}</p>
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

                  {/* Tag Info */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium">QR Tag:</span>
                      {activeTag ? (
                        <span className="font-mono font-bold text-slate-800">{activeTag.tagCode}</span>
                      ) : (
                        <span className="text-amber-600 font-bold">No Tag Connected</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium">Scans Recorded:</span>
                      <span className="font-bold text-slate-800">{activeTag?.scanCount || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/pets/${pet.id}`}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Open Pet Hub</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
