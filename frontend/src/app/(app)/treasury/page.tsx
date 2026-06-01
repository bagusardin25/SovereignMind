'use client';

// ============================================================
// Treasury Page — Vault overview and management
// ============================================================

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useTreasuryData } from '@/hooks/useTreasuryData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowDownToLine,
  ExternalLink,
  Shield,
  PieChart,
  Download,
  Search,
  Filter,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { parseEther } from 'viem';
import { useDepositToTreasury } from '@/hooks/useContractActions';
import { downloadCSV } from '@/lib/exportUtils';
import GlassCard from '@/components/ui/GlassCard';
import Skeleton, { SkeletonMetric, SkeletonTable } from '@/components/ui/Skeleton';
import MetricCard from '@/components/ui/MetricCard';
import AllocationChart from '@/components/treasury/AllocationChart';
import TransactionList from '@/components/treasury/TransactionList';
import { formatSTT } from '@/lib/constants';
import { toast } from '@/components/ui/Toast';

export default function TreasuryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const { isConnected } = useAccount();

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('0.01');
  const depositTreasury = useDepositToTreasury();

  // Composite on-chain treasury data
  const { treasury, transactions, totalOperations } = useTreasuryData();

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== 'All' && tx.type.toLowerCase() !== filterType.toLowerCase()) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        tx.token.toLowerCase().includes(q) ||
        tx.txHash.toLowerCase().includes(q) ||
        tx.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Page Title Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton width="180px" height="28px" className="mb-2" />
            <Skeleton width="340px" height="14px" />
          </div>
          <Skeleton width="100px" height="40px" className="rounded-xl" />
        </div>

        {/* Metrics Row Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonMetric key={i} />
          ))}
        </div>

        {/* Holdings Table + Allocation Chart Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton width="140px" height="20px" className="mb-4" />
            <div className="glass rounded-2xl p-6">
              <SkeletonTable rows={4} />
            </div>
          </div>
          <div>
            <Skeleton width="160px" height="20px" className="mb-4" />
            <div className="glass rounded-2xl p-6 flex flex-col items-center gap-4">
              <Skeleton width="220px" height="220px" className="rounded-full" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} width="100%" height="14px" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Skeleton */}
        <div>
          <Skeleton width="180px" height="20px" className="mb-4" />
          <div className="glass rounded-2xl p-6">
            <SkeletonTable rows={5} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text-primary">Treasury Vault</h1>
          <p className="text-sm text-[--color-muted-foreground] mt-1">
            On-chain treasury managed by your autonomous agent guild
          </p>
        </div>
        <motion.button
          onClick={() => setIsDepositModalOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[--color-success]/10 border border-[--color-success]/20 text-[--color-success] text-sm font-medium hover:bg-[--color-success]/20 transition-all"
          style={{ animation: 'subtle-pulse 3s ease-in-out infinite' }}
        >
          <ArrowDownToLine size={16} />
          Deposit
          <style>{`
            @keyframes subtle-pulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
              50% { box-shadow: 0 0 12px 2px rgba(16, 185, 129, 0.15); }
            }
          `}</style>
        </motion.button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Value"
          value={`${treasury.totalValue.toFixed(4)} STT`}
          change={treasury.change24h}
          icon={<Wallet size={22} />}
          accentColor="#3b82f6"
          delay={0}
        />
        <MetricCard
          label="Holdings"
          value={`${treasury.holdings.length} Tokens`}
          icon={<PieChart size={22} />}
          accentColor="#8b5cf6"
          delay={0.1}
        />
        <MetricCard
          label="Native Reserve"
          value={treasury.totalValue > 0 ? '100%' : '0%'}
          icon={<Shield size={22} />}
          accentColor="#10b981"
          delay={0.2}
        />
        <MetricCard
          label="Transactions"
          value={totalOperations.toString()}
          icon={<TrendingUp size={22} />}
          accentColor="#06b6d4"
          delay={0.3}
        />
      </div>

      {/* Main Content: Holdings + Allocation Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Holdings Table */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-[--color-foreground] mb-4">Token Holdings</h2>
          <GlassCard padding="sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[--color-border]">
                    <th className="text-left text-xs font-medium text-[--color-muted] px-4 py-3">
                      Token
                    </th>
                    <th className="text-right text-xs font-medium text-[--color-muted] px-4 py-3">
                      Balance
                    </th>
                    <th className="text-right text-xs font-medium text-[--color-muted] px-4 py-3">
                      Price
                    </th>
                    <th className="text-right text-xs font-medium text-[--color-muted] px-4 py-3">
                      Value
                    </th>
                    <th className="text-right text-xs font-medium text-[--color-muted] px-4 py-3">
                      24h
                    </th>
                    <th className="text-right text-xs font-medium text-[--color-muted] px-4 py-3">
                      Allocation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {treasury.holdings.map((holding, index) => (
                    <motion.tr
                      key={holding.symbol}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.08 }}
                      className="border-b border-[--color-border]/50 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {holding.iconUrl ? (
                            <img
                              src={holding.iconUrl}
                              alt={holding.symbol}
                              className="w-8 h-8 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: holding.color }}
                            >
                              {holding.symbol.slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-[--color-foreground]">
                              {holding.symbol}
                            </p>
                            <p className="text-xs text-[--color-muted]">{holding.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right px-4 py-4">
                        <span className="text-sm font-mono text-[--color-foreground]">
                          {holding.balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="text-right px-4 py-4">
                        <span className="text-sm text-[--color-muted-foreground] italic">
                          Native
                        </span>
                      </td>
                      <td className="text-right px-4 py-4">
                        <span className="text-sm font-medium text-[--color-foreground]">
                          {formatSTT(holding.value)}
                        </span>
                      </td>
                      <td className="text-right px-4 py-4">
                        <div className="flex items-center gap-1 justify-end">
                          {holding.change24h > 0 ? (
                            <TrendingUp size={12} className="text-[--color-success]" />
                          ) : holding.change24h < 0 ? (
                            <TrendingDown size={12} className="text-[--color-error]" />
                          ) : null}
                          <span
                            className={`text-sm font-medium ${
                              holding.change24h > 0
                                ? 'text-[--color-success]'
                                : holding.change24h < 0
                                ? 'text-[--color-error]'
                                : 'text-[--color-muted]'
                            }`}
                          >
                            {holding.change24h > 0 ? '+' : ''}
                            {holding.change24h.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="text-right px-4 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: holding.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${holding.allocation}%` }}
                              transition={{ duration: 0.8, delay: index * 0.1 }}
                            />
                          </div>
                          <span className="text-xs text-[--color-muted] w-10 text-right">
                            {holding.allocation.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Allocation Chart */}
        <div>
          <h2 className="text-lg font-semibold text-[--color-foreground] mb-4">
            Portfolio Allocation
          </h2>
          <GlassCard>
            <AllocationChart
              holdings={treasury.holdings}
              totalValue={treasury.totalValue}
              size={220}
            />
          </GlassCard>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <h2 className="text-lg font-semibold text-[--color-foreground]">
            Recent Transactions
          </h2>
          <button
            onClick={() => {
              const headers = ['ID', 'Type', 'Token', 'Amount', 'Value (USD)', 'Hash', 'Timestamp'];
              const data = filteredTransactions.map((tx) => [
                tx.id,
                tx.type,
                tx.token,
                tx.amount,
                tx.value,
                tx.txHash,
                new Date(tx.timestamp).toISOString(),
              ]);
              downloadCSV('transactions.csv', headers, data);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/5 border border-[--color-border] hover:bg-white/10 text-[--color-foreground] transition-colors"
          >
            <Download size={16} className="text-[--color-muted]" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <GlassCard padding="md" className="mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-muted]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.03] border border-[--color-border] text-sm text-[--color-foreground] placeholder:text-[--color-muted] focus:outline-none focus:border-[--color-agent-ceo]/50 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[--color-muted]" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent border border-[--color-border] rounded-lg px-3 py-1.5 text-sm text-[--color-foreground] focus:outline-none focus:border-[--color-agent-ceo]/50 [&>option]:bg-[#0f111a]"
              >
                <option value="All">All</option>
                <option value="Deposit">Deposit</option>
                <option value="Rebalance">Rebalance</option>
                <option value="Withdrawal">Withdrawal</option>
              </select>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <TransactionList transactions={filteredTransactions} />
        </GlassCard>
      </div>

      {/* Deposit Modal */}
      <AnimatePresence>
        {isDepositModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !depositTreasury.isPending && !depositTreasury.isConfirming && setIsDepositModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass p-6 rounded-2xl shadow-2xl border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <ArrowDownToLine className="text-emerald-400" />
                  Deposit to Treasury
                </h3>
                <button
                  onClick={() => setIsDepositModalOpen(false)}
                  disabled={depositTreasury.isPending || depositTreasury.isConfirming}
                  className="text-white/50 hover:text-white transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-[--color-muted-foreground] mb-6">
                Fund the Treasury Vault with native STT tokens. These funds will be managed by the CFO agent.
              </p>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="Amount in STT"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full p-4 pr-16 bg-white/5 border border-white/10 rounded-xl text-white text-lg outline-none focus:border-emerald-500/60 transition-colors placeholder:text-white/20"
                    disabled={depositTreasury.isPending || depositTreasury.isConfirming}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[--color-muted-foreground]">
                    STT
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (!depositAmount || Number(depositAmount) <= 0) return;
                    depositTreasury.deposit(parseEther(depositAmount));
                  }}
                  disabled={
                    !isConnected ||
                    depositTreasury.isPending ||
                    depositTreasury.isConfirming ||
                    !depositAmount ||
                    Number(depositAmount) <= 0
                  }
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}
                >
                  {depositTreasury.isPending || depositTreasury.isConfirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Processing...
                    </span>
                  ) : !isConnected ? (
                    'Connect Wallet to Deposit'
                  ) : (
                    'Confirm Deposit'
                  )}
                </button>

                {/* Transaction Status */}
                {(depositTreasury.isSuccess || depositTreasury.error) && (
                  <div className={`p-4 rounded-xl text-sm mt-4 ${depositTreasury.isSuccess ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {depositTreasury.isSuccess ? (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <CheckCircle2 size={24} className="text-emerald-400" />
                        <span className="font-medium">Deposit Successful!</span>
                        <a
                          href={`https://shannon.somnia.network/tx/${depositTreasury.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline underline-offset-2 hover:text-emerald-300 transition-colors"
                        >
                          View on Explorer
                        </a>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="font-medium">Transaction Failed</span>
                        <p className="text-xs opacity-80 mt-1 break-all">
                          {(depositTreasury.error as Error).message?.slice(0, 100)}...
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
