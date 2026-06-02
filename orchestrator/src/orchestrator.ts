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
import type { CycleStep, CycleResult, StepResult } from './types';

export class Orchestrator {
  private cfo: CFOService;
  private cmo: CMOService;
  private ceo: CEOService;
  private events: EventService;
  private funding: FundingService;

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
  }) {
    this.cfo = deps.cfo;
    this.cmo = deps.cmo;
    this.ceo = deps.ceo;
    this.events = deps.events;
    this.funding = deps.funding;
  }

  get isRunning(): boolean { return this._isRunning; }
  get currentStep(): CycleStep { return this._currentStep; }
  get cycleCount(): number { return this._cycleCount; }
  get lastCycle(): CycleResult | null { return this._lastCycle; }
  get uptime(): number { return Date.now() - this._startedAt; }

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

          // Wait for PriceFetched event
          try {
            await this.events.waitFor('PriceFetched');
          } catch {
            logger.warn(`⚠️ Timeout waiting for PriceFetched (${priceConfig.symbol}), continuing...`);
          }

          return { txHash, symbol: priceConfig.symbol };
        });
      }

      // ── Step 3: Analyze risk ──────────────────────────
      await this.executeStep('ANALYZING_RISK', steps, async () => {
        const txHash = await this.cfo.analyzeRisk();

        try {
          await this.events.waitFor('RiskAnalyzed');
        } catch {
          logger.warn('⚠️ Timeout waiting for RiskAnalyzed, continuing...');
        }

        const riskScore = await this.cfo.getCurrentRiskScore();
        return { txHash, riskScore };
      });

      // ── Step 4: Scan market ───────────────────────────
      await this.executeStep('SCANNING_MARKET', steps, async () => {
        const txHash = await this.cmo.scanMarket();

        // Wait for the chained SentimentAnalyzed event
        try {
          await this.events.waitFor('SentimentAnalyzed', config.eventTimeoutSeconds * 1000 * 2); // 2× timeout for chained ops
        } catch {
          logger.warn('⚠️ Timeout waiting for SentimentAnalyzed, continuing...');
        }

        return { txHash };
      });

      // ── Step 5: CEO Decision ──────────────────────────
      await this.executeStep('CEO_DECISION', steps, async () => {
        const txHash = await this.ceo.initiateDecisionCycle();

        try {
          await this.events.waitFor('CycleCompleted', config.eventTimeoutSeconds * 1000 * 2); // 2× timeout for full cycle
        } catch {
          logger.warn('⚠️ Timeout waiting for CycleCompleted, continuing...');
        }

        const metrics = await this.ceo.getPerformanceMetrics();
        return { txHash, ...metrics };
      });

      // ── Cycle complete ────────────────────────────────
      this._currentStep = 'COMPLETED';
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      const result: CycleResult = {
        success: true,
        cycleId,
        startedAt,
        completedAt,
        steps,
      };

      this._lastCycle = result;

      logger.info(`\n${'═'.repeat(50)}`);
      logger.info(`  ✅ Cycle #${cycleId} Completed in ${(duration / 1000).toFixed(1)}s`);
      logger.info(`  Steps: ${steps.filter(s => s.success).length}/${steps.length} succeeded`);
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
      steps.push({
        step,
        success: true,
        duration: Date.now() - start,
        data: (data as Record<string, unknown>) || undefined,
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
      // Rethrow for critical steps to abort the cycle
      if (step === 'CEO_DECISION' || step === 'ANALYZING_RISK') {
        throw error;
      }
      // Non-critical steps: continue to next step
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
