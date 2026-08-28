"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShieldCheck, QrCode, Menu, X, ArrowRight, BellRing } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1">
              Paw<span className="text-teal-600">Link</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block -mt-1">
              Smart Pet Recovery
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link href="/#how-it-works" className="hover:text-teal-600 transition-colors">
            How It Works
          </Link>
          <Link href="/#lost-mode" className="hover:text-teal-600 transition-colors">
            Lost Mode
          </Link>
          <Link href="/#privacy" className="hover:text-teal-600 transition-colors">
            Privacy & Security
          </Link>
          <Link href="/#pricing" className="hover:text-teal-600 transition-colors">
            Pricing
          </Link>
        </nav>

        {/* User CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-4 h-4 text-teal-400" />
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-slate-700 hover:text-slate-900 font-semibold text-sm px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm shadow-teal-600/20 transition-all hover:shadow hover:-translate-y-0.5"
              >
                <span>Protect My Pet</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 shadow-xl">
          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 font-medium py-2 hover:text-teal-600"
          >
            How It Works
          </Link>
          <Link
            href="/#lost-mode"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 font-medium py-2 hover:text-teal-600"
          >
            Lost Mode
          </Link>
          <Link
            href="/#privacy"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 font-medium py-2 hover:text-teal-600"
          >
            Privacy & Security
          </Link>
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-slate-900 text-white font-semibold py-3 rounded-xl"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center border border-slate-300 text-slate-800 font-semibold py-2.5 rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center bg-teal-600 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-teal-600/20"
                >
                  Protect My Pet
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
