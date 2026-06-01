'use client';

// ============================================================
// SovereignMind — wagmi & RainbowKit Configuration
// ============================================================

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Define Somnia Testnet chain
export const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    name: 'Somnia',
    symbol: 'STT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://shannon.somnia.network',
    },
  },
  testnet: true,
});

// WalletConnect / Reown Project ID
// Get one free at https://cloud.reown.com
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '';

if (!walletConnectProjectId) {
  console.warn(
    '[SovereignMind] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. ' +
      'Wallet connections will fail. Get a free project ID at https://cloud.reown.com'
  );
}

// Create wagmi config with RainbowKit defaults
export const config = getDefaultConfig({
  appName: 'SovereignMind',
  projectId: walletConnectProjectId,
  chains: [somniaTestnet],
  ssr: true,
});
