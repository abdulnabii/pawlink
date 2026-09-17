"use client";

import React from "react";
import Link from "next/link";

export interface PawLinkLogoProps {
  variant?: "full" | "compact" | "icon" | "stacked";
  theme?: "light" | "dark" | "auto";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  animated?: boolean;
  href?: string | null;
  className?: string;
  onClick?: () => void;
}

const sizeConfig = {
  xs: { icon: "w-6 h-6", text: "text-base", subtext: "text-[7px]", gap: "gap-1.5", stacked: "w-24" },
  sm: { icon: "w-8 h-8", text: "text-lg", subtext: "text-[8px]", gap: "gap-2", stacked: "w-32" },
  md: { icon: "w-10 h-10", text: "text-xl sm:text-2xl", subtext: "text-[9px]", gap: "gap-2.5", stacked: "w-44" },
  lg: { icon: "w-12 h-12", text: "text-2xl sm:text-3xl", subtext: "text-[10px]", gap: "gap-3", stacked: "w-56" },
  xl: { icon: "w-16 h-16", text: "text-3xl sm:text-4xl", subtext: "text-[12px]", gap: "gap-3.5", stacked: "w-68" },
  "2xl": { icon: "w-24 h-24", text: "text-5xl", subtext: "text-xs", gap: "gap-4", stacked: "w-80" },
};

export function PawLinkEmblem({
  className = "w-10 h-10",
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
      {/* Optional Radar Wave Ripple Behind */}
      {animated && (
        <>
          <span className="absolute inset-0 rounded-full bg-teal-400/25 animate-ping pointer-events-none" />
          <span className="absolute -inset-1 rounded-full bg-gradient-to-tr from-teal-500/25 to-emerald-400/25 blur-md pointer-events-none animate-pulse" />
        </>
      )}

      {/* Official Dog + Cat + Collar QR Tag + Hand/Pin Emblem */}
      <img
        src="/logo-icon.png?v=2"
        alt="PawLink Emblem"
        className="w-full h-full object-contain select-none transition-transform duration-200 group-hover:scale-105 drop-shadow-md"
        loading="eager"
      />
    </div>
  );
}

export function PawLinkLogo({
  variant = "full",
  theme = "auto",
  size = "md",
  animated = false,
  href = "/",
  className = "",
  onClick,
}: PawLinkLogoProps) {
  const currentSize = sizeConfig[size] || sizeConfig.md;

  // Stacked variant uses the exact full official logo graphic
  if (variant === "stacked") {
    const isDark = theme === "dark";
    const src = isDark ? "/logo-white.png?v=2" : "/logo.png?v=2";

    const content = (
      <div
        onClick={onClick}
        className={`inline-flex flex-col items-center select-none group transition-all duration-200 ${
          href ? "hover:opacity-95 cursor-pointer" : ""
        } ${className}`}
      >
        <div className={`relative ${currentSize.stacked}`}>
          <img
            src={src}
            alt="PawLink - Pets Always Find Their Way Home"
            className="w-full h-auto object-contain drop-shadow-lg"
            loading="eager"
          />
        </div>
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="inline-flex">
          {content}
        </Link>
      );
    }
    return content;
  }

  const content = (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${currentSize.gap} group select-none transition-all duration-200 ${
        href ? "hover:opacity-95 cursor-pointer" : ""
      } ${className}`}
    >
      <PawLinkEmblem className={currentSize.icon} animated={animated} />

      {variant !== "icon" && (
        <div className="flex flex-col text-left leading-none">
          <span
            className={`font-black tracking-tight ${currentSize.text} ${
              theme === "dark"
                ? "text-white"
                : theme === "light"
                ? "text-slate-900"
                : "text-slate-900 dark:text-white"
            }`}
          >
            Paw
            <span className="bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent group-hover:brightness-110 transition-all">
              Link
            </span>
          </span>

          {variant === "full" && (
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`font-extrabold uppercase tracking-widest ${currentSize.subtext} ${
                  theme === "dark"
                    ? "text-teal-400/90"
                    : theme === "light"
                    ? "text-teal-600"
                    : "text-teal-600 dark:text-teal-400"
                }`}
              >
                Pets Always Find Their Way Home
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}
