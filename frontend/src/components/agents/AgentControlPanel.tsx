'use client';

// ============================================================
// AgentControlPanel — Owner-only controls for agent management
// ============================================================

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  OctagonX,
  Target,
  RefreshCw,
  Shield,
  Loader2,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { toast } from '@/components/ui/Toast';

interface AgentControlPanelProps {
  currentObjective?: string | null;
}

export default function AgentControlPanel({
  currentObjective,
}: AgentControlPanelProps) {
  const [objective, setObjective] = useState(currentObjective || '');
  const [isPaused, setIsPaused] = useState(false);
  const [isRunningCycle, setIsRunningCycle] = useState(false);
  const [isSettingObjective, setIsSettingObjective] = useState(false);
  const [emergencyConfirm, setEmergencyConfirm] = useState(false);
  const [emergencyTimer, setEmergencyTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // ── Set Objective ────────────────────────────────────────
  const handleSetObjective = useCallback(() => {
    if (!objective.trim()) {
      toast('Please enter a strategic objective', 'warning');
      return;
    }
    setIsSettingObjective(true);
    setTimeout(() => {
      setIsSettingObjective(false);
      toast('Objective updated successfully', 'success');
    }, 800);
  }, [objective]);

  // ── Run Cycle ────────────────────────────────────────────
  const handleRunCycle = useCallback(() => {
    if (isRunningCycle) return;
    setIsRunningCycle(true);
    toast('Autonomous cycle initiated...', 'info');
    setTimeout(() => {
      setIsRunningCycle(false);
      toast('Decision cycle completed', 'success');
    }, 2000);
  }, [isRunningCycle]);

  // ── Pause / Resume ───────────────────────────────────────
  const handleTogglePause = useCallback(() => {
    const next = !isPaused;
    setIsPaused(next);
    toast(
      next ? 'Agent operations paused' : 'Agent operations resumed',
      next ? 'warning' : 'success'
    );
  }, [isPaused]);

  // ── Emergency Stop (double-click confirm) ────────────────
  const handleEmergencyStop = useCallback(() => {
    if (!emergencyConfirm) {
      setEmergencyConfirm(true);
      toast('Click again to confirm Emergency Stop', 'warning');
      const timer = setTimeout(() => {
        setEmergencyConfirm(false);
      }, 3000);
      setEmergencyTimer(timer);
      return;
    }
    // Confirmed
    if (emergencyTimer) clearTimeout(emergencyTimer);
    setEmergencyConfirm(false);
    setIsPaused(true);
    toast('Emergency Stop executed — all agents halted', 'error');
  }, [emergencyConfirm, emergencyTimer]);

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
            onClick={handleSetObjective}
            disabled={isSettingObjective}
            className="px-4 py-2.5 rounded-xl bg-[--color-agent-ceo] text-white text-sm font-medium hover:bg-[--color-agent-ceo-light] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <AnimatePresence mode="wait">
              {isSettingObjective ? (
                <motion.span
                  key="spinner"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 size={14} className="animate-spin" />
                </motion.span>
              ) : null}
            </AnimatePresence>
            Set
          </motion.button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRunCycle}
          disabled={isRunningCycle}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[--color-success]/10 border border-[--color-success]/20 text-[--color-success] text-sm font-medium hover:bg-[--color-success]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunningCycle ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          {isRunningCycle ? 'Running...' : 'Run Cycle'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleTogglePause}
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
        onClick={handleEmergencyStop}
        className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
          emergencyConfirm
            ? 'bg-[--color-error]/30 border-2 border-[--color-error] text-[--color-error] animate-pulse'
            : 'bg-[--color-error]/10 border border-[--color-error]/30 text-[--color-error] hover:bg-[--color-error]/20'
        }`}
      >
        <OctagonX size={16} />
        {emergencyConfirm ? 'Click Again to Confirm' : 'Emergency Stop'}
      </motion.button>
    </GlassCard>
  );
}
