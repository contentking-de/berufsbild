import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import PerfMeasureGuard from "@/components/PerfMeasureGuard";
import CookieConsent from "@/components/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "berufsbild.com – Berufe A–Z & Magazin",
    template: "%s | berufsbild.com",
  },
  description:
    "Über 18.000 Berufsbilder – modern präsentiert. A–Z Übersicht, Detailprofile und Magazin.",
  metadataBase: new URL("https://www.berufsbild.com"),
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-zinc-900`}>
        <PerfMeasureGuard />
        <Header />
        <main>{children}</main>
        <CookieConsent />
        <Footer />
      </body>
    </html>
  );
}
