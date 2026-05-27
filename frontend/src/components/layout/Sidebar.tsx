'use client';

// ============================================================
// Sidebar — Main navigation sidebar
// ============================================================

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Bot,
  Landmark,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Agents', href: '/agents', icon: Bot },
  { label: 'Treasury', href: '/treasury', icon: Landmark },
  { label: 'Decisions', href: '/decisions', icon: ScrollText },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile breakpoint
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile Hamburger Button */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 w-10 h-10 rounded-xl glass border border-[--color-border] flex items-center justify-center text-[--color-muted-foreground] hover:text-[--color-foreground] transition-colors md:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Mobile Overlay Backdrop */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sidebar-overlay"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(isMobile ? mobileOpen : true) && (
          <motion.aside
            className={`fixed left-0 top-0 h-full z-50 flex flex-col glass bg-black/20 ${
              isMobile ? 'shadow-2xl' : ''
            }`}
            initial={isMobile ? { x: -280 } : false}
            animate={{
              x: 0,
              width: isMobile ? 260 : collapsed ? 72 : 240,
            }}
            exit={isMobile ? { x: -280 } : undefined}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 h-16">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[--color-agent-ceo] via-[--color-agent-cfo] to-[--color-agent-cmo] flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[--color-success] border-2 border-[--color-background]" />
              </div>
              <AnimatePresence>
                {(isMobile || !collapsed) && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden flex-1"
                  >
                    <h1 className="text-sm font-bold gradient-text-primary whitespace-nowrap">
                      SovereignMind
                    </h1>
                    <p className="text-[10px] text-[--color-muted] whitespace-nowrap">
                      Autonomous Venture Guild
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile close button */}
              {isMobile && (
                <button
                  onClick={() => setMobileOpen(false)}
                  className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-[--color-muted-foreground] hover:text-[--color-foreground] hover:bg-white/5 transition-colors"
                  aria-label="Close navigation"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'active bg-[--color-agent-ceo]/10 text-[--color-agent-ceo-light]'
                          : 'text-[--color-muted-foreground] hover:text-[--color-foreground] hover:bg-white/5'
                      }`}
                    >
                      <Icon size={20} className="flex-shrink-0" />
                      <AnimatePresence>
                        {(isMobile || !collapsed) && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            className="text-sm font-medium whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Collapse Toggle — Desktop only */}
            {!isMobile && (
              <div className="p-3">
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[--color-muted-foreground] hover:text-[--color-foreground] hover:bg-white/5 transition-colors"
                >
                  {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs whitespace-nowrap"
                      >
                        Collapse
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
