// ============================================================
// SovereignMind — Orchestrator Entry Point
// ============================================================
// Usage:
//   npm run dev          — Start with hot-reload
//   npm start            — Production mode
//   npm run cycle        — Run single cycle and exit
// ============================================================

import { ethers } from 'ethers';
import { config } from './config';
import { logger } from './logger';
import { createContracts } from './services/contracts';
import { EventService } from './services/events.service';
import { FundingService } from './services/funding.service';
import { CFOService } from './services/cfo.service';
import { CMOService } from './services/cmo.service';
import { CEOService } from './services/ceo.service';
import { PortfolioService } from './services/portfolio.service';
import { Orchestrator } from './orchestrator';
import { Scheduler } from './scheduler';
import { HealthServer } from './health';

async function main(): Promise<void> {
  logger.info('');
  logger.info('╔══════════════════════════════════════════════╗');
  logger.info('║   🧠 SovereignMind Orchestrator v1.0.0      ║');
  logger.info('║   Autonomous Agent Decision Engine           ║');
  logger.info('╚══════════════════════════════════════════════╝');
  logger.info('');

  // ── 1. Initialize blockchain connection ───────────────
  logger.info('🔗 Connecting to Somnia Testnet...');
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);

  const network = await provider.getNetwork();
  const balance = await provider.getBalance(wallet.address);
  logger.info(`   Network: ${network.name} (chainId: ${network.chainId})`);
  logger.info(`   Wallet:  ${wallet.address}`);
  logger.info(`   Balance: ${ethers.formatEther(balance)} STT`);

  // ── 2. Initialize contracts ───────────────────────────
  logger.info('📄 Loading contracts...');
  const contracts = createContracts(wallet);
  logger.info(`   AgentRegistry: ${config.addresses.agentRegistry}`);
  logger.info(`   TreasuryVault: ${config.addresses.treasuryVault}`);
  logger.info(`   CEOAgent:      ${config.addresses.ceoAgent}`);
  logger.info(`   CFOAgent:      ${config.addresses.cfoAgent}`);
  logger.info(`   CMOAgent:      ${config.addresses.cmoAgent}`);

  // ── 3. Initialize services ────────────────────────────
  logger.info('⚙️ Initializing services...');
  const eventService = new EventService(contracts);
  const fundingService = new FundingService(wallet, provider);
  const cfoService = new CFOService(contracts);
  const cmoService = new CMOService(contracts);
  const ceoService = new CEOService(contracts);
  const portfolioService = new PortfolioService(wallet);

  // ── 4. Initialize orchestrator ────────────────────────
  const orchestrator = new Orchestrator({
    cfo: cfoService,
    cmo: cmoService,
    ceo: ceoService,
    events: eventService,
    funding: fundingService,
    portfolio: portfolioService,
  });

  // ── 5. Start event monitoring ─────────────────────────
  eventService.startMonitoring();

  // ── 6. Print balance report ───────────────────────────
  const balanceReport = await fundingService.getBalanceReport();
  logger.info('');
  logger.info('💰 Balance Report:');
  logger.info(`   Wallet: ${balanceReport.wallet.balance} STT`);
  for (const agent of balanceReport.agents) {
    const status = agent.belowMinimum ? '⚠️ LOW' : '✅';
    logger.info(`   ${agent.name}: ${agent.balance} STT ${status}`);
  }
  logger.info('');

  // ── 7. Start scheduler ────────────────────────────────
  const scheduler = new Scheduler(orchestrator);

  // ── 8. Start health server ────────────────────────────
  const healthServer = new HealthServer(orchestrator, scheduler, fundingService);
  healthServer.listen();

  // ── 9. Start cycles ───────────────────────────────────
  logger.info('');
  logger.info(`🔄 Cycle interval: every ${config.cycleIntervalMinutes} minutes`);
  logger.info(`📋 Tracked tokens: ${config.trackedTokens.join(', ')}`);
  logger.info(`🌐 Market scan URL: ${config.marketScanUrl}`);
  logger.info('');

  await scheduler.start();

  // ── Handle graceful shutdown ──────────────────────────
  const shutdown = () => {
    logger.info('\n🛑 Shutting down orchestrator...');
    scheduler.stop();
    eventService.stopMonitoring();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  logger.error('💥 Fatal error:', error);
  process.exit(1);
});
