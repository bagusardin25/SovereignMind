'use client';

// ============================================================
// SovereignMind — Contract Write Action Hooks
// ============================================================
// Wagmi v2 hooks for writing to SovereignMind contracts.
// Each hook wraps useWriteContract + useWaitForTransactionReceipt
// and returns a consistent { write, txHash, isPending, isConfirming, isSuccess, error } shape.

import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { contracts } from '@/lib/somnia/contracts';

// ─────────────────────────────────────────────────────────────
// CEO Agent Actions
// ─────────────────────────────────────────────────────────────

/**
 * Initiates a new CEO decision cycle.
 * This is a payable function — pass `value` to fund gas / oracle fees.
 */
export function useInitiateDecisionCycle() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const initiate = (value?: bigint) => {
    writeContract({
      address: contracts.ceoAgent.address,
      abi: contracts.ceoAgent.abi,
      functionName: 'initiateDecisionCycle',
      ...(value !== undefined && { value }),
    });
  };

  return { initiate, txHash: hash, isPending, isConfirming, isSuccess, error };
}

// ─────────────────────────────────────────────────────────────
// CFO Agent Actions
// ─────────────────────────────────────────────────────────────

/**
 * Fetches a price for the given symbol via an oracle call.
 * @returns write function accepting (symbol, apiUrl, jsonPath, value?).
 */
export function useFetchPrice() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const fetchPrice = (symbol: string, apiUrl: string, jsonPath: string, value?: bigint) => {
    writeContract({
      address: contracts.cfoAgent.address,
      abi: contracts.cfoAgent.abi,
      functionName: 'fetchPrice',
      args: [symbol, apiUrl, jsonPath],
      ...(value !== undefined && { value }),
    });
  };

  return { fetchPrice, txHash: hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Triggers a risk analysis by the CFO agent.
 */
export function useAnalyzeRisk() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const analyzeRisk = (value?: bigint) => {
    writeContract({
      address: contracts.cfoAgent.address,
      abi: contracts.cfoAgent.abi,
      functionName: 'analyzeRisk',
      ...(value !== undefined && { value }),
    });
  };

  return { analyzeRisk, txHash: hash, isPending, isConfirming, isSuccess, error };
}

// ─────────────────────────────────────────────────────────────
// CMO Agent Actions
// ─────────────────────────────────────────────────────────────

/**
 * Triggers a market scan for the given URL.
 * @returns write function accepting (url, value?).
 */
export function useScanMarket() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const scanMarket = (url: string, value?: bigint) => {
    writeContract({
      address: contracts.cmoAgent.address,
      abi: contracts.cmoAgent.abi,
      functionName: 'scanMarket',
      args: [url],
      ...(value !== undefined && { value }),
    });
  };

  return { scanMarket, txHash: hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Analyzes sentiment from a given source and text input.
 * @returns write function accepting (source, text, value?).
 */
export function useAnalyzeSentiment() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const analyzeSentiment = (source: string, text: string, value?: bigint) => {
    writeContract({
      address: contracts.cmoAgent.address,
      abi: contracts.cmoAgent.abi,
      functionName: 'analyzeSentiment',
      args: [source, text],
      ...(value !== undefined && { value }),
    });
  };

  return { analyzeSentiment, txHash: hash, isPending, isConfirming, isSuccess, error };
}

// ─────────────────────────────────────────────────────────────
// Treasury Vault Actions
// ─────────────────────────────────────────────────────────────

/**
 * Deposits native tokens into the TreasuryVault.
 * @returns write function accepting the deposit amount.
 */
export function useDepositToTreasury() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deposit = (amount: bigint) => {
    writeContract({
      address: contracts.treasuryVault.address,
      abi: contracts.treasuryVault.abi,
      functionName: 'deposit',
      value: amount,
    });
  };

  return { deposit, txHash: hash, isPending, isConfirming, isSuccess, error };
}

// ─────────────────────────────────────────────────────────────
// Utility Hooks
// ─────────────────────────────────────────────────────────────

/**
 * Reads the required deposit for a specific agent from the AgentRegistry.
 * This can be used to pre-calculate how much value to send with payable calls.
 * @param agentAddress - The address of the agent to check.
 */
export function useCalculateDeposit(agentAddress: `0x${string}` | undefined) {
  const { address: userAddress } = useAccount();

  return useReadContract({
    address: contracts.agentRegistry.address,
    abi: contracts.agentRegistry.abi,
    functionName: 'getAgentInfo',
    args: agentAddress ? [agentAddress] : undefined,
    query: {
      enabled: !!agentAddress && !!userAddress,
    },
  });
}
