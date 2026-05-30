import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentRegistry, TreasuryVault } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TreasuryVault", function () {
  let registry: AgentRegistry;
  let vault: TreasuryVault;
  let owner: SignerWithAddress;
  let treasuryManager: SignerWithAddress;
  let activeAgent: SignerWithAddress;
  let recipient: SignerWithAddress;
  let nonAdmin: SignerWithAddress;
  let depositor: SignerWithAddress;

  const CEO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CEO_ROLE"));
  const CFO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CFO_ROLE"));
  const CMO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CMO_ROLE"));
  const TREASURY_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("TREASURY_MANAGER_ROLE"));

  beforeEach(async function () {
    [owner, treasuryManager, activeAgent, recipient, nonAdmin, depositor] =
      await ethers.getSigners();

    // Deploy AgentRegistry
    const Registry = await ethers.getContractFactory("AgentRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();

    // Deploy TreasuryVault
    const Treasury = await ethers.getContractFactory("TreasuryVault");
    vault = await Treasury.deploy(await registry.getAddress());
    await vault.waitForDeployment();

    // Register agents
    await registry.registerAgent(CFO_ROLE, treasuryManager.address);
    await registry.registerAgent(CMO_ROLE, activeAgent.address);

    // Grant treasury access to CFO
    await registry.grantTreasuryAccess(treasuryManager.address);
  });

  // ════════════════════════════════════════════════════════
  //  Deployment
  // ════════════════════════════════════════════════════════

  describe("Deployment", function () {
    it("Should set the correct registry address", async function () {
      // The vault should reference the registry — verified by successful role checks
      // We verify indirectly: treasury manager can call protected functions
      await owner.sendTransaction({
        to: await vault.getAddress(),
        value: ethers.parseEther("1"),
      });
      await expect(
        vault.connect(treasuryManager).recordHoldDecision("Test hold")
      ).to.not.be.reverted;
    });

    it("Should set deployer as admin", async function () {
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      expect(await vault.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should start with zero balance", async function () {
      expect(await vault.getBalance()).to.equal(0);
    });

    it("Should start with zero decisions", async function () {
      expect(await vault.getDecisionCount()).to.equal(0);
    });
  });

  // ════════════════════════════════════════════════════════
  //  Deposits
  // ════════════════════════════════════════════════════════

  describe("Deposits", function () {
    it("Should accept native STT deposits", async function () {
      const depositAmount = ethers.parseEther("1.0");

      await expect(
        vault.connect(depositor).deposit({ value: depositAmount })
      ).to.emit(vault, "NativeDeposited");

      expect(await vault.getBalance()).to.equal(depositAmount);
    });

    it("Should accept deposits from anyone", async function () {
      const amount = ethers.parseEther("0.5");

      await vault.connect(nonAdmin).deposit({ value: amount });
      await vault.connect(depositor).deposit({ value: amount });

      expect(await vault.getBalance()).to.equal(ethers.parseEther("1.0"));
    });

    it("Should accept deposits via direct transfer (receive)", async function () {
      const amount = ethers.parseEther("2.0");
      await owner.sendTransaction({
        to: await vault.getAddress(),
        value: amount,
      });

      expect(await vault.getBalance()).to.be.gte(amount);
    });

    it("Should revert deposit of zero value", async function () {
      await expect(
        vault.connect(depositor).deposit({ value: 0 })
      ).to.be.revertedWithCustomError(vault, "InvalidAmount");
    });
  });

  // ════════════════════════════════════════════════════════
  //  Rebalance
  // ════════════════════════════════════════════════════════

  describe("Rebalance", function () {
    it("Should allow treasury manager to execute rebalance", async function () {
      // Deposit some funds first
      await vault.connect(depositor).deposit({ value: ethers.parseEther("5") });

      const fromToken = ethers.ZeroAddress; // native STT
      const toToken = ethers.ZeroAddress;
      const amount = ethers.parseEther("1");
      const rationale = "Rebalancing portfolio for better risk distribution";

      await expect(
        vault
          .connect(treasuryManager)
          .executeRebalance(fromToken, toToken, amount, rationale)
      ).to.emit(vault, "Rebalanced");
    });

    it("Should record decision after rebalance", async function () {
      await vault.connect(depositor).deposit({ value: ethers.parseEther("5") });

      await vault
        .connect(treasuryManager)
        .executeRebalance(
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          ethers.parseEther("1"),
          "Test rebalance"
        );

      expect(await vault.getDecisionCount()).to.be.gte(1);
    });

    it("Should revert when non-treasury-manager calls rebalance", async function () {
      await vault.connect(depositor).deposit({ value: ethers.parseEther("5") });

      await expect(
        vault
          .connect(nonAdmin)
          .executeRebalance(
            ethers.ZeroAddress,
            ethers.ZeroAddress,
            ethers.parseEther("1"),
            "Unauthorized rebalance"
          )
      ).to.be.reverted;
    });
  });

  // ════════════════════════════════════════════════════════
  //  Allocation
  // ════════════════════════════════════════════════════════

  describe("Allocation", function () {
    beforeEach(async function () {
      await vault.connect(depositor).deposit({ value: ethers.parseEther("10") });
    });

    it("Should allow treasury manager to execute allocation", async function () {
      const amount = ethers.parseEther("1");
      const rationale = "Allocating funds for marketing campaign";

      await expect(
        vault
          .connect(treasuryManager)
          .executeAllocation(ethers.ZeroAddress, recipient.address, amount, rationale)
      ).to.emit(vault, "Allocated");
    });

    it("Should revert allocation with insufficient balance", async function () {
      const excessiveAmount = ethers.parseEther("100");

      await expect(
        vault
          .connect(treasuryManager)
          .executeAllocation(
            ethers.ZeroAddress,
            recipient.address,
            excessiveAmount,
            "Too much"
          )
      ).to.be.revertedWithCustomError(vault, "InsufficientBalance");
    });

    it("Should revert allocation to zero address", async function () {
      await expect(
        vault
          .connect(treasuryManager)
          .executeAllocation(
            ethers.ZeroAddress,
            ethers.ZeroAddress,
            ethers.parseEther("1"),
            "Invalid recipient"
          )
      ).to.be.revertedWithCustomError(vault, "InvalidAddress");
    });

    it("Should revert allocation of zero amount", async function () {
      await expect(
        vault
          .connect(treasuryManager)
          .executeAllocation(ethers.ZeroAddress, recipient.address, 0, "Zero")
      ).to.be.revertedWithCustomError(vault, "InvalidAmount");
    });

    it("Should revert when non-treasury-manager calls allocation", async function () {
      await expect(
        vault
          .connect(nonAdmin)
          .executeAllocation(
            ethers.ZeroAddress,
            recipient.address,
            ethers.parseEther("1"),
            "Unauthorized"
          )
      ).to.be.reverted;
    });
  });

  // ════════════════════════════════════════════════════════
  //  Hold Decisions
  // ════════════════════════════════════════════════════════

  describe("Hold Decisions", function () {
    it("Should allow active agents to record hold decisions", async function () {
      await expect(
        vault.connect(treasuryManager).recordHoldDecision("Market conditions stable, holding assets")
      ).to.emit(vault, "DecisionRecorded");
    });

    it("Should allow any active agent to record hold decision", async function () {
      await expect(
        vault.connect(activeAgent).recordHoldDecision("CMO hold decision")
      ).to.emit(vault, "DecisionRecorded");
    });

    it("Should revert when unregistered user records hold decision", async function () {
      await expect(
        vault.connect(nonAdmin).recordHoldDecision("Unauthorized hold")
      ).to.be.reverted;
    });

    it("Should increment decision count", async function () {
      const countBefore = await vault.getDecisionCount();
      await vault.connect(treasuryManager).recordHoldDecision("Hold rationale");
      const countAfter = await vault.getDecisionCount();
      expect(countAfter).to.equal(countBefore + 1n);
    });
  });

  // ════════════════════════════════════════════════════════
  //  Pause / Unpause
  // ════════════════════════════════════════════════════════

  describe("Pause / Unpause", function () {
    it("Should allow admin to pause the vault", async function () {
      await expect(vault.connect(owner).pause()).to.not.be.reverted;
    });

    it("Should allow admin to unpause the vault", async function () {
      await vault.connect(owner).pause();
      await expect(vault.connect(owner).unpause()).to.not.be.reverted;
    });

    it("Should block deposits when paused", async function () {
      await vault.connect(owner).pause();
      await expect(
        vault.connect(depositor).deposit({ value: ethers.parseEther("1") })
      ).to.be.reverted;
    });

    it("Should allow deposits after unpausing", async function () {
      await vault.connect(owner).pause();
      await vault.connect(owner).unpause();
      await expect(
        vault.connect(depositor).deposit({ value: ethers.parseEther("1") })
      ).to.not.be.reverted;
    });

    it("Should revert when non-admin tries to pause", async function () {
      await expect(vault.connect(nonAdmin).pause()).to.be.reverted;
    });

    it("Should revert when non-admin tries to unpause", async function () {
      await vault.connect(owner).pause();
      await expect(vault.connect(nonAdmin).unpause()).to.be.reverted;
    });
  });

  // ════════════════════════════════════════════════════════
  //  Emergency Withdraw
  // ════════════════════════════════════════════════════════

  describe("Emergency Withdraw", function () {
    it("Should allow admin to emergency withdraw all native balance", async function () {
      const depositAmount = ethers.parseEther("5");
      await vault.connect(depositor).deposit({ value: depositAmount });

      const balanceBefore = await ethers.provider.getBalance(recipient.address);

      await expect(
        vault.connect(owner).emergencyWithdraw(recipient.address)
      ).to.emit(vault, "EmergencyWithdraw");

      const balanceAfter = await ethers.provider.getBalance(recipient.address);
      expect(balanceAfter - balanceBefore).to.equal(depositAmount);
    });

    it("Should leave vault with zero balance after emergency withdraw", async function () {
      await vault.connect(depositor).deposit({ value: ethers.parseEther("3") });
      await vault.connect(owner).emergencyWithdraw(recipient.address);

      expect(await vault.getBalance()).to.equal(0);
    });

    it("Should revert when non-admin tries to emergency withdraw", async function () {
      await vault.connect(depositor).deposit({ value: ethers.parseEther("1") });
      await expect(
        vault.connect(nonAdmin).emergencyWithdraw(recipient.address)
      ).to.be.reverted;
    });

    it("Should revert emergency withdraw to zero address", async function () {
      await vault.connect(depositor).deposit({ value: ethers.parseEther("1") });
      await expect(
        vault.connect(owner).emergencyWithdraw(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(vault, "InvalidAddress");
    });
  });

  // ════════════════════════════════════════════════════════
  //  View Functions
  // ════════════════════════════════════════════════════════

  describe("View Functions", function () {
    it("Should return correct native balance via getBalance", async function () {
      const amount = ethers.parseEther("2.5");
      await vault.connect(depositor).deposit({ value: amount });
      expect(await vault.getBalance()).to.equal(amount);
    });

    it("Should return correct decision count", async function () {
      await vault.connect(treasuryManager).recordHoldDecision("Hold 1");
      await vault.connect(treasuryManager).recordHoldDecision("Hold 2");
      expect(await vault.getDecisionCount()).to.equal(2);
    });

    it("Should return decision by ID", async function () {
      await vault.connect(treasuryManager).recordHoldDecision("First decision");
      const decision = await vault.getDecision(0);
      expect(decision).to.not.be.undefined;
    });

    it("Should return recent decisions", async function () {
      await vault.connect(treasuryManager).recordHoldDecision("Decision A");
      await vault.connect(treasuryManager).recordHoldDecision("Decision B");
      await vault.connect(treasuryManager).recordHoldDecision("Decision C");

      const recent = await vault.getRecentDecisions(2);
      expect(recent.length).to.equal(2);
    });

    it("Should return all decisions when count exceeds total", async function () {
      await vault.connect(treasuryManager).recordHoldDecision("Only decision");

      const recent = await vault.getRecentDecisions(10);
      expect(recent.length).to.equal(1);
    });
  });
});
