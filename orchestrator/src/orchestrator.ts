// ============================================================
// SovereignMind — Main Orchestration Engine
// ============================================================
// Runs one complete decision cycle:
// Fund → Fetch Prices → Analyze Risk → Scan Market → CEO Decision

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

  /**
   * Wait for an on-chain event with timeout.
   * Returns true if the event was received, false on timeout.
   * Does NOT throw — lets the caller decide how to handle.
   */
  private async waitForEvent(eventName: string, timeoutMs?: number): Promise<boolean> {
    try {
      await this.events.waitFor(eventName, timeoutMs);
      return true;
    } catch {
      logger.warn(`⚠️ Timeout waiting for ${eventName}`);
      return false;
    }
  }

  /**
   * Run one complete decision cycle.
   */
  async runCycle(): Promise<CycleResult> {
    if (this._isRunning) {
      logger.warn('⚠️ Cycle already in progress, skipping');
      return {
        success: false,
        cycleId: this._cycleCount,
        startedAt: new Date(),
        completedAt: new Date(),
        steps: [],
        error: 'Cycle already in progress',
      };
    }

    this._isRunning = true;
    const cycleId = ++this._cycleCount;
    const startedAt = new Date();
    const steps: StepResult[] = [];

    logger.info(`\n${'═'.repeat(50)}`);
    logger.info(`  🔄 Decision Cycle #${cycleId} Starting`);
    logger.info(`${'═'.repeat(50)}\n`);

    try {
      // ── Step 1: Fund agent contracts ──────────────────
      await this.executeStep('FUNDING', steps, async () => {
        await this.funding.ensureMinBalances();
      });

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
      await this.executeStep('SCANNING_MARKET', steps, async () => {
        const txHash = await this.cmo.scanMarket();

        const eventReceived = await this.waitForEvent('SentimentAnalyzed', config.eventTimeoutSeconds * 1000 * 2);

        return { txHash, eventReceived };
      });

      // ── Step 5: CEO Decision ──────────────────────────
      await this.executeStep('CEO_DECISION', steps, async () => {
        const txHash = await this.ceo.initiateDecisionCycle();

        const eventReceived = await this.waitForEvent('CycleCompleted', config.eventTimeoutSeconds * 1000 * 2);

        const metrics = await this.ceo.getPerformanceMetrics();
        return { txHash, ...metrics, eventReceived };
      });

      // ── Step 6: Portfolio Rebalance ──────────────────────
      if (this.portfolio.isConfigured) {
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

      const succeededSteps = steps.filter(s => s.success).length;
      const failedSteps = steps.filter(s => !s.success).length;
      const degradedSteps = steps.filter(s => s.degraded).length;

      // A cycle is only truly successful if no steps failed AND
      // the CEO_DECISION step actually produced an on-chain decision (not degraded)
      const ceoStep = steps.find(s => s.step === 'CEO_DECISION');
      const ceoDecisionMade = ceoStep?.success === true && ceoStep?.degraded !== true;

      const result: CycleResult = {
        success: failedSteps === 0 && ceoDecisionMade,
        cycleId,
        startedAt,
        completedAt,
        steps,
        degradedStepCount: degradedSteps,
      };

      this._lastCycle = result;

      // Auto-reset CEO if it's stuck (degraded cycle)
      if (!ceoDecisionMade && (degradedSteps > 0 || failedSteps > 0)) {
        logger.warn('⚠️ Cycle did not produce an on-chain decision — resetting CEO...');
        await this.recoverFromError();
      }

      const statusEmoji = result.success ? '✅' : degradedSteps > 0 ? '⚠️ DEGRADED' : '❌';
      logger.info(`\n${'═'.repeat(50)}`);
      logger.info(`  ${statusEmoji} Cycle #${cycleId} ${result.success ? 'Completed' : 'Finished with issues'} in ${(duration / 1000).toFixed(1)}s`);
      logger.info(`  Steps: ${succeededSteps} ok, ${degradedSteps} degraded (event timeout), ${failedSteps} failed`);
      if (!ceoDecisionMade) {
        logger.warn(`  ⚠️  Somnia Agent Runner did not respond — no on-chain decision recorded`);
      }
      logger.info(`${'═'.repeat(50)}\n`);

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Cycle #${cycleId} failed: ${errorMsg}`);

      // Attempt error recovery
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
      return result;
    } finally {
      this._isRunning = false;
      this._currentStep = 'IDLE';
    }
  }

  /**
   * Execute a single step with timing and error capture.
   * Marks step as degraded if data contains eventReceived: false.
   */
  private async executeStep(
    step: CycleStep,
    steps: StepResult[],
    fn: () => Promise<Record<string, unknown> | void>
  ): Promise<void> {
    this._currentStep = step;
    const start = Date.now();

    try {
      const data = await fn();
      const record = (data as Record<string, unknown>) || undefined;
      const eventReceived = record?.eventReceived;

      steps.push({
        step,
        success: true,
        degraded: eventReceived === false,
        duration: Date.now() - start,
        data: record,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Step ${step} failed: ${errorMsg}`);
      steps.push({
        step,
        success: false,
        duration: Date.now() - start,
        error: errorMsg,
      });
    }
  }

  /**
   * Attempt to recover from errors (e.g., reset stuck CEO cycle).
   */
  private async recoverFromError(): Promise<void> {
    try {
      await this.ceo.resetCycle();
    } catch {
      logger.warn('⚠️ Could not reset CEO cycle during recovery');
    }
  }
}
