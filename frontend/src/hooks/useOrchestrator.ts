// ============================================================
// useOrchestrator — poll backend status + trigger cycles + agent toggles
// ============================================================

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchStatus,
  fetchAgentToggles,
  triggerCycle,
  enableAgent as apiEnableAgent,
  disableAgent as apiDisableAgent,
  type StatusResponse,
  type AgentToggleState,
  type OrchestratorAgentRole,
} from '@/lib/orchestrator';

export function useOrchestrator(pollMs = 10000) {
  const queryClient = useQueryClient();

  // ── Status query ────────────────────────────────────────────
  const query = useQuery<StatusResponse>({
    queryKey: ['orchestrator-status'],
    queryFn: ({ signal }) => fetchStatus(signal),
    refetchInterval: pollMs,
    retry: 1,
  });

  // ── Agent toggles query ────────────────────────────────────
  const togglesQuery = useQuery<AgentToggleState>({
    queryKey: ['orchestrator-agent-toggles'],
    queryFn: ({ signal }) => fetchAgentToggles(signal),
    refetchInterval: pollMs,
    retry: 1,
  });

  // ── Trigger cycle mutation ─────────────────────────────────
  const trigger = useMutation({
    mutationFn: triggerCycle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orchestrator-status'] }),
  });

  // ── Enable agent mutation ──────────────────────────────────
  const enableAgent = useMutation({
    mutationFn: (role: OrchestratorAgentRole) => apiEnableAgent(role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchestrator-agent-toggles'] });
      queryClient.invalidateQueries({ queryKey: ['orchestrator-status'] });
    },
  });

  // ── Disable agent mutation ─────────────────────────────────
  const disableAgent = useMutation({
    mutationFn: (role: OrchestratorAgentRole) => apiDisableAgent(role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchestrator-agent-toggles'] });
      queryClient.invalidateQueries({ queryKey: ['orchestrator-status'] });
    },
  });

  return {
    status: query.data,
    isOnline: query.isSuccess,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    trigger,
    agentToggles: togglesQuery.data,
    enableAgent,
    disableAgent,
  };
}
