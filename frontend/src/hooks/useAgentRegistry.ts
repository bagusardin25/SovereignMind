'use client';

// ============================================================
// SovereignMind — AgentRegistry Read Hooks
// ============================================================
// Wagmi v2 hooks for reading from the AgentRegistry contract.
// Provides hooks for querying agent metadata, roles, and stats.

import { useReadContract } from 'wagmi';
import { contracts } from '@/lib/somnia/contracts';

// ----- Types -----

/** Structured agent info returned by getAgentInfo */
export interface AgentInfo {
  role: `0x${string}`;
  isActive: boolean;
  registeredAt: bigint;
  decisionsCount: bigint;
  successCount: bigint;
  lastActionTimestamp: bigint;
}

// ----- Read Hooks -----

/**
 * Reads the total number of registered agents.
 * @returns wagmi query result containing the agent count (uint256).
 */
export function useAgentCount() {
  return useReadContract({
    address: contracts.agentRegistry.address,
    abi: contracts.agentRegistry.abi,
    functionName: 'getAgentCount',
  });
}

/**
 * Reads the list of all registered agent addresses.
 * @returns wagmi query result containing an array of agent addresses.
 */
export function useAllAgents() {
  return useReadContract({
    address: contracts.agentRegistry.address,
    abi: contracts.agentRegistry.abi,
    functionName: 'getAllAgents',
  });
}

/**
 * Reads detailed info for a specific agent.
 * @param agentAddress - The address of the agent to query.
 * @returns wagmi query result with (role, isActive, registeredAt, decisionsCount, successCount).
 */
export function useAgentInfo(agentAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: contracts.agentRegistry.address,
    abi: contracts.agentRegistry.abi,
    functionName: 'getAgentInfo',
    args: agentAddress ? [agentAddress] : undefined,
    query: {
      enabled: !!agentAddress,
    },
  });
}

/**
 * Reads the agent address assigned to a given role.
 * @param role - The bytes32 role identifier.
 * @returns wagmi query result containing the agent address for that role.
 */
export function useAgentByRole(role: `0x${string}` | undefined) {
  return useReadContract({
    address: contracts.agentRegistry.address,
    abi: contracts.agentRegistry.abi,
    functionName: 'getAgentByRole',
    args: role ? [role] : undefined,
    query: {
      enabled: !!role,
    },
  });
}

/**
 * Checks whether a specific agent is currently active.
 * @param agentAddress - The address of the agent to check.
 * @returns wagmi query result containing a boolean.
 */
export function useIsActiveAgent(agentAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: contracts.agentRegistry.address,
    abi: contracts.agentRegistry.abi,
    functionName: 'isActiveAgent',
    args: agentAddress ? [agentAddress] : undefined,
    query: {
      enabled: !!agentAddress,
    },
  });
}

/**
 * Reads the success rate for a specific agent in basis points (0–10000).
 * @param agentAddress - The address of the agent to query.
 * @returns wagmi query result containing the success rate (uint256).
 */
export function useSuccessRate(agentAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: contracts.agentRegistry.address,
    abi: contracts.agentRegistry.abi,
    functionName: 'getSuccessRate',
    args: agentAddress ? [agentAddress] : undefined,
    query: {
      enabled: !!agentAddress,
    },
  });
}

/**
 * Reads the total number of decisions made across all agents.
 * @returns wagmi query result containing total decisions (uint256).
 */
export function useTotalDecisions() {
  return useReadContract({
    address: contracts.agentRegistry.address,
    abi: contracts.agentRegistry.abi,
    functionName: 'totalDecisions',
  });
}
