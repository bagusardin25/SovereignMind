'use client';

// ============================================================
// SovereignMind — Composite Agent Data Hook
// ============================================================
// Builds Agent[] from on-chain data by combining AgentRegistry info
// with CEO/CFO/CMO-specific hooks and static metadata.

import { useMemo } from 'react';
import { useAgentInfo, useAgentCount, useTotalDecisions } from './useAgentRegistry';
import { useCEOCurrentPhase, useCEOPerformanceMetrics, useCEODecisionCount } from './useCEOAgent';
import { useCFORiskScore, useCFOAnalysisCount, useCFOLatestRisk } from './useCFOAgent';
import { useCMOSignalCount, useCMOLatestSignal } from './useCMOAgent';
import { useOrchestrator } from './useOrchestrator';
import { contracts } from '@/lib/somnia/contracts';
import {
  AGENT_METADATA,
  cyclePhaseToStatus,
  CYCLE_PHASE_NAMES,
  toJsTimestamp,
} from '@/lib/agent-metadata';
import type { Agent, AgentRole, AgentStatus, SystemHealth } from '@/lib/types';
import type { AgentInfo } from './useAgentRegistry';

// ----- Helper -----

function buildAgent(
  role: AgentRole,
  data: AgentInfo | undefined,
  status: AgentStatus,
  currentTask: string,
  decisionsOverride?: number,
): Agent {
  const meta = AGENT_METADATA[role];
  const now = Date.now();
  const registeredAt = data?.registeredAt ? Number(data.registeredAt) * 1000 : 0;
  const lastAction = data?.lastActionTimestamp ? Number(data.lastActionTimestamp) * 1000 : 0;
  const decisions = decisionsOverride ?? (data?.decisionsCount ? Number(data.decisionsCount) : 0);
  const success = data?.successCount ? Number(data.successCount) : 0;

  // Determine effective status:
  // - If we have on-chain data AND the agent was registered (registeredAt > 0)
  //   but is now deactivated (isActive === false), show 'error'.
  // - If registeredAt === 0, the agent isn't registered on-chain yet — use
  //   the status derived from agent-specific hooks (idle/active/processing).
  const isRegistered = data != null && Number(data.registeredAt) > 0;
  const isDeactivated = isRegistered && data.isActive === false;
  const effectiveStatus: AgentStatus = isDeactivated ? 'error' : status;

  return {
    id: `agent-${role.toLowerCase()}`,
    role,
    name: meta.name,
    description: meta.description,
    status: effectiveStatus,
    currentTask,
    lastAction: lastAction > 0 ? 'Contract interaction' : null,
    lastActionTimestamp: lastAction > 0 ? lastAction : null,
    contractAddress: meta.contractAddress,
    uptime: registeredAt > 0 ? Math.min(99.9, ((now - registeredAt) / now) * 100) : 99.9,
    decisionsCount: decisions,
    successRate: decisions > 0 ? Math.round((success / decisions) * 1000) / 10 : 100,
    avgResponseTime: 0,
    objective: meta.objective,
  };
}

// ----- Composite Hook -----

export function useAgentData() {
  // Registry info for each known agent
  const ceoInfo = useAgentInfo(contracts.ceoAgent.address);
  const cfoInfo = useAgentInfo(contracts.cfoAgent.address);
  const cmoInfo = useAgentInfo(contracts.cmoAgent.address);

  // CEO-specific
  const ceoPhase = useCEOCurrentPhase();
  const ceoMetrics = useCEOPerformanceMetrics();
  const ceoDecisionCount = useCEODecisionCount();

  // CFO-specific
  const cfoAnalysisCount = useCFOAnalysisCount();
  const cfoLatestRisk = useCFOLatestRisk();

  // CMO-specific
  const cmoSignalCount = useCMOSignalCount();
  const cmoLatestSignal = useCMOLatestSignal();

  // Aggregates
  const { data: totalDecisions } = useTotalDecisions();
  const { data: agentCount } = useAgentCount();

  // Orchestrator status
  const { status: orchestratorStatus, isOnline } = useOrchestrator();

  const isLoading = ceoInfo.isLoading || cfoInfo.isLoading || cmoInfo.isLoading;

  const agents = useMemo<Agent[]>(() => {
    // CEO agent
    const phaseVal = typeof ceoPhase.data === 'number'
      ? ceoPhase.data
      : Number(ceoPhase.data ?? 0);
    const ceoStatus = cyclePhaseToStatus(phaseVal);
    const ceoPhaseName = CYCLE_PHASE_NAMES[phaseVal] || 'Idle';
    const ceoTask = ceoPhaseName === 'Idle' ? 'Awaiting next decision cycle' : ceoPhaseName;
    const ceoDecisions = ceoDecisionCount.data != null ? Number(ceoDecisionCount.data) : undefined;

    // CFO agent
    const cfoHasData = cfoLatestRisk.data != null;
    const cfoStatus: AgentStatus = cfoHasData ? 'active' : 'idle';
    const cfoTask = cfoHasData ? 'Risk analysis active' : 'Awaiting analysis task';
    const cfoDecisions = cfoAnalysisCount.data != null ? Number(cfoAnalysisCount.data) : undefined;

    // CMO agent
    const cmoHasData = cmoLatestSignal.data != null;
    const cmoStatus: AgentStatus = cmoHasData ? 'active' : 'idle';
    const cmoTask = cmoHasData ? 'Market monitoring active' : 'Awaiting scan task';
    const cmoDecisions = cmoSignalCount.data != null ? Number(cmoSignalCount.data) : undefined;

    return [
      buildAgent('CEO', ceoInfo.data as AgentInfo | undefined, ceoStatus, ceoTask, ceoDecisions),
      buildAgent('CFO', cfoInfo.data as AgentInfo | undefined, cfoStatus, cfoTask, cfoDecisions),
      buildAgent('CMO', cmoInfo.data as AgentInfo | undefined, cmoStatus, cmoTask, cmoDecisions),
    ];
  }, [
    ceoInfo.data, cfoInfo.data, cmoInfo.data,
    ceoPhase.data, ceoDecisionCount.data,
    cfoAnalysisCount.data, cfoLatestRisk.data,
    cmoSignalCount.data, cmoLatestSignal.data,
  ]);

  // Build system health from on-chain + orchestrator
  const systemHealth = useMemo<SystemHealth>(() => {
    const onlineCount = agents.filter(a => a.status !== 'error').length;
    const metricsData = ceoMetrics.data as
      | { completedCycles: bigint; totalDecisions: bigint; averageCycleTime: bigint; lastCycleTimestamp: bigint }
      | undefined;

    return {
      status: isOnline && onlineCount === 3 ? 'healthy' : onlineCount > 0 ? 'degraded' : 'offline',
      agentsOnline: onlineCount,
      totalAgents: 3,
      lastCycleTimestamp: metricsData?.lastCycleTimestamp
        ? Number(metricsData.lastCycleTimestamp) * 1000
        : Date.now(),
      avgCycleTime: metricsData?.averageCycleTime
        ? Number(metricsData.averageCycleTime) * 1000
        : 0,
      networkLatency: 0,
    };
  }, [agents, ceoMetrics.data, isOnline]);

  return {
    agents,
    isLoading,
    totalDecisions: totalDecisions != null ? Number(totalDecisions) : 0,
    agentCount: agentCount != null ? Number(agentCount) : 3,
    systemHealth,
    orchestratorStatus,
    isOrchestratorOnline: isOnline,
  };
}
