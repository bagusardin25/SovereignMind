# SovereignMind — Frontend Dashboard

Next.js 16 dashboard for monitoring the SovereignMind autonomous agent system on Somnia Testnet.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — real-time overview of agents, treasury, and decisions |
| `/agents` | Agent listing with status, uptime, and performance metrics |
| `/agents/[role]` | Detailed view per agent (CEO, CFO, CMO) |
| `/decisions` | Chronological decision log with rationale and receipts |
| `/treasury` | Treasury portfolio, allocation chart, and rebalancing history |

## Tech

- **Framework:** Next.js 16 + TypeScript
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Wallet:** wagmi v2 + RainbowKit + viem
- **Icons:** Lucide React
- **Chain:** Somnia Testnet (Chain ID: 50312)
