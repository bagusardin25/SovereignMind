'use client';

// ============================================================
// AgentCard — Agent status card with role-specific styling
// ============================================================

import { motion } from 'framer-motion';
import { Bot, Brain, LineChart, Megaphone } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { AGENT_COLORS } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/constants';
import type { Agent, AgentRole } from '@/lib/types';

interface AgentCardProps {
  agent: Agent;
  delay?: number;
  compact?: boolean;
  onClick?: () => void;
}

const roleIcons: Record<AgentRole, React.ReactNode> = {
  CEO: <Brain size={24} />,
  CFO: <LineChart size={24} />,
  CMO: <Megaphone size={24} />,
};

const roleLabels: Record<AgentRole, string> = {
  CEO: 'Chief Executive Officer',
  CFO: 'Chief Financial Officer',
  CMO: 'Chief Marketing Officer',
};

export default function AgentCard({
  agent,
  delay = 0,
  compact = false,
  onClick,
}: AgentCardProps) {
  const colors = AGENT_COLORS[agent.role];
  const isProcessing = agent.status === 'processing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative glass rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      style={{
        borderColor: agent.status === 'active' || isProcessing ? colors.border : undefined,
        boxShadow:
          agent.status === 'active' || isProcessing
            ? `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow.replace('0.4', '0.1')}`
            : undefined,
      }}
      onClick={onClick}
    >
      {/* Top gradient line */}
      <div
        className="h-1 w-full"
        style={{ background: colors.gradient }}
      />

      <div className={compact ? 'p-4' : 'p-6'}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Agent Icon with glow */}
            <div className="relative">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: colors.bg,
                  color: colors.primary,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {roleIcons[agent.role]}
              </div>
              {isProcessing && (
                <div
                  className="absolute inset-0 rounded-xl animate-pulse-ring"
                  style={{
                    border: `2px solid ${colors.primary}`,
                    opacity: 0.3,
                  }}
                />
              )}
            </div>
            <div>
              <h3 className="font-bold text-[--color-foreground]">{agent.role} Agent</h3>
              <p className="text-xs text-[--color-muted-foreground]">{agent.name}</p>
            </div>
          </div>
          <StatusBadge status={agent.status} size="sm" />
        </div>

        {/* Current Task */}
        {agent.currentTask && !compact && (
          <div className="mb-4 p-3 rounded-xl bg-white/[0.02] border border-[--color-border]">
            <p className="text-xs text-[--color-muted] mb-1">Current Task</p>
            <p className="text-sm text-[--color-foreground] leading-relaxed line-clamp-2">
              {agent.currentTask}
            </p>
          </div>
        )}

        {/* Stats */}
        {!compact && (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-lg bg-white/[0.02]">
              <p className="text-lg font-bold" style={{ color: colors.primary }}>
                {agent.decisionsCount}
              </p>
              <p className="text-[10px] text-[--color-muted]">Decisions</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/[0.02]">
              <p className="text-lg font-bold" style={{ color: colors.primary }}>
                {agent.successRate}%
              </p>
              <p className="text-[10px] text-[--color-muted]">Success</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/[0.02]">
              <p className="text-lg font-bold" style={{ color: colors.primary }}>
                {(agent.avgResponseTime / 1000).toFixed(1)}s
              </p>
              <p className="text-[10px] text-[--color-muted]">Avg Time</p>
            </div>
          </div>
        )}

        {/* Last Action */}
        {agent.lastAction && (
          <div className="mt-4 flex items-center gap-2 text-xs text-[--color-muted-foreground]">
            <Bot size={12} />
            <span className="truncate">{agent.lastAction}</span>
            {agent.lastActionTimestamp && (
              <span className="flex-shrink-0 text-[--color-muted]">
                {formatRelativeTime(agent.lastActionTimestamp)}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
