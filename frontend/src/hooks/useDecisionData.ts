'use client';

// ============================================================
// SovereignMind — Composite Decision Data Hook
// ============================================================
// Builds Decision[] from on-chain data by combining:
//   - CEO ExecutiveDecisions (from contract array)
//   - TreasuryVault Decisions (from contract array)
//   - CFO RiskAnalysed events (from on-chain event logs, chunked)
//   - CMO SentimentAnalyzed events (from on-chain event logs, chunked)

import { useMemo, useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem, type AbiEvent } from 'viem';
import { useCEORecentDecisions, useCEODecisionCount } from './useCEOAgent';
import { useTreasuryRecentDecisions, useTreasuryDecisionCount } from './useTreasuryVault';
import { useReceipts, type ReceiptRecord } from './useReceipts';
import { contracts } from '@/lib/somnia/contracts';
import {
  CEO_DECISION_ACTIONS,
  TREASURY_OUTCOMES,
  ADDRESS_TO_ROLE,
  toJsTimestamp,
} from '@/lib/agent-metadata';
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

// ----- Event ABIs for CFO/CMO event-based history -----

const RISK_ANALYZED_EVENT = parseAbiItem(
  'event RiskAnalyzed(uint256 score, string recommendation, uint256 timestamp)'
);
const SENTIMENT_ANALYZED_EVENT = parseAbiItem(
  'event SentimentAnalyzed(string source, uint8 sentiment, uint256 confidence, uint256 timestamp)'
);
const SENTIMENT_NAMES = ['NEUTRAL', 'BULLISH', 'BEARISH'];

// ----- On-chain event log types -----

interface CFOEventDecision {
  id: string;
  score: number;
  recommendation: string;
  timestamp: number;
  txHash: string;
}

interface CMOEventDecision {
  id: string;
  source: string;
  sentiment: string;
  confidence: number;
  timestamp: number;
  txHash: string;
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

function transformCFORiskEvent(e: CFOEventDecision): Decision {
  const riskLevel = e.score >= 70 ? 'HIGH' : e.score >= 40 ? 'MEDIUM' : 'LOW';
  return {
    id: e.id,
    agentRole: 'CFO',
    type: 'alert',
    title: `CFO Risk Analysis — ${riskLevel} Risk (${e.score}/100)`,
    rationale: e.recommendation || 'Risk assessment completed',
    action: `risk_${riskLevel.toLowerCase()}`,
    outcome: 'executed',
    txHash: e.txHash,
    receiptUrl: e.txHash ? buildExplorerTxUrl(e.txHash) : null,
    timestamp: e.timestamp,
    confidenceScore: 100 - e.score, // Invert: low risk = high confidence
  };
}

function transformCMOSentimentEvent(e: CMOEventDecision): Decision {
  const sentimentLower = e.sentiment.toLowerCase();
  return {
    id: e.id,
    agentRole: 'CMO',
    type: 'market_signal',
    title: `CMO Market Signal — ${e.sentiment} from ${e.source.slice(0, 30)}`,
    rationale: `Sentiment: ${e.sentiment} (${e.confidence}% confidence) from ${e.source}`,
    action: sentimentLower,
    outcome: 'executed',
    txHash: e.txHash,
    receiptUrl: e.txHash ? buildExplorerTxUrl(e.txHash) : null,
    timestamp: e.timestamp,
    confidenceScore: e.confidence,
    marketSignal: sentimentLower === 'bullish' ? 'bullish' : sentimentLower === 'bearish' ? 'bearish' : 'neutral',
  };
}

// ----- Event fetching helper -----

function useAgentEventLogs(event: AbiEvent, address: `0x${string}`) {
  const publicClient = usePublicClient();
  const [logs, setLogs] = useState<Array<{ args?: Record<string, unknown>; blockNumber: bigint; logIndex: number; transactionHash?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!publicClient) return;
    try {
      const currentBlock = await publicClient.getBlockNumber();
      const MAX_HISTORY = BigInt(5_000);
      const CHUNK_SIZE = BigInt(999);
      const startBlock = currentBlock > MAX_HISTORY ? currentBlock - MAX_HISTORY : BigInt(0);

      // Pre-compute chunk ranges and fetch all in parallel
      const chunks: Array<{ from: bigint; to: bigint }> = [];
      for (let from = startBlock; from <= currentBlock; from += CHUNK_SIZE + BigInt(1)) {
        const to = from + CHUNK_SIZE > currentBlock ? currentBlock : from + CHUNK_SIZE;
        chunks.push({ from, to });
      }

      const results = await Promise.allSettled(
        chunks.map(({ from, to }) =>
          publicClient.getLogs({ address, event, fromBlock: from, toBlock: to })
        )
      );

      const allChunkLogs: typeof logs = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allChunkLogs.push(...(result.value as typeof logs));
        }
      }
      setLogs(allChunkLogs);
    } catch {
      // Skip overall errors
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address, event]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30_000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  return { logs, isLoading };
}

// ----- Composite Hook -----

export function useDecisionData(count: number = 20) {
  const { data: ceoDecisions, isLoading: ceoLoading } = useCEORecentDecisions(BigInt(count));
  const { data: treasuryDecisions, isLoading: treasuryLoading } = useTreasuryRecentDecisions(BigInt(count));
  const { data: ceoCount } = useCEODecisionCount();
  const { data: treasuryCount } = useTreasuryDecisionCount();
  const { records: receiptRecords } = useReceipts();

  // Fetch CFO + CMO event logs for decision history
  const { logs: cfoRiskLogs, isLoading: cfoEventsLoading } = useAgentEventLogs(
    RISK_ANALYZED_EVENT,
    contracts.cfoAgent.address,
  );
  const { logs: cmoSentimentLogs, isLoading: cmoEventsLoading } = useAgentEventLogs(
    SENTIMENT_ANALYZED_EVENT,
    contracts.cmoAgent.address,
  );

  const isLoading = ceoLoading || treasuryLoading || cfoEventsLoading || cmoEventsLoading;

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
          const agentRole: AgentRole = ADDRESS_TO_ROLE[raw.initiator.toLowerCase()] || 'CEO';
          const receipt = findReceipt(agentRole, ts);
          result.push(transformTreasuryDecision(raw, receipt));
        } catch {
          // Skip malformed data
        }
      }
    }

    // Transform CFO risk analysis events (deduplicated)
    let cfoSkippedCount = 0;
    for (let i = 0; i < cfoRiskLogs.length; i++) {
      try {
        const log = cfoRiskLogs[i];
        const args = log.args as { score?: bigint; recommendation?: string; timestamp?: bigint } | undefined;
        if (!args?.timestamp) continue;
        const ts = Number(args.timestamp) * 1000;
        const score = Number(args.score ?? 0);

        // Skip if previous event had same score within 5 minutes
        if (i > 0) {
          const prevArgs = cfoRiskLogs[i - 1].args as { score?: bigint; timestamp?: bigint } | undefined;
          if (prevArgs?.timestamp && prevArgs?.score !== undefined) {
            const prevTs = Number(prevArgs.timestamp) * 1000;
            const prevScore = Number(prevArgs.score);
            if (score === prevScore && Math.abs(ts - prevTs) < 5 * 60 * 1000) {
              cfoSkippedCount++;
              continue;
            }
          }
        }

        const rationale = cfoSkippedCount > 0
          ? `${args.recommendation || 'Risk assessment completed'} (${cfoSkippedCount + 1} analyses consolidated)`
          : args.recommendation || 'Risk assessment completed';
        cfoSkippedCount = 0;

        result.push(transformCFORiskEvent({
          id: `cfo-risk-${log.blockNumber}-${log.logIndex}`,
          score,
          recommendation: rationale,
          timestamp: ts,
          txHash: log.transactionHash || '',
        }));
      } catch {
        // Skip malformed
      }
    }

    // Transform CMO sentiment events
    for (const log of cmoSentimentLogs) {
      try {
        const args = log.args as { source?: string; sentiment?: number; confidence?: bigint; timestamp?: bigint } | undefined;
        if (!args?.timestamp) continue;
        const ts = Number(args.timestamp) * 1000;
        result.push(transformCMOSentimentEvent({
          id: `cmo-sentiment-${log.blockNumber}-${log.logIndex}`,
          source: args.source || 'unknown',
          sentiment: SENTIMENT_NAMES[args.sentiment ?? 0] || 'NEUTRAL',
          confidence: Number(args.confidence ?? 0),
          timestamp: ts,
          txHash: log.transactionHash || '',
        }));
      } catch {
        // Skip malformed
      }
    }

    // Sort by timestamp descending (newest first)
    result.sort((a, b) => b.timestamp - a.timestamp);

    return result;
  }, [ceoDecisions, treasuryDecisions, receiptRecords, cfoRiskLogs, cmoSentimentLogs]);

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
