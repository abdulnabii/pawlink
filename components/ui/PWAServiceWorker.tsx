"use client";

import { useEffect } from "react";

export default function PWAServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PawLink PWA] Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PawLink PWA] Service Worker registration failed:", err);
        });
    }
  }, []);

  return null;
}
