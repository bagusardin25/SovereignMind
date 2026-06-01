'use client';

// ============================================================
// Dashboard — Main overview page
// ============================================================

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAgentData } from '@/hooks/useAgentData';
import { useDecisionData } from '@/hooks/useDecisionData';
import { useTreasuryData } from '@/hooks/useTreasuryData';
import { useOrchestrator } from '@/hooks/useOrchestrator';
import { motion } from 'framer-motion';
import {
  Wallet,
  Bot,
  ScrollText,
  ShieldCheck,
  ArrowRight,
  Clock,
  Play,
  Loader2,
} from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import GlassCard from '@/components/ui/GlassCard';
import AgentCard from '@/components/agents/AgentCard';
import AllocationChart from '@/components/treasury/AllocationChart';
import DecisionCard from '@/components/decisions/DecisionCard';
import { SkeletonCard, SkeletonMetric } from '@/components/ui/Skeleton';
import Skeleton from '@/components/ui/Skeleton';
import { AGENT_COLORS, formatRelativeTime } from '@/lib/constants';
import Link from 'next/link';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const { isConnected } = useAccount();

  // Composite on-chain data hooks
  const { agents, totalDecisions, systemHealth: health } = useAgentData();
  const { decisions } = useDecisionData(10);
  const { treasury } = useTreasuryData();

  // Live orchestrator backend (Express health API)
  const orchestrator = useOrchestrator();
  const orch = orchestrator.status;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-[--color-muted-foreground]">
            <span
              className={`w-2 h-2 rounded-full ${orchestrator.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}
            />
            <span>{orchestrator.isOnline ? 'Orchestrator live' : 'Orchestrator offline'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[--color-muted-foreground]">
            <Clock size={14} />
            <span>Last cycle: {health.lastCycleTimestamp > 0 ? formatRelativeTime(Math.min(health.lastCycleTimestamp, now)) : 'Never'}</span>
          </div>
          <button
            onClick={() => orchestrator.trigger.mutate()}
            disabled={!orchestrator.isOnline || orchestrator.trigger.isPending || orch?.isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[--color-agent-ceo]/15 text-[--color-agent-ceo] border border-[--color-agent-ceo]/30 hover:bg-[--color-agent-ceo]/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {orchestrator.trigger.isPending || orch?.isRunning ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            {orch?.isRunning ? 'Running…' : 'Run Cycle'}
          </button>
        </div>
      </div>

      {/* ── Row 1: Key Metrics ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Treasury Value"
          value={`${treasury.totalValue.toFixed(4)} STT`}
          change={treasury.change24h || undefined}
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
          {agents.map((agent, index) => (
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
            {decisions.length > 0 ? decisions.slice(0, 4).map((decision, index) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                delay={index * 0.08}
              />
            )) : (
              <GlassCard>
                <div className="text-center py-6 text-[--color-muted-foreground] text-sm">
                  No decisions yet. Trigger a decision cycle to see live data.
                </div>
              </GlassCard>
            )}
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
              holdings={treasury.holdings}
              totalValue={treasury.totalValue}
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
              {decisions.length > 0 ? decisions.slice(0, 8).map((decision, index) => {
                const colors = AGENT_COLORS[decision.agentRole];
                return (
                  <motion.div
                    key={decision.id}
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
                        {decision.agentRole}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[--color-foreground]">
                          {decision.title}
                        </span>
                        <span className="text-xs text-[--color-muted]">
                          {new Date(decision.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-[--color-muted-foreground] mt-0.5">
                        {decision.rationale.length > 100 ? `${decision.rationale.slice(0, 100)}...` : decision.rationale}
                      </p>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="text-center py-8 text-[--color-muted-foreground] text-sm">
                  No activity yet. Connect wallet and trigger a decision cycle to see live data.
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
