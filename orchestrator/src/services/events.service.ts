import { ethers } from 'ethers';
import type { Contracts } from './contracts';
import { config } from '../config';
import { logger } from '../logger';

// ---------------------------------------------------------------------------
// Event Service
// ---------------------------------------------------------------------------

/**
 * Provides promise-based event waiting and persistent monitoring
 * for all SovereignMind on-chain events.
 */
export class EventService {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  // -----------------------------------------------------------------------
  // Event → Contract mapping
  // -----------------------------------------------------------------------

  /**
   * Resolve the originating contract for a given event name.
   * Throws if the event name is not recognised.
   */
  private getContractForEvent(eventName: string): ethers.Contract {
    const map: Record<string, ethers.Contract> = {
      // CFO events
      PriceFetched: this.contracts.cfo,
      RiskAnalyzed: this.contracts.cfo,
      RebalanceRecommended: this.contracts.cfo,
      AnalysisStarted: this.contracts.cfo,
      // CMO events
      WebScraped: this.contracts.cmo,
      SentimentAnalyzed: this.contracts.cmo,
      MarketAlert: this.contracts.cmo,
      ScanStarted: this.contracts.cmo,
      // CEO events
      DecisionCycleStarted: this.contracts.ceo,
      DecisionMade: this.contracts.ceo,
      DecisionExecuted: this.contracts.ceo,
      CycleCompleted: this.contracts.ceo,
      // Treasury events
      NativeDeposited: this.contracts.treasury,
      DecisionRecorded: this.contracts.treasury,
    };

    const contract = map[eventName];
    if (!contract) {
      throw new Error(`Unknown event: ${eventName}`);
    }
    return contract;
  }

  // -----------------------------------------------------------------------
  // One-shot event waiting
  // -----------------------------------------------------------------------

  /**
   * Wait for a specific event to be emitted.
   * Uses real-time listener first, falls back to log polling if the
   * WebSocket/RPC listener times out (common on Somnia testnet).
   *
   * @param eventName - The Solidity event name (e.g. `"PriceFetched"`).
   * @param timeoutMs - Optional override for the default timeout (ms).
   * @returns The event arguments array when the event fires.
   * @throws On timeout.
   */
  async waitFor(eventName: string, timeoutMs?: number): Promise<unknown[]> {
    const timeout = timeoutMs ?? config.eventTimeoutSeconds * 1000;
    const contract = this.getContractForEvent(eventName);
    const startBlock = await contract.runner?.provider?.getBlockNumber() ?? 0;

    return new Promise((resolve, reject) => {
      let settled = false;

      const timer = setTimeout(async () => {
        if (settled) return;
        contract.removeAllListeners(eventName);

        // Fallback: poll recent logs via queryFilter
        try {
          logger.debug(`🔍 Polling fallback for ${eventName} from block ${startBlock}...`);
          const filter = contract.filters[eventName]?.();
          if (filter) {
            const events = await contract.queryFilter(filter, Math.max(0, startBlock - 5));
            if (events.length > 0 && !settled) {
              settled = true;
              const latest = events[events.length - 1] as ethers.EventLog;
              const args = latest.args ? Array.from(latest.args) : [];
              logger.info(`📡 Event found via polling: ${eventName}`, {
                args: args.map((a) => (typeof a === 'bigint' ? a.toString() : a)),
              });
              resolve(args);
              return;
            }
          }
        } catch (pollError) {
          logger.debug(`Polling fallback failed for ${eventName}: ${pollError}`);
        }

        if (!settled) {
          settled = true;
          reject(new Error(`Timeout (${timeout}ms) waiting for event: ${eventName}`));
        }
      }, timeout);

      contract.once(eventName, (...args: unknown[]) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        logger.info(`📡 Event received: ${eventName}`, {
          args: args
            .slice(0, -1) // last arg is the EventLog object
            .map((a) => (typeof a === 'bigint' ? a.toString() : a)),
        });
        resolve(args);
      });

      logger.debug(`👂 Listening for event: ${eventName} (timeout: ${timeout}ms)`);
    });
  }

  // -----------------------------------------------------------------------
  // Persistent monitoring (logging / audit trail)
  // -----------------------------------------------------------------------

  /**
   * Start persistent listeners for key on-chain events.
   * All received events are logged for auditing purposes.
   */
  startMonitoring(): void {
    const events = [
      { contract: this.contracts.cfo, name: 'PriceFetched' },
      { contract: this.contracts.cfo, name: 'RiskAnalyzed' },
      { contract: this.contracts.cmo, name: 'SentimentAnalyzed' },
      { contract: this.contracts.ceo, name: 'DecisionMade' },
      { contract: this.contracts.ceo, name: 'CycleCompleted' },
      { contract: this.contracts.treasury, name: 'DecisionRecorded' },
    ];

    for (const { contract, name } of events) {
      contract.on(name, (...args: unknown[]) => {
        logger.info(`🔔 [Monitor] ${name}`, {
          data: args
            .slice(0, -1)
            .map((a) => (typeof a === 'bigint' ? a.toString() : a)),
        });
      });
    }

    logger.info('📡 Event monitoring started for all contracts');
  }

  /**
   * Remove all persistent event listeners.
   */
  stopMonitoring(): void {
    this.contracts.cfo.removeAllListeners();
    this.contracts.cmo.removeAllListeners();
    this.contracts.ceo.removeAllListeners();
    this.contracts.treasury.removeAllListeners();
    logger.info('📡 Event monitoring stopped');
  }
}
