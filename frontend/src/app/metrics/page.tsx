'use client';

// ============================================================
// SovereignMind — Public Metrics Dashboard
// ============================================================
// Open (no wallet required) page that surfaces live on-chain
// metrics. Useful for hackathon judges + community verification.

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Brain, TrendingUp, Radar, Target, ExternalLink, RefreshCw } from 'lucide-react';
import {
  useAgentData,
} from '@/hooks/useAgentData';
import { useDecisionData } from '@/hooks/useDecisionData';
import { useTreasuryData } from '@/hooks/useTreasuryData';
import { useCEOCurrentObjective, useCEOPerformanceMetrics } from '@/hooks/useCEOAgent';
import { SOMNIA_TESTNET, formatCompact, formatRelativeTime, truncateAddress } from '@/lib/constants';
import { contracts as contractMap } from '@/lib/somnia/contracts';
import { buildExplorerAddressUrl } from '@/lib/somnia/receipts';

const CONTRACTS = [
  { name: 'AgentRegistry', address: contractMap.agentRegistry.address },
  { name: 'TreasuryVault', address: contractMap.treasuryVault.address },
  { name: 'CEO_Prime', address: contractMap.ceoAgent.address },
  { name: 'CFO_Quant', address: contractMap.cfoAgent.address },
  { name: 'CMO_Pulse', address: contractMap.cmoAgent.address },
];

const statCardClass =
  'glass-dark rounded-2xl p-6 flex flex-col gap-2 hover:border-white/20 transition-colors';

const explorerBase = SOMNIA_TESTNET.blockExplorers.default.url;

export default function PublicMetricsPage() {
  const { agents, totalDecisions, systemHealth } = useAgentData();
  const { decisions, isLoading: decisionsLoading } = useDecisionData(10);
  const { treasury } = useTreasuryData();
  const { data: currentObjective } = useCEOCurrentObjective();
  const { data: ceoMetrics } = useCEOPerformanceMetrics();

  // Auto-refresh every 30s
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const ceoAgent = agents.find((a) => a.role === 'CEO');
  const cfoAgent = agents.find((a) => a.role === 'CFO');
  const cmoAgent = agents.find((a) => a.role === 'CMO');

  const objective: unknown = currentObjective;
  const objectiveStr = typeof objective === 'string' ? objective : '';

  const totalDecisionsBig = ceoMetrics && Array.isArray(ceoMetrics)
    ? Number(ceoMetrics[1] ?? 0)
    : totalDecisions;
  const completedCycles = ceoMetrics && Array.isArray(ceoMetrics)
    ? Number(ceoMetrics[0] ?? 0)
    : 0;
  const avgCycleTimeSec = ceoMetrics && Array.isArray(ceoMetrics)
    ? Number(ceoMetrics[2] ?? 0)
    : 0;

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-white">
      <div className="container mx-auto px-4 md:px-[var(--spacing-margin-page)] py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-[var(--color-primary)]" size={28} />
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              SovereignMind Live Metrics
            </h1>
          </div>
          <p className="text-white/50 text-sm md:text-base max-w-2xl">
            Real-time, on-chain metrics from the SovereignMind agent guild on Somnia Testnet.
            No wallet required — every number is verifiable on the{' '}
            <a
              href={explorerBase}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              block explorer
            </a>
            .
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div
              className={`w-2 h-2 rounded-full ${
                systemHealth.status === 'healthy'
                  ? 'bg-emerald-400 animate-pulse'
                  : systemHealth.status === 'degraded'
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
            />
            <span className="text-xs text-white/40 uppercase tracking-wider">
              System Status: {systemHealth.status}
            </span>
          </div>
        </div>

        {/* Top-line stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={statCardClass}
          >
            <p className="text-xs text-white/40 uppercase tracking-wider">Treasury TVL</p>
            <p className="text-3xl font-extrabold text-white">
              {treasury.totalValue > 0 ? treasury.totalValue.toFixed(2) : '0.00'}
              <span className="text-sm font-normal text-white/50 ml-1">STT</span>
            </p>
            <p className="text-xs text-emerald-400/70">▲ on-chain</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={statCardClass}
          >
            <p className="text-xs text-white/40 uppercase tracking-wider">Decisions</p>
            <p className="text-3xl font-extrabold text-white">{formatCompact(totalDecisionsBig)}</p>
            <p className="text-xs text-emerald-400/70">▲ on-chain</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={statCardClass}
          >
            <p className="text-xs text-white/40 uppercase tracking-wider">Cycles Completed</p>
            <p className="text-3xl font-extrabold text-white">{formatCompact(completedCycles)}</p>
            <p className="text-xs text-emerald-400/70">▲ on-chain</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={statCardClass}
          >
            <p className="text-xs text-white/40 uppercase tracking-wider">Active Agents</p>
            <p className="text-3xl font-extrabold text-white">
              {systemHealth.agentsOnline}/{systemHealth.totalAgents}
            </p>
            <p className="text-xs text-emerald-400/70">▲ on-chain</p>
          </motion.div>
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={statCardClass}>
            <p className="text-xs text-white/40 uppercase tracking-wider">Avg Cycle Time</p>
            <p className="text-2xl font-extrabold text-white">
              {avgCycleTimeSec > 0 ? `${avgCycleTimeSec}s` : '—'}
            </p>
          </div>
          <div className={statCardClass}>
            <p className="text-xs text-white/40 uppercase tracking-wider">Last Cycle</p>
            <p className="text-2xl font-extrabold text-white">
              {systemHealth.lastCycleTimestamp > 0
                ? formatRelativeTime(systemHealth.lastCycleTimestamp)
                : '—'}
            </p>
          </div>
          <div className={statCardClass}>
            <p className="text-xs text-white/40 uppercase tracking-wider">Network</p>
            <p className="text-2xl font-extrabold text-white">Somnia Testnet</p>
            <p className="text-xs text-white/40">Chain ID {SOMNIA_TESTNET.id}</p>
          </div>
        </div>

        {/* Current objective */}
        {objectiveStr.length > 0 && (
          <div className="glass-dark rounded-2xl p-6 mb-8 border-l-4 border-l-[var(--color-primary)]">
            <div className="flex items-start gap-3">
              <Target size={20} className="text-[var(--color-primary)] mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Current Strategic Objective</p>
                <p className="text-base text-white/90 leading-relaxed">{objectiveStr}</p>
              </div>
            </div>
          </div>
        )}

        {/* Agents breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Agent Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { agent: ceoAgent, icon: <Brain size={20} />, label: 'CEO_Prime' },
              { agent: cfoAgent, icon: <TrendingUp size={20} />, label: 'CFO_Quant' },
              { agent: cmoAgent, icon: <Radar size={20} />, label: 'CMO_Pulse' },
            ].map(({ agent, icon, label }) => (
              <div key={label} className={statCardClass}>
                <div className="flex items-center gap-2 mb-2">
                  {icon}
                  <span className="font-semibold text-white">{label}</span>
                </div>
                <p className="text-xs text-white/40 uppercase tracking-wider">Status</p>
                <p className="text-sm text-white capitalize">{agent?.status || 'unknown'}</p>
                <p className="text-xs text-white/40 uppercase tracking-wider mt-2">Decisions</p>
                <p className="text-sm text-white">{agent?.decisionsCount ?? 0}</p>
                <p className="text-xs text-white/40 uppercase tracking-wider mt-2">Uptime</p>
                <p className="text-sm text-white">{agent?.uptime.toFixed(2)}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent decisions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Decisions</h2>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          {decisionsLoading && decisions.length === 0 && (
            <p className="text-white/40 italic text-sm">Querying on-chain events…</p>
          )}
          {!decisionsLoading && decisions.length === 0 && (
            <p className="text-white/40 italic text-sm">No on-chain activity yet.</p>
          )}
          <div className="space-y-2">
            {decisions.slice(0, 10).map((d) => (
              <a
                key={d.id}
                href={d.receiptUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-dark rounded-xl p-4 flex items-center justify-between gap-4 hover:border-[var(--color-primary)]/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[var(--color-primary)]">{d.agentRole}</span>
                    <span className="text-xs text-white/40">·</span>
                    <span className="text-xs text-white/60 uppercase tracking-wider">{d.action}</span>
                  </div>
                  <p className="text-sm text-white truncate">{d.title}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-white/40">
                    {formatRelativeTime(d.timestamp)}
                  </span>
                  <ExternalLink size={14} className="text-white/30" />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* On-chain contracts */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Verified On-Chain Contracts</h2>
          <p className="text-sm text-white/50 mb-4">
            All contracts are deployed and verified on the Somnia Testnet block explorer.
            Click any address to view source, transactions, and events.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {CONTRACTS.map((c) => (
              <a
                key={c.address}
                href={buildExplorerAddressUrl(c.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-dark rounded-xl p-3 flex items-center justify-between gap-3 hover:border-[var(--color-primary)]/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-semibold">{c.name}</p>
                  <code className="text-xs text-white/40 font-mono">
                    {truncateAddress(c.address)}
                  </code>
                </div>
                <ExternalLink size={14} className="text-white/30 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-white/30 mt-12 pt-8 border-t border-white/5">
          <p>Metrics refresh every 30 seconds · Last data query: {new Date().toLocaleString()}</p>
          <p className="mt-1">
            Source: <a href="https://github.com/bagusardin25/SovereignMind" className="underline">github.com/bagusardin25/SovereignMind</a>
          </p>
        </div>
      </div>
    </main>
  );
}
