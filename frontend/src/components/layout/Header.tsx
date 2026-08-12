'use client';

// ============================================================
// Header — Top navigation bar with wallet connect
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import { Activity, Bell } from 'lucide-react';
import { useAgentCount } from '@/hooks/useAgentRegistry';
import { useCEORecentDecisions } from '@/hooks/useCEOAgent';
import type { ActivityEvent, AgentRole } from '@/lib/types';
import NotificationPanel from '@/components/ui/NotificationPanel';
import { ToastContainer } from '@/components/ui/Toast';
import { flareTestnet, somniaTestnet } from '@/lib/wagmi-config';

// Map on-chain CEO decisions to ActivityEvent[]
function decisionsToEvents(decisions: unknown): ActivityEvent[] {
  if (!decisions || !Array.isArray(decisions)) return [];

  const actionLabels: Record<number, string> = {
    0: 'HOLD Decision',
    1: 'Rebalance Executed',
    2: 'Allocation Adjusted',
  };

  return decisions.map((d, i) => ({
    id: `ceo-${d.id?.toString() ?? i}`,
    agentRole: 'CEO' as AgentRole,
    action: actionLabels[Number(d.action)] ?? `Decision #${d.id?.toString() ?? i}`,
    description: d.rationale || 'Executive decision recorded on-chain.',
    timestamp: d.timestamp ? Number(d.timestamp) * 1000 : 0,
  }));
}

export default function Header() {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const activeChain = chainId === flareTestnet.id ? flareTestnet : somniaTestnet;
  const { data: onChainAgentCount } = useAgentCount();
  const { data: rawDecisions } = useCEORecentDecisions(BigInt(10));

  // Derive notification events from real on-chain decisions
  const events = useMemo(() => decisionsToEvents(rawDecisions), [rawDecisions]);
  const unreadCount = events.length;

  // Approximate network latency via RPC ping
  const [latency, setLatency] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function ping() {
      try {
        const start = performance.now();
        await fetch(activeChain.rpcUrls.default.http[0], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'net_version', params: [] }),
        });
        if (!cancelled) setLatency(Math.round(performance.now() - start));
      } catch {
        if (!cancelled) setLatency(null);
      }
    }
    ping();
    const interval = setInterval(ping, 30_000); // refresh every 30s
    return () => { cancelled = true; clearInterval(interval); };
  }, [activeChain.rpcUrls.default.http]);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 glass bg-black/20 shadow-md flex items-center justify-between px-4 md:px-6">
        {/* Left: Network Status */}
        <div className="flex items-center gap-3 pl-12 md:pl-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors cursor-default">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <span className="text-xs font-medium text-white/90 hidden sm:inline">{activeChain.name}</span>
            <span className="text-xs font-medium text-white/90 sm:hidden">
              {activeChain.id === flareTestnet.id ? 'Coston2' : 'Somnia'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-medium text-white/70">
              <Activity size={14} className="text-[--color-agent-ceo]" />
              <span>{latency != null ? `${latency}ms` : '—'}</span>
            </div>
            
            {isConnected && onChainAgentCount != null && (
              <>
                <div className="w-[1px] h-3 bg-white/20" />
                <div className="flex items-center gap-1.5 text-xs font-medium text-white/70">
                  <span className="text-[10px] uppercase tracking-wider text-[--color-muted-foreground]">Agents</span>
                  <span className="text-white/90">{Number(onChainAgentCount as bigint)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Notifications + Wallet */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              id="notification-bell-btn"
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className="relative p-2 rounded-xl text-[--color-muted-foreground] hover:text-[--color-foreground] hover:bg-white/5 transition-colors"
            >
              <Bell size={22} className="transition-transform active:scale-95 pointer-events-none" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white px-1 ring-2 ring-[#0a0e1a] pointer-events-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationPanel
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              events={events}
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
                          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-sm"
                          type="button"
                        >
                          {chain.hasIcon && (
                            <div className="w-5 h-5 overflow-hidden rounded-full bg-black/20 flex-shrink-0 border border-white/10">
                              {chain.iconUrl && (
                                <img
                                  alt={chain.name ?? 'Chain icon'}
                                  src={chain.iconUrl}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          )}
                          <span className="text-xs font-bold text-white/90 tracking-wide">
                            {chain.name}
                          </span>
                        </button>

                        <button 
                          onClick={openAccountModal} 
                          type="button"
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-sm"
                        >
                          <span className="text-sm font-bold text-white tracking-wide">
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
