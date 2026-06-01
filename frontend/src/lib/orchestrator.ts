// ============================================================
// SovereignMind — Orchestrator Backend API Client
// ============================================================
// Talks to the Express health server (orchestrator/src/health.ts).

export const ORCHESTRATOR_URL =
  process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:3001';

export type CycleStep =
  | 'IDLE'
  | 'FUNDING'
  | 'FETCHING_PRICES'
  | 'ANALYZING_RISK'
  | 'SCANNING_MARKET'
  | 'CEO_DECISION'
  | 'COMPLETED'
  | 'ERROR';

export interface AgentBalance {
  name: string;
  address: string;
  balance: string;
  belowMinimum: boolean;
}

export interface BalanceReport {
  wallet: { address: string; balance: string };
  agents: AgentBalance[];
  timestamp: string;
}

export interface OrchestratorStatus {
  isRunning: boolean;
  currentStep: CycleStep;
  cycleCount: number;
  lastCycle: {
    success: boolean;
    cycleId: number;
    startedAt: string;
    completedAt: string;
    error?: string;
  } | null;
  nextCycleAt: string | null;
  uptime: number;
  balances: BalanceReport | null;
}

export interface StatusResponse extends OrchestratorStatus {
  balances: BalanceReport | null;
  scheduler: { isActive: boolean; nextCycleAt: string | null; intervalMinutes: number };
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'error';
  uptime: number;
  orchestrator: OrchestratorStatus;
  timestamp: string;
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${ORCHESTRATOR_URL}${path}`, { signal });
  if (!res.ok) throw new Error(`Orchestrator ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchHealth = (signal?: AbortSignal) => get<HealthResponse>('/health', signal);
export const fetchStatus = (signal?: AbortSignal) => get<StatusResponse>('/status', signal);

export async function triggerCycle(): Promise<{ message: string; cycleId: number }> {
  const res = await fetch(`${ORCHESTRATOR_URL}/trigger`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Trigger failed: ${res.status}`);
  }
  return res.json();
}
