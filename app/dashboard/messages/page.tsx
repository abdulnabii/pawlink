"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send, User, Dog, Clock, ShieldCheck, Loader2 } from "lucide-react";

function formatTime(dateVal: any) {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function MessagesInboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchConversations = () => {
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        if (data.conversations && Array.isArray(data.conversations)) {
          setConversations(data.conversations);
          if (!activeConvId && data.conversations.length > 0) {
            setActiveConvId(data.conversations[0].id);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    setMounted(true);
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!activeConvId || !conversations.length) return;

    const conv = conversations.find((c) => c.id === activeConvId);
    if (conv) {
      setActiveConv(conv);
    }
  }, [activeConvId, conversations]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConvId) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          content: replyText,
        }),
      });

      if (res.ok) {
        setReplyText("");
        fetchConversations();
      }
    } catch {
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Finder Messages</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Communicate with kind finders in real time without exposing your personal phone number.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading conversations...</div>
      ) : conversations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No finder messages yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            When someone finds your pet and sends a message from the scan page, you can chat with them right here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 min-h-[500px] overflow-hidden">
          {/* Conversation List Sidebar */}
          <div className="border-r border-slate-200 p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Conversations</h4>
            {conversations.map((c) => {
              const active = c.id === activeConvId;
              const lastMsg = c.messages?.[c.messages.length - 1];

              return (
                <button
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all ${
                    active ? "bg-teal-50 border border-teal-200 shadow-sm" : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-slate-900">{c.finderName || "Helpful Finder"}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatTime(c.updatedAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-700 font-semibold mb-1">Pet: {c.pet?.name || "Protected Pet"}</p>
                  {lastMsg && (
                    <p className="text-xs text-slate-500 truncate">{lastMsg.content}</p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Chat Message Window */}
          <div className="md:col-span-2 flex flex-col justify-between p-6 bg-slate-50/50">
            {activeConv ? (
              <>
                {/* Chat Header */}
                <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{activeConv.finderName || "Finder"}</h3>
                      <p className="text-xs text-slate-500">Regarding {activeConv.pet?.name || "Protected Pet"}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    {activeConv.status}
                  </span>
                </div>

                {/* Messages Body */}
                <div className="flex-1 py-6 space-y-4 overflow-y-auto max-h-[380px]">
                  {activeConv.messages?.map((msg: any) => {
                    const isOwner = msg.senderType === "OWNER";

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOwner ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isOwner
                              ? "bg-slate-900 text-white rounded-br-none"
                              : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                          }`}
                        >
                          <p>{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {isOwner ? "You" : activeConv.finderName || "Finder"} • {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Bar */}
                <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply to the finder..."
                    className="flex-1 text-xs bg-white border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Reply</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                Select a conversation to view messages
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
