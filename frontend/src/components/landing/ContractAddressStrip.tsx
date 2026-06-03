'use client';

// ============================================================
// SovereignMind — Contract Address Strip
// Shows deployed contract addresses with copy + explorer links.
// Trust signal #1 for Web3-native audiences.
// ============================================================

import { useState } from 'react';
import { Check, Copy, ExternalLink, FileCode2 } from 'lucide-react';
import { CONTRACT_ADDRESSES, SOMNIA_TESTNET, truncateAddress } from '@/lib/constants';

type ContractEntry = {
  key: keyof typeof CONTRACT_ADDRESSES;
  label: string;
  description: string;
};

const CONTRACTS: ContractEntry[] = [
  { key: 'agentRegistry', label: 'AgentRegistry', description: 'Role-based access control' },
  { key: 'ceoAgent', label: 'CEO_Prime', description: 'Strategic orchestrator' },
  { key: 'cfoAgent', label: 'CFO_Quant', description: 'Risk & treasury executor' },
  { key: 'cmoAgent', label: 'CMO_Pulse', description: 'Market sentiment analyst' },
  { key: 'treasuryVault', label: 'TreasuryVault', description: 'Asset custody & rebalancing' },
];

const explorerBase = SOMNIA_TESTNET.blockExplorers.default.url;

export default function ContractAddressStrip() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (key: string, address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    } catch {
      // Clipboard API unavailable — fail silently.
    }
  };

  return (
    <section className="py-[var(--spacing-section-gap)] px-[var(--spacing-margin-page)] relative z-10 container mx-auto max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 border-b border-[var(--color-on-surface)]/10 pb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center flex-shrink-0">
            <FileCode2 size={22} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-[var(--color-primary)] mb-2">
              ON-CHAIN CONTRACTS
            </p>
            <h2 className="font-display-lg text-[36px] md:text-[48px] leading-none text-white mb-3">
              Verifiable. Permissionless. Public.
            </h2>
            <p className="font-body-md text-[14px] text-white/50 max-w-xl leading-relaxed">
              Every contract is deployed on Somnia Testnet and inspectable on the block explorer. Audit
              the source. Watch the events. Trust the math.
            </p>
          </div>
        </div>

        <a
          href={explorerBase}
          target="_blank"
          rel="noopener noreferrer"
          className="font-label-caps text-label-caps text-white/70 hover:text-white inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-white/30 transition-colors"
        >
          Shannon Explorer
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {CONTRACTS.map((c) => {
          const address = CONTRACT_ADDRESSES[c.key];
          const isCopied = copiedKey === c.key;
          return (
            <div
              key={c.key}
              className="group glass-dark rounded-xl px-4 py-3 flex items-center justify-between gap-3 hover:border-[var(--color-primary)]/30 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display-lg text-[14px] text-white">{c.label}</span>
                  <span className="font-label-caps text-[9px] tracking-widest text-white/30 uppercase">
                    .sol
                  </span>
                </div>
                <code className="font-mono text-[12px] text-white/50 truncate block">
                  {truncateAddress(address)}
                </code>
                <p className="font-body-md text-[11px] text-white/30 mt-0.5 truncate">
                  {c.description}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(c.key, address)}
                  aria-label={`Copy ${c.label} address`}
                  className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-colors"
                >
                  {isCopied ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} className="text-white/60" />
                  )}
                </button>
                <a
                  href={`${explorerBase}/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${c.label} on explorer`}
                  className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-[var(--color-primary)]/15 border border-white/10 hover:border-[var(--color-primary)]/40 flex items-center justify-center transition-colors"
                >
                  <ExternalLink size={14} className="text-white/60 group-hover:text-[var(--color-primary)]" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <p className="font-body-md text-[12px] text-white/30 mt-6 text-center">
        Deployed on Somnia Testnet (Chain ID: {SOMNIA_TESTNET.id}) —{' '}
        <a
          href="https://github.com/bagusardin25/SovereignMind/blob/main/contracts/deployed-addresses.json"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white/50"
        >
          verify deployment record
        </a>
        .
      </p>
    </section>
  );
}
