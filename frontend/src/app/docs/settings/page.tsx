'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function SettingsDoc() {
  return (
    <div className="max-w-4xl">
      {/* Page Header */}
      <span className="text-[11px] font-label-caps uppercase tracking-wider text-[var(--color-primary)] font-bold mb-2 block">
        Guide — 08
      </span>
      <h1 className="text-3xl sm:text-4xl font-display-lg font-bold tracking-tight text-white mb-4">
        System Configuration & Settings
      </h1>
      <p className="text-[var(--color-on-surface)]/80 font-body-md text-base sm:text-lg mb-8 leading-relaxed font-light">
        The SovereignMind terminal enables administrators and authorized roles to modify risk tolerances, rebalance cycle cooldowns, and execute emergency contract directives.
      </p>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        1. On-Chain Settings Panel
      </h2>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-6 leading-relaxed text-sm sm:text-base">
        The <strong className="text-white">Settings</strong> page acts as a developer console. Instead of querying local state, the terminal queries public contract getters. If you connect an account containing administrative roles (defined in `AgentRegistry.sol`), you can modify parameters directly.
      </p>

      {/* Parameter Table */}
      <h3 className="text-lg font-display-lg font-semibold text-white mt-6 mb-3">Modifiable Settings Variables</h3>
      <div className="overflow-x-auto glass-dark bg-white/5 border border-white/10 rounded-xl mb-8">
        <table className="w-full text-left border-collapse text-xs sm:text-sm font-body-md">
          <thead>
            <tr className="bg-black/20 text-[var(--color-on-surface)]/80 font-semibold border-b border-white/10">
              <th className="p-4">Variable</th>
              <th className="p-4">Default Value</th>
              <th className="p-4">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-[var(--color-on-surface)]/60">
            <tr className="hover:bg-white/5 transition-colors duration-300">
              <td className="p-4 font-mono font-medium text-white">Risk Threshold</td>
              <td className="p-4 font-mono">65 / 100</td>
              <td className="p-4 text-[var(--color-on-surface)]/70">The maximum risk score computed by the CFO agent before the CEO defaults to asset protection (HOLD/USDC swap).</td>
            </tr>
            <tr className="hover:bg-white/5 transition-colors duration-300">
              <td className="p-4 font-mono font-medium text-white">Rebalance Cooldown</td>
              <td className="p-4 font-mono">15 minutes</td>
              <td className="p-4 text-[var(--color-on-surface)]/70">On-chain constraint defining the minimum time interval that must elapse between `initiateDecisionCycle()` calls.</td>
            </tr>
            <tr className="hover:bg-white/5 transition-colors duration-300">
              <td className="p-4 font-mono font-medium text-white">Oracle Fixed Fee</td>
              <td className="p-4 font-mono">0.05 STT</td>
              <td className="p-4 text-[var(--color-on-surface)]/70">The amount of STT deposited as the runner fee for validator computation execution requests.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        2. Role-Based Access Control (RBAC)
      </h2>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-4 leading-relaxed text-sm sm:text-base">
        The guild secures operational calls using OpenZeppelin&apos;s AccessControl inside the `AgentRegistry.sol` contract. Roles are granted and revoked cryptographically:
      </p>

      {/* Role list */}
      <div className="space-y-4 mb-8 text-sm text-[var(--color-on-surface)]/80 pl-2">
        <div className="flex gap-3 items-start glass-dark bg-white/5 p-4 rounded-xl border border-white/10">
          <span className="font-mono text-[var(--color-primary)] font-bold">ADMIN_ROLE</span>
          <span className="text-[var(--color-on-surface)]/70 font-body-md">Can add or revoke executive agents, alter parameters, and deploy contract upgrades.</span>
        </div>
        <div className="flex gap-3 items-start glass-dark bg-white/5 p-4 rounded-xl border border-white/10">
          <span className="font-mono text-[var(--color-primary)] font-bold">AGENT_ROLE</span>
          <span className="text-[var(--color-on-surface)]/70 font-body-md">Allows target contract addresses (CEO, CFO, CMO) to invoke specific inter-contract methods (e.g. CEO triggering the vault rebalance).</span>
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        3. Emergency Stop (Circuit Breakers)
      </h2>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-6 leading-relaxed text-sm sm:text-base">
        In the event of severe market anomalies or contract issues, the system owner can trigger the <strong className="text-white">Pause</strong> action inside `TreasuryVault.sol` or `VaultShares.sol`. While paused, no automated swaps, deposits, or redemptions can occur. This safety circuit breaker prevents loss of capital until unpaused.
      </p>

      {/* Warning callout */}
      <div className="glass-dark bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 mb-10 flex gap-4 shadow-[0_0_20px_rgba(244,63,94,0.05)]">
        <ShieldAlert className="text-[var(--color-error)] shrink-0 mt-1" size={20} />
        <div>
          <h4 className="font-display-lg font-semibold text-[var(--color-on-error-container)] text-sm md:text-base mb-1">Administrative Safety Warnings</h4>
          <p className="text-white/60 font-body-md text-xs sm:text-sm leading-relaxed">
            Ensure you never share private keys linked to accounts holding administrative permissions on the Somnia Testnet. While gas costs are low, admin transactions still require a funded address.
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="border-t border-white/10 pt-6 flex">
        <Link
          href="/docs/decisions"
          className="flex items-center gap-2 text-[var(--color-on-surface)]/60 hover:text-white font-label-caps text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors"
        >
          <ArrowLeft size={16} /> Previous: On-Chain Decision Logs
        </Link>
      </div>
    </div>
  );
}
