'use client';

// ============================================================
// SovereignMind — Live Stats Grid
// Hero-side stats card pulling from mock-data with subtle live
// shimmer to signal "this protocol is alive".
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Activity } from 'lucide-react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useTreasuryBalance } from '@/hooks/useTreasuryVault';
import { useTotalDecisions, useAgentCount } from '@/hooks/useAgentRegistry';
import { mockTreasury, mockDecisions, mockAgents, mockSystemHealth } from '@/lib/mock-data';
import { formatCompact, formatRelativeTime } from '@/lib/constants';

type Stat = {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  accent: 'primary' | 'tertiary' | 'cfo' | 'cmo';
};

const accentMap: Record<Stat['accent'], string> = {
  primary: 'var(--color-primary)',
  tertiary: 'var(--color-tertiary)',
  cfo: 'var(--color-agent-cfo)',
  cmo: 'var(--color-agent-cmo)',
};

export default function LiveStatsGrid() {
  // Wallet connection state
  const { isConnected } = useAccount();

  // On-chain data hooks
  const { data: onChainBalance } = useTreasuryBalance();
  const { data: onChainDecisions } = useTotalDecisions();
  const { data: onChainAgentCount } = useAgentCount();

  // Derive stats: use on-chain values when connected & available, mock otherwise.
  const stats = useMemo<Stat[]>(() => {
    // Treasury TVL — on-chain balance (native token in wei) or mock
    const tvl =
      isConnected && onChainBalance != null
        ? Number(formatEther(onChainBalance as bigint))
        : mockTreasury.totalValue;

    // Decision count — on-chain total or mock aggregate
    const decisions =
      isConnected && onChainDecisions != null
        ? Number(onChainDecisions as bigint)
        : mockDecisions.length + mockAgents.reduce((sum, a) => sum + a.decisionsCount, 0);

    // Agent count — on-chain or mock
    const agentCount =
      isConnected && onChainAgentCount != null
        ? Number(onChainAgentCount as bigint)
        : mockSystemHealth.totalAgents;

    const uptime =
      mockAgents.reduce((sum, a) => sum + a.uptime, 0) / Math.max(mockAgents.length, 1);
    const activeAgents =
      isConnected && onChainAgentCount != null
        ? `${agentCount}/${agentCount}`
        : `${mockSystemHealth.agentsOnline}/${mockSystemHealth.totalAgents}`;

    return [
      {
        label: 'Treasury TVL',
        value: `$${formatCompact(tvl)}`,
        delta: isConnected && onChainBalance != null ? 'on-chain' : `+${mockTreasury.change24h.toFixed(2)}%`,
        deltaPositive: true,
        accent: 'primary',
      },
      {
        label: 'Decisions',
        value: formatCompact(decisions),
        delta: 'on-chain',
        deltaPositive: true,
        accent: 'tertiary',
      },
      {
        label: 'Avg Uptime',
        value: `${uptime.toFixed(1)}%`,
        delta: 'BFT',
        deltaPositive: true,
        accent: 'cfo',
      },
      {
        label: 'Active Agents',
        value: activeAgents,
        delta: isConnected && onChainAgentCount != null ? 'on-chain' : 'live',
        deltaPositive: true,
        accent: 'cmo',
      },
    ];
  }, [isConnected, onChainBalance, onChainDecisions, onChainAgentCount]);

  // Pulsing "last decision" indicator — re-renders every 30s so the
  // relative time string ("12m ago") stays fresh while the page is open.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const lastDecision = mockDecisions[0];

  return (
    <div className="w-full max-w-[340px] flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
          </span>
          <span className="font-label-caps text-[10px] tracking-widest text-white/60 uppercase">
            Live On Somnia
          </span>
        </div>
        <Activity size={12} className="text-white/30" />
      </div>

      {/* Stats grid 2x2 */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass-dark rounded-xl p-3 hover:border-white/20 transition-colors"
          >
            <p className="font-label-caps text-[9px] tracking-widest text-white/40 uppercase mb-2">
              {stat.label}
            </p>
            <p
              className="font-display-lg text-[24px] leading-none text-white mb-1.5"
              style={{ textShadow: `0 0 18px ${accentMap[stat.accent]}40` }}
            >
              {stat.value}
            </p>
            {stat.delta && (
              <p
                className="font-label-caps text-[9px] tracking-wider uppercase"
                style={{
                  color: stat.deltaPositive ? '#34d399' : '#f87171',
                }}
              >
                {stat.deltaPositive ? '▲' : '▼'} {stat.delta}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Last decision strip */}
      {lastDecision && (
        <a
          href={lastDecision.receiptUrl ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-dark rounded-xl p-3 flex items-center gap-3 hover:border-[var(--color-primary)]/40 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center flex-shrink-0">
            <span className="font-label-caps text-[9px] tracking-widest text-[var(--color-primary)]">
              {lastDecision.agentRole}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-label-caps text-[9px] tracking-widest text-white/40 uppercase mb-0.5">
              Latest Receipt · {formatRelativeTime(lastDecision.timestamp)}
            </p>
            <p className="font-body-md text-[12px] text-white/80 truncate group-hover:text-white transition-colors">
              {lastDecision.title}
            </p>
          </div>
          <ArrowUpRight
            size={14}
            className="text-white/30 group-hover:text-[var(--color-primary)] transition-colors flex-shrink-0"
          />
        </a>
      )}
    </div>
  );
}
