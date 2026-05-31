'use client';

// ============================================================
// SovereignMind — CMOAgent Read Hooks
// ============================================================
// Wagmi v2 hooks for reading from the CMOAgent contract.
// Provides hooks for querying market signals and sentiment data.

import { useReadContract } from 'wagmi';
import { contracts } from '@/lib/somnia/contracts';

// ----- Types -----

/** Aggregated sentiment breakdown */
export interface AggregatedSentiment {
  bullish: bigint;
  bearish: bigint;
  neutral: bigint;
  dominant: number; // uint8
}

// ----- Read Hooks -----

/**
 * Reads the total number of market signals recorded.
 * @returns wagmi query result containing the signal count (uint256).
 */
export function useCMOSignalCount() {
  return useReadContract({
    address: contracts.cmoAgent.address,
    abi: contracts.cmoAgent.abi,
    functionName: 'getSignalCount',
  });
}

/**
 * Reads the aggregated sentiment breakdown across all signals.
 * @returns wagmi query result with (bullish, bearish, neutral, dominant).
 */
export function useCMOAggregatedSentiment() {
  return useReadContract({
    address: contracts.cmoAgent.address,
    abi: contracts.cmoAgent.abi,
    functionName: 'getAggregatedSentiment',
  });
}

/**
 * Reads the most recent N market signals.
 * @param count - Number of recent signals to fetch.
 * @returns wagmi query result containing an array of MarketSignal structs.
 */
export function useCMOSignalHistory(count: bigint | undefined) {
  return useReadContract({
    address: contracts.cmoAgent.address,
    abi: contracts.cmoAgent.abi,
    functionName: 'getSignalHistory',
    args: count !== undefined ? [count] : undefined,
    query: {
      enabled: count !== undefined,
    },
  });
}

/**
 * Reads the latest market signal emitted by the CMO agent.
 * @returns wagmi query result containing a MarketSignal struct.
 */
export function useCMOLatestSignal() {
  return useReadContract({
    address: contracts.cmoAgent.address,
    abi: contracts.cmoAgent.abi,
    functionName: 'getLatestSignal',
  });
}

/**
 * Reads the total number of market scans performed.
 * @returns wagmi query result containing the scan count (uint256).
 */
export function useCMOScanCount() {
  return useReadContract({
    address: contracts.cmoAgent.address,
    abi: contracts.cmoAgent.abi,
    functionName: 'scanCount',
  });
}
