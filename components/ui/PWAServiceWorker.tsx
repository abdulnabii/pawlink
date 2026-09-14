"use client";

import { useEffect } from "react";

export default function PWAServiceWorker() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check for fresh version immediately
          reg.update();

          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed") {
                  if (navigator.serviceWorker.controller) {
                    // New update available, reload to apply
                    window.location.reload();
                  }
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn("[PawLink PWA] Service Worker registration failed:", err);
        });
    }
  }, []);

  return null;
}
