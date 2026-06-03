'use client';

import Link from 'next/link';
import { ArrowRight, ArrowLeft, BarChart2, Shield, Heart } from 'lucide-react';

export default function DashboardDoc() {
  return (
    <div className="max-w-4xl">
      {/* Page Header */}
      <span className="text-[11px] font-label-caps uppercase tracking-wider text-[var(--color-primary)] font-bold mb-2 block">
        Guide — 03
      </span>
      <h1 className="text-3xl sm:text-4xl font-display-lg font-bold tracking-tight text-white mb-4">
        Navigating the Dashboard
      </h1>
      <p className="text-[var(--color-on-surface)]/80 font-body-md text-base sm:text-lg mb-8 leading-relaxed font-light">
        The SovereignMind terminal serves as your operational command center. It provides real-time tracking of active agents, on-chain decisions, and current treasury vault health.
      </p>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        Key Terminal Metrics
      </h2>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-6 leading-relaxed text-sm sm:text-base">
        The dashboard displays four core performance metrics reflecting the live state of the SovereignMind smart contracts:
      </p>

      <div className="space-y-4 mb-8">
        <div className="glass-dark bg-white/5 border border-white/10 p-5 rounded-xl flex gap-4 group hover:border-[var(--color-primary)]/30 transition-colors duration-300">
          <div className="p-3 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)] rounded-lg shrink-0 group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-on-primary)] transition-all">
            <BarChart2 size={20} />
          </div>
          <div>
            <h4 className="font-display-lg font-semibold text-white text-sm md:text-base mb-1">Treasury Value</h4>
            <p className="text-[var(--color-on-surface)]/60 font-body-md text-xs sm:text-sm leading-relaxed">
              Shows the total value of all assets managed inside the SovereignMind `TreasuryVault.sol` contract. This is priced in STT and updates dynamically as reallocations are executed or funding is deposited.
            </p>
          </div>
        </div>

        <div className="glass-dark bg-white/5 border border-white/10 p-5 rounded-xl flex gap-4 group hover:border-[var(--color-primary)]/30 transition-colors duration-300">
          <div className="p-3 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)] rounded-lg shrink-0 group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-on-primary)] transition-all">
            <Shield size={20} />
          </div>
          <div>
            <h4 className="font-display-lg font-semibold text-white text-sm md:text-base mb-1">Active Agents</h4>
            <p className="text-[var(--color-on-surface)]/60 font-body-md text-xs sm:text-sm leading-relaxed">
              Indicates the count of authorized agents registered in `AgentRegistry.sol`. The standard setup includes the three core executive agents: CEO, CFO, and CMO.
            </p>
          </div>
        </div>

        <div className="glass-dark bg-white/5 border border-white/10 p-5 rounded-xl flex gap-4 group hover:border-[var(--color-primary)]/30 transition-colors duration-300">
          <div className="p-3 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)] rounded-lg shrink-0 group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-on-primary)] transition-all">
            <Heart size={20} />
          </div>
          <div>
            <h4 className="font-display-lg font-semibold text-white text-sm md:text-base mb-1">System Health & Orchestrator Status</h4>
            <p className="text-[var(--color-on-surface)]/60 font-body-md text-xs sm:text-sm leading-relaxed">
              Monitors the link with the off-chain orchestrator. If the orchestrator is active, the system shows green. If the orchestrator goes offline, cycles can still be triggered permissionlessly on-chain.
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        Triggering a Decision Cycle Manually
      </h2>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-4 leading-relaxed text-sm sm:text-base">
        While the off-chain orchestrator triggers cycles automatically (e.g., every 15 minutes), the system design is fully open and permissionless. Anyone can manually initiate an execution cycle if the contract cooldown period has elapsed.
      </p>
      <ol className="list-decimal list-inside space-y-2 mb-6 text-[var(--color-on-surface)]/80 font-body-md text-sm pl-2">
        <li>Ensure your wallet is connected and switched to the Somnia Shannon Testnet.</li>
        <li>Locate the <strong className="text-white">Run Cycle</strong> button in the dashboard page header.</li>
        <li>If active, click the button and approve the gas transaction in your wallet.</li>
        <li>The system status will transition to <em className="text-white">Analyzing</em>, and the CFO and CMO agents will start processing data on-chain.</li>
      </ol>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        The Activity Timeline
      </h2>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-6 leading-relaxed text-sm sm:text-base">
        At the bottom of the dashboard, the <strong className="text-white">Activity Timeline</strong> chronicles the detailed workflow logs of the active agents. Here, you can watch real-time steps as the CFO fetches coin price metrics, the CMO parses web indicators, and the CEO writes the final decision receipt.
      </p>

      {/* Navigation Buttons */}
      <div className="border-t border-white/10 pt-6 flex justify-between">
        <Link
          href="/docs/wallet-setup"
          className="flex items-center gap-2 text-[var(--color-on-surface)]/60 hover:text-white font-label-caps text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors"
        >
          <ArrowLeft size={16} /> Previous: Wallet Setup
        </Link>
        <Link
          href="/docs/agents"
          className="flex items-center gap-2 text-[var(--color-primary)] hover:text-white font-label-caps text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors"
        >
          Next: Autonomous AI Agents <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
