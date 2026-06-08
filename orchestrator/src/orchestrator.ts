// ============================================================
// SovereignMind — Main Orchestration Engine
// ============================================================
// Runs one complete decision cycle with smart safeguards:
//   Fund → Fetch Prices → Analyze Risk → Scan Market → CEO Decision
//
// Safeguards:
//   - Session budget cap: stops when total STT spent exceeds limit
//   - Wallet balance guard: refuses to start if wallet too low
//   - Smart step skip: skips CEO if CMO timed out (no point burning more STT)
//   - Circuit breaker: trips after N consecutive failures (configurable)
//   - No retry on event timeout: one timeout is enough, don't waste time
//   - Funding skip on failure: don't top-up contracts that keep failing

import { config, getPriceConfigs } from './config';
import { logger } from './logger';
import { CFOService } from './services/cfo.service';
import { CMOService } from './services/cmo.service';
import { CEOService } from './services/ceo.service';
import { EventService } from './services/events.service';
import { FundingService } from './services/funding.service';
import { PortfolioService } from './services/portfolio.service';
import type { CycleStep, CycleResult, StepResult } from './types';

export class Orchestrator {
  private cfo: CFOService;
  private cmo: CMOService;
  private ceo: CEOService;
  private events: EventService;
  private funding: FundingService;
  private portfolio: PortfolioService;

  // State
  private _isRunning = false;
  private _currentStep: CycleStep = 'IDLE';
  private _cycleCount = 0;
  private _lastCycle: CycleResult | null = null;
  private _startedAt = Date.now();

  // Circuit breaker
  private _consecutiveFailures = 0;
  private _circuitBreakerTripped = false;

  // Budget tracking
  private _totalSttSpent = 0;
  private _sessionBudgetExceeded = false;

  constructor(deps: {
    cfo: CFOService;
    cmo: CMOService;
    ceo: CEOService;
    events: EventService;
    funding: FundingService;
    portfolio: PortfolioService;
  }) {
    this.cfo = deps.cfo;
    this.cmo = deps.cmo;
    this.ceo = deps.ceo;
    this.events = deps.events;
    this.funding = deps.funding;
    this.portfolio = deps.portfolio;
  }

  get isRunning(): boolean { return this._isRunning; }
  get currentStep(): CycleStep { return this._currentStep; }
  get cycleCount(): number { return this._cycleCount; }
  get lastCycle(): CycleResult | null { return this._lastCycle; }
  get uptime(): number { return Date.now() - this._startedAt; }
  get circuitBreakerTripped(): boolean { return this._circuitBreakerTripped; }
  get consecutiveFailures(): number { return this._consecutiveFailures; }
  get totalSttSpent(): number { return this._totalSttSpent; }
  get sessionBudgetExceeded(): boolean { return this._sessionBudgetExceeded; }

  /**
   * Manually reset the circuit breaker after operator investigation.
   */
  resetCircuitBreaker(): void {
    this._circuitBreakerTripped = false;
    this._consecutiveFailures = 0;
    this._sessionBudgetExceeded = false;
    logger.info('🔧 Circuit breaker manually reset');
  }

  /**
   * Wait for an on-chain event with timeout.
   * Single attempt — no retry. Returns true if received, false on timeout.
   */
  private async waitForEvent(eventName: string, timeoutMs?: number): Promise<boolean> {
    const timeout = timeoutMs ?? config.eventTimeoutSeconds * 1000;

    try {
      await this.events.waitFor(eventName, timeout);
      return true;
    } catch {
      logger.warn(`⚠️ Timeout waiting for ${eventName} (${timeout / 1000}s)`);
      return false;
    }
  }

  /**
   * Run one complete decision cycle with smart safeguards.
   */
  async runCycle(): Promise<CycleResult> {
    // ── Guard 1: Circuit breaker ──────────────────────────
    if (this._circuitBreakerTripped) {
      logger.error(`🚨 Circuit breaker ACTIVE — ${this._consecutiveFailures} consecutive failures. Skipping. Call resetCircuitBreaker() to resume.`);
      return this.emptyCycleResult(`Circuit breaker tripped (${this._consecutiveFailures} consecutive failures)`);
    }

    // ── Guard 2: Session budget cap ───────────────────────
    if (this._sessionBudgetExceeded) {
      logger.error(`🚨 SESSION BUDGET EXCEEDED — ${this._totalSttSpent.toFixed(2)} STT spent (limit: ${config.maxSessionBudgetSTT}). Skipping. Call resetCircuitBreaker() to resume.`);
      return this.emptyCycleResult(`Session budget exceeded (${this._totalSttSpent.toFixed(2)} / ${config.maxSessionBudgetSTT} STT)`);
    }

    // ── Guard 3: Already running ──────────────────────────
    if (this._isRunning) {
      logger.warn('⚠️ Cycle already in progress, skipping');
      return this.emptyCycleResult('Cycle already in progress');
    }

    this._isRunning = true;
    const cycleId = ++this._cycleCount;
    const startedAt = new Date();
    const steps: StepResult[] = [];

    // Sync nonce counter with network before starting cycle
    await this.funding.syncNonce();

    // Track wallet balance before cycle to measure STT spent
    const walletBefore = await this.funding.getBalanceReport();
    const walletBalBefore = parseFloat(walletBefore.wallet.balance);

    logger.info(`\n${'═'.repeat(50)}`);
    logger.info(`  🔄 Decision Cycle #${cycleId} Starting`);
    logger.info(`  💰 Wallet: ${walletBefore.wallet.balance} STT | Session spent: ${this._totalSttSpent.toFixed(2)} / ${config.maxSessionBudgetSTT} STT`);
    logger.info(`${'═'.repeat(50)}\n`);

    // ── Guard 4: Minimum wallet balance ───────────────────
    if (walletBalBefore < config.minWalletBalanceSTT) {
      logger.error(`🚨 WALLET TOO LOW — ${walletBefore.wallet.balance} STT (minimum: ${config.minWalletBalanceSTT} STT). Aborting cycle.`);
      this._isRunning = false;
      this._currentStep = 'IDLE';
      const result = this.emptyCycleResult(`Wallet balance too low: ${walletBefore.wallet.balance} STT (min: ${config.minWalletBalanceSTT})`);
      this._lastCycle = result;
      return result;
    }

    try {
      // Track whether expensive steps should be skipped
      let shouldSkipExpensiveSteps = false;

      // ── Step 1: Fund agent contracts ──────────────────
      // Skip funding if previous cycle had failures — don't throw good money after bad
      if (this._consecutiveFailures > 0) {
        logger.warn(`⚠️ Skipping funding — ${this._consecutiveFailures} consecutive failure(s). Don't top-up failing contracts.`);
        steps.push({
          step: 'FUNDING',
          success: true,
          duration: 0,
          data: { skipped: true, reason: 'consecutive_failures' },
        });
      } else {
        await this.executeStep('FUNDING', steps, async () => {
          await this.funding.ensureMinBalances();
        });
      }

      // ── Step 2: Fetch prices for all tracked tokens ───
      const priceConfigs = getPriceConfigs();
      for (const priceConfig of priceConfigs) {
        await this.executeStep('FETCHING_PRICES', steps, async () => {
          const txHash = await this.cfo.fetchPrice(priceConfig);
          const eventReceived = await this.waitForEvent('PriceFetched');
          return { txHash, symbol: priceConfig.symbol, eventReceived };
        });
      }

      // ── Step 3: Analyze risk ──────────────────────────
      await this.executeStep('ANALYZING_RISK', steps, async () => {
        const txHash = await this.cfo.analyzeRisk();
        const eventReceived = await this.waitForEvent('RiskAnalyzed');
        const riskScore = await this.cfo.getCurrentRiskScore();
        return { txHash, riskScore, eventReceived };
      });

      // ── Step 4: Scan market ───────────────────────────
      // This is the most expensive step (2 chained Agent Runner requests):
      //   1. ParseWeb: scrape website (30-60s)
      //   2. LLM Inference: sentiment analysis (30-60s)
      // Needs 3x normal timeout to account for both steps.
      const cmoStep = await this.executeStep('SCANNING_MARKET', steps, async () => {
        const txHash = await this.cmo.scanMarket();
        const cmoTimeout = config.eventTimeoutSeconds * 3 * 1000;
        const eventReceived = await this.waitForEvent('SentimentAnalyzed', cmoTimeout);
        return { txHash, eventReceived };
      });

      // ── Smart Step Skip ────────────────────────────────
      // If CMO scan failed or timed out, SKIP CEO entirely.
      // CEO needs CMO data and will just revert — no point burning more STT.
      if (cmoStep && (!cmoStep.success || cmoStep.degraded)) {
        shouldSkipExpensiveSteps = true;
        const reason = !cmoStep.success ? 'CMO scan failed' : 'CMO scan timed out (Agent Runner unresponsive)';
        logger.warn(`⚠️ Skipping CEO_DECISION — ${reason}. No point burning STT on a doomed call.`);
        steps.push({
          step: 'CEO_DECISION',
          success: false,
          duration: 0,
          error: `Skipped: ${reason}`,
          data: { skipped: true },
        });
      }

      // ── Step 5: CEO Decision ──────────────────────────
      if (!shouldSkipExpensiveSteps) {
        await this.executeStep('CEO_DECISION', steps, async () => {
          const txHash = await this.ceo.initiateDecisionCycle();
          const eventReceived = await this.waitForEvent('CycleCompleted', config.eventTimeoutSeconds * 1000);
          const metrics = await this.ceo.getPerformanceMetrics();
          return { txHash, ...metrics, eventReceived };
        });
      }

      // ── Step 6: Portfolio Rebalance ──────────────────────
      if (this.portfolio.isConfigured && !shouldSkipExpensiveSteps) {
        await this.executeStep('PORTFOLIO_REBALANCE', steps, async () => {
          const riskScore = await this.cfo.getCurrentRiskScore();
          await this.portfolio.executeRebalance(Number(riskScore));
          const status = await this.portfolio.getStatus();
          return { ...status };
        });
      }

      // ── Cycle complete ────────────────────────────────
      this._currentStep = 'COMPLETED';
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      // Calculate STT spent this cycle
      const walletAfter = await this.funding.getBalanceReport();
      const walletBalAfter = parseFloat(walletAfter.wallet.balance);
      const cycleSttSpent = Math.max(0, walletBalBefore - walletBalAfter);
      this._totalSttSpent += cycleSttSpent;

      const succeededSteps = steps.filter(s => s.success).length;
      const failedSteps = steps.filter(s => !s.success).length;
      const degradedSteps = steps.filter(s => s.degraded).length;
      const skippedSteps = steps.filter(s => s.data?.skipped).length;

      const ceoStep = steps.find(s => s.step === 'CEO_DECISION');
      const ceoDecisionMade = ceoStep?.success === true && ceoStep?.degraded !== true;

      const result: CycleResult = {
        success: failedSteps === 0 && skippedSteps === 0 && ceoDecisionMade,
        cycleId,
        startedAt,
        completedAt,
        steps,
        degradedStepCount: degradedSteps + skippedSteps,
      };

      this._lastCycle = result;

      // ── Circuit breaker tracking ─────────────────────
      if (result.success) {
        this._consecutiveFailures = 0;
      } else {
        this._consecutiveFailures++;
        if (this._consecutiveFailures >= config.maxConsecutiveFailures) {
          this._circuitBreakerTripped = true;
          logger.error(`🚨 CIRCUIT BREAKER TRIPPED — ${this._consecutiveFailures} consecutive failures. Pausing to prevent further STT loss.`);
        } else {
          logger.warn(`⚠️ Consecutive failures: ${this._consecutiveFailures}/${config.maxConsecutiveFailures}`);
        }
      }

      // ── Budget check ─────────────────────────────────
      if (this._totalSttSpent >= config.maxSessionBudgetSTT) {
        this._sessionBudgetExceeded = true;
        logger.error(`🚨 SESSION BUDGET EXCEEDED — ${this._totalSttSpent.toFixed(2)} STT spent (limit: ${config.maxSessionBudgetSTT}). Halting.`);
      }

      // Auto-reset CEO if it's stuck (degraded cycle)
      if (!ceoDecisionMade && !shouldSkipExpensiveSteps && (degradedSteps > 0 || failedSteps > 0)) {
        logger.warn('⚠️ Cycle did not produce an on-chain decision — resetting CEO...');
        await this.recoverFromError();
      }

      const statusEmoji = result.success ? '✅' : (degradedSteps > 0 || skippedSteps > 0) ? '⚠️ DEGRADED' : '❌';
      logger.info(`\n${'═'.repeat(50)}`);
      logger.info(`  ${statusEmoji} Cycle #${cycleId} ${result.success ? 'Completed' : 'Finished with issues'} in ${(duration / 1000).toFixed(1)}s`);
      logger.info(`  Steps: ${succeededSteps} ok, ${degradedSteps} degraded, ${skippedSteps} skipped, ${failedSteps} failed`);
      logger.info(`  💸 STT spent this cycle: ~${cycleSttSpent.toFixed(4)} | Session total: ${this._totalSttSpent.toFixed(2)} / ${config.maxSessionBudgetSTT}`);
      if (!ceoDecisionMade) {
        logger.warn(`  ⚠️  No on-chain decision recorded`);
      }
      logger.info(`${'═'.repeat(50)}\n`);

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Cycle #${cycleId} failed: ${errorMsg}`);

      await this.recoverFromError();

      const result: CycleResult = {
        success: false,
        cycleId,
        startedAt,
        completedAt: new Date(),
        steps,
        error: errorMsg,
      };

      this._lastCycle = result;

      this._consecutiveFailures++;
      if (this._consecutiveFailures >= config.maxConsecutiveFailures) {
        this._circuitBreakerTripped = true;
        logger.error(`🚨 CIRCUIT BREAKER TRIPPED — ${this._consecutiveFailures} consecutive failures.`);
      }

      return result;
    } finally {
      this._isRunning = false;
      this._currentStep = 'IDLE';
    }
  }

  /**
   * Execute a single step with timing and error capture.
   * Returns the StepResult so the caller can decide whether to skip subsequent steps.
   */
  private async executeStep(
    step: CycleStep,
    steps: StepResult[],
    fn: () => Promise<Record<string, unknown> | void>
  ): Promise<StepResult> {
    this._currentStep = step;
    // Sync nonce before every step to prevent "nonce too low" errors
    await this.funding.syncNonce();
    const start = Date.now();

    try {
      const data = await fn();
      const record = (data as Record<string, unknown>) || undefined;
      const eventReceived = record?.eventReceived;

      const result: StepResult = {
        step,
        success: true,
        degraded: eventReceived === false,
        duration: Date.now() - start,
        data: record,
      };
      steps.push(result);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Step ${step} failed: ${errorMsg}`);
      const result: StepResult = {
        step,
        success: false,
        duration: Date.now() - start,
        error: errorMsg,
      };
      steps.push(result);
      return result;
    }
  }

  private emptyCycleResult(error: string): CycleResult {
    return {
      success: false,
      cycleId: this._cycleCount,
      startedAt: new Date(),
      completedAt: new Date(),
      steps: [],
      error,
    };
  }

  private async recoverFromError(): Promise<void> {
    try {
      await this.ceo.resetCycle();
    } catch {
      logger.warn('⚠️ Could not reset CEO cycle during recovery');
    }
  }
}
