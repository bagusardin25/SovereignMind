'use client';

import Link from 'next/link';
import { ArrowRight, ArrowLeft, TrendingUp, Info } from 'lucide-react';

export default function PortfolioDoc() {
  return (
    <div className="max-w-4xl">
      {/* Page Header */}
      <span className="text-[11px] font-label-caps uppercase tracking-wider text-[var(--color-primary)] font-bold mb-2 block">
        Guide — 05
      </span>
      <h1 className="text-3xl sm:text-4xl font-display-lg font-bold tracking-tight text-white mb-4">
        Portfolio & Investments
      </h1>
      <p className="text-[var(--color-on-surface)]/80 font-body-md text-base sm:text-lg mb-8 leading-relaxed font-light">
        SovereignMind manages capital pools via the `VaultShares.sol` smart contract. By investing STT tokens, users receive Vault Shares representing fractional ownership of the guild's managed assets.
      </p>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        How Vault Shares Work
      </h2>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-6 leading-relaxed text-sm sm:text-base">
        When you participate in SovereignMind, you do not simply leave your assets idle. Instead, you deposit STT to buy Vault Shares. The contract mints shares to your address, which represents your portion of the entire vault pool. As the AI agents rebalance and optimize the treasury yield, any on-chain gains increase the total managed assets, thus increasing the price of your shares.
      </p>

      {/* Info block */}
      <div className="glass-dark bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-xl p-5 mb-8 flex gap-4 shadow-[0_0_20px_rgba(207,188,255,0.05)]">
        <Info className="text-[var(--color-primary)] shrink-0 mt-1" size={20} />
        <div>
          <h4 className="font-display-lg font-semibold text-white text-sm md:text-base mb-1">A Note on Terminology</h4>
          <p className="text-[var(--color-on-surface)]/70 font-body-md text-xs sm:text-sm leading-relaxed">
            To prevent confusion, we have updated the interface labels. The action of purchasing shares is called <strong className="text-[var(--color-primary)]">Buy Shares</strong> (Invest), while adding operational assets for cycle gas and general funding to the treasury is called <strong className="text-[var(--color-primary)]">Fund Treasury</strong>.
          </p>
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        Investing & Redeeming
      </h2>
      
      <h3 className="text-lg font-display-lg font-semibold text-white mt-6 mb-3">Buying Vault Shares</h3>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-4 text-sm sm:text-base leading-relaxed">
        To buy Vault Shares, navigate to the <strong className="text-white">Portfolio</strong> page in the main terminal, input the desired STT amount in the <em className="text-white">Invest</em> tab, and click <strong className="text-[var(--color-primary)]">Buy Shares</strong>. The contract handles the transaction on-chain:
      </p>
      
      {/* Code math box */}
      <div className="glass-dark bg-black/40 border border-white/10 rounded-xl p-5 font-mono text-xs md:text-sm text-[var(--color-primary-container)] overflow-x-auto my-6 shadow-inner">
        <div className="text-[var(--color-on-surface)]/40 mb-3">// Share minting math inside VaultShares.sol</div>
        uint256 sharesToMint = (depositAmount * totalShareSupply) / totalManagedAssets;
        <br />
        <span className="text-[var(--color-tertiary)]">_mint</span>(userAddress, sharesToMint);
      </div>

      <h3 className="text-lg font-display-lg font-semibold text-white mt-8 mb-3">Redeeming (Withdrawal)</h3>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-6 text-sm sm:text-base leading-relaxed">
        You can withdraw your capital at any time. Under the <em className="text-white">Redeem</em> tab, input the number of shares you want to sell. The contract will burn your shares and transfer the equivalent amount of STT back to your wallet based on the current share price.
      </p>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        Share Price Math
      </h2>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-4 text-sm sm:text-base leading-relaxed">
        The share price is calculated on-chain. When the pool starts, the exchange rate is set to 1.0. As profits accrue, the exchange rate increases dynamically:
      </p>

      {/* Dynamic formula card */}
      <div className="glass-dark bg-[var(--color-surface-container-highest)]/50 border border-white/10 p-6 rounded-xl text-center mb-8 hover:border-[var(--color-primary)]/30 transition-colors">
        <span className="text-[10px] font-label-caps uppercase tracking-wider text-[var(--color-primary)] font-semibold block mb-2">On-Chain Formula</span>
        <div className="text-xl md:text-2xl font-mono text-white tracking-tight py-2 font-bold drop-shadow-md">
          Share Price = Total Assets / Total Share Supply
        </div>
        <p className="text-[var(--color-on-surface)]/60 font-body-md text-xs mt-3 max-w-md mx-auto">
          If the treasury gains value through automated trading or yield strategies, the numerator increases, driving up the share price for all current share holders.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="border-t border-white/10 pt-6 flex justify-between">
        <Link
          href="/docs/agents"
          className="flex items-center gap-2 text-[var(--color-on-surface)]/60 hover:text-white font-label-caps text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors"
        >
          <ArrowLeft size={16} /> Previous: Autonomous Agents
        </Link>
        <Link
          href="/docs/treasury"
          className="flex items-center gap-2 text-[var(--color-primary)] hover:text-white font-label-caps text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors"
        >
          Next: Treasury Management <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
