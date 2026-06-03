'use client';

import Link from 'next/link';
import { ArrowRight, ArrowLeft, TrendingUp, Info } from 'lucide-react';

export default function PortfolioDoc() {
  return (
    <div className="max-w-4xl">
      {/* Page Header */}
      <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold mb-2 block">
        Guide — 05
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
        Portfolio & Investments
      </h1>
      <p className="text-slate-400 text-base sm:text-lg mb-8 leading-relaxed font-light">
        SovereignMind manages capital pools via the `VaultShares.sol` smart contract. By investing STT tokens, users receive Vault Shares representing fractional ownership of the guild's managed assets.
      </p>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mt-10 mb-4 border-b border-slate-800/80 pb-2">
        How Vault Shares Work
      </h2>
      <p className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base">
        When you participate in SovereignMind, you do not simply leave your assets idle. Instead, you deposit STT to buy Vault Shares. The contract mints shares to your address, which represents your portion of the entire vault pool. As the AI agents rebalance and optimize the treasury yield, any on-chain gains increase the total managed assets, thus increasing the price of your shares.
      </p>

      {/* Info block */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 mb-8 flex gap-4">
        <Info className="text-purple-400 shrink-0 mt-1" size={20} />
        <div>
          <h4 className="font-semibold text-slate-200 text-sm mb-1">A Note on Terminology</h4>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            To prevent confusion, we have updated the interface labels. The action of purchasing shares is called <strong>Buy Shares</strong> (Invest), while adding operational assets for cycle gas and general funding to the treasury is called <strong>Fund Treasury</strong>.
          </p>
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mt-10 mb-4 border-b border-slate-800/80 pb-2">
        Investing & Redeeming
      </h2>
      
      <h3 className="text-lg font-semibold text-slate-200 mt-6 mb-3">Buying Vault Shares</h3>
      <p className="text-slate-300 mb-4 text-sm sm:text-base leading-relaxed">
        To buy Vault Shares, navigate to the **Portfolio** page in the main terminal, input the desired STT amount in the <em>Invest</em> tab, and click <strong>Buy Shares</strong>. The contract handles the transaction on-chain:
      </p>
      
      {/* Code math box */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 font-mono text-xs md:text-sm text-purple-200 overflow-x-auto my-6">
        <div className="text-slate-500 mb-2">// Share minting math inside VaultShares.sol</div>
        uint256 sharesToMint = (depositAmount * totalShareSupply) / totalManagedAssets;
        <br />
        _mint(userAddress, sharesToMint);
      </div>

      <h3 className="text-lg font-semibold text-slate-200 mt-8 mb-3">Redeeming (Withdrawal)</h3>
      <p className="text-slate-300 mb-6 text-sm sm:text-base leading-relaxed">
        You can withdraw your capital at any time. Under the <em>Redeem</em> tab, input the number of shares you want to sell. The contract will burn your shares and transfer the equivalent amount of STT back to your wallet based on the current share price.
      </p>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mt-10 mb-4 border-b border-slate-800/80 pb-2">
        Share Price Math
      </h2>
      <p className="text-slate-300 mb-4 text-sm sm:text-base leading-relaxed">
        The share price is calculated on-chain. When the pool starts, the exchange rate is set to 1.0. As profits accrue, the exchange rate increases dynamically:
      </p>

      {/* Dynamic formula card */}
      <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-xl text-center mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold block mb-2">On-Chain Formula</span>
        <div className="text-xl md:text-2xl font-mono text-white tracking-tight py-2">
          Share Price = Total Assets / Total Share Supply
        </div>
        <p className="text-slate-400 text-xs mt-3 max-w-md mx-auto">
          If the treasury gains value through automated trading or yield strategies, the numerator increases, driving up the share price for all current share holders.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="border-t border-slate-800/60 pt-6 flex justify-between">
        <Link
          href="/docs/agents"
          className="flex items-center gap-2 text-slate-400 hover:text-slate-300 text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} /> Previous: Autonomous Agents
        </Link>
        <Link
          href="/docs/treasury"
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors"
        >
          Next: Treasury Management <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
