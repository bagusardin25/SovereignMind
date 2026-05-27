import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "SovereignMind — Autonomous On-Chain Agent Platform",
  description:
    "SovereignMind deploys a collaborative network of autonomous AI agents as a virtual executive suite on Somnia L1, managing treasury operations with full transparency and on-chain consensus verification.",
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0a0e1a] text-[#e2e8f0]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
