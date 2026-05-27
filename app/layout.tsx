import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const jenevers = localFont({
  src: [
    {
      path: "../fonts/TT Jenevers Regular-5632637.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/TT Jenevers Medium Italic-5632643.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../fonts/TT Jenevers Bold-5632645.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/TT Jenevers Bold Italic-5632647.otf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-jenevers",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Schede D&D",
  description: "Schede dei personaggi della compagnia",
};

export const viewport: Viewport = {
  themeColor: "#ece3d0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${jenevers.variable} h-full antialiased`}
    >
      <body className="min-h-dvh text-ink">{children}</body>
    </html>
  );
}
