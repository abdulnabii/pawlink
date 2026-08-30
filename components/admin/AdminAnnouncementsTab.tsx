"use client";

import React, { useEffect, useState } from "react";
import {
  Megaphone,
  Plus,
  Users,
  CheckCircle2,
  X,
  Clock,
} from "lucide-react";

export function AdminAnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [creating, setCreating] = useState(false);

  const fetchAnnouncements = () => {
    setLoading(true);
    setError(null);

    fetch("/api/admin/announcements")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setAnnouncements(data.announcements || []);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load announcements");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, audience, status: "ACTIVE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create announcement");

      setShowCreateModal(false);
      setTitle("");
      setMessage("");
      fetchAnnouncements();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create announcement");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Actions Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900">Platform Announcements</h2>
          <p className="text-xs text-slate-400">Broadcast updates and alerts across user dashboard banners</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-800 text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchAnnouncements} className="underline hover:text-red-950">
            Try Again
          </button>
        </div>
      )}

      {/* Announcements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs animate-pulse">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
            No active announcements created.
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-100 text-teal-800">
                  Target: {ann.audience}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(ann.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">{ann.title}</h3>
              <p className="text-xs text-slate-600">{ann.message}</p>
            </div>
          ))
        )}
      </div>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleCreateAnnouncement}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Broadcast Announcement</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Headline Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Free Microchip Registry Week"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="ALL">All Registered Users</option>
                <option value="FREE">Free Tier Users</option>
                <option value="PLUS">Plus Recovery Members</option>
                <option value="PRO">Pro Household Members</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message Content</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="Enter message displayed on owner dashboard banner..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow transition-colors disabled:opacity-50"
              >
                {creating ? "Publishing..." : "Publish Banner"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
