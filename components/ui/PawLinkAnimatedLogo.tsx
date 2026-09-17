"use client";

import React, { useState } from "react";

export interface PawLinkAnimatedLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  mode?: "radar" | "beacon" | "search" | "badge";
  statusText?: string;
  showWordmark?: boolean;
  interactive?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: { box: "w-20 h-20", emblem: "w-12 h-12", text: "text-lg", badge: "text-[9px]" },
  md: { box: "w-32 h-32", emblem: "w-20 h-20", text: "text-2xl", badge: "text-[11px]" },
  lg: { box: "w-44 h-44", emblem: "w-28 h-28", text: "text-3xl", badge: "text-xs" },
  xl: { box: "w-60 h-60", emblem: "w-36 h-36", text: "text-4xl", badge: "text-sm" },
};

export function PawLinkAnimatedLogo({
  size = "md",
  mode = "radar",
  statusText = "LIVE RECOVERY RADAR ACTIVE",
  showWordmark = true,
  interactive = true,
  className = "",
}: PawLinkAnimatedLogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const current = sizeClasses[size] || sizeClasses.md;

  const handleClick = () => {
    if (!interactive) return;
    setClicked(true);
    setTimeout(() => setClicked(false), 1200);
  };

  return (
    <div
      className={`flex flex-col items-center justify-center select-none ${className}`}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Outer Radar Animation Canvas Container */}
      <div className={`relative flex items-center justify-center ${current.box} cursor-pointer group`}>
        {/* Layer 1: Ambient Background Glow Field */}
        <div
          className={`absolute inset-2 rounded-full bg-gradient-to-tr from-teal-500/20 via-emerald-500/10 to-cyan-400/20 blur-2xl transition-all duration-700 ${
            isHovered ? "scale-125 opacity-100" : "scale-100 opacity-60"
          }`}
        />

        {/* Layer 2: Concentric Radar Sonar Ripples */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Ring 1 */}
          <span
            className="absolute rounded-full border border-teal-400/40 animate-ping"
            style={{
              width: "80%",
              height: "80%",
              animationDuration: mode === "search" ? "1.8s" : "3s",
            }}
          />

          {/* Ring 2 - Delayed */}
          <span
            className="absolute rounded-full border border-emerald-400/30 animate-ping"
            style={{
              width: "95%",
              height: "95%",
              animationDuration: mode === "search" ? "2.2s" : "3.5s",
              animationDelay: "1s",
            }}
          />

          {/* Fixed Outer Orbit Grid */}
          <div
            className={`absolute inset-0 rounded-full border border-dashed border-teal-500/25 ${
              isHovered ? "border-teal-400/50 scale-105" : ""
            } transition-transform duration-500`}
            style={{ animation: "spin 25s linear infinite" }}
          >
            {/* Small Orbiting Beacon Satellites */}
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-teal-300 shadow-[0_0_8px_#2dd4bf]" />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#38bdf8]" />
          </div>

          {/* Layer 3: Rotating Radar Sweep Beam (Mode: Radar or Search) */}
          {(mode === "radar" || mode === "search") && (
            <div
              className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
              style={{
                animation: `spin ${mode === "search" ? "2.5s" : "4.5s"} linear infinite`,
              }}
            >
              <div
                className="w-1/2 h-1/2 absolute top-0 right-0 origin-bottom-left"
                style={{
                  background:
                    "conic-gradient(from 0deg, rgba(45, 212, 191, 0.35) 0deg, rgba(16, 185, 129, 0.05) 50deg, transparent 60deg)",
                }}
              />
            </div>
          )}
        </div>

        {/* Layer 4: Central Squircle Icon Badge with Breathing Float */}
        <div
          className={`relative z-10 transition-transform duration-300 ${current.emblem} ${
            clicked ? "scale-90" : isHovered ? "scale-110" : "scale-100"
          }`}
          style={{
            animation: "pulse 3.5s ease-in-out infinite",
          }}
        >
          {/* Glowing Shadow Cushion */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-teal-500 to-emerald-400 opacity-60 blur-md group-hover:opacity-100 transition-opacity" />

          {/* SVG Emblem Component */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full relative z-10 drop-shadow-2xl rounded-3xl"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="pl-anim-comp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5eead4" />
                <stop offset="45%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              <linearGradient id="pl-anim-comp-accent" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#2dd4bf" />
              </linearGradient>

              <linearGradient id="pl-anim-comp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="60%" stopColor="#090d16" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>

              <filter id="pl-anim-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Dark Metallic Squircle Body */}
            <rect
              x="3"
              y="3"
              width="94"
              height="94"
              rx="24"
              fill="url(#pl-anim-comp-bg)"
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Subtle Inner Rim */}
            <rect
              x="6"
              y="6"
              width="88"
              height="88"
              rx="21"
              fill="none"
              stroke="url(#pl-anim-comp-grad)"
              strokeWidth="0.75"
              opacity="0.4"
            />

            {/* 4 Paw Toe Nodes */}
            <ellipse
              cx="28"
              cy="38"
              rx="6.5"
              ry="9"
              transform="rotate(-24 28 38)"
              fill="url(#pl-anim-comp-grad)"
              filter="url(#pl-anim-glow)"
            />
            <ellipse
              cx="26.5"
              cy="35.5"
              rx="3"
              ry="5"
              transform="rotate(-24 26.5 35.5)"
              fill="#a7f3d0"
              opacity="0.5"
            />

            <ellipse
              cx="42.5"
              cy="27"
              rx="7"
              ry="10"
              transform="rotate(-8 42.5 27)"
              fill="url(#pl-anim-comp-grad)"
              filter="url(#pl-anim-glow)"
            />
            <ellipse
              cx="41"
              cy="24"
              rx="3"
              ry="5.5"
              transform="rotate(-8 41 24)"
              fill="#a7f3d0"
              opacity="0.5"
            />

            <ellipse
              cx="57.5"
              cy="27"
              rx="7"
              ry="10"
              transform="rotate(8 57.5 27)"
              fill="url(#pl-anim-comp-grad)"
              filter="url(#pl-anim-glow)"
            />
            <ellipse
              cx="56"
              cy="24"
              rx="3"
              ry="5.5"
              transform="rotate(8 56 24)"
              fill="#a7f3d0"
              opacity="0.5"
            />

            <ellipse
              cx="72"
              cy="38"
              rx="6.5"
              ry="9"
              transform="rotate(24 72 38)"
              fill="url(#pl-anim-comp-grad)"
              filter="url(#pl-anim-glow)"
            />
            <ellipse
              cx="70.5"
              cy="35.5"
              rx="3"
              ry="5"
              transform="rotate(24 70.5 35.5)"
              fill="#a7f3d0"
              opacity="0.5"
            />

            {/* Central Upper Pad Crown */}
            <path
              d="M 37 47 C 37 43, 42 39, 50 39 C 58 39, 63 43, 63 47 C 63 53, 57 57, 50 59 C 43 57, 37 53, 37 47 Z"
              fill="url(#pl-anim-comp-grad)"
            />
            <ellipse cx="50" cy="44.5" rx="7" ry="2.5" fill="#a7f3d0" opacity="0.5" />

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
              stroke="url(#pl-anim-comp-grad)"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#pl-anim-glow)"
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
              stroke="url(#pl-anim-comp-accent)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Central Beacon Sparkle with Dynamic Pulse */}
            <circle
              cx="50"
              cy="62.5"
              r="3.5"
              fill="#ffffff"
              className={isHovered ? "animate-ping" : ""}
            />
          </svg>
        </div>
      </div>

      {/* Wordmark Typography & Pulse Status Banner */}
      {showWordmark && (
        <div className="mt-4 text-center">
          <div className={`font-black tracking-tight text-white ${current.text} flex items-center justify-center gap-1`}>
            <span>Paw</span>
            <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(45,212,191,0.5)]">
              Link
            </span>
          </div>

          {statusText && (
            <div className="mt-1.5 flex items-center justify-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className={`font-bold tracking-widest uppercase text-teal-300/90 ${current.badge}`}>
                {statusText}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
