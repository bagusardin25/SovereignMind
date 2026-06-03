'use client';

import Link from 'next/link';
import { ArrowRight, ArrowLeft, Cpu, Terminal } from 'lucide-react';

export default function AgentsDoc() {
  return (
    <div className="max-w-4xl">
      {/* Page Header */}
      <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold mb-2 block">
        Guide — 04
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
        Autonomous AI Agents
      </h1>
      <p className="text-slate-400 text-base sm:text-lg mb-8 leading-relaxed font-light">
        SovereignMind uses three distinct Solidity-implemented agents executing deterministic on-chain inferences. These agents coordinate as a virtual executive suite on the Somnia L1.
      </p>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mt-10 mb-4 border-b border-slate-800/80 pb-2">
        Executive Agent Profiles
      </h2>
      <p className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base">
        Each agent behaves autonomously based on its role and coordinates with the other contracts during the rebalancing loop:
      </p>

      <div className="space-y-6 mb-8">
        {/* CEO Agent */}
        <div className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <h3 className="text-lg font-semibold text-white">CEO Agent (CEO_Prime)</h3>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            Acts as the main orchestrator. It manages the state machine transitions (Idle, Analyzing, Executing) of the decision cycle. Once tasks are initiated, it uses a Solidity interface to make an LLM Inference request to compile and synthesize risk scores from the CFO and sentiment metrics from the CMO, signing off the final on-chain consensus rebalance recommendation.
          </p>
          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-850">
            <span className="text-xs font-mono text-purple-400 font-semibold uppercase block mb-1">Somnia Native Primitives Used</span>
            <code className="text-xs text-slate-300 font-mono">LLM Inference Agent</code>
          </div>
        </div>

        {/* CFO Agent */}
        <div className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h3 className="text-lg font-semibold text-white">CFO Agent (CFO_Quant)</h3>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            Manages the guild's financial risk parameters. When triggered, it requests live market statistics for the target assets using the JSON API request oracle. The results are fed into the on-chain LLM model along with the current portfolio allocations, generating a risk score (0 to 100) and recommendation logic.
          </p>
          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-850">
            <span className="text-xs font-mono text-purple-400 font-semibold uppercase block mb-1">Somnia Native Primitives Used</span>
            <code className="text-xs text-slate-300 font-mono">JSON API Request Agent + LLM Inference Agent</code>
          </div>
        </div>

        {/* CMO Agent */}
        <div className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <h3 className="text-lg font-semibold text-white">CMO Agent (CMO_Pulse)</h3>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            Scans social indicators and sentiment trends. When requested, it queries web scraping APIs to parse unstructured content (social feeds, DeFi updates). The parser feeds these text metrics into an LLM classifier to determine if aggregate market sentiments are Bullish, Bearish, or Neutral.
          </p>
          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-850">
            <span className="text-xs font-mono text-purple-400 font-semibold uppercase block mb-1">Somnia Native Primitives Used</span>
            <code className="text-xs text-slate-300 font-mono">LLM Parse Website Agent + LLM Inference Agent</code>
          </div>
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mt-10 mb-4 border-b border-slate-800/80 pb-2">
        Under the Hood: Somnia Agent Runner
      </h2>
      <p className="text-slate-300 mb-4 leading-relaxed text-sm sm:text-base">
        Traditional blockchains cannot run heavy computation models like Large Language Models (LLMs) due to gas constraints. Somnia solves this with its **Somnia Agent Runner**, a specialized native primitive executed on validator nodes.
      </p>
      
      {/* Code / Config Box */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 font-mono text-xs md:text-sm text-purple-200 overflow-x-auto my-6">
        <div className="text-slate-500 mb-2">// On-Chain Agent request logic inside CEOAgent.sol</div>
        <span className="text-purple-400">function</span> <span className="text-blue-300">requestInference</span>(string memory prompt) <span className="text-purple-400">internal</span> &#123;
        <br />
        &nbsp;&nbsp;bytes memory payload = abi.encodeWithSignature(<span className="text-amber-300">&quot;infer(string)&quot;</span>, prompt);
        <br />
        &nbsp;&nbsp;agentRunner.createRequest(payload, this.handleResponse);
        <br />
        &#125;
      </div>

      <p className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base">
        Every request made via <code className="text-purple-300">createRequest</code> processes off-chain via validators but is verified using Somnia's **BFT (Byzantine Fault Tolerance) consensus mechanism**. By utilizing pinned model weights and synchronized random seeds, all validators arrive at the exact same deterministic LLM output, producing a verifiable **On-Chain Execution Receipt**.
      </p>

      {/* Navigation Buttons */}
      <div className="border-t border-slate-800/60 pt-6 flex justify-between">
        <Link
          href="/docs/dashboard"
          className="flex items-center gap-2 text-slate-400 hover:text-slate-300 text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} /> Previous: Navigating the Dashboard
        </Link>
        <Link
          href="/docs/portfolio"
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors"
        >
          Next: Portfolio & Investments <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
