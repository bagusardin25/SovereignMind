import { ethers } from 'ethers';
import type { Contracts } from './contracts';
import { calculateDeposit } from './contracts';
import { logger } from '../logger';
import type { PriceConfig } from '../types';

// ---------------------------------------------------------------------------
// CFO Service
// ---------------------------------------------------------------------------

/**
 * High-level interface to the on-chain CFOAgent contract.
 * Covers price fetching, risk analysis, and read-only queries.
 */
export class CFOService {
  private contracts: Contracts;

  constructor(contracts: Contracts) {
    this.contracts = contracts;
  }

  // -----------------------------------------------------------------------
  // Write operations
  // -----------------------------------------------------------------------

  /**
   * Fetch the current price for a given symbol via the on-chain JSON-API agent.
   *
   * @param priceConfig - Contains `symbol`, `apiUrl`, and `jsonPath` for the request.
   * @returns The transaction hash of the submitted request.
   */
  async fetchPrice(priceConfig: PriceConfig): Promise<string> {
    const { symbol, apiUrl, jsonPath } = priceConfig;
    logger.info(`📊 Fetching price for ${symbol}...`, { apiUrl, jsonPath });

    // Calculate the required deposit for the JSON-API agent
    const deposit = await calculateDeposit(
      this.contracts,
      () => this.contracts.cfo.jsonApiAgentId(),
    );
    logger.debug(`Deposit required: ${ethers.formatEther(deposit)} STT`);

    const tx = await this.contracts.cfo.fetchPrice(symbol, apiUrl, jsonPath, {
      value: deposit,
    });
    await tx.wait();
    logger.info(`✅ Price fetch tx sent for ${symbol}: ${tx.hash}`);
    return tx.hash;
  }

  /**
   * Trigger the on-chain risk analysis via the LLM agent.
   *
   * @returns The transaction hash.
   */
  async analyzeRisk(): Promise<string> {
    logger.info('🔍 Analyzing risk...');

    const deposit = await calculateDeposit(
      this.contracts,
      () => this.contracts.cfo.llmAgentId(),
    );
    logger.debug(`Deposit required: ${ethers.formatEther(deposit)} STT`);

    const tx = await this.contracts.cfo.analyzeRisk({ value: deposit });
    await tx.wait();
    logger.info(`✅ Risk analysis tx sent: ${tx.hash}`);
    return tx.hash;
  }

  // -----------------------------------------------------------------------
  // Read-only queries
  // -----------------------------------------------------------------------

  /** Get the latest aggregated risk score (0-100). */
  async getCurrentRiskScore(): Promise<number> {
    const score = await this.contracts.cfo.getCurrentRiskScore();
    return Number(score);
  }

  /** Get the list of symbols the CFO is currently tracking. */
  async getTrackedSymbols(): Promise<string[]> {
    return await this.contracts.cfo.getTrackedSymbols();
  }
}
