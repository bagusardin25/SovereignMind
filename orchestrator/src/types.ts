// ============================================================
// SovereignMind Orchestrator — TypeScript Types
// ============================================================

export type CycleStep =
  | 'IDLE'
  | 'FUNDING'
  | 'FETCHING_PRICES'
  | 'ANALYZING_RISK'
  | 'SCANNING_MARKET'
  | 'CEO_DECISION'
  | 'PORTFOLIO_REBALANCE'
  | 'COMPLETED'
  | 'ERROR';

export interface CycleResult {
  success: boolean;
  cycleId: number;
  startedAt: Date;
  completedAt: Date;
  steps: StepResult[];
  error?: string;
}

export interface StepResult {
  step: CycleStep;
  success: boolean;
  txHash?: string;
  duration: number; // ms
  data?: Record<string, unknown>;
  error?: string;
}

export interface BalanceReport {
  wallet: { address: string; balance: string };
  agents: {
    name: string;
    address: string;
    balance: string;
    belowMinimum: boolean;
  }[];
  timestamp: Date;
}

export interface OrchestratorStatus {
  isRunning: boolean;
  currentStep: CycleStep;
  cycleCount: number;
  lastCycle: CycleResult | null;
  nextCycleAt: Date | null;
  uptime: number;
  balances: BalanceReport | null;
}

export interface PriceConfig {
  symbol: string;
  apiUrl: string;
  jsonPath: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'error';
  uptime: number;
  orchestrator: OrchestratorStatus;
  timestamp: string;
}
