'use client';

// ============================================================
// SovereignMind — Web3 Provider Wrapper
// ============================================================

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi-config';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

const customTheme = darkTheme({
  accentColor: '#3b82f6',
  accentColorForeground: 'white',
  borderRadius: 'medium',
  overlayBlur: 'small',
});

// Override specific theme properties for our dark cyber look
customTheme.colors.connectButtonBackground = 'rgba(17, 24, 39, 0.8)';
customTheme.colors.connectButtonInnerBackground = 'rgba(26, 34, 52, 0.8)';
customTheme.colors.modalBackground = '#111827';
customTheme.colors.modalBorder = '#1e293b';
customTheme.fonts.body = "'Inter', system-ui, sans-serif";

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
