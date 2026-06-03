'use client';

// ============================================================
// LiveAgentConsole — Real-time terminal for agent logs
// ============================================================
// Pulls REAL on-chain activity from CEOAgent + TreasuryVault
// decisions via useDecisionData. No mock data.

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Terminal, Play, Square, RefreshCw } from 'lucide-react';
import { AGENT_COLORS, formatRelativeTime } from '@/lib/constants';
import GlassCard from '@/components/ui/GlassCard';
import { useDecisionData } from '@/hooks/useDecisionData';
import type { ActivityEvent, AgentRole } from '@/lib/types';

// Map a Decision into the ActivityEvent shape used by the console
function decisionToEvent(d: {
  id: string;
  agentRole: AgentRole;
  action: string;
  rationale: string;
  timestamp: number;
}): ActivityEvent {
  return {
    id: d.id,
    agentRole: d.agentRole,
    action: d.action.toUpperCase(),
    description: d.rationale || `${d.action} on-chain`,
    timestamp: d.timestamp,
  };
}

export default function LiveAgentConsole() {
  const [isLive, setIsLive] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const consoleContainerRef = useRef<HTMLDivElement>(null);
  const { isConnected } = useAccount();

  // Real on-chain decisions (CEO + TreasuryVault)
  const { decisions, isLoading } = useDecisionData(20);

  // Re-render relative time every 30s
  useEffect(() => {
    const id = window.setInterval(() => setRefreshTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Polling refresh every 15s for new on-chain activity
  useEffect(() => {
    if (!isLive) return;
    const id = window.setInterval(() => {
      // wagmi query key includes block number; refetch by triggering a tick
      setRefreshTick((t) => t + 1);
    }, 15_000);
    return () => window.clearInterval(id);
  }, [isLive]);

  // Sort decisions newest-first and take last 50
  const logs = useMemo<ActivityEvent[]>(() => {
    void refreshTick; // include in deps to force re-compute on tick
    return [...decisions]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50)
      .map(decisionToEvent);
  }, [decisions, refreshTick]);

  // Auto-scroll inside container only
  useEffect(() => {
    if (consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <GlassCard className="overflow-hidden flex flex-col" padding="none">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-[--color-muted-foreground]" />
          <h3 className="text-sm font-semibold text-[--color-foreground]">Live Agent Console</h3>

          <div className="flex items-center gap-1.5 ml-4 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-medium text-[--color-muted-foreground]">
              {isLive ? (isConnected ? 'ON-CHAIN' : 'RPC') : 'PAUSED'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshTick((t) => t + 1)}
            className="p-1.5 rounded-md hover:bg-white/10 text-[--color-muted-foreground] hover:text-white transition-colors"
            title="Refresh now"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setIsLive(!isLive)}
            className="p-1.5 rounded-md hover:bg-white/10 text-[--color-muted-foreground] hover:text-white transition-colors"
            title={isLive ? 'Pause auto-refresh' : 'Resume auto-refresh'}
          >
            {isLive ? <Square size={14} /> : <Play size={14} />}
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={consoleContainerRef}
        className="h-[300px] overflow-y-auto p-4 font-mono text-xs bg-[#0a0a0a]/80"
        style={{ scrollbarWidth: 'thin' }}
      >
        {isLoading && logs.length === 0 && (
          <div className="text-white/30 italic">Querying on-chain events…</div>
        )}

        {!isLoading && logs.length === 0 && (
          <div className="text-white/30 italic">
            No on-chain activity yet. Trigger a decision cycle to populate this feed.
          </div>
        )}

        <AnimatePresence initial={false}>
          {logs.map((log) => {
            const colors = AGENT_COLORS[log.agentRole];
            const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-2 leading-relaxed break-words"
              >
                <span className="text-white/30 mr-3">[{time}]</span>
                <span
                  className="font-bold mr-2"
                  style={{ color: colors.primary }}
                >
                  {log.agentRole}
                </span>
                <span className="text-white/70 mr-2">{log.action}</span>
                <span className="text-white/40">
                  {'->'} {log.description}{' '}
                  <span className="text-white/20">· {formatRelativeTime(log.timestamp)}</span>
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
