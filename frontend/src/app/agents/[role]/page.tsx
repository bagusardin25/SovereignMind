'use client';

// ============================================================
// Agent Detail Page — Individual agent deep-dive
// ============================================================

import { use } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
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
import StatusBadge from '@/components/ui/StatusBadge';
import DecisionCard from '@/components/decisions/DecisionCard';
import { mockAgents, mockDecisions, mockActivity } from '@/lib/mock-data';
import { AGENT_COLORS, formatRelativeTime } from '@/lib/constants';
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

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-[--color-muted]">Agent not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/agents"
        className="inline-flex items-center gap-2 text-sm text-[--color-muted-foreground] hover:text-[--color-foreground] transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Agents
      </Link>

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
                {agent.contractAddress.slice(0, 10)}...{agent.contractAddress.slice(-8)}
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
