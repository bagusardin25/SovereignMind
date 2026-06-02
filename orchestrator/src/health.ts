// ============================================================
// SovereignMind — Health & Status HTTP Server
// ============================================================

import express from 'express';
import { config } from './config';
import { logger } from './logger';
import { Orchestrator } from './orchestrator';
import { Scheduler } from './scheduler';
import { FundingService } from './services/funding.service';
import type { HealthResponse, OrchestratorStatus } from './types';

export class HealthServer {
  private app: express.Application;
  private orchestrator: Orchestrator;
  private scheduler: Scheduler;
  private funding: FundingService;
  private startedAt = Date.now();

  constructor(
    orchestrator: Orchestrator,
    scheduler: Scheduler,
    funding: FundingService
  ) {
    this.orchestrator = orchestrator;
    this.scheduler = scheduler;
    this.funding = funding;
    this.app = express();
    this.app.use(express.json());
    // CORS with origin allowlist
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,https://sovereignmind-app.vercel.app').split(',');
    this.app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
      const origin = _req.headers.origin || '';
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        res.header('Access-Control-Allow-Origin', origin);
      }
      res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (_req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
      }
      next();
    });
    this.setupRoutes();
  }

  /**
   * Auth middleware for mutating endpoints.
   * If AUTH_TOKEN env is set, requires Bearer token.
   */
  private authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const authToken = process.env.AUTH_TOKEN || '';
    if (!authToken) {
      next(); // No token configured = dev mode, allow all
      return;
    }
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token !== authToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', async (_req, res) => {
      const status = this.orchestrator.isRunning ? 'healthy' : 'degraded';
      const response: HealthResponse = {
        status,
        uptime: Date.now() - this.startedAt,
        orchestrator: this.getStatus(),
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    });

    // Detailed status
    this.app.get('/status', async (_req, res) => {
      try {
        const balances = await this.funding.getBalanceReport();
        res.json({
          ...this.getStatus(),
          balances,
          scheduler: {
            isActive: this.scheduler.isActive,
            nextCycleAt: this.scheduler.nextCycleAt,
            intervalMinutes: config.cycleIntervalMinutes,
          },
        });
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // Manual trigger
    this.app.post('/trigger', this.authMiddleware.bind(this), async (_req, res) => {
      if (this.orchestrator.isRunning) {
        res.status(409).json({ error: 'Cycle already in progress' });
        return;
      }

      res.json({ message: 'Cycle triggered', cycleId: this.orchestrator.cycleCount + 1 });

      // Run asynchronously
      this.orchestrator.runCycle().catch((err) => {
        logger.error('Manual trigger failed:', err);
      });
    });

    // Stop scheduler
    this.app.post('/stop', this.authMiddleware.bind(this), (_req, res) => {
      this.scheduler.stop();
      res.json({ message: 'Scheduler stopped' });
    });

    // Resume scheduler
    this.app.post('/resume', this.authMiddleware.bind(this), async (_req, res) => {
      await this.scheduler.resume();
      res.json({ message: 'Scheduler resumed' });
    });

    // Balance report
    this.app.get('/balances', async (_req, res) => {
      try {
        const report = await this.funding.getBalanceReport();
        res.json(report);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });
  }

  private getStatus(): OrchestratorStatus {
    return {
      isRunning: this.orchestrator.isRunning,
      currentStep: this.orchestrator.currentStep,
      cycleCount: this.orchestrator.cycleCount,
      lastCycle: this.orchestrator.lastCycle,
      nextCycleAt: this.scheduler.nextCycleAt,
      uptime: this.orchestrator.uptime,
      balances: null,
    };
  }

  listen(port?: number): void {
    const p = port || config.healthPort;
    this.app.listen(p, () => {
      logger.info(`📊 Health server listening on http://localhost:${p}`);
      logger.info(`   GET  /health   — Health check`);
      logger.info(`   GET  /status   — Detailed status`);
      logger.info(`   GET  /balances — Contract balances`);
      logger.info(`   POST /trigger  — Manual cycle trigger`);
      logger.info(`   POST /stop     — Stop scheduler`);
      logger.info(`   POST /resume   — Resume scheduler`);
    });
  }
}
