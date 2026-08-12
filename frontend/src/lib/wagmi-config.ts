'use client';

// ============================================================
// SovereignMind — wagmi & RainbowKit Configuration
// ============================================================

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { defineChain } from 'viem';
import { flareTestnet } from 'viem/chains';

export { flareTestnet };

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

export const walletConnectEnabled = Boolean(walletConnectProjectId);

if (!walletConnectEnabled) {
  console.warn(
    '[SovereignMind] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. ' +
      'WalletConnect is disabled; injected browser wallets remain available.'
  );
}

const chains = [somniaTestnet, flareTestnet] as const;

// RainbowKit requires a Reown project ID. Local and review builds without one
// fall back to an injected-wallet-only config instead of failing at import time.
export const config = walletConnectEnabled
  ? getDefaultConfig({
      appName: 'SovereignMind',
      projectId: walletConnectProjectId,
      chains,
      ssr: true,
    })
  : createConfig({
      chains,
      connectors: [injected()],
      transports: {
        [somniaTestnet.id]: http(somniaTestnet.rpcUrls.default.http[0]),
        [flareTestnet.id]: http(flareTestnet.rpcUrls.default.http[0]),
      },
      ssr: true,
    });
