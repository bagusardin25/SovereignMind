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

// Create wagmi config with RainbowKit defaults
export const config = getDefaultConfig({
  appName: 'SovereignMind',
  projectId: 'sovereignmind-demo', // WalletConnect project ID (demo)
  chains: [somniaTestnet],
  ssr: true,
});
