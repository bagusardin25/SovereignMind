'use client';

// ============================================================
// Header — Top navigation bar with wallet connect
// ============================================================

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Activity, Bell } from 'lucide-react';
import { mockSystemHealth } from '@/lib/mock-data';

export default function Header() {
  const health = mockSystemHealth;

  return (
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
        <button className="relative p-2 rounded-xl text-[--color-muted-foreground] hover:text-[--color-foreground] hover:bg-white/5 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[--color-agent-ceo]" />
        </button>

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
  );
}
