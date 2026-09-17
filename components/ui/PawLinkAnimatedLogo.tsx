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

          {/* Official Emblem Disc */}
          <div className="relative z-10 w-full h-full rounded-full bg-slate-950/80 p-1.5 backdrop-blur-md border border-teal-500/30 flex items-center justify-center shadow-2xl overflow-hidden">
            <img
              src="/logo-icon.png?v=2"
              alt="PawLink Official Emblem"
              className="w-full h-full object-contain drop-shadow-md select-none"
              loading="eager"
            />
          </div>
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

          <p className="text-[10px] text-teal-300/80 font-bold tracking-widest uppercase mt-0.5">
            Pets Always Find Their Way Home
          </p>

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
