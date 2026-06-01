'use client';

// ============================================================
// Settings Page
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import {
  Save, ShieldAlert, Clock, Bell, ChevronDown,
  Zap, Wallet, Server, Activity, ArrowUpCircle,
  DollarSign, BarChart3, Search, AlertTriangle,
  Loader2, CheckCircle2, XCircle, ExternalLink, Copy
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESSES, truncateAddress } from '@/lib/constants';
import { useTreasuryBalance } from '@/hooks/useTreasuryVault';
import { useAgentCount, useTotalDecisions } from '@/hooks/useAgentRegistry';
import { useCEOCycleInterval } from '@/hooks/useCEOAgent';
import { useCFORiskThreshold } from '@/hooks/useCFOAgent';
import {
  useInitiateDecisionCycle,
  useDepositToTreasury,
  useFetchPrice,
  useScanMarket,
  useAnalyzeRisk,
  useUpdateRiskThreshold,
  useSetCycleInterval,
} from '@/hooks/useContractActions';
import { toast } from '@/components/ui/Toast';

// ─────────────────────────────────────────────────────────────
// TxStatus — inline feedback for contract write actions
// ─────────────────────────────────────────────────────────────
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
    <div className="mt-3 text-sm space-y-1">
      {isPending && (
        <div className="flex items-center gap-2 text-yellow-400">
          <Loader2 size={14} className="animate-spin" />
          <span>Waiting for wallet confirmation…</span>
        </div>
      )}
      {isConfirming && (
        <div className="flex items-center gap-2 text-blue-400">
          <Loader2 size={14} className="animate-spin" />
          <span>Confirming on-chain…</span>
        </div>
      )}
      {isSuccess && txHash && (
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle2 size={14} />
          <span>Transaction confirmed!</span>
          <a
            href={`https://shannon.somnia.network/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-emerald-300 transition-colors"
          >
            View <ExternalLink size={12} />
          </a>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 text-red-400">
          <XCircle size={14} className="mt-0.5 shrink-0" />
          <span className="break-all">{(error as Error).message?.slice(0, 200) ?? 'Transaction failed'}</span>
        </div>
      )}
    </div>
  );
}

type NotificationSettings = {
  email: boolean;
  slack: boolean;
  telegram: boolean;
  urgentOnly: boolean;
};

type SavedSettings = {
  riskThreshold?: number;
  rebalanceInterval?: string;
  notifications?: NotificationSettings;
};

function readSavedSettings(): SavedSettings {
  try {
    const saved = localStorage.getItem('sovereignmind-settings');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function AddressRow({
  label,
  addr,
  copiedField,
  onCopy,
}: {
  label: string;
  addr: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
      <span className="text-xs text-[--color-muted-foreground]">{label}</span>
      <button
        onClick={() => onCopy(addr, label)}
        className="flex items-center gap-1.5 text-xs font-mono text-white/80 hover:text-white transition-colors"
        title="Copy address"
      >
        {truncateAddress(addr)}
        {copiedField === label ? (
          <CheckCircle2 size={12} className="text-emerald-400" />
        ) : (
          <Copy size={12} className="text-white/40" />
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { address, isConnected } = useAccount();

  // ── existing settings state ──
  const [riskThreshold, setRiskThreshold] = useState(() => readSavedSettings().riskThreshold ?? 75);
  const [rebalanceInterval, setRebalanceInterval] = useState(() => readSavedSettings().rebalanceInterval ?? 'daily');
  const [notifications, setNotifications] = useState<NotificationSettings>(() => readSavedSettings().notifications ?? {
    email: true,
    slack: false,
    telegram: true,
    urgentOnly: false
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const intervalOptions = [
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'manual', label: 'Manual Only' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── wallet / contract reads ──
  const { data: treasuryBalance, isLoading: isBalanceLoading } = useTreasuryBalance();
  const { data: agentCount, isLoading: isAgentCountLoading } = useAgentCount();
  const { data: totalDecisions, isLoading: isTotalDecisionsLoading } = useTotalDecisions();

  const { data: onChainRiskThreshold, refetch: refetchRiskThreshold } = useCFORiskThreshold();
  const { data: onChainCycleInterval, refetch: refetchCycleInterval } = useCEOCycleInterval();

  // ── contract write hooks ──
  const decisionCycle = useInitiateDecisionCycle();
  const depositTreasury = useDepositToTreasury();
  const fetchPriceHook = useFetchPrice();
  const scanMarketHook = useScanMarket();
  const analyzeRiskHook = useAnalyzeRisk();

  const updateRiskThresholdHook = useUpdateRiskThreshold();
  const setCycleIntervalHook = useSetCycleInterval();

  // Sync state with on-chain values on load
  useEffect(() => {
    if (onChainRiskThreshold !== undefined) {
      const timer = setTimeout(() => setRiskThreshold(Number(onChainRiskThreshold)), 0);
      return () => clearTimeout(timer);
    }
  }, [onChainRiskThreshold]);

  useEffect(() => {
    if (onChainCycleInterval !== undefined) {
      const seconds = Number(onChainCycleInterval);
      const nextInterval =
        seconds === 3600 ? 'hourly'
        : seconds === 86400 ? 'daily'
        : seconds === 604800 ? 'weekly'
        : 'manual';
      const timer = setTimeout(() => setRebalanceInterval(nextInterval), 0);
      return () => clearTimeout(timer);
    }
  }, [onChainCycleInterval]);

  // Success refetch triggers
  useEffect(() => {
    if (updateRiskThresholdHook.isSuccess) {
      refetchRiskThreshold();
      toast('Risk threshold updated on-chain!', 'success');
    }
  }, [updateRiskThresholdHook.isSuccess, refetchRiskThreshold]);

  useEffect(() => {
    if (setCycleIntervalHook.isSuccess) {
      refetchCycleInterval();
      toast('Cycle interval updated on-chain!', 'success');
    }
  }, [setCycleIntervalHook.isSuccess, refetchCycleInterval]);

  const handleSave = () => {
    const settings = {
      riskThreshold,
      rebalanceInterval,
      notifications,
    };
    localStorage.setItem('sovereignmind-settings', JSON.stringify(settings));
    toast('Settings saved to browser successfully', 'success');
  };

  const handleUpdateRiskThresholdOnChain = () => {
    if (!isConnected) {
      toast('Connect your wallet first', 'warning');
      return;
    }
    updateRiskThresholdHook.updateThreshold(BigInt(riskThreshold));
    toast('Updating risk threshold on-chain…', 'info');
  };

  const handleSetCycleIntervalOnChain = () => {
    if (!isConnected) {
      toast('Connect your wallet first', 'warning');
      return;
    }
    let seconds = 86400;
    if (rebalanceInterval === 'hourly') seconds = 3600;
    else if (rebalanceInterval === 'daily') seconds = 86400;
    else if (rebalanceInterval === 'weekly') seconds = 604800;
    else if (rebalanceInterval === 'manual') seconds = 99999999;

    setCycleIntervalHook.setCycleInterval(BigInt(seconds));
    toast('Updating cycle interval on-chain…', 'info');
  };

  // ── local form state ──
  const [depositAmount, setDepositAmount] = useState('0.01');
  const [priceSymbol, setPriceSymbol] = useState('STT');
  const [priceApiUrl, setPriceApiUrl] = useState('');
  const [priceJsonPath, setPriceJsonPath] = useState('');
  const [scanUrl, setScanUrl] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const FIXED_DECISION_DEPOSIT = parseEther('0.015');

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── helper: address row in status panel ──
  // disabled style helper
  const disabledBtnClass = !isConnected
    ? 'opacity-40 cursor-not-allowed'
    : 'hover:brightness-110 active:scale-[0.98]';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text-primary">System Settings</h1>
          <p className="text-sm text-[--color-muted-foreground] mt-1">
            Configure agent behaviors, risk parameters, and notifications.
          </p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-[--color-agent-ceo] hover:bg-[--color-agent-ceo]/80 text-white rounded-xl font-medium transition-colors"
        >
          <Save size={18} />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Global Risk Threshold */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GlassCard padding="lg" className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-10 h-10 rounded-lg bg-[--color-agent-cfo]/10 flex items-center justify-center text-[--color-agent-cfo]">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Global Risk Threshold</h3>
                <p className="text-xs text-[--color-muted-foreground]">Maximum acceptable risk score before CFO intervention</p>
              </div>
            </div>
            
            <div className="pt-2">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[--color-muted-foreground]">Conservative (0)</span>
                <span className="text-[--color-agent-cfo] font-bold">{riskThreshold}/100</span>
                <span className="text-[--color-muted-foreground]">Aggressive (100)</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={riskThreshold}
                onChange={(e) => setRiskThreshold(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[--color-agent-cfo]"
              />
            </div>

            {/* On-Chain controls */}
            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-[--color-muted-foreground]">On-Chain Value: </span>
                <span className="text-sm font-semibold text-white">
                  {onChainRiskThreshold !== undefined ? `${onChainRiskThreshold}/100` : 'Loading…'}
                </span>
              </div>
              <button
                onClick={handleUpdateRiskThresholdOnChain}
                disabled={!isConnected || updateRiskThresholdHook.isPending || updateRiskThresholdHook.isConfirming}
                className={`px-4 py-2.5 bg-[--color-agent-cfo] hover:bg-[--color-agent-cfo]/80 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {updateRiskThresholdHook.isPending || updateRiskThresholdHook.isConfirming ? (
                  <span className="flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Confirming…</span>
                ) : (
                  'Update On-Chain'
                )}
              </button>
            </div>
            <TxStatus
              isPending={updateRiskThresholdHook.isPending}
              isConfirming={updateRiskThresholdHook.isConfirming}
              isSuccess={updateRiskThresholdHook.isSuccess}
              error={updateRiskThresholdHook.error}
              txHash={updateRiskThresholdHook.txHash}
            />
          </GlassCard>
        </motion.div>

        {/* Rebalance Interval */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <GlassCard padding="lg" className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-10 h-10 rounded-lg bg-[--color-agent-ceo]/10 flex items-center justify-center text-[--color-agent-ceo]">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Rebalance Interval</h3>
                <p className="text-xs text-[--color-muted-foreground]">How often agents evaluate and adjust treasury positions</p>
              </div>
            </div>
            
            <div className="pt-2 relative w-full md:w-1/2" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full p-3 bg-white/5 border border-[--color-border] rounded-xl text-left text-white outline-none focus:border-[--color-agent-ceo] hover:bg-white/10 transition-colors flex justify-between items-center shadow-sm"
              >
                <span>{intervalOptions.find(o => o.value === rebalanceInterval)?.label}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 text-[--color-muted-foreground] ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-20 w-full mt-2 py-2 glass bg-[#0f141b]/95 border border-[--color-border] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
                  >
                    {intervalOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setRebalanceInterval(option.value);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          rebalanceInterval === option.value 
                            ? 'bg-[--color-agent-ceo]/20 text-[--color-agent-ceo-light]' 
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* On-Chain controls */}
            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-[--color-muted-foreground]">On-Chain Value: </span>
                <span className="text-sm font-semibold text-white">
                  {onChainCycleInterval !== undefined 
                    ? Number(onChainCycleInterval) >= 86400 
                      ? `${Number(onChainCycleInterval) / 86400} days` 
                      : `${Number(onChainCycleInterval) / 60} mins` 
                    : 'Loading…'}
                </span>
              </div>
              <button
                onClick={handleSetCycleIntervalOnChain}
                disabled={!isConnected || setCycleIntervalHook.isPending || setCycleIntervalHook.isConfirming}
                className={`px-4 py-2.5 bg-[--color-agent-ceo] hover:bg-[--color-agent-ceo]/80 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {setCycleIntervalHook.isPending || setCycleIntervalHook.isConfirming ? (
                  <span className="flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Confirming…</span>
                ) : (
                  'Update On-Chain'
                )}
              </button>
            </div>
            <TxStatus
              isPending={setCycleIntervalHook.isPending}
              isConfirming={setCycleIntervalHook.isConfirming}
              isSuccess={setCycleIntervalHook.isSuccess}
              error={setCycleIntervalHook.error}
              txHash={setCycleIntervalHook.txHash}
            />
          </GlassCard>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <GlassCard padding="lg" className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-10 h-10 rounded-lg bg-[--color-agent-cmo]/10 flex items-center justify-center text-[--color-agent-cmo]">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Notifications</h3>
                <p className="text-xs text-[--color-muted-foreground]">Manage how you receive alerts from the agent guild</p>
              </div>
            </div>
            
            <div className="pt-2 space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-[--color-agent-cmo] transition-colors">Email Alerts</div>
                  <div className="text-xs text-[--color-muted-foreground]">Receive daily summaries and critical alerts via email</div>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={notifications.email} onChange={(e) => setNotifications({...notifications, email: e.target.checked})} />
                  <div className="block w-10 h-6 rounded-full transition-colors" style={{ backgroundColor: notifications.email ? 'var(--color-agent-cmo)' : '#4a4f58' }}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${notifications.email ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-[--color-agent-cmo] transition-colors">Slack Integration</div>
                  <div className="text-xs text-[--color-muted-foreground]">Send agent decisions to a designated Slack channel</div>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={notifications.slack} onChange={(e) => setNotifications({...notifications, slack: e.target.checked})} />
                  <div className="block w-10 h-6 rounded-full transition-colors" style={{ backgroundColor: notifications.slack ? 'var(--color-agent-cmo)' : '#4a4f58' }}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${notifications.slack ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-[--color-agent-cmo] transition-colors">Telegram Bot</div>
                  <div className="text-xs text-[--color-muted-foreground]">Instant notifications via Telegram</div>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={notifications.telegram} onChange={(e) => setNotifications({...notifications, telegram: e.target.checked})} />
                  <div className="block w-10 h-6 rounded-full transition-colors" style={{ backgroundColor: notifications.telegram ? 'var(--color-agent-cmo)' : '#4a4f58' }}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${notifications.telegram ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </label>
              
              <div className="pt-4 border-t border-white/5">
                 <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <div className="text-sm font-medium text-white">Urgent Alerts Only</div>
                    <div className="text-xs text-[--color-muted-foreground]">Only notify on high-risk events or large transactions</div>
                  </div>
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={notifications.urgentOnly} onChange={(e) => setNotifications({...notifications, urgentOnly: e.target.checked})} />
                    <div className="block w-10 h-6 rounded-full transition-colors" style={{ backgroundColor: notifications.urgentOnly ? '#ef4444' : '#4a4f58' }}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${notifications.urgentOnly ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                </label>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ================================================================ */}
        {/* CONTRACT INTERACTIONS                                            */}
        {/* ================================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4 mt-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Contract Interactions</h2>
              <p className="text-xs text-[--color-muted-foreground]">
                Trigger on-chain actions and monitor contract state
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── System Status Panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <GlassCard padding="lg" className="space-y-5">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-10 h-10 rounded-lg bg-[--color-agent-ceo]/10 flex items-center justify-center text-[--color-agent-ceo]">
                <Server size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">System Status</h3>
                <p className="text-xs text-[--color-muted-foreground]">Wallet connection and contract state overview</p>
              </div>
            </div>

            {/* Wallet */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 text-xs text-[--color-muted-foreground] mb-2">
                  <Wallet size={14} />
                  <span>Connected Wallet</span>
                </div>
                <div className="text-sm font-mono text-white">
                  {isConnected && address ? (
                    <button
                      onClick={() => copyToClipboard(address, 'wallet')}
                      className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
                    >
                      {truncateAddress(address)}
                      {copiedField === 'wallet' ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} className="text-white/40" />}
                    </button>
                  ) : (
                    <span className="text-yellow-400/80 text-xs">Not connected</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 text-xs text-[--color-muted-foreground] mb-2">
                  <DollarSign size={14} />
                  <span>Treasury Balance</span>
                </div>
                <div className="text-sm font-semibold text-white">
                  {isBalanceLoading ? (
                    <Loader2 size={14} className="animate-spin text-white/40" />
                  ) : treasuryBalance !== undefined ? (
                    <>{formatEther(treasuryBalance as bigint)} STT</>
                  ) : (
                    <span className="text-white/30">—</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1 text-xs text-[--color-muted-foreground] mb-1">
                    <Activity size={12} />
                    <span>Agents</span>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {isAgentCountLoading ? (
                      <Loader2 size={14} className="animate-spin text-white/40" />
                    ) : agentCount !== undefined ? (
                      String(agentCount)
                    ) : '—'}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-[--color-muted-foreground] mb-1">
                    <BarChart3 size={12} />
                    <span>Decisions</span>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {isTotalDecisionsLoading ? (
                      <Loader2 size={14} className="animate-spin text-white/40" />
                    ) : totalDecisions !== undefined ? (
                      String(totalDecisions)
                    ) : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Contract Addresses */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-xs text-[--color-muted-foreground] mb-3 font-medium uppercase tracking-wider">
                Deployed Contract Addresses
              </div>
              <AddressRow label="Agent Registry" addr={CONTRACT_ADDRESSES.agentRegistry} copiedField={copiedField} onCopy={copyToClipboard} />
              <AddressRow label="Treasury Vault" addr={CONTRACT_ADDRESSES.treasuryVault} copiedField={copiedField} onCopy={copyToClipboard} />
              <AddressRow label="CEO Agent" addr={CONTRACT_ADDRESSES.ceoAgent} copiedField={copiedField} onCopy={copyToClipboard} />
              <AddressRow label="CFO Agent" addr={CONTRACT_ADDRESSES.cfoAgent} copiedField={copiedField} onCopy={copyToClipboard} />
              <AddressRow label="CMO Agent" addr={CONTRACT_ADDRESSES.cmoAgent} copiedField={copiedField} onCopy={copyToClipboard} />
            </div>
          </GlassCard>
        </motion.div>

        {/* ── Action Buttons Panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <GlassCard padding="lg" className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <ArrowUpCircle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">On-Chain Actions</h3>
                <p className="text-xs text-[--color-muted-foreground]">
                  Execute contract write calls — each action requires a connected wallet
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* ── 1. Initiate Decision Cycle ── */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Zap size={14} className="text-[--color-agent-ceo]" />
                      Initiate Decision Cycle
                    </h4>
                    <p className="text-xs text-[--color-muted-foreground] mt-0.5">
                      Start a new CEO decision round. Sends 0.015 STT to cover oracle fees.
                    </p>
                  </div>
                  <button
                    onClick={() => decisionCycle.initiate(FIXED_DECISION_DEPOSIT)}
                    disabled={!isConnected || decisionCycle.isPending || decisionCycle.isConfirming}
                    className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 ${disabledBtnClass}`}
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}
                  >
                    {decisionCycle.isPending || decisionCycle.isConfirming ? (
                      <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Processing…</span>
                    ) : (
                      'Initiate Cycle'
                    )}
                  </button>
                </div>
                <TxStatus
                  isPending={decisionCycle.isPending}
                  isConfirming={decisionCycle.isConfirming}
                  isSuccess={decisionCycle.isSuccess}
                  error={decisionCycle.error}
                  txHash={decisionCycle.txHash}
                />
              </div>

              {/* ── 2. Deposit to Treasury ── */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                  <DollarSign size={14} className="text-emerald-400" />
                  Deposit to Treasury
                </h4>
                <p className="text-xs text-[--color-muted-foreground] mb-3">
                  Fund the TreasuryVault with native STT tokens.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="Amount in STT"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full p-3 pr-14 bg-white/5 border border-[--color-border] rounded-xl text-white text-sm outline-none focus:border-emerald-500/60 transition-colors placeholder:text-white/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[--color-muted-foreground]">STT</span>
                  </div>
                  <button
                    onClick={() => {
                      if (!depositAmount || Number(depositAmount) <= 0) return;
                      depositTreasury.deposit(parseEther(depositAmount));
                    }}
                    disabled={!isConnected || depositTreasury.isPending || depositTreasury.isConfirming || !depositAmount || Number(depositAmount) <= 0}
                    className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 ${disabledBtnClass}`}
                    style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}
                  >
                    {depositTreasury.isPending || depositTreasury.isConfirming ? (
                      <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Depositing…</span>
                    ) : (
                      'Deposit'
                    )}
                  </button>
                </div>
                <TxStatus
                  isPending={depositTreasury.isPending}
                  isConfirming={depositTreasury.isConfirming}
                  isSuccess={depositTreasury.isSuccess}
                  error={depositTreasury.error}
                  txHash={depositTreasury.txHash}
                />
              </div>

              {/* ── 3. Fetch Price ── */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                  <BarChart3 size={14} className="text-[--color-agent-cfo]" />
                  Fetch Price
                </h4>
                <p className="text-xs text-[--color-muted-foreground] mb-3">
                  Trigger a CFO oracle price fetch for a given symbol.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Symbol (e.g. STT)"
                    value={priceSymbol}
                    onChange={(e) => setPriceSymbol(e.target.value)}
                    className="p-3 bg-white/5 border border-[--color-border] rounded-xl text-white text-sm outline-none focus:border-[--color-agent-cfo]/60 transition-colors placeholder:text-white/20"
                  />
                  <input
                    type="text"
                    placeholder="API URL"
                    value={priceApiUrl}
                    onChange={(e) => setPriceApiUrl(e.target.value)}
                    className="p-3 bg-white/5 border border-[--color-border] rounded-xl text-white text-sm outline-none focus:border-[--color-agent-cfo]/60 transition-colors placeholder:text-white/20"
                  />
                  <input
                    type="text"
                    placeholder="JSON Path (e.g. $.price)"
                    value={priceJsonPath}
                    onChange={(e) => setPriceJsonPath(e.target.value)}
                    className="p-3 bg-white/5 border border-[--color-border] rounded-xl text-white text-sm outline-none focus:border-[--color-agent-cfo]/60 transition-colors placeholder:text-white/20"
                  />
                </div>
                <button
                  onClick={() => {
                    if (!priceSymbol || !priceApiUrl || !priceJsonPath) return;
                    fetchPriceHook.fetchPrice(priceSymbol, priceApiUrl, priceJsonPath, FIXED_DECISION_DEPOSIT);
                  }}
                  disabled={!isConnected || fetchPriceHook.isPending || fetchPriceHook.isConfirming || !priceSymbol || !priceApiUrl || !priceJsonPath}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 ${disabledBtnClass}`}
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}
                >
                  {fetchPriceHook.isPending || fetchPriceHook.isConfirming ? (
                    <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Fetching…</span>
                  ) : (
                    'Fetch Price'
                  )}
                </button>
                <TxStatus
                  isPending={fetchPriceHook.isPending}
                  isConfirming={fetchPriceHook.isConfirming}
                  isSuccess={fetchPriceHook.isSuccess}
                  error={fetchPriceHook.error}
                  txHash={fetchPriceHook.txHash}
                />
              </div>

              {/* ── 4. Scan Market ── */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                  <Search size={14} className="text-[--color-agent-cmo]" />
                  Scan Market
                </h4>
                <p className="text-xs text-[--color-muted-foreground] mb-3">
                  Trigger a CMO market scan for the given data source URL.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Data source URL"
                    value={scanUrl}
                    onChange={(e) => setScanUrl(e.target.value)}
                    className="flex-1 p-3 bg-white/5 border border-[--color-border] rounded-xl text-white text-sm outline-none focus:border-[--color-agent-cmo]/60 transition-colors placeholder:text-white/20"
                  />
                  <button
                    onClick={() => {
                      if (!scanUrl) return;
                      scanMarketHook.scanMarket(scanUrl, FIXED_DECISION_DEPOSIT);
                    }}
                    disabled={!isConnected || scanMarketHook.isPending || scanMarketHook.isConfirming || !scanUrl}
                    className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 ${disabledBtnClass}`}
                    style={{ background: 'linear-gradient(135deg, #06b6d4, #22d3ee)' }}
                  >
                    {scanMarketHook.isPending || scanMarketHook.isConfirming ? (
                      <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Scanning…</span>
                    ) : (
                      'Scan Market'
                    )}
                  </button>
                </div>
                <TxStatus
                  isPending={scanMarketHook.isPending}
                  isConfirming={scanMarketHook.isConfirming}
                  isSuccess={scanMarketHook.isSuccess}
                  error={scanMarketHook.error}
                  txHash={scanMarketHook.txHash}
                />
              </div>

              {/* ── 5. Analyze Risk ── */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-400" />
                      Analyze Risk
                    </h4>
                    <p className="text-xs text-[--color-muted-foreground] mt-0.5">
                      Trigger CFO risk analysis across treasury positions. Sends 0.015 STT.
                    </p>
                  </div>
                  <button
                    onClick={() => analyzeRiskHook.analyzeRisk(FIXED_DECISION_DEPOSIT)}
                    disabled={!isConnected || analyzeRiskHook.isPending || analyzeRiskHook.isConfirming}
                    className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 ${disabledBtnClass}`}
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}
                  >
                    {analyzeRiskHook.isPending || analyzeRiskHook.isConfirming ? (
                      <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Analyzing…</span>
                    ) : (
                      'Analyze Risk'
                    )}
                  </button>
                </div>
                <TxStatus
                  isPending={analyzeRiskHook.isPending}
                  isConfirming={analyzeRiskHook.isConfirming}
                  isSuccess={analyzeRiskHook.isSuccess}
                  error={analyzeRiskHook.error}
                  txHash={analyzeRiskHook.txHash}
                />
              </div>
            </div>

            {/* Wallet not connected warning */}
            {!isConnected && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-yellow-400/80 text-xs">
                <AlertTriangle size={16} className="shrink-0" />
                <span>Connect your wallet to enable on-chain actions.</span>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
