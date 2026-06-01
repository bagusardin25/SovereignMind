import { ethers } from 'ethers';
import { config } from '../config';
import { logger } from '../logger';
import type { BalanceReport } from '../types';

// ---------------------------------------------------------------------------
// Funding Service
// ---------------------------------------------------------------------------

/**
 * Checks native-token (STT) balances for each agent contract and
 * automatically tops them up from the orchestrator wallet when they
 * fall below the configured minimum.
 */
export class FundingService {
  private wallet: ethers.Wallet;
  private provider: ethers.Provider;

  constructor(wallet: ethers.Wallet, provider: ethers.Provider) {
    this.wallet = wallet;
    this.provider = provider;
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  /** Agent contracts whose balances we manage. */
  private get agentContracts() {
    return [
      { name: 'CEOAgent', address: config.addresses.ceoAgent },
      { name: 'CFOAgent', address: config.addresses.cfoAgent },
      { name: 'CMOAgent', address: config.addresses.cmoAgent },
    ];
  }

  // -----------------------------------------------------------------------
  // Balance reporting
  // -----------------------------------------------------------------------

  /**
   * Build a full balance report covering the orchestrator wallet
   * and every managed agent contract.
   */
  async getBalanceReport(): Promise<BalanceReport> {
    const walletBalance = await this.provider.getBalance(this.wallet.address);

    const agents = await Promise.all(
      this.agentContracts.map(async ({ name, address }) => {
        const balance = await this.provider.getBalance(address);
        return {
          name,
          address,
          balance: ethers.formatEther(balance),
          belowMinimum: balance < ethers.parseEther(config.minAgentBalanceSTT),
        };
      }),
    );

    return {
      wallet: {
        address: this.wallet.address,
        balance: ethers.formatEther(walletBalance),
      },
      agents,
      timestamp: new Date(),
    };
  }

  // -----------------------------------------------------------------------
  // Auto-funding
  // -----------------------------------------------------------------------

  /**
   * Ensure every agent contract holds at least `config.minAgentBalanceSTT`.
   * Contracts that fall below the threshold are sent `config.autoFundAmountSTT`
   * from the orchestrator wallet.
   */
  async ensureMinBalances(): Promise<void> {
    const minBalance = ethers.parseEther(config.minAgentBalanceSTT);
    const fundAmount = ethers.parseEther(config.autoFundAmountSTT);
    const walletBalance = await this.provider.getBalance(this.wallet.address);

    for (const { name, address } of this.agentContracts) {
      const balance = await this.provider.getBalance(address);

      if (balance < minBalance) {
        logger.warn(
          `💰 ${name} balance low: ${ethers.formatEther(balance)} STT`,
        );

        // Ensure the wallet itself can cover the top-up
        if (walletBalance < fundAmount) {
          logger.error(
            `❌ Wallet balance too low to fund ${name}. ` +
              `Wallet: ${ethers.formatEther(walletBalance)} STT`,
          );
          continue;
        }

        try {
          const tx = await this.wallet.sendTransaction({
            to: address,
            value: fundAmount,
          });
          await tx.wait();
          logger.info(
            `✅ Funded ${name} with ${config.autoFundAmountSTT} STT (tx: ${tx.hash})`,
          );
        } catch (error) {
          logger.error(`❌ Failed to fund ${name}: ${error}`);
        }
      } else {
        logger.debug(
          `✓ ${name} balance OK: ${ethers.formatEther(balance)} STT`,
        );
      }
    }
  }
}
