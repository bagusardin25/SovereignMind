import { ethers } from 'ethers';
import type { Contracts } from './contracts';
import { logger } from '../logger';

// ---------------------------------------------------------------------------
// CyclePhase Enum (mirrors the Solidity enum in CEOAgent.sol)
// ---------------------------------------------------------------------------

export enum CyclePhase {
  IDLE = 0,
  GATHERING_DATA = 1,
  ANALYZING = 2,
  DECIDING = 3,
  EXECUTING = 4,
}

// ---------------------------------------------------------------------------
// CEO Service
// ---------------------------------------------------------------------------

/**
 * High-level interface to the on-chain CEOAgent contract.
 * Manages the autonomous decision cycle and exposes performance metrics.
 */
export class CEOService {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  // -----------------------------------------------------------------------
  // Write operations
  // -----------------------------------------------------------------------

  /**
   * Kick off a new CEO decision cycle.
   *
   * Pre-flight checks:
   *  1. Ensures the contract is in the IDLE phase (resets if not).
   *  2. Waits out any remaining cooldown period.
   *
   * The CEO contract uses its own native balance for the LLM request,
   * so no explicit deposit is sent with this transaction.
   *
   * @returns The transaction hash.
   */
  async initiateDecisionCycle(): Promise<string> {
    logger.info('🧠 Initiating CEO decision cycle...');

    // 1. Phase guard – must be IDLE before starting
    const phase = await this.getCurrentPhase();
    if (phase !== CyclePhase.IDLE) {
      logger.warn(
        `⚠️ CEO is not in IDLE phase (current: ${CyclePhase[phase]}). Attempting reset...`,
      );
      await this.resetCycle();
    }

    // 2. Cooldown guard
    const nextAllowed = await this.contracts.ceo.getNextCycleAllowed();
    const now = Math.floor(Date.now() / 1000);
    if (now < Number(nextAllowed)) {
      const waitSecs = Number(nextAllowed) - now;
      logger.info(`⏳ Cooldown active. Waiting ${waitSecs}s...`);
      await new Promise((resolve) => setTimeout(resolve, waitSecs * 1000));
    }

    // 3. Submit the transaction
    const tx = await this.contracts.ceo.initiateDecisionCycle();
    await tx.wait();
    logger.info(`✅ Decision cycle initiated: ${tx.hash}`);
    return tx.hash;
  }

  /**
   * Force-reset the CEO cycle back to IDLE.
   * Useful when a previous cycle stalled in a non-terminal phase.
   */
  async resetCycle(): Promise<void> {
    try {
      const tx = await this.contracts.ceo.resetCycle();
      await tx.wait();
      logger.info('🔄 CEO cycle reset to IDLE');
    } catch (error) {
      logger.error(`❌ Failed to reset CEO cycle: ${error}`);
    }
  }

  // -----------------------------------------------------------------------
  // Read-only queries
  // -----------------------------------------------------------------------

  /** Get the current phase of the CEO decision cycle. */
  async getCurrentPhase(): Promise<CyclePhase> {
    const phase = await this.contracts.ceo.getCurrentPhase();
    return Number(phase) as CyclePhase;
  }

  /**
   * Retrieve high-level performance metrics for the CEO agent.
   *
   * @returns An object containing cycle counts, decision totals,
   *          average cycle duration, and the last cycle timestamp.
   */
  async getPerformanceMetrics(): Promise<{
    completedCycles: number;
    totalDecisions: number;
    avgCycleTime: number;
    lastCycleTimestamp: number;
  }> {
    const [cycles, decisions, avgTime, lastTs] =
      await this.contracts.ceo.getPerformanceMetrics();
    return {
      completedCycles: Number(cycles),
      totalDecisions: Number(decisions),
      avgCycleTime: Number(avgTime),
      lastCycleTimestamp: Number(lastTs),
    };
  }

  /** Get the total number of decisions recorded on-chain. */
  async getDecisionCount(): Promise<number> {
    const count = await this.contracts.ceo.getDecisionCount();
    return Number(count);
  }
}
