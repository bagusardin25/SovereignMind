import { ethers } from 'ethers';
import type { Contracts } from './contracts';
import { calculateDeposit } from './contracts';
import { config } from '../config';
import { logger } from '../logger';

// ---------------------------------------------------------------------------
// CMO Service
// ---------------------------------------------------------------------------

/**
 * High-level interface to the on-chain CMOAgent contract.
 * Handles market scanning (web scraping → sentiment analysis) and
 * read-only queries for signal/sentiment data.
 */
export class CMOService {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  // -----------------------------------------------------------------------
  // Write operations
  // -----------------------------------------------------------------------

  /**
   * Trigger a market scan.
   *
   * The CMO contract performs a two-step pipeline:
   *   1. Web-scrape the provided URL (parseWeb agent).
   *   2. Analyse the scraped content with an LLM (uses contract balance).
   *
   * **Important:** The contract must hold enough native balance for the
   * second (LLM) request that is chained internally.
   *
   * @param url - Optional URL override; defaults to `config.marketScanUrl`.
   * @returns The transaction hash.
   */
  async scanMarket(url?: string): Promise<string> {
    const scanUrl = url ?? config.marketScanUrl;
    logger.info(`🌐 Scanning market: ${scanUrl}`);

    // Deposit covers the first request (parseWeb agent)
    const deposit = await calculateDeposit(
      this.contracts,
      () => this.contracts.cmo.parseWebAgentId(),
    );
    logger.debug(`Deposit required: ${ethers.formatEther(deposit)} STT`);

    const tx = await this.contracts.cmo.scanMarket(scanUrl, {
      value: deposit,
    });
    await tx.wait();
    logger.info(`✅ Market scan tx sent: ${tx.hash}`);
    return tx.hash;
  }

  // -----------------------------------------------------------------------
  // Read-only queries
  // -----------------------------------------------------------------------

  /** Get the total number of recorded market signals. */
  async getSignalCount(): Promise<number> {
    const count = await this.contracts.cmo.getSignalCount();
    return Number(count);
  }

  /**
   * Retrieve the aggregated sentiment breakdown.
   *
   * @returns An object with `bullish`, `bearish`, `neutral` counts and the
   *          `dominant` sentiment enum value.
   */
  async getAggregatedSentiment(): Promise<{
    bullish: number;
    bearish: number;
    neutral: number;
    dominant: number;
  }> {
    const [bullish, bearish, neutral, dominant] =
      await this.contracts.cmo.getAggregatedSentiment();
    return {
      bullish: Number(bullish),
      bearish: Number(bearish),
      neutral: Number(neutral),
      dominant: Number(dominant),
    };
  }
}
