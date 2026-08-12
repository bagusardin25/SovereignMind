'use client';

import { useAccount, useChainId } from 'wagmi';
import { flareTestnet, somniaTestnet } from '@/lib/wagmi-config';

interface ChainBadgeProps {
  compact?: boolean;
  className?: string;
}

export default function ChainBadge({ compact = false, className = '' }: ChainBadgeProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const supportedChain =
    chainId === flareTestnet.id
      ? flareTestnet
      : chainId === somniaTestnet.id
        ? somniaTestnet
        : null;
  const displayedChain = !isConnected ? somniaTestnet : supportedChain;
  const onSupportedChain = Boolean(supportedChain);

  const dotColor = !isConnected
    ? 'bg-[var(--color-primary)]'
    : onSupportedChain
      ? 'bg-emerald-400'
      : 'bg-amber-400';

  const dotGlow = !isConnected
    ? 'shadow-[0_0_10px_var(--color-primary)]'
    : onSupportedChain
      ? 'shadow-[0_0_10px_rgba(52,211,153,0.8)]'
      : 'shadow-[0_0_10px_rgba(251,191,36,0.8)]';

  const label = !isConnected
    ? somniaTestnet.name
    : supportedChain?.name ?? 'Wrong Network';

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md ${className}`}
      title={displayedChain ? `Chain ID: ${displayedChain.id}` : 'Unsupported chain'}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75 animate-ping`}
        />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor} ${dotGlow}`} />
      </span>
      {!compact && (
        <>
          <span className="font-label-caps text-[10px] tracking-widest text-white/80 uppercase">
            {label}
          </span>
          <span className="font-label-caps text-[10px] tracking-widest text-white/30 uppercase">
            · {displayedChain?.id ?? chainId}
          </span>
        </>
      )}
    </div>
  );
}
