// ============================================================
// SovereignMind — TypeScript Type Definitions
// ============================================================

export type AgentRole = 'CEO' | 'CFO' | 'CMO';

export type AgentStatus = 'active' | 'processing' | 'idle' | 'error';

export interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  description: string;
  status: AgentStatus;
  currentTask: string | null;
  lastAction: string | null;
  lastActionTimestamp: number | null;
  contractAddress: string;
  uptime: number; // percentage
  decisionsCount: number;
  successRate: number; // percentage
  avgResponseTime: number; // milliseconds
  objective: string | null;
}

export type DecisionType = 'rebalance' | 'allocate' | 'hold' | 'alert' | 'market_signal';

export type DecisionOutcome = 'executed' | 'pending' | 'rejected' | 'failed';

export type MarketSignal = 'bullish' | 'bearish' | 'neutral';

export interface Decision {
  id: string;
  agentRole: AgentRole;
  type: DecisionType;
  title: string;
  rationale: string;
  action: string;
  outcome: DecisionOutcome;
  txHash: string | null;
  receiptUrl: string | null;
  timestamp: number;
  confidenceScore: number; // 0-100
  inputData?: string;
  llmReasoning?: string;
  marketSignal?: MarketSignal;
}

export interface TokenHolding {
  symbol: string;
  name: string;
  balance: number;
  price: number;
  value: number;
  change24h: number; // percentage
  allocation: number; // percentage
  color: string;
  iconUrl?: string;
}

export interface TreasuryState {
  totalValue: number;
  change24h: number; // percentage
  holdings: TokenHolding[];
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'rebalance' | 'withdrawal';
  token: string;
  amount: number;
  value: number;
  from: string;
  to: string;
  txHash: string;
  timestamp: number;
  reason?: string;
  agentRole?: AgentRole;
}

export interface Receipt {
  requestId: string;           // uint256 from createRequest
  agentId?: string;            // Somnia base agent ID
  agentType: 'json_api' | 'llm_inference' | 'llm_parse_website' | string;
  status: 'completed' | 'pending' | 'failed';
  input: string;               // prompt / API URL
  output: string;              // agent response
  timestamp: number;
  txHash: string;              // transaction hash
  explorerUrl: string;         // block explorer link
  receiptUrl: string;          // receipts API link (or explorer fallback)
  gasUsed: number;
  executionTime: number;       // ms
  validatorConsensus?: boolean; // BFT consensus achieved
  callbackContract?: string;   // contract that received response
}

export interface ActivityEvent {
  id: string;
  agentRole: AgentRole;
  action: string;
  description: string;
  timestamp: number;
  relatedDecisionId?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'offline';
  agentsOnline: number;
  totalAgents: number;
  lastCycleTimestamp: number;
  avgCycleTime: number; // ms
  networkLatency: number; // ms
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}
