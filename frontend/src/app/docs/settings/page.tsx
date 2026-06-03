'use client';

import Link from 'next/link';
import { ArrowLeft, Settings, ShieldAlert, Cpu } from 'lucide-react';

export default function SettingsDoc() {
  return (
    <div className="max-w-4xl">
      {/* Page Header */}
      <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold mb-2 block">
        Guide — 08
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
        System Configuration & Settings
      </h1>
      <p className="text-slate-400 text-base sm:text-lg mb-8 leading-relaxed font-light">
        The SovereignMind terminal enables administrators and authorized roles to modify risk tolerances, rebalance cycle cooldowns, and execute emergency contract directives.
      </p>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mt-10 mb-4 border-b border-slate-800/80 pb-2">
        1. On-Chain Settings Panel
      </h2>
      <p className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base">
        The **Settings** page acts as a developer console. Instead of querying local state, the terminal queries public contract getters. If you connect an account containing administrative roles (defined in `AgentRegistry.sol`), you can modify parameters directly.
      </p>

      {/* Parameter Table */}
      <h3 className="text-lg font-semibold text-slate-200 mt-6 mb-3">Modifiable Settings Variables</h3>
      <div className="overflow-x-auto border border-slate-800/80 rounded-xl mb-8">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
              <th className="p-4">Variable</th>
              <th className="p-4">Default Value</th>
              <th className="p-4">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-400">
            <tr className="hover:bg-slate-900/10">
              <td className="p-4 font-mono font-medium text-white">Risk Threshold</td>
              <td className="p-4 font-mono">65 / 100</td>
              <td className="p-4 text-slate-400">The maximum risk score computed by the CFO agent before the CEO defaults to asset protection (HOLD/USDC swap).</td>
            </tr>
            <tr className="hover:bg-slate-900/10">
              <td className="p-4 font-mono font-medium text-white">Rebalance Cooldown</td>
              <td className="p-4 font-mono">15 minutes</td>
              <td className="p-4 text-slate-400">On-chain constraint defining the minimum time interval that must elapse between `initiateDecisionCycle()` calls.</td>
            </tr>
            <tr className="hover:bg-slate-900/10">
              <td className="p-4 font-mono font-medium text-white">Oracle Fixed Fee</td>
              <td className="p-4 font-mono">0.05 STT</td>
              <td className="p-4 text-slate-400">The amount of STT deposited as the runner fee for validator computation execution requests.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mt-10 mb-4 border-b border-slate-800/80 pb-2">
        2. Role-Based Access Control (RBAC)
      </h2>
      <p className="text-slate-300 mb-4 leading-relaxed text-sm sm:text-base">
        The guild secures operational calls using OpenZeppelin's AccessControl inside the `AgentRegistry.sol` contract. Roles are granted and revoked cryptographically:
      </p>

      {/* Role list */}
      <div className="space-y-4 mb-8 text-sm text-slate-300 pl-2">
        <div className="flex gap-3 items-start">
          <span className="font-mono text-purple-400 font-bold">ADMIN_ROLE</span>
          <span className="text-slate-400">Can add or revoke executive agents, alter parameters, and deploy contract upgrades.</span>
        </div>
        <div className="flex gap-3 items-start">
          <span className="font-mono text-purple-400 font-bold">AGENT_ROLE</span>
          <span className="text-slate-400">Allows target contract addresses (CEO, CFO, CMO) to invoke specific inter-contract methods (e.g. CEO triggering the vault rebalance).</span>
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mt-10 mb-4 border-b border-slate-800/80 pb-2">
        3. Emergency Stop (Circuit Breakers)
      </h2>
      <p className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base">
        In the event of severe market anomalies or contract issues, the system owner can trigger the **Pause** action inside `TreasuryVault.sol` or `VaultShares.sol`. While paused, no automated swaps, deposits, or redemptions can occur. This safety circuit breaker prevents loss of capital until unpaused.
      </p>

      {/* Warning callout */}
      <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-5 mb-10 flex gap-4">
        <ShieldAlert className="text-rose-400 shrink-0 mt-1" size={20} />
        <div>
          <h4 className="font-semibold text-rose-200 text-sm mb-1">Administrative Safety Warnings</h4>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Ensure you never share private keys linked to accounts holding administrative permissions on the Somnia Testnet. While gas costs are low, admin transactions still require a funded address.
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="border-t border-slate-800/60 pt-6 flex">
        <Link
          href="/docs/decisions"
          className="flex items-center gap-2 text-slate-400 hover:text-slate-300 text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} /> Previous: On-Chain Decision Logs
        </Link>
      </div>
    </div>
  );
}
