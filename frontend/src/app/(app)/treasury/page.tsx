'use client';

// ============================================================
// Treasury Page — Vault overview and management
// ============================================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowDownToLine,
  ExternalLink,
  Shield,
  PieChart,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Skeleton, { SkeletonMetric, SkeletonTable } from '@/components/ui/Skeleton';
import MetricCard from '@/components/ui/MetricCard';
import AllocationChart from '@/components/treasury/AllocationChart';
import TransactionList from '@/components/treasury/TransactionList';
import { mockTreasury, mockTransactions } from '@/lib/mock-data';
import { formatUSD, formatCompact } from '@/lib/constants';
import { toast } from '@/components/ui/Toast';

export default function TreasuryPage() {
  const treasury = mockTreasury;
  const [isLoading, setIsLoading] = useState(true);

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
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => toast('Deposit functionality will be available after contract deployment', 'info')}
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
          value={formatUSD(treasury.totalValue)}
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
          label="Stablecoin Reserve"
          value={`${treasury.holdings
            .filter((h) => h.symbol === 'USDC')
            .reduce((sum, h) => sum + h.allocation, 0)
            .toFixed(1)}%`}
          icon={<Shield size={22} />}
          accentColor="#10b981"
          delay={0.2}
        />
        <MetricCard
          label="Transactions"
          value={mockTransactions.length.toString()}
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
                        <span className="text-sm text-[--color-foreground]">
                          {formatUSD(holding.price)}
                        </span>
                      </td>
                      <td className="text-right px-4 py-4">
                        <span className="text-sm font-medium text-[--color-foreground]">
                          {formatUSD(holding.value)}
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
        <h2 className="text-lg font-semibold text-[--color-foreground] mb-4">
          Recent Transactions
        </h2>
        <GlassCard>
          <TransactionList transactions={mockTransactions} />
        </GlassCard>
      </div>
    </div>
  );
}
