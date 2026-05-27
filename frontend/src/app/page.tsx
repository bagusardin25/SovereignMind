'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Terminal, Network, ShieldAlert, Cpu } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-[#e2e8f0] relative overflow-hidden flex flex-col font-sans">
      {/* Deep Space Noise & Grid */}
      <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none mix-blend-overlay z-10" />
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      {/* Extreme Radial Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--color-agent-ceo)] opacity-[0.05] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--color-agent-cfo)] opacity-[0.05] blur-[150px] pointer-events-none" />
      
      {/* Navbar Minimalist */}
      <header className="relative z-20 p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/10 p-0.5 backdrop-blur-md">
            <div className="w-full h-full bg-black/80 flex items-center justify-center">
               <Cpu size={20} className="text-[var(--color-agent-ceo)]" />
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-mono uppercase tracking-widest">SOVMIND<span className="text-[var(--color-agent-ceo)]">_</span></span>
        </div>
        <Link 
          href="/dashboard"
          className="group flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 hover:border-[var(--color-agent-ceo)] hover:bg-[var(--color-agent-ceo)]/10 transition-all text-xs font-mono text-white rounded-sm backdrop-blur-sm"
        >
          <span className="text-[var(--color-agent-ceo)]">_</span>ENTER_APP
        </Link>
      </header>

      {/* Hero Section */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-start pt-16 md:pt-24 p-6 text-center max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center w-full"
        >
          {/* Main Typography */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-mono text-[var(--color-agent-cmo)]">
            <span className="w-2 h-2 rounded-full bg-[var(--color-agent-cmo)] animate-pulse" />
            100% ON-CHAIN AI EXECUTION
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 text-white leading-[1.1] uppercase">
            Autonomous <br className="hidden md:block" /> 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-agent-ceo)] via-[var(--color-agent-cfo)] to-[var(--color-agent-cmo)]">
              Treasury
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-[var(--color-muted-foreground)] max-w-2xl mb-12 leading-relaxed">
            A decentralized neural syndicate operating on Somnia L1. No human governance bottlenecks. Verifiable BFT consensus.
          </p>

          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative px-8 py-4 font-mono font-bold text-white text-sm flex items-center gap-3 bg-black border border-white/20 hover:border-[var(--color-agent-ceo)] transition-colors group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-agent-ceo)]/20 to-[var(--color-agent-cfo)]/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
              <Terminal size={18} className="relative z-10 text-[var(--color-agent-ceo)]" />
              <span className="relative z-10">{'>'} ./launch_dashboard.sh</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Bento Box Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-24 w-full text-left"
        >
          {/* Main Big Card: Code Snippet */}
          <div className="md:col-span-8 bg-[#050505] border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-agent-ceo)] to-transparent opacity-50" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-mono text-white/50">ceo_agent.sol</h3>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              </div>
            </div>
            <pre className="font-mono text-xs md:text-sm text-[var(--color-agent-ceo-light)] leading-loose overflow-x-auto">
              <code className="text-white/40">1 |</code> <span className="text-purple-400">function</span> <span className="text-blue-400">createRequest</span>(bytes calldata data) external {'{\n'}
              <code className="text-white/40">2 |</code>     require(msg.sender == owner, <span className="text-green-400">"Unauthorized"</span>);{'\n'}
              <code className="text-white/40">3 |</code>     uint256 reqId = somnia.submit(data);{'\n'}
              <code className="text-white/40">4 |</code>     <span className="text-purple-400">emit</span> ExecutionInitiated(reqId, block.timestamp);{'\n'}
              <code className="text-white/40">5 |</code> {'}'}
            </pre>
          </div>

          {/* Side Card 1: Console Animation */}
          <div className="md:col-span-4 bg-[#050505] border border-white/10 rounded-xl p-6 flex flex-col justify-end group hover:border-[var(--color-agent-cfo)]/50 transition-colors">
            <Network className="text-[var(--color-agent-cfo)] mb-auto opacity-50 group-hover:opacity-100 transition-opacity" size={24} />
            <div className="mt-8">
              <h3 className="text-lg font-bold text-white mb-1">BFT Consensus</h3>
              <p className="font-mono text-xs text-[var(--color-agent-cfo)] typewriter-text inline-block">
                Verifying signature... OK
              </p>
            </div>
          </div>

          {/* Side Card 2: AI Logic */}
          <div className="md:col-span-4 bg-[#050505] border border-white/10 rounded-xl p-6 group hover:border-[var(--color-agent-cmo)]/50 transition-colors">
            <Cpu className="text-[var(--color-agent-cmo)] mb-4 opacity-50 group-hover:opacity-100 transition-opacity" size={24} />
            <h3 className="text-lg font-bold text-white mb-2">Neural Sentiment</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              LLMs analyze off-chain market sentiment via Oracles, bridging real-world events into deterministic smart contract triggers.
            </p>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-agent-cmo)] w-[75%] shadow-[0_0_10px_var(--color-agent-cmo)]" />
            </div>
          </div>

          {/* Wide Bottom Card */}
          <div className="md:col-span-8 bg-[#050505] border border-white/10 rounded-xl p-6 relative overflow-hidden flex items-center justify-between group hover:border-white/20 transition-colors">
            <div className="relative z-10">
              <ShieldAlert className="text-[var(--color-agent-ceo)] mb-4 opacity-50 group-hover:opacity-100 transition-opacity" size={24} />
              <h3 className="text-lg font-bold text-white mb-1">Eliminate SPOF</h3>
              <p className="text-white/60 text-sm">
                No single human controls the treasury keys. 
              </p>
            </div>
            
            <div className="relative w-32 h-32 opacity-20 group-hover:opacity-80 transition-opacity duration-500">
               <Image 
                src="/logo.png"
                alt="SovereignMind"
                fill
                className="object-contain drop-shadow-2xl"
              />
            </div>
          </div>

        </motion.div>
      </main>
      
      {/* Footer */}
      <footer className="relative z-20 py-8 text-center text-xs font-mono text-white/30 border-t border-white/5 mt-auto">
        BUILT FOR SOMNIA AGENTATHON 2026 // L1 INTELLIGENCE
      </footer>
    </div>
  );
}
