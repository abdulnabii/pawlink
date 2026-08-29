"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Send, ShieldCheck, User, Dog, Loader2, ArrowLeft } from "lucide-react";

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

export default function FinderDirectChatPage({
  params,
}: {
  params?: { conversationId: string };
}) {
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const conversationId = params?.conversationId || (routeParams?.conversationId as string);
  const finderToken = searchParams.get("token") || "";

  const [conversation, setConversation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchChat = () => {
    if (!finderToken) {
      setError("Missing finder access token");
      setLoading(false);
      return;
    }

    fetch(`/api/conversations?finderToken=${finderToken}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.conversation) {
          setConversation(data.conversation);
        } else {
          setError(data.error || "Conversation not found");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to connect to chat servers");
        setLoading(false);
      });
  };

  useEffect(() => {
    setMounted(true);
    fetchChat();
  }, [finderToken]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !conversation) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation.id,
          finderToken,
          content: replyText,
        }),
      });

      if (res.ok) {
        setReplyText("");
        fetchChat();
      }
    } catch {
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin mb-2" />
        <p className="text-sm text-slate-400">Loading secure finder chat...</p>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <h2 className="text-xl font-bold mb-2">Chat Unavailable</h2>
        <p className="text-sm text-slate-400 mb-6">{error || "This conversation link has expired."}</p>
        <Link href="/" className="bg-teal-600 px-6 py-2.5 rounded-xl font-bold text-xs">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between max-w-lg mx-auto shadow-xl border-x border-slate-200">
      {/* Header */}
      <header className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
            <Dog className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Chatting with {conversation.pet?.name || "Pet"}&apos;s Family
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold">Anonymous Recovery Channel</p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
          Active
        </span>
      </header>

      {/* Messages Feed */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50/50">
        {conversation.messages?.map((msg: any) => {
          const isFinder = msg.senderType === "FINDER";

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isFinder ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-xs sm:max-w-sm p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  isFinder
                    ? "bg-teal-600 text-white rounded-br-none"
                    : "bg-white text-slate-900 border border-slate-200 rounded-bl-none"
                }`}
              >
                <p>{msg.content}</p>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {isFinder ? "You (Finder)" : `${conversation.pet?.name || "Owner"}'s Family`} • {formatTime(msg.createdAt)}
              </span>
            </div>
          );
        })}
      </main>

      {/* Reply Input */}
      <footer className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            required
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your message to the owner..."
            className="flex-1 text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow flex items-center gap-1.5 shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Send</span>
          </button>
        </form>
      </footer>
    </div>
  );
}
