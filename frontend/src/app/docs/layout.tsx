'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Particles from '@/components/ui/Particles';

const docsMenu = [
  { label: 'Getting Started', href: '/docs/getting-started' },
  { label: 'Wallet Setup & Faucet', href: '/docs/wallet-setup' },
  { label: 'Dashboard Guide', href: '/docs/dashboard' },
  { label: 'Autonomous Agents', href: '/docs/agents' },
  { label: 'Portfolio & Investments', href: '/docs/portfolio' },
  { label: 'Treasury Management', href: '/docs/treasury' },
  { label: 'On-Chain Decision Logs', href: '/docs/decisions' },
  { label: 'System Configuration', href: '/docs/settings' },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-on-surface)] flex flex-col selection:bg-[var(--color-primary)]/30 selection:text-white relative font-body-md overflow-x-hidden">
      
      {/* Interactive Plexus Particle Background (same as Landing) */}
      <Particles color="rgba(207, 188, 255, 0.15)" quantity={50} lineDistance={130} className="fixed inset-0 z-0 pointer-events-none" />

      {/* Docs Header */}
      <header className="sticky top-0 z-40 w-full bg-[#0f141b]/90 backdrop-blur-md border-b border-white/10 shadow-lg h-16 flex items-center justify-between px-4 md:px-12">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-display-lg text-[20px] tracking-tight flex items-center gap-2">
            <span className="text-white font-bold">Sovereign</span>
            <span className="text-white/50 font-light">Mind</span>
            <span className="text-[10px] font-label-caps uppercase bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 rounded border border-[var(--color-primary)]/30 ml-2">
              Docs
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/bagusardin25/SovereignMind"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:block text-[var(--color-on-surface)]/60 hover:text-white transition-colors"
            aria-label="GitHub Repository"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </Link>
          <Link
            href="/dashboard"
            className="hidden sm:flex items-center gap-1.5 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)] text-[var(--color-primary)] hover:text-[var(--color-on-primary)] font-label-caps text-[11px] tracking-wider uppercase px-4 py-2 rounded-lg border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)] transition-all duration-300 shadow-[0_0_15px_rgba(207,188,255,0.1)] hover:shadow-[0_0_25px_rgba(207,188,255,0.5)] whitespace-nowrap group"
          >
            <span className="font-extrabold flex items-center gap-1.5">
              Launch App
              <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
            </span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[var(--color-on-surface)]/60 hover:text-white transition-colors p-1"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Docs Body wrapper */}
      <div className="flex-1 flex max-w-[1400px] w-full mx-auto relative px-2 sm:px-4 md:px-8 z-10">
        
        {/* Desktop Left Navigation */}
        <aside className="hidden md:block w-64 shrink-0 py-10 pr-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-white/10 scrollbar-thin">
          <div className="mb-4 font-label-caps text-[11px] font-semibold tracking-wider text-[var(--color-on-surface)]/50 uppercase px-3">
            Guides & Reference
          </div>
          <nav className="space-y-1">
            {docsMenu.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] transition-all duration-200 ${
                    isActive
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold border-l-2 border-[var(--color-primary)] pl-4 shadow-[0_0_15px_rgba(207,188,255,0.05)]'
                      : 'text-[var(--color-on-surface)]/60 hover:text-white hover:bg-white/5 pl-3'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <ChevronRight size={14} className="text-[var(--color-primary)]" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 top-16 z-30 bg-[#0f141b]/80 backdrop-blur-sm md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />

              {/* Drawer Content */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="fixed left-0 top-16 bottom-0 w-72 z-35 bg-[var(--color-surface-container)] border-r border-white/10 p-6 overflow-y-auto md:hidden"
              >
                <div className="mb-4 font-label-caps text-[11px] font-semibold tracking-wider text-[var(--color-on-surface)]/50 uppercase px-1">
                  Guides & Reference
                </div>
                <nav className="space-y-1">
                  {docsMenu.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] transition-all duration-200 ${
                          isActive
                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold border-l-2 border-[var(--color-primary)] pl-4'
                            : 'text-[var(--color-on-surface)]/60 hover:text-white hover:bg-white/5 pl-3'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isActive && <ChevronRight size={14} className="text-[var(--color-primary)]" />}
                      </Link>
                    );
                  })}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Pane */}
        <main className="flex-1 min-w-0 py-6 sm:py-10 px-0 sm:px-6 md:px-12 lg:max-w-4xl">
          <div className="glass-dark bg-[var(--color-surface-container-low)]/80 backdrop-blur-2xl rounded-3xl p-4 sm:p-8 md:p-10 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="prose prose-invert max-w-none prose-slate prose-headings:font-display-lg prose-p:font-body-md prose-p:text-[var(--color-on-surface)]/80 prose-a:text-[var(--color-primary)] prose-a:no-underline hover:prose-a:underline">
              {children}
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}
