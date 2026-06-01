import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AgentRegistry", function () {
  let registry: AgentRegistry;
  let owner: SignerWithAddress;
  let agent1: SignerWithAddress;
  let agent2: SignerWithAddress;
  let agent3: SignerWithAddress;
  let nonAdmin: SignerWithAddress;

  const CEO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CEO_ROLE"));
  const CFO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CFO_ROLE"));
  const CMO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CMO_ROLE"));
  const TREASURY_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("TREASURY_MANAGER_ROLE"));

  beforeEach(async function () {
    [owner, agent1, agent2, agent3, nonAdmin] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("AgentRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();
  });

  // ════════════════════════════════════════════════════════
  //  Deployment
  // ════════════════════════════════════════════════════════

  describe("Deployment", function () {
    it("Should set deployer as default admin", async function () {
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should start with zero registered agents", async function () {
      expect(await registry.getAgentCount()).to.equal(0);
    });

    it("Should return empty array for getAllAgents initially", async function () {
      const agents = await registry.getAllAgents();
      expect(agents.length).to.equal(0);
    });
  });

  // ════════════════════════════════════════════════════════
  //  Agent Registration
  // ════════════════════════════════════════════════════════

  describe("Agent Registration", function () {
    it("Should register an agent with a role", async function () {
      await expect(registry.registerAgent(CEO_ROLE, agent1.address))
        .to.emit(registry, "AgentRegistered");

      expect(await registry.isActiveAgent(agent1.address)).to.be.true;
      expect(await registry.getAgentByRole(CEO_ROLE)).to.equal(agent1.address);
      expect(await registry.getAgentCount()).to.equal(1);
    });

    it("Should register multiple agents with different roles", async function () {
      await registry.registerAgent(CEO_ROLE, agent1.address);
      await registry.registerAgent(CFO_ROLE, agent2.address);
      await registry.registerAgent(CMO_ROLE, agent3.address);

      expect(await registry.getAgentCount()).to.equal(3);
      expect(await registry.getAgentByRole(CEO_ROLE)).to.equal(agent1.address);
      expect(await registry.getAgentByRole(CFO_ROLE)).to.equal(agent2.address);
      expect(await registry.getAgentByRole(CMO_ROLE)).to.equal(agent3.address);
    });

    it("Should set the agent as active upon registration", async function () {
      await registry.registerAgent(CEO_ROLE, agent1.address);
      const info = await registry.getAgentInfo(agent1.address);
      expect(info.isActive).to.be.true;
    });

    it("Should revert when registering the same agent twice", async function () {
      await registry.registerAgent(CEO_ROLE, agent1.address);
      await expect(registry.registerAgent(CFO_ROLE, agent1.address))
        .to.be.revertedWithCustomError(registry, "AgentAlreadyRegistered");
    });

    it("Should revert when registering a role that is already assigned", async function () {
      await registry.registerAgent(CEO_ROLE, agent1.address);
      await expect(registry.registerAgent(CEO_ROLE, agent2.address))
        .to.be.revertedWithCustomError(registry, "RoleAlreadyAssigned");
    });

    it("Should revert when registering with zero address", async function () {
      await expect(registry.registerAgent(CEO_ROLE, ethers.ZeroAddress))
        .to.be.revertedWithCustomError(registry, "InvalidAddress");
    });

    it("Should revert when non-admin tries to register an agent", async function () {
      await expect(
        registry.connect(nonAdmin).registerAgent(CEO_ROLE, agent1.address)
      ).to.be.reverted;
    });
  });

  // ════════════════════════════════════════════════════════
  //  Agent Deactivation & Reactivation
  // ════════════════════════════════════════════════════════

  describe("Agent Deactivation & Reactivation", function () {
    beforeEach(async function () {
      await registry.registerAgent(CEO_ROLE, agent1.address);
    });

    it("Should deactivate an active agent", async function () {
      await expect(registry.deactivateAgent(agent1.address))
        .to.emit(registry, "AgentDeactivated");

      expect(await registry.isActiveAgent(agent1.address)).to.be.false;
    });

    it("Should reactivate a deactivated agent", async function () {
      await registry.deactivateAgent(agent1.address);

      await expect(registry.reactivateAgent(agent1.address))
        .to.emit(registry, "AgentReactivated");

      expect(await registry.isActiveAgent(agent1.address)).to.be.true;
    });

    it("Should revert when deactivating an unregistered agent", async function () {
      await expect(registry.deactivateAgent(agent2.address))
        .to.be.revertedWithCustomError(registry, "AgentNotRegistered");
    });

    it("Should revert when reactivating an unregistered agent", async function () {
      await expect(registry.reactivateAgent(agent2.address))
        .to.be.revertedWithCustomError(registry, "AgentNotRegistered");
    });

    it("Should revert when non-admin tries to deactivate", async function () {
      await expect(
        registry.connect(nonAdmin).deactivateAgent(agent1.address)
      ).to.be.reverted;
    });

    it("Should revert when non-admin tries to reactivate", async function () {
      await registry.deactivateAgent(agent1.address);
      await expect(
        registry.connect(nonAdmin).reactivateAgent(agent1.address)
      ).to.be.reverted;
    });
  });

  // ════════════════════════════════════════════════════════
  //  Treasury Access
  // ════════════════════════════════════════════════════════

  describe("Treasury Access", function () {
    beforeEach(async function () {
      await registry.registerAgent(CEO_ROLE, agent1.address);
    });

    it("Should grant treasury access to a registered agent", async function () {
      await expect(registry.grantTreasuryAccess(agent1.address))
        .to.not.be.reverted;

      expect(
        await registry.hasRole(TREASURY_MANAGER_ROLE, agent1.address)
      ).to.be.true;
    });

    it("Should revert when non-admin grants treasury access", async function () {
      await expect(
        registry.connect(nonAdmin).grantTreasuryAccess(agent1.address)
      ).to.be.reverted;
    });
  });

  // ════════════════════════════════════════════════════════
  //  Decision Tracking
  // ════════════════════════════════════════════════════════

  describe("Decision Tracking", function () {
    beforeEach(async function () {
      await registry.registerAgent(CEO_ROLE, agent1.address);
    });

    it("Should track successful decisions", async function () {
      await registry.connect(agent1).recordDecision(true);

      const info = await registry.getAgentInfo(agent1.address);
      expect(info.decisionsCount).to.equal(1);
      expect(info.successCount).to.equal(1);
    });

    it("Should track failed decisions", async function () {
      await registry.connect(agent1).recordDecision(false);

      const info = await registry.getAgentInfo(agent1.address);
      expect(info.decisionsCount).to.equal(1);
      expect(info.successCount).to.equal(0);
    });

    it("Should accumulate multiple decisions", async function () {
      await registry.connect(agent1).recordDecision(true);
      await registry.connect(agent1).recordDecision(true);
      await registry.connect(agent1).recordDecision(false);

      const info = await registry.getAgentInfo(agent1.address);
      expect(info.decisionsCount).to.equal(3);
      expect(info.successCount).to.equal(2);
    });

    it("Should calculate success rate correctly — 75%", async function () {
      await registry.connect(agent1).recordDecision(true);
      await registry.connect(agent1).recordDecision(true);
      await registry.connect(agent1).recordDecision(false);
      await registry.connect(agent1).recordDecision(true);

      // 3 successes out of 4 = 7500 basis points (75%)
      expect(await registry.getSuccessRate(agent1.address)).to.equal(7500);
    });

    it("Should calculate success rate correctly — 100%", async function () {
      await registry.connect(agent1).recordDecision(true);
      await registry.connect(agent1).recordDecision(true);

      expect(await registry.getSuccessRate(agent1.address)).to.equal(10000);
    });

    it("Should calculate success rate correctly — 0%", async function () {
      await registry.connect(agent1).recordDecision(false);
      await registry.connect(agent1).recordDecision(false);

      expect(await registry.getSuccessRate(agent1.address)).to.equal(0);
    });

    it("Should return 0 success rate for agent with no decisions", async function () {
      expect(await registry.getSuccessRate(agent1.address)).to.equal(0);
    });

    it("Should track total decisions across all agents", async function () {
      await registry.registerAgent(CFO_ROLE, agent2.address);

      await registry.connect(agent1).recordDecision(true);
      await registry.connect(agent2).recordDecision(true);
      await registry.connect(agent2).recordDecision(false);

      expect(await registry.totalDecisions()).to.equal(3);
    });

    it("Should revert when unregistered address records decision", async function () {
      await expect(
        registry.connect(nonAdmin).recordDecision(true)
      ).to.be.revertedWithCustomError(registry, "AgentNotRegistered");
    });

    it("Should still allow deactivated agent to record decision (registered check only)", async function () {
      await registry.deactivateAgent(agent1.address);
      // recordDecision checks registeredAt != 0, not isActive
      await expect(
        registry.connect(agent1).recordDecision(true)
      ).to.not.be.reverted;
    });
  });

  // ════════════════════════════════════════════════════════
  //  View Functions
  // ════════════════════════════════════════════════════════

  describe("View Functions", function () {
    it("Should return all registered agents", async function () {
      await registry.registerAgent(CEO_ROLE, agent1.address);
      await registry.registerAgent(CFO_ROLE, agent2.address);

      const agents = await registry.getAllAgents();
      expect(agents.length).to.equal(2);
      expect(agents).to.deep.equal([agent1.address, agent2.address]);
    });

    it("Should return correct agent info", async function () {
      await registry.registerAgent(CEO_ROLE, agent1.address);

      const info = await registry.getAgentInfo(agent1.address);
      expect(info.role).to.equal(CEO_ROLE);
      expect(info.isActive).to.be.true;
      expect(info.decisionsCount).to.equal(0);
      expect(info.successCount).to.equal(0);
    });

    it("Should return correct agent count after multiple registrations", async function () {
      expect(await registry.getAgentCount()).to.equal(0);

      await registry.registerAgent(CEO_ROLE, agent1.address);
      expect(await registry.getAgentCount()).to.equal(1);

      await registry.registerAgent(CFO_ROLE, agent2.address);
      expect(await registry.getAgentCount()).to.equal(2);

      await registry.registerAgent(CMO_ROLE, agent3.address);
      expect(await registry.getAgentCount()).to.equal(3);
    });

    it("Should return the correct agent for a given role", async function () {
      await registry.registerAgent(CEO_ROLE, agent1.address);
      expect(await registry.getAgentByRole(CEO_ROLE)).to.equal(agent1.address);
    });

    it("Should return zero address for unassigned roles", async function () {
      expect(await registry.getAgentByRole(CEO_ROLE)).to.equal(ethers.ZeroAddress);
    });

    it("Should report isActiveAgent=false for unregistered address", async function () {
      expect(await registry.isActiveAgent(nonAdmin.address)).to.be.false;
    });
  });
});
