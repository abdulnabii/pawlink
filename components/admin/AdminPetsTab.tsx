"use client";

import React, { useEffect, useState } from "react";
import {
  Dog,
  Search,
  Filter,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Activity,
} from "lucide-react";

interface AdminPetsTabProps {
  adminRole: string;
}

export function AdminPetsTab({ adminRole }: AdminPetsTabProps) {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });

  // Selected Pet Detail Modal
  const [selectedPet, setSelectedPet] = useState<any | null>(null);
  const [loadingPetDetail, setLoadingPetDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchPets = (targetPage = page) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (speciesFilter) params.set("species", speciesFilter);
    params.set("page", targetPage.toString());
    params.set("pageSize", "15");

    fetch(`/api/admin/pets?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setPets(data.pets || []);
          setPagination(data.pagination || { total: 0, totalPages: 1 });
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load pets");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPets(1);
    setPage(1);
  }, [search, statusFilter, speciesFilter]);

  const handleInspectPet = (petId: string) => {
    setLoadingPetDetail(true);
    fetch(`/api/admin/pets/${petId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.pet) {
          setSelectedPet(data.pet);
        }
      })
      .finally(() => setLoadingPetDetail(false));
  };

  const handleUpdatePetStatus = async (newStatus: string) => {
    if (!selectedPet) return;
    setUpdatingStatus(true);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/pets/${selectedPet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          reason: "Admin status override from Pet Inspector",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update pet status");

      setActionSuccess(`Pet status updated to ${newStatus}!`);
      setSelectedPet((prev: any) => ({ ...prev, status: newStatus }));
      fetchPets(page);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pet, owner, breed, tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="SAFE">Safe</option>
            <option value="LOST">Lost Mode Active</option>
            <option value="RECOVERED">Recovered</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Species Filter */}
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Species</option>
            <option value="Dog">Dogs</option>
            <option value="Cat">Cats</option>
            <option value="Bird">Birds</option>
            <option value="Other">Other Animals</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-800 text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchPets(page)} className="underline hover:text-red-950">
            Try Again
          </button>
        </div>
      )}

      {/* Pets Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5 min-w-[200px]">Pet Profile</th>
                <th className="px-6 py-3.5 min-w-[130px]">Species / Breed</th>
                <th className="px-6 py-3.5 min-w-[160px]">Owner</th>
                <th className="px-6 py-3.5 min-w-[130px]">Attached Tag</th>
                <th className="px-6 py-3.5 min-w-[120px]">Status</th>
                <th className="px-6 py-3.5 text-right sticky right-0 bg-slate-50 z-10 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 animate-pulse">
                    Loading pet profiles...
                  </td>
                </tr>
              ) : pets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No pets matching criteria found.
                  </td>
                </tr>
              ) : (
                pets.map((pet) => {
                  const tag = pet.tagAssignments?.[0]?.tag;
                  return (
                    <tr key={pet.id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-500">
                            {pet.photoUrl ? (
                              <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                            ) : (
                              <Dog className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{pet.name}</p>
                            <p className="text-[10px] text-slate-400">{pet.gender || "Unknown Gender"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{pet.species}</p>
                        <p className="text-[10px] text-slate-400">{pet.breed || "Standard"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{pet.user?.name || pet.ownerName || "Pet Owner"}</p>
                        <p className="text-[10px] text-slate-400">{pet.user?.email || "—"}</p>
                        {pet.user?.phone && <p className="text-[10px] text-slate-500 font-mono">{pet.user.phone}</p>}
                      </td>
                      <td className="px-6 py-4">
                        {tag ? (
                          <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-bold">
                            {tag.tagCode}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No tag attached</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                            pet.status === "LOST"
                              ? "bg-red-100 text-red-800 border-red-200 animate-pulse"
                              : pet.status === "RECOVERED"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-teal-100 text-teal-800 border-teal-200"
                          }`}
                        >
                          {pet.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50/80 transition-colors z-10 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">
                        <button
                          onClick={() => handleInspectPet(pet.id)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors shadow-sm"
                        >
                          Inspect
                        </button>
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
            Showing page <strong>{page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total pets)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prev = Math.max(1, page - 1);
                setPage(prev);
                fetchPets(prev);
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
                fetchPets(next);
              }}
              disabled={page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Pet Detail Inspection Modal */}
      {selectedPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-black">
                  <Dog className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedPet.name}</h3>
                  <p className="text-xs text-slate-400">{selectedPet.species} • {selectedPet.breed || "Standard"}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPet(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionSuccess && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-bold">
                {actionSuccess}
              </div>
            )}

            {/* Quick Status Bar */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Current State</span>
                <span className="font-black text-slate-900 text-sm">{selectedPet.status}</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedPet.status !== "SAFE" && (
                  <button
                    onClick={() => handleUpdatePetStatus("SAFE")}
                    disabled={updatingStatus}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
                  >
                    Set SAFE
                  </button>
                )}
                {selectedPet.status !== "LOST" && (
                  <button
                    onClick={() => handleUpdatePetStatus("LOST")}
                    disabled={updatingStatus}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
                  >
                    Broadcast LOST
                  </button>
                )}
              </div>
            </div>

            {/* Owner & Tag Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-extrabold uppercase text-[10px] text-slate-400 mb-1">Owner Contact</h4>
                <p className="font-bold text-slate-900">{selectedPet.user?.name || selectedPet.ownerName || "Pet Owner"}</p>
                <p className="text-slate-500">{selectedPet.user?.email || "No email listed"}</p>
                <p className="text-slate-500 font-mono">{selectedPet.user?.phone || selectedPet.contactPhone || "No phone listed"}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-extrabold uppercase text-[10px] text-slate-400 mb-1">Collar Tag Code</h4>
                <p className="font-bold text-slate-900 font-mono text-sm">
                  {selectedPet.tagAssignments?.[0]?.tag?.tagCode || "UNASSIGNED"}
                </p>
                <p className="text-slate-500 text-[10px]">
                  Scans: {selectedPet.tagAssignments?.[0]?.tag?.scanCount || 0}
                </p>
              </div>
            </div>

            {/* Medical Alert Records */}
            <div>
              <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider mb-2">
                Medical Records ({selectedPet.medicalRecords?.length || 0})
              </h4>
              <div className="space-y-2">
                {selectedPet.medicalRecords?.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No medical records registered.</p>
                ) : (
                  selectedPet.medicalRecords?.map((rec: any) => (
                    <div key={rec.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{rec.title} ({rec.recordType})</p>
                        <p className="text-[10px] text-slate-500">{rec.description || "No description"}</p>
                      </div>
                      {rec.isPublicAlert && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[9px] font-black uppercase rounded-full">
                          Public Alert
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
