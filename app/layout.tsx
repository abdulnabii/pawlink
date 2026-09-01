import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230d9488'><path d='M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4zm-6.5 6A3.5 3.5 0 0 0 2 11.5v1A3.5 3.5 0 0 0 5.5 16 3.5 3.5 0 0 0 9 12.5v-1A3.5 3.5 0 0 0 5.5 8zm13 0A3.5 3.5 0 0 0 15 11.5v1a3.5 3.5 0 0 0 3.5 3.5 3.5 3.5 0 0 0 3.5-3.5v-1A3.5 3.5 0 0 0 18.5 8zM12 11a6 6 0 0 0-6 6c0 2.5 2.5 5 6 5s6-2.5 6-5a6 6 0 0 0-6-6z'/></svg>",
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
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-teal-500 selection:text-white"
      >
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
