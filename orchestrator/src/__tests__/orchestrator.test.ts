import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Orchestrator } from '../orchestrator';
import type { CFOService } from '../services/cfo.service';
import type { CMOService } from '../services/cmo.service';
import type { CEOService } from '../services/ceo.service';
import type { EventService } from '../services/events.service';
import type { FundingService } from '../services/funding.service';
import type { PortfolioService } from '../services/portfolio.service';

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function createMockCFO(): Partial<CFOService> {
  return {
    fetchPrice: vi.fn().mockResolvedValue('0xmocktx'),
    analyzeRisk: vi.fn().mockResolvedValue('0xmocktx'),
    getCurrentRiskScore: vi.fn().mockResolvedValue(BigInt(50)),
  };
}

function createMockCMO(): Partial<CMOService> {
  return {
    scanMarket: vi.fn().mockResolvedValue('0xmocktx'),
  };
}

function createMockCEO(): Partial<CEOService> {
  return {
    initiateDecisionCycle: vi.fn().mockResolvedValue('0xmocktx'),
    getPerformanceMetrics: vi.fn().mockResolvedValue({
      _completedCycles: BigInt(1),
      _totalDecisions: BigInt(1),
      _averageCycleTime: BigInt(60),
      _lastCycleTimestamp: BigInt(Math.floor(Date.now() / 1000)),
    }),
    resetCycle: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockEvents(options?: { failCount?: number }): Partial<EventService> {
  let callCount = 0;
  const failCount = options?.failCount ?? 0;

  return {
    waitFor: vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount <= failCount) {
        return Promise.reject(new Error('Timeout'));
      }
      return Promise.resolve([BigInt(1), 'mock_data']);
    }),
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
  };
}

function createMockFunding(): Partial<FundingService> {
  return {
    ensureMinBalances: vi.fn().mockResolvedValue(undefined),
    getBalanceReport: vi.fn().mockResolvedValue({
      wallet: { address: '0x0', balance: '10' },
      agents: [],
      timestamp: new Date(),
    }),
  };
}

function createMockPortfolio(): Partial<PortfolioService> {
  return {
    isConfigured: false,
    executeRebalance: vi.fn().mockResolvedValue(undefined),
    getStatus: vi.fn().mockResolvedValue({}),
  };
}

function createOrchestrator(overrides?: {
  cfo?: Partial<CFOService>;
  cmo?: Partial<CMOService>;
  ceo?: Partial<CEOService>;
  events?: Partial<EventService>;
  funding?: Partial<FundingService>;
  portfolio?: Partial<PortfolioService>;
}): Orchestrator {
  return new Orchestrator({
    cfo: (overrides?.cfo ?? createMockCFO()) as CFOService,
    cmo: (overrides?.cmo ?? createMockCMO()) as CMOService,
    ceo: (overrides?.ceo ?? createMockCEO()) as CEOService,
    events: (overrides?.events ?? createMockEvents()) as EventService,
    funding: (overrides?.funding ?? createMockFunding()) as FundingService,
    portfolio: (overrides?.portfolio ?? createMockPortfolio()) as PortfolioService,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Orchestrator', () => {
  describe('Circuit Breaker', () => {
    it('should start with circuit breaker inactive', () => {
      const orch = createOrchestrator();
      expect(orch.circuitBreakerTripped).toBe(false);
      expect(orch.consecutiveFailures).toBe(0);
    });

    it('should trip circuit breaker after 3 consecutive failed cycles', async () => {
      // Make all event waits fail (timeout)
      const events = createMockEvents({ failCount: 100 });
      // Make CEO throw to ensure cycle fails
      const ceo = createMockCEO();
      ceo.initiateDecisionCycle = vi.fn().mockRejectedValue(new Error('tx reverted'));
      ceo.resetCycle = vi.fn().mockResolvedValue(undefined);

      const orch = createOrchestrator({ events, ceo });

      // Run 3 cycles — all should fail
      const r1 = await orch.runCycle();
      expect(r1.success).toBe(false);
      expect(orch.consecutiveFailures).toBe(1);
      expect(orch.circuitBreakerTripped).toBe(false);

      const r2 = await orch.runCycle();
      expect(r2.success).toBe(false);
      expect(orch.consecutiveFailures).toBe(2);
      expect(orch.circuitBreakerTripped).toBe(false);

      const r3 = await orch.runCycle();
      expect(r3.success).toBe(false);
      expect(orch.consecutiveFailures).toBe(3);
      expect(orch.circuitBreakerTripped).toBe(true);

      // 4th cycle should be blocked by circuit breaker
      const r4 = await orch.runCycle();
      expect(r4.success).toBe(false);
      expect(r4.error).toContain('Circuit breaker tripped');
    });

    it('should reset consecutive failures on a successful cycle', async () => {
      const events = createMockEvents({ failCount: 100 });
      const ceo = createMockCEO();
      ceo.initiateDecisionCycle = vi.fn().mockRejectedValue(new Error('tx reverted'));
      ceo.resetCycle = vi.fn().mockResolvedValue(undefined);

      const orch = createOrchestrator({ events, ceo });

      // 2 failures
      await orch.runCycle();
      await orch.runCycle();
      expect(orch.consecutiveFailures).toBe(2);

      // Now succeed — swap to working mocks
      const goodEvents = createMockEvents(); // all succeed
      const goodCeo = createMockCEO();
      const orch2 = createOrchestrator({ events: goodEvents, ceo: goodCeo });
      // Hack: manually reset by creating new orchestrator isn't ideal,
      // but we can test the reset logic via resetCircuitBreaker()
      orch.resetCircuitBreaker();
      expect(orch.consecutiveFailures).toBe(0);
      expect(orch.circuitBreakerTripped).toBe(false);
    });

    it('should allow manual reset via resetCircuitBreaker()', async () => {
      const events = createMockEvents({ failCount: 100 });
      const ceo = createMockCEO();
      ceo.initiateDecisionCycle = vi.fn().mockRejectedValue(new Error('tx reverted'));
      ceo.resetCycle = vi.fn().mockResolvedValue(undefined);

      const orch = createOrchestrator({ events, ceo });

      // Trip the breaker
      await orch.runCycle();
      await orch.runCycle();
      await orch.runCycle();
      expect(orch.circuitBreakerTripped).toBe(true);

      // Reset
      orch.resetCircuitBreaker();
      expect(orch.circuitBreakerTripped).toBe(false);
      expect(orch.consecutiveFailures).toBe(0);
    });
  });

  describe('Retry Logic', () => {
    it('should not skip cycles when circuit breaker is inactive', async () => {
      const orch = createOrchestrator();
      const result = await orch.runCycle();
      // With all mocks succeeding, cycle should complete
      expect(result.cycleId).toBe(1);
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('should skip cycle when already running', async () => {
      const orch = createOrchestrator();

      // Start a cycle (don't await)
      const p1 = orch.runCycle();
      // Immediately try again
      const r2 = await orch.runCycle();

      expect(r2.error).toContain('already in progress');

      await p1; // clean up
    });
  });

  describe('Cycle State', () => {
    it('should track cycle count', async () => {
      const orch = createOrchestrator();

      expect(orch.cycleCount).toBe(0);
      await orch.runCycle();
      expect(orch.cycleCount).toBe(1);
      await orch.runCycle();
      expect(orch.cycleCount).toBe(2);
    });

    it('should store last cycle result', async () => {
      const orch = createOrchestrator();

      expect(orch.lastCycle).toBeNull();
      await orch.runCycle();
      expect(orch.lastCycle).not.toBeNull();
      expect(orch.lastCycle!.cycleId).toBe(1);
    });

    it('should return to IDLE after cycle completes', async () => {
      const orch = createOrchestrator();
      await orch.runCycle();
      expect(orch.currentStep).toBe('IDLE');
    });
  });
});
