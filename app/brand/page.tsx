"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Download,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Radio,
  Eye,
  ArrowLeft,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { PawLinkLogo } from "@/components/ui/PawLinkLogo";
import { PawLinkAnimatedLogo } from "@/components/ui/PawLinkAnimatedLogo";

export default function BrandKitPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [animMode, setAnimMode] = useState<"radar" | "beacon" | "search" | "badge">("radar");
  const [animSize, setAnimSize] = useState<"sm" | "md" | "lg" | "xl">("lg");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-teal-400 hover:text-teal-300 mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to PawLink Home
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <span>PawLink Official Brand &amp; Logo System</span>
              <span className="text-xs uppercase px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                v2.0 Official
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Official visual identity, vector SVGs, and interactive radar animated logo components for PawLink Smart Pet Recovery.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/logo.svg"
              download="pawlink-logo.svg"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" /> Download SVGs
            </a>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5"
            >
              <span>App Dashboard</span>
            </Link>
          </div>
        </div>

        {/* 1. HERO ANIMATED LOGO SHOWCASE */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-4 right-4 flex items-center gap-2 text-[11px] font-bold text-teal-400 bg-teal-950/80 px-3 py-1.5 rounded-full border border-teal-800/60">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Vector Canvas</span>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            {/* Left: The Animated Logo Interactive Stage */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950/60 rounded-3xl border border-slate-800/80 w-full min-h-[320px]">
              <PawLinkAnimatedLogo
                size={animSize}
                mode={animMode}
                statusText={
                  animMode === "radar"
                    ? "LIVE RECOVERY RADAR ACTIVE"
                    : animMode === "search"
                    ? "SCANNING FOR LOST PET BEACONS..."
                    : animMode === "beacon"
                    ? "SECURE IOT COLLAR LINKED"
                    : "OFFICIAL SMART COLLAR BADGE"
                }
              />
            </div>

            {/* Right: Interactive Mode Controls */}
            <div className="w-full lg:w-80 space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-white mb-2 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-teal-400" />
                  <span>Animation Modes</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {(["radar", "search", "beacon", "badge"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setAnimMode(m)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left ${
                        animMode === m
                          ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 font-black"
                          : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80"
                      }`}
                    >
                      {m === "radar" && "📡 Radar Wave"}
                      {m === "search" && "🔍 Fast Search"}
                      {m === "beacon" && "💓 Pulse Breath"}
                      {m === "badge" && "🛡️ Smart Badge"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                  Component Scale
                </h3>
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(["sm", "md", "lg", "xl"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setAnimSize(s)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                        animSize === s ? "bg-teal-600 text-white" : "text-slate-500 hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 leading-relaxed">
                Tip: Click or hover the logo to trigger a localized beacon ping and ripple shockwave.
              </div>
            </div>
          </div>
        </div>

        {/* 2. OFFICIAL LOGO VARIANTS (LIGHT, DARK & MASTER STACKED) */}
        <div>
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <span>Official Logo Variants</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Master Stacked Logo (Official Uploaded Design) */}
            <div className="bg-slate-900/90 rounded-3xl p-6 border border-teal-500/30 text-white shadow-xl space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-teal-300">
                  Master Official Emblem
                </span>
                <span className="text-[10px] font-mono text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800">
                  public/logo.png
                </span>
              </div>

              <div className="py-4 flex items-center justify-center">
                <PawLinkLogo variant="stacked" theme="dark" size="md" href={null} />
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <p className="text-xs text-slate-300 font-medium text-center">
                  Dog &amp; Cat Rescue Crest with QR Tag &amp; Pin
                </p>
                <div className="flex items-center justify-center gap-2">
                  <a
                    href="/logo.png"
                    download="pawlink-master-logo.png"
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> PNG (1024px)
                  </a>
                  <a
                    href="/logo.svg"
                    download="pawlink-master-logo.svg"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> SVG
                  </a>
                </div>
              </div>
            </div>

            {/* Horizontal Light Theme */}
            <div className="bg-slate-100 rounded-3xl p-6 border border-slate-300 text-slate-900 shadow-md space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Light Theme (Navbar / Docs)
                </span>
                <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Horizontal
                </span>
              </div>

              <div className="py-8 flex items-center justify-center">
                <PawLinkLogo variant="full" theme="light" size="lg" href={null} />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600">Light navigation &amp; cards</span>
                <a
                  href="/logo.svg"
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:underline"
                >
                  <Eye className="w-3.5 h-3.5" /> View SVG
                </a>
              </div>
            </div>

            {/* Horizontal Dark Theme */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white shadow-xl space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  Dark Theme (Console / App)
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Horizontal Dark
                </span>
              </div>

              <div className="py-8 flex items-center justify-center">
                <PawLinkLogo variant="full" theme="dark" size="lg" href={null} />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Admin portal &amp; dark UI</span>
                <a
                  href="/logo-white.svg"
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 hover:underline"
                >
                  <Eye className="w-3.5 h-3.5" /> View SVG
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 3. APP ICONS & BRAND ASSETS */}
        <div>
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-teal-400" />
            <span>App Icons &amp; Vector Assets</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Asset 1: Standalone Icon */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-3">
              <div className="w-20 h-20 rounded-2xl bg-slate-950 p-2 border border-slate-800 flex items-center justify-center">
                <img src="/logo-icon.svg" alt="PawLink Icon" className="w-16 h-16" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">App Icon Mark</p>
                <p className="text-[11px] text-slate-400">public/logo-icon.svg</p>
              </div>
              <a
                href="/logo-icon.svg"
                download="pawlink-icon.svg"
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" /> Download
              </a>
            </div>

            {/* Asset 2: Animated SVG */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-3">
              <div className="w-20 h-20 rounded-2xl bg-slate-950 p-2 border border-slate-800 flex items-center justify-center">
                <img src="/logo-animated.svg" alt="Animated Logo" className="w-16 h-16" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">Animated SVG</p>
                <p className="text-[11px] text-slate-400">public/logo-animated.svg</p>
              </div>
              <a
                href="/logo-animated.svg"
                download="pawlink-animated.svg"
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" /> Download
              </a>
            </div>

            {/* Asset 3: 192px PWA Icon */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-3">
              <div className="w-20 h-20 rounded-2xl bg-slate-950 p-2 border border-slate-800 flex items-center justify-center overflow-hidden">
                <img src="/icons/icon-192.png" alt="192 Icon" className="w-16 h-16 rounded-xl" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">PWA Mobile Icon (192px)</p>
                <p className="text-[11px] text-slate-400">public/icons/icon-192.png</p>
              </div>
              <a
                href="/icons/icon-192.png"
                download="icon-192.png"
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" /> Download
              </a>
            </div>

            {/* Asset 4: 512px Master Icon */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-3">
              <div className="w-20 h-20 rounded-2xl bg-slate-950 p-2 border border-slate-800 flex items-center justify-center overflow-hidden">
                <img src="/icons/icon-512.png" alt="512 Icon" className="w-16 h-16 rounded-xl" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">Master Icon (512px)</p>
                <p className="text-[11px] text-slate-400">public/icons/icon-512.png</p>
              </div>
              <a
                href="/icons/icon-512.png"
                download="icon-512.png"
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" /> Download
              </a>
            </div>
          </div>
        </div>

        {/* 4. OFFICIAL PHOTOREALISTIC BRAND GRAPHICS */}
        <div>
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <span>Official Photorealistic Brand Artwork</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Artwork 1: App Icon */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
                <img
                  src="/images/pawlink-official-logo.jpg"
                  alt="PawLink Official Logo Master Artwork"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">App Store Master Icon</h4>
                  <p className="text-xs text-slate-400">Glow squircle with interconnected infinity paw</p>
                </div>
                <a
                  href="/images/pawlink-official-logo.jpg"
                  target="_blank"
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-teal-300 rounded-xl transition-colors inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Full Size
                </a>
              </div>
            </div>

            {/* Artwork 2: Titanium Collar Tag Badge & Radar Mockup */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="aspect-video lg:aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
                <img
                  src="/images/pawlink-brand-mockup.jpg"
                  alt="PawLink Titanium Collar Tag & Radar Tracker"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">Hardware Tag &amp; Radar App Mockup</h4>
                  <p className="text-xs text-slate-400">Embossed collar tag badge with neon tracking interface</p>
                </div>
                <a
                  href="/images/pawlink-brand-mockup.jpg"
                  target="_blank"
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-teal-300 rounded-xl transition-colors inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Full Size
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 5. BRAND COLOR PALETTE & CODES */}
        <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 space-y-6">
          <h3 className="text-base font-extrabold text-white">Official Brand Color Palette</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 rounded-xl bg-[#0d9488] shadow-lg shadow-teal-500/20" />
              <div>
                <p className="font-bold text-xs text-white">PawLink Teal</p>
                <button
                  onClick={() => copyToClipboard("#0d9488", "teal")}
                  className="text-[11px] font-mono text-teal-400 hover:underline flex items-center gap-1"
                >
                  #0d9488 {copied === "teal" && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-16 rounded-xl bg-[#10b981] shadow-lg shadow-emerald-500/20" />
              <div>
                <p className="font-bold text-xs text-white">Emerald Recovery</p>
                <button
                  onClick={() => copyToClipboard("#10b981", "emerald")}
                  className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1"
                >
                  #10b981 {copied === "emerald" && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-16 rounded-xl bg-[#2dd4bf] shadow-lg shadow-cyan-500/20" />
              <div>
                <p className="font-bold text-xs text-white">Electric Cyan Glow</p>
                <button
                  onClick={() => copyToClipboard("#2dd4bf", "cyan")}
                  className="text-[11px] font-mono text-cyan-300 hover:underline flex items-center gap-1"
                >
                  #2dd4bf {copied === "cyan" && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-16 rounded-xl bg-[#0f172a] border border-slate-700" />
              <div>
                <p className="font-bold text-xs text-white">Deep Slate Navy</p>
                <button
                  onClick={() => copyToClipboard("#0f172a", "slate")}
                  className="text-[11px] font-mono text-slate-400 hover:underline flex items-center gap-1"
                >
                  #0f172a {copied === "slate" && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
