'use client';

// ============================================================
// ReceiptBadge — Compact verification status badge
// ============================================================
// Shows the on-chain verification state of a decision:
// ✅ Verified — receipt available, consensus confirmed
// ⏳ Pending  — awaiting response
// ❌ Failed   — request failed
// 🔗 Links to block explorer or receipt on click

import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Clock,
  ShieldX,
  ShieldQuestion,
  ExternalLink,
} from 'lucide-react';
import type { VerificationStatus } from '@/lib/somnia/receipts';

interface ReceiptBadgeProps {
  status: VerificationStatus;
  txHash?: string | null;
  receiptUrl?: string | null;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const config: Record<
  VerificationStatus,
  {
    icon: typeof ShieldCheck;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
  }
> = {
  verified: {
    icon: ShieldCheck,
    label: 'Verified',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    glowColor: 'rgba(245, 158, 11, 0.3)',
  },
  failed: {
    icon: ShieldX,
    label: 'Failed',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
    glowColor: 'rgba(239, 68, 68, 0.3)',
  },
  unknown: {
    icon: ShieldQuestion,
    label: 'Unverified',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.08)',
    borderColor: 'rgba(107, 114, 128, 0.2)',
    glowColor: 'rgba(107, 114, 128, 0.2)',
  },
};

export default function ReceiptBadge({
  status,
  txHash,
  receiptUrl,
  size = 'sm',
  showLabel = true,
}: ReceiptBadgeProps) {
  const cfg = config[status];
  const Icon = cfg.icon;
  const href = receiptUrl || (txHash ? undefined : undefined);
  const iconSize = size === 'sm' ? 12 : 14;
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2.5 py-1';

  const badge = (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1 ${padding} rounded-full font-medium select-none ${textSize}`}
      style={{
        backgroundColor: cfg.bgColor,
        border: `1px solid ${cfg.borderColor}`,
        color: cfg.color,
        boxShadow: status === 'verified' ? `0 0 8px ${cfg.glowColor}` : 'none',
      }}
      title={`${cfg.label}${txHash ? ` • ${txHash.slice(0, 10)}...` : ''}`}
    >
      <Icon size={iconSize} />
      {showLabel && <span>{cfg.label}</span>}
      {(receiptUrl || txHash) && <ExternalLink size={iconSize - 2} className="opacity-50" />}
    </motion.span>
  );

  // If there's a link, wrap in <a>
  if (receiptUrl) {
    return (
      <a
        href={receiptUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
      >
        {badge}
      </a>
    );
  }

  return badge;
}
