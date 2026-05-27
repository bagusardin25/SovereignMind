'use client';

// ============================================================
// SovereignMind — Chain Badge
// Pill indicator showing connected/target chain with pulsing dot.
// ============================================================

import { useAccount, useChainId } from 'wagmi';
import { somniaTestnet } from '@/lib/wagmi-config';

interface ChainBadgeProps {
  /** Force a compact rendering (icon + dot only) */
  compact?: boolean;
  className?: string;
}

export default function ChainBadge({ compact = false, className = '' }: ChainBadgeProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const onCorrectChain = chainId === somniaTestnet.id;
  // We treat Somnia as "live" indicator regardless of wallet state — it's a network status badge.
  const dotColor = !isConnected
    ? 'bg-[var(--color-primary)]'
    : onCorrectChain
      ? 'bg-emerald-400'
      : 'bg-amber-400';

  const dotGlow = !isConnected
    ? 'shadow-[0_0_10px_var(--color-primary)]'
    : onCorrectChain
      ? 'shadow-[0_0_10px_rgba(52,211,153,0.8)]'
      : 'shadow-[0_0_10px_rgba(251,191,36,0.8)]';

  const label = !isConnected
    ? 'Somnia Testnet'
    : onCorrectChain
      ? 'Somnia Testnet'
      : 'Wrong Network';

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md ${className}`}
      title={`Chain ID: ${somniaTestnet.id}`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75 animate-ping`}
        ></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor} ${dotGlow}`}></span>
      </span>
      {!compact && (
        <>
          <span className="font-label-caps text-[10px] tracking-widest text-white/80 uppercase">
            {label}
          </span>
          <span className="font-label-caps text-[10px] tracking-widest text-white/30 uppercase">
            · {somniaTestnet.id}
          </span>
        </>
      )}
    </div>
  );
}
