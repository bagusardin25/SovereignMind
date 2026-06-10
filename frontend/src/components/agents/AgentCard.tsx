'use client';

// ============================================================
// AgentCard — Agent status card with role-specific styling
// ============================================================

import { motion } from 'framer-motion';
import { Bot, Brain, LineChart, Megaphone, Power } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { AGENT_COLORS } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/constants';
import type { Agent, AgentRole } from '@/lib/types';

interface AgentCardProps {
  agent: Agent;
  delay?: number;
  compact?: boolean;
  onClick?: () => void;
  isPaused?: boolean;
  isToggling?: boolean;
  onToggle?: () => void;
}

const roleIcons: Record<AgentRole, React.ReactNode> = {
  CEO: <Brain size={24} />,
  CFO: <LineChart size={24} />,
  CMO: <Megaphone size={24} />,
};

export default function AgentCard({
  agent,
  delay = 0,
  compact = false,
  onClick,
  isPaused = false,
  isToggling = false,
  onToggle,
}: AgentCardProps) {
  const colors = AGENT_COLORS[agent.role];
  const isProcessing = agent.status === 'processing';
  const dimmed = isPaused;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: dimmed ? 0.5 : 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative glass rounded-2xl overflow-hidden transition-all duration-300 ${
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
      {...(onClick ? {
        role: 'button' as const,
        tabIndex: 0,
        'aria-label': `${agent.role} Agent: ${agent.name}. Status: ${agent.status}`,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        },
      } : {})}
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
          <div className="flex items-center gap-2">
            {isPaused && (
              <span className="px-2 py-0.5 rounded-lg bg-[--color-warning]/10 border border-[--color-warning]/30 text-[--color-warning] text-[10px] font-bold">
                PAUSED
              </span>
            )}
            <StatusBadge status={isPaused ? 'idle' : agent.status} size="sm" />
            {onToggle && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                disabled={isToggling}
                className={`p-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isPaused
                    ? 'bg-[--color-success]/10 text-[--color-success] hover:bg-[--color-success]/20'
                    : 'bg-[--color-error]/10 text-[--color-error] hover:bg-[--color-error]/20'
                }`}
                title={isPaused ? `Enable ${agent.role} Agent` : `Pause ${agent.role} Agent`}
              >
                {isToggling ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Power size={14} />
                  </motion.div>
                ) : (
                  <Power size={14} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Current Task */}
        {agent.currentTask && !compact && (
          <div className="mb-4 p-3 rounded-xl bg-black/40 border border-white/5 relative overflow-hidden group">
            {isProcessing && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: `linear-gradient(to right, transparent, ${colors.primary}20, transparent)` }} />
            )}
            <p className="text-[10px] text-[--color-muted] mb-1 font-mono uppercase tracking-wider flex items-center gap-2">
              Current Operation
              {isProcessing && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" style={{ color: colors.primary }} />}
            </p>
            <p className="text-sm leading-relaxed line-clamp-2 font-mono mt-1" style={{ color: isProcessing ? colors.secondary : 'var(--color-foreground)' }}>
              {agent.currentTask}
              {isProcessing && <span className="inline-block w-1.5 h-3.5 ml-1 align-middle bg-current animate-pulse" />}
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
