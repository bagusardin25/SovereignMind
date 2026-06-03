import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Anybody, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Web3Provider from "@/providers/Web3Provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const anybody = Anybody({
  variable: "--font-anybody",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SovereignMind — Autonomous On-Chain Agent Platform",
  description:
    "SovereignMind deploys a collaborative network of autonomous AI agents as a virtual executive suite on Somnia Agentic L1 — with on-chain verified treasury decisions, transparent execution receipts, and consensus verification.",
  keywords: [
    "SovereignMind",
    "Somnia",
    "AI Agents",
    "On-Chain",
    "DeFi",
    "Treasury",
    "Autonomous",
    "Blockchain",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${anybody.variable} ${plusJakartaSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full bg-[var(--color-background)] text-on-surface font-body-md">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
