'use client';

// ============================================================
// Header — Top navigation bar with wallet connect
// ============================================================

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Activity, Bell } from 'lucide-react';
import { mockSystemHealth, mockActivity } from '@/lib/mock-data';
import NotificationPanel from '@/components/ui/NotificationPanel';
import { ToastContainer } from '@/components/ui/Toast';

export default function Header() {
  const health = mockSystemHealth;
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const unreadCount = mockActivity.length;

  return (
    <>
      <header className="sticky top-0 z-30 h-16 glass border-b border-[--color-border] flex items-center justify-between px-6">
        {/* Left: Network Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[--color-success]/10 border border-[--color-success]/20">
            <span className="w-2 h-2 rounded-full bg-[--color-success] status-dot-active" style={{ color: 'var(--color-success)' }} />
            <span className="text-xs font-medium text-[--color-success]">Somnia Testnet</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-[--color-muted-foreground]">
            <Activity size={14} />
            <span>Latency: {health.networkLatency}ms</span>
          </div>
        </div>

        {/* Right: Notifications + Wallet */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className="relative p-2 rounded-xl text-[--color-muted-foreground] hover:text-[--color-foreground] hover:bg-white/5 transition-colors"
            >
              <Bell size={22} className="transition-transform active:scale-95" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white px-1 ring-2 ring-[#0a0e1a]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationPanel
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
            />
          </div>

          {/* Wallet Connect */}
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
        </div>
      </header>

      {/* Toast Container — renders fixed in bottom-right */}
      <ToastContainer />
    </>
  );
}
