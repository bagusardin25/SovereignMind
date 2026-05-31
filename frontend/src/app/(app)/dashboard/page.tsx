'use client';

// ============================================================
// Dashboard — Main overview page
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useAgentCount, useTotalDecisions } from '@/hooks/useAgentRegistry';
import { useTreasuryBalance } from '@/hooks/useTreasuryVault';
import { useCFORiskScore } from '@/hooks/useCFOAgent';
import { useCMOAggregatedSentiment } from '@/hooks/useCMOAgent';
import { motion } from 'framer-motion';
import {
  Wallet,
  Bot,
  ScrollText,
  ShieldCheck,
  ArrowRight,
  Clock,
} from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import GlassCard from '@/components/ui/GlassCard';
import AgentCard from '@/components/agents/AgentCard';
import AllocationChart from '@/components/treasury/AllocationChart';
import DecisionCard from '@/components/decisions/DecisionCard';
import { SkeletonCard, SkeletonMetric } from '@/components/ui/Skeleton';
import Skeleton from '@/components/ui/Skeleton';
import {
  mockAgents,
  mockTreasury,
  mockDecisions,
  mockActivity,
  mockSystemHealth,
} from '@/lib/mock-data';
import { formatUSD, AGENT_COLORS } from '@/lib/constants';
import Link from 'next/link';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  // On-chain data hooks
  const { isConnected } = useAccount();
  const { data: onChainAgentCount } = useAgentCount();
  const { data: onChainTotalDecisions } = useTotalDecisions();
  const { data: onChainBalance } = useTreasuryBalance();
  const { data: onChainRiskScore } = useCFORiskScore();
  const { data: onChainSentiment } = useCMOAggregatedSentiment();

  // Hybrid data: merge on-chain with mock fallback
  const health = useMemo(() => {
    if (!isConnected) return mockSystemHealth;
    return {
      ...mockSystemHealth,
      agentsOnline: onChainAgentCount ? Number(onChainAgentCount) : mockSystemHealth.agentsOnline,
    };
  }, [isConnected, onChainAgentCount]);

  const treasuryValue = useMemo(() => {
    if (isConnected && onChainBalance) {
      return parseFloat(formatEther(onChainBalance as bigint));
    }
    return mockTreasury.totalValue;
  }, [isConnected, onChainBalance]);

  const totalDecisions = useMemo(() => {
    if (isConnected && onChainTotalDecisions) {
      return Number(onChainTotalDecisions);
    }
    return mockDecisions.filter(d => Date.now() - d.timestamp < 86400000).length;
  }, [isConnected, onChainTotalDecisions]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Page Title Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton width="160px" height="28px" className="mb-2" />
            <Skeleton width="300px" height="14px" />
          </div>
          <Skeleton width="140px" height="14px" />
        </div>

        {/* Metrics Row Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonMetric key={i} />
          ))}
        </div>

        {/* Agent Status Skeleton */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Skeleton width="140px" height="20px" />
            <Skeleton width="80px" height="14px" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>

        {/* Decisions + Treasury Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <Skeleton width="160px" height="20px" />
              <Skeleton width="80px" height="14px" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <Skeleton width="160px" height="20px" />
              <Skeleton width="60px" height="14px" />
            </div>
            <div className="glass rounded-2xl p-6 flex flex-col items-center gap-4">
              <Skeleton width="200px" height="200px" className="rounded-full" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} width="100%" height="14px" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text-primary">Dashboard</h1>
          <p className="text-sm text-[--color-muted-foreground] mt-1">
            Real-time overview of your autonomous agent guild
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[--color-muted-foreground]">
          <Clock size={14} />
          <span>Last cycle: {Math.round((Date.now() - health.lastCycleTimestamp) / 60000)}m ago</span>
        </div>
      </div>

      {/* ── Row 1: Key Metrics ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Treasury Value"
          value={isConnected && onChainBalance ? `${treasuryValue.toFixed(4)} STT` : formatUSD(mockTreasury.totalValue)}
          change={isConnected ? undefined : mockTreasury.change24h}
          icon={<Wallet size={22} />}
          accentColor="#cfbcff"
          delay={0}
        />
        <MetricCard
          label="Active Agents"
          value={`${health.agentsOnline}/${health.totalAgents}`}
          icon={<Bot size={22} />}
          accentColor="#3b82f6"
          delay={0.1}
        />
        <MetricCard
          label="Total Decisions"
          value={totalDecisions.toString()}
          icon={<ScrollText size={22} />}
          accentColor="#8b5cf6"
          delay={0.2}
        />
        <MetricCard
          label="System Health"
          value={health.status.charAt(0).toUpperCase() + health.status.slice(1)}
          icon={<ShieldCheck size={22} />}
          accentColor="#10b981"
          delay={0.3}
        />
      </div>

      {/* ── Row 2: Agent Status Panel ─────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[--color-foreground]">Agent Status</h2>
          <Link
            href="/agents"
            className="flex items-center gap-1 text-sm text-[--color-agent-ceo] hover:text-[--color-agent-ceo-light] transition-colors"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockAgents.map((agent, index) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>

      {/* ── Row 3: Decisions + Treasury ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Decisions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[--color-foreground]">Recent Decisions</h2>
            <Link
              href="/decisions"
              className="flex items-center gap-1 text-sm text-[--color-agent-ceo] hover:text-[--color-agent-ceo-light] transition-colors"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {mockDecisions.slice(0, 4).map((decision, index) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                delay={index * 0.08}
              />
            ))}
          </div>
        </div>

        {/* Treasury Allocation */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[--color-foreground]">Treasury Allocation</h2>
            <Link
              href="/treasury"
              className="flex items-center gap-1 text-sm text-[--color-agent-ceo] hover:text-[--color-agent-ceo-light] transition-colors"
            >
              Details <ArrowRight size={14} />
            </Link>
          </div>
          <GlassCard>
            <AllocationChart
              holdings={mockTreasury.holdings}
              totalValue={mockTreasury.totalValue}
              size={200}
            />
          </GlassCard>
        </div>
      </div>

      {/* ── Row 4: Activity Timeline ──────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-[--color-foreground] mb-4">Activity Timeline</h2>
        <GlassCard padding="lg">
          <div className="relative">
            {/* Vertical line with glow */}
            <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[var(--color-primary)]/60 via-[var(--color-agent-cfo)]/30 to-transparent shadow-[0_0_10px_var(--color-primary)]" />

            <div className="space-y-1">
              {mockActivity.slice(0, 8).map((event, index) => {
                const colors = AGENT_COLORS[event.agentRole];
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-start gap-4 py-3 group"
                  >
                    {/* Dot */}
                    <div className="relative z-10 flex-shrink-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/20 backdrop-blur-md transition-all duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: `${colors.primary}20`,
                          color: colors.primary,
                          boxShadow: `0 0 15px ${colors.glow}`,
                          borderColor: colors.primary,
                        }}
                      >
                        {event.agentRole}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[--color-foreground]">
                          {event.action}
                        </span>
                        <span className="text-xs text-[--color-muted]">
                          {new Date(event.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-[--color-muted-foreground] mt-0.5">
                        {event.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
