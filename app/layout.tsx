import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PawLink — Smart Pet QR Recovery & Location Sharing",
  description: "Next-generation pet recovery infrastructure with instant QR scanning, WhatsApp scan alerts, and privacy-preserving location sharing.",
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
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
