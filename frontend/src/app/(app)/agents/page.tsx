'use client';

// ============================================================
// Agents Overview Page
// ============================================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AgentCard from '@/components/agents/AgentCard';
import AgentControlPanel from '@/components/agents/AgentControlPanel';
import GlassCard from '@/components/ui/GlassCard';
import Skeleton, { SkeletonCard } from '@/components/ui/Skeleton';
import { mockAgents } from '@/lib/mock-data';
import { AGENT_COLORS } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { User, Landmark } from 'lucide-react';

export default function AgentsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

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
        currentObjective={mockAgents[0].objective}
      />

      {/* Agent Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {mockAgents.map((agent, index) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            delay={index * 0.15}
            onClick={() => router.push(`/agents/${agent.role.toLowerCase()}`)}
          />
        ))}
      </div>

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

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleX: 1, scaleY: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="w-px h-8 sm:w-12 sm:h-px bg-gradient-to-b sm:bg-gradient-to-r from-[--color-muted] to-[--color-agent-ceo]"
          />

          {/* CEO */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center gap-2"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-xl font-bold border-2"
              style={{
                backgroundColor: AGENT_COLORS.CEO.bg,
                borderColor: AGENT_COLORS.CEO.primary,
                color: AGENT_COLORS.CEO.primary,
                boxShadow: `0 0 20px ${AGENT_COLORS.CEO.glow}`,
              }}
            >
              CEO
            </div>
            <span className="text-xs font-medium" style={{ color: AGENT_COLORS.CEO.primary }}>
              Orchestrator
            </span>
          </motion.div>

          {/* Branching arrows */}
          <div className="flex flex-row sm:flex-col items-center gap-8">
            <motion.div
              initial={{ opacity: 0, scaleX: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleX: 1, scaleY: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="w-px h-8 sm:w-12 sm:h-px bg-gradient-to-b sm:bg-gradient-to-r from-[--color-agent-ceo] to-[--color-agent-cfo]"
            />
            <motion.div
              initial={{ opacity: 0, scaleX: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleX: 1, scaleY: 1 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="w-px h-8 sm:w-12 sm:h-px bg-gradient-to-b sm:bg-gradient-to-r from-[--color-agent-ceo] to-[--color-agent-cmo]"
            />
          </div>

          {/* CFO & CMO */}
          <div className="flex flex-row sm:flex-col items-center gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-sm font-bold border-2"
                style={{
                  backgroundColor: AGENT_COLORS.CFO.bg,
                  borderColor: AGENT_COLORS.CFO.primary,
                  color: AGENT_COLORS.CFO.primary,
                  boxShadow: `0 0 15px ${AGENT_COLORS.CFO.glow}`,
                }}
              >
                CFO
              </div>
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
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-sm font-bold border-2"
                style={{
                  backgroundColor: AGENT_COLORS.CMO.bg,
                  borderColor: AGENT_COLORS.CMO.primary,
                  color: AGENT_COLORS.CMO.primary,
                  boxShadow: `0 0 15px ${AGENT_COLORS.CMO.glow}`,
                }}
              >
                CMO
              </div>
              <span className="text-[10px] font-medium" style={{ color: AGENT_COLORS.CMO.primary }}>
                Market Intel
              </span>
            </motion.div>
          </div>

          {/* Arrow to Treasury */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleX: 1, scaleY: 1 }}
            transition={{ duration: 0.3, delay: 0.8 }}
            className="w-px h-8 sm:w-12 sm:h-px bg-gradient-to-b sm:bg-gradient-to-r from-[--color-agent-cfo] to-[--color-success]"
          />

          {/* Treasury */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-16 h-16 rounded-2xl bg-[--color-success]/10 border-2 border-[--color-success]/30 flex items-center justify-center"
              style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' }}
            >
              <Landmark size={28} className="text-[--color-success]" />
            </div>
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
