# 🧠 SovereignMind — Frontend Dashboard

Next.js 16 dashboard for monitoring the SovereignMind autonomous agent system on Somnia Testnet.

> **Live:** Deployed on [Vercel](https://sovereignmind-app.vercel.app)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
# WalletConnect Project ID (get one at https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Orchestrator backend URL (optional — for live agent cycle status)
NEXT_PUBLIC_ORCHESTRATOR_URL=http://localhost:3001
```

---

## 📄 Pages & Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page — 3D hero orb, feature agents, live stats grid, FAQ, contract address strip |
| `/dashboard` | Dashboard — real-time overview of agents, treasury, and recent decisions |
| `/agents` | Agent listing — CEO, CFO, CMO cards with status, uptime, and performance |
| `/agents/[role]` | Agent detail — performance metrics, live console, control panel |
| `/decisions` | Decision log — chronological history with rationale and confidence scores |
| `/treasury` | Treasury — portfolio allocation chart, holdings, transaction history |
| `/settings` | Settings — risk thresholds, rebalance interval, notifications, on-chain actions panel |
| `/docs/*` | Documentation hub — getting-started, dashboard, agents, treasury, decisions, wallet-setup |

### Error Handling

| Route | Description |
|-------|-------------|
| `not-found.tsx` (root) | Global 404 page |
| `(app)/not-found.tsx` | App-level 404 page |
| `(app)/error.tsx` | Error boundary for app routes |

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.2.6 | App Router framework |
| **React** | 19.2.4 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **Framer Motion** | 12.x | Page transitions & micro-animations |
| **wagmi** | 2.19.x | React hooks for Ethereum |
| **viem** | 2.50.x | TypeScript Ethereum library |
| **RainbowKit** | 2.2.x | Wallet connection UI |
| **@tanstack/react-query** | 5.x | Data fetching & caching |
| **ethers.js** | 6.x | Contract interaction utilities |
| **Lucide React** | 1.16.x | Icon library |

**Chain:** Somnia Testnet (Chain ID: `50312`)

---

## 📂 Project Structure

```
frontend/
├── public/                               # Static assets
│   ├── 3d_coin_chart.png                # Hero section asset
│   ├── logo.png                         # SovereignMind logo (PNG)
│   ├── logo.jpg                         # SovereignMind logo (JPG)
│   ├── manifest.json                    # PWA manifest
│   ├── favicon.ico                      # Favicon
│   ├── file.svg                         # Default icons
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Root layout (fonts, Web3Provider)
│   │   ├── page.tsx                     # Landing page (hero, agents, FAQ)
│   │   ├── globals.css                  # Design system & CSS theme tokens
│   │   ├── favicon.ico                  # App favicon
│   │   ├── not-found.tsx                # Global 404 page
│   │   │
│   │   └── (app)/                       # 🔒 Route Group — Sidebar layout
│   │       ├── layout.tsx               # App shell (Sidebar + Header)
│   │       ├── template.tsx             # Page transition wrapper (Framer Motion)
│   │       ├── error.tsx                # Error boundary
│   │       ├── not-found.tsx            # App-level 404
│   │       ├── dashboard/
│   │       │   └── page.tsx             # Dashboard — metrics, agents, decisions
│   │       ├── agents/
│   │       │   ├── page.tsx             # Agent listing (CEO, CFO, CMO)
│   │       │   └── [role]/
│   │       │       └── page.tsx         # Agent detail — performance, console, controls
│   │       ├── treasury/
│   │       │   └── page.tsx             # Treasury — allocation chart, holdings, txns
│   │       ├── decisions/
│   │       │   └── page.tsx             # Decision log — chronological history
│   │       ├── settings/
│   │       │   └── page.tsx             # Settings — risk, notifications, contract actions
│   │       └── docs/                    # Documentation hub (6 sections)
│   │           ├── getting-started/
│   │           ├── dashboard/
│   │           ├── agents/
│   │           ├── treasury/
│   │           ├── decisions/
│   │           └── wallet-setup/
│   │
│   ├── components/
│   │   ├── ui/                          # Reusable UI primitives
│   │   │   ├── GlassCard.tsx            # Glassmorphism container
│   │   │   ├── MetricCard.tsx           # Animated metric display
│   │   │   ├── StatusBadge.tsx          # Agent status indicator
│   │   │   ├── Skeleton.tsx             # Loading skeleton states
│   │   │   ├── Toast.tsx                # Toast notification system
│   │   │   ├── NotificationPanel.tsx    # Notification dropdown
│   │   │   ├── Particles.tsx            # Background particle effects
│   │   │   ├── MouseParallax.tsx        # Parallax cursor tracking
│   │   │   ├── Breadcrumbs.tsx          # Navigation breadcrumbs
│   │   │   └── ErrorBoundary.tsx        # React error boundary
│   │   │
│   │   ├── agents/                      # Agent-specific components
│   │   │   ├── AgentCard.tsx            # Agent overview card
│   │   │   ├── AgentControlPanel.tsx    # Agent management controls
│   │   │   └── LiveAgentConsole.tsx     # Real-time agent log viewer
│   │   │
│   │   ├── decisions/                   # Decision components
│   │   │   └── DecisionCard.tsx         # Decision entry with rationale
│   │   │
│   │   ├── treasury/                    # Treasury components
│   │   │   ├── AllocationChart.tsx      # SVG donut allocation chart
│   │   │   └── TransactionList.tsx      # Transaction history list
│   │   │
│   │   ├── landing/                     # Landing page specific
│   │   │   ├── HeroOrb.tsx              # 3D animated hero orb
│   │   │   ├── FeatureAgentCard.tsx     # Agent feature card
│   │   │   ├── ChainBadge.tsx           # "Somnia Testnet" badge
│   │   │   ├── LiveStatsGrid.tsx        # Animated live stats
│   │   │   └── ContractAddressStrip.tsx # On-chain address marquee
│   │   │
│   │   └── layout/                      # Layout components
│   │       ├── Sidebar.tsx              # Main sidebar navigation
│   │       ├── Header.tsx               # Top header with wallet & notifications
│   │       └── BottomNav.tsx            # Mobile bottom navigation
│   │
│   ├── hooks/                           # Custom React hooks
│   │   ├── useAgentRegistry.ts          # Read hooks for AgentRegistry contract
│   │   ├── useCEOAgent.ts               # Read hooks for CEOAgent contract
│   │   ├── useCFOAgent.ts               # Read hooks for CFOAgent contract
│   │   ├── useCMOAgent.ts               # Read hooks for CMOAgent contract
│   │   ├── useTreasuryVault.ts          # Read hooks for TreasuryVault contract
│   │   ├── useContractActions.ts        # Write hooks for all contracts
│   │   └── useOrchestrator.ts           # Orchestrator backend API hook
│   │
│   ├── lib/
│   │   ├── constants.ts                 # Chain config, contract addresses, agent colors
│   │   ├── types.ts                     # TypeScript interfaces (Agent, Decision, Treasury)
│   │   ├── mock-data.ts                 # Simulated data layer for development
│   │   ├── wagmi-config.ts              # wagmi v2 + RainbowKit chain setup
│   │   ├── exportUtils.ts              # Data export utilities
│   │   ├── orchestrator.ts              # Orchestrator backend API client
│   │   │
│   │   └── somnia/                      # Somnia Integration Layer
│   │       ├── abis/                    # Contract ABIs (from Hardhat compilation)
│   │       │   ├── AgentRegistry.json
│   │       │   ├── CEOAgent.json
│   │       │   ├── CFOAgent.json
│   │       │   ├── CMOAgent.json
│   │       │   └── TreasuryVault.json
│   │       ├── contracts.ts             # Contract config (addresses + ABIs)
│   │       └── deployed-addresses.json  # Deployed contract addresses (Somnia Testnet)
│   │
│   └── providers/
│       └── Web3Provider.tsx             # wagmi + RainbowKit + QueryClient provider
│
├── .env.example                         # Environment variables template
├── .env.local                           # Local environment (gitignored)
├── eslint.config.mjs                    # ESLint config
├── next.config.ts                       # Next.js config
├── next-env.d.ts                        # Next.js TypeScript declarations
├── postcss.config.mjs                   # PostCSS config (Tailwind)
├── tsconfig.json                        # TypeScript config
├── package.json                         # Dependencies & scripts
└── package-lock.json                    # Dependency lock file
```

---

## 🔗 Deployed Contract Addresses (Somnia Testnet)

| Contract | Address |
|----------|---------|
| AgentRegistry | `0x9B4f52744EE60A763d1a1966eCD91e04E668d2d6` |
| TreasuryVault | `0x269B22DFF373Bb3aC9c564141edbfe9De3903a40` |
| CFOAgent | `0x21e908dc15cb5Dbd659f107DC0058Fe2D762E385` |
| CMOAgent | `0xd110592795615D78776c52b0a5B254d5eb7B6662` |
| CEOAgent | ⏳ Pending deployment |

---

## 🌐 Deployment

The frontend is deployed on **Vercel** with automatic deployments from the `main` branch.

- **Production URL:** [https://sovereignmind-app.vercel.app](https://sovereignmind-app.vercel.app)
- **Framework Preset:** Next.js
- **Root Directory:** `frontend/`

### Deploy manually

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint checks |
