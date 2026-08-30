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
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronLeft,
  ChevronRight,
  X,
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

    fetch(`/api/admin/users?${params.toString()}`)
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
    fetch(`/api/admin/users/${userId}`)
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
        reason: actionReason || "Admin manual modification",
      };
      if (actionType === "ROLE") payload.role = newRole;
      if (actionType === "PLAN") payload.plan = newPlan;

      const res = await fetch(`/api/admin/users/${actionUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
      }, 1200);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setExecutingAction(false);
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
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Roles</option>
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Plans</option>
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
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Plan</th>
                <th className="px-6 py-3.5">Pets</th>
                <th className="px-6 py-3.5">Tags</th>
                <th className="px-6 py-3.5">Joined</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 animate-pulse">
                    Loading users directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const plan = u.subscriptions?.[0]?.plan || "FREE";
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{u.name || "Pet Owner"}</div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                        {u.phone && <div className="text-[10px] text-slate-500 font-mono">{u.phone}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            u.role === "SUPER_ADMIN"
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : u.role === "ADMIN"
                              ? "bg-teal-100 text-teal-800 border-teal-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            plan === "PRO"
                              ? "bg-amber-100 text-amber-800"
                              : plan === "PLUS"
                              ? "bg-teal-100 text-teal-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{u._count?.pets || 0}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{u._count?.tagAssignments || 0}</td>
                      <td className="px-6 py-4 text-[11px] text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenUserDetail(u.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors"
                        >
                          Inspect
                        </button>
                        {adminRole === "SUPER_ADMIN" && (
                          <button
                            onClick={() => {
                              setActionUser(u);
                              setActionType("ROLE");
                              setNewRole(u.role);
                              setNewPlan(plan);
                            }}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing page <strong>{page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total users)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prev = Math.max(1, page - 1);
                setPage(prev);
                fetchUsers(prev);
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
                fetchUsers(next);
              }}
              disabled={page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedUser.name || "Pet Owner"}</h3>
                <p className="text-xs text-slate-400">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-xs">
              {/* Pets Attached */}
              <div>
                <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider mb-2">
                  Pets Registered ({selectedUser.pets?.length || 0})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedUser.pets?.map((pet: any) => (
                    <div key={pet.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="font-bold text-slate-900">{pet.name} ({pet.species})</p>
                      <p className="text-[10px] text-slate-500">Status: <strong>{pet.status}</strong></p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscriptions */}
              <div>
                <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider mb-2">
                  Membership Tier
                </h4>
                <div className="p-3 bg-teal-50 border border-teal-100 rounded-2xl text-teal-900 font-bold">
                  {selectedUser.subscriptions?.[0]?.plan || "FREE"} Plan • Status: ACTIVE
                </div>
              </div>

              {/* Audit Logs */}
              <div>
                <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider mb-2">
                  Audit History
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedUser.auditLogs?.map((log: any) => (
                    <div key={log.id} className="p-2 bg-slate-50 rounded-xl text-[10px] flex justify-between">
                      <span className="font-bold text-slate-700">{log.action}</span>
                      <span className="text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Action / Role / Plan Modal */}
      {actionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleExecuteUserAction}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Manage User Access</h3>
              <button
                type="button"
                onClick={() => setActionUser(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Modifying account for: <strong>{actionUser.name}</strong> ({actionUser.email})
            </p>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-bold">
                {actionError}
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-bold">
                {actionSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Plan Tier</label>
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="FREE">Basic ID (Free)</option>
                <option value="PLUS">Plus Recovery ($4.99/mo)</option>
                <option value="PRO">Pro Household ($9.99/mo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Change (Audited)</label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                required
                placeholder="Reason for modifying user role or subscription..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActionUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={executingAction}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow transition-colors disabled:opacity-50"
              >
                {executingAction ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
