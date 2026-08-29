"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ShieldCheck,
  QrCode,
  MapPin,
  MessageCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Heart,
  Zap,
  PhoneCall,
  BellRing,
  HelpCircle,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function MarketingPage() {
  const [demoLostMode, setDemoLostMode] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-500 selection:text-white">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold tracking-wide uppercase mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Pet Recovery Infrastructure</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Never Lose Your Pet <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              Without a Way Home.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Smart QR and NFC pet identity system that allows finders to instantly contact you and share GPS locations without exposing your personal information.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-extrabold text-base px-8 py-4 rounded-2xl shadow-xl shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Protect My Pet Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <a
              href="#interactive-demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-white font-bold text-base px-8 py-4 rounded-2xl border border-slate-700 transition-all"
            >
              <QrCode className="w-5 h-5 text-teal-400" />
              <span>Try Live Simulator</span>
            </a>
          </div>

          {/* Key Guarantee Badges */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-400">
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Zero-Auth for Finders</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Instant WhatsApp Alert</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Consent-Based GPS</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Privacy Shield</span>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE SCAN SIMULATOR */}
      <section id="interactive-demo" className="py-20 bg-slate-100 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-black uppercase tracking-widest text-teal-600">
              Interactive Tag Demo
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              See what happens when someone scans your pet&apos;s tag
            </h3>
            <p className="text-slate-600 text-sm mt-2">
              Toggle Lost Mode to see how PawLink instantly adapts the recovery page.
            </p>

            <div className="mt-6 inline-flex p-1.5 bg-white rounded-2xl border border-slate-300 shadow-sm">
              <button
                onClick={() => setDemoLostMode(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  !demoLostMode
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🟢 Safe Mode (Normal)
              </button>
              <button
                onClick={() => setDemoLostMode(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  demoLostMode
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🚨 Lost Mode Active
              </button>
            </div>
          </div>

          {/* Interactive Mobile Mockup */}
          <div className="max-w-sm mx-auto bg-white rounded-[2.5rem] p-4 shadow-2xl border-4 border-slate-800 relative">
            {/* Phone Speaker Notch */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-4" />

            {/* In-Phone Screen */}
            <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4 text-center overflow-hidden">
              {demoLostMode ? (
                <div className="bg-red-600 text-white p-2 rounded-xl text-xs font-black uppercase tracking-wider mb-4 animate-pulse">
                  🚨 MAX IS MISSING - $500 REWARD
                </div>
              ) : (
                <div className="bg-emerald-600 text-white p-1.5 rounded-xl text-xs font-bold mb-4">
                  ✓ Official PawLink ID
                </div>
              )}

              {/* Photo */}
              <div className="w-24 h-24 rounded-full mx-auto p-1 bg-gradient-to-tr from-teal-500 to-emerald-400 shadow mb-3">
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-3xl">
                  🐕
                </div>
              </div>

              <h4 className="text-xl font-black text-slate-900">Max</h4>
              <p className="text-xs text-slate-500">Golden Retriever • Male • Golden</p>

              {demoLostMode && (
                <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-left text-[11px] text-red-900">
                  <strong>Last Seen:</strong> Near Clifton Beach Park<br />
                  <strong>Instructions:</strong> Friendly, responds to treats.
                </div>
              )}

              {/* Demo Action Buttons */}
              <div className="mt-4 space-y-2">
                <div className="w-full py-2.5 bg-teal-600 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>📍 Share My Location</span>
                </div>
                <div className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-teal-400" />
                  <span>Contact Owner</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-black uppercase tracking-widest text-teal-600">
              Simple 3-Step Process
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              How PawLink Reunites Pets With Families
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-left relative group hover:border-teal-400 transition-colors">
              <span className="text-4xl font-black text-teal-600/30 block mb-4">01</span>
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Create Profile</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Add photos, species, medical notes, emergency instructions, and your WhatsApp notification number in minutes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-left relative group hover:border-teal-400 transition-colors">
              <span className="text-4xl font-black text-teal-600/30 block mb-4">02</span>
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Attach QR Tag</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Print or attach your high-entropy vector collar tag badge. Compatible with every camera smartphone and NFC tag.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-left relative group hover:border-teal-400 transition-colors">
              <span className="text-4xl font-black text-teal-600/30 block mb-4">03</span>
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                <BellRing className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Instant Recovery</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                If scanned, you get an instant WhatsApp alert. The finder shares their GPS coordinates and can message you anonymously.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRIVACY & SECURITY SECTION */}
      <section id="privacy" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 uppercase tracking-widest mb-3">
                <Lock className="w-4 h-4" />
                <span>Privacy & Security Architecture</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-6">
                Protecting Both You and the Kind Stranger Who Found Your Pet.
              </h3>
              <div className="space-y-4 text-slate-300 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <p>
                    <strong className="text-white">Zero Raw IP Surveillance:</strong> IP addresses are salted and hashed with SHA-256 for abuse prevention without storing raw network data.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <p>
                    <strong className="text-white">Strict Public DTO Projection:</strong> Microchip numbers, owner home addresses, and private medical notes are strictly filtered from public scan pages.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <p>
                    <strong className="text-white">EXIF GPS Stripping:</strong> All photos uploaded by finders pass through server-side filters to strip camera coordinates and device metadata.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 p-8 rounded-3xl border border-slate-700 space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
                <ShieldCheck className="w-8 h-8 text-teal-400" />
                <div>
                  <h4 className="text-base font-bold text-white">Responsible Identification</h4>
                  <p className="text-xs text-slate-400">Clear and honest hardware boundaries</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                PawLink uses scan-triggered recovery events. QR tags do not continuously track an animal like battery-powered satellite collars. Instead, they provide instant notification the moment a human finds your pet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xs font-black uppercase tracking-widest text-teal-600">
            Simple Pricing
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1 mb-12">
            Accessible Protection For Every Animal
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between text-left">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Basic ID</h4>
                <p className="text-xs text-slate-500 mt-1">Essential digital pet tag</p>
                <div className="my-6">
                  <span className="text-4xl font-black text-slate-900">Rs 0</span>
                  <span className="text-xs text-slate-500 font-semibold"> / forever</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2">✓ 1 Pet Profile & QR Tag</li>
                  <li className="flex items-center gap-2">✓ Instant Scan Recovery Page</li>
                  <li className="flex items-center gap-2">✓ Email Scan Alerts</li>
                  <li className="flex items-center gap-2">✓ GPS Location Sharing</li>
                </ul>
              </div>
              <Link
                href="/auth/register"
                className="mt-8 block text-center py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Get Started Free
              </Link>
            </div>

            {/* Plus */}
            <div className="bg-white p-8 rounded-3xl border-2 border-teal-500 shadow-xl flex flex-col justify-between text-left relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow">
                Most Popular
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Plus Recovery</h4>
                <p className="text-xs text-slate-500 mt-1">Complete multi-pet recovery pack</p>
                <div className="my-6">
                  <span className="text-4xl font-black text-slate-900">Rs 1,499</span>
                  <span className="text-xs text-slate-500 font-semibold"> / month</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2">✓ Up to 5 Pet Profiles</li>
                  <li className="flex items-center gap-2">✓ <strong>Instant WhatsApp Scan Alerts</strong></li>
                  <li className="flex items-center gap-2">✓ <strong>Interactive Leaflet Scan Map</strong></li>
                  <li className="flex items-center gap-2">✓ Emergency Lost Mode & Reward Banner</li>
                  <li className="flex items-center gap-2">✓ Anonymous In-App Finder Chat</li>
                </ul>
              </div>
              <Link
                href="/auth/register"
                className="mt-8 block text-center py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20"
              >
                Start Plus Plan
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between text-left">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Pro Household</h4>
                <p className="text-xs text-slate-500 mt-1">Unlimited pets & caretakers</p>
                <div className="my-6">
                  <span className="text-4xl font-black text-slate-900">Rs 2,999</span>
                  <span className="text-xs text-slate-500 font-semibold"> / month</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2">✓ Unlimited Pets & Tags</li>
                  <li className="flex items-center gap-2">✓ Caretaker & Family Delegation</li>
                  <li className="flex items-center gap-2">✓ Digital Pet Passport & Medical Alerts</li>
                  <li className="flex items-center gap-2">✓ Priority Notification Dispatch</li>
                </ul>
              </div>
              <Link
                href="/auth/register"
                className="mt-8 block text-center py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-gradient-to-tr from-teal-700 to-emerald-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Give Your Pet the Best Protection Today.
          </h2>
          <p className="text-base sm:text-lg text-teal-100 max-w-xl mx-auto mb-8">
            Create your account in under two minutes and print your pet&apos;s recovery tag immediately.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-base px-8 py-4 rounded-2xl shadow-xl transition-transform hover:scale-105"
          >
            <span>Create Free Digital Pet ID</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
