import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ScreenAwakeToggle } from "@/components/ScreenAwakeToggle";

export const metadata: Metadata = {
  title: "Schede D&D",
  description: "Schede dei personaggi della compagnia",
};

export const viewport: Viewport = {
  themeColor: "#eee5ce",
  width: "device-width",
  initialScale: 1,
  // Blocca lo zoom su mobile (incluso l'auto-zoom di iOS entrando nei campi).
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="h-full antialiased">
      <body className="min-h-dvh text-ink">{children}<ScreenAwakeToggle /></body>
    </html>
  );
}
