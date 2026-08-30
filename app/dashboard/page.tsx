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
  const [subscription, setSubscription] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchOverviewData = () => {
    setLoading(true);
    setFetchError(null);

    Promise.all([
      fetch("/api/auth/me").then((res) => res.json()).catch(() => ({})),
      fetch("/api/pets").then((res) => res.json()).catch(() => ({ error: "Failed to load pets" })),
      fetch("/api/tags").then((res) => res.json()).catch(() => ({ error: "Failed to load tags" })),
      fetch("/api/subscription").then((res) => res.json()).catch(() => ({})),
    ])
      .then(([userData, petsData, tagsData, subData]) => {
        if (userData?.user) setUser(userData.user);

        if (petsData?.error && !Array.isArray(petsData?.pets)) {
          setFetchError(petsData.error);
        } else if (Array.isArray(petsData?.pets)) {
          setPets(petsData.pets);
        }

        if (Array.isArray(tagsData?.tags)) {
          setTags(tagsData.tags);
        }

        if (subData?.subscription) {
          setSubscription(subData.subscription);
        }
      })
      .catch((err) => {
        setFetchError(err instanceof Error ? err.message : "Failed to load dashboard data");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    setMounted(true);
    fetchOverviewData();
  }, []);

  const getSafeNumber = (val: any): number => {
    if (typeof val === "number" && !isNaN(val)) return val;
    if (val && typeof val === "object") {
      if (typeof val.increment === "number") return val.increment;
      if (typeof val.toNumber === "function") return val.toNumber();
    }
    const parsed = Number(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const safePets = Array.isArray(pets) ? pets : [];
  const safeTags = Array.isArray(tags) ? tags : [];

  const lostPetsCount = safePets.filter((p: any) => p && p.status === "LOST").length;
  const activeTagsCount = safeTags.filter((t: any) => t && t.status === "ACTIVE").length;
  const totalScans = safeTags.reduce((sum: number, t: any) => sum + getSafeNumber(t?.scanCount), 0);

  const planId = (subscription?.plan || "FREE").toUpperCase();
  const maxAllowedPets = planId === "PRO" ? 999 : planId === "PLUS" ? 5 : 1;
  const isPetLimitReached = safePets.length >= maxAllowedPets;

  if (!mounted || loading) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time status overview of your animals, QR collar tags, and scan notifications.
            </p>
          </div>
        </div>
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
          Loading dashboard overview...
        </div>
      </div>
    );
  }

  if (fetchError && safePets.length === 0 && safeTags.length === 0) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time status overview of your animals, QR collar tags, and scan notifications.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-red-200 p-8 text-center max-w-md mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Unable to load dashboard</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">{fetchError}</p>
          <button
            onClick={fetchOverviewData}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }


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
            href={isPetLimitReached ? "/dashboard/settings" : "/dashboard/pets/new"}
            className={`inline-flex items-center gap-1.5 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all ${
              isPetLimitReached
                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
                : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 hover:scale-[1.02]"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{isPetLimitReached ? "Upgrade to Add Pets" : "Add Pet Profile"}</span>
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
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pets</p>
              <span className="text-[10px] font-black text-slate-400">
                ({safePets.length}/{maxAllowedPets === 999 ? "∞" : maxAllowedPets})
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{safePets.length}</p>
          </div>
        </div>

        {/* Active Tags */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Tags</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{activeTagsCount}</p>
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
            <p className={`text-sm font-black mt-0.5 ${
              lostPetsCount > 0
                ? "text-red-600"
                : safePets.length === 0
                ? "text-slate-600"
                : "text-emerald-700"
            }`}>
              {lostPetsCount > 0
                ? `${lostPetsCount} Pet Missing!`
                : safePets.length === 0
                ? "No Pets Added"
                : "All Pets Safe"}
            </p>
          </div>
        </div>
      </div>

      {/* MY PETS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Your Pet Profiles</h2>
          <Link href="/dashboard/pets" className="text-xs font-bold text-teal-600 hover:underline">
            View All ({safePets.length})
          </Link>
        </div>

        {safePets.length === 0 ? (
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
            {safePets.map((pet) => {
              const isLost =
                pet?.status === "LOST" ||
                (Array.isArray(pet?.recoveryCases) &&
                  pet.recoveryCases.some((rc: any) => rc?.status === "OPEN"));
              const activeTag = pet?.tagAssignments?.[0]?.tag;

              return (
                <div
                  key={pet?.id || Math.random()}
                  className={`bg-white rounded-3xl p-6 border shadow-sm transition-all hover:shadow-md ${
                    isLost ? "border-red-300 ring-2 ring-red-500/20" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 p-0.5 border border-slate-200 shrink-0">
                        {pet?.photoUrl ? (
                          <img src={pet.photoUrl} alt={pet.name || "Pet"} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            {pet?.species?.toLowerCase() === "cat" ? "🐈" : "🐕"}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900">{pet?.name || "Pet"}</h3>
                        <p className="text-xs text-slate-500">{pet?.breed || pet?.species || "Animal"}</p>
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
                      <span className="font-bold text-slate-800">{getSafeNumber(activeTag?.scanCount)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/pets/${pet?.id}`}
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
