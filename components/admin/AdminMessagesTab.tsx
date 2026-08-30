"use client";

import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  Search,
  ShieldAlert,
  User,
  Dog,
  Lock,
  CheckCircle2,
  X,
  Clock,
} from "lucide-react";

export function AdminMessagesTab() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  const fetchConversations = () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/admin/messages?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setConversations(data.conversations || []);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load conversations");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConversations();
  }, [statusFilter]);

  const handleModerate = async (conversationId: string, action: string) => {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this conversation?`)) return;
    setModeratingId(conversationId);

    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          action,
          reason: "Moderation action by admin",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to moderate conversation");

      fetchConversations();
      if (selectedConv?.id === conversationId) {
        setSelectedConv((prev: any) => ({ ...prev, status: action === "BLOCK" ? "BLOCKED" : "CLOSED" }));
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to moderate conversation");
    } finally {
      setModeratingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900">Message Moderation Queue</h2>
          <p className="text-xs text-slate-400">Review finder-to-owner conversations and protect community safety</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
        >
          <option value="">All Conversations</option>
          <option value="OPEN">Open (Active)</option>
          <option value="BLOCKED">Blocked</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-800 text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchConversations} className="underline hover:text-red-950">
            Try Again
          </button>
        </div>
      )}

      {/* Conversations Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Pet &amp; Owner</th>
                <th className="px-6 py-3.5">Finder Contact</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Total Messages</th>
                <th className="px-6 py-3.5">Last Activity</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 animate-pulse">
                    Loading conversations...
                  </td>
                </tr>
              ) : conversations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No active conversations recorded.
                  </td>
                </tr>
              ) : (
                conversations.map((conv) => (
                  <tr key={conv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{conv.pet?.name || "Pet"}</p>
                      <p className="text-[10px] text-slate-400">Owner: {conv.pet?.user?.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{conv.finderName || "Anonymous Finder"}</p>
                      <p className="text-[10px] text-slate-400">{conv.finderPhone || "No phone provided"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          conv.status === "OPEN"
                            ? "bg-teal-100 text-teal-800 border-teal-200"
                            : conv.status === "BLOCKED"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {conv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{conv.messages?.length || 0}</td>
                    <td className="px-6 py-4 text-[11px] text-slate-500">
                      {new Date(conv.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedConv(conv)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors"
                      >
                        Inspect
                      </button>
                      {conv.status === "OPEN" && (
                        <button
                          onClick={() => handleModerate(conv.id, "BLOCK")}
                          disabled={moderatingId === conv.id}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold rounded-lg transition-colors border border-red-200"
                        >
                          Block
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Messages Modal */}
      {selectedConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Conversation Moderation</h3>
                <p className="text-xs text-slate-400">Between {selectedConv.finderName || "Finder"} and {selectedConv.pet?.name}'s owner</p>
              </div>
              <button
                onClick={() => setSelectedConv(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-100">
              {selectedConv.messages?.length === 0 ? (
                <p className="text-slate-400 text-xs italic text-center py-6">No messages sent yet.</p>
              ) : (
                selectedConv.messages?.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                      msg.senderType === "OWNER"
                        ? "ml-auto bg-teal-600 text-white rounded-br-sm"
                        : "mr-auto bg-white border border-slate-200 text-slate-900 rounded-bl-sm"
                    }`}
                  >
                    <div className="text-[9px] font-bold opacity-75 mb-0.5 uppercase tracking-wider">
                      {msg.senderType}
                    </div>
                    <p>{msg.content}</p>
                    <div className="text-[8px] opacity-60 text-right mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600">
                Status: <span className="font-black">{selectedConv.status}</span>
              </span>
              <div className="space-x-2">
                {selectedConv.status === "OPEN" && (
                  <button
                    onClick={() => handleModerate(selectedConv.id, "BLOCK")}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition-colors"
                  >
                    Block Conversation
                  </button>
                )}
                <button
                  onClick={() => setSelectedConv(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
