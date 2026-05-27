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
      <header className="sticky top-0 z-30 h-16 glass bg-black/20 shadow-md flex items-center justify-between px-6">
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
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== 'loading';
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === 'authenticated');

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    style: {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button 
                          onClick={openConnectModal} 
                          type="button"
                          className="px-4 py-2 rounded-xl font-bold text-sm bg-[--color-primary] text-[--color-on-primary] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                        >
                          Connect Wallet
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button 
                          onClick={openChainModal} 
                          type="button"
                          className="px-4 py-2 rounded-xl font-bold text-sm bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)] hover:bg-rose-500/30 transition-all duration-300"
                        >
                          Wrong Network
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={openChainModal}
                          className="hidden sm:flex items-center justify-center p-2 rounded-xl glass border border-white/10 hover:bg-white/5 transition-all duration-300"
                          type="button"
                        >
                          {chain.hasIcon && (
                            <div className="w-5 h-5 overflow-hidden rounded-full">
                              {chain.iconUrl && (
                                <img
                                  alt={chain.name ?? 'Chain icon'}
                                  src={chain.iconUrl}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          )}
                        </button>

                        <button 
                          onClick={openAccountModal} 
                          type="button"
                          className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 hover:border-[--color-primary]/50 hover:bg-white/5 transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.2)]"
                        >
                          <span className="text-sm font-medium gradient-text-primary">
                            {account.displayName}
                          </span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </header>

      {/* Toast Container — renders fixed in bottom-right */}
      <ToastContainer />
    </>
  );
}
