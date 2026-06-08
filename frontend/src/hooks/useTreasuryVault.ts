'use client';

// ============================================================
// SovereignMind — TreasuryVault Read Hooks
// ============================================================
// Wagmi v2 hooks for reading from the TreasuryVault contract.
// Provides hooks for querying treasury balance, decisions, and status.

import { useReadContract } from 'wagmi';
import { contracts } from '@/lib/somnia/contracts';

// ----- Types -----

/** A single treasury decision record */
export interface TreasuryDecision {
  agent: `0x${string}`;
  decisionType: string;
  rationale: string;
  timestamp: bigint;
  txHash: `0x${string}`;
}

// ----- Read Hooks -----

/**
 * Reads the current native token balance held by the treasury.
 * @returns wagmi query result containing the balance (uint256).
 */
export function useTreasuryBalance() {
  return useReadContract({
    address: contracts.treasuryVault.address,
    abi: contracts.treasuryVault.abi,
    functionName: 'getBalance',
    query: { refetchInterval: 15_000 },
  });
}

/**
 * Reads the total number of decisions recorded in the treasury.
 * @returns wagmi query result containing the decision count (uint256).
 */
export function useTreasuryDecisionCount() {
  return useReadContract({
    address: contracts.treasuryVault.address,
    abi: contracts.treasuryVault.abi,
    functionName: 'getDecisionCount',
    query: { refetchInterval: 15_000 },
  });
}

/**
 * Reads the most recent N decisions from the treasury.
 * @param count - Number of recent decisions to fetch.
 * @returns wagmi query result containing an array of Decision structs.
 */
export function useTreasuryRecentDecisions(count: bigint | undefined) {
  return useReadContract({
    address: contracts.treasuryVault.address,
    abi: contracts.treasuryVault.abi,
    functionName: 'getRecentDecisions',
    args: count !== undefined ? [count] : undefined,
    query: {
      enabled: count !== undefined,
      refetchInterval: 15_000,
    },
  });
}

/**
 * Reads the total number of operations performed by the treasury.
 * @returns wagmi query result containing total operations (uint256).
 */
export function useTreasuryTotalOperations() {
  return useReadContract({
    address: contracts.treasuryVault.address,
    abi: contracts.treasuryVault.abi,
    functionName: 'totalOperations',
    query: { refetchInterval: 15_000 },
  });
}

/**
 * Reads the total amount of native tokens deposited into the treasury.
 * @returns wagmi query result containing total deposited (uint256).
 */
export function useTreasuryTotalDeposited() {
  return useReadContract({
    address: contracts.treasuryVault.address,
    abi: contracts.treasuryVault.abi,
    functionName: 'totalNativeDeposited',
    query: { refetchInterval: 15_000 },
  });
}

/**
 * Checks whether the treasury contract is currently paused.
 * @returns wagmi query result containing a boolean.
 */
export function useTreasuryPaused() {
  return useReadContract({
    address: contracts.treasuryVault.address,
    abi: contracts.treasuryVault.abi,
    functionName: 'paused',
    query: { refetchInterval: 15_000 },
  });
}
