import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Web3Provider from "@/providers/Web3Provider";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

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
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 ml-0 md:ml-[240px] flex flex-col overflow-hidden transition-all duration-300">
              <Header />
              <main className="flex-1 overflow-y-auto bg-grid-pattern">
                {/* Decorative orbs */}
                <div className="fixed top-20 right-20 w-96 h-96 rounded-full bg-[--color-agent-ceo]/5 blur-[120px] animate-float pointer-events-none" />
                <div className="fixed bottom-20 left-80 w-80 h-80 rounded-full bg-[--color-agent-cfo]/5 blur-[100px] animate-float-delayed pointer-events-none" />

                <div className="relative z-10 p-6 max-w-[1400px] mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
