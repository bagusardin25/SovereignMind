// ============================================================
// SovereignMind — Cron-based Cycle Scheduler
// ============================================================

import cron from 'node-cron';
import { config } from './config';
import { logger } from './logger';
import { Orchestrator } from './orchestrator';

export class Scheduler {
  private orchestrator: Orchestrator;
  private job: cron.ScheduledTask | null = null;
  private _nextCycleAt: Date | null = null;
  private _isActive = false;

  constructor(orchestrator: Orchestrator) {
    this.orchestrator = orchestrator;
  }

  get isActive(): boolean { return this._isActive; }
  get nextCycleAt(): Date | null { return this._nextCycleAt; }

  /**
   * Start the scheduler. Runs a cycle immediately, then on schedule.
   */
  async start(): Promise<void> {
    if (this._isActive) {
      logger.warn('Scheduler already active');
      return;
    }

    this._isActive = true;
    const interval = config.cycleIntervalMinutes;

    logger.info(`⏰ Scheduler started — cycle every ${interval} minutes`);

    // Run first cycle immediately
    logger.info('🚀 Running initial cycle...');
    await this.orchestrator.runCycle();

    if (config.runOnce) {
      logger.info('🏁 --once flag detected, exiting after single cycle');
      this._isActive = false;
      return;
    }

    // Schedule recurring cycles
    const cronExpr = `*/${interval} * * * *`;
    this.job = cron.schedule(cronExpr, async () => {
      this.updateNextCycleTime();
      logger.info('⏰ Scheduled cycle triggered');
      await this.orchestrator.runCycle();
      this.updateNextCycleTime();
    });

    this.updateNextCycleTime();
    logger.info(`📅 Next cycle at: ${this._nextCycleAt?.toLocaleTimeString()}`);
  }

  /**
   * Stop the scheduler.
   */
  stop(): void {
    if (this.job) {
      this.job.stop();
      this.job = null;
    }
    this._isActive = false;
    this._nextCycleAt = null;
    logger.info('⏸️ Scheduler stopped');
  }

  /**
   * Resume the scheduler.
   */
  async resume(): Promise<void> {
    this.stop();
    await this.start();
  }

  private updateNextCycleTime(): void {
    this._nextCycleAt = new Date(
      Date.now() + config.cycleIntervalMinutes * 60 * 1000
    );
  }
}
