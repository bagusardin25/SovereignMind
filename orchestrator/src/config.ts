// ============================================================
// SovereignMind Orchestrator — Configuration
// ============================================================

import dotenv from 'dotenv';
import path from 'path';
import type { PriceConfig } from './types';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env variable: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const config = {
  // Wallet
  privateKey: required('PRIVATE_KEY'),
  rpcUrl: optional('RPC_URL', 'https://dream-rpc.somnia.network'),

  // Contract Addresses
  addresses: {
    agentRegistry: required('AGENT_REGISTRY_ADDRESS'),
    treasuryVault: required('TREASURY_VAULT_ADDRESS'),
    ceoAgent: required('CEO_AGENT_ADDRESS'),
    cfoAgent: required('CFO_AGENT_ADDRESS'),
    cmoAgent: required('CMO_AGENT_ADDRESS'),
    agentRunner: required('AGENT_RUNNER_ADDRESS'),
    vaultShares: optional('VAULT_SHARES_ADDRESS', ''),
    swapRouter: optional('SWAP_ROUTER_ADDRESS', ''),
    priceOracle: optional('PRICE_ORACLE_ADDRESS', ''),
  },

  // Orchestration
  cycleIntervalMinutes: parseInt(optional('CYCLE_INTERVAL_MINUTES', '15')),
  minAgentBalanceSTT: optional('MIN_AGENT_BALANCE_STT', '0.05'),
  autoFundAmountSTT: optional('AUTO_FUND_AMOUNT_STT', '0.1'),
  eventTimeoutSeconds: parseInt(optional('EVENT_TIMEOUT_SECONDS', '120')),

  // Tokens — each mapped to CoinGecko API
  trackedTokens: optional('TRACKED_TOKENS', 'bitcoin,ethereum,solana')
    .split(',')
    .map((t) => t.trim()),

  // Market scan
  marketScanUrl: optional(
    'MARKET_SCAN_URL',
    'https://www.coingecko.com/en/coins/somnia'
  ),

  // Health — Railway injects PORT; fall back to HEALTH_PORT for local dev
  healthPort: parseInt(optional('PORT', optional('HEALTH_PORT', '3001'))),

  // Run mode
  runOnce: process.argv.includes('--once'),
} as const;

// Build price configs from tracked tokens
export function getPriceConfigs(): PriceConfig[] {
  return config.trackedTokens.map((token) => ({
    symbol: token,
    apiUrl: `https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`,
    jsonPath: `${token}.usd`,
  }));
}
