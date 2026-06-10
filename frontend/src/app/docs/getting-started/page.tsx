'use client';

import Link from 'next/link';
import { ArrowRight, Brain, Shield, Zap } from 'lucide-react';

export default function GettingStartedDoc() {
  return (
    <div className="max-w-4xl">
      {/* Page Header */}
      <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold mb-2 block">
        Guide — 01
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
        Getting Started with SovereignMind
      </h1>
      <p className="text-slate-400 text-base sm:text-lg mb-8 leading-relaxed font-light">
        Welcome to SovereignMind, an on-chain Venture Guild powered by autonomous AI agents on the Somnia Agentic L1. This guide covers the fundamental concepts, core architecture, and the agent loop that runs the platform.
      </p>

      {/* Info Callout */}
      <div className="bg-purple-950/20 border border-purple-500/20 rounded-2xl p-5 mb-8 flex gap-4">
        <Zap className="text-purple-400 shrink-0 mt-1" size={20} />
        <div>
          <h4 className="font-semibold text-purple-200 text-sm mb-1">What is an Autonomous Venture Guild?</h4>
          <p className="text-slate-300 text-sm leading-relaxed">
            Unlike traditional DAOs that rely on slow, human-governed voting processes, SovereignMind operates autonomously. It uses Solidity smart contracts coupled with Somnia&apos;s native on-chain AI models to analyze markets, score risk, manage treasury funds, and execute rebalances entirely programmatically.
          </p>
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mt-10 mb-4 border-b border-slate-800/80 pb-2">
        Core Philosophy
      </h2>
      <p className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base">
        SovereignMind is built on the belief that decentralized finance can be optimized using autonomous on-chain agents. By leveraging the low latency, high throughput, and native agent primitives of the Somnia L1 network, SovereignMind achieves:
      </p>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-xl">
          <Brain className="text-purple-400 mb-3" size={24} />
          <h3 className="font-semibold text-white text-sm mb-1">On-Chain Intelligence</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            All decision-making models execute directly on-chain through Somnia&apos;s validator network, ensuring trustless execution.
          </p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-xl">
          <Shield className="text-purple-400 mb-3" size={24} />
          <h3 className="font-semibold text-white text-sm mb-1">Full Auditability</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Every inference cycle generates a consensus-verified receipt, making the logic behind every treasury reallocation auditable.
          </p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-xl">
          <Zap className="text-purple-400 mb-3" size={24} />
          <h3 className="font-semibold text-white text-sm mb-1">Autonomous Execution</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Contracts manage asset swaps, rebalancing actions, and portfolio weight adjustments dynamically.
          </p>
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mt-10 mb-4 border-b border-slate-800/80 pb-2">
        The Autonomous Decision Loop
      </h2>
      <p className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base">
        The system executes decision cycles periodically (automated via an orchestrator backend, but callable permissionlessly on-chain by anyone once the cooldown timer elapses). Each cycle consists of the following phases:
      </p>

      {/* Flow Steps Visualizer */}
      <div className="space-y-4 mb-10">
        <div className="flex gap-4 items-start bg-slate-900/20 border border-slate-800/40 p-4 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-mono text-purple-300 font-bold shrink-0 text-sm">
            1
          </div>
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-1">Trigger & Cycle Initialization</h4>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              The cycle starts. The CEO Agent updates the registry and prepares to delegate tasks to the CFO and CMO contracts.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start bg-slate-900/20 border border-slate-800/40 p-4 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-mono text-purple-300 font-bold shrink-0 text-sm">
            2
          </div>
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-1">Parallel Market Analysis</h4>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              The CFO Agent fetches live price feeds and calculates risk scores. The CMO Agent parses target web resources to determine aggregate sentiment.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start bg-slate-900/20 border border-slate-800/40 p-4 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-mono text-purple-300 font-bold shrink-0 text-sm">
            3
          </div>
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-1">Inference & Consensus</h4>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              The CEO Agent synthesizes CFO risks and CMO sentiment reports, generates a deterministic recommendation on-chain, and queries the Somnia Agent Runner for confirmation.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start bg-slate-900/20 border border-slate-800/40 p-4 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-mono text-purple-300 font-bold shrink-0 text-sm">
            4
          </div>
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-1">Treasury Execution</h4>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              If a rebalance or asset allocation decision is approved, the Treasury Vault executes the trades automatically, logging the receipt.
            </p>
          </div>
        </div>
      </div>

      {/* Next Step Link */}
      <div className="border-t border-slate-800/60 pt-6 flex justify-end">
        <Link
          href="/docs/wallet-setup"
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors"
        >
          Next: Wallet Setup & Network Config <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
