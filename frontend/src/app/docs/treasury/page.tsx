'use client';

import Link from 'next/link';
import { ArrowRight, ArrowLeft, Landmark } from 'lucide-react';

export default function TreasuryDoc() {
  return (
    <div className="max-w-4xl">
      {/* Page Header */}
      <span className="text-[11px] font-label-caps uppercase tracking-wider text-[var(--color-primary)] font-bold mb-2 block">
        Guide — 06
      </span>
      <h1 className="text-3xl sm:text-4xl font-display-lg font-bold tracking-tight text-white mb-4">
        Treasury Vault Management
      </h1>
      <p className="text-[var(--color-on-surface)]/80 font-body-md text-base sm:text-lg mb-8 leading-relaxed font-light">
        The `TreasuryVault.sol` contract acts as the secure financial repository of the SovereignMind guild. It secures funds, manages asset distributions, and executes AI-driven rebalancings.
      </p>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        1. Purpose of the Treasury Vault
      </h2>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-6 leading-relaxed text-sm sm:text-base">
        The Treasury Vault houses the assets managed by the guild. Unlike the investment pool where users hold redeemable shares, the Treasury holds operational capital, asset balances allocated across stablecoins or tokens, and gas tokens used to fund on-chain oracle requests (Somnia agent queries cost STT to pay for computing).
      </p>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        2. Funding the Treasury
      </h2>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-4 leading-relaxed text-sm sm:text-base">
        To maintain operational health (faucet cycles, fee coverage, gas fees), the treasury must remain funded with STT.
      </p>
      
      {/* Step Guide block */}
      <div className="glass-dark bg-white/5 border border-white/10 rounded-xl p-5 mb-8 hover:border-[var(--color-primary)]/30 transition-colors duration-300">
        <h4 className="font-display-lg font-semibold text-white text-sm md:text-base mb-2 flex items-center gap-2">
          <Landmark size={18} className="text-[var(--color-primary)]" />
          How to Fund the Treasury
        </h4>
        <ol className="list-decimal list-inside space-y-2 text-[var(--color-on-surface)]/70 font-body-md text-xs sm:text-sm pl-1">
          <li>Navigate to the <strong className="text-white">Treasury</strong> page in the main terminal menu.</li>
          <li>Click the <strong className="text-[var(--color-primary)]">Fund Treasury</strong> button in the page header.</li>
          <li>Enter the STT amount you want to deposit to back the operating gas.</li>
          <li>Confirm the transaction. The tokens are locked into the vault contract and the transaction record is logged.</li>
        </ol>
      </div>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        3. Automated Rebalancing Mechanics
      </h2>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-4 leading-relaxed text-sm sm:text-base">
        During a rebalance event:
      </p>
      <ul className="list-disc list-inside space-y-2 mb-6 text-[var(--color-on-surface)]/80 font-body-md text-sm sm:text-base pl-2">
        <li>The CFO agent reads risk signals and compiles asset ratios.</li>
        <li>The CMO agent checks sentiment indicators.</li>
        <li>The CEO agent processes these inputs and recommends an asset allocation schema (e.g. 40% STT, 30% USDC, 30% ETH).</li>
        <li>The CEO agent triggers the `rebalance()` contract function. The vault contract interacts with decentralized pools or simulated wrappers to execute swaps on-chain.</li>
      </ul>

      {/* Code block */}
      <div className="glass-dark bg-black/40 border border-white/10 rounded-xl p-5 font-mono text-xs md:text-sm text-[var(--color-primary-container)] overflow-x-auto my-6 shadow-inner">
        <div className="text-[var(--color-on-surface)]/40 mb-3">{/* Rebalance execution inside TreasuryVault.sol */}</div>
        <span className="text-[var(--color-primary)]">function</span> <span className="text-[var(--color-secondary)]">executeRebalance</span>(
        <br />
        &nbsp;&nbsp;address[] memory tokens,
        <br />
        &nbsp;&nbsp;uint256[] memory weights
        <br />
        ) <span className="text-[var(--color-primary)]">external</span> <span className="text-[var(--color-secondary)]">onlyCEO</span> &#123;
        <br />
        &nbsp;&nbsp;<span className="text-[var(--color-on-surface)]/40">{/* Securely validates role access and modifies weights on-chain */}</span>
        <br />
        &nbsp;&nbsp;_performAssetSwaps(tokens, weights);
        <br />
        &#125;
      </div>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        4. Transaction History and Holdings
      </h2>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-6 leading-relaxed text-sm sm:text-base">
        On the Treasury page, the <strong className="text-white">Holdings Chart</strong> visually breaks down current assets by percentage, and the <strong className="text-white">Transaction List</strong> catalogs all historical deposits (funding events), withdrawals, and automated rebalances. Each log includes timestamps, action types, and block explorer hashes for transparency.
      </p>

      {/* Navigation Buttons */}
      <div className="border-t border-white/10 pt-6 flex justify-between">
        <Link
          href="/docs/portfolio"
          className="flex items-center gap-2 text-[var(--color-on-surface)]/60 hover:text-white font-label-caps text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors"
        >
          <ArrowLeft size={16} /> Previous: Portfolio & Investments
        </Link>
        <Link
          href="/docs/decisions"
          className="flex items-center gap-2 text-[var(--color-primary)] hover:text-white font-label-caps text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors"
        >
          Next: On-Chain Decision Logs <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
