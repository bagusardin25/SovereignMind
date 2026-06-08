'use client';

// ============================================================
// SovereignMind — CFOAgent Read Hooks
// ============================================================
// Wagmi v2 hooks for reading from the CFOAgent contract.
// Provides hooks for querying risk assessments, prices, and analysis data.

import { useReadContract } from 'wagmi';
import { contracts } from '@/lib/somnia/contracts';

// ----- Types -----

/** Risk assessment returned by getLatestRisk */
export interface RiskAssessment {
  score: bigint;
  recommendation: string;
  timestamp: bigint;
}

/** Price data returned by getLatestPrice */
export interface PriceData {
  symbol: string;
  price: bigint;
  timestamp: bigint;
}

// ----- Read Hooks -----

/**
 * Reads the latest risk assessment from the CFO agent.
 * @returns wagmi query result containing a RiskAssessment struct.
 */
export function useCFOLatestRisk() {
  return useReadContract({
    address: contracts.cfoAgent.address,
    abi: contracts.cfoAgent.abi,
    functionName: 'getLatestRisk',
    query: { refetchInterval: 15_000 },
  });
}

/**
 * Reads the current risk score (0–10000 basis points).
 * @returns wagmi query result containing the risk score (uint256).
 */
export function useCFORiskScore() {
  return useReadContract({
    address: contracts.cfoAgent.address,
    abi: contracts.cfoAgent.abi,
    functionName: 'getCurrentRiskScore',
    query: { refetchInterval: 30_000 },
  });
}

/**
 * Reads the latest price data for a given symbol.
 * @param symbol - The token/asset symbol to query (e.g. "ETH").
 * @returns wagmi query result containing a PriceData struct.
 */
export function useCFOLatestPrice(symbol: string | undefined) {
  return useReadContract({
    address: contracts.cfoAgent.address,
    abi: contracts.cfoAgent.abi,
    functionName: 'getLatestPrice',
    args: symbol ? [symbol] : undefined,
    query: {
      enabled: !!symbol,
      refetchInterval: 15_000,
    },
  });
}

/**
 * Reads the list of all tracked symbol strings.
 * @returns wagmi query result containing an array of symbol strings.
 */
export function useCFOTrackedSymbols() {
  return useReadContract({
    address: contracts.cfoAgent.address,
    abi: contracts.cfoAgent.abi,
    functionName: 'getTrackedSymbols',
    query: { refetchInterval: 30_000 },
  });
}

/**
 * Reads the total number of analyses performed by the CFO agent.
 * @returns wagmi query result containing the analysis count (uint256).
 */
export function useCFOAnalysisCount() {
  return useReadContract({
    address: contracts.cfoAgent.address,
    abi: contracts.cfoAgent.abi,
    functionName: 'getAnalysisCount',
    query: { refetchInterval: 15_000 },
  });
}

/**
 * Reads the configured risk threshold in basis points.
 * @returns wagmi query result containing the threshold (uint256).
 */
export function useCFORiskThreshold() {
  return useReadContract({
    address: contracts.cfoAgent.address,
    abi: contracts.cfoAgent.abi,
    functionName: 'riskThreshold',
    query: { refetchInterval: 30_000 },
  });
}
