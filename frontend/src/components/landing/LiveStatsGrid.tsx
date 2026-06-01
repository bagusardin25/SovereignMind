'use client';

// ============================================================
// SovereignMind — Live Stats Grid
// Hero-side stats card pulling from live contract hooks with subtle
// shimmer to signal "this protocol is alive".
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Activity } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAgentData } from '@/hooks/useAgentData';
import { useDecisionData } from '@/hooks/useDecisionData';
import { useTreasuryData } from '@/hooks/useTreasuryData';
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

  // Composite on-chain data hooks
  const { agents, totalDecisions, agentCount, systemHealth } = useAgentData();
  const { decisions } = useDecisionData(5);
  const { treasury } = useTreasuryData();

  // Derive stats from on-chain data
  const stats = useMemo<Stat[]>(() => {
    const tvl = treasury.totalValue;
    const uptime = agents.length > 0
      ? agents.reduce((sum, a) => sum + a.uptime, 0) / agents.length
      : 99.9;

    return [
      {
        label: 'Treasury TVL',
        value: tvl > 0 ? `${tvl.toFixed(2)} STT` : '0 STT',
        delta: 'on-chain',
        deltaPositive: true,
        accent: 'primary',
      },
      {
        label: 'Decisions',
        value: formatCompact(totalDecisions),
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
        value: `${systemHealth.agentsOnline}/${systemHealth.totalAgents}`,
        delta: 'on-chain',
        deltaPositive: true,
        accent: 'cmo',
      },
    ];
  }, [treasury, agents, totalDecisions, systemHealth]);

  // Pulsing "last decision" indicator — re-renders every 30s so the
  // relative time string ("12m ago") stays fresh while the page is open.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const lastDecision = decisions.length > 0 ? decisions[0] : null;

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
