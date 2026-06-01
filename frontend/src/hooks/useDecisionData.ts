'use client';

// ============================================================
// SovereignMind — Composite Decision Data Hook
// ============================================================
// Builds Decision[] from on-chain data by combining CEO ExecutiveDecisions
// with TreasuryVault Decisions. Maps on-chain structs to frontend types.

import { useMemo } from 'react';
import { useCEORecentDecisions, useCEODecisionCount } from './useCEOAgent';
import { useTreasuryRecentDecisions, useTreasuryDecisionCount } from './useTreasuryVault';
import { useReceipts, type ReceiptRecord } from './useReceipts';
import {
  CEO_DECISION_ACTIONS,
  TREASURY_OUTCOMES,
  ADDRESS_TO_ROLE,
  toJsTimestamp,
} from '@/lib/agent-metadata';
import { SOMNIA_TESTNET } from '@/lib/constants';
import { buildExplorerTxUrl } from '@/lib/somnia/receipts';
import type { Decision, DecisionType, DecisionOutcome, AgentRole } from '@/lib/types';

// ----- On-chain struct types -----

interface OnChainExecutiveDecision {
  id: bigint;
  action: number;       // DecisionAction enum: HOLD(0), REBALANCE(1), ALLOCATE(2)
  rationale: string;
  confidenceScore: bigint;
  timestamp: bigint;
  executed: boolean;
  cfoDataHash: `0x${string}`;
  cmoDataHash: `0x${string}`;
}

interface OnChainTreasuryDecision {
  id: bigint;
  initiator: `0x${string}`;
  action: string;
  rationale: string;
  timestamp: bigint;
  value: bigint;
  outcome: number; // DecisionOutcome enum: PENDING(0), EXECUTED(1), REJECTED(2), FAILED(3)
}

// ----- Transform Functions -----

function transformCEODecision(d: OnChainExecutiveDecision, matchedReceipt?: ReceiptRecord): Decision {
  const decisionType = CEO_DECISION_ACTIONS[d.action] || 'hold';
  const txHash = matchedReceipt?.txHash || null;
  const receiptUrl = txHash ? buildExplorerTxUrl(txHash) : null;

  return {
    id: `ceo-${d.id.toString()}`,
    agentRole: 'CEO',
    type: decisionType,
    title: `CEO ${decisionType.charAt(0).toUpperCase() + decisionType.slice(1)} Decision #${d.id.toString()}`,
    rationale: d.rationale || 'On-chain decision executed',
    action: decisionType,
    outcome: d.executed ? 'executed' : 'pending',
    txHash,
    receiptUrl,
    timestamp: toJsTimestamp(d.timestamp),
    confidenceScore: Number(d.confidenceScore),
    llmReasoning: d.rationale || undefined,
  };
}

function transformTreasuryDecision(d: OnChainTreasuryDecision, matchedReceipt?: ReceiptRecord): Decision {
  const outcome = TREASURY_OUTCOMES[d.outcome] || 'pending';
  const agentRole: AgentRole = ADDRESS_TO_ROLE[d.initiator.toLowerCase()] || 'CEO';
  const action = d.action || 'treasury_action';
  const txHash = matchedReceipt?.txHash || null;
  const receiptUrl = txHash ? buildExplorerTxUrl(txHash) : null;

  // Map treasury action string to DecisionType
  let type: DecisionType = 'hold';
  if (action.includes('rebalance')) type = 'rebalance';
  else if (action.includes('allocate')) type = 'allocate';
  else if (action.includes('hold')) type = 'hold';
  else if (action.includes('alert')) type = 'alert';

  return {
    id: `treasury-${d.id.toString()}`,
    agentRole,
    type,
    title: `Treasury ${action.charAt(0).toUpperCase() + action.slice(1)} #${d.id.toString()}`,
    rationale: d.rationale || 'Treasury operation executed',
    action,
    outcome,
    txHash,
    receiptUrl,
    timestamp: toJsTimestamp(d.timestamp),
    confidenceScore: outcome === 'executed' ? 90 : 50,
  };
}

// ----- Composite Hook -----

export function useDecisionData(count: number = 20) {
  const { data: ceoDecisions, isLoading: ceoLoading } = useCEORecentDecisions(BigInt(count));
  const { data: treasuryDecisions, isLoading: treasuryLoading } = useTreasuryRecentDecisions(BigInt(count));
  const { data: ceoCount } = useCEODecisionCount();
  const { data: treasuryCount } = useTreasuryDecisionCount();
  const { records: receiptRecords } = useReceipts();

  const isLoading = ceoLoading || treasuryLoading;

  const decisions = useMemo<Decision[]>(() => {
    const result: Decision[] = [];

    // Build a receipt lookup by timestamp (approximate match within 60s)
    const findReceipt = (agentRole: string, timestampMs: number): ReceiptRecord | undefined => {
      return receiptRecords.find(
        (r) => r.agentRole === agentRole && Math.abs(r.timestamp - timestampMs) < 60000
      );
    };

    // Transform CEO decisions
    if (ceoDecisions && Array.isArray(ceoDecisions)) {
      for (const d of ceoDecisions) {
        try {
          const raw = d as OnChainExecutiveDecision;
          const ts = toJsTimestamp(raw.timestamp);
          const receipt = findReceipt('CEO', ts);
          result.push(transformCEODecision(raw, receipt));
        } catch {
          // Skip malformed data
        }
      }
    }

    // Transform Treasury decisions
    if (treasuryDecisions && Array.isArray(treasuryDecisions)) {
      for (const d of treasuryDecisions) {
        try {
          const raw = d as OnChainTreasuryDecision;
          const ts = toJsTimestamp(raw.timestamp);
          // Try to find receipt from the initiator's agent role
          const agentRole: AgentRole = ADDRESS_TO_ROLE[raw.initiator.toLowerCase()] || 'CEO';
          const receipt = findReceipt(agentRole, ts);
          result.push(transformTreasuryDecision(raw, receipt));
        } catch {
          // Skip malformed data
        }
      }
    }

    // Sort by timestamp descending (newest first)
    result.sort((a, b) => b.timestamp - a.timestamp);

    return result;
  }, [ceoDecisions, treasuryDecisions, receiptRecords]);

  const totalDecisionCount = (ceoCount != null ? Number(ceoCount) : 0)
    + (treasuryCount != null ? Number(treasuryCount) : 0);

  return {
    decisions,
    isLoading,
    totalDecisionCount,
    ceoDecisionCount: ceoCount != null ? Number(ceoCount) : 0,
    treasuryDecisionCount: treasuryCount != null ? Number(treasuryCount) : 0,
  };
}
