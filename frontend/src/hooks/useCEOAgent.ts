'use client';

// ============================================================
// SovereignMind — CEOAgent Read Hooks
// ============================================================
// Wagmi v2 hooks for reading from the CEOAgent contract.
// Provides hooks for querying CEO decisions, cycle phase, and metrics.

import { useReadContract } from 'wagmi';
import { contracts } from '@/lib/somnia/contracts';

// ----- Types -----

/** Decision cycle phases */
export enum CyclePhase {
  IDLE = 0,
  GATHERING_DATA = 1,
  ANALYZING = 2,
  EXECUTING = 3,
}

/** Performance metrics returned by getPerformanceMetrics */
export interface CEOPerformanceMetrics {
  completedCycles: bigint;
  totalDecisions: bigint;
  averageCycleTime: bigint;
  lastCycleTimestamp: bigint;
}

// ----- Read Hooks -----

/**
 * Reads the total number of executive decisions made by the CEO agent.
 * @returns wagmi query result containing the decision count (uint256).
 */
export function useCEODecisionCount() {
  return useReadContract({
    address: contracts.ceoAgent.address,
    abi: contracts.ceoAgent.abi,
    functionName: 'getDecisionCount',
    query: { refetchInterval: 15_000 },
  });
}

/**
 * Reads the most recent N executive decisions.
 * @param count - Number of recent decisions to fetch.
 * @returns wagmi query result containing an array of ExecutiveDecision structs.
 */
export function useCEORecentDecisions(count: bigint | undefined) {
  return useReadContract({
    address: contracts.ceoAgent.address,
    abi: contracts.ceoAgent.abi,
    functionName: 'getRecentDecisions',
    args: count !== undefined ? [count] : undefined,
    query: {
      enabled: count !== undefined,
      refetchInterval: 15_000,
    },
  });
}

/**
 * Reads the current decision cycle phase.
 * @returns wagmi query result containing the phase (uint8 mapped to CyclePhase).
 */
export function useCEOCurrentPhase() {
  return useReadContract({
    address: contracts.ceoAgent.address,
    abi: contracts.ceoAgent.abi,
    functionName: 'getCurrentPhase',
    query: { refetchInterval: 10_000 },
  });
}

/**
 * Reads the CEO agent's aggregated performance metrics.
 * @returns wagmi query result with (completedCycles, totalDecisions, averageCycleTime, lastCycleTimestamp).
 */
export function useCEOPerformanceMetrics() {
  return useReadContract({
    address: contracts.ceoAgent.address,
    abi: contracts.ceoAgent.abi,
    functionName: 'getPerformanceMetrics',
    query: { refetchInterval: 30_000 },
  });
}

/**
 * Reads the earliest timestamp at which the next decision cycle may begin.
 * @returns wagmi query result containing the timestamp (uint256).
 */
export function useCEONextCycleAllowed() {
  return useReadContract({
    address: contracts.ceoAgent.address,
    abi: contracts.ceoAgent.abi,
    functionName: 'getNextCycleAllowed',
  });
}

/**
 * Reads the configured interval (in seconds) between decision cycles.
 * @returns wagmi query result containing the interval (uint256).
 */
export function useCEOCycleInterval() {
  return useReadContract({
    address: contracts.ceoAgent.address,
    abi: contracts.ceoAgent.abi,
    functionName: 'decisionCycleInterval',
  });
}

/**
 * Reads the current strategic objective set by the operator via setObjective().
 * @returns wagmi query result containing the objective string (or empty if never set).
 */
export function useCEOCurrentObjective() {
  return useReadContract({
    address: contracts.ceoAgent.address,
    abi: contracts.ceoAgent.abi,
    functionName: 'currentObjective',
    query: { refetchInterval: 30_000 },
  });
}
