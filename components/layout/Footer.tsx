import Link from "next/link";
import { ShieldCheck, Heart, Lock, AlertTriangle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-bold">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Paw<span className="text-teal-400">Link</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Smart Pet Identification & QR Recovery Infrastructure. Connecting lost pets with their families through instant mobile scans, WhatsApp alerts, and privacy-preserving location sharing.
            </p>
            <div className="inline-flex items-center gap-2 text-xs bg-slate-800/80 text-teal-300 px-3 py-1.5 rounded-lg border border-slate-700">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero-Tracking Privacy Guarantee</span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/#how-it-works" className="hover:text-teal-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#lost-mode" className="hover:text-teal-400 transition-colors">
                  Lost Mode Protocol
                </Link>
              </li>
              <li>
                <Link href="/#privacy" className="hover:text-teal-400 transition-colors">
                  Privacy Architecture
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-teal-400 transition-colors">
                  Pricing Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Recovery Tools */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Recovery
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/dashboard/pets" className="hover:text-teal-400 transition-colors">
                  Activate Lost Mode
                </Link>
              </li>
              <li>
                <Link href="/dashboard/tags" className="hover:text-teal-400 transition-colors">
                  Collar Tag Generator
                </Link>
              </li>
              <li>
                <Link href="/dashboard/tags" className="hover:text-teal-400 transition-colors">
                  Test My Tag
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-teal-400 transition-colors">
                  Owner Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Disclaimer */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Trust & Safety
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <span className="text-slate-400">Encrypted WhatsApp Alerts</span>
              </li>
              <li>
                <span className="text-slate-400">Consent-Based GPS Sharing</span>
              </li>
              <li>
                <span className="text-slate-400">Anonymous Finder Messaging</span>
              </li>
              <li>
                <span className="text-slate-400">EXIF Metadata Stripping</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Responsible Notice & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="flex items-center gap-1.5 text-center md:text-left">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              PawLink is a recovery and identification service. QR/NFC tags provide scan-based recovery events, not continuous GPS tracking.
            </span>
          </p>
          <div className="flex items-center gap-1">
            <span>&copy; {new Date().getFullYear()} PawLink Inc. Built with care for pets everywhere.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
