'use client';

// ============================================================
// SovereignMind — Composite Treasury Data Hook
// ============================================================
// Builds TreasuryState and Transaction[] from on-chain data.
// The TreasuryVault only holds native STT, so we show real STT balance
// instead of fake multi-token holdings.

import { useMemo } from 'react';
import { formatEther } from 'viem';
import {
  useTreasuryBalance,
  useTreasuryTotalDeposited,
  useTreasuryTotalOperations,
  useTreasuryRecentDecisions,
  useTreasuryDecisionCount,
} from './useTreasuryVault';
import { ADDRESS_TO_ROLE, toJsTimestamp } from '@/lib/agent-metadata';
import type { TreasuryState, TokenHolding, Transaction } from '@/lib/types';

// ----- On-chain struct type -----

interface OnChainTreasuryDecision {
  id: bigint;
  initiator: `0x${string}`;
  action: string;
  rationale: string;
  timestamp: bigint;
  value: bigint;
  outcome: number;
}

// ----- Composite Hook -----

export function useTreasuryData(recentCount: number = 20) {
  const { data: balance, isLoading: balanceLoading } = useTreasuryBalance();
  const { data: totalDeposited, isLoading: depositLoading } = useTreasuryTotalDeposited();
  const { data: totalOperations } = useTreasuryTotalOperations();
  const { data: recentDecisions, isLoading: decisionsLoading } = useTreasuryRecentDecisions(BigInt(recentCount));
  const { data: decisionCount } = useTreasuryDecisionCount();

  const isLoading = balanceLoading || depositLoading || decisionsLoading;

  // Build treasury state with real STT balance
  const treasury = useMemo<TreasuryState>(() => {
    const balanceWei = balance as bigint | undefined;
    const depositedWei = totalDeposited as bigint | undefined;

    const sttBalance = balanceWei != null ? parseFloat(formatEther(balanceWei)) : 0;
    const sttDeposited = depositedWei != null ? parseFloat(formatEther(depositedWei)) : 0;

    // Calculate return since inception: (current balance - total deposits) / total deposits
    const returnSinceInception = sttDeposited > 0
      ? Math.round(((sttBalance - sttDeposited) / sttDeposited) * 10000) / 100
      : 0;

    const holdings: TokenHolding[] = [
      {
        symbol: 'STT',
        name: 'Somnia',
        balance: sttBalance,
        price: 1, // STT is native token, value in STT
        value: sttBalance,
        change24h: returnSinceInception,
        allocation: 100,
        color: '#6C5CE7',
      },
    ];

    return {
      totalValue: sttBalance,
      change24h: returnSinceInception,
      holdings,
    };
  }, [balance, totalDeposited]);

  // Build transactions from treasury decisions
  const transactions = useMemo<Transaction[]>(() => {
    if (!recentDecisions || !Array.isArray(recentDecisions)) return [];

    return (recentDecisions as OnChainTreasuryDecision[]).map((d) => {
      const agentRole = ADDRESS_TO_ROLE[d.initiator.toLowerCase()];
      const valueEth = parseFloat(formatEther(d.value));

      // Map action to transaction type
      let type: 'deposit' | 'rebalance' | 'withdrawal' = 'rebalance';
      if (d.action.includes('deposit')) type = 'deposit';
      else if (d.action.includes('withdraw')) type = 'withdrawal';

      return {
        id: `tx-${d.id.toString()}`,
        type,
        token: 'STT',
        amount: valueEth,
        value: valueEth,
        from: d.initiator,
        to: d.initiator, // On-chain decisions don't have a separate "to"
        txHash: '',
        timestamp: toJsTimestamp(d.timestamp),
        reason: d.rationale || d.action,
        agentRole,
      };
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [recentDecisions]);

  return {
    treasury,
    transactions,
    isLoading,
    totalOperations: totalOperations != null ? Number(totalOperations) : 0,
    decisionCount: decisionCount != null ? Number(decisionCount) : 0,
  };
}
