'use client';

// ============================================================
// DecisionCard — Individual decision display
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  LineChart,
  Megaphone,
} from 'lucide-react';
import type { Decision, AgentRole } from '@/lib/types';
import { AGENT_COLORS, formatRelativeTime, SOMNIA_TESTNET } from '@/lib/constants';

interface DecisionCardProps {
  decision: Decision;
  delay?: number;
}

const outcomeConfig = {
  executed: { icon: CheckCircle2, color: '#10b981', label: 'Executed' },
  pending: { icon: Clock, color: '#f59e0b', label: 'Pending' },
  rejected: { icon: XCircle, color: '#ef4444', label: 'Rejected' },
  failed: { icon: AlertCircle, color: '#ef4444', label: 'Failed' },
};

const signalConfig = {
  bullish: { icon: TrendingUp, color: '#10b981', label: 'Bullish' },
  bearish: { icon: TrendingDown, color: '#ef4444', label: 'Bearish' },
  neutral: { icon: Minus, color: '#6b7280', label: 'Neutral' },
};

const roleIcons: Record<AgentRole, React.ReactNode> = {
  CEO: <Brain size={16} />,
  CFO: <LineChart size={16} />,
  CMO: <Megaphone size={16} />,
};

export default function DecisionCard({ decision, delay = 0 }: DecisionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = AGENT_COLORS[decision.agentRole];
  const outcome = outcomeConfig[decision.outcome];
  const OutcomeIcon = outcome.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="glass rounded-xl overflow-hidden hover:border-[--color-border-hover] transition-all duration-200"
      style={{ borderLeft: `3px solid ${colors.primary}` }}
    >
      {/* Main Content */}
      <div
        className="p-5 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${decision.agentRole} decision: ${decision.title}. ${outcome.label}. Confidence ${decision.confidenceScore}%`}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.bg, color: colors.primary }}
              >
                {roleIcons[decision.agentRole]}
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: colors.bg,
                  color: colors.primary,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {decision.agentRole}
              </span>
              <span className="text-xs text-[--color-muted] capitalize px-2 py-0.5 rounded-full bg-white/5">
                {decision.type.replace('_', ' ')}
              </span>
              {decision.marketSignal && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{
                    backgroundColor: `${signalConfig[decision.marketSignal].color}15`,
                    color: signalConfig[decision.marketSignal].color,
                  }}
                >
                  {(() => {
                    const SignalIcon = signalConfig[decision.marketSignal].icon;
                    return <SignalIcon size={12} />;
                  })()}
                  {signalConfig[decision.marketSignal].label}
                </span>
              )}
              <span className="text-xs text-[--color-muted] ml-auto flex-shrink-0">
                {formatRelativeTime(decision.timestamp)}
              </span>
            </div>

            {/* Title */}
            <h4 className="text-sm font-semibold text-[--color-foreground] mb-1.5">
              {decision.title}
            </h4>

            {/* Action */}
            <p className="text-xs text-[--color-muted-foreground] line-clamp-1">
              {decision.action}
            </p>
          </div>

          {/* Right side */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Outcome Badge */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: `${outcome.color}15`,
                border: `1px solid ${outcome.color}30`,
              }}
            >
              <OutcomeIcon size={12} style={{ color: outcome.color }} />
              <span className="text-xs font-medium" style={{ color: outcome.color }}>
                {outcome.label}
              </span>
            </div>

            {/* Confidence */}
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor:
                      decision.confidenceScore >= 80
                        ? '#10b981'
                        : decision.confidenceScore >= 60
                        ? '#f59e0b'
                        : '#ef4444',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${decision.confidenceScore}%` }}
                  transition={{ duration: 0.8, delay: delay + 0.3 }}
                />
              </div>
              <span className="text-[10px] text-[--color-muted]">
                {decision.confidenceScore}%
              </span>
            </div>

            {/* Expand indicator */}
            <button className="text-[--color-muted] hover:text-[--color-foreground] transition-colors">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 space-y-4 border-t border-[--color-border]">
              <div className="pt-4" />

              {/* Rationale */}
              <div>
                <p className="text-xs font-medium text-[--color-muted] mb-1.5">Rationale</p>
                <p className="text-sm text-[--color-foreground] leading-relaxed">
                  {decision.rationale}
                </p>
              </div>

              {/* LLM Reasoning */}
              {decision.llmReasoning && (
                <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/5 shadow-inner">
                  <p className="text-[10px] font-mono uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: colors.primary }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.primary, boxShadow: `0 0 8px ${colors.primary}` }} />
                    LLM Inference Log
                  </p>
                  <p className="text-[13px] text-[--color-foreground] leading-relaxed font-mono opacity-90 border-l-2 pl-3" style={{ borderColor: `${colors.primary}40` }}>
                    {decision.llmReasoning}
                  </p>
                </div>
              )}

              {/* Input Data */}
              {decision.inputData && (
                <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/5 shadow-inner mt-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[--color-muted] mb-2">
                    Raw Input Payload
                  </p>
                  <code className="block text-[11px] leading-relaxed p-3 rounded bg-black/60 font-mono overflow-x-auto whitespace-pre-wrap break-words border border-white/5" style={{ color: colors.secondary }}>
                    {decision.inputData}
                  </code>
                </div>
              )}

              {/* Links */}
              <div className="flex items-center gap-4 pt-2">
                {decision.txHash && (
                  <a
                    href={`${SOMNIA_TESTNET.blockExplorers.default.url}/tx/${decision.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[--color-agent-ceo] hover:text-[--color-agent-ceo-light] transition-colors"
                  >
                    <ExternalLink size={12} />
                    View Transaction
                  </a>
                )}
                {decision.receiptUrl && (
                  <a
                    href={decision.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[--color-agent-cfo] hover:text-[--color-agent-cfo-light] transition-colors"
                  >
                    <ExternalLink size={12} />
                    View Receipt
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
