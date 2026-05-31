'use client';

// ============================================================
// Agent Detail Page — Individual agent deep-dive
// ============================================================

import { use, useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import {
  Brain,
  LineChart,
  Megaphone,
  Target,
  Clock,
  CheckCircle2,
  Zap,
  Activity,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import Skeleton, { SkeletonCard, SkeletonMetric } from '@/components/ui/Skeleton';
import StatusBadge from '@/components/ui/StatusBadge';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import DecisionCard from '@/components/decisions/DecisionCard';
import { mockAgents, mockDecisions, mockActivity } from '@/lib/mock-data';
import { AGENT_COLORS, formatRelativeTime, CONTRACT_ADDRESSES } from '@/lib/constants';
import type { AgentRole } from '@/lib/types';

const roleIcons: Record<AgentRole, React.ReactNode> = {
  CEO: <Brain size={32} />,
  CFO: <LineChart size={32} />,
  CMO: <Megaphone size={32} />,
};

const roleDescriptions: Record<AgentRole, string> = {
  CEO: 'Strategic Orchestrator — Synthesizes CFO risk reports and CMO market signals to make autonomous treasury decisions via Somnia LLM Inference Agent.',
  CFO: 'Financial Risk Analyst — Fetches real-time price data via Somnia JSON API Agent and computes composite risk scores using LLM Inference.',
  CMO: 'Market Intelligence Sentinel — Scrapes DeFi news via Somnia LLM Parse Website Agent and classifies market sentiment as bullish/bearish/neutral.',
};

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role: roleParam } = use(params);
  const role = roleParam.toUpperCase() as AgentRole;
  const agent = mockAgents.find((a) => a.role === role);
  const colors = AGENT_COLORS[role] || AGENT_COLORS.CEO;
  const agentDecisions = mockDecisions.filter((d) => d.agentRole === role);
  const agentActivity = mockActivity.filter((a) => a.agentRole === role);
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected } = useAccount();

  // Use real contract address if wallet connected
  const roleAddressMap: Record<string, string> = {
    CEO: CONTRACT_ADDRESSES.ceoAgent,
    CFO: CONTRACT_ADDRESSES.cfoAgent,
    CMO: CONTRACT_ADDRESSES.cmoAgent,
  };
  const contractAddr = isConnected && roleAddressMap[role] 
    ? roleAddressMap[role] 
    : agent?.contractAddress || '';

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-[--color-muted]">Agent not found</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Back Link Skeleton */}
        <Skeleton width="120px" height="14px" />

        {/* Agent Header Skeleton */}
        <div className="glass rounded-2xl overflow-hidden">
          <Skeleton width="100%" height="6px" />
          <div className="p-8">
            <div className="flex items-start gap-6">
              <Skeleton width="80px" height="80px" className="rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton width="160px" height="28px" />
                  <Skeleton width="64px" height="22px" className="rounded-full" />
                </div>
                <Skeleton width="120px" height="14px" />
                <Skeleton width="80%" height="14px" />
              </div>
              <div className="flex-shrink-0 space-y-2">
                <Skeleton width="60px" height="12px" />
                <Skeleton width="140px" height="20px" className="rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonMetric key={i} />
          ))}
        </div>

        {/* Objective & Task Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Decisions & Activity Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <Skeleton width="160px" height="20px" className="mb-4" />
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div>
            <Skeleton width="140px" height="20px" className="mb-4" />
            <div className="glass rounded-2xl p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton width="8px" height="8px" className="rounded-full mt-1.5" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="80%" height="14px" />
                    <Skeleton width="60%" height="12px" />
                    <Skeleton width="40%" height="10px" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs 
        items={[
          { label: 'Agents', href: '/agents' },
          { label: `${role} Agent` }
        ]} 
      />

      {/* Agent Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl overflow-hidden"
        style={{
          borderColor: colors.border,
          boxShadow: `0 0 40px ${colors.glow}`,
        }}
      >
        <div className="h-1.5 w-full" style={{ background: colors.gradient }} />
        <div className="p-8">
          <div className="flex items-start gap-6">
            {/* Agent Icon */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: colors.bg,
                color: colors.primary,
                border: `2px solid ${colors.border}`,
              }}
            >
              {roleIcons[role]}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-[--color-foreground]">
                  {role} Agent
                </h1>
                <StatusBadge status={agent.status} size="md" />
              </div>
              <p className="text-sm text-[--color-muted-foreground] mb-1">
                {agent.name}
              </p>
              <p className="text-sm text-[--color-muted] leading-relaxed max-w-2xl">
                {roleDescriptions[role]}
              </p>
            </div>

            {/* Contract Address */}
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-[--color-muted] mb-1">Contract</p>
              <code className="text-xs font-mono text-[--color-agent-cmo-light] bg-white/[0.03] px-2 py-1 rounded">
                {contractAddr.slice(0, 10)}...{contractAddr.slice(-8)}
              </code>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Uptime',
            value: `${agent.uptime}%`,
            icon: <Activity size={18} />,
          },
          {
            label: 'Decisions Made',
            value: agent.decisionsCount.toString(),
            icon: <CheckCircle2 size={18} />,
          },
          {
            label: 'Success Rate',
            value: `${agent.successRate}%`,
            icon: <BarChart3 size={18} />,
          },
          {
            label: 'Avg Response',
            value: `${(agent.avgResponseTime / 1000).toFixed(1)}s`,
            icon: <Zap size={18} />,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <GlassCard padding="md" animate={false}>
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: colors.bg, color: colors.primary }}
                >
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs text-[--color-muted]">{stat.label}</p>
                  <p className="text-xl font-bold" style={{ color: colors.primary }}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Current Objective & Task */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agent.objective && (
          <GlassCard glow={role === 'CEO' ? 'blue' : role === 'CFO' ? 'violet' : 'cyan'}>
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} style={{ color: colors.primary }} />
              <h3 className="font-semibold text-[--color-foreground]">Current Objective</h3>
            </div>
            <p className="text-sm text-[--color-muted-foreground] leading-relaxed">
              {agent.objective}
            </p>
          </GlassCard>
        )}

        {agent.currentTask && (
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} style={{ color: colors.primary }} />
              <h3 className="font-semibold text-[--color-foreground]">Current Task</h3>
            </div>
            <p className="text-sm text-[--color-muted-foreground] leading-relaxed">
              {agent.currentTask}
            </p>
            {agent.lastActionTimestamp && (
              <p className="text-xs text-[--color-muted] mt-3">
                Started {formatRelativeTime(agent.lastActionTimestamp)}
              </p>
            )}
          </GlassCard>
        )}
      </div>

      {/* Decisions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Decision History */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-[--color-foreground] mb-4">
            Decision History
          </h3>
          {agentDecisions.length > 0 ? (
            <div className="space-y-3">
              {agentDecisions.map((decision, index) => (
                <DecisionCard
                  key={decision.id}
                  decision={decision}
                  delay={index * 0.08}
                />
              ))}
            </div>
          ) : (
            <GlassCard>
              <p className="text-sm text-[--color-muted] text-center py-8">
                No decisions yet for this agent
              </p>
            </GlassCard>
          )}
        </div>

        {/* Activity Feed */}
        <div>
          <h3 className="text-lg font-semibold text-[--color-foreground] mb-4">
            Recent Activity
          </h3>
          <GlassCard>
            <div className="space-y-4">
              {agentActivity.length > 0 ? (
                agentActivity.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: colors.primary }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[--color-foreground]">
                        {event.action}
                      </p>
                      <p className="text-xs text-[--color-muted-foreground] mt-0.5">
                        {event.description}
                      </p>
                      <p className="text-[10px] text-[--color-muted] mt-1">
                        {formatRelativeTime(event.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-[--color-muted] text-center py-4">
                  No activity yet
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
