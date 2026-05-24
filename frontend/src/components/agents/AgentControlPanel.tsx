'use client';

// ============================================================
// AgentControlPanel — Owner-only controls for agent management
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  OctagonX,
  Target,
  RefreshCw,
  Shield,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

interface AgentControlPanelProps {
  currentObjective?: string | null;
}

export default function AgentControlPanel({
  currentObjective,
}: AgentControlPanelProps) {
  const [objective, setObjective] = useState(currentObjective || '');
  const [isPaused, setIsPaused] = useState(false);

  return (
    <GlassCard glow="blue" padding="lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-[--color-agent-ceo]/10">
          <Shield size={20} className="text-[--color-agent-ceo]" />
        </div>
        <div>
          <h3 className="font-bold text-[--color-foreground]">Agent Control Panel</h3>
          <p className="text-xs text-[--color-muted-foreground]">Owner-only operations</p>
        </div>
      </div>

      {/* Set Objective */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[--color-muted-foreground] mb-2">
          <Target size={14} className="inline mr-1.5" />
          Strategic Objective
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Define the strategic objective for the agent guild..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-[--color-border] text-sm text-[--color-foreground] placeholder:text-[--color-muted] focus:outline-none focus:border-[--color-agent-ceo]/50 focus:ring-1 focus:ring-[--color-agent-ceo]/20 transition-all"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2.5 rounded-xl bg-[--color-agent-ceo] text-white text-sm font-medium hover:bg-[--color-agent-ceo-light] transition-colors"
          >
            Set
          </motion.button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[--color-success]/10 border border-[--color-success]/20 text-[--color-success] text-sm font-medium hover:bg-[--color-success]/20 transition-all"
        >
          <RefreshCw size={16} />
          Run Cycle
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsPaused(!isPaused)}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            isPaused
              ? 'bg-[--color-success]/10 border border-[--color-success]/20 text-[--color-success] hover:bg-[--color-success]/20'
              : 'bg-[--color-warning]/10 border border-[--color-warning]/20 text-[--color-warning] hover:bg-[--color-warning]/20'
          }`}
        >
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
          {isPaused ? 'Resume' : 'Pause'}
        </motion.button>
      </div>

      {/* Emergency Stop */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[--color-error]/10 border border-[--color-error]/30 text-[--color-error] text-sm font-bold hover:bg-[--color-error]/20 transition-all"
      >
        <OctagonX size={16} />
        Emergency Stop
      </motion.button>
    </GlassCard>
  );
}
