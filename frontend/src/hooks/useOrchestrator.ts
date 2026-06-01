// ============================================================
// useOrchestrator — poll backend status + trigger cycles
// ============================================================

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchStatus, triggerCycle, type StatusResponse } from '@/lib/orchestrator';

export function useOrchestrator(pollMs = 10000) {
  const query = useQuery<StatusResponse>({
    queryKey: ['orchestrator-status'],
    queryFn: ({ signal }) => fetchStatus(signal),
    refetchInterval: pollMs,
    retry: 1,
  });

  const queryClient = useQueryClient();
  const trigger = useMutation({
    mutationFn: triggerCycle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orchestrator-status'] }),
  });

  return {
    status: query.data,
    isOnline: query.isSuccess,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    trigger,
  };
}
