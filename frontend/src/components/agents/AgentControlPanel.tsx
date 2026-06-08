'use client';

// ============================================================
// AgentControlPanel — Owner-only controls for agent management
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import {
  Play,
  Pause,
  OctagonX,
  Target,
  RefreshCw,
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { toast } from '@/components/ui/Toast';
import { useOrchestrator } from '@/hooks/useOrchestrator';
import { contracts } from '@/lib/somnia/contracts';
import { useTreasuryPaused } from '@/hooks/useTreasuryVault';
import type { OrchestratorAgentRole } from '@/lib/orchestrator';

interface AgentControlPanelProps {
  currentObjective?: string | null;
}

// ── Inline TxStatus feedback ──────────────────────────────────
function TxStatus({
  isPending,
  isConfirming,
  isSuccess,
  error,
  txHash,
}: {
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
  txHash: `0x${string}` | undefined;
}) {
  if (!isPending && !isConfirming && !isSuccess && !error) return null;

  return (
    <div className="mt-2 text-xs space-y-1">
      {isPending && (
        <div className="flex items-center gap-2 text-yellow-400">
          <Loader2 size={12} className="animate-spin" />
          <span>Waiting for wallet…</span>
        </div>
      )}
      {isConfirming && (
        <div className="flex items-center gap-2 text-blue-400">
          <Loader2 size={12} className="animate-spin" />
          <span>Confirming on-chain…</span>
        </div>
      )}
      {isSuccess && txHash && (
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle2 size={12} />
          <span>Confirmed!</span>
          <a
            href={`https://shannon.somnia.network/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-emerald-300"
          >
            View <ExternalLink size={10} />
          </a>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 text-red-400">
          <XCircle size={12} className="mt-0.5 shrink-0" />
          <span className="break-all">{error.message?.slice(0, 120) ?? 'Transaction failed'}</span>
        </div>
      )}
    </div>
  );
}

import { useSetObjective } from '@/hooks/useContractActions';

export default function AgentControlPanel({
  currentObjective,
}: AgentControlPanelProps) {
  const { isConnected } = useAccount();

  // ── Objective (writes on-chain to CEOAgent.setObjective) ──
  const [objective, setObjective] = useState(() => {
    try {
      return localStorage.getItem('sovereignmind-objective') || currentObjective || '';
    } catch {
      return currentObjective || '';
    }
  });
  const {
    setObjective: writeObjective,
    txHash: objectiveHash,
    isPending: objectivePending,
    isConfirming: objectiveConfirming,
    isSuccess: objectiveSuccess,
    error: objectiveError,
  } = useSetObjective();

  // Save to localStorage when confirmed on-chain
  useEffect(() => {
    if (objectiveSuccess) {
      localStorage.setItem('sovereignmind-objective', objective);
      toast('Objective set on-chain successfully!', 'success');
    }
  }, [objectiveSuccess, objective]);

  const handleSetObjective = useCallback(() => {
    if (!objective.trim()) {
      toast('Please enter a strategic objective', 'warning');
      return;
    }
    if (!isConnected) {
      toast('Connect your wallet first', 'warning');
      return;
    }
    writeObjective(objective);
    toast('Setting strategic objective on-chain…', 'info');
  }, [objective, isConnected, writeObjective]);

  // ── Run Cycle → orchestrator backend ────────────────────────
  const orchestrator = useOrchestrator();
  const isRunningCycle = orchestrator.trigger.isPending || orchestrator.status?.isRunning;

  const handleRunCycle = useCallback(() => {
    if (!orchestrator.isOnline) {
      toast('Orchestrator is offline — cannot trigger cycle', 'error');
      return;
    }
    orchestrator.trigger.mutate(undefined, {
      onSuccess: () => toast('Decision cycle initiated on-chain', 'success'),
      onError: (err) => toast(`Cycle failed: ${err.message}`, 'error'),
    });
  }, [orchestrator]);

  // ── Pause / Resume → TreasuryVault.pause() / unpause() ─────
  const { data: isPausedOnChain, refetch: refetchPaused } = useTreasuryPaused();

  const {
    writeContract: writePause,
    data: pauseHash,
    isPending: pausePending,
    error: pauseError,
  } = useWriteContract();
  const { isLoading: pauseConfirming, isSuccess: pauseSuccess } =
    useWaitForTransactionReceipt({ hash: pauseHash });

  // Refetch paused status after tx confirms
  useEffect(() => {
    if (pauseSuccess) {
      refetchPaused();
    }
  }, [pauseSuccess, refetchPaused]);

  const handleTogglePause = useCallback(() => {
    if (!isConnected) {
      toast('Connect your wallet first', 'warning');
      return;
    }
    const fnName = isPausedOnChain ? 'unpause' : 'pause';
    writePause({
      address: contracts.treasuryVault.address,
      abi: contracts.treasuryVault.abi,
      functionName: fnName,
    });
    toast(
      isPausedOnChain
        ? 'Unpausing TreasuryVault…'
        : 'Pausing TreasuryVault…',
      'info',
    );
  }, [isConnected, isPausedOnChain, writePause]);

  // ── Emergency Stop → TreasuryVault.pause() with double-click ─
  const [emergencyConfirm, setEmergencyConfirm] = useState(false);
  const [emergencyTimer, setEmergencyTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const {
    writeContract: writeEmergency,
    data: emergencyHash,
    isPending: emergencyPending,
    error: emergencyError,
  } = useWriteContract();
  const { isLoading: emergencyConfirming, isSuccess: emergencySuccess } =
    useWaitForTransactionReceipt({ hash: emergencyHash });

  useEffect(() => {
    if (emergencySuccess) {
      refetchPaused();
    }
  }, [emergencySuccess, refetchPaused]);

  const handleEmergencyStop = useCallback(() => {
    if (!isConnected) {
      toast('Connect your wallet first', 'warning');
      return;
    }
    if (!emergencyConfirm) {
      setEmergencyConfirm(true);
      toast('Click again to confirm Emergency Stop', 'warning');
      const timer = setTimeout(() => {
        setEmergencyConfirm(false);
      }, 3000);
      setEmergencyTimer(timer);
      return;
    }
    // Confirmed — pause the TreasuryVault
    if (emergencyTimer) clearTimeout(emergencyTimer);
    setEmergencyConfirm(false);
    writeEmergency({
      address: contracts.treasuryVault.address,
      abi: contracts.treasuryVault.abi,
      functionName: 'pause',
    });
    toast('Emergency Stop executing — pausing TreasuryVault…', 'error');
  }, [isConnected, emergencyConfirm, emergencyTimer, writeEmergency]);

  const isPaused = !!isPausedOnChain;

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
        {isPaused && (
          <span className="ml-auto px-2 py-1 rounded-lg bg-[--color-error]/10 border border-[--color-error]/30 text-[--color-error] text-xs font-bold animate-pulse">
            PAUSED
          </span>
        )}
      </div>

      {/* Set Objective */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[--color-muted-foreground] mb-2">
          <Target size={14} className="inline mr-1.5" />
          Strategic Objective
          <span className="text-[--color-muted] text-xs ml-2">(on-chain & local)</span>
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
            disabled={objectivePending || objectiveConfirming}
            className="px-4 py-2.5 rounded-xl bg-[--color-agent-ceo] text-white text-sm font-medium hover:bg-[--color-agent-ceo-light] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <AnimatePresence mode="wait">
              {objectivePending || objectiveConfirming ? (
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
        <TxStatus
          isPending={objectivePending}
          isConfirming={objectiveConfirming}
          isSuccess={objectiveSuccess}
          error={objectiveError}
          txHash={objectiveHash}
        />
      </div>

      {/* Agent Toggles */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[--color-muted-foreground] mb-3">
          <Zap size={14} className="inline mr-1.5" />
          Agent Toggles
          <span className="text-[--color-muted] text-xs ml-2">(save STT by pausing agents)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            { role: 'CFO' as OrchestratorAgentRole, label: 'CFO', cost: '~0.10 STT', desc: 'Price fetch + Risk analysis' },
            { role: 'CMO' as OrchestratorAgentRole, label: 'CMO', cost: '~0.17 STT', desc: 'Web scrape + Sentiment' },
            { role: 'CEO' as OrchestratorAgentRole, label: 'CEO', cost: '~0.07 STT', desc: 'Decision + Rebalance' },
          ]).map(({ role, label, cost, desc }) => {
            const enabled = orchestrator.agentToggles?.[role]?.enabled ?? true;
            const isMutating = orchestrator.enableAgent.isPending || orchestrator.disableAgent.isPending;

            return (
              <div
                key={role}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  enabled
                    ? 'bg-white/[0.03] border-[--color-border]'
                    : 'bg-[--color-warning]/5 border-[--color-warning]/20'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[--color-foreground]">{label}</span>
                    <span className="text-[10px] text-[--color-muted]">{cost}/cycle</span>
                  </div>
                  <p className="text-[10px] text-[--color-muted-foreground] mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => {
                    const mutation = enabled ? orchestrator.disableAgent : orchestrator.enableAgent;
                    mutation.mutate(role, {
                      onSuccess: () => toast(`${label} agent ${enabled ? 'paused' : 'enabled'}`, 'success'),
                      onError: (err) => toast(`Toggle failed: ${err.message}`, 'error'),
                    });
                  }}
                  disabled={isMutating || !orchestrator.isOnline}
                  className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    enabled ? 'bg-[--color-success]' : 'bg-[--color-muted]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Run Cycle → orchestrator */}
        <div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRunCycle}
            disabled={!orchestrator.isOnline || !!isRunningCycle}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[--color-success]/10 border border-[--color-success]/20 text-[--color-success] text-sm font-medium hover:bg-[--color-success]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunningCycle ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {isRunningCycle ? 'Running…' : 'Run Cycle'}
          </motion.button>
          {!orchestrator.isOnline && (
            <p className="text-[10px] text-[--color-muted] mt-1 text-center">Orchestrator offline</p>
          )}
        </div>

        {/* Pause / Resume → TreasuryVault */}
        <div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTogglePause}
            disabled={!isConnected || pausePending || pauseConfirming}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isPaused
                ? 'bg-[--color-success]/10 border border-[--color-success]/20 text-[--color-success] hover:bg-[--color-success]/20'
                : 'bg-[--color-warning]/10 border border-[--color-warning]/20 text-[--color-warning] hover:bg-[--color-warning]/20'
            }`}
          >
            {pausePending || pauseConfirming ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isPaused ? (
              <Play size={16} />
            ) : (
              <Pause size={16} />
            )}
            {pausePending || pauseConfirming
              ? 'Processing…'
              : isPaused
                ? 'Resume'
                : 'Pause'}
          </motion.button>
          <TxStatus
            isPending={pausePending}
            isConfirming={pauseConfirming}
            isSuccess={pauseSuccess}
            error={pauseError}
            txHash={pauseHash}
          />
        </div>
      </div>

      {/* Emergency Stop → TreasuryVault.pause() */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleEmergencyStop}
        disabled={!isConnected || emergencyPending || emergencyConfirming}
        className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          emergencyConfirm
            ? 'bg-[--color-error]/30 border-2 border-[--color-error] text-[--color-error] animate-pulse'
            : 'bg-[--color-error]/10 border border-[--color-error]/30 text-[--color-error] hover:bg-[--color-error]/20'
        }`}
      >
        {emergencyPending || emergencyConfirming ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <OctagonX size={16} />
        )}
        {emergencyPending || emergencyConfirming
          ? 'Processing…'
          : emergencyConfirm
            ? 'Click Again to Confirm'
            : 'Emergency Stop'}
      </motion.button>
      <TxStatus
        isPending={emergencyPending}
        isConfirming={emergencyConfirming}
        isSuccess={emergencySuccess}
        error={emergencyError}
        txHash={emergencyHash}
      />

      {/* Wallet warning */}
      {!isConnected && (
        <p className="text-[10px] text-yellow-400/70 mt-3 text-center">
          Connect wallet to enable Pause/Resume and Emergency Stop
        </p>
      )}
    </GlassCard>
  );
}
