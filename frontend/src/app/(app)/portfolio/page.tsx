'use client';

// ============================================================
// Portfolio Page — Vault shares invest, withdraw and allocation
// ============================================================

import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  Percent,
  CircleDollarSign,
  TrendingDown,
  Info,
  Loader2,
  CheckCircle2,
  Coins,
  ShieldAlert,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import MetricCard from '@/components/ui/MetricCard';
import Skeleton, { SkeletonMetric, SkeletonTable } from '@/components/ui/Skeleton';
import { formatSTT, formatCompact } from '@/lib/constants';
import {
  useSharePrice,
  useTotalPortfolioValue,
  useVaultTotalSupply,
  useUserShares,
  useVaultStats,
  usePortfolioAllocation,
  useVaultDeposit,
  useVaultWithdraw,
} from '@/hooks/useVaultShares';
import { contracts } from '@/lib/somnia/contracts';

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<'invest' | 'withdraw'>('invest');
  const [investAmount, setInvestAmount] = useState('10');
  const [withdrawShares, setWithdrawShares] = useState('10');

  const { address, isConnected } = useAccount();

  const vaultSharesAddress = contracts.vaultShares.address || undefined;
  const isDeployed = !!vaultSharesAddress;

  // Read User STT Balance
  const { data: sttBalanceData, refetch: refetchSttBalance } = useBalance({
    address,
  });

  // Read Hooks from VaultShares
  const { data: sharePrice, refetch: refetchSharePrice } = useSharePrice();
  const { data: totalValue, refetch: refetchTotalValue } = useTotalPortfolioValue();
  const { data: totalSupply, refetch: refetchTotalSupply } = useVaultTotalSupply();
  const { data: userShares, refetch: refetchUserShares } = useUserShares(address);
  const { deposited, withdrawn, depositCount, withdrawCount } = useVaultStats();
  const { data: allocation, refetch: refetchAllocation } = usePortfolioAllocation();

  // Write Hooks
  const vaultDeposit = useVaultDeposit();
  const vaultWithdraw = useVaultWithdraw();

  // Refresh all data on success
  useEffect(() => {
    if (vaultDeposit.isSuccess || vaultWithdraw.isSuccess) {
      refetchSttBalance();
      refetchSharePrice();
      refetchTotalValue();
      refetchTotalSupply();
      refetchUserShares();
      refetchAllocation();
      deposited.refetch();
      withdrawn.refetch();
      depositCount.refetch();
      withdrawCount.refetch();
    }
  }, [vaultDeposit.isSuccess, vaultWithdraw.isSuccess]);

  // Compute User values
  const formattedUserShares = userShares ? formatEther(userShares) : '0';
  const formattedSharePrice = sharePrice ? formatEther(sharePrice) : '1';
  
  const userPortfolioValue = userShares && sharePrice
    ? (userShares * sharePrice) / parseEther('1')
    : BigInt(0);
  const formattedUserPortfolioValue = formatEther(userPortfolioValue);

  // Handle Action Max click
  const handleMaxInvest = () => {
    if (sttBalanceData) {
      const balance = Number(sttBalanceData.formatted);
      // Keep a small buffer for gas
      const max = Math.max(0, balance - 0.1);
      setInvestAmount(max.toFixed(4));
    }
  };

  const handleMaxWithdraw = () => {
    if (userShares) {
      setWithdrawShares(formatEther(userShares));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text-primary">Autonomous Portfolio</h1>
          <p className="text-sm text-[--color-muted-foreground] mt-1">
            Invest STT, receive Vault Shares, and let AI agents manage your exposure to crypto assets 24/7.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[--color-muted-foreground] bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Vault: {vaultSharesAddress ? `${vaultSharesAddress.slice(0, 6)}...${vaultSharesAddress.slice(-4)}` : 'Not Configured'}
        </div>
      </div>

      {/* Grid containing Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Share Price"
          value={`${Number(formattedSharePrice).toFixed(4)} STT`}
          change={sharePrice && sharePrice > parseEther('1') ? ((Number(formattedSharePrice) - 1) * 100) : 0}
          icon={<Coins size={22} />}
          accentColor="#3b82f6"
          delay={0}
        />
        <MetricCard
          label="Your Portfolio Value"
          value={`${Number(formattedUserPortfolioValue).toFixed(2)} STT`}
          icon={<Wallet size={22} />}
          accentColor="#8b5cf6"
          delay={0.1}
        />
        <MetricCard
          label="Total Portfolio Value (AUM)"
          value={`${totalValue ? Number(formatEther(totalValue)).toFixed(2) : '0.00'} STT`}
          icon={<CircleDollarSign size={22} />}
          accentColor="#06b6d4"
          delay={0.2}
        />
        <MetricCard
          label="Your Share Balance"
          value={`${Number(formattedUserShares).toFixed(2)} smVAULT`}
          icon={<Percent size={22} />}
          accentColor="#10b981"
          delay={0.3}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Portfolio Allocation & Holdings */}
        <div className="lg:col-span-2 space-y-6">
          
          <h2 className="text-lg font-semibold text-[--color-foreground]">Vault Asset Allocation</h2>
          <GlassCard padding="sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[--color-border]/50">
                    <th className="text-left text-xs font-semibold text-[--color-muted-foreground] px-4 py-3">Asset</th>
                    <th className="text-right text-xs font-semibold text-[--color-muted-foreground] px-4 py-3 hidden sm:table-cell">On-Chain Balance</th>
                    <th className="text-right text-xs font-semibold text-[--color-muted-foreground] px-4 py-3">Current Value</th>
                    <th className="text-right text-xs font-semibold text-[--color-muted-foreground] px-4 py-3">Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {allocation && allocation[0].length > 0 ? (
                    allocation[0].map((symbol: string, index: number) => {
                      const value = allocation[1][index];
                      const percentage = allocation[2][index];
                      const symbolUpper = symbol.toUpperCase();
                      const isSTT = symbol === 'STT';

                      // Aesthetic colors for synthetic tokens
                      const colorMap: Record<string, string> = {
                        STT: '#3b82f6',
                        BITCOIN: '#f7931a',
                        ETHEREUM: '#627eea',
                        SOLANA: '#14f195',
                      };
                      const color = colorMap[symbolUpper] || '#a78bfa';

                      return (
                        <tr key={symbol} className="border-b border-[--color-border]/20 hover:bg-white/[0.01] transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ backgroundColor: color }}
                              >
                                {isSTT ? 'STT' : symbol.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{isSTT ? 'Somnia Token' : `Synthetic ${symbolUpper.charAt(0) + symbol.slice(1)}`}</p>
                                <p className="text-xs text-[--color-muted-foreground] font-mono">{isSTT ? 'Native Gas' : `s${symbolUpper.slice(0, 3)}`}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-right px-4 py-4 font-mono text-sm text-[--color-muted-foreground] hidden sm:table-cell">
                            {isSTT ? '-' : Number(formatEther(value)).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                          </td>
                          <td className="text-right px-4 py-4 font-mono text-sm text-white font-medium">
                            {formatSTT(Number(formatEther(value)))}
                          </td>
                          <td className="text-right px-4 py-4">
                            <div className="flex items-center gap-2 justify-end">
                              <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden hidden sm:block">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    backgroundColor: color,
                                    width: `${Number(percentage) / 100}%`
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium font-mono text-white">
                                {(Number(percentage) / 100).toFixed(2)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-sm text-[--color-muted-foreground]">
                        No active portfolio allocation. Invest STT to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Education & Info panel */}
          <GlassCard padding="md" glow="violet" hover={false}>
            <div className="flex gap-4">
              <div className="p-3 bg-violet-500/10 rounded-2xl text-violet-400 self-start">
                <BookOpen size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-md font-bold text-white">How does the &quot;Robo Investment Manager&quot; work?</h3>
                <p className="text-sm text-[--color-muted-foreground] leading-relaxed">
                  SovereignMind utilizes Somnia Agent Runner&apos;s native on-chain intelligence primitives. The CMO monitors the market and the CFO analyzes financial risk 24/7. When a decision cycle is triggered, the CEO Agent formulates the optimal portfolio rebalancing strategy.
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[--color-muted-foreground] font-medium pt-2">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    100% On-Chain Execution
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    Transparent Risk Management
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    Zero Third-Party Custody
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

        </div>

        {/* Right column: Action Panel (Deposit/Withdraw Form) */}
        <div>
          <h2 className="text-lg font-semibold text-[--color-foreground] mb-4">Manage Investment</h2>
          <GlassCard padding="none" hover={false} className="overflow-hidden">
            
            {/* Tabs */}
            <div className="flex border-b border-white/5 bg-white/[0.02]">
              <button
                onClick={() => setActiveTab('invest')}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeTab === 'invest'
                    ? 'border-emerald-500 text-white bg-white/[0.01]'
                    : 'border-transparent text-[--color-muted-foreground] hover:text-white'
                }`}
              >
                <ArrowDownToLine size={16} />
                Invest
              </button>
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeTab === 'withdraw'
                    ? 'border-blue-500 text-white bg-white/[0.01]'
                    : 'border-transparent text-[--color-muted-foreground] hover:text-white'
                }`}
              >
                <ArrowUpFromLine size={16} />
                Withdraw
              </button>
            </div>

            {/* Form body */}
            <div className="p-6 space-y-4">
              <AnimatePresence mode="wait">
                {activeTab === 'invest' ? (
                  <motion.div
                    key="invest"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[--color-muted-foreground] font-medium">Invest Asset</span>
                      <span className="text-[--color-muted-foreground] font-mono">
                        Balance: {sttBalanceData ? `${Number(sttBalanceData.formatted).toFixed(4)} STT` : '0 STT'}
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="0.00"
                        value={investAmount}
                        onChange={(e) => setInvestAmount(e.target.value)}
                        className="w-full p-4 pr-24 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-semibold font-mono outline-none focus:border-emerald-500/60 transition-colors placeholder:text-white/20"
                        disabled={vaultDeposit.isPending || vaultDeposit.isConfirming}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button
                          onClick={handleMaxInvest}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs font-semibold text-white transition-all"
                        >
                          MAX
                        </button>
                        <span className="text-sm font-bold text-[--color-muted-foreground] font-mono">STT</span>
                      </div>
                    </div>

                    {/* Investment Quote Info */}
                    {investAmount && Number(investAmount) > 0 && sharePrice && (
                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5 text-xs text-[--color-muted-foreground]">
                        <div className="flex justify-between">
                          <span>Est. Shares Minted:</span>
                          <span className="font-mono text-white font-medium">
                            {(Number(investAmount) / Number(formattedSharePrice)).toFixed(4)} smVAULT
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Share Price:</span>
                          <span className="font-mono text-white">{Number(formattedSharePrice).toFixed(4)} STT</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        if (!investAmount || Number(investAmount) <= 0) return;
                        vaultDeposit.deposit(parseEther(investAmount));
                      }}
                      disabled={
                        !isConnected ||
                        vaultDeposit.isPending ||
                        vaultDeposit.isConfirming ||
                        !investAmount ||
                        Number(investAmount) <= 0
                      }
                      className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}
                    >
                      {vaultDeposit.isPending || vaultDeposit.isConfirming ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Processing Investment...
                        </>
                      ) : !isConnected ? (
                        'Connect Wallet to Invest'
                      ) : (
                        <>
                          Buy Shares
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>

                    {/* Tx Hash & Error Displays */}
                    {vaultDeposit.txHash && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                        <span className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                          <CheckCircle2 size={14} /> Investment transaction submitted!
                        </span>
                        <a
                          href={`https://shannon.somnia.network/tx/${vaultDeposit.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-emerald-400/80 hover:text-emerald-300 underline mt-1 block font-mono"
                        >
                          View: {vaultDeposit.txHash.slice(0, 16)}...
                        </a>
                      </div>
                    )}
                    {vaultDeposit.error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 break-all font-mono">
                        {(vaultDeposit.error as Error).message?.slice(0, 100)}...
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="withdraw"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[--color-muted-foreground] font-medium">Redeem Shares</span>
                      <span className="text-[--color-muted-foreground] font-mono">
                        Available: {Number(formattedUserShares).toFixed(4)} smVAULT
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="0.00"
                        value={withdrawShares}
                        onChange={(e) => setWithdrawShares(e.target.value)}
                        className="w-full p-4 pr-28 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-semibold font-mono outline-none focus:border-blue-500/60 transition-colors placeholder:text-white/20"
                        disabled={vaultWithdraw.isPending || vaultWithdraw.isConfirming}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button
                          onClick={handleMaxWithdraw}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs font-semibold text-white transition-all"
                        >
                          MAX
                        </button>
                        <span className="text-sm font-bold text-[--color-muted-foreground] font-mono">SHARES</span>
                      </div>
                    </div>

                    {/* Withdraw Quote Info */}
                    {withdrawShares && Number(withdrawShares) > 0 && sharePrice && (
                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5 text-xs text-[--color-muted-foreground]">
                        <div className="flex justify-between">
                          <span>Est. STT Received:</span>
                          <span className="font-mono text-white font-medium">
                            {(Number(withdrawShares) * Number(formattedSharePrice)).toFixed(4)} STT
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Withdraw Value:</span>
                          <span className="font-mono text-white">~ ${formatCompact(Number(withdrawShares) * Number(formattedSharePrice))} USD</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        if (!withdrawShares || Number(withdrawShares) <= 0) return;
                        vaultWithdraw.withdraw(parseEther(withdrawShares));
                      }}
                      disabled={
                        !isConnected ||
                        vaultWithdraw.isPending ||
                        vaultWithdraw.isConfirming ||
                        !withdrawShares ||
                        Number(withdrawShares) <= 0
                      }
                      className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}
                    >
                      {vaultWithdraw.isPending || vaultWithdraw.isConfirming ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Processing Redemption...
                        </>
                      ) : !isConnected ? (
                        'Connect Wallet to Withdraw'
                      ) : (
                        <>
                          Withdraw STT
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>

                    {/* Tx Hash & Error Displays */}
                    {vaultWithdraw.txHash && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                        <span className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                          <CheckCircle2 size={14} /> Withdraw transaction submitted!
                        </span>
                        <a
                          href={`https://shannon.somnia.network/tx/${vaultWithdraw.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-emerald-400/80 hover:text-emerald-300 underline mt-1 block font-mono"
                        >
                          View: {vaultWithdraw.txHash.slice(0, 16)}...
                        </a>
                      </div>
                    )}
                    {vaultWithdraw.error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 break-all font-mono">
                        {(vaultWithdraw.error as Error).message?.slice(0, 100)}...
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Caution Info footer */}
            <div className="p-4 bg-yellow-500/[0.03] border-t border-white/5 flex items-start gap-3">
              <ShieldAlert className="text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-[10px] text-[--color-muted-foreground] leading-normal">
                SovereignMind is a DeFi proof-of-concept. Redemptions trigger on-chain auto-liquidation of synthetic tokens as necessary. Exposure and performance reflect market pricing but do not represent actual asset delivery.
              </p>
            </div>

          </GlassCard>
        </div>

      </div>
    </div>
  );
}
