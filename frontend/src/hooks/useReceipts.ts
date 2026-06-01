'use client';

// ============================================================
// SovereignMind — useReceipts Hook
// ============================================================
// Queries on-chain event logs from CEO, CFO, CMO contracts to
// build a map of decision → receipt data (requestId, txHash).
//
// Uses viem's publicClient.getLogs() since wagmi v2 doesn't
// have useContractEvents. Fetches logs on mount and caches.

import { useMemo, useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem, type Log } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/constants';
import { buildExplorerTxUrl, buildVerificationUrl } from '@/lib/somnia/receipts';

// ── Types ─────────────────────────────────────────────────────

export interface ReceiptRecord {
  /** The on-chain decision/request ID */
  id: string;
  /** The AgentRunner requestId (from AnalysisStarted/ScanStarted) */
  requestId: string | null;
  /** Transaction hash that emitted the event */
  txHash: string;
  /** Agent role that created this receipt */
  agentRole: 'CEO' | 'CFO' | 'CMO';
  /** Block explorer link */
  explorerUrl: string;
  /** Receipt/verification URL */
  verificationUrl: string;
  /** Block number */
  blockNumber: bigint;
  /** Timestamp (derived from event args, ms) */
  timestamp: number;
}

// ── Event ABI items ───────────────────────────────────────────

const CEO_DECISION_MADE = parseAbiItem(
  'event DecisionMade(uint256 indexed id, string action, string rationale, uint256 confidence, uint256 timestamp)'
);

const CFO_ANALYSIS_STARTED = parseAbiItem(
  'event AnalysisStarted(uint256 indexed requestId, string symbol, uint256 timestamp)'
);

const CMO_SCAN_STARTED = parseAbiItem(
  'event ScanStarted(uint256 indexed requestId, string source, uint256 timestamp)'
);

// ── Composite Hook ────────────────────────────────────────────

export function useReceipts() {
  const publicClient = usePublicClient();
  const [records, setRecords] = useState<ReceiptRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!publicClient) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchLogs() {
      try {
        const results: ReceiptRecord[] = [];

        // Fetch CEO DecisionMade events
        try {
          const ceoLogs = await publicClient!.getLogs({
            address: CONTRACT_ADDRESSES.ceoAgent as `0x${string}`,
            event: CEO_DECISION_MADE,
            fromBlock: 'earliest',
            toBlock: 'latest',
          });

          for (const log of ceoLogs) {
            const txHash = log.transactionHash || '';
            const args = log.args;
            results.push({
              id: `ceo-${args.id?.toString() || '0'}`,
              requestId: null,
              txHash,
              agentRole: 'CEO',
              explorerUrl: buildExplorerTxUrl(txHash),
              verificationUrl: buildVerificationUrl(null, txHash),
              blockNumber: log.blockNumber || BigInt(0),
              timestamp: args.timestamp ? Number(args.timestamp) * 1000 : 0,
            });
          }
        } catch {
          // CEO events fetch failed silently
        }

        // Fetch CFO AnalysisStarted events
        try {
          const cfoLogs = await publicClient!.getLogs({
            address: CONTRACT_ADDRESSES.cfoAgent as `0x${string}`,
            event: CFO_ANALYSIS_STARTED,
            fromBlock: 'earliest',
            toBlock: 'latest',
          });

          for (const log of cfoLogs) {
            const txHash = log.transactionHash || '';
            const args = log.args;
            const requestId = args.requestId?.toString() || null;
            results.push({
              id: `cfo-${requestId || txHash}`,
              requestId,
              txHash,
              agentRole: 'CFO',
              explorerUrl: buildExplorerTxUrl(txHash),
              verificationUrl: buildVerificationUrl(requestId, txHash),
              blockNumber: log.blockNumber || BigInt(0),
              timestamp: args.timestamp ? Number(args.timestamp) * 1000 : 0,
            });
          }
        } catch {
          // CFO events fetch failed silently
        }

        // Fetch CMO ScanStarted events
        try {
          const cmoLogs = await publicClient!.getLogs({
            address: CONTRACT_ADDRESSES.cmoAgent as `0x${string}`,
            event: CMO_SCAN_STARTED,
            fromBlock: 'earliest',
            toBlock: 'latest',
          });

          for (const log of cmoLogs) {
            const txHash = log.transactionHash || '';
            const args = log.args;
            const requestId = args.requestId?.toString() || null;
            results.push({
              id: `cmo-${requestId || txHash}`,
              requestId,
              txHash,
              agentRole: 'CMO',
              explorerUrl: buildExplorerTxUrl(txHash),
              verificationUrl: buildVerificationUrl(requestId, txHash),
              blockNumber: log.blockNumber || BigInt(0),
              timestamp: args.timestamp ? Number(args.timestamp) * 1000 : 0,
            });
          }
        } catch {
          // CMO events fetch failed silently
        }

        // Sort by block number descending
        results.sort((a, b) => Number(b.blockNumber - a.blockNumber));

        if (!cancelled) {
          setRecords(results);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchLogs();

    return () => {
      cancelled = true;
    };
  }, [publicClient]);

  // Build lookup maps
  const byTxHash = useMemo(() => {
    const map = new Map<string, ReceiptRecord>();
    for (const r of records) {
      if (r.txHash) map.set(r.txHash.toLowerCase(), r);
    }
    return map;
  }, [records]);

  const byRequestId = useMemo(() => {
    const map = new Map<string, ReceiptRecord>();
    for (const r of records) {
      if (r.requestId) map.set(r.requestId, r);
    }
    return map;
  }, [records]);

  return {
    records,
    byTxHash,
    byRequestId,
    isLoading,
    getByTxHash: (hash: string) => byTxHash.get(hash.toLowerCase()),
    getByRequestId: (id: string) => byRequestId.get(id),
  };
}
