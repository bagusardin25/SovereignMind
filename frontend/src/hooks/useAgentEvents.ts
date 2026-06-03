'use client';

// ============================================================
// useAgentEvents — Read on-chain event logs from CFO, CMO, CEO
// ============================================================
// Uses wagmi usePublicClient + viem getLogs to read past events
// and transform them into ActivityEvent[] for the Live Agent Console.

import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';
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
      const fromBlock = currentBlock > BigInt(50_000) ? currentBlock - BigInt(50_000) : BigInt(0);

      const allLogs: ActivityEvent[] = [];

      // CFO: PriceFetched
      try {
        const logs = await publicClient.getLogs({
          address: cfoAddress,
          event: PRICE_FETCHED_EVENT,
          fromBlock,
          toBlock: 'latest',
        });
        for (const log of logs) {
          const args = log.args as { symbol?: string; price?: bigint; timestamp?: bigint };
          if (!args.timestamp) continue;
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
      } catch { /* skip */ }

      // CFO: RiskAnalyzed
      try {
        const logs = await publicClient.getLogs({
          address: cfoAddress,
          event: RISK_ANALYZED_EVENT,
          fromBlock,
          toBlock: 'latest',
        });
        for (const log of logs) {
          const args = log.args as { score?: bigint; recommendation?: string; timestamp?: bigint };
          if (!args.timestamp) continue;
          const ts = Number(args.timestamp) * 1000;
          allLogs.push({
            id: `risk-${log.blockNumber}-${log.logIndex}`,
            agentRole: 'CFO',
            action: 'RISK_ANALYZED',
            description: `Score: ${args.score?.toString() || '?'} — ${args.recommendation?.slice(0, 60) || ''}`,
            timestamp: ts,
          });
        }
      } catch { /* skip */ }

      // CMO: WebScraped
      try {
        const logs = await publicClient.getLogs({
          address: cmoAddress,
          event: WEB_SCRAPED_EVENT,
          fromBlock,
          toBlock: 'latest',
        });
        for (const log of logs) {
          const args = log.args as { source?: string; dataLength?: bigint; timestamp?: bigint };
          if (!args.timestamp) continue;
          const ts = Number(args.timestamp) * 1000;
          allLogs.push({
            id: `web-${log.blockNumber}-${log.logIndex}`,
            agentRole: 'CMO',
            action: 'WEB_SCRAPED',
            description: `${args.source?.slice(0, 40) || '?'} (${args.dataLength?.toString() || '0'} bytes)`,
            timestamp: ts,
          });
        }
      } catch { /* skip */ }

      // CMO: SentimentAnalyzed
      try {
        const logs = await publicClient.getLogs({
          address: cmoAddress,
          event: SENTIMENT_ANALYZED_EVENT,
          fromBlock,
          toBlock: 'latest',
        });
        for (const log of logs) {
          const args = log.args as { source?: string; sentiment?: number; confidence?: bigint; timestamp?: bigint };
          if (!args.timestamp) continue;
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
      } catch { /* skip */ }

      // CEO: DecisionMade
      try {
        const logs = await publicClient.getLogs({
          address: ceoAddress,
          event: DECISION_MADE_EVENT,
          fromBlock,
          toBlock: 'latest',
        });
        for (const log of logs) {
          const args = log.args as { id?: bigint; action?: number; rationale?: string; confidenceScore?: bigint; timestamp?: bigint };
          if (!args.timestamp) continue;
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
      } catch { /* skip */ }

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
    fetchEvents();
    const interval = setInterval(fetchEvents, 15_000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return { events, isLoading };
}
