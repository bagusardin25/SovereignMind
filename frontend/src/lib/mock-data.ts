// ============================================================
// SovereignMind — Mock Data for Development
// ============================================================

import type {
  Agent,
  Decision,
  TokenHolding,
  TreasuryState,
  Transaction,
  ActivityEvent,
  SystemHealth,
} from './types';

const now = Date.now();
const mins = (n: number) => now - n * 60 * 1000;
const hours = (n: number) => now - n * 60 * 60 * 1000;

// ── Agents ──────────────────────────────────────────────────
export const mockAgents: Agent[] = [
  {
    id: 'agent-ceo-001',
    role: 'CEO',
    name: 'Strategic Orchestrator',
    description:
      'Chief executive agent responsible for high-level strategic decisions, objective delegation, and synthesizing inputs from CFO and CMO agents to drive autonomous treasury operations.',
    status: 'active',
    currentTask: 'Synthesizing CFO risk report and CMO market brief for Q2 rebalancing decision',
    lastAction: 'Delegated market analysis request to CMO Agent',
    lastActionTimestamp: mins(3),
    contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
    uptime: 99.7,
    decisionsCount: 147,
    successRate: 96.3,
    avgResponseTime: 4200,
    objective: 'Optimize treasury allocation for maximum risk-adjusted returns while maintaining 30% stablecoin reserve',
  },
  {
    id: 'agent-cfo-001',
    role: 'CFO',
    name: 'Risk Analyst',
    description:
      'Financial officer agent specialized in quantitative risk assessment, price data analysis via JSON API Agent, and automated portfolio rebalancing through TreasuryVault interactions.',
    status: 'processing',
    currentTask: 'Fetching real-time price feeds via Somnia JSON API Agent for ETH, STT, USDC',
    lastAction: 'Computed composite risk score: 72/100 (moderate risk)',
    lastActionTimestamp: mins(1),
    contractAddress: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72',
    uptime: 99.2,
    decisionsCount: 312,
    successRate: 98.1,
    avgResponseTime: 3100,
    objective: 'Monitor portfolio risk metrics and execute rebalancing when risk thresholds are breached',
  },
  {
    id: 'agent-cmo-001',
    role: 'CMO',
    name: 'Market Sentinel',
    description:
      'Market intelligence agent that scrapes DeFi news sources via LLM Parse Website Agent and classifies market sentiment using Somnia LLM Inference for bullish/bearish/neutral signals.',
    status: 'active',
    currentTask: 'Parsing DeFi Pulse and CoinDesk for sentiment analysis',
    lastAction: 'Generated market signal: BULLISH (confidence: 78%)',
    lastActionTimestamp: mins(8),
    contractAddress: '0xdD870fA1b7C4700F2BD7f44238821C26f7392148',
    uptime: 98.8,
    decisionsCount: 203,
    successRate: 94.6,
    avgResponseTime: 5800,
    objective: 'Continuously monitor market sentiment and generate actionable signals for CEO synthesis',
  },
];

// ── Treasury ────────────────────────────────────────────────
export const mockHoldings: TokenHolding[] = [
  {
    symbol: 'STT',
    name: 'Somnia Token',
    balance: 125000,
    price: 2.47,
    value: 308750,
    change24h: 5.2,
    allocation: 35.8,
    color: '#8b5cf6',
    iconUrl: 'https://somnia.network/favicon.ico',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    balance: 42.5,
    price: 3847.2,
    value: 163506,
    change24h: -1.3,
    allocation: 19.0,
    color: '#627eea',
    iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    balance: 250000,
    price: 1.0,
    value: 250000,
    change24h: 0.01,
    allocation: 29.0,
    color: '#2775ca',
    iconUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    balance: 1.2,
    price: 68420,
    value: 82104,
    change24h: 2.8,
    allocation: 9.5,
    color: '#f7931a',
    iconUrl: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png',
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    balance: 3500,
    price: 16.42,
    value: 57470,
    change24h: -0.7,
    allocation: 6.7,
    color: '#375bd2',
    iconUrl: 'https://cryptologos.cc/logos/chainlink-link-logo.png',
  },
];

export const mockTreasury: TreasuryState = {
  totalValue: mockHoldings.reduce((sum, h) => sum + h.value, 0),
  change24h: 2.34,
  holdings: mockHoldings,
};

// ── Decisions ───────────────────────────────────────────────
export const mockDecisions: Decision[] = [
  {
    id: 'dec-001',
    agentRole: 'CEO',
    type: 'rebalance',
    title: 'Portfolio Rebalancing — Increase STT Allocation',
    rationale:
      'Based on CFO risk analysis showing STT underweight by 8% relative to target allocation, combined with CMO bullish signal (78% confidence) on Somnia ecosystem growth. Composite decision score: 84/100.',
    action: 'Rebalance 15,000 USDC → STT via TreasuryVault',
    outcome: 'executed',
    txHash: '0x8f3a2c1e7b9d4f6a0c5e8d2b7a1f9c3e6d4b8a2f7c1e5d9b3a6f0c4e8d2b7a1f',
    receiptUrl: 'https://receipts.net.somnia.host/0x8f3a2c1e',
    timestamp: mins(12),
    confidenceScore: 84,
    inputData: 'CFO Risk Score: 72/100; CMO Signal: BULLISH (78%); STT Price: $2.47 (+5.2%)',
    llmReasoning:
      'Given the moderate risk level (72/100) and bullish market outlook, increasing STT exposure aligns with the objective of optimizing risk-adjusted returns. The 5.2% price increase suggests momentum, and the 78% bullish confidence provides adequate conviction for allocation increase.',
    marketSignal: 'bullish',
  },
  {
    id: 'dec-002',
    agentRole: 'CFO',
    type: 'alert',
    title: 'Risk Threshold Warning — ETH Volatility Spike',
    rationale:
      'ETH 24h volatility index reached 4.7σ, exceeding the 3σ threshold. Current drawdown: -1.3%. Historical data indicates 68% probability of continued decline in next 4 hours when volatility exceeds 4σ.',
    action: 'Alert issued to CEO Agent for strategic review',
    outcome: 'executed',
    txHash: '0x2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c',
    receiptUrl: 'https://receipts.net.somnia.host/0x2b4c6d8e',
    timestamp: mins(45),
    confidenceScore: 91,
    llmReasoning:
      'Volatility analysis using JSON API price data shows ETH/USD exceeded 3σ band. Risk protocol mandates CEO notification when composite risk exceeds threshold. No autonomous action taken — escalated for strategic review.',
  },
  {
    id: 'dec-003',
    agentRole: 'CMO',
    type: 'market_signal',
    title: 'Market Sentiment — Bullish Signal Detected',
    rationale:
      'Parsed 12 DeFi news sources via LLM Parse Website Agent. 9/12 sources indicate positive ecosystem developments. Key driver: Somnia mainnet launch timeline confirmed for Q3 2026.',
    action: 'Signal: BULLISH (confidence: 78%) sent to CEO Agent',
    outcome: 'executed',
    txHash: '0x5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e',
    receiptUrl: 'https://receipts.net.somnia.host/0x5d7e9f1a',
    timestamp: hours(1),
    confidenceScore: 78,
    marketSignal: 'bullish',
  },
  {
    id: 'dec-004',
    agentRole: 'CEO',
    type: 'hold',
    title: 'Strategic Hold — Maintain Current Allocations',
    rationale:
      'CFO risk score at 45/100 (low risk). CMO signal neutral with 62% confidence. No rebalancing triggers met. Current allocation within 2% of target weights across all positions.',
    action: 'No action — continue monitoring',
    outcome: 'executed',
    txHash: '0x9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a',
    receiptUrl: 'https://receipts.net.somnia.host/0x9f1a3b5c',
    timestamp: hours(3),
    confidenceScore: 62,
    marketSignal: 'neutral',
  },
  {
    id: 'dec-005',
    agentRole: 'CFO',
    type: 'rebalance',
    title: 'Automated Rebalancing — WBTC Position Adjustment',
    rationale:
      'WBTC allocation exceeded target by 3.2% following 2.8% price appreciation. Automated threshold-based rebalancing triggered to maintain portfolio discipline.',
    action: 'Rebalance 0.15 WBTC → USDC via TreasuryVault',
    outcome: 'executed',
    txHash: '0x1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b',
    receiptUrl: 'https://receipts.net.somnia.host/0x1a3b5c7d',
    timestamp: hours(6),
    confidenceScore: 95,
  },
  {
    id: 'dec-006',
    agentRole: 'CMO',
    type: 'market_signal',
    title: 'Market Sentiment — Bearish Signal Detected',
    rationale:
      'Macro headwinds detected: Federal Reserve hawkish commentary scraped from 4 financial news sources. DeFi TVL decreased 2.1% in last 12 hours.',
    action: 'Signal: BEARISH (confidence: 71%) sent to CEO Agent',
    outcome: 'executed',
    txHash: '0x3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c',
    receiptUrl: 'https://receipts.net.somnia.host/0x3b5c7d9e',
    timestamp: hours(12),
    confidenceScore: 71,
    marketSignal: 'bearish',
  },
  {
    id: 'dec-007',
    agentRole: 'CEO',
    type: 'allocate',
    title: 'Defensive Allocation — Increase Stablecoin Reserve',
    rationale:
      'In response to CMO bearish signal (71% confidence) and rising CFO risk score (78/100), executing defensive pivot to increase USDC reserve from 25% to 30% of portfolio.',
    action: 'Allocate 25,000 USD equivalent → USDC via TreasuryVault',
    outcome: 'executed',
    txHash: '0x5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d',
    receiptUrl: 'https://receipts.net.somnia.host/0x5c7d9e1f',
    timestamp: hours(14),
    confidenceScore: 82,
    marketSignal: 'bearish',
  },
];

// ── Transactions ────────────────────────────────────────────
export const mockTransactions: Transaction[] = [
  {
    id: 'tx-001',
    type: 'rebalance',
    token: 'STT',
    amount: 6072,
    value: 15000,
    from: '0x8Ba1...BA72',
    to: '0x742d...bD18',
    txHash: '0x8f3a2c1e7b9d4f6a',
    timestamp: mins(12),
    reason: 'CEO-directed rebalancing based on bullish signal',
    agentRole: 'CFO',
  },
  {
    id: 'tx-002',
    type: 'rebalance',
    token: 'WBTC',
    amount: 0.15,
    value: 10263,
    from: '0x742d...bD18',
    to: '0x8Ba1...BA72',
    txHash: '0x1a3b5c7d9e1f3a5b',
    timestamp: hours(6),
    reason: 'Threshold-based rebalancing',
    agentRole: 'CFO',
  },
  {
    id: 'tx-003',
    type: 'deposit',
    token: 'USDC',
    amount: 50000,
    value: 50000,
    from: '0xOwner...1234',
    to: '0x742d...bD18',
    txHash: '0x7d9e1f3a5b7c9d1e',
    timestamp: hours(24),
  },
  {
    id: 'tx-004',
    type: 'rebalance',
    token: 'ETH',
    amount: 3.2,
    value: 12311,
    from: '0x8Ba1...BA72',
    to: '0x742d...bD18',
    txHash: '0x9e1f3a5b7c9d1e3f',
    timestamp: hours(36),
    reason: 'Defensive reallocation triggered by bearish signal',
    agentRole: 'CEO',
  },
  {
    id: 'tx-005',
    type: 'deposit',
    token: 'STT',
    amount: 25000,
    value: 61750,
    from: '0xOwner...1234',
    to: '0x742d...bD18',
    txHash: '0x1f3a5b7c9d1e3f5a',
    timestamp: hours(72),
  },
];

// ── Activity Events ─────────────────────────────────────────
export const mockActivity: ActivityEvent[] = [
  {
    id: 'act-001',
    agentRole: 'CEO',
    action: 'Cycle Started',
    description: 'Initiated autonomous decision cycle #148',
    timestamp: mins(2),
  },
  {
    id: 'act-002',
    agentRole: 'CEO',
    action: 'Request Delegated',
    description: 'Delegated market analysis to CMO Agent via createRequest()',
    timestamp: mins(3),
  },
  {
    id: 'act-003',
    agentRole: 'CMO',
    action: 'Website Parsed',
    description: 'Scraped 12 DeFi news sources via LLM Parse Website Agent',
    timestamp: mins(5),
  },
  {
    id: 'act-004',
    agentRole: 'CMO',
    action: 'Signal Generated',
    description: 'Market signal: BULLISH (confidence: 78%)',
    timestamp: mins(8),
  },
  {
    id: 'act-005',
    agentRole: 'CEO',
    action: 'Request Delegated',
    description: 'Delegated risk assessment to CFO Agent via createRequest()',
    timestamp: mins(9),
  },
  {
    id: 'act-006',
    agentRole: 'CFO',
    action: 'API Data Fetched',
    description: 'Retrieved price feeds for ETH, STT, USDC, WBTC, LINK',
    timestamp: mins(10),
  },
  {
    id: 'act-007',
    agentRole: 'CFO',
    action: 'Risk Computed',
    description: 'Composite risk score: 72/100 (moderate risk)',
    timestamp: mins(11),
  },
  {
    id: 'act-008',
    agentRole: 'CEO',
    action: 'Decision Made',
    description: 'Final decision: Rebalance 15,000 USDC → STT',
    timestamp: mins(12),
    relatedDecisionId: 'dec-001',
  },
  {
    id: 'act-009',
    agentRole: 'CFO',
    action: 'Rebalance Executed',
    description: 'TreasuryVault.rebalance() executed successfully',
    timestamp: mins(12),
  },
  {
    id: 'act-010',
    agentRole: 'CEO',
    action: 'Cycle Completed',
    description: 'Decision cycle #148 completed. Next cycle in ~15 minutes.',
    timestamp: mins(12),
  },
];

// ── System Health ───────────────────────────────────────────
export const mockSystemHealth: SystemHealth = {
  status: 'healthy',
  agentsOnline: 3,
  totalAgents: 3,
  lastCycleTimestamp: mins(12),
  avgCycleTime: 420000, // ~7 minutes
  networkLatency: 145,
};
