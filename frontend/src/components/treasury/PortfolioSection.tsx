'use client';

// ============================================================
// PortfolioSection — Synthetic Portfolio VaultShares UI (v4)
// ============================================================
// Shows real on-chain data from VaultShares contract.
// Gracefully handles the "not deployed" state (empty addresses).

import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import {
  Landmark,
  TrendingUp,
  Layers,
  Coins,
  ArrowUpFromLine,
} from 'lucide-react';
import { formatEther } from 'viem';
import GlassCard from '@/components/ui/GlassCard';
import { contracts } from '@/lib/somnia/contracts';
import {
  useSharePrice,
  useTotalPortfolioValue,
  useVaultTotalSupply,
  useUserShares,
  usePortfolioAllocation,
} from '@/hooks/useVaultShares';

export default function PortfolioSection() {
  const { address, isConnected } = useAccount();
  const isDeployed = !!contracts.vaultShares.address;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Landmark size={20} className="text-[--color-primary]" />
        <h2 className="text-lg font-semibold text-[--color-foreground]">
          Synthetic Portfolio (v4)
        </h2>
      </div>

      <GlassCard padding="md">
        {!isDeployed ? (
          <NotDeployedNotice />
        ) : (
          <PortfolioContent address={address} isConnected={isConnected} />
        )}
      </GlassCard>
    </div>
  );
}

function NotDeployedNotice() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Layers size={48} className="text-white/10 mb-4" />
      <p className="text-sm font-medium text-[--color-muted-foreground] mb-1">
        Synthetic Portfolio System
      </p>
      <p className="text-xs text-[--color-muted] max-w-md">
        Deploy v4 contracts to enable on-chain synthetic asset trading,
        vault shares, and portfolio management.
      </p>
      <div className="mt-4 flex flex-col items-center gap-1">
        <code className="text-xs bg-white/5 px-3 py-1.5 rounded-lg font-mono text-[--color-primary]">
          npx hardhat run scripts/deploy-v4-addon.ts --network somnia
        </code>
        <p className="text-[10px] text-[--color-muted] mt-1">
          Requires STT for gas — run from contracts/ directory
        </p>
      </div>
    </div>
  );
}

function PortfolioContent({
  address,
  isConnected,
}: {
  address: `0x${string}` | undefined;
  isConnected: boolean;
}) {
  const { data: sharePrice } = useSharePrice();
  const { data: totalValue } = useTotalPortfolioValue();
  const { data: totalSupply } = useVaultTotalSupply();
  const { data: userShares } = useUserShares(address);
  const { data: allocation } = usePortfolioAllocation();

  const tvlNum = totalValue ? parseFloat(formatEther(totalValue)) : 0;
  const sharePriceNum = sharePrice ? parseFloat(formatEther(sharePrice)) : 0;
  const supplyNum = totalSupply ? parseFloat(formatEther(totalSupply)) : 0;
  const userSharesNum = userShares ? parseFloat(formatEther(userShares)) : 0;
  const userValue = userSharesNum * sharePriceNum;

  const [symbols, values, percentages] = allocation ?? [[], [], []];

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricBox label="TVL" value={`${tvlNum.toFixed(4)} STT`} icon={<Coins size={16} />} />
        <MetricBox label="Share Price" value={`${sharePriceNum.toFixed(4)} STT`} icon={<TrendingUp size={16} />} />
        <MetricBox label="Total Supply" value={supplyNum.toFixed(4)} icon={<Layers size={16} />} />
        <MetricBox
          label="Your Value"
          value={isConnected ? `${userValue.toFixed(4)} STT` : '—'}
          icon={<Landmark size={16} />}
        />
      </div>

      {/* Portfolio Allocation */}
      {symbols.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[--color-muted-foreground] uppercase tracking-wider mb-3">
            Portfolio Allocation
          </p>
          <div className="space-y-2">
            {symbols.map((sym: string, i: number) => {
              const val = values[i] ? parseFloat(formatEther(values[i])) : 0;
              const pct = percentages[i] ? Number(percentages[i]) : 0;
              return (
                <motion.div
                  key={sym}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.03]"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[--color-primary]" />
                    <span className="text-sm text-[--color-foreground]">{sym}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono text-[--color-muted-foreground]">
                      {val.toFixed(4)}
                    </span>
                    <span className="text-xs font-medium text-[--color-foreground] w-12 text-right">
                      {pct}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* No allocation state */}
      {symbols.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-[--color-muted]">No portfolio allocation data yet.</p>
          <p className="text-xs text-[--color-muted] mt-1">
            Deposit STT to start building your synthetic portfolio.
          </p>
        </div>
      )}

      {/* User shares info */}
      {isConnected && userSharesNum > 0 && (
        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.05]">
          <div className="flex items-center gap-2">
            <ArrowUpFromLine size={14} className="text-[--color-primary]" />
            <span className="text-sm text-[--color-foreground]">Your Shares</span>
          </div>
          <span className="text-sm font-mono font-medium text-[--color-foreground]">
            {userSharesNum.toFixed(4)} smVAULT
          </span>
        </div>
      )}
    </div>
  );
}

function MetricBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.03]">
      <div className="flex items-center gap-1.5 text-[--color-muted]">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-semibold font-mono text-[--color-foreground]">{value}</span>
    </div>
  );
}
