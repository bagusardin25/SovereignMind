'use client';

// ============================================================
// SovereignMind — Somnia Receipts Service
// ============================================================
// Utilities for building receipt URLs, explorer links, and
// fetching execution receipt data from on-chain events.
//
// Strategy: Since receipts.net.somnia.host is not live, we use
// the block explorer as the primary verification link and
// construct receipt URLs from on-chain requestIds for future use.

import { SOMNIA_TESTNET, AGENT_RUNNER_ADDRESS } from '@/lib/constants';

// ── URL Builders ──────────────────────────────────────────────

/** Block explorer URL for a given transaction hash */
export function buildExplorerTxUrl(txHash: string): string {
  return `${SOMNIA_TESTNET.blockExplorers.default.url}/tx/${txHash}`;
}

/** Block explorer URL for a given address */
export function buildExplorerAddressUrl(address: string): string {
  return `${SOMNIA_TESTNET.blockExplorers.default.url}/address/${address}`;
}

/** Receipt URL for a given requestId (future Receipts API) */
export function buildReceiptUrl(requestId: string): string {
  // When Receipts API becomes available, replace this
  // For now, point to the AgentRunner address on explorer
  return buildExplorerAddressUrl(AGENT_RUNNER_ADDRESS);
}

/** Build a receipt URL falling back to explorer if Receipts API is down */
export function buildVerificationUrl(requestId: string | null, txHash: string | null): string {
  if (txHash) return buildExplorerTxUrl(txHash);
  if (requestId) return buildReceiptUrl(requestId);
  return '#';
}

// ── Verification Status ───────────────────────────────────────

export type VerificationStatus = 'verified' | 'pending' | 'failed' | 'unknown';

export function getVerificationStatus(
  outcome: string,
  txHash: string | null,
): VerificationStatus {
  if (!txHash) return 'unknown';
  if (outcome === 'executed') return 'verified';
  if (outcome === 'pending') return 'pending';
  if (outcome === 'failed' || outcome === 'rejected') return 'failed';
  return 'unknown';
}

// ── Event Signatures (ABI-encoded topic0 hashes) ──────────────
// These are used to query on-chain logs from our agent contracts

export const EVENT_SIGNATURES = {
  // CEOAgent events
  DecisionCycleStarted: 'DecisionCycleStarted(uint256,uint256)',
  DecisionMade: 'DecisionMade(uint256,string,string,uint256,uint256)',
  DecisionExecuted: 'DecisionExecuted(uint256,bool,uint256)',
  CycleCompleted: 'CycleCompleted(uint256,uint256,uint256)',

  // CFOAgent events
  AnalysisStarted: 'AnalysisStarted(uint256,string,uint256)',
  PriceFetched: 'PriceFetched(string,uint256,uint256)',
  RiskAnalyzed: 'RiskAnalyzed(uint256,string,uint256)',

  // CMOAgent events
  ScanStarted: 'ScanStarted(uint256,string,uint256)',
  SentimentAnalyzed: 'SentimentAnalyzed(string,uint8,uint256,uint256)',
  MarketAlert: 'MarketAlert(uint8,uint256,string,uint256)',

  // TreasuryVault events
  DecisionRecorded: 'DecisionRecorded(uint256,address,string,uint8,uint256)',
  Rebalanced: 'Rebalanced(address,address,uint256,address,string)',

  // AgentRunner events (from MockAgentRunner - real one has same signature)
  RequestCreated: 'RequestCreated(uint256,uint256,address)',
} as const;

// ── Agent Runner ABI (minimal — just the events we need) ──────

export const AGENT_RUNNER_ABI = [
  {
    type: 'event',
    name: 'RequestCreated',
    inputs: [
      { name: 'requestId', type: 'uint256', indexed: true },
      { name: 'agentId', type: 'uint256', indexed: false },
      { name: 'callbackContract', type: 'address', indexed: false },
    ],
  },
] as const;
