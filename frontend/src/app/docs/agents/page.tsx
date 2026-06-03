'use client';

import Link from 'next/link';
import { ArrowRight, ArrowLeft, Cpu, Terminal } from 'lucide-react';

export default function AgentsDoc() {
  return (
    <div className="max-w-4xl">
      {/* Page Header */}
      <span className="text-[11px] font-label-caps uppercase tracking-wider text-[var(--color-primary)] font-bold mb-2 block">
        Guide — 04
      </span>
      <h1 className="text-3xl sm:text-4xl font-display-lg font-bold tracking-tight text-white mb-4">
        Autonomous AI Agents
      </h1>
      <p className="text-[var(--color-on-surface)]/80 font-body-md text-base sm:text-lg mb-8 leading-relaxed font-light">
        SovereignMind uses three distinct Solidity-implemented agents executing deterministic on-chain inferences. These agents coordinate as a virtual executive suite on the Somnia L1.
      </p>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        Executive Agent Profiles
      </h2>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-6 leading-relaxed text-sm sm:text-base">
        Each agent behaves autonomously based on its role and coordinates with the other contracts during the rebalancing loop:
      </p>

      <div className="space-y-6 mb-8">
        {/* CEO Agent */}
        <div className="glass-dark bg-white/5 border border-white/10 p-6 rounded-xl hover:border-[var(--color-agent-ceo)]/30 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-agent-ceo)] animate-pulse" />
            <h3 className="text-lg font-display-lg font-semibold text-white">CEO Agent (CEO_Prime)</h3>
          </div>
          <p className="text-[var(--color-on-surface)]/80 font-body-md text-sm leading-relaxed mb-4">
            Acts as the main orchestrator. It manages the state machine transitions (Idle, Analyzing, Executing) of the decision cycle. Once tasks are initiated, it uses a Solidity interface to make an LLM Inference request to compile and synthesize risk scores from the CFO and sentiment metrics from the CMO, signing off the final on-chain consensus rebalance recommendation.
          </p>
          <div className="bg-black/20 p-3 rounded-lg border border-white/5">
            <span className="text-[10px] font-label-caps text-[var(--color-agent-ceo)] font-semibold tracking-wider uppercase block mb-1">Somnia Native Primitives Used</span>
            <code className="text-xs text-[var(--color-on-surface)]/70 font-mono">LLM Inference Agent</code>
          </div>
        </div>

        {/* CFO Agent */}
        <div className="glass-dark bg-white/5 border border-white/10 p-6 rounded-xl hover:border-[var(--color-agent-cfo)]/30 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-agent-cfo)] animate-pulse" style={{ animationDelay: '0.5s' }} />
            <h3 className="text-lg font-display-lg font-semibold text-white">CFO Agent (CFO_Quant)</h3>
          </div>
          <p className="text-[var(--color-on-surface)]/80 font-body-md text-sm leading-relaxed mb-4">
            Manages the guild's financial risk parameters. When triggered, it requests live market statistics for the target assets using the JSON API request oracle. The results are fed into the on-chain LLM model along with the current portfolio allocations, generating a risk score (0 to 100) and recommendation logic.
          </p>
          <div className="bg-black/20 p-3 rounded-lg border border-white/5">
            <span className="text-[10px] font-label-caps text-[var(--color-agent-cfo)] font-semibold tracking-wider uppercase block mb-1">Somnia Native Primitives Used</span>
            <code className="text-xs text-[var(--color-on-surface)]/70 font-mono">JSON API Request Agent + LLM Inference Agent</code>
          </div>
        </div>

        {/* CMO Agent */}
        <div className="glass-dark bg-white/5 border border-white/10 p-6 rounded-xl hover:border-[var(--color-agent-cmo)]/30 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-agent-cmo)] animate-pulse" style={{ animationDelay: '1s' }} />
            <h3 className="text-lg font-display-lg font-semibold text-white">CMO Agent (CMO_Pulse)</h3>
          </div>
          <p className="text-[var(--color-on-surface)]/80 font-body-md text-sm leading-relaxed mb-4">
            Scans social indicators and sentiment trends. When requested, it queries web scraping APIs to parse unstructured content (social feeds, DeFi updates). The parser feeds these text metrics into an LLM classifier to determine if aggregate market sentiments are Bullish, Bearish, or Neutral.
          </p>
          <div className="bg-black/20 p-3 rounded-lg border border-white/5">
            <span className="text-[10px] font-label-caps text-[var(--color-agent-cmo)] font-semibold tracking-wider uppercase block mb-1">Somnia Native Primitives Used</span>
            <code className="text-xs text-[var(--color-on-surface)]/70 font-mono">LLM Parse Website Agent + LLM Inference Agent</code>
          </div>
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-display-lg font-semibold text-white mt-10 mb-4 border-b border-white/10 pb-2">
        Under the Hood: Somnia Agent Runner
      </h2>
      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-4 leading-relaxed text-sm sm:text-base">
        Traditional blockchains cannot run heavy computation models like Large Language Models (LLMs) due to gas constraints. Somnia solves this with its <strong className="text-white">Somnia Agent Runner</strong>, a specialized native primitive executed on validator nodes.
      </p>
      
      {/* Code / Config Box */}
      <div className="glass-dark bg-black/40 border border-white/10 rounded-xl p-5 font-mono text-xs md:text-sm text-[var(--color-primary-container)] overflow-x-auto my-6 shadow-inner">
        <div className="text-[var(--color-on-surface)]/40 mb-3">// On-Chain Agent request logic inside CEOAgent.sol</div>
        <span className="text-[var(--color-primary)]">function</span> <span className="text-[var(--color-secondary)]">requestInference</span>(string memory prompt) <span className="text-[var(--color-primary)]">internal</span> &#123;
        <br />
        &nbsp;&nbsp;bytes memory payload = abi.encodeWithSignature(<span className="text-[var(--color-tertiary)]">&quot;infer(string)&quot;</span>, prompt);
        <br />
        &nbsp;&nbsp;agentRunner.createRequest(payload, this.handleResponse);
        <br />
        &#125;
      </div>

      <p className="text-[var(--color-on-surface)]/80 font-body-md mb-6 leading-relaxed text-sm sm:text-base">
        Every request made via <code className="text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-1 py-0.5 rounded">createRequest</code> processes off-chain via validators but is verified using Somnia's <strong className="text-white">BFT (Byzantine Fault Tolerance) consensus mechanism</strong>. By utilizing pinned model weights and synchronized random seeds, all validators arrive at the exact same deterministic LLM output, producing a verifiable <strong className="text-[var(--color-primary)]">On-Chain Execution Receipt</strong>.
      </p>

      {/* Navigation Buttons */}
      <div className="border-t border-white/10 pt-6 flex justify-between">
        <Link
          href="/docs/dashboard"
          className="flex items-center gap-2 text-[var(--color-on-surface)]/60 hover:text-white font-label-caps text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors"
        >
          <ArrowLeft size={16} /> Previous: Navigating the Dashboard
        </Link>
        <Link
          href="/docs/portfolio"
          className="flex items-center gap-2 text-[var(--color-primary)] hover:text-white font-label-caps text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors"
        >
          Next: Portfolio & Investments <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
