import { ethers } from 'ethers';
import { config } from '../config';
import { logger } from '../logger';

// Minimal ABI for VaultShares
const VAULT_SHARES_ABI = [
  'function buyAsset(string symbol, uint256 sttAmount) external returns (uint256)',
  'function sellAsset(string symbol, uint256 syntheticAmount) external returns (uint256)',
  'function getTotalPortfolioValue() external view returns (uint256)',
  'function getSharePrice() external view returns (uint256)',
  'function getPortfolioAllocation() external view returns (string[] symbols, uint256[] values, uint256[] percentages)',
  'function getHeldSymbols() external view returns (string[])',
  'function totalSupply() external view returns (uint256)',
] as const;

// Minimal ABI for SyntheticSwapRouter
const SWAP_ROUTER_ABI = [
  'function quoteSyntheticForSTT(string symbol, uint256 sttAmount) external view returns (uint256)',
  'function quoteSTTForSynthetic(string symbol, uint256 syntheticAmount) external view returns (uint256)',
  'function getSupportedSymbols() external view returns (string[])',
] as const;

export interface AllocationTarget {
  symbol: string;
  percentage: number; // basis points (10000 = 100%)
}

export interface PortfolioStatus {
  totalValue: string;
  sharePrice: string;
  totalShares: string;
  allocation: { symbol: string; value: string; percentage: number }[];
}

export class PortfolioService {
  private vaultShares: ethers.Contract;
  private swapRouter: ethers.Contract;
  private wallet: ethers.Signer;

  constructor(wallet: ethers.Signer) {
    this.wallet = wallet;
    this.vaultShares = new ethers.Contract(
      config.addresses.vaultShares || ethers.ZeroAddress,
      VAULT_SHARES_ABI,
      wallet
    );
    this.swapRouter = new ethers.Contract(
      config.addresses.swapRouter || ethers.ZeroAddress,
      SWAP_ROUTER_ABI,
      wallet
    );
  }

  get isConfigured(): boolean {
    return config.addresses.vaultShares !== undefined && config.addresses.vaultShares !== ethers.ZeroAddress;
  }

  async getStatus(): Promise<PortfolioStatus> {
    const [totalValue, sharePrice, totalShares, allocation] = await Promise.all([
      this.vaultShares.getTotalPortfolioValue(),
      this.vaultShares.getSharePrice(),
      this.vaultShares.totalSupply(),
      this.vaultShares.getPortfolioAllocation(),
    ]);

    const [symbols, values, percentages] = allocation;
    const alloc = symbols.map((s: string, i: number) => ({
      symbol: s,
      value: ethers.formatEther(values[i]),
      percentage: Number(percentages[i]),
    }));

    return {
      totalValue: ethers.formatEther(totalValue),
      sharePrice: ethers.formatEther(sharePrice),
      totalShares: ethers.formatEther(totalShares),
      allocation: alloc,
    };
  }

  /**
   * Execute portfolio rebalance based on risk score and sentiment.
   * Simple strategy:
   *   - Risk < 30 (LOW):  60% crypto (20% each BTC/ETH/SOL), 40% STT
   *   - Risk 30-70 (MED): 40% crypto, 60% STT
   *   - Risk > 70 (HIGH): 10% crypto, 90% STT
   */
  async executeRebalance(riskScore: number): Promise<void> {
    if (!this.isConfigured) {
      logger.warn('Portfolio: VaultShares not configured, skipping rebalance');
      return;
    }

    const totalValue = await this.vaultShares.getTotalPortfolioValue();
    if (totalValue === 0n) {
      logger.info('Portfolio: No funds in vault, skipping rebalance');
      return;
    }

    // Determine target allocation based on risk
    let cryptoPercent: number;
    if (riskScore < 30) {
      cryptoPercent = 60;
    } else if (riskScore <= 70) {
      cryptoPercent = 40;
    } else {
      cryptoPercent = 10;
    }

    const symbols = ['bitcoin', 'ethereum', 'solana'];
    const perAssetPercent = cryptoPercent / symbols.length;
    if (!this.wallet.provider) {
      throw new Error('Wallet must be connected to a provider');
    }
    const sttBalance = await this.wallet.provider.getBalance(await this.vaultShares.getAddress());
    const totalValueNum = Number(ethers.formatEther(totalValue));

    logger.info(`📊 Portfolio Rebalance: Risk=${riskScore}, Target=${cryptoPercent}% crypto`);

    for (const symbol of symbols) {
      const targetValueSTT = (totalValueNum * perAssetPercent) / 100;
      const targetAmount = ethers.parseEther(targetValueSTT.toFixed(6));

      // Get current holding value for this symbol
      const [, values, ] = await this.vaultShares.getPortfolioAllocation();
      // Find current value (index 0 is STT, then heldSymbols)
      const heldSymbols = await this.vaultShares.getHeldSymbols();
      const idx = heldSymbols.indexOf(symbol);
      const currentValue = idx >= 0 ? values[idx + 1] : 0n;

      const diff = targetAmount - currentValue;
      const threshold = totalValue / 50n; // 2% threshold to avoid dust trades

      if (diff > threshold) {
        // Need to buy more
        const buyAmount = diff > sttBalance ? sttBalance / 2n : diff;
        if (buyAmount > 0n) {
          try {
            const tx = await this.vaultShares.buyAsset(symbol, buyAmount);
            await tx.wait();
            logger.info(`  ✅ Bought ${symbol}: ${ethers.formatEther(buyAmount)} STT`);
          } catch (e: any) {
            logger.error(`  ❌ Buy ${symbol} failed: ${e.message?.slice(0, 80)}`);
          }
        }
      } else if (-diff > threshold) {
        // Need to sell
        // For simplicity, sell proportionally
        logger.info(`  ℹ️ ${symbol}: over-allocated, would sell but skipping for safety`);
      } else {
        logger.info(`  ✅ ${symbol}: within target allocation`);
      }
    }
  }
}
