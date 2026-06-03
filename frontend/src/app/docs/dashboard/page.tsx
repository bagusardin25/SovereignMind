'use client';

import Link from 'next/link';
import { ArrowRight, ArrowLeft, BarChart2, Shield, Heart } from 'lucide-react';

export default function DashboardDoc() {
  return (
    <div className="max-w-4xl">
      {/* Page Header */}
      <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold mb-2 block">
        Guide — 03
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
        Navigating the Dashboard
      </h1>
      <p className="text-slate-400 text-base sm:text-lg mb-8 leading-relaxed font-light">
        The SovereignMind terminal serves as your operational command center. It provides real-time tracking of active agents, on-chain decisions, and current treasury vault health.
      </p>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mt-10 mb-4 border-b border-slate-800/80 pb-2">
        Key Terminal Metrics
      </h2>
      <p className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base">
        The dashboard displays four core performance metrics reflecting the live state of the SovereignMind smart contracts:
      </p>

      <div className="space-y-4 mb-8">
        <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-xl flex gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg shrink-0">
            <BarChart2 size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-1">Treasury Value</h4>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Shows the total value of all assets managed inside the SovereignMind `TreasuryVault.sol` contract. This is priced in STT and updates dynamically as reallocations are executed or funding is deposited.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-xl flex gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-1">Active Agents</h4>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Indicates the count of authorized agents registered in `AgentRegistry.sol`. The standard setup includes the three core executive agents: CEO, CFO, and CMO.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-xl flex gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg shrink-0">
            <Heart size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-1">System Health & Orchestrator Status</h4>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Monitors the link with the off-chain orchestrator. If the orchestrator is active, the system shows green. If the orchestrator goes offline, cycles can still be triggered permissionlessly on-chain.
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mt-10 mb-4 border-b border-slate-800/80 pb-2">
        Triggering a Decision Cycle Manually
      </h2>
      <p className="text-slate-300 mb-4 leading-relaxed text-sm sm:text-base">
        While the off-chain orchestrator triggers cycles automatically (e.g., every 15 minutes), the system design is fully open and permissionless. Anyone can manually initiate an execution cycle if the contract cooldown period has elapsed.
      </p>
      <ol className="list-decimal list-inside space-y-2 mb-6 text-slate-300 text-sm pl-2">
        <li>Ensure your wallet is connected and switched to the Somnia Shannon Testnet.</li>
        <li>Locate the <strong>Run Cycle</strong> button in the dashboard page header.</li>
        <li>If active, click the button and approve the gas transaction in your wallet.</li>
        <li>The system status will transition to <em>Analyzing</em>, and the CFO and CMO agents will start processing data on-chain.</li>
      </ol>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mt-10 mb-4 border-b border-slate-800/80 pb-2">
        The Activity Timeline
      </h2>
      <p className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base">
        At the bottom of the dashboard, the <strong>Activity Timeline</strong> chronicles the detailed workflow logs of the active agents. Here, you can watch real-time steps as the CFO fetches coin price metrics, the CMO parses web indicators, and the CEO writes the final decision receipt.
      </p>

      {/* Navigation Buttons */}
      <div className="border-t border-slate-800/60 pt-6 flex justify-between">
        <Link
          href="/docs/wallet-setup"
          className="flex items-center gap-2 text-slate-400 hover:text-slate-300 text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} /> Previous: Wallet Setup
        </Link>
        <Link
          href="/docs/agents"
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors"
        >
          Next: Autonomous AI Agents <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
