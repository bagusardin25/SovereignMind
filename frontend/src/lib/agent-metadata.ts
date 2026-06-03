// ============================================================
// SovereignMind — Agent Metadata & On-Chain Enum Mappings
// ============================================================
// Static metadata for each agent role (names, descriptions, objectives).
// These are design constants — not mock data — since they're inherent
// to the system design and don't change at runtime.
// Also provides mappings from on-chain enum values to frontend types.

import { contracts } from './somnia/contracts';
import type { AgentRole, AgentStatus, DecisionType, DecisionOutcome, MarketSignal } from './types';

// ----- Agent Static Metadata -----

export interface AgentMetadata {
  name: string;
  description: string;
  objective: string;
  contractAddress: `0x${string}`;
}

export const AGENT_METADATA: Record<AgentRole, AgentMetadata> = {
  CEO: {
    name: 'Strategic Orchestrator',
    description: 'Sets strategic objectives, delegates tasks, synthesizes CFO + CMO reports into final decisions',
    objective: 'Maximize risk-adjusted returns through autonomous multi-agent coordination',
    contractAddress: contracts.ceoAgent.address,
  },
  CFO: {
    name: 'Risk Analyst',
    description: 'Fetches real-time price data via JSON API Agent, calculates composite risk scores via LLM Inference',
    objective: 'Minimize portfolio risk through continuous financial analysis and monitoring',
    contractAddress: contracts.cfoAgent.address,
  },
  CMO: {
    name: 'Market Sentinel',
    description: 'Scrapes market sentiment from unstructured sources, classifies signals (bullish/bearish/neutral)',
    objective: 'Identify market opportunities through real-time sentiment and trend analysis',
    contractAddress: contracts.cmoAgent.address,
  },
};

// Map contract address to agent role
export const ADDRESS_TO_ROLE: Record<string, AgentRole> = {
  [contracts.ceoAgent.address.toLowerCase()]: 'CEO',
  [contracts.cfoAgent.address.toLowerCase()]: 'CFO',
  [contracts.cmoAgent.address.toLowerCase()]: 'CMO',
};

// ----- On-Chain Enum Mappings -----

// CEOAgent.CyclePhase → AgentStatus
export function cyclePhaseToStatus(phase: number): AgentStatus {
  switch (phase) {
    case 0: return 'idle';       // IDLE
    case 1: return 'processing'; // GATHERING_DATA
    case 2: return 'processing'; // ANALYZING
    case 3: return 'active';     // EXECUTING
    default: return 'idle';
  }
}

export const CYCLE_PHASE_NAMES = ['Idle', 'Gathering Data', 'Analyzing', 'Executing'] as const;

// CEOAgent.DecisionAction → DecisionType
export const CEO_DECISION_ACTIONS: DecisionType[] = ['hold', 'rebalance', 'allocate'];

// TreasuryVault.DecisionOutcome → DecisionOutcome
export const TREASURY_OUTCOMES: DecisionOutcome[] = ['pending', 'executed', 'rejected', 'failed'];

// CMOAgent.Sentiment → MarketSignal
export const CMO_SENTIMENTS: MarketSignal[] = ['neutral', 'bullish', 'bearish'];

// ----- Utility Functions -----

/** Calculate uptime percentage from registration timestamp and optional last activity */
export function calculateUptime(registeredAtSeconds: bigint, lastActionSeconds?: number): number {
  const now = Math.floor(Date.now() / 1000);
  const registered = Number(registeredAtSeconds);
  if (registered <= 0 || registered >= now) return 0;

  if (lastActionSeconds && lastActionSeconds > 0 && lastActionSeconds <= now) {
    const hoursSinceLastAction = (now - lastActionSeconds) / 3600;
    const score = Math.max(0, 99.9 - hoursSinceLastAction * 5);
    return Math.round(score * 10) / 10;
  }

  const hoursSinceRegistration = (now - registered) / 3600;
  const score = Math.max(0, 99.9 - hoursSinceRegistration * 2);
  return Math.round(score * 10) / 10;
}

/** Convert bigint timestamp (seconds) to JS timestamp (milliseconds) */
export function toJsTimestamp(seconds: bigint | number | null | undefined): number {
  if (seconds == null) return 0;
  const timestamp = Number(seconds);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp * 1000 : 0;
}
