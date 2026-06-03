'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, BookOpen, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* Docs Header */}
      <header className="sticky top-0 z-40 w-full bg-[#070b12]/80 backdrop-blur-md border-b border-slate-800/80 h-16 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-display-lg text-[20px] tracking-tight flex items-center gap-2">
            <span className="text-white font-bold">Sovereign</span>
            <span className="text-slate-400 font-light">Mind</span>
            <span className="text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
              Docs
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/bagusardin25/SovereignMind"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="GitHub Repository"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs tracking-wider uppercase px-4 py-2 rounded-lg border border-purple-500/30 transition-all duration-300"
          >
            Launch App
            <ArrowUpRight size={14} />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-400 hover:text-white transition-colors p-1"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Docs Body wrapper */}
      <div className="flex-1 flex max-w-[1400px] w-full mx-auto relative px-4 md:px-8">
        
        {/* Desktop Left Navigation */}
        <aside className="hidden md:block w-64 shrink-0 py-10 pr-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-slate-800/60">
          <div className="mb-4 text-xs font-semibold tracking-wider text-slate-500 uppercase px-3">
            Guides & Reference
          </div>
          <nav className="space-y-1">
            {docsMenu.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-purple-500/10 text-purple-300 font-semibold border-l-2 border-purple-500 pl-4'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 pl-3'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <ChevronRight size={14} className="text-purple-400" />}
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
                className="fixed inset-0 top-16 z-30 bg-black/60 backdrop-blur-sm md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />

              {/* Drawer Content */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="fixed left-0 top-16 bottom-0 w-72 z-35 bg-[#0b0f17] border-r border-slate-800/80 p-6 overflow-y-auto md:hidden"
              >
                <div className="mb-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
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
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                          isActive
                            ? 'bg-purple-500/10 text-purple-300 font-semibold border-l-2 border-purple-500 pl-4'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 pl-3'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isActive && <ChevronRight size={14} className="text-purple-400" />}
                      </Link>
                    );
                  })}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Pane */}
        <main className="flex-1 min-w-0 py-10 px-2 sm:px-6 md:px-12 lg:max-w-4xl">
          <div className="prose prose-invert max-w-none prose-slate">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
