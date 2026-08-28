"use client";

import { useState, useEffect } from "react";
import { QrCode, Download, Printer, ShieldCheck, Sparkles } from "lucide-react";
import { generateQrDataUrl, generateQrSvg } from "@/lib/qr";

interface PrintableTagBadgeProps {
  tagCode: string;
  petName: string;
  species: string;
}

export function PrintableTagBadge({ tagCode, petName, species }: PrintableTagBadgeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrSvg, setQrSvg] = useState<string>("");

  useEffect(() => {
    generateQrDataUrl(tagCode).then(setQrDataUrl);
    generateQrSvg(tagCode).then(setQrSvg);
  }, [tagCode]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `PawLink-${petName}-${tagCode}.png`;
    link.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-teal-600" />
            <span>Collar Tag Badge & Print Template</span>
          </h3>
          <p className="text-xs text-slate-500">
            Attach this durable QR tag to {petName}&apos;s collar or carry a copy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPng}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Badge</span>
          </button>
        </div>
      </div>

      {/* Visual Badge Card */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
        {/* Physical Collar Tag Preview */}
        <div className="w-48 h-64 bg-white rounded-3xl p-4 shadow-xl border-2 border-slate-900 flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="w-4 h-4 rounded-full border-2 border-slate-900 bg-slate-100 mx-auto mb-1" />
          <div className="flex items-center gap-1 text-[10px] font-black tracking-widest text-teal-700 uppercase">
            <ShieldCheck className="w-3 h-3 text-teal-600" />
            <span>PAWLINK TAG</span>
          </div>

          <div className="w-28 h-28 p-1 bg-white rounded-xl border border-slate-200 shadow-inner flex items-center justify-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR Code for ${petName}`} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full animate-pulse bg-slate-200 rounded" />
            )}
          </div>

          <div>
            <p className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">{petName}</p>
            <p className="text-[10px] font-mono text-slate-500 font-semibold">{tagCode}</p>
            <p className="text-[9px] text-teal-600 font-bold uppercase tracking-wider mt-0.5">SCAN IF LOST</p>
          </div>
        </div>

        {/* Specifications & Instructions */}
        <div className="max-w-xs space-y-3 text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Tag Specifications</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-1.5">
              <span className="text-teal-600 font-bold">•</span>
              <span><strong>Tag Identifier:</strong> <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">{tagCode}</code></span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-teal-600 font-bold">•</span>
              <span><strong>Error Correction:</strong> Level H (30% damage resistant)</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-teal-600 font-bold">•</span>
              <span><strong>Compatible With:</strong> Any smartphone camera & NFC tags</span>
            </li>
          </ul>
          <p className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded-lg border border-slate-200">
            Print this tag on waterproof sticker paper or insert into a clear collar pouch.
          </p>
        </div>
      </div>
    </div>
  );
}
