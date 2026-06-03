'use client';

import Link from 'next/link';
import { ArrowRight, ArrowLeft, Landmark, Settings } from 'lucide-react';

export default function TreasuryDoc() {
  return (
    <div className="max-w-4xl">
      {/* Page Header */}
      <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold mb-2 block">
        Guide — 06
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
        Treasury Vault Management
      </h1>
      <p className="text-slate-400 text-base sm:text-lg mb-8 leading-relaxed font-light">
        The `TreasuryVault.sol` contract acts as the secure financial repository of the SovereignMind guild. It secures funds, manages asset distributions, and executes AI-driven rebalancings.
      </p>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mt-10 mb-4 border-b border-slate-800/80 pb-2">
        1. Purpose of the Treasury Vault
      </h2>
      <p className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base">
        The Treasury Vault houses the assets managed by the guild. Unlike the investment pool where users hold redeemable shares, the Treasury holds operational capital, asset balances allocated across stablecoins or tokens, and gas tokens used to fund on-chain oracle requests (Somnia agent queries cost STT to pay for computing).
      </p>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mt-10 mb-4 border-b border-slate-800/80 pb-2">
        2. Funding the Treasury
      </h2>
      <p className="text-slate-300 mb-4 leading-relaxed text-sm sm:text-base">
        To maintain operational health (faucet cycles, fee coverage, gas fees), the treasury must remain funded with STT.
      </p>
      
      {/* Step Guide block */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 mb-8">
        <h4 className="font-semibold text-slate-200 text-sm mb-2 flex items-center gap-2">
          <Landmark size={18} className="text-purple-400" />
          How to Fund the Treasury
        </h4>
        <ol className="list-decimal list-inside space-y-2 text-slate-400 text-xs sm:text-sm pl-1">
          <li>Navigate to the **Treasury** page in the main terminal menu.</li>
          <li>Click the <strong>Fund Treasury</strong> button in the page header.</li>
          <li>Enter the STT amount you want to deposit to back the operating gas.</li>
          <li>Confirm the transaction. The tokens are locked into the vault contract and the transaction record is logged.</li>
        </ol>
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mt-10 mb-4 border-b border-slate-800/80 pb-2">
        3. Automated Rebalancing Mechanics
      </h2>
      <p className="text-slate-300 mb-4 leading-relaxed text-sm sm:text-base">
        During a rebalance event:
      </p>
      <ul className="list-disc list-inside space-y-2 mb-6 text-slate-300 text-sm sm:text-base pl-2">
        <li>The CFO agent reads risk signals and compiles asset ratios.</li>
        <li>The CMO agent checks sentiment indicators.</li>
        <li>The CEO agent processes these inputs and recommends an asset allocation schema (e.g. 40% STT, 30% USDC, 30% ETH).</li>
        <li>The CEO agent triggers the `rebalance()` contract function. The vault contract interacts with decentralized pools or simulated wrappers to execute swaps on-chain.</li>
      </ul>

      {/* Code block */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 font-mono text-xs md:text-sm text-purple-200 overflow-x-auto my-6">
        <div className="text-slate-500 mb-2">// Rebalance execution inside TreasuryVault.sol</div>
        <span className="text-purple-400">function</span> <span className="text-blue-300">executeRebalance</span>(
        <br />
        &nbsp;&nbsp;address[] memory tokens,
        <br />
        &nbsp;&nbsp;uint256[] memory weights
        <br />
        ) <span className="text-purple-400">external</span> <span className="text-blue-300">onlyCEO</span> &#123;
        <br />
        &nbsp;&nbsp;<span className="text-slate-500">// Securely validates role access and modifies weights on-chain</span>
        <br />
        &nbsp;&nbsp;_performAssetSwaps(tokens, weights);
        <br />
        &#125;
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mt-10 mb-4 border-b border-slate-800/80 pb-2">
        4. Transaction History and Holdings
      </h2>
      <p className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base">
        On the Treasury page, the **Holdings Chart** visually breaks down current assets by percentage, and the **Transaction List** catalogs all historical deposits (funding events), withdrawals, and automated rebalances. Each log includes timestamps, action types, and block explorer hashes for transparency.
      </p>

      {/* Navigation Buttons */}
      <div className="border-t border-slate-800/60 pt-6 flex justify-between">
        <Link
          href="/docs/portfolio"
          className="flex items-center gap-2 text-slate-400 hover:text-slate-300 text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} /> Previous: Portfolio & Investments
        </Link>
        <Link
          href="/docs/decisions"
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors"
        >
          Next: On-Chain Decision Logs <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
