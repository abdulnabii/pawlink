"use client";

import React from "react";
import Link from "next/link";

export interface PawLinkLogoProps {
  variant?: "full" | "compact" | "icon";
  theme?: "light" | "dark" | "auto";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  animated?: boolean;
  href?: string | null;
  className?: string;
  onClick?: () => void;
}

const sizeConfig = {
  xs: { icon: "w-6 h-6", text: "text-base", subtext: "text-[7px]", gap: "gap-1.5" },
  sm: { icon: "w-8 h-8", text: "text-lg", subtext: "text-[8px]", gap: "gap-2" },
  md: { icon: "w-10 h-10", text: "text-xl sm:text-2xl", subtext: "text-[9px]", gap: "gap-2.5" },
  lg: { icon: "w-12 h-12", text: "text-2xl sm:text-3xl", subtext: "text-[10px]", gap: "gap-3" },
  xl: { icon: "w-16 h-16", text: "text-3xl sm:text-4xl", subtext: "text-[12px]", gap: "gap-3.5" },
  "2xl": { icon: "w-24 h-24", text: "text-5xl", subtext: "text-xs", gap: "gap-4" },
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
          <span className="absolute inset-0 rounded-2xl bg-teal-400/20 animate-ping pointer-events-none" />
          <span className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-emerald-400/20 blur-md pointer-events-none animate-pulse" />
        </>
      )}

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pl-react-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="50%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <linearGradient id="pl-react-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#2dd4bf" />
          </linearGradient>

          <linearGradient id="pl-react-squircle" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <filter id="pl-react-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Squircle App Container */}
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          rx="24"
          fill="url(#pl-react-squircle)"
          stroke="#1e293b"
          strokeWidth="1.5"
        />

        {/* Radar Signal Wave Nodes */}
        <circle cx="16" cy="50" r="2" fill="#2dd4bf" opacity="0.8" />
        <circle cx="84" cy="50" r="2" fill="#2dd4bf" opacity="0.8" />
        <circle cx="50" cy="86" r="2.5" fill="#38bdf8" />

        {/* 4 Paw Toe Nodes */}
        <ellipse
          cx="28"
          cy="38"
          rx="6.5"
          ry="9"
          transform="rotate(-24 28 38)"
          fill="url(#pl-react-primary)"
        />
        <ellipse
          cx="26.5"
          cy="35.5"
          rx="3"
          ry="5"
          transform="rotate(-24 26.5 35.5)"
          fill="#a7f3d0"
          opacity="0.45"
        />

        <ellipse
          cx="42.5"
          cy="27"
          rx="7"
          ry="10"
          transform="rotate(-8 42.5 27)"
          fill="url(#pl-react-primary)"
        />
        <ellipse
          cx="41"
          cy="24"
          rx="3"
          ry="5.5"
          transform="rotate(-8 41 24)"
          fill="#a7f3d0"
          opacity="0.45"
        />

        <ellipse
          cx="57.5"
          cy="27"
          rx="7"
          ry="10"
          transform="rotate(8 57.5 27)"
          fill="url(#pl-react-primary)"
        />
        <ellipse
          cx="56"
          cy="24"
          rx="3"
          ry="5.5"
          transform="rotate(8 56 24)"
          fill="#a7f3d0"
          opacity="0.45"
        />

        <ellipse
          cx="72"
          cy="38"
          rx="6.5"
          ry="9"
          transform="rotate(24 72 38)"
          fill="url(#pl-react-primary)"
        />
        <ellipse
          cx="70.5"
          cy="35.5"
          rx="3"
          ry="5"
          transform="rotate(24 70.5 35.5)"
          fill="#a7f3d0"
          opacity="0.45"
        />

        {/* Central Upper Pad Crown */}
        <path
          d="M 37 47 C 37 43, 42 39, 50 39 C 58 39, 63 43, 63 47 C 63 53, 57 57, 50 59 C 43 57, 37 53, 37 47 Z"
          fill="url(#pl-react-primary)"
        />
        <ellipse cx="50" cy="44.5" rx="7" ry="2.5" fill="#a7f3d0" opacity="0.45" />

        {/* Interwoven Infinity Link Loop (The 'Link') */}
        <path
          d="M 50 59 
             C 42 50, 29 50, 24 56
             C 17 63, 18 74, 26 78
             C 35 82, 45 71, 50 64
             C 55 71, 65 82, 74 78
             C 82 74, 83 63, 76 56
             C 71 50, 58 50, 50 59 Z"
          fill="none"
          stroke="url(#pl-react-primary)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#pl-react-glow)"
        />

        {/* Core Electric Highlight Line */}
        <path
          d="M 50 59 
             C 42 50, 29 50, 24 56
             C 17 63, 18 74, 26 78
             C 35 82, 45 71, 50 64
             C 55 71, 65 82, 74 78
             C 82 74, 83 63, 76 56
             C 71 50, 58 50, 50 59 Z"
          fill="none"
          stroke="url(#pl-react-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Central Beacon Sparkle */}
        <circle cx="50" cy="62.5" r="3" fill="#ffffff" filter="url(#pl-react-glow)" />
      </svg>
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
            <span
              className={`font-extrabold uppercase tracking-widest ${currentSize.subtext} mt-0.5 ${
                theme === "dark"
                  ? "text-teal-400/90"
                  : theme === "light"
                  ? "text-teal-600"
                  : "text-teal-600 dark:text-teal-400"
              }`}
            >
              Smart Pet Recovery
            </span>
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
