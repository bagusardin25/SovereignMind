'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { contracts } from '@/lib/somnia/contracts';

const vaultSharesAddress = contracts.vaultShares.address || undefined;

// Inline ABI with `as const` for proper wagmi v2 type inference.
// JSON ABIs lose const-ness, causing useReadContract to return `{}`.
const VAULT_SHARES_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [{ name: 'sttAmount', type: 'uint256' }],
  },
  {
    name: 'getSharePrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getTotalPortfolioValue',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalDeposited',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalWithdrawn',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'depositCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'withdrawCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getPortfolioAllocation',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'symbols_', type: 'string[]' },
      { name: 'values_', type: 'uint256[]' },
      { name: 'percentages_', type: 'uint256[]' },
    ],
  },
  {
    name: 'getHeldSymbols',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string[]' }],
  },
] as const;

// ─── Read Hooks ────────────────────────────────────────

export function useSharePrice() {
  return useReadContract({
    address: vaultSharesAddress,
    abi: VAULT_SHARES_ABI,
    functionName: 'getSharePrice',
    query: { enabled: !!vaultSharesAddress, refetchInterval: 15_000 },
  });
}

export function useTotalPortfolioValue() {
  return useReadContract({
    address: vaultSharesAddress,
    abi: VAULT_SHARES_ABI,
    functionName: 'getTotalPortfolioValue',
    query: { enabled: !!vaultSharesAddress, refetchInterval: 15_000 },
  });
}

export function useVaultTotalSupply() {
  return useReadContract({
    address: vaultSharesAddress,
    abi: VAULT_SHARES_ABI,
    functionName: 'totalSupply',
    query: { enabled: !!vaultSharesAddress, refetchInterval: 30_000 },
  });
}

export function useUserShares(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: vaultSharesAddress,
    abi: VAULT_SHARES_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!vaultSharesAddress && !!userAddress, refetchInterval: 15_000 },
  });
}

export function useVaultStats() {
  const deposited = useReadContract({
    address: vaultSharesAddress,
    abi: VAULT_SHARES_ABI,
    functionName: 'totalDeposited',
    query: { enabled: !!vaultSharesAddress },
  });
  const withdrawn = useReadContract({
    address: vaultSharesAddress,
    abi: VAULT_SHARES_ABI,
    functionName: 'totalWithdrawn',
    query: { enabled: !!vaultSharesAddress },
  });
  const depositCount = useReadContract({
    address: vaultSharesAddress,
    abi: VAULT_SHARES_ABI,
    functionName: 'depositCount',
    query: { enabled: !!vaultSharesAddress },
  });
  const withdrawCount = useReadContract({
    address: vaultSharesAddress,
    abi: VAULT_SHARES_ABI,
    functionName: 'withdrawCount',
    query: { enabled: !!vaultSharesAddress },
  });

  return { deposited, withdrawn, depositCount, withdrawCount };
}

export function usePortfolioAllocation() {
  return useReadContract({
    address: vaultSharesAddress,
    abi: VAULT_SHARES_ABI,
    functionName: 'getPortfolioAllocation',
    query: { enabled: !!vaultSharesAddress, refetchInterval: 30_000 },
  });
}

// ─── Write Hooks ───────────────────────────────────────

export function useVaultDeposit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deposit = (amount: bigint) => {
    if (!vaultSharesAddress) return;
    writeContract({
      address: vaultSharesAddress,
      abi: VAULT_SHARES_ABI,
      functionName: 'deposit',
      value: amount,
    });
  };

  return { deposit, txHash: hash, isPending, isConfirming, isSuccess, error };
}

export function useVaultWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = (shares: bigint) => {
    if (!vaultSharesAddress) return;
    writeContract({
      address: vaultSharesAddress,
      abi: VAULT_SHARES_ABI,
      functionName: 'withdraw',
      args: [shares],
    });
  };

  return { withdraw, txHash: hash, isPending, isConfirming, isSuccess, error };
}
