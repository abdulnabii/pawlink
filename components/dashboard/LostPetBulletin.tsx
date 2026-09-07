"use client";

import { useState, useEffect } from "react";
import {
  Share2, MessageCircle, Twitter, Facebook, Copy, Check,
  X, AlertTriangle, ExternalLink
} from "lucide-react";

interface LostPetBulletinProps {
  petId: string;
  petName: string;
  onClose: () => void;
}

export default function LostPetBulletin({ petId, petName, onClose }: LostPetBulletinProps) {
  const [bulletin, setBulletin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/pets/${petId}/bulletin`)
      .then((r) => r.json())
      .then((d) => setBulletin(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [petId]);

  const handleCopy = async () => {
    if (!bulletin?.bulletin?.text) return;
    await navigator.clipboard.writeText(bulletin.bulletin.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-lg">Lost Pet Bulletin</h2>
              <p className="text-xs text-slate-500">Share {petName}&apos;s bulletin instantly</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm">Generating bulletin…</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Bulletin Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                {bulletin?.bulletin?.text}
              </pre>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-slate-900 hover:bg-slate-700 text-white"
              }`}
            >
              {copied ? (
                <><Check className="w-4 h-4" />Copied to clipboard!</>
              ) : (
                <><Copy className="w-4 h-4" />Copy Bulletin Text</>
              )}
            </button>

            {/* Share buttons */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Share directly</p>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={bulletin?.bulletin?.shareLinks?.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 py-3 px-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-2xl transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <span className="text-xs font-bold text-green-700">WhatsApp</span>
                </a>
                <a
                  href={bulletin?.bulletin?.shareLinks?.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 py-3 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl transition-colors"
                >
                  <Twitter className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-bold text-blue-600">Twitter / X</span>
                </a>
                <a
                  href={bulletin?.bulletin?.shareLinks?.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 py-3 px-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-2xl transition-colors"
                >
                  <Facebook className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-700">Facebook</span>
                </a>
              </div>
            </div>

            {/* Direct link */}
            {bulletin?.bulletin?.scanUrl && (
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-teal-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-teal-800">Pet Recovery Link</p>
                  <p className="text-xs text-teal-600 truncate">{bulletin.bulletin.scanUrl}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
