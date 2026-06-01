<p align="center">
  <img src="https://img.shields.io/badge/Somnia-Agentathon_2026-6C5CE7?style=for-the-badge&logo=ethereum&logoColor=white" alt="Somnia Agentathon 2026" />
  <img src="https://img.shields.io/badge/Track-Novel_Agent_Applications-00B894?style=for-the-badge" alt="Track" />
  <img src="https://img.shields.io/badge/Status-In_Development-F0932B?style=for-the-badge" alt="Status" />
</p>

<h1 align="center">🧠 SovereignMind</h1>

<h3 align="center">Autonomous On-Chain Agentic Venture Guild</h3>

<p align="center">
  <em>The first fully on-chain autonomous executive suite powered by Somnia Agentic L1 native primitives — where AI agents make transparent, consensus-verified treasury decisions without any off-chain dependency.</em>
</p>

<p align="center">
  <a href="#-architecture">Architecture</a> •
  <a href="#-features">Features</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-development-roadmap">Roadmap</a> •
  <a href="#-team">Team</a>
</p>

<p align="center">
  🌐 <strong>Live Demo:</strong> <a href="https://sovereignmind-app.vercel.app">sovereignmind-app.vercel.app</a>
</p>

---

## 📖 Overview

**SovereignMind** deploys a collaborative network of autonomous AI agents as a "virtual executive suite" on-chain, built entirely on **Somnia Agentic L1 native primitives**. Three specialized agents — **CEO**, **CFO**, and **CMO** — are implemented as Solidity smart contracts that leverage Somnia's three native base agents:

| Agent | Role | Somnia Primitives Used |
|-------|------|------------------------|
| 🔵 **CEO Agent** | Strategic orchestration & final decision-making | LLM Inference Agent |
| 🟣 **CFO Agent** | Financial analysis, risk scoring & treasury execution | JSON API Request Agent + LLM Inference Agent |
| 🔷 **CMO Agent** | Market intelligence & sentiment analysis | LLM Parse Website Agent + LLM Inference Agent |

Every decision produces a **public execution receipt** verifiable via Somnia's consensus mechanism — making SovereignMind a fully transparent, autonomous treasury manager with **zero single points of failure**.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js + Vercel)              │
│  Dashboard · Agent Monitor · Decision Log · Treasury View   │
│         wagmi v2 + RainbowKit + ethers.js v6               │
└────────────────────────┬────────────────────────────────────┘
                         │ Read contract state / events
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Orchestrator (Node.js + Express)               │
│  Scheduler · Auto-funding · Sequential Cycle Engine         │
│         ethers.js v6 · node-cron · Winston Logging         │
└────────────────────────┬────────────────────────────────────┘
                         │ Write transactions / trigger cycles
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Somnia Testnet (EVM-Compatible)             │
│                                                             │
│  ┌──────────────┐  delegates   ┌──────────────────────┐    │
│  │ CEOAgent.sol │─────────────▶│    CFOAgent.sol       │    │
│  │ (Orchestrator)│              │ (Risk & Finance)     │    │
│  └──────┬───────┘              └──────────┬───────────┘    │
│         │ delegates                       │                 │
│         ▼                                 │ executes        │
│  ┌──────────────────┐                     ▼                 │
│  │  CMOAgent.sol    │          ┌──────────────────────┐    │
│  │ (Market Intel)   │          │  TreasuryVault.sol   │    │
│  └──────────────────┘          │  (Asset Management)  │    │
│                                └──────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              AgentRegistry.sol                       │  │
│  │        (Role-based Access Control)                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                   │
│                         ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Somnia Agent Runner (Validator Nodes)       │  │
│  │                                                      │  │
│  │  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐  │  │
│  │  │ JSON API    │ │ LLM Inference│ │ LLM Parse    │  │  │
│  │  │ Request     │ │ Agent        │ │ Website      │  │  │
│  │  │ Agent       │ │ (Determin.)  │ │ Agent        │  │  │
│  │  └─────────────┘ └──────────────┘ └──────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Request-Response Flow

```
Contract                    Somnia Agent Runner              Contract
   │                              │                              │
   │── createRequest() ──────────▶│                              │
   │   (deposit + payload)        │                              │
   │                              │── BFT Consensus ──▶          │
   │                              │   (validator nodes)          │
   │                              │                              │
   │◀── handleResponse() ────────│                              │
   │   (requestId, data, status)  │                              │
   │                                                             │
   │── Execute Decision ────────────────────────────────────────▶│
   │   (rebalance / allocate)     │                              │
   │                              │                              │
   │◀── Execution Receipt ───────│                              │
       (public, auditable)        
```

---

## ✨ Features

### 🤖 Autonomous Multi-Agent System
- **CEO Agent** — Sets strategic objectives, delegates tasks, synthesizes CFO + CMO reports into final decisions
- **CFO Agent** — Fetches real-time price data via JSON API Agent, calculates composite risk scores via LLM Inference
- **CMO Agent** — Scrapes market sentiment from unstructured sources, classifies signals (bullish/bearish/neutral)

### 💰 On-Chain Treasury Management
- Secure vault with role-based access control via Agent Registry
- Autonomous rebalancing based on risk thresholds and market conditions
- Full transaction history with on-chain audit trail

### 📊 Real-Time Dashboard
- **Dashboard** — Key metrics, agent status, decision feed, treasury allocation overview
- **Agent Monitor** — Detailed view per agent: status, current task, performance metrics, uptime
- **Decision Log** — Chronological history of all autonomous decisions with rationale and confidence scores
- **Treasury View** — Portfolio breakdown, allocation chart, holding details, rebalancing history
- **Settings** — Risk thresholds, rebalance interval, notifications, and on-chain contract interactions

### 🔄 Agent Orchestration Backend
- Automated decision cycles every 15 minutes via cron scheduler
- Sequential step engine: Fund → Fetch Prices → Analyze Risk → Scan Market → CEO Decision
- Auto-funding: monitors agent contract balances, tops up when below threshold
- Health API with endpoints for monitoring, triggering, and controlling cycles

### 🔐 Fully Transparent & Trustless
- Every decision produces a verifiable **on-chain execution receipt**
- Deterministic LLM outputs via Somnia's pinned model weights and synchronized seeds
- No off-chain servers, no external API dependencies — 100% Somnia-native

---

## ⚙️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------| 
| **Smart Contracts** | Solidity 0.8.28 | Agent logic, treasury management, access control |
| **Contract Tooling** | Hardhat + TypeScript | Development, testing, deployment |
| **Contract Security** | OpenZeppelin 5.1 | AccessControl, ReentrancyGuard, Pausable, SafeERC20 |
| **Somnia Integration** | `createRequest()` / `handleResponse()` | Native agent primitives |
| **Frontend** | Next.js 16 + React 19 + TypeScript | Dashboard & monitoring UI |
| **Styling** | Tailwind CSS v4 | Responsive design system |
| **Animations** | Framer Motion | Smooth UI transitions & page animations |
| **Wallet** | wagmi v2 + RainbowKit + viem | Web3 wallet connection |
| **Data Fetching** | @tanstack/react-query | Caching & state management |
| **Icons** | Lucide React | Consistent icon set |
| **Orchestrator** | Node.js + Express + ethers.js v6 | Agent cycle automation & health API |
| **Scheduling** | node-cron | Automated decision cycle triggers |
| **Logging** | Winston | Structured logging (console + file) |
| **Blockchain** | Somnia Testnet (Chain ID: 50312) | EVM-compatible L1 with native agent compute |
| **Deployment** | Vercel (frontend) · Railway (orchestrator) | Hosting |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ 
- [Git](https://git-scm.com/)
- MetaMask or any EVM-compatible wallet
- Somnia Testnet STT tokens ([faucet](https://docs.somnia.network))

### Installation

```bash
# Clone the repository
git clone https://github.com/bagusardin25/SovereignMind.git
cd SovereignMind

# ── Frontend ──
cd frontend
npm install
npm run dev
# Open http://localhost:3000

# ── Orchestrator (separate terminal) ──
cd orchestrator
npm install
npm run dev
# Health API at http://localhost:3001

# ── Smart Contracts (for development) ──
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

### Somnia Testnet Configuration

Add Somnia Testnet to your wallet:

| Parameter | Value |
|-----------|-------|
| Network Name | Somnia Testnet |
| RPC URL | `https://dream-rpc.somnia.network` |
| Chain ID | `50312` |
| Currency Symbol | `STT` |
| Block Explorer | `https://shannon.somnia.network` |

### Deployed Contract Addresses

| Contract | Address | Status |
|----------|---------|--------|
| AgentRegistry | `0x41A6a0c76ddAD6F5dAeC70F7aaFA439eba1AC0c3` | ✅ Deployed |
| TreasuryVault | `0x8f1c9bd9cc0EF059D0175fF05153D2fEe8Be7f9d` | ✅ Deployed |
| CEOAgent | `0xd58a92F4BF829921a6cdc6FeE54d7CC8743F75c9` | ✅ Deployed (v2) |
| CFOAgent | `0xEE3dB72FBBF25248edDe8324670aC8F1b9285869` | ✅ Deployed (v2) |
| CMOAgent | `0x9C13A3d3ca1BB420F6f2489c93785eCE3125c600` | ✅ Deployed (v2) |
| AgentRunner | `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776` | 🔗 Somnia Platform |

---

## 📍 Development Roadmap

### Phase 1: Foundation ✅ *Completed*
- [x] Project registration for Somnia Agentathon 2026
- [x] PRD v2.0 — Full architecture redesign for Somnia-native
- [x] Frontend dashboard with 6 main pages (Dashboard, Agents, Treasury, Decisions, Settings, Docs)
- [x] Landing page with 3D hero orb, feature agents, live stats, FAQ, contract address strip
- [x] UI component library (GlassCard, MetricCard, StatusBadge, AgentCard, Toast, etc.)
- [x] Wallet integration (wagmi v2 + RainbowKit, Somnia Testnet config)
- [x] TypeScript type system for agents, decisions, treasury, receipts
- [x] Mock data layer demonstrating full UX flow
- [x] Responsive design with mobile bottom navigation

### Phase 2: Smart Contracts ✅ *Completed*
- [x] `AgentRegistry.sol` — Role-based agent authorization with OpenZeppelin AccessControl
- [x] `TreasuryVault.sol` — Secure asset management with ReentrancyGuard + Pausable
- [x] `CFOAgent.sol` — `createRequest()` to JSON API Agent + LLM Inference for risk scoring
- [x] `CMOAgent.sol` — Market intel via LLM Parse Website Agent + sentiment analysis
- [x] `CEOAgent.sol` — Full orchestration with decision cycle phases (IDLE → ANALYZING → EXECUTING)
- [x] `ISomniaAgentRunner.sol` — Interface for Somnia Agent Runner primitives
- [x] `MockAgentRunner.sol` — Mock contract for local testing
- [x] `handleResponse()` callback — End-to-end request flow implemented
- [x] Unit tests — AgentRegistry, TreasuryVault, AgentIntegration test suites
- [x] Deployment scripts — Full deploy + resume deploy for Somnia Testnet
- [x] ABI copy script — Auto-copy compiled ABIs to frontend

### Phase 3: Integration & Polish ✅ *Completed*
- [x] Deploy all 5 contracts to Somnia Testnet (AgentRegistry, TreasuryVault, CEO, CFO, CMO)
- [x] Frontend wagmi hooks for all contracts (7 hook files, read + write)
- [x] Contract addresses & ABIs integrated into frontend
- [x] Settings page with live on-chain contract interaction panel
- [x] Orchestrator backend — automated cycle engine, health API, auto-funding
- [x] Connect all frontend pages to live contracts (replaced mock data with composite hooks)
- [x] Integrate Somnia Receipts verification (event log parsing + ReceiptBadge + ReceiptModal)
- [x] Deploy frontend to Vercel ✅ ([sovereignmind-app.vercel.app](https://sovereignmind-app.vercel.app))

### Phase 4: Autonomous Loop & Validation 🔄 *In Progress*
- [x] Fix orchestrator bugs (health endpoint, timeout calculation)
- [x] Sync documentation with current deployment
- [ ] Full autonomous loop: CEO → CFO → CMO → Decision → Execute
- [ ] End-to-end testing (multi-cycle validation)
- [ ] Demo video (2-5 minutes)

---

## 📂 Project Structure

```
SovereignMind/
├── .env.example                          # Environment variables template
├── README.md                             # This file
│
├── contracts/                            # Hardhat — Solidity Smart Contracts
│   ├── contracts/
│   │   ├── AgentRegistry.sol             # Role-based agent authorization (RBAC)
│   │   ├── TreasuryVault.sol             # Secure asset management (OpenZeppelin)
│   │   ├── CEOAgent.sol                  # Orchestrator — LLM Inference Agent
│   │   ├── CFOAgent.sol                  # Risk & Finance — JSON API + LLM Inference
│   │   ├── CMOAgent.sol                  # Market Intel — LLM Parse Website + LLM Inference
│   │   ├── interfaces/
│   │   │   └── ISomniaAgentRunner.sol    # Somnia createRequest()/handleResponse() interface
│   │   └── mocks/
│   │       └── MockAgentRunner.sol       # Mock Agent Runner for local testing
│   ├── scripts/
│   │   ├── deploy.ts                     # Full deployment script for Somnia Testnet
│   │   ├── deploy-resume.ts              # Resume deployment (deploy CEOAgent + configure roles)
│   │   ├── copy-abis.ts                  # Copy compiled ABIs to frontend
│   │   └── check-gas.ts                  # Check wallet balance & estimate gas costs
│   ├── test/
│   │   ├── AgentRegistry.test.ts         # AgentRegistry unit tests
│   │   ├── TreasuryVault.test.ts         # TreasuryVault unit tests
│   │   └── AgentIntegration.test.ts      # Cross-contract integration tests
│   ├── hardhat.config.ts                 # Hardhat config (Solidity 0.8.28, optimizer, viaIR)
│   ├── package.json
│   └── tsconfig.json
│
├── orchestrator/                         # Node.js — Agent Cycle Automation Backend
│   ├── src/
│   │   ├── index.ts                      # Entry point — Express server + scheduler bootstrap
│   │   ├── orchestrator.ts               # Sequential cycle engine (fund → fetch → analyze → decide)
│   │   ├── scheduler.ts                  # Cron-based cycle trigger (every 15 min)
│   │   ├── health.ts                     # Express health API (/health, /status, /trigger, /stop)
│   │   ├── config.ts                     # Environment config & contract addresses
│   │   ├── logger.ts                     # Winston structured logging
│   │   ├── types.ts                      # TypeScript interfaces
│   │   └── services/
│   │       ├── contracts.ts              # ethers.js v6 contract instances
│   │       ├── ceo.service.ts            # CEO decision cycle service
│   │       ├── cfo.service.ts            # CFO price fetching & risk analysis
│   │       ├── cmo.service.ts            # CMO market scanning & sentiment
│   │       ├── funding.service.ts        # Agent auto-funding & balance monitoring
│   │       └── events.service.ts         # Contract event listening & waiting
│   ├── railway.json                      # Railway deployment config
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                             # Next.js 16 — Dashboard & Monitoring UI
    ├── public/
    │   ├── 3d_coin_chart.png             # Hero section 3D asset
    │   ├── logo.png                      # SovereignMind logo (PNG)
    │   ├── logo.jpg                      # SovereignMind logo (JPG)
    │   └── manifest.json                 # PWA manifest
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx                  # Landing page (3D hero orb + FAQ)
    │   │   ├── layout.tsx                # Root layout (fonts, Web3Provider)
    │   │   ├── globals.css               # Design system & CSS theme tokens
    │   │   ├── not-found.tsx             # Global 404 page
    │   │   │
    │   │   └── (app)/                    # 🔒 Route Group — Sidebar layout
    │   │       ├── layout.tsx            # App shell (Sidebar + Header)
    │   │       ├── template.tsx          # Page transition wrapper (Framer Motion)
    │   │       ├── error.tsx             # Error boundary
    │   │       ├── not-found.tsx         # App-level 404
    │   │       ├── dashboard/
    │   │       │   └── page.tsx          # Dashboard — metrics, agents, decisions overview
    │   │       ├── agents/
    │   │       │   ├── page.tsx          # Agent listing (CEO, CFO, CMO)
    │   │       │   └── [role]/
    │   │       │       └── page.tsx      # Agent detail — performance, console, controls
    │   │       ├── treasury/
    │   │       │   └── page.tsx          # Treasury — allocation chart, holdings, transactions
    │   │       ├── decisions/
    │   │       │   └── page.tsx          # Decision log — chronological history
    │   │       ├── settings/
    │   │       │   └── page.tsx          # Settings — risk, notifications, contract actions
    │   │       └── docs/                 # Documentation hub
    │   │           ├── getting-started/
    │   │           ├── dashboard/
    │   │           ├── agents/
    │   │           ├── treasury/
    │   │           ├── decisions/
    │   │           └── wallet-setup/
    │   │
    │   ├── components/
    │   │   ├── ui/                       # Reusable UI primitives
    │   │   │   ├── GlassCard.tsx         # Glassmorphism container
    │   │   │   ├── MetricCard.tsx        # Animated metric display
    │   │   │   ├── StatusBadge.tsx       # Agent status indicator
    │   │   │   ├── Skeleton.tsx          # Loading skeleton states
    │   │   │   ├── Toast.tsx             # Toast notification system
    │   │   │   ├── NotificationPanel.tsx # Notification dropdown
    │   │   │   ├── Particles.tsx         # Background particle effects
    │   │   │   ├── MouseParallax.tsx     # Parallax cursor tracking
    │   │   │   ├── Breadcrumbs.tsx       # Navigation breadcrumbs
    │   │   │   └── ErrorBoundary.tsx     # React error boundary
    │   │   ├── agents/
    │   │   │   ├── AgentCard.tsx         # Agent overview card
    │   │   │   ├── AgentControlPanel.tsx # Agent management controls
    │   │   │   └── LiveAgentConsole.tsx  # Real-time agent log viewer
    │   │   ├── decisions/
    │   │   │   └── DecisionCard.tsx      # Decision entry with rationale
    │   │   ├── treasury/
    │   │   │   ├── AllocationChart.tsx   # SVG donut allocation chart
    │   │   │   └── TransactionList.tsx   # Transaction history list
    │   │   ├── landing/                  # Landing page specific
    │   │   │   ├── HeroOrb.tsx           # 3D animated hero orb
    │   │   │   ├── FeatureAgentCard.tsx  # Agent feature showcase card
    │   │   │   ├── ChainBadge.tsx        # "Somnia Testnet" badge
    │   │   │   ├── LiveStatsGrid.tsx     # Animated live stats
    │   │   │   └── ContractAddressStrip.tsx # On-chain address marquee
    │   │   └── layout/
    │   │       ├── Sidebar.tsx           # Main sidebar navigation
    │   │       ├── Header.tsx            # Top header with wallet & notifications
    │   │       └── BottomNav.tsx         # Mobile bottom navigation
    │   │
    │   ├── hooks/                        # Custom React Hooks
    │   │   ├── useAgentRegistry.ts       # Read hooks for AgentRegistry contract
    │   │   ├── useCEOAgent.ts            # Read hooks for CEOAgent contract
    │   │   ├── useCFOAgent.ts            # Read hooks for CFOAgent contract
    │   │   ├── useCMOAgent.ts            # Read hooks for CMOAgent contract
    │   │   ├── useTreasuryVault.ts       # Read hooks for TreasuryVault contract
    │   │   ├── useContractActions.ts     # Write hooks for all contracts
    │   │   └── useOrchestrator.ts        # Orchestrator backend API hook
    │   │
    │   ├── lib/
    │   │   ├── constants.ts              # Chain config, contract addresses, agent colors
    │   │   ├── types.ts                  # TypeScript interfaces (Agent, Decision, Treasury)
    │   │   ├── mock-data.ts              # Simulated data layer for development
    │   │   ├── wagmi-config.ts           # wagmi v2 + RainbowKit chain setup
    │   │   ├── exportUtils.ts            # Data export utilities
    │   │   ├── orchestrator.ts           # Orchestrator backend API client
    │   │   │
    │   │   └── somnia/                   # Somnia Integration Layer
    │   │       ├── abis/                 # Contract ABIs (auto-generated from Hardhat)
    │   │       │   ├── AgentRegistry.json
    │   │       │   ├── CEOAgent.json
    │   │       │   ├── CFOAgent.json
    │   │       │   ├── CMOAgent.json
    │   │       │   └── TreasuryVault.json
    │   │       ├── contracts.ts          # Contract config (addresses + ABIs)
    │   │       └── deployed-addresses.json # Deployed contract addresses
    │   │
    │   └── providers/
    │       └── Web3Provider.tsx           # wagmi + RainbowKit + QueryClient provider
    │
    ├── package.json
    └── tsconfig.json
```

---

## 🔗 Key Links

| Resource | Link |
|----------|------|
| **Live Demo** | [sovereignmind-app.vercel.app](https://sovereignmind-app.vercel.app) |
| Somnia Docs | [docs.somnia.network](https://docs.somnia.network) |
| Somnia Testnet RPC | `https://dream-rpc.somnia.network` |
| Somnia Block Explorer | [shannon.somnia.network](https://shannon.somnia.network) |
| Somnia Receipts API | [receipts.net.somnia.host](https://receipts.net.somnia.host) |
| Somnia Agent Dashboard | [agents.somnia.network](https://agents.somnia.network) |

---

## 👥 Team

**Team SovereignMind**

Built with ❤️ for the Somnia Agentathon 2026.

---

## 📄 License

This project is built for the Somnia Agentathon 2026 hackathon.

---

<p align="center">
  <strong>SovereignMind</strong> — Autonomous. Transparent. On-Chain.
</p>