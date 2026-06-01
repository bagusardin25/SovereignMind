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
import { parseAbiItem, type AbiEvent, type Log } from 'viem';
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
  'event DecisionMade(uint256 indexed id, uint8 action, string rationale, uint256 confidenceScore, uint256 timestamp)'
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!publicClient) {
      return;
    }

    let cancelled = false;

    async function fetchLogs() {
      try {
        const results: ReceiptRecord[] = [];

        // Helper to fetch logs in chunks to bypass the 1000 block RPC limit
        type EventLog = Log & { args?: Record<string, unknown> };
        const fetchLogsInBatches = async (
          address: `0x${string}`,
          event: AbiEvent,
          maxHistory = BigInt(10000),
        ): Promise<EventLog[]> => {
          const latestBlock = await publicClient!.getBlockNumber();
          const startBlock = latestBlock > maxHistory ? latestBlock - maxHistory : BigInt(0);
          const chunkSize = BigInt(999);
          let logs: EventLog[] = [];
          
          for (let from = startBlock; from <= latestBlock; from += chunkSize + BigInt(1)) {
            const to = from + chunkSize > latestBlock ? latestBlock : from + chunkSize;
            try {
              const chunkLogs = await publicClient!.getLogs({
                address,
                event,
                fromBlock: from,
                toBlock: to,
              });
              logs = logs.concat(chunkLogs as EventLog[]);
            } catch (err) {
              console.warn(`Failed to fetch logs chunk ${from}-${to} for ${address}:`, err);
            }
          }
          return logs;
        };

        // Fetch CEO DecisionMade events
        try {
          const ceoLogs = await fetchLogsInBatches(
            CONTRACT_ADDRESSES.ceoAgent as `0x${string}`,
            CEO_DECISION_MADE
          );

          for (const log of ceoLogs) {
            const txHash = log.transactionHash || '';
            const args = log.args ?? {};
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
        } catch (err) {
          console.error('Failed to fetch CEO decision logs:', err);
        }

        // Fetch CFO AnalysisStarted events
        try {
          const cfoLogs = await fetchLogsInBatches(
            CONTRACT_ADDRESSES.cfoAgent as `0x${string}`,
            CFO_ANALYSIS_STARTED
          );

          for (const log of cfoLogs) {
            const txHash = log.transactionHash || '';
            const args = log.args ?? {};
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
        } catch (err) {
          console.error('Failed to fetch CFO analysis logs:', err);
        }

        // Fetch CMO ScanStarted events
        try {
          const cmoLogs = await fetchLogsInBatches(
            CONTRACT_ADDRESSES.cmoAgent as `0x${string}`,
            CMO_SCAN_STARTED
          );

          for (const log of cmoLogs) {
            const txHash = log.transactionHash || '';
            const args = log.args ?? {};
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
        } catch (err) {
          console.error('Failed to fetch CMO scan logs:', err);
        }

        // Sort by block number descending
        results.sort((a, b) => Number(b.blockNumber - a.blockNumber));

        if (!cancelled) {
          setRecords(results);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch blockchain receipt logs:', err);
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
