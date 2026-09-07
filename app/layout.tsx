import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PWAInstallBanner from "@/components/ui/PWAInstallBanner";
import PWAServiceWorker from "@/components/ui/PWAServiceWorker";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://pawlink-chi.vercel.app"
  ),
  title: {
    default: "PawLink — Smart Pet QR Recovery & Location Sharing",
    template: "%s | PawLink",
  },
  description:
    "Next-generation pet recovery infrastructure with instant QR scanning, WhatsApp scan alerts, and privacy-preserving location sharing.",
  keywords: [
    "pet recovery",
    "QR pet tag",
    "lost dog finder",
    "lost cat finder",
    "pet microchip QR",
    "WhatsApp pet alert",
    "PawLink",
  ],
  authors: [{ name: "PawLink Team", url: "https://pawlink-chi.vercel.app" }],
  creator: "PawLink",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pawlink-chi.vercel.app",
    siteName: "PawLink",
    title: "PawLink — Smart Pet QR Recovery & Location Sharing",
    description:
      "Instant QR collar tag scanning, WhatsApp emergency scan alerts, and zero-auth finder coordination.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PawLink — Smart Pet QR Recovery & Location Sharing",
    description:
      "Instant QR collar tag scanning, WhatsApp emergency scan alerts, and zero-auth finder coordination.",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
        <meta name="theme-color" content="#0d9488" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PawLink" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-teal-500 selection:text-white"
      >
        <ErrorBoundary>{children}</ErrorBoundary>
        <PWAInstallBanner />
        <PWAServiceWorker />
      </body>
    </html>
  );
}
