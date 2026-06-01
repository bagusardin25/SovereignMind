'use client';

// ============================================================
// LiveAgentConsole — Real-time terminal for agent logs
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Terminal, Play, Square } from 'lucide-react';
import { AGENT_COLORS } from '@/lib/constants';
import type { ActivityEvent, AgentRole } from '@/lib/types';
import GlassCard from '@/components/ui/GlassCard';

// Helper to generate a random mock event for the live simulation
const generateRandomEvent = (): ActivityEvent => {
  const roles: AgentRole[] = ['CEO', 'CFO', 'CMO'];
  const actions = {
    CEO: ['Objective Evaluated', 'Task Delegated', 'Synthesis Complete', 'Decision Made'],
    CFO: ['Data Fetched', 'Risk Model Updated', 'Threshold Checked', 'Rebalance Triggered'],
    CMO: ['Sources Scraped', 'Sentiment Parsed', 'Signal Emitted', 'News Indexed'],
  };
  
  const role = roles[Math.floor(Math.random() * roles.length)];
  const actionList = actions[role];
  const action = actionList[Math.floor(Math.random() * actionList.length)];
  
  return {
    id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    agentRole: role,
    action,
    description: `[${role}] executed: ${action} with success.`,
    timestamp: Date.now(),
  };
};

// Generate a batch of initial seed events so the console isn't empty on load
function generateSeedEvents(count: number): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const evt = generateRandomEvent();
    // Stagger timestamps so they appear to have happened recently
    evt.id = `seed-${i}`;
    evt.timestamp = now - (count - i) * 8000; // ~8 seconds apart
    events.push(evt);
  }
  return events;
}

export default function LiveAgentConsole() {
  const [logs, setLogs] = useState<ActivityEvent[]>(() => generateSeedEvents(5));
  const [isLive, setIsLive] = useState(true);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { isConnected } = useAccount();

  // Auto-scroll to bottom
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Simulate live feed
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // Add a new log every 3-8 seconds
      if (Math.random() > 0.4) {
        setLogs((prev) => [...prev, generateRandomEvent()].slice(-50)); // Keep last 50
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

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
              {isLive ? (isConnected ? 'ON-CHAIN' : 'CONNECTED') : 'PAUSED'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLive(!isLive)}
            className="p-1.5 rounded-md hover:bg-white/10 text-[--color-muted-foreground] hover:text-white transition-colors"
            title={isLive ? "Pause Feed" : "Resume Feed"}
          >
            {isLive ? <Square size={14} /> : <Play size={14} />}
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="h-[300px] overflow-y-auto p-4 font-mono text-xs bg-[#0a0a0a]/80" style={{ scrollbarWidth: 'thin' }}>
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
                <span className="text-white/40">{'->'} {log.description}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endOfMessagesRef} />
      </div>
    </GlassCard>
  );
}
