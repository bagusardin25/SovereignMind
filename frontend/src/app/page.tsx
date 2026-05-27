'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Spline from '@splinetool/react-spline';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  ChevronDown,
  ArrowUpRight,
  Brain,
  TrendingUp,
  Radar,
  Rocket,
  BarChart3,
  Network,
  ShieldCheck,
  Trophy,
  FileCode2,
} from 'lucide-react';
import ChainBadge from '@/components/landing/ChainBadge';
import LiveStatsGrid from '@/components/landing/LiveStatsGrid';
import ContractAddressStrip from '@/components/landing/ContractAddressStrip';
import { CONTRACT_ADDRESSES, SOMNIA_TESTNET } from '@/lib/constants';

const faqs = [
  {
    q: "What is SovereignMind?",
    a: "SovereignMind is an autonomous on-chain Venture Guild powered by AI Executive Agents operating entirely on Somnia Agentic L1. Three specialized agents — CEO, CFO, and CMO — are implemented as Solidity smart contracts leveraging Somnia's native agent primitives."
  },
  {
    q: "How do the AI agents make decisions?",
    a: "Our architecture relies on three core agents (CEO_Prime, CFO_Quant, CMO_Pulse). They utilize Somnia's native deterministic LLM Inference, JSON API Request, and LLM Parse Website capabilities to fetch live data, assess risks, analyze market sentiment, and reach algorithmic consensus — all on-chain."
  },
  {
    q: "Can humans intervene in the treasury management?",
    a: "No, the treasury and protocol owned liquidity are managed completely autonomously. The CFO_Quant agent uses real-time market data via Somnia JSON API Request Agent to execute on-chain rebalancing without human intervention."
  },
  {
    q: "What are on-chain execution receipts?",
    a: "Every algorithmic decision produces a verifiable on-chain execution receipt via Somnia's BFT consensus mechanism. This makes every treasury operation fully transparent and publicly auditable — no off-chain servers or external dependencies."
  },
  {
    q: "Where can I track the agent decisions?",
    a: "You can track all activities, view agent logs, monitor treasury allocations, and inspect execution receipts directly from our Live Console Dashboard. Every receipt is also verifiable on the Somnia Block Explorer."
  }
];

export default function LandingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isSplineLoaded, setIsSplineLoaded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { scrollYProgress } = useScroll();
  const yParallaxText = useTransform(scrollYProgress, [0, 1], [0, 400]);

  return (
    <>
      {/* TopNavBar */}
      <nav className={`fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-[var(--spacing-margin-page)] transition-all duration-300 ${isScrolled ? 'py-3 md:py-4 bg-[#0f141b]/90 backdrop-blur-md border-b border-white/10 shadow-lg' : 'py-5 md:py-6 bg-transparent border-b border-transparent'}`}>
        
        {/* Left Section (Logo on Mobile, Links on Desktop) */}
        <div className="flex items-center gap-2 md:gap-8 flex-1 md:flex-none md:w-1/3 min-w-0">
          {/* Mobile Logo (hidden on desktop) */}
          <Link href="/" className="md:hidden font-display-lg text-[18px] sm:text-[20px] tracking-tight flex items-center min-w-0">
            <span className="text-white font-bold truncate">Sovereign</span>
            <span className="text-white/50 font-light truncate">Mind</span>
          </Link>

          {/* Desktop Platform Button */}
          <Link href="/dashboard" className="hidden md:inline-block bg-[var(--color-primary)] text-[var(--color-on-primary)] font-label-caps text-[12px] px-6 py-2 rounded-full hover:opacity-90 transition-all shadow-[0_0_15px_rgba(207,188,255,0.4)] whitespace-nowrap">
            Platform +
          </Link>
          
          {/* Desktop Nav Links */}
          <div className="hidden md:flex gap-6 font-body-md text-[13px] text-[var(--color-on-surface)]/60">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#about" className="hover:text-white transition-colors">About</Link>
            <Link href="#faqs" className="hover:text-white transition-colors">FAQs</Link>
          </div>
        </div>

        {/* Center Logo (Desktop Only) */}
        <div className="hidden md:flex justify-center w-1/3 min-w-0">
          <Link href="/" className="font-display-lg text-[28px] tracking-tight flex items-center">
            <span className="text-white font-bold">Sovereign</span>
            <span className="text-white/50 font-light">Mind</span>
          </Link>
        </div>

        {/* Right Links */}
        <div className="flex justify-end items-center gap-2 md:gap-4 font-body-md text-[13px] text-[var(--color-on-surface)]/80 md:w-1/3 min-w-0">
          <Link
            href="https://docs.somnia.network"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline hover:text-white transition-colors font-medium"
          >
            Docs
          </Link>
          <Link
            href="https://github.com/bagusardin25/SovereignMind"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline hover:text-white transition-colors font-medium"
          >
            GitHub
          </Link>
          <ChainBadge className="hidden lg:inline-flex" />
          <ConnectButton
            accountStatus={{ smallScreen: 'avatar', largeScreen: 'address' }}
            chainStatus="none"
            showBalance={false}
            label="Connect"
          />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full h-screen min-h-[850px] bg-[var(--color-background)] flex items-center justify-center">
        {/* Background gradient glow behind image */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-gradient-to-tr from-[var(--color-primary)]/20 to-[var(--color-tertiary)]/20 rounded-full blur-[100px] z-0"></div>

        {/* Giant Background Text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-full text-center z-0 select-none pointer-events-none flex flex-col items-center justify-center">
          <motion.h1 
            style={{ y: yParallaxText }}
            className="font-[var(--font-space-grotesk)] text-[80px] md:text-[140px] lg:text-[200px] leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/40 to-transparent uppercase font-bold"
          >
            SOVEREIGN
            <span className="block text-[80px] md:text-[140px] lg:text-[200px] leading-none tracking-[0.1em] md:tracking-[0.2em] text-transparent uppercase mt-[-2%]" style={{ WebkitTextStroke: '1.5px rgba(207,188,255,0.3)' }}>
              MIND
            </span>
          </motion.h1>
        </div>

        {/* Center Content Wrapper */}
        <div className="container mx-auto px-6 relative z-10 w-full h-full flex items-center justify-between pointer-events-none">
          
          {/* Left Side Content */}
          <div className="hidden md:flex flex-col items-start justify-center w-1/4 pt-20 pointer-events-auto">
            <p className="font-body-md text-[16px] text-[var(--color-on-surface)]/70 mb-8 leading-relaxed relative pl-4 border-l border-[var(--color-primary)]/50">
              The first fully on-chain autonomous Venture Guild powered by Somnia Agentic L1 native primitives.
            </p>
            <Link href="/dashboard" className="w-full relative group block">
              {/* Animated glow ring behind the button */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500 group-hover:duration-200 animate-pulse"></div>
              <button className="relative w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] font-label-caps text-[14px] px-8 py-4 rounded-xl hover:scale-[1.02] transition-all duration-300 shadow-[0_0_20px_rgba(207,188,255,0.3)] hover:shadow-[0_0_40px_rgba(207,188,255,0.6)] flex justify-between items-center group-hover:bg-[#d8c8ff]">
                <span className="font-bold tracking-widest z-10">ENTER DASHBOARD</span>
                <div className="w-8 h-8 rounded-full bg-[var(--color-on-primary)]/10 flex items-center justify-center group-hover:bg-[var(--color-on-primary)]/20 group-hover:rotate-45 transition-all duration-300 z-10">
                  <ArrowUpRight size={16} />
                </div>
              </button>
            </Link>
            <a
              href={`${SOMNIA_TESTNET.blockExplorers.default.url}/address/${CONTRACT_ADDRESSES.agentRegistry}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-3 group"
            >
              <button className="w-full bg-transparent border border-white/15 hover:border-white/40 text-white/80 hover:text-white font-label-caps text-[12px] px-8 py-3 rounded-xl transition-all flex justify-between items-center">
                <span className="inline-flex items-center gap-2">
                  <FileCode2 size={14} className="text-[var(--color-primary)]" />
                  VIEW CONTRACT
                </span>
                <ArrowUpRight
                  size={14}
                  className="text-white/50 group-hover:text-white transition-colors"
                />
              </button>
            </a>
          </div>

          {/* Central 3D Scene */}
          <div className={`absolute inset-0 z-[5] pointer-events-auto flex items-center justify-center transition-opacity duration-1000 ease-in-out ${isSplineLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-full h-full scale-[0.6] -translate-y-16 md:scale-100 md:translate-y-0 transition-transform duration-700 origin-center">
              <Spline
                scene="https://prod.spline.design/E8nQAOG1DhoU-x4w/scene.splinecode"
                className="w-full h-full"
                onLoad={() => setIsSplineLoaded(true)}
              />
            </div>
          </div>

          {/* Right Side Content */}
          <div className="hidden md:flex flex-col justify-between items-end w-1/4 h-full py-32 pointer-events-auto">

            {/* Top Right: Live Stats */}
            <LiveStatsGrid />

            {/* Bottom Right: Agent Pills */}
            <div className="flex flex-col items-end gap-4 mt-auto pt-16 mb-20">
              <div className="group border border-white/10 rounded-full px-6 py-2.5 text-[12px] font-body-md text-white/50 hover:bg-[var(--color-agent-ceo)]/10 hover:text-[var(--color-agent-ceo)] hover:border-[var(--color-agent-ceo)]/50 transition-all duration-300 cursor-pointer backdrop-blur-sm mr-16 shadow-lg shadow-black hover:-translate-x-2">
                CEO_Prime
              </div>
              <div className="group border border-white/10 rounded-full px-6 py-2.5 text-[12px] font-body-md text-white/50 hover:bg-[var(--color-agent-cfo)]/10 hover:text-[var(--color-agent-cfo)] hover:border-[var(--color-agent-cfo)]/50 transition-all duration-300 cursor-pointer backdrop-blur-sm mr-8 shadow-lg shadow-black hover:-translate-x-2">
                CFO_Quant
              </div>
              <div className="group border border-white/10 rounded-full px-6 py-2.5 text-[12px] font-body-md text-white/50 hover:bg-[var(--color-agent-cmo)]/10 hover:text-[var(--color-agent-cmo)] hover:border-[var(--color-agent-cmo)]/50 transition-all duration-300 cursor-pointer backdrop-blur-sm shadow-lg shadow-black hover:-translate-x-2">
                CMO_Pulse
              </div>
            </div>

          </div>
        </div>

        {/* Mobile-only Content blocks */}
        <div className="md:hidden absolute bottom-28 left-0 w-full px-5 flex flex-col gap-6 z-20 pointer-events-auto">
          {/* Top section: Title and Badges */}
          <div className="flex justify-between items-end w-full">
            <div className="flex flex-col items-start max-w-[60%] gap-3">
               <ChainBadge />
               <div>
                 <h2 className="font-display-lg text-[28px] text-white leading-none mb-1">3 AI Agents</h2>
                 <p className="font-body-md text-[12px] text-white/60 leading-relaxed">
                   Autonomous Venture Guild on Somnia L1.
                 </p>
               </div>
            </div>
            
            {/* Agent Pills */}
            <div className="flex flex-col items-end gap-2">
              <div className="border border-[var(--color-agent-ceo)]/30 bg-[var(--color-agent-ceo)]/10 text-[var(--color-agent-ceo)] rounded-full px-4 py-1 text-[10px] font-bold backdrop-blur-md">CEO_Prime</div>
              <div className="border border-[var(--color-agent-cfo)]/30 bg-[var(--color-agent-cfo)]/10 text-[var(--color-agent-cfo)] rounded-full px-4 py-1 text-[10px] font-bold backdrop-blur-md">CFO_Quant</div>
              <div className="border border-[var(--color-agent-cmo)]/30 bg-[var(--color-agent-cmo)]/10 text-[var(--color-agent-cmo)] rounded-full px-4 py-1 text-[10px] font-bold backdrop-blur-md">CMO_Pulse</div>
            </div>
          </div>

          {/* CTA Button for Mobile */}
          <Link href="/dashboard" className="w-full relative group block mt-2">
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-xl blur opacity-30 animate-pulse"></div>
            <button className="relative w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] font-label-caps text-[13px] px-6 py-3.5 rounded-xl transition-all flex justify-between items-center shadow-[0_0_20px_rgba(207,188,255,0.3)]">
              <span className="font-bold tracking-widest">ENTER DASHBOARD</span>
              <div className="w-7 h-7 rounded-full bg-[var(--color-on-primary)]/10 flex items-center justify-center">
                <ArrowUpRight size={14} />
              </div>
            </button>
          </Link>
        </div>

        {/* Overlapping Marquees */}
        <div className="absolute bottom-[-40px] md:bottom-[-20px] w-full z-30">
          <div className="marquee-slanted bg-[var(--color-surface-container-low)]/80 backdrop-blur-lg border-y border-white/5 py-5 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="marquee-content font-display-lg text-[28px] text-white/80 flex gap-16 items-center uppercase tracking-wider">
              <span>SOMNIA NATIVE AGENTS</span> <span className="text-[var(--color-primary)] opacity-50">✦</span>
              <span>ON-CHAIN RECEIPTS</span> <span className="text-[var(--color-primary)] opacity-50">✦</span>
              <span>AI EXECUTIVE SUITE</span> <span className="text-[var(--color-primary)] opacity-50">✦</span>
              <span>DETERMINISTIC LLM INFERENCE</span> <span className="text-[var(--color-primary)] opacity-50">✦</span>
              <span>SOMNIA NATIVE AGENTS</span> <span className="text-[var(--color-primary)] opacity-50">✦</span>
              <span>ON-CHAIN RECEIPTS</span> <span className="text-[var(--color-primary)] opacity-50">✦</span>
              <span>AI EXECUTIVE SUITE</span> <span className="text-[var(--color-primary)] opacity-50">✦</span>
              <span>DETERMINISTIC LLM INFERENCE</span> <span className="text-[var(--color-primary)] opacity-50">✦</span>
            </div>
          </div>
          <div className="marquee-slanted-reverse bg-[var(--color-background)]/80 backdrop-blur-lg border-y border-[var(--color-primary)]/20 py-4 mt-[-40px] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="marquee-content-reverse font-display-lg text-[24px] text-white/50 flex gap-16 items-center uppercase tracking-wider">
              <span>NO HUMAN INTERVENTION</span> <span className="text-[var(--color-primary)] opacity-30">✦</span>
              <span>PROTOCOL OWNED LIQUIDITY</span> <span className="text-[var(--color-primary)] opacity-30">✦</span>
              <span>JSON API REQUESTS</span> <span className="text-[var(--color-primary)] opacity-30">✦</span>
              <span>BFT CONSENSUS</span> <span className="text-[var(--color-primary)] opacity-30">✦</span>
              <span>NO HUMAN INTERVENTION</span> <span className="text-[var(--color-primary)] opacity-30">✦</span>
              <span>PROTOCOL OWNED LIQUIDITY</span> <span className="text-[var(--color-primary)] opacity-30">✦</span>
              <span>JSON API REQUESTS</span> <span className="text-[var(--color-primary)] opacity-30">✦</span>
              <span>BFT CONSENSUS</span> <span className="text-[var(--color-primary)] opacity-30">✦</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Agents Section */}
      <section id="features" className="py-[var(--spacing-section-gap)] px-[var(--spacing-margin-page)] relative z-10 container mx-auto max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-16 md:mb-24 flex flex-col md:flex-row justify-between items-end gap-8 border-b border-[var(--color-on-surface)]/10 pb-8"
        >
          <div>
            <h2 className="font-display-lg text-display-lg md:text-[80px] leading-none mb-4 glow-text text-white">THE CORE AGENTS</h2>
            <p className="font-body-lg text-body-lg text-[var(--color-on-surface)]/60 max-w-2xl">
              Three distinct Solidity contracts executing deterministic LLM inferences via Somnia&apos;s native on-chain agents.
            </p>
          </div>
          <Link href="/dashboard">
            <button className="bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[0_0_15px_rgba(207,188,255,0.3)] font-label-caps text-label-caps px-8 py-3 rounded-full hover:opacity-90 hover:-translate-y-1 transition-all flex items-center gap-2">
              Live Console <ArrowUpRight size={16} />
            </button>
          </Link>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.2 }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Agent 1: CEO */}
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } }} className="h-full">
            <div className="h-full glass-dark p-8 rounded-2xl relative overflow-hidden group hover:border-[var(--color-agent-ceo)]/50 transition-colors animate-float-2" style={{ animationDelay: '0s' }}>
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity">
                <Brain size={48} className="text-[var(--color-agent-ceo)]" />
              </div>
              <div className="font-label-caps text-label-caps text-[var(--color-agent-ceo)] mb-2">AGENT 01</div>
              <h3 className="font-display-lg text-[32px] mb-6 text-white">CEO_Prime</h3>
              <p className="font-body-md text-body-md text-[var(--color-on-surface)]/70 mb-8">
                Responsible for high-level orchestration. Delegates to CFO and CMO via sequential Somnia createRequest() calls and finalizes on-chain execution.
              </p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between font-label-caps text-label-caps text-[var(--color-on-surface)]/50 mb-2">
                    <span>LLM Inference Agent</span>
                    <span className="text-[var(--color-agent-ceo)]">Active</span>
                  </div>
                  <div className="h-1 w-full bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-agent-ceo)] w-[100%] rounded-full shadow-[0_0_10px_var(--color-agent-ceo)]"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Agent 2: CFO */}
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } }} className="h-full">
            <div className="h-full glass-dark p-8 rounded-2xl relative overflow-hidden group hover:border-[var(--color-agent-cfo)]/50 transition-colors animate-float-1" style={{ animationDelay: '1s' }}>
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity">
                <TrendingUp size={48} className="text-[var(--color-agent-cfo)]" />
              </div>
              <div className="font-label-caps text-label-caps text-[var(--color-agent-cfo)] mb-2">AGENT 02</div>
              <h3 className="font-display-lg text-[32px] mb-6 text-white">CFO_Quant</h3>
              <p className="font-body-md text-body-md text-[var(--color-on-surface)]/70 mb-8">
                Manages treasury risk via Somnia JSON API Request Agent for live token metrics and LLM Inference for composite risk scoring, executing autonomous rebalancing on-chain.
              </p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between font-label-caps text-label-caps text-[var(--color-on-surface)]/50 mb-2">
                    <span>JSON API Request Agent</span>
                    <span className="text-[var(--color-agent-cfo)]">Active</span>
                  </div>
                  <div className="h-1 w-full bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-agent-cfo)] w-[100%] rounded-full shadow-[0_0_10px_var(--color-agent-cfo)]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-label-caps text-label-caps text-[var(--color-on-surface)]/50 mb-2">
                    <span>LLM Inference Agent</span>
                    <span className="text-[var(--color-agent-cfo)]">Active</span>
                  </div>
                  <div className="h-1 w-full bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-agent-cfo)]/70 w-[100%] rounded-full shadow-[0_0_10px_var(--color-agent-cfo)]"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Agent 3: CMO */}
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } }} className="h-full">
            <div className="h-full glass-dark p-8 rounded-2xl relative overflow-hidden group hover:border-[var(--color-agent-cmo)]/50 transition-colors animate-float-2" style={{ animationDelay: '2s' }}>
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity">
                <Radar size={48} className="text-[var(--color-agent-cmo)]" />
              </div>
              <div className="font-label-caps text-label-caps text-[var(--color-agent-cmo)] mb-2">AGENT 03</div>
              <h3 className="font-display-lg text-[32px] mb-6 text-white">CMO_Pulse</h3>
              <p className="font-body-md text-body-md text-[var(--color-on-surface)]/70 mb-8">
                Scrapes DeFi news using Somnia&apos;s LLM Parse Website Agent and deterministically classifies market sentiment via LLM Inference as bullish, bearish, or neutral.
              </p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between font-label-caps text-label-caps text-[var(--color-on-surface)]/50 mb-2">
                    <span>LLM Parse Website Agent</span>
                    <span className="text-[var(--color-agent-cmo)]">Active</span>
                  </div>
                  <div className="h-1 w-full bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-agent-cmo)] w-[100%] rounded-full shadow-[0_0_10px_var(--color-agent-cmo)]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-label-caps text-label-caps text-[var(--color-on-surface)]/50 mb-2">
                    <span>LLM Inference Agent</span>
                    <span className="text-[var(--color-agent-cmo)]">Active</span>
                  </div>
                  <div className="h-1 w-full bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-agent-cmo)]/70 w-[100%] rounded-full shadow-[0_0_10px_var(--color-agent-cmo)]"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* About Section — How It Works / On-Chain Receipts */}
      <section id="about" className="py-[var(--spacing-section-gap)] px-[var(--spacing-margin-page)] relative z-10 container mx-auto max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-16 md:mb-24"
        >
          <h2 className="font-display-lg text-display-lg md:text-[80px] leading-none mb-4 glow-text text-white">HOW IT WORKS</h2>
          <p className="font-body-lg text-body-lg text-[var(--color-on-surface)]/60 max-w-2xl">
            Fully transparent, trustless treasury management — every decision verifiable on-chain.
          </p>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.15 }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Step 1 */}
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }} className="h-full">
            <div className="h-full glass-dark p-8 rounded-2xl relative group hover:border-[var(--color-agent-ceo)]/30 transition-colors">
              <div className="font-display-lg text-[64px] text-white/5 absolute top-4 right-6 leading-none">01</div>
              <div className="w-12 h-12 rounded-xl bg-[var(--color-agent-ceo)]/10 border border-[var(--color-agent-ceo)]/20 flex items-center justify-center mb-6">
                <Rocket size={24} className="text-[var(--color-agent-ceo)]" />
              </div>
              <h3 className="font-display-lg text-[20px] text-white mb-3">CEO Initiates Cycle</h3>
              <p className="font-body-md text-[14px] text-[var(--color-on-surface)]/60 leading-relaxed">
                CEO_Prime starts a decision cycle and delegates tasks to CFO and CMO via Somnia&apos;s <code className="text-[var(--color-agent-ceo)]/80 text-[12px]">createRequest()</code>.
              </p>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }} className="h-full">
            <div className="h-full glass-dark p-8 rounded-2xl relative group hover:border-[var(--color-agent-cfo)]/30 transition-colors">
              <div className="font-display-lg text-[64px] text-white/5 absolute top-4 right-6 leading-none">02</div>
              <div className="w-12 h-12 rounded-xl bg-[var(--color-agent-cfo)]/10 border border-[var(--color-agent-cfo)]/20 flex items-center justify-center mb-6">
                <BarChart3 size={24} className="text-[var(--color-agent-cfo)]" />
              </div>
              <h3 className="font-display-lg text-[20px] text-white mb-3">Agents Analyze Data</h3>
              <p className="font-body-md text-[14px] text-[var(--color-on-surface)]/60 leading-relaxed">
                CFO fetches live price data via JSON API Agent. CMO scrapes market sentiment via Parse Website Agent. Both run LLM Inference for analysis.
              </p>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }} className="h-full">
            <div className="h-full glass-dark p-8 rounded-2xl relative group hover:border-[var(--color-agent-cmo)]/30 transition-colors">
              <div className="font-display-lg text-[64px] text-white/5 absolute top-4 right-6 leading-none">03</div>
              <div className="w-12 h-12 rounded-xl bg-[var(--color-agent-cmo)]/10 border border-[var(--color-agent-cmo)]/20 flex items-center justify-center mb-6">
                <Network size={24} className="text-[var(--color-agent-cmo)]" />
              </div>
              <h3 className="font-display-lg text-[20px] text-white mb-3">BFT Consensus</h3>
              <p className="font-body-md text-[14px] text-[var(--color-on-surface)]/60 leading-relaxed">
                All agent compute runs through Somnia&apos;s validator nodes with BFT consensus on deterministic LLM outputs — pinned model weights and synchronized seeds.
              </p>
            </div>
          </motion.div>

          {/* Step 4 */}
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }} className="h-full">
            <div className="h-full glass-dark p-8 rounded-2xl relative group hover:border-[var(--color-tertiary)]/30 transition-colors">
              <div className="font-display-lg text-[64px] text-white/5 absolute top-4 right-6 leading-none">04</div>
              <div className="w-12 h-12 rounded-xl bg-[var(--color-tertiary)]/10 border border-[var(--color-tertiary)]/20 flex items-center justify-center mb-6">
                <ShieldCheck size={24} className="text-[var(--color-tertiary)]" />
              </div>
              <h3 className="font-display-lg text-[20px] text-white mb-3">On-Chain Receipt</h3>
              <p className="font-body-md text-[14px] text-[var(--color-on-surface)]/60 leading-relaxed">
                Every decision produces a public, auditable execution receipt verifiable via Somnia&apos;s consensus — zero single points of failure, zero off-chain dependencies.
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Somnia Agentathon Badge */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 py-8 border-t border-[var(--color-on-surface)]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00B894] flex items-center justify-center">
              <Trophy size={20} className="text-white" />
            </div>
            <div>
              <p className="font-label-caps text-label-caps text-[#6C5CE7]">SOMNIA AGENTATHON 2026</p>
              <p className="font-body-md text-[13px] text-[var(--color-on-surface)]/50">Track: Novel Agent Applications</p>
            </div>
          </div>
          <div className="hidden sm:block w-px h-10 bg-[var(--color-on-surface)]/10"></div>
          <p className="font-body-md text-[14px] text-[var(--color-on-surface)]/40 max-w-md text-center sm:text-left">
            Built entirely on Somnia&apos;s native agent primitives — no off-chain servers, no external API dependencies. 100% Somnia-native.
          </p>
        </div>
      </section>

      {/* On-Chain Contract Strip — trust signal between How It Works and FAQ */}
      <ContractAddressStrip />

      {/* FAQ Section */}
      <section id="faqs" className="py-[var(--spacing-section-gap)] px-[var(--spacing-margin-page)] relative z-10 container mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <h2 className="font-display-lg text-display-lg md:text-[64px] leading-tight text-white max-w-md">
            Frequently Asked Questions
          </h2>
          <p className="font-body-md text-body-md text-white/50 max-w-xs leading-relaxed">
            Everything you need to know about SovereignMind&apos;s autonomous on-chain agent architecture.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div 
                key={index}
                onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                className={`border ${isOpen ? 'border-[var(--color-primary)]/30 bg-[var(--color-surface-container)]' : 'border-white/10 bg-transparent hover:border-white/30'} rounded-[30px] p-6 md:p-8 cursor-pointer transition-all duration-300`}
              >
                <div className="flex justify-between items-center w-full">
                  <h3 className="font-body-lg text-[18px] md:text-[22px] text-[var(--color-on-surface)]/90">
                    {faq.q}
                  </h3>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 flex-shrink-0 ml-4 ${isOpen ? 'bg-[var(--color-primary)] rotate-180' : 'bg-transparent border border-white/10'}`}>
                    <ChevronDown size={20} className="text-white" />
                  </div>
                </div>
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0 mt-0'}`}
                >
                  <div className="overflow-hidden">
                    <p className="font-body-md text-[15px] text-white/60 leading-relaxed max-w-[85%]">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--color-background)] w-full border-t border-[var(--color-on-surface)]/10 grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-gutter)] px-[var(--spacing-margin-page)] py-[var(--spacing-section-gap)] max-w-7xl mx-auto z-10 relative">
        <div className="flex flex-col gap-6">
          <span className="font-display-lg text-display-lg text-[var(--color-on-surface)] text-[32px] leading-none">SovereignMind</span>
          <p className="font-body-md text-[13px] text-[var(--color-on-surface)]/40 max-w-sm leading-relaxed">
            Autonomous On-Chain Agentic Venture Guild — built for the Somnia Agentathon 2026.
          </p>
          <p className="font-label-caps text-label-caps text-[var(--color-on-surface)]/50">
            © 2026 SOVEREIGNMIND. ALL RIGHTS RESERVED.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-4 md:justify-end items-start font-label-caps text-label-caps">
          <Link href="https://docs.somnia.network" target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-surface)]/50 hover:text-[var(--color-primary)] transition-colors">Documentation</Link>
          <Link href="https://shannon.somnia.network" target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-surface)]/50 hover:text-[var(--color-primary)] transition-colors">Block Explorer</Link>
          <Link href="https://receipts.net.somnia.host" target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-surface)]/50 hover:text-[var(--color-primary)] transition-colors">Receipts API</Link>
          <Link href="https://agents.somnia.network" target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-surface)]/50 hover:text-[var(--color-primary)] transition-colors">Agent Dashboard</Link>
          <Link href="https://github.com/bagusardin25/SovereignMind" target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-surface)]/50 hover:text-[var(--color-primary)] transition-colors">GitHub</Link>
          <Link href="/dashboard" className="text-[var(--color-on-surface)]/50 hover:text-[var(--color-primary)] transition-colors">Terminal</Link>
        </div>
      </footer>
    </>
  );
}
