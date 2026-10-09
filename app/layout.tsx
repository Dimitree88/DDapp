import type { Metadata, Viewport } from "next";
import { Cinzel, EB_Garamond, Open_Sans } from "next/font/google";
import "./globals.css";

// Font del design system Edamasca: titoli, corpo del testo, statistiche.
const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-cinzel", display: "swap" });
const garamond = EB_Garamond({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-garamond", display: "swap" });
const openSans = Open_Sans({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-open-sans", display: "swap" });

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
    <html
      lang="it"
      className={`${cinzel.variable} ${garamond.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-dvh text-ink">{children}</body>
    </html>
  );
}
