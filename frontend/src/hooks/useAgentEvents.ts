'use client';

// ============================================================
// useAgentEvents — Read on-chain event logs from CFO, CMO, CEO
// ============================================================
// Uses wagmi usePublicClient + viem getLogs to read past events
// and transform them into ActivityEvent[] for the Live Agent Console.
//
// Uses parallel chunked fetching to work around Somnia RPC's 1000-block limit.

import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem, type AbiEvent } from 'viem';
import { contracts } from '@/lib/somnia/contracts';
import type { ActivityEvent } from '@/lib/types';

// Event signatures (must match contract ABIs exactly)
const PRICE_FETCHED_EVENT = parseAbiItem(
  'event PriceFetched(string indexed symbol, uint256 price, uint256 timestamp)'
);
const RISK_ANALYZED_EVENT = parseAbiItem(
  'event RiskAnalyzed(uint256 score, string recommendation, uint256 timestamp)'
);
const WEB_SCRAPED_EVENT = parseAbiItem(
  'event WebScraped(string indexed source, uint256 dataLength, uint256 timestamp)'
);
const SENTIMENT_ANALYZED_EVENT = parseAbiItem(
  'event SentimentAnalyzed(string source, uint8 sentiment, uint256 confidence, uint256 timestamp)'
);
const DECISION_MADE_EVENT = parseAbiItem(
  'event DecisionMade(uint256 indexed id, uint8 action, string rationale, uint256 confidenceScore, uint256 timestamp)'
);

// Sentiment enum mapping
const SENTIMENT_NAMES = ['NEUTRAL', 'BULLISH', 'BEARISH'];
// DecisionAction enum mapping
const DECISION_ACTIONS = ['HOLD', 'REBALANCE', 'ALLOCATE'];

type LogEntry = { args?: Record<string, unknown>; blockNumber: bigint; logIndex: number };

export function useAgentEvents() {
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cfoAddress = contracts.cfoAgent.address;
  const cmoAddress = contracts.cmoAgent.address;
  const ceoAddress = contracts.ceoAgent.address;

  const fetchEvents = useCallback(async () => {
    if (!publicClient) return;

    setIsLoading(true);
    try {
      const currentBlock = await publicClient.getBlockNumber();
      const MAX_HISTORY = BigInt(5_000); // Reduced: ~5 chunks instead of ~50
      const CHUNK_SIZE = BigInt(999);
      const startBlock = currentBlock > MAX_HISTORY ? currentBlock - MAX_HISTORY : BigInt(0);

      // Pre-compute all chunk ranges
      const chunks: Array<{ from: bigint; to: bigint }> = [];
      for (let from = startBlock; from <= currentBlock; from += CHUNK_SIZE + BigInt(1)) {
        const to = from + CHUNK_SIZE > currentBlock ? currentBlock : from + CHUNK_SIZE;
        chunks.push({ from, to });
      }

      // Fetch logs for one event type: all chunks in parallel
      const getLogsChunked = async (address: `0x${string}`, event: AbiEvent): Promise<LogEntry[]> => {
        const results = await Promise.allSettled(
          chunks.map(({ from, to }) =>
            publicClient.getLogs({ address, event, fromBlock: from, toBlock: to })
          )
        );
        const logs: LogEntry[] = [];
        for (const result of results) {
          if (result.status === 'fulfilled') {
            logs.push(...(result.value as LogEntry[]));
          }
        }
        return logs;
      };

      // Fetch ALL 5 event types in parallel
      const [priceLogs, riskLogs, webLogs, sentimentLogs, decisionLogs] = await Promise.all([
        getLogsChunked(cfoAddress, PRICE_FETCHED_EVENT),
        getLogsChunked(cfoAddress, RISK_ANALYZED_EVENT),
        getLogsChunked(cmoAddress, WEB_SCRAPED_EVENT),
        getLogsChunked(cmoAddress, SENTIMENT_ANALYZED_EVENT),
        getLogsChunked(ceoAddress, DECISION_MADE_EVENT),
      ]);

      console.log(`[useAgentEvents] Fetched: ${priceLogs.length} prices, ${riskLogs.length} risks, ${webLogs.length} webs, ${sentimentLogs.length} sentiments, ${decisionLogs.length} decisions`);

      const allLogs: ActivityEvent[] = [];

      // CFO: PriceFetched
      for (const log of priceLogs) {
        const args = log.args as { symbol?: string; price?: bigint; timestamp?: bigint } | undefined;
        if (!args?.timestamp) continue;
        const ts = Number(args.timestamp) * 1000;
        const price = args.price ? (Number(args.price) / 1e8).toFixed(2) : '?';
        allLogs.push({
          id: `price-${log.blockNumber}-${log.logIndex}`,
          agentRole: 'CFO',
          action: 'PRICE_FETCHED',
          description: `${args.symbol || '?'}: $${price}`,
          timestamp: ts,
        });
      }

      // CFO: RiskAnalyzed
      for (const log of riskLogs) {
        const args = log.args as { score?: bigint; recommendation?: string; timestamp?: bigint } | undefined;
        if (!args?.timestamp) continue;
        const ts = Number(args.timestamp) * 1000;
        allLogs.push({
          id: `risk-${log.blockNumber}-${log.logIndex}`,
          agentRole: 'CFO',
          action: 'RISK_ANALYZED',
          description: `Score: ${args.score?.toString() || '?'} — ${args.recommendation?.slice(0, 60) || ''}`,
          timestamp: ts,
        });
      }

      // CMO: WebScraped
      for (const log of webLogs) {
        const args = log.args as { source?: string; dataLength?: bigint; timestamp?: bigint } | undefined;
        if (!args?.timestamp) continue;
        const ts = Number(args.timestamp) * 1000;
        allLogs.push({
          id: `web-${log.blockNumber}-${log.logIndex}`,
          agentRole: 'CMO',
          action: 'WEB_SCRAPED',
          description: `${args.source?.slice(0, 40) || '?'} (${args.dataLength?.toString() || '0'} bytes)`,
          timestamp: ts,
        });
      }

      // CMO: SentimentAnalyzed
      for (const log of sentimentLogs) {
        const args = log.args as { source?: string; sentiment?: number; confidence?: bigint; timestamp?: bigint } | undefined;
        if (!args?.timestamp) continue;
        const ts = Number(args.timestamp) * 1000;
        const sentimentName = SENTIMENT_NAMES[args.sentiment ?? 0] || 'NEUTRAL';
        allLogs.push({
          id: `sentiment-${log.blockNumber}-${log.logIndex}`,
          agentRole: 'CMO',
          action: 'SENTIMENT',
          description: `${sentimentName} (${args.confidence?.toString() || '?'}%) from ${args.source?.slice(0, 30) || '?'}`,
          timestamp: ts,
        });
      }

      // CEO: DecisionMade
      for (const log of decisionLogs) {
        const args = log.args as { id?: bigint; action?: number; rationale?: string; confidenceScore?: bigint; timestamp?: bigint } | undefined;
        if (!args?.timestamp) continue;
        const ts = Number(args.timestamp) * 1000;
        const actionName = DECISION_ACTIONS[args.action ?? 0] || 'HOLD';
        allLogs.push({
          id: `decision-${log.blockNumber}-${log.logIndex}`,
          agentRole: 'CEO',
          action: actionName,
          description: `Decision #${args.id?.toString() || '?'} — ${args.rationale?.slice(0, 60) || ''}`,
          timestamp: ts,
        });
      }

      // Sort newest first, take last 50
      allLogs.sort((a, b) => b.timestamp - a.timestamp);
      setEvents(allLogs.slice(0, 50));
    } catch (err) {
      console.error('Failed to fetch agent events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, cfoAddress, cmoAddress, ceoAddress]);

  // Initial fetch + polling every 15s
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- valid polling pattern: fetch on mount + interval
    fetchEvents();
    const interval = setInterval(fetchEvents, 15_000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return { events, isLoading };
}
