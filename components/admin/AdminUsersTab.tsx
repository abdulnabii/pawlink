"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Filter,
  Shield,
  CreditCard,
  Dog,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  ShieldCheck,
  Crown,
  Zap,
  Phone,
  RotateCw,
  QrCode,
  Calendar,
} from "lucide-react";

interface AdminUsersTabProps {
  adminRole: string;
}

export function AdminUsersTab({ adminRole }: AdminUsersTabProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });

  // Selected User Modal State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  // User Action Modal
  const [actionUser, setActionUser] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"ROLE" | "PLAN" | "SUSPEND">("ROLE");
  const [newRole, setNewRole] = useState("OWNER");
  const [newPlan, setNewPlan] = useState("FREE");
  const [actionReason, setActionReason] = useState("");
  const [executingAction, setExecutingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchUsers = (targetPage = page) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    if (planFilter) params.set("plan", planFilter);
    params.set("page", targetPage.toString());
    params.set("pageSize", "15");
    params.set("_t", Date.now().toString());

    fetch(`/api/admin/users?${params.toString()}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setUsers(data.users || []);
          setPagination(data.pagination || { total: 0, totalPages: 1 });
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load users");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers(1);
    setPage(1);
  }, [search, roleFilter, planFilter]);

  const handleOpenUserDetail = (userId: string) => {
    setLoadingUserDetail(true);
    fetch(`/api/admin/users/${userId}?_t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setSelectedUser(data.user);
        }
      })
      .finally(() => setLoadingUserDetail(false));
  };

  const handleExecuteUserAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionUser) return;
    setExecutingAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const payload: any = {
        role: newRole,
        plan: newPlan,
        reason: actionReason?.trim() || "Admin manual modification",
      };

      // Optimistic update so UI reflects change instantaneously
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === actionUser.id) {
            const currentSubs = u.subscriptions || [];
            const updatedSubs =
              currentSubs.length > 0
                ? [{ ...currentSubs[0], plan: newPlan }]
                : [{ plan: newPlan, status: "ACTIVE" }];
            return {
              ...u,
              role: newRole,
              subscriptions: updatedSubs,
            };
          }
          return u;
        })
      );

      if (selectedUser && selectedUser.id === actionUser.id) {
        setSelectedUser((prev: any) =>
          prev
            ? {
                ...prev,
                role: newRole,
                subscriptions:
                  prev.subscriptions?.length > 0
                    ? [{ ...prev.subscriptions[0], plan: newPlan }]
                    : [{ plan: newPlan, status: "ACTIVE" }],
              }
            : null
        );
      }

      const res = await fetch(`/api/admin/users/${actionUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Action execution failed");
      }

      setActionSuccess("User updated successfully!");
      fetchUsers(page);
      setTimeout(() => {
        setActionUser(null);
        setActionSuccess(null);
      }, 1000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to update user");
      fetchUsers(page);
    } finally {
      setExecutingAction(false);
    }
  };

  // Quick Metric Calculations
  const adminCount = users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length;
  const premiumCount = users.filter(
    (u) => u.subscriptions?.[0]?.plan === "PRO" || u.subscriptions?.[0]?.plan === "PLUS"
  ).length;
  const totalPets = users.reduce((sum, u) => sum + (u._count?.pets || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Quick Stats Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Accounts */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
              Total Accounts
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {pagination.total || users.length}
          </p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Live database registry
          </p>
        </div>

        {/* Administrators */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
              Staff / Admins
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-700 mt-2 tracking-tight">
            {adminCount}
          </p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            2FA enforced personnel
          </p>
        </div>

        {/* Premium Subscribers */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
              Plus & Pro Tiers
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-2 tracking-tight">
            {premiumCount}
          </p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            Active household plans
          </p>
        </div>

        {/* Pets Guarded */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
              Protected Pets
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
              <Dog className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {totalPets}
          </p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            Hardware QR linked
          </p>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-all">
        <div className="relative w-full md:w-88">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium transition-all shadow-inner"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs transition-all cursor-pointer"
          >
            <option value="">Filter by Role: All</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPPORT">Support</option>
            <option value="MODERATOR">Moderator</option>
            <option value="ANALYST">Analyst</option>
            <option value="OWNER">Pet Owner</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs transition-all cursor-pointer"
          >
            <option value="">Filter by Plan: All</option>
            <option value="FREE">Basic ID (Free)</option>
            <option value="PLUS">Plus Recovery</option>
            <option value="PRO">Pro Household</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-800 text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchUsers(page)} className="underline hover:text-red-950">
            Try Again
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] overflow-hidden transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4 min-w-[220px]">User</th>
                <th className="px-6 py-4 min-w-[130px]">Role</th>
                <th className="px-6 py-4 min-w-[110px]">Plan</th>
                <th className="px-6 py-4 min-w-[80px]">Pets</th>
                <th className="px-6 py-4 min-w-[80px]">Tags</th>
                <th className="px-6 py-4 min-w-[120px]">Joined</th>
                <th className="px-6 py-4 text-right sticky right-0 bg-slate-50/95 backdrop-blur-xs z-10 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.06)] min-w-[170px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <RotateCw className="w-6 h-6 animate-spin text-teal-600" />
                      <span className="text-xs font-semibold text-slate-500">
                        Loading verified user accounts from Supabase PostgreSQL...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <span className="text-xs font-bold text-slate-600">No users found</span>
                      <span className="text-[11px] text-slate-400">Try adjusting your filters or search keywords.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const plan = u.subscriptions?.[0]?.plan || "FREE";
                  const initial = u.name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || "U";
                  const isSuper = u.role === "SUPER_ADMIN";
                  const isAdmin = u.role === "ADMIN";

                  return (
                    <tr
                      key={u.id}
                      className="group hover:bg-slate-50/80 transition-colors duration-150"
                    >
                      {/* User Cell with Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black text-xs shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105 ${
                              isSuper
                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                : isAdmin
                                ? "bg-teal-100 text-teal-800 border-teal-200"
                                : "bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-700 border-slate-200"
                            }`}
                          >
                            {initial}
                          </div>
                          <div className="overflow-hidden min-w-0">
                            <div className="font-extrabold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                              {u.name || "Pet Owner"}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                              <span>{u.email}</span>
                            </div>
                            {u.phone && (
                              <div className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-slate-400" />
                                {u.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border shadow-xs inline-flex items-center gap-1.5 ${
                            isSuper
                              ? "bg-purple-50 text-purple-700 border-purple-200/90 shadow-[0_0_8px_rgba(168,85,247,0.12)]"
                              : isAdmin
                              ? "bg-teal-50 text-teal-700 border-teal-200/90 shadow-[0_0_8px_rgba(20,184,166,0.12)]"
                              : u.role === "SUPPORT"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : u.role === "MODERATOR"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {(isSuper || isAdmin) && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSuper ? "bg-purple-500 animate-pulse" : "bg-teal-500 animate-pulse"
                              }`}
                            />
                          )}
                          {u.role}
                        </span>
                      </td>

                      {/* Plan Badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border shadow-xs inline-flex items-center gap-1 ${
                            plan === "PRO"
                              ? "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.12)]"
                              : plan === "PLUS"
                              ? "bg-teal-50 text-teal-900 border-teal-300 shadow-[0_0_8px_rgba(20,184,166,0.1)]"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {plan === "PRO" && <Crown className="w-3 h-3 text-amber-600 shrink-0" />}
                          {plan === "PLUS" && <Zap className="w-3 h-3 text-teal-600 shrink-0" />}
                          {plan}
                        </span>
                      </td>

                      {/* Pets Count */}
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1">
                          <Dog className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u._count?.pets || 0}</span>
                        </div>
                      </td>

                      {/* Tags Count */}
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1">
                          <QrCode className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u._count?.tagAssignments || 0}</span>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 text-[11px] text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(u.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-right space-x-2 sticky right-0 bg-white group-hover:bg-slate-50/80 transition-colors z-10 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.06)]">
                        <button
                          onClick={() => handleOpenUserDetail(u.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/90 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-xl border border-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-xs"
                          title="Inspect account details"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => {
                            setActionUser(u);
                            setActionType("ROLE");
                            setNewRole(u.role);
                            setNewPlan(plan);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-[11px] font-black rounded-xl shadow-xs hover:shadow-md hover:shadow-teal-500/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                          title="Assign administrative role or change plan"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-200" />
                          <span>Assign Role</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
          <div className="font-medium">
            Showing page <strong className="text-slate-900 font-black">{page}</strong> of{" "}
            <strong className="text-slate-900 font-black">{pagination.totalPages}</strong> (
            <span className="text-slate-700 font-bold">{pagination.total}</span> total users)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prev = Math.max(1, page - 1);
                setPage(prev);
                fetchUsers(prev);
              }}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-slate-700 px-2">
              {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => {
                const next = Math.min(pagination.totalPages, page + 1);
                setPage(next);
                fetchUsers(next);
              }}
              disabled={page >= pagination.totalPages}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
                  {selectedUser.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedUser.name || "Pet Owner"}</h3>
                  <p className="text-xs text-slate-400">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-xs">
              {/* Pets Attached */}
              <div>
                <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                  <Dog className="w-3.5 h-3.5 text-teal-600" />
                  Pets Registered ({selectedUser.pets?.length || 0})
                </h4>
                {selectedUser.pets?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedUser.pets?.map((pet: any) => (
                      <div
                        key={pet.id}
                        className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all"
                      >
                        <p className="font-bold text-slate-900 text-sm">{pet.name}</p>
                        <p className="text-[11px] text-slate-500">{pet.species} {pet.breed ? `• ${pet.breed}` : ""}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              pet.status === "SAFE"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800 animate-pulse"
                            }`}
                          >
                            {pet.status}
                          </span>
                          {pet.microchipNumber && (
                            <span className="text-[10px] font-mono text-slate-400">
                              #{pet.microchipNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 bg-slate-50 p-4 rounded-2xl text-center">
                    No pets registered under this profile yet.
                  </p>
                )}
              </div>

              {/* Membership Tier & Role Assignment Card */}
              <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider mb-1">
                    Current Access & Tier
                  </h4>
                  <p className="text-xs font-bold text-slate-900">
                    Role: <span className="text-teal-700 font-extrabold">{selectedUser.role}</span> • Plan:{" "}
                    <span className="text-amber-700 font-extrabold">
                      {selectedUser.subscriptions?.[0]?.plan || "FREE"}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedUser;
                    setSelectedUser(null);
                    setActionUser(target);
                    setActionType("ROLE");
                    setNewRole(target.role);
                    setNewPlan(target.subscriptions?.[0]?.plan || "FREE");
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black rounded-xl shadow-xs hover:shadow-md hover:shadow-teal-500/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shrink-0 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Assign Role
                </button>
              </div>

              {/* Audit Logs */}
              <div>
                <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Audit History
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {selectedUser.auditLogs?.length > 0 ? (
                    selectedUser.auditLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-slate-50 rounded-xl text-[10px] flex justify-between border border-slate-100"
                      >
                        <span className="font-bold text-slate-700">{log.action}</span>
                        <span className="text-slate-400">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 p-3 bg-slate-50 rounded-xl text-center">
                      No administrative changes recorded for this user.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Action / Role / Plan Modal */}
      {actionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleExecuteUserAction}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 animate-scaleUp"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-slate-900">Manage User Access</h3>
              </div>
              <button
                type="button"
                onClick={() => setActionUser(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Modifying account for: <strong className="text-slate-900 font-extrabold">{actionUser.name}</strong> (
              <span className="text-slate-500">{actionUser.email}</span>)
            </p>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{actionError}</span>
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Role Permission
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs transition-all"
              >
                <option value="OWNER">Pet Owner (Normal)</option>
                <option value="SUPPORT">Support Specialist</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ANALYST">Data Analyst</option>
                <option value="ADMIN">System Admin</option>
                <option value="SUPER_ADMIN">Super Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Plan Tier
              </label>
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs transition-all"
              >
                <option value="FREE">Basic ID (Free)</option>
                <option value="PLUS">Plus Recovery ($4.99/mo)</option>
                <option value="PRO">Pro Household ($9.99/mo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Reason for Change (Audited)
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Reason for modifying user role or subscription tier (optional)..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setActionUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={executingAction}
                className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black rounded-xl shadow-md hover:shadow-teal-500/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {executingAction ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
