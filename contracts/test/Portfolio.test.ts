import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Synthetic Portfolio System", function () {
  async function deployPortfolioFixture() {
    const [owner, user1, user2, manager] = await ethers.getSigners();

    // 1. Deploy PriceOracle
    const Oracle = await ethers.getContractFactory("PriceOracle");
    const oracle = await Oracle.deploy();
    const oracleAddr = await oracle.getAddress();

    // 2. Deploy SyntheticTokens
    const SyntheticToken = await ethers.getContractFactory("SyntheticToken");
    const sBTC = await SyntheticToken.deploy("Synthetic Bitcoin", "sBTC", "bitcoin");
    const sETH = await SyntheticToken.deploy("Synthetic Ethereum", "sETH", "ethereum");
    const sSOL = await SyntheticToken.deploy("Synthetic Solana", "sSOL", "solana");

    // 3. Deploy SwapRouter
    const Router = await ethers.getContractFactory("SyntheticSwapRouter");
    const router = await Router.deploy(oracleAddr);
    const routerAddr = await router.getAddress();

    // 4. Deploy VaultShares
    const Vault = await ethers.getContractFactory("VaultShares");
    const vault = await Vault.deploy(oracleAddr, routerAddr);
    const vaultAddr = await vault.getAddress();

    // 5. Configure roles
    const UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPDATER_ROLE"));
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const EXECUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("EXECUTOR_ROLE"));
    const PORTFOLIO_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PORTFOLIO_MANAGER_ROLE"));

    // Oracle: owner can update prices
    await oracle.grantRole(UPDATER_ROLE, owner.address);

    // Tokens: router can mint/burn
    await sBTC.grantRole(MINTER_ROLE, routerAddr);
    await sETH.grantRole(MINTER_ROLE, routerAddr);
    await sSOL.grantRole(MINTER_ROLE, routerAddr);

    // Router: register tokens, vault can execute swaps
    await router.registerSyntheticToken("bitcoin", await sBTC.getAddress());
    await router.registerSyntheticToken("ethereum", await sETH.getAddress());
    await router.registerSyntheticToken("solana", await sSOL.getAddress());
    await router.grantRole(EXECUTOR_ROLE, vaultAddr);

    // Vault: manager can manage portfolio
    await vault.grantRole(PORTFOLIO_MANAGER_ROLE, manager.address);

    // Set prices: BTC=$100k, ETH=$3.5k, SOL=$180, STT=$1
    await oracle.updatePrice("bitcoin", 100_000_00000000n);   // $100,000 × 1e8
    await oracle.updatePrice("ethereum", 3_500_00000000n);     // $3,500 × 1e8
    await oracle.updatePrice("solana", 180_00000000n);         // $180 × 1e8
    // STT default = 1e8 ($1)

    return { oracle, sBTC, sETH, sSOL, router, vault, owner, user1, user2, manager };
  }

  // ═══════════════════════════════════════════════════════
  //  PriceOracle Tests
  // ═══════════════════════════════════════════════════════
  describe("PriceOracle", function () {
    it("should store and return prices", async function () {
      const { oracle } = await loadFixture(deployPortfolioFixture);
      const [price, updatedAt] = await oracle.getPrice("bitcoin");
      expect(price).to.equal(100_000_00000000n);
      expect(updatedAt).to.be.gt(0);
    });

    it("should track symbols", async function () {
      const { oracle } = await loadFixture(deployPortfolioFixture);
      const symbols = await oracle.getSymbols();
      expect(symbols).to.include("bitcoin");
      expect(symbols).to.include("ethereum");
      expect(symbols).to.include("solana");
    });

    it("should revert for unknown symbol", async function () {
      const { oracle } = await loadFixture(deployPortfolioFixture);
      await expect(oracle.getPrice("unknown")).to.be.revertedWithCustomError(
        oracle,
        "PriceNotAvailable"
      );
    });

    it("should allow admin to set STT price", async function () {
      const { oracle, owner } = await loadFixture(deployPortfolioFixture);
      await oracle.setSTTPrice(2_00000000n); // $2
      expect(await oracle.getSTTPrice()).to.equal(2_00000000n);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  SyntheticToken Tests
  // ═══════════════════════════════════════════════════════
  describe("SyntheticToken", function () {
    it("should have correct name and symbol", async function () {
      const { sBTC } = await loadFixture(deployPortfolioFixture);
      expect(await sBTC.name()).to.equal("Synthetic Bitcoin");
      expect(await sBTC.symbol()).to.equal("sBTC");
      expect(await sBTC.underlyingSymbol()).to.equal("bitcoin");
    });

    it("should only allow MINTER_ROLE to mint", async function () {
      const { sBTC, user1 } = await loadFixture(deployPortfolioFixture);
      await expect(
        sBTC.connect(user1).mint(user1.address, ethers.parseEther("1"))
      ).to.be.reverted;
    });
  });

  // ═══════════════════════════════════════════════════════
  //  SyntheticSwapRouter Tests
  // ═══════════════════════════════════════════════════════
  describe("SyntheticSwapRouter", function () {
    it("should quote correctly: 1 STT ($1) → 0.00001 sBTC ($100k)", async function () {
      const { router } = await loadFixture(deployPortfolioFixture);
      const sttAmount = ethers.parseEther("1"); // 1 STT
      const quote = await router.quoteSyntheticForSTT("bitcoin", sttAmount);
      // Expected: (1e18 * 1e8) / 100000e8 = 1e18 / 100000 = 1e13
      expect(quote).to.equal(ethers.parseEther("0.00001"));
    });

    it("should quote correctly: 0.00001 sBTC → 1 STT", async function () {
      const { router } = await loadFixture(deployPortfolioFixture);
      const synAmount = ethers.parseEther("0.00001");
      const quote = await router.quoteSTTForSynthetic("bitcoin", synAmount);
      expect(quote).to.equal(ethers.parseEther("1"));
    });

    it("should revert for unsupported symbol", async function () {
      const { router, oracle } = await loadFixture(deployPortfolioFixture);
      await expect(
        router.quoteSyntheticForSTT("dogecoin", ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(
        oracle,
        "PriceNotAvailable"
      );
    });

    it("should list supported symbols", async function () {
      const { router } = await loadFixture(deployPortfolioFixture);
      const symbols = await router.getSupportedSymbols();
      expect(symbols.length).to.equal(3);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  VaultShares Tests — Deposit & Withdraw
  // ═══════════════════════════════════════════════════════
  describe("VaultShares — Deposit/Withdraw", function () {
    it("should accept deposit and mint shares", async function () {
      const { vault, user1 } = await loadFixture(deployPortfolioFixture);
      const depositAmount = ethers.parseEther("10");

      await vault.connect(user1).deposit({ value: depositAmount });

      // First deposit: 1 STT = 1 share
      expect(await vault.balanceOf(user1.address)).to.equal(depositAmount);
      expect(await vault.totalDeposited()).to.equal(depositAmount);
      expect(await vault.depositCount()).to.equal(1);
    });

    it("should return share price of 1e18 initially", async function () {
      const { vault } = await loadFixture(deployPortfolioFixture);
      expect(await vault.getSharePrice()).to.equal(ethers.parseEther("1"));
    });

    it("should allow withdrawal and return STT", async function () {
      const { vault, user1 } = await loadFixture(deployPortfolioFixture);
      const depositAmount = ethers.parseEther("10");
      await vault.connect(user1).deposit({ value: depositAmount });

      const balBefore = await ethers.provider.getBalance(user1.address);
      const tx = await vault.connect(user1).withdraw(depositAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balAfter = await ethers.provider.getBalance(user1.address);

      // Should get back ~10 STT (minus gas)
      expect(balAfter + gasUsed).to.be.closeTo(balBefore + depositAmount, ethers.parseEther("0.001"));
      expect(await vault.balanceOf(user1.address)).to.equal(0);
    });

    it("should handle multiple depositors proportionally", async function () {
      const { vault, user1, user2 } = await loadFixture(deployPortfolioFixture);

      // User1 deposits 10 STT
      await vault.connect(user1).deposit({ value: ethers.parseEther("10") });

      // User2 deposits 20 STT
      await vault.connect(user2).deposit({ value: ethers.parseEther("20") });

      // Total = 30 STT, user1 has 10 shares, user2 has 20 shares
      expect(await vault.balanceOf(user1.address)).to.equal(ethers.parseEther("10"));
      expect(await vault.balanceOf(user2.address)).to.equal(ethers.parseEther("20"));
      expect(await vault.getTotalPortfolioValue()).to.equal(ethers.parseEther("30"));
    });

    it("should revert on zero deposit", async function () {
      const { vault, user1 } = await loadFixture(deployPortfolioFixture);
      await expect(vault.connect(user1).deposit({ value: 0 })).to.be.revertedWithCustomError(
        vault,
        "InvalidAmount"
      );
    });

    it("should revert on insufficient shares", async function () {
      const { vault, user1 } = await loadFixture(deployPortfolioFixture);
      await vault.connect(user1).deposit({ value: ethers.parseEther("5") });
      await expect(
        vault.connect(user1).withdraw(ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(vault, "InsufficientShares");
    });
  });

  // ═══════════════════════════════════════════════════════
  //  VaultShares Tests — Portfolio Management
  // ═══════════════════════════════════════════════════════
  describe("VaultShares — Portfolio Management", function () {
    it("should allow manager to buy asset", async function () {
      const { vault, router, sBTC, user1, manager } = await loadFixture(deployPortfolioFixture);

      // User deposits 100 STT
      await vault.connect(user1).deposit({ value: ethers.parseEther("100") });

      // Fund the swap router with STT reserves for future redemptions
      await router.fallback!({ value: ethers.parseEther("1000") });

      // Manager buys sBTC with 50 STT
      await vault.connect(manager).buyAsset("bitcoin", ethers.parseEther("50"));

      // Vault should now hold sBTC
      const vaultAddr = await vault.getAddress();
      const sBTCBal = await sBTC.balanceOf(vaultAddr);
      expect(sBTCBal).to.be.gt(0);

      // Portfolio value should still be ~100 STT (50 STT + 50 STT worth of sBTC)
      const portfolioValue = await vault.getTotalPortfolioValue();
      expect(portfolioValue).to.be.closeTo(ethers.parseEther("100"), ethers.parseEther("0.1"));
    });

    it("should allow manager to sell asset", async function () {
      const { vault, router, sBTC, user1, manager } = await loadFixture(deployPortfolioFixture);

      // User deposits, fund router, buy asset
      await vault.connect(user1).deposit({ value: ethers.parseEther("100") });
      await router.fallback!({ value: ethers.parseEther("1000") });
      await vault.connect(manager).buyAsset("bitcoin", ethers.parseEther("50"));

      // Get current sBTC balance
      const vaultAddr = await vault.getAddress();
      const sBTCBal = await sBTC.balanceOf(vaultAddr);

      // Sell all sBTC
      await vault.connect(manager).sellAsset("bitcoin", sBTCBal);

      // Vault should have ~100 STT in balance again
      expect(await sBTC.balanceOf(vaultAddr)).to.equal(0);
    });

    it("should not allow non-manager to buy/sell", async function () {
      const { vault, user1 } = await loadFixture(deployPortfolioFixture);
      await vault.connect(user1).deposit({ value: ethers.parseEther("10") });

      await expect(
        vault.connect(user1).buyAsset("bitcoin", ethers.parseEther("5"))
      ).to.be.reverted;
    });

    it("should show portfolio allocation", async function () {
      const { vault, router, user1, manager } = await loadFixture(deployPortfolioFixture);

      await vault.connect(user1).deposit({ value: ethers.parseEther("100") });
      await router.fallback!({ value: ethers.parseEther("1000") });
      await vault.connect(manager).buyAsset("bitcoin", ethers.parseEther("40"));
      await vault.connect(manager).buyAsset("ethereum", ethers.parseEther("30"));

      const [symbols, values, percentages] = await vault.getPortfolioAllocation();

      // Should have STT + bitcoin + ethereum
      expect(symbols.length).to.be.gte(3);
      expect(symbols[0]).to.equal("STT");
    });
  });

  // ═══════════════════════════════════════════════════════
  //  VaultShares Tests — Price Movement & Profit
  // ═══════════════════════════════════════════════════════
  describe("VaultShares — Profit from Price Movement", function () {
    it("should increase share price when BTC price rises", async function () {
      const { vault, oracle, router, user1, manager } = await loadFixture(
        deployPortfolioFixture
      );

      // User deposits 100 STT
      await vault.connect(user1).deposit({ value: ethers.parseEther("100") });
      await router.fallback!({ value: ethers.parseEther("500") });

      // Manager invests 50 STT into BTC
      await vault.connect(manager).buyAsset("bitcoin", ethers.parseEther("50"));

      const sharePriceBefore = await vault.getSharePrice();

      // BTC price goes up 20%: $100k → $120k
      await oracle.updatePrice("bitcoin", 120_000_00000000n);

      const sharePriceAfter = await vault.getSharePrice();

      // Share price should increase (50% of portfolio in BTC × 20% increase = ~10% portfolio gain)
      expect(sharePriceAfter).to.be.gt(sharePriceBefore);
    });

    it("should allow user to withdraw with profit", async function () {
      const { vault, oracle, router, user1, manager } = await loadFixture(
        deployPortfolioFixture
      );

      // Deposit 100 STT
      await vault.connect(user1).deposit({ value: ethers.parseEther("100") });
      // Fund router for redemptions
      await router.fallback!({ value: ethers.parseEther("500") });

      // Invest 100% into BTC
      await vault.connect(manager).buyAsset("bitcoin", ethers.parseEther("100"));

      // BTC goes up 50%: $100k → $150k
      await oracle.updatePrice("bitcoin", 150_000_00000000n);

      // Portfolio value should be ~150 STT now
      const portfolioValue = await vault.getTotalPortfolioValue();
      expect(portfolioValue).to.be.closeTo(ethers.parseEther("150"), ethers.parseEther("1"));

      // User has 100 shares. Withdraw all → should get ~150 STT
      const shares = await vault.balanceOf(user1.address);
      const balBefore = await ethers.provider.getBalance(user1.address);
      const tx = await vault.connect(user1).withdraw(shares);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balAfter = await ethers.provider.getBalance(user1.address);

      const profit = balAfter + gasUsed - balBefore;
      // Should receive ~150 STT (50 STT profit)
      expect(profit).to.be.closeTo(ethers.parseEther("150"), ethers.parseEther("2"));
    });

    it("should decrease share price when asset price drops", async function () {
      const { vault, oracle, router, user1, manager } = await loadFixture(
        deployPortfolioFixture
      );

      await vault.connect(user1).deposit({ value: ethers.parseEther("100") });
      await router.fallback!({ value: ethers.parseEther("500") });
      await vault.connect(manager).buyAsset("bitcoin", ethers.parseEther("50"));

      const sharePriceBefore = await vault.getSharePrice();

      // BTC drops 30%: $100k → $70k
      await oracle.updatePrice("bitcoin", 70_000_00000000n);

      const sharePriceAfter = await vault.getSharePrice();
      expect(sharePriceAfter).to.be.lt(sharePriceBefore);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  VaultShares Tests — Auto-Liquidation on Withdraw
  // ═══════════════════════════════════════════════════════
  describe("VaultShares — Auto-Liquidation", function () {
    it("should auto-liquidate synthetics when withdrawing with insufficient STT", async function () {
      const { vault, oracle, router, user1, manager } = await loadFixture(
        deployPortfolioFixture
      );

      await vault.connect(user1).deposit({ value: ethers.parseEther("100") });
      await router.fallback!({ value: ethers.parseEther("500") });

      // Invest 100% into BTC (vault has 0 liquid STT after this)
      await vault.connect(manager).buyAsset("bitcoin", ethers.parseEther("100"));

      // User tries to withdraw — should auto-liquidate sBTC
      const shares = await vault.balanceOf(user1.address);
      await expect(vault.connect(user1).withdraw(shares)).to.not.be.reverted;
    });
  });

  // ═══════════════════════════════════════════════════════
  //  Integration — Full Cycle
  // ═══════════════════════════════════════════════════════
  describe("Full Investment Cycle", function () {
    it("should complete deposit → allocate → price change → withdraw with profit", async function () {
      const { vault, oracle, router, user1, user2, manager } = await loadFixture(
        deployPortfolioFixture
      );

      // Fund router reserves
      await router.fallback!({ value: ethers.parseEther("500") });

      // User1 deposits 100 STT
      await vault.connect(user1).deposit({ value: ethers.parseEther("100") });
      expect(await vault.depositCount()).to.equal(1);

      // User2 deposits 200 STT
      await vault.connect(user2).deposit({ value: ethers.parseEther("200") });
      expect(await vault.depositCount()).to.equal(2);

      // Total: 300 STT. User1=100 shares, User2=200 shares
      expect(await vault.getTotalPortfolioValue()).to.equal(ethers.parseEther("300"));

      // Manager allocates: 40% BTC, 30% ETH, 30% STT
      await vault.connect(manager).buyAsset("bitcoin", ethers.parseEther("120"));  // 40% of 300
      await vault.connect(manager).buyAsset("ethereum", ethers.parseEther("90")); // 30% of 300

      // Verify portfolio value unchanged
      const pv1 = await vault.getTotalPortfolioValue();
      expect(pv1).to.be.closeTo(ethers.parseEther("300"), ethers.parseEther("1"));

      // Time passes... BTC +25%, ETH +10%
      await oracle.updatePrice("bitcoin", 125_000_00000000n);  // $125k
      await oracle.updatePrice("ethereum", 3_850_00000000n);   // $3,850

      // New portfolio value:
      //   STT: 90 STT (unchanged)
      //   BTC: 120 STT worth at $100k → now worth 120 × 1.25 = 150 STT
      //   ETH: 90 STT worth at $3.5k → now worth 90 × 1.10 = 99 STT
      //   Total: 90 + 150 + 99 = 339 STT (was 300 → ~13% gain)

      const pv2 = await vault.getTotalPortfolioValue();
      expect(pv2).to.be.gt(ethers.parseEther("330"));

      // User1 withdraws all (100/300 = 33.33% of portfolio)
      const user1Shares = await vault.balanceOf(user1.address);
      const user1BalBefore = await ethers.provider.getBalance(user1.address);
      const tx = await vault.connect(user1).withdraw(user1Shares);
      const receipt = await tx.wait();
      const gas = receipt!.gasUsed * receipt!.gasPrice;
      const user1BalAfter = await ethers.provider.getBalance(user1.address);

      const user1Received = user1BalAfter + gas - user1BalBefore;
      // User1 should receive ~113 STT (100 deposit + ~13% profit)
      expect(user1Received).to.be.gt(ethers.parseEther("110"));

      console.log(`  User1 deposited: 100 STT`);
      console.log(`  User1 received:  ${ethers.formatEther(user1Received)} STT`);
      console.log(`  Profit:          ${ethers.formatEther(user1Received - ethers.parseEther("100"))} STT`);
    });
  });
});
