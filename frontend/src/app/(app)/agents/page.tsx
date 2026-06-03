'use client';

// ============================================================
// Agents Overview Page
// ============================================================


import { useAccount } from 'wagmi';
import { useAgentData } from '@/hooks/useAgentData';
import { motion } from 'framer-motion';
import AgentCard from '@/components/agents/AgentCard';
import AgentControlPanel from '@/components/agents/AgentControlPanel';
import LiveAgentConsole from '@/components/agents/LiveAgentConsole';
import GlassCard from '@/components/ui/GlassCard';
import Skeleton, { SkeletonCard } from '@/components/ui/Skeleton';
import { AGENT_COLORS } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ArrowDown, Brain, LineChart, Megaphone, User, Landmark, Shield, Zap, Search } from 'lucide-react';

const CONSOLE_SKELETON_WIDTHS = ['78%', '54%', '66%', '82%', '58%'];

export default function AgentsPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { agents, isLoading } = useAgentData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Page Title Skeleton */}
        <div>
          <Skeleton width="160px" height="28px" className="mb-2" />
          <Skeleton width="320px" height="14px" />
        </div>

        {/* Agent Control Panel Skeleton */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton width="180px" height="16px" />
            <Skeleton width="100px" height="36px" className="rounded-xl" />
          </div>
          <Skeleton width="100%" height="40px" className="rounded-xl" />
        </div>

        {/* Agent Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* Live Agent Console Skeleton */}
        <div className="glass rounded-2xl p-0 overflow-hidden flex flex-col h-[340px]">
          <div className="h-12 border-b border-white/5 px-4 flex items-center justify-between">
            <Skeleton width="140px" height="16px" />
            <Skeleton width="24px" height="24px" className="rounded" />
          </div>
          <div className="flex-1 p-4 space-y-3">
            {CONSOLE_SKELETON_WIDTHS.map((width, i) => (
              <Skeleton key={i} width={width} height="12px" />
            ))}
          </div>
        </div>

        {/* Architecture Diagram Skeleton */}
        <div className="glass rounded-2xl p-6">
          <Skeleton width="200px" height="20px" className="mb-6" />
          <div className="flex items-center justify-center gap-4 py-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} width="64px" height="64px" className="rounded-2xl" />
            ))}
          </div>
          <Skeleton width="100%" height="48px" className="rounded-xl mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold gradient-text-primary">Agent Guild</h1>
        <p className="text-sm text-[--color-muted-foreground] mt-1">
          Monitor and control your autonomous AI agent network
        </p>
      </div>

      {/* Agent Control Panel */}
      <AgentControlPanel
        currentObjective={agents[0]?.objective || 'Autonomous multi-agent coordination'}
      />

      {/* Agent Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {agents.map((agent, index) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            delay={index * 0.15}
            onClick={() => router.push(`/agents/${agent.role.toLowerCase()}`)}
          />
        ))}
      </div>

      {/* Live Agent Console */}
      <LiveAgentConsole />

      {/* Agent Architecture Diagram */}
      <GlassCard padding="lg">
        <h3 className="text-lg font-semibold text-[--color-foreground] mb-6">
          Agent Interaction Flow
        </h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-6">
          {/* Owner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-[--color-border] flex items-center justify-center">
              <User size={28} className="text-[--color-muted-foreground]" />
            </div>
            <span className="text-xs font-medium text-[--color-muted-foreground]">Owner</span>
          </motion.div>

          {/* Arrow Owner -> CEO */}
          <motion.div
            className="text-[--color-muted-foreground]"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1.1, 0.95] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="hidden sm:block"><ArrowRight size={24} /></div>
            <div className="block sm:hidden"><ArrowDown size={24} /></div>
          </motion.div>

          {/* CEO */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center gap-2"
          >
            <motion.div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-xl font-bold border-2"
              style={{
                backgroundColor: AGENT_COLORS.CEO.bg,
                borderColor: AGENT_COLORS.CEO.primary,
                color: AGENT_COLORS.CEO.primary,
              }}
              animate={{
                boxShadow: [
                  `0 0 10px ${AGENT_COLORS.CEO.glow}`,
                  `0 0 25px ${AGENT_COLORS.CEO.glow}`,
                  `0 0 10px ${AGENT_COLORS.CEO.glow}`
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              CEO
            </motion.div>
            <span className="text-xs font-medium" style={{ color: AGENT_COLORS.CEO.primary }}>
              Orchestrator
            </span>
          </motion.div>

          {/* Arrow CEO -> CFO & CMO */}
          <motion.div
            className="text-[--color-agent-ceo]"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1.1, 0.95] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          >
            <div className="hidden sm:block"><ArrowRight size={24} /></div>
            <div className="block sm:hidden"><ArrowDown size={24} /></div>
          </motion.div>

          {/* CFO & CMO */}
          <div className="flex flex-row sm:flex-col items-center gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col items-center gap-2"
            >
              <motion.div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-sm font-bold border-2"
                style={{
                  backgroundColor: AGENT_COLORS.CFO.bg,
                  borderColor: AGENT_COLORS.CFO.primary,
                  color: AGENT_COLORS.CFO.primary,
                }}
                animate={{
                  boxShadow: [
                    `0 0 8px ${AGENT_COLORS.CFO.glow}`,
                    `0 0 20px ${AGENT_COLORS.CFO.glow}`,
                    `0 0 8px ${AGENT_COLORS.CFO.glow}`
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                CFO
              </motion.div>
              <span className="text-[10px] font-medium" style={{ color: AGENT_COLORS.CFO.primary }}>
                Risk Analyst
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex flex-col items-center gap-2"
            >
              <motion.div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-sm font-bold border-2"
                style={{
                  backgroundColor: AGENT_COLORS.CMO.bg,
                  borderColor: AGENT_COLORS.CMO.primary,
                  color: AGENT_COLORS.CMO.primary,
                }}
                animate={{
                  boxShadow: [
                    `0 0 8px ${AGENT_COLORS.CMO.glow}`,
                    `0 0 20px ${AGENT_COLORS.CMO.glow}`,
                    `0 0 8px ${AGENT_COLORS.CMO.glow}`
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              >
                CMO
              </motion.div>
              <span className="text-[10px] font-medium" style={{ color: AGENT_COLORS.CMO.primary }}>
                Market Intel
              </span>
            </motion.div>
          </div>

          {/* Arrow CFO/CMO -> Treasury */}
          <motion.div
            className="text-[--color-agent-cfo]"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1.1, 0.95] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          >
            <div className="hidden sm:block"><ArrowRight size={24} /></div>
            <div className="block sm:hidden"><ArrowDown size={24} /></div>
          </motion.div>

          {/* Treasury */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="flex flex-col items-center gap-2"
          >
            <motion.div 
              className="w-16 h-16 rounded-2xl bg-[--color-success]/10 border-2 border-[--color-success]/30 flex items-center justify-center"
              animate={{
                boxShadow: [
                  '0 0 8px rgba(16, 185, 129, 0.1)',
                  '0 0 20px rgba(16, 185, 129, 0.3)',
                  '0 0 8px rgba(16, 185, 129, 0.1)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            >
              <Landmark size={28} className="text-[--color-success]" />
            </motion.div>
            <span className="text-xs font-medium text-[--color-success]">
              Treasury Vault
            </span>
          </motion.div>
        </div>

        {/* Somnia Layer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[--color-agent-ceo]/5 via-[--color-agent-cfo]/5 to-[--color-agent-cmo]/5 border border-[--color-border] text-center"
        >
          <p className="text-xs text-[--color-muted-foreground]">
            ⚡ All agent compute powered by <span className="font-semibold text-[--color-foreground]">Somnia Agentic L1</span> — 
            BFT consensus on deterministic LLM outputs
          </p>
        </motion.div>
      </GlassCard>
    </div>
  );
}
