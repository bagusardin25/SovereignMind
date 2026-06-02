'use client';

// ============================================================
// TransactionList — Treasury transaction history
// ============================================================

import { motion } from 'framer-motion';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { formatRelativeTime, formatSTT, SOMNIA_TESTNET } from '@/lib/constants';

interface TransactionListProps {
  transactions: Transaction[];
  maxItems?: number;
}

const typeConfig = {
  deposit: {
    icon: ArrowDownToLine,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    label: 'Deposit',
  },
  rebalance: {
    icon: RefreshCw,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
    label: 'Rebalance',
  },
  withdrawal: {
    icon: ArrowUpFromLine,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    label: 'Withdrawal',
  },
};

export default function TransactionList({
  transactions,
  maxItems,
}: TransactionListProps) {
  const displayTxs = maxItems ? transactions.slice(0, maxItems) : transactions;

  return (
    <div className="space-y-2">
      {displayTxs.map((tx, index) => {
        const config = typeConfig[tx.type];
        const Icon = config.icon;

        return (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors group"
          >
            {/* Type Icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: config.bg, color: config.color }}
            >
              <Icon size={18} />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[--color-foreground]">
                  {config.label}
                </span>
                {tx.agentRole && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-[--color-muted-foreground]">
                    {tx.agentRole}
                  </span>
                )}
              </div>
              <p className="text-xs text-[--color-muted-foreground] truncate">
                {tx.amount} {tx.token}
                {tx.reason && ` — ${tx.reason}`}
              </p>
            </div>

            {/* Value & Time */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-medium text-[--color-foreground]">
                {formatSTT(tx.value)}
              </p>
              <p className="text-xs text-[--color-muted]">
                {formatRelativeTime(tx.timestamp)}
              </p>
            </div>

            {/* Explorer Link */}
            <a
              href={`${SOMNIA_TESTNET.blockExplorers.default.url}/tx/${tx.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="md:opacity-0 md:group-hover:opacity-100 opacity-60 transition-opacity text-[--color-muted-foreground] hover:text-[--color-foreground]"
            >
              <ExternalLink size={14} />
            </a>
          </motion.div>
        );
      })}
    </div>
  );
}
