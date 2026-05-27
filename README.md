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

### 🔐 Fully Transparent & Trustless
- Every decision produces a verifiable **on-chain execution receipt**
- Deterministic LLM outputs via Somnia's pinned model weights and synchronized seeds
- No off-chain servers, no external API dependencies — 100% Somnia-native

---

## ⚙️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Smart Contracts** | Solidity 0.8.x | Agent logic, treasury management, access control |
| **Contract Tooling** | Hardhat + TypeScript | Development, testing, deployment |
| **Somnia Integration** | `createRequest()` / `handleResponse()` | Native agent primitives |
| **Frontend** | Next.js 16 + TypeScript | Dashboard & monitoring UI |
| **Styling** | Tailwind CSS v4 | Responsive design system |
| **Animations** | Framer Motion | Smooth UI transitions |
| **Wallet** | wagmi v2 + RainbowKit + viem | Web3 wallet connection |
| **Icons** | Lucide React | Consistent icon set |
| **Blockchain** | Somnia Testnet (Chain ID: 50312) | EVM-compatible L1 with native agent compute |
| **Deployment** | Vercel | Frontend hosting (zero-config) |

### Why No Backend Server?

SovereignMind's architecture eliminates traditional backend infrastructure entirely. All agent logic runs on-chain via Somnia's validator nodes. The frontend reads directly from contract state and Somnia's Receipts API — no middleware required.

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

# Install frontend dependencies
cd frontend
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Somnia Testnet Configuration

Add Somnia Testnet to your wallet:

| Parameter | Value |
|-----------|-------|
| Network Name | Somnia Testnet |
| RPC URL | `https://dream-rpc.somnia.network` |
| Chain ID | `50312` |
| Currency Symbol | `STT` |
| Block Explorer | `https://shannon.somnia.network` |

---

## 📍 Development Roadmap

### Phase 1: Foundation ✅ *Completed*
- [x] Project registration for Somnia Agentathon 2026
- [x] PRD v2.0 — Full architecture redesign for Somnia-native
- [x] Frontend dashboard with 4 main pages (Dashboard, Agents, Treasury, Decisions)
- [x] UI component library (GlassCard, MetricCard, StatusBadge, AgentCard, etc.)
- [x] Wallet integration (wagmi + RainbowKit, Somnia Testnet config)
- [x] TypeScript type system for agents, decisions, treasury, receipts
- [x] Mock data layer demonstrating full UX flow

### Phase 2: Smart Contracts 🔄 *In Progress*
- [ ] `AgentRegistry.sol` — Role-based agent authorization
- [ ] `TreasuryVault.sol` — Secure asset management with OpenZeppelin
- [ ] `CFOAgent.sol` — First `createRequest()` to JSON API Agent
- [ ] `handleResponse()` callback — End-to-end request flow
- [ ] `CEOAgent.sol` — Orchestration with LLM Inference Agent
- [ ] `CMOAgent.sol` — Market intel via LLM Parse Website Agent

### Phase 3: Integration & Polish 📋 *Planned*
- [ ] Deploy all contracts to Somnia Testnet
- [ ] Connect frontend to live contracts (replace mock data)
- [ ] Integrate Somnia Receipts API for real-time decision display
- [ ] Deploy frontend to Vercel
- [ ] Full autonomous loop: CEO → CFO → CMO → Decision → Execute
- [ ] End-to-end testing (48h autonomous run)
- [ ] Demo video (2-5 minutes)

---

## 📂 Project Structure

```
SovereignMind/
├── .env.example                          # Environment variables template
├── README.md                             # This file
│
├── contracts/                            # 🔜 Hardhat — Solidity Smart Contracts
│   ├── contracts/
│   │   ├── AgentRegistry.sol             # Role-based agent authorization (RBAC)
│   │   ├── TreasuryVault.sol             # Secure asset management (OpenZeppelin)
│   │   ├── CEOAgent.sol                  # Orchestrator — LLM Inference Agent
│   │   ├── CFOAgent.sol                  # Risk & Finance — JSON API + LLM Inference
│   │   ├── CMOAgent.sol                  # Market Intel — LLM Parse Website + LLM Inference
│   │   └── interfaces/
│   │       └── ISomniaAgentRunner.sol    # Somnia createRequest()/handleResponse() interface
│   ├── scripts/
│   │   └── deploy.ts                     # Deployment script for Somnia Testnet
│   ├── test/
│   │   └── *.test.ts                     # Contract unit tests
│   └── hardhat.config.ts                 # Hardhat config (Somnia Testnet RPC)
│
└── frontend/                             # Next.js 16 Dashboard
    ├── public/
    │   ├── logo.png                      # SovereignMind logo
    │   └── manifest.json                 # PWA manifest
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx                  # Landing page (3D Spline hero + FAQ)
    │   │   ├── layout.tsx                # Root layout (fonts, Web3Provider)
    │   │   ├── globals.css               # Design system & CSS theme tokens
    │   │   ├── favicon.ico               # Favicon
    │   │   ├── not-found.tsx             # Global 404 page
    │   │   │
    │   │   └── (app)/                    # 🔒 Route Group — Sidebar layout
    │   │       ├── layout.tsx            # App shell (Sidebar + Header)
    │   │       ├── template.tsx          # Page transition wrapper
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
    │   │       │   └── page.tsx          # Settings — network, notifications, preferences
    │   │       └── docs/                 # Documentation hub
    │   │           ├── getting-started/  # Quick start guide
    │   │           ├── dashboard/        # Dashboard docs
    │   │           ├── agents/           # Agent system docs
    │   │           ├── treasury/         # Treasury docs
    │   │           ├── decisions/        # Decision engine docs
    │   │           └── wallet-setup/     # Wallet connection guide
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
    │   │   │   ├── SplineScene.tsx       # 3D Spline scene loader
    │   │   │   ├── ChainBadge.tsx        # "Somnia Testnet" badge
    │   │   │   ├── LiveStatsGrid.tsx     # Animated live stats
    │   │   │   └── ContractAddressStrip.tsx # On-chain address marquee
    │   │   └── layout/
    │   │       ├── Sidebar.tsx           # Main sidebar navigation
    │   │       ├── Header.tsx            # Top header with wallet
    │   │       └── BottomNav.tsx         # Mobile bottom navigation
    │   │
    │   ├── lib/
    │   │   ├── constants.ts              # Chain config, contract addresses, agent colors
    │   │   ├── types.ts                  # TypeScript interfaces (Agent, Decision, Treasury, Receipt)
    │   │   ├── mock-data.ts              # Simulated data layer (replaced by live contracts later)
    │   │   ├── wagmi-config.ts           # wagmi v2 + RainbowKit chain setup
    │   │   ├── exportUtils.ts            # Data export utilities
    │   │   │
    │   │   └── somnia/                   # 🔜 Somnia Integration Layer
    │   │       ├── abis/                 # Contract ABIs (auto-generated from Hardhat)
    │   │       │   ├── AgentRegistry.json
    │   │       │   ├── CEOAgent.json
    │   │       │   ├── CFOAgent.json
    │   │       │   ├── CMOAgent.json
    │   │       │   └── TreasuryVault.json
    │   │       ├── contracts.ts          # Contract read/write hooks (wagmi useReadContract)
    │   │       ├── receipts.ts           # Somnia Receipts API client (fetch execution receipts)
    │   │       └── agents.ts             # Agent status polling & event listeners
    │   │
    │   └── providers/
    │       └── Web3Provider.tsx           # wagmi + RainbowKit + QueryClient provider
    │
    ├── package.json
    └── tsconfig.json
```

> **Legend**: 🔜 = Planned for Phase 2-3 (Smart Contract & Integration phase)

---

## 🔗 Key Links

| Resource | Link |
|----------|------|
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