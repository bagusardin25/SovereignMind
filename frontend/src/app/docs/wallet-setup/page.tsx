'use client';

import Link from 'next/link';
import { ArrowRight, ArrowLeft, Copy, Info, Check } from 'lucide-react';
import { useState } from 'react';

export default function WalletSetupDoc() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="max-w-4xl">
      {/* Page Header */}
      <span className="text-[11px] font-label-caps uppercase tracking-wider text-[var(--color-primary)] font-bold mb-2 block">
        Guide — 02
      </span>
      <h1 className="text-3xl sm:text-4xl font-display-lg font-bold tracking-tight text-white mb-4">
        Wallet Setup & Network Configuration
      </h1>
      <p className="text-[var(--color-on-surface)]/80 font-body-md text-base sm:text-lg mb-8 leading-relaxed font-light">
        SovereignMind operates on the Somnia Testnet. To interact with the application, invest in the portfolio, or trigger decision cycles, you must configure your EVM-compatible wallet and fund it with testnet STT tokens.
      </p>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        1. Setup MetaMask (or any EVM Wallet)
      </h2>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-4 leading-relaxed text-sm sm:text-base">
        You can use MetaMask, Coinbase Wallet, Rabby, or any wallet supported by RainbowKit. Follow these steps to configure MetaMask manually for the Somnia Shannon Testnet:
      </p>
      <ol className="list-decimal list-inside space-y-2 mb-6 text-[var(--color-on-surface)]/80 font-body-md text-sm pl-2">
        <li>Open your wallet extension and click the network selector dropdown.</li>
        <li>Select <strong className="text-white">Add Network</strong>, then choose <strong className="text-white">Add a network manually</strong>.</li>
        <li>Enter the network parameters listed below.</li>
        <li>Save and switch to the newly added network.</li>
      </ol>

      {/* Network Parameters Table */}
      <h3 className="text-lg font-display-lg font-semibold text-white mt-8 mb-4">
        Somnia Shannon Testnet Network Parameters
      </h3>
      <div className="overflow-x-auto glass-dark bg-white/5 border border-white/10 rounded-xl mb-8">
        <table className="w-full text-left border-collapse text-xs sm:text-sm font-body-md">
          <thead>
            <tr className="bg-black/20 text-[var(--color-on-surface)]/80 font-semibold border-b border-white/10">
              <th className="p-4">Parameter</th>
              <th className="p-4">Value</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            <tr className="hover:bg-white/5 transition-colors">
              <td className="p-4 font-medium text-white">Network Name</td>
              <td className="p-4 text-[var(--color-on-surface)]/80">Somnia Testnet</td>
              <td className="p-4 text-center">
                <button
                  onClick={() => copyToClipboard('Somnia Testnet', 'name')}
                  className="p-1 hover:text-white text-[var(--color-on-surface)]/50 rounded transition-colors"
                >
                  {copiedText === 'name' ? <Check size={14} className="text-[var(--color-success)]" /> : <Copy size={14} />}
                </button>
              </td>
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="p-4 font-medium text-white">New RPC URL</td>
              <td className="p-4 text-[var(--color-on-surface)]/80 font-mono">https://dream-rpc.somnia.network</td>
              <td className="p-4 text-center">
                <button
                  onClick={() => copyToClipboard('https://dream-rpc.somnia.network', 'rpc')}
                  className="p-1 hover:text-white text-[var(--color-on-surface)]/50 rounded transition-colors"
                >
                  {copiedText === 'rpc' ? <Check size={14} className="text-[var(--color-success)]" /> : <Copy size={14} />}
                </button>
              </td>
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="p-4 font-medium text-white">Chain ID</td>
              <td className="p-4 text-[var(--color-on-surface)]/80 font-mono">50312</td>
              <td className="p-4 text-center">
                <button
                  onClick={() => copyToClipboard('50312', 'chain')}
                  className="p-1 hover:text-white text-[var(--color-on-surface)]/50 rounded transition-colors"
                >
                  {copiedText === 'chain' ? <Check size={14} className="text-[var(--color-success)]" /> : <Copy size={14} />}
                </button>
              </td>
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="p-4 font-medium text-white">Currency Symbol</td>
              <td className="p-4 text-[var(--color-on-surface)]/80 font-mono">STT</td>
              <td className="p-4 text-center">
                <button
                  onClick={() => copyToClipboard('STT', 'symbol')}
                  className="p-1 hover:text-white text-[var(--color-on-surface)]/50 rounded transition-colors"
                >
                  {copiedText === 'symbol' ? <Check size={14} className="text-[var(--color-success)]" /> : <Copy size={14} />}
                </button>
              </td>
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="p-4 font-medium text-white">Block Explorer URL</td>
              <td className="p-4 text-[var(--color-on-surface)]/80 font-mono">https://shannon.somnia.network</td>
              <td className="p-4 text-center">
                <button
                  onClick={() => copyToClipboard('https://shannon.somnia.network', 'explorer')}
                  className="p-1 hover:text-white text-[var(--color-on-surface)]/50 rounded transition-colors"
                >
                  {copiedText === 'explorer' ? <Check size={14} className="text-[var(--color-success)]" /> : <Copy size={14} />}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        2. Get Testnet STT (Faucet)
      </h2>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-4 leading-relaxed text-sm sm:text-base">
        STT is the native utility token of the Somnia L1. You will need STT for gas fees and to buy shares in the SovereignMind Portfolio.
      </p>
      
      {/* Faucet Callout */}
      <div className="glass-dark bg-white/5 border border-white/10 rounded-xl p-5 mb-6 flex gap-4">
        <Info className="text-[var(--color-primary)] shrink-0 mt-1" size={20} />
        <div>
          <h4 className="font-display-lg font-semibold text-white text-sm md:text-base mb-1">Acquiring STT Test Tokens</h4>
          <p className="text-[var(--color-on-surface)]/60 font-body-md text-xs sm:text-sm leading-relaxed mb-3">
            Visit the official Somnia Faucet page to claim testnet STT tokens to your address:
          </p>
          <a
            href="https://docs.somnia.network"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] hover:text-white border border-[var(--color-primary)]/30 font-label-caps tracking-wider text-[11px] px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(207,188,255,0.05)]"
          >
            Go to Somnia Faucet <ArrowRight size={12} />
          </a>
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        3. Connect to SovereignMind
      </h2>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-6 leading-relaxed text-sm sm:text-base">
        Once your wallet is configured and funded with testnet STT, go to the SovereignMind dashboard and click the <strong className="text-white">Connect Wallet</strong> button in the top right header. Once connected, your wallet will automatically sync, showing your STT balance and portfolio shares.
      </p>

      {/* Navigation Buttons */}
      <div className="border-t border-white/10 pt-6 flex justify-between">
        <Link
          href="/docs/getting-started"
          className="flex items-center gap-2 text-[var(--color-on-surface)]/60 hover:text-white font-label-caps text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors"
        >
          <ArrowLeft size={16} /> Previous: Getting Started
        </Link>
        <Link
          href="/docs/dashboard"
          className="flex items-center gap-2 text-[var(--color-primary)] hover:text-white font-label-caps text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors"
        >
          Next: Navigating the Dashboard <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
