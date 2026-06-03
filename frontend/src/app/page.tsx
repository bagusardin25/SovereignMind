'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
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
  Wallet,
} from 'lucide-react';
import ChainBadge from '@/components/landing/ChainBadge';
import LiveStatsGrid from '@/components/landing/LiveStatsGrid';
import ContractAddressStrip from '@/components/landing/ContractAddressStrip';
import FeatureAgentCard from '@/components/landing/FeatureAgentCard';
import MouseParallax from '@/components/ui/MouseParallax';
import Particles from '@/components/ui/Particles';
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
    a: "Every algorithmic decision produces a verifiable on-chain execution receipt via Somnia's BFT consensus mechanism. The app uses a minimal off-chain orchestrator for cycle scheduling and transaction signing; agent requests, responses, and treasury receipts remain publicly auditable on-chain."
  },
  {
    q: "Where can I track the agent decisions?",
    a: "You can track all activities, view agent logs, monitor treasury allocations, and inspect execution receipts directly from our Live Console Dashboard. Every receipt is also verifiable on the Somnia Block Explorer."
  }
];

export default function LandingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
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
          <Link 
            href="/dashboard" 
            className="hidden md:flex items-center gap-1.5 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)] text-[var(--color-primary)] hover:text-[var(--color-on-primary)] font-label-caps text-[11px] tracking-wider uppercase px-5 py-2.5 rounded-xl border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)] transition-all duration-300 shadow-[0_0_15px_rgba(207,188,255,0.1)] hover:shadow-[0_0_25px_rgba(207,188,255,0.5)] whitespace-nowrap group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-1.5 font-extrabold">
              Launch App
              <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
          </Link>
          
          {/* Desktop Nav Links */}
          <div className="hidden md:flex gap-6 font-body-md text-[13px] text-[var(--color-on-surface)]/60">
            <Link href="#features" className="hover:text-white transition-colors group/nav py-1 relative">
              <span className="relative">
                Features
                <span className="absolute bottom-[-2px] left-0 w-0 h-[1.5px] bg-[var(--color-primary)] group-hover/nav:w-full transition-all duration-300" />
              </span>
            </Link>
            <Link href="#about" className="hover:text-white transition-colors group/nav py-1 relative">
              <span className="relative">
                About
                <span className="absolute bottom-[-2px] left-0 w-0 h-[1.5px] bg-[var(--color-primary)] group-hover/nav:w-full transition-all duration-300" />
              </span>
            </Link>
            <Link href="#faqs" className="hover:text-white transition-colors group/nav py-1 relative">
              <span className="relative">
                FAQs
                <span className="absolute bottom-[-2px] left-0 w-0 h-[1.5px] bg-[var(--color-primary)] group-hover/nav:w-full transition-all duration-300" />
              </span>
            </Link>
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
            href="/docs"
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
          <div className="hidden lg:block">
            <ChainBadge />
          </div>
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== 'loading';
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === 'authenticated');

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    style: {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary)]/90 font-label-caps text-[11px] tracking-wider uppercase px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(207,188,255,0.3)] hover:shadow-[0_0_25px_rgba(207,188,255,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 relative group overflow-hidden cursor-pointer whitespace-nowrap"
                        >
                          <Wallet size={13} className="transition-transform group-hover:scale-110" />
                          <span className="font-extrabold relative z-10">Connect Wallet</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-extrabold font-label-caps text-[11px] tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)] hover:bg-rose-500/20 active:scale-[0.98] transition-all duration-300 cursor-pointer whitespace-nowrap"
                        >
                          Wrong Network
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-2">
                        {chain.hasIcon && chain.iconUrl && (
                          <button
                            onClick={openChainModal}
                            className="hidden sm:flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[var(--color-primary)]/30 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                            type="button"
                          >
                            <div className="w-4 h-4 overflow-hidden rounded-full">
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </button>
                        )}

                        <button
                          onClick={openAccountModal}
                          type="button"
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[var(--color-primary)]/50 hover:bg-white/10 transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(207,188,255,0.25)] active:scale-[0.98] cursor-pointer whitespace-nowrap"
                        >
                          <span className="text-[11px] font-extrabold font-label-caps tracking-wider text-white">
                            {account.displayName}
                          </span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full min-h-screen md:h-screen md:min-h-[850px] bg-[var(--color-background)] flex items-center justify-center overflow-hidden">
        
        {/* Interactive Plexus Particle Background */}
        <Particles color="rgba(207, 188, 255, 0.2)" quantity={60} lineDistance={130} className="absolute inset-0 z-0 pointer-events-none" />
        
        {/* 3D Isometric Grid Background */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-80">
          <div className="absolute w-[300vw] h-[300vh]" style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
            transform: 'rotateX(60deg) rotateZ(-45deg) translateY(-10%)',
            transformOrigin: 'center center',
          }}>
          </div>
          {/* Radial fade to hide hard edges */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--color-background)_75%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-background)]/80 via-transparent to-[var(--color-background)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-transparent to-transparent" />
        </div>

        {/* Center Content Wrapper */}
        <div className="container mx-auto px-6 lg:px-12 relative z-10 w-full h-full flex flex-col justify-start md:justify-center pt-28 pb-12 md:pt-0 md:pb-0 mt-8 md:mt-0">
          
          <div className="flex flex-col md:flex-row w-full justify-between items-center gap-12 md:gap-16 max-w-7xl w-full">
            
            {/* Left Side Content */}
            <div className="flex flex-col items-center md:items-start justify-center w-full md:w-[55%] lg:w-[60%] z-20 text-center md:text-left">
              
              <h1 className="text-white text-[36px] sm:text-[46px] md:text-[54px] lg:text-[64px] xl:text-[72px] font-extrabold italic mb-6 leading-[1.05] tracking-tight drop-shadow-lg max-w-[650px] lg:max-w-[750px]">
                Autonomous Venture Guild,<br className="hidden sm:block" />
                <span className="text-white">Now On-Chain</span>
              </h1>
              
              <p className="font-body-md text-[15px] md:text-[18px] text-[#dee2ec] italic mb-10 leading-relaxed max-w-[450px] font-light">
                The first fully on-chain autonomous Venture Guild powered by Somnia L1 primitives. Monitor AI executive decisions and track algorithmic consensus without human intervention.
              </p>
              
              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4 justify-center md:justify-start">
                <Link href="/dashboard" className="w-full sm:w-auto block group">
                  <button className="relative w-full sm:w-auto bg-[var(--color-primary)] text-[var(--color-on-primary)] font-label-caps text-[14px] px-8 py-4 rounded-xl hover:scale-[1.03] transition-all duration-300 shadow-[0_0_20px_rgba(207,188,255,0.3)] hover:shadow-[0_0_40px_rgba(207,188,255,0.6)] flex justify-center items-center gap-3">
                    <span className="font-extrabold tracking-wide uppercase">Enter Dashboard</span>
                    <div className="w-8 h-8 rounded-full bg-[var(--color-on-primary)]/10 flex items-center justify-center group-hover:bg-[var(--color-on-primary)]/20 group-hover:rotate-45 transition-all duration-300 z-10">
                      <ArrowUpRight size={16} />
                    </div>
                  </button>
                </Link>
                <Link href="https://github.com/bagusardin25/SovereignMind" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto block group">
                  <button className="w-full sm:w-auto bg-transparent border border-white/20 text-white font-label-caps text-[14px] px-8 py-4 rounded-xl hover:bg-white/5 transition-all duration-300 flex justify-center items-center gap-2">
                    <FileCode2 size={16} />
                    <span className="font-bold tracking-wide uppercase">View Code</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Side Content */}
            <div className="flex flex-col justify-center items-center md:items-end w-full md:w-[45%] lg:w-[40%] z-20 mt-8 md:mt-0 relative">
              <div className="relative transform scale-[0.85] sm:scale-95 md:scale-[1.02] lg:scale-[1.05] xl:scale-[1.1] origin-center md:origin-right transition-transform duration-700 hover:scale-[0.9] sm:hover:scale-[1.0] md:hover:scale-[1.08] lg:hover:scale-[1.12] md:mr-4 w-full max-w-[380px] md:max-w-none mx-auto md:mx-0">
                {/* Glowing orb matching the primary theme */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] md:w-[350px] h-[250px] md:h-[350px] bg-[var(--color-primary)]/20 rounded-full blur-[80px] md:blur-[100px] -z-10 animate-pulse"></div>
                
                {/* Visual Representation (Interactive Chart) */}
                <MouseParallax depth={8}>
                  <div className="glass-dark border border-white/10 rounded-3xl p-4 bg-[var(--color-surface-container-low)]/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent opacity-50 z-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10 w-full overflow-hidden">
                      <LiveStatsGrid />
                    </div>
                  </div>
                </MouseParallax>
              </div>
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
            <p className="font-body-lg text-body-lg text-[var(--color-on-surface)]/80 max-w-2xl">
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
          <FeatureAgentCard 
            id="AGENT 01"
            title="CEO_Prime"
            description="Responsible for high-level orchestration. Delegates to CFO and CMO via sequential Somnia createRequest() calls and finalizes on-chain execution."
            colorVar="--color-agent-ceo"
            delay="0s"
            icon={<Brain size={48} className="text-[var(--color-agent-ceo)]" />}
            animationClass="animate-float-2"
            features={[
              { name: "LLM Inference Agent", progressClass: "w-[100%]" }
            ]}
          />
          <FeatureAgentCard 
            id="AGENT 02"
            title="CFO_Quant"
            description="Manages treasury risk via Somnia JSON API Request Agent for live token metrics and LLM Inference for composite risk scoring, executing autonomous rebalancing on-chain."
            colorVar="--color-agent-cfo"
            delay="1s"
            icon={<TrendingUp size={48} className="text-[var(--color-agent-cfo)]" />}
            animationClass="animate-float-1"
            features={[
              { name: "JSON API Request Agent", progressClass: "w-[100%]" },
              { name: "LLM Inference Agent", progressClass: "w-[100%]" }
            ]}
          />
          <FeatureAgentCard 
            id="AGENT 03"
            title="CMO_Pulse"
            description="Scrapes DeFi news using Somnia's LLM Parse Website Agent and deterministically classifies market sentiment via LLM Inference as bullish, bearish, or neutral."
            colorVar="--color-agent-cmo"
            delay="2s"
            icon={<Radar size={48} className="text-[var(--color-agent-cmo)]" />}
            animationClass="animate-float-2"
            features={[
              { name: "LLM Parse Website Agent", progressClass: "w-[100%]" },
              { name: "LLM Inference Agent", progressClass: "w-[100%]" }
            ]}
          />
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
          <p className="font-body-lg text-body-lg text-[var(--color-on-surface)]/80 max-w-2xl">
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
                Every decision produces a public, auditable execution receipt verifiable via Somnia&apos;s consensus, with a minimal off-chain orchestrator only for scheduling and transaction signing.
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
            Built on Somnia&apos;s native agent primitives with a minimal off-chain orchestrator for cycle scheduling.
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
              <button 
                key={index}
                type="button"
                onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className={`w-full text-left border ${isOpen ? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/5 shadow-[0_0_30px_rgba(207,188,255,0.1)]' : 'border-white/10 bg-[var(--color-surface-container)]/30 hover:bg-[var(--color-surface-container)]/80 hover:border-white/30 hover:-translate-y-1'} rounded-[24px] p-6 md:p-8 cursor-pointer transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/50`}
              >
                <div className="flex justify-between items-center w-full">
                  <h3 className={`font-body-lg text-[18px] md:text-[22px] transition-colors duration-300 ${isOpen ? 'text-[var(--color-primary)]' : 'text-white'}`}>
                    {faq.q}
                  </h3>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 flex-shrink-0 ml-4 ${isOpen ? 'bg-[var(--color-primary)] rotate-180 shadow-[0_0_15px_rgba(207,188,255,0.4)]' : 'bg-white/5 border border-white/10'}`}>
                    <ChevronDown size={20} className={isOpen ? 'text-[var(--color-background)]' : 'text-white'} />
                  </div>
                </div>
                <div 
                  role="region"
                  aria-hidden={!isOpen}
                  className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0 mt-0'}`}
                >
                  <div className="overflow-hidden">
                    <p className="font-body-md text-[15px] text-white/60 leading-relaxed max-w-[85%]">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-[var(--color-background)] w-full border-t border-[var(--color-on-surface)]/10 px-[var(--spacing-margin-page)] py-[var(--spacing-section-gap)] z-10 overflow-hidden">
        {/* Giant Marquee Background in Footer */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full pointer-events-none select-none overflow-hidden opacity-5 z-0 flex whitespace-nowrap">
          <div className="animate-[marquee_60s_linear_infinite] flex gap-16 items-center">
            <span className="font-display-lg text-[15vw] font-extrabold tracking-tighter">SOVEREIGN MIND</span>
            <span className="font-display-lg text-[15vw] font-extrabold tracking-tighter">SOVEREIGN MIND</span>
            <span className="font-display-lg text-[15vw] font-extrabold tracking-tighter">SOVEREIGN MIND</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-gutter)] relative z-10">
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
          <Link href="/docs" className="text-[var(--color-on-surface)]/50 hover:text-[var(--color-primary)] transition-colors">Documentation</Link>
          <Link href="https://shannon.somnia.network" target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-surface)]/50 hover:text-[var(--color-primary)] transition-colors">Block Explorer</Link>
          <Link href="https://receipts.net.somnia.host" target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-surface)]/50 hover:text-[var(--color-primary)] transition-colors">Receipts API</Link>
          <Link href="https://agents.somnia.network" target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-surface)]/50 hover:text-[var(--color-primary)] transition-colors">Agent Dashboard</Link>
          <Link href="https://github.com/bagusardin25/SovereignMind" target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-surface)]/50 hover:text-[var(--color-primary)] transition-colors">GitHub</Link>
          <Link href="/dashboard" className="text-[var(--color-on-surface)]/50 hover:text-[var(--color-primary)] transition-colors">Terminal</Link>
        </div>
        </div>
      </footer>
    </>
  );
}
