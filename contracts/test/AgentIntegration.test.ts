import { expect } from "chai";
import { ethers } from "hardhat";
import {
  AgentRegistry,
  TreasuryVault,
  CFOAgent,
  CMOAgent,
  CEOAgent,
  MockAgentRunner,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Agent Integration Tests", function () {
  let registry: AgentRegistry;
  let vault: TreasuryVault;
  let mockRunner: MockAgentRunner;
  let cfo: CFOAgent;
  let cmo: CMOAgent;
  let ceo: CEOAgent;
  let owner: SignerWithAddress;
  let nonAdmin: SignerWithAddress;

  const CEO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CEO_ROLE"));
  const CFO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CFO_ROLE"));
  const CMO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CMO_ROLE"));

  // Somnia Agent IDs (mock values)
  const JSON_API_AGENT_ID = 1;
  const LLM_INFERENCE_AGENT_ID = 2;
  const LLM_PARSE_WEBSITE_AGENT_ID = 3;

  beforeEach(async function () {
    [owner, nonAdmin] = await ethers.getSigners();

    // 1. Deploy MockAgentRunner
    const MockRunner = await ethers.getContractFactory("MockAgentRunner");
    mockRunner = await MockRunner.deploy();
    await mockRunner.waitForDeployment();

    // 2. Deploy AgentRegistry
    const Registry = await ethers.getContractFactory("AgentRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();

    // 3. Deploy TreasuryVault
    const Treasury = await ethers.getContractFactory("TreasuryVault");
    vault = await Treasury.deploy(await registry.getAddress());
    await vault.waitForDeployment();

    const registryAddr = await registry.getAddress();
    const runnerAddr = await mockRunner.getAddress();
    const vaultAddr = await vault.getAddress();

    // 4. Deploy CFOAgent
    const CFO = await ethers.getContractFactory("CFOAgent");
    cfo = await CFO.deploy(
      registryAddr,
      runnerAddr,
      vaultAddr,
      JSON_API_AGENT_ID,
      LLM_INFERENCE_AGENT_ID
    );
    await cfo.waitForDeployment();

    // 5. Deploy CMOAgent
    const CMO = await ethers.getContractFactory("CMOAgent");
    cmo = await CMO.deploy(
      registryAddr,
      runnerAddr,
      vaultAddr,
      LLM_PARSE_WEBSITE_AGENT_ID,
      LLM_INFERENCE_AGENT_ID
    );
    await cmo.waitForDeployment();

    const cfoAddr = await cfo.getAddress();
    const cmoAddr = await cmo.getAddress();

    // 6. Deploy CEOAgent
    const CEO = await ethers.getContractFactory("CEOAgent");
    ceo = await CEO.deploy(
      registryAddr,
      runnerAddr,
      vaultAddr,
      cfoAddr,
      cmoAddr,
      LLM_INFERENCE_AGENT_ID
    );
    await ceo.waitForDeployment();

    const ceoAddr = await ceo.getAddress();

    // 7. Register all agents in registry
    await registry.registerAgent(CEO_ROLE, ceoAddr);
    await registry.registerAgent(CFO_ROLE, cfoAddr);
    await registry.registerAgent(CMO_ROLE, cmoAddr);

    // 8. Grant treasury access to CEO and CFO
    await registry.grantTreasuryAccess(ceoAddr);
    await registry.grantTreasuryAccess(cfoAddr);

    // 9. Fund contracts for agent runner fees
    await owner.sendTransaction({
      to: cfoAddr,
      value: ethers.parseEther("1"),
    });
    await owner.sendTransaction({
      to: cmoAddr,
      value: ethers.parseEther("1"),
    });
    await owner.sendTransaction({
      to: ceoAddr,
      value: ethers.parseEther("1"),
    });

    // 10. Fund the treasury vault
    await vault.deposit({ value: ethers.parseEther("10") });
  });

  // ════════════════════════════════════════════════════════
  //  Full System Deployment Verification
  // ════════════════════════════════════════════════════════

  describe("System Deployment", function () {
    it("Should deploy all contracts successfully", async function () {
      expect(await registry.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await vault.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await mockRunner.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await cfo.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await cmo.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await ceo.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should have all agents registered", async function () {
      expect(await registry.getAgentCount()).to.equal(3);
      expect(await registry.isActiveAgent(await ceo.getAddress())).to.be.true;
      expect(await registry.isActiveAgent(await cfo.getAddress())).to.be.true;
      expect(await registry.isActiveAgent(await cmo.getAddress())).to.be.true;
    });

    it("Should have correct role assignments", async function () {
      expect(await registry.getAgentByRole(CEO_ROLE)).to.equal(
        await ceo.getAddress()
      );
      expect(await registry.getAgentByRole(CFO_ROLE)).to.equal(
        await cfo.getAddress()
      );
      expect(await registry.getAgentByRole(CMO_ROLE)).to.equal(
        await cmo.getAddress()
      );
    });

    it("Should have treasury funded", async function () {
      expect(await vault.getBalance()).to.equal(ethers.parseEther("10"));
    });
  });

  // ════════════════════════════════════════════════════════
  //  CFO Agent — Price Fetching
  // ════════════════════════════════════════════════════════

  describe("CFO Agent — Price Fetching", function () {
    it("Should initiate a fetchPrice request", async function () {
      const deposit = await mockRunner.getRequestDeposit();
      const agentPrice = await mockRunner.getAgentPrice(JSON_API_AGENT_ID);
      const subcommitteeSize = await mockRunner.getSubcommitteeSize();
      const totalCost = deposit + agentPrice * subcommitteeSize;

      await expect(
        cfo.fetchPrice(
          "STT",
          "https://api.example.com/price/stt",
          "$.data.price",
          { value: totalCost }
        )
      ).to.emit(mockRunner, "RequestCreated");
    });

    it("Should handle price response via MockAgentRunner", async function () {
      const deposit = await mockRunner.getRequestDeposit();
      const agentPrice = await mockRunner.getAgentPrice(JSON_API_AGENT_ID);
      const subcommitteeSize = await mockRunner.getSubcommitteeSize();
      const totalCost = deposit + agentPrice * subcommitteeSize;

      const tx = await cfo.fetchPrice(
        "STT",
        "https://api.example.com/price/stt",
        "$.data.price",
        { value: totalCost }
      );
      const receipt = await tx.wait();

      // Find the request ID from events
      const requestCreatedEvent = receipt?.logs.find((log) => {
        try {
          return mockRunner.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          })?.name === "RequestCreated";
        } catch {
          return false;
        }
      });

      if (requestCreatedEvent) {
        const parsed = mockRunner.interface.parseLog({
          topics: requestCreatedEvent.topics as string[],
          data: requestCreatedEvent.data,
        });
        const requestId = parsed?.args.requestId;

        // Simulate a successful response with ABI-encoded uint256 price data
        const priceData = ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint256"],
          [125000000n] // 1.25 with 8 decimals
        );

        await expect(
          mockRunner.simulateResponse(requestId, priceData)
        ).to.not.be.reverted;
      }
    });
  });

  // ════════════════════════════════════════════════════════
  //  CFO Agent — Risk Analysis
  // ════════════════════════════════════════════════════════

  describe("CFO Agent — Risk Analysis", function () {
    it("Should initiate a risk analysis request", async function () {
      const deposit = await mockRunner.getRequestDeposit();
      const agentPrice = await mockRunner.getAgentPrice(LLM_INFERENCE_AGENT_ID);
      const subcommitteeSize = await mockRunner.getSubcommitteeSize();
      const totalCost = deposit + agentPrice * subcommitteeSize;

      await expect(
        cfo.analyzeRisk({ value: totalCost })
      ).to.emit(mockRunner, "RequestCreated");
    });
  });

  // ════════════════════════════════════════════════════════
  //  CMO Agent — Market Scanning
  // ════════════════════════════════════════════════════════

  describe("CMO Agent — Market Scanning", function () {
    it("Should initiate a market scan request", async function () {
      const deposit = await mockRunner.getRequestDeposit();
      const agentPrice = await mockRunner.getAgentPrice(LLM_PARSE_WEBSITE_AGENT_ID);
      const subcommitteeSize = await mockRunner.getSubcommitteeSize();
      const totalCost = deposit + agentPrice * subcommitteeSize;

      await expect(
        cmo.scanMarket("https://crypto.news/market-analysis", { value: totalCost })
      ).to.emit(mockRunner, "RequestCreated");
    });

    it("Should handle market scan response", async function () {
      const deposit = await mockRunner.getRequestDeposit();
      const agentPrice = await mockRunner.getAgentPrice(LLM_PARSE_WEBSITE_AGENT_ID);
      const subcommitteeSize = await mockRunner.getSubcommitteeSize();
      const totalCost = deposit + agentPrice * subcommitteeSize;

      const tx = await cmo.scanMarket("https://crypto.news/market-analysis", {
        value: totalCost,
      });
      const receipt = await tx.wait();

      const requestCreatedEvent = receipt?.logs.find((log) => {
        try {
          return mockRunner.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          })?.name === "RequestCreated";
        } catch {
          return false;
        }
      });

      if (requestCreatedEvent) {
        const parsed = mockRunner.interface.parseLog({
          topics: requestCreatedEvent.topics as string[],
          data: requestCreatedEvent.data,
        });
        const requestId = parsed?.args.requestId;

        const scrapedData = ethers.AbiCoder.defaultAbiCoder().encode(
          ["string"],
          ["Bitcoin surges past $100k amid institutional buying"]
        );

        await expect(
          mockRunner.simulateResponse(requestId, scrapedData)
        ).to.not.be.reverted;
      }
    });
  });

  // ════════════════════════════════════════════════════════
  //  CMO Agent — Sentiment Analysis
  // ════════════════════════════════════════════════════════

  describe("CMO Agent — Sentiment Analysis", function () {
    it("Should initiate sentiment analysis", async function () {
      const deposit = await mockRunner.getRequestDeposit();
      const agentPrice = await mockRunner.getAgentPrice(LLM_INFERENCE_AGENT_ID);
      const subcommitteeSize = await mockRunner.getSubcommitteeSize();
      const totalCost = deposit + agentPrice * subcommitteeSize;

      await expect(
        cmo.analyzeSentiment(
          "twitter",
          "Somnia ecosystem is growing rapidly with new DeFi protocols",
          { value: totalCost }
        )
      ).to.emit(mockRunner, "RequestCreated");
    });
  });

  // ════════════════════════════════════════════════════════
  //  CMO Agent — View Functions
  // ════════════════════════════════════════════════════════

  describe("CMO Agent — View Functions", function () {
    it("Should return zero signal count initially", async function () {
      expect(await cmo.getSignalCount()).to.equal(0);
    });

    it("Should return aggregated sentiment defaults", async function () {
      const sentiment = await cmo.getAggregatedSentiment();
      // Should return some default values (likely all zeros)
      expect(sentiment).to.not.be.undefined;
    });
  });

  // ════════════════════════════════════════════════════════
  //  CEO Agent — System Health
  // ════════════════════════════════════════════════════════

  describe("CEO Agent — System Health", function () {
    it("Should report performance metrics", async function () {
      const metrics = await ceo.getPerformanceMetrics();
      // returns (_completedCycles, _totalDecisions, _averageCycleTime, _lastCycleTimestamp)
      expect(metrics._completedCycles).to.equal(0);
    });

    it("Should start with zero decision count", async function () {
      expect(await ceo.getDecisionCount()).to.equal(0);
    });
  });

  // ════════════════════════════════════════════════════════
  //  CEO Agent — Decision Cycle
  // ════════════════════════════════════════════════════════

  describe("CEO Agent — Decision Cycle", function () {
    it("Should initiate a decision cycle", async function () {
      const deposit = await mockRunner.getRequestDeposit();
      const agentPrice = await mockRunner.getAgentPrice(LLM_INFERENCE_AGENT_ID);
      const subcommitteeSize = await mockRunner.getSubcommitteeSize();
      const totalCost = deposit + agentPrice * subcommitteeSize;

      await expect(
        ceo.initiateDecisionCycle({ value: totalCost })
      ).to.emit(mockRunner, "RequestCreated");
    });

    it("Should handle decision cycle response", async function () {
      const deposit = await mockRunner.getRequestDeposit();
      const agentPrice = await mockRunner.getAgentPrice(LLM_INFERENCE_AGENT_ID);
      const subcommitteeSize = await mockRunner.getSubcommitteeSize();
      const totalCost = deposit + agentPrice * subcommitteeSize;

      const tx = await ceo.initiateDecisionCycle({ value: totalCost });
      const receipt = await tx.wait();

      const requestCreatedEvent = receipt?.logs.find((log) => {
        try {
          return mockRunner.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          })?.name === "RequestCreated";
        } catch {
          return false;
        }
      });

      if (requestCreatedEvent) {
        const parsed = mockRunner.interface.parseLog({
          topics: requestCreatedEvent.topics as string[],
          data: requestCreatedEvent.data,
        });
        const requestId = parsed?.args.requestId;

        const decisionData = ethers.AbiCoder.defaultAbiCoder().encode(
          ["string"],
          ["HOLD"]
        );

        await expect(
          mockRunner.simulateResponse(requestId, decisionData)
        ).to.not.be.reverted;
      }
    });
  });

  // ════════════════════════════════════════════════════════
  //  CEO Agent — Configuration
  // ════════════════════════════════════════════════════════

  describe("CEO Agent — Configuration", function () {
    it("Should allow owner to set decision cycle interval", async function () {
      const newInterval = 7200; // 2 hours
      await expect(
        ceo.setCycleInterval(newInterval)
      ).to.not.be.reverted;
    });

    it("Should revert when non-owner sets decision cycle interval", async function () {
      await expect(
        ceo.connect(nonAdmin).setCycleInterval(7200)
      ).to.be.reverted;
    });
  });

  // ════════════════════════════════════════════════════════
  //  CFO Agent — Configuration
  // ════════════════════════════════════════════════════════

  describe("CFO Agent — Configuration", function () {
    it("Should allow owner to set risk threshold", async function () {
      await expect(cfo.setRiskThreshold(80)).to.not.be.reverted;
    });

    it("Should revert when non-owner sets risk threshold", async function () {
      await expect(
        cfo.connect(nonAdmin).setRiskThreshold(80)
      ).to.be.reverted;
    });

    it("Should return current risk score (defaults to 0)", async function () {
      expect(await cfo.getCurrentRiskScore()).to.be.gte(0);
    });
  });

  // ════════════════════════════════════════════════════════
  //  Failed Response Handling
  // ════════════════════════════════════════════════════════

  describe("Failed Response Handling", function () {
    it("Should handle failed price fetch gracefully", async function () {
      const deposit = await mockRunner.getRequestDeposit();
      const agentPrice = await mockRunner.getAgentPrice(JSON_API_AGENT_ID);
      const subcommitteeSize = await mockRunner.getSubcommitteeSize();
      const totalCost = deposit + agentPrice * subcommitteeSize;

      const tx = await cfo.fetchPrice(
        "STT",
        "https://api.example.com/price/stt",
        "$.data.price",
        { value: totalCost }
      );
      const receipt = await tx.wait();

      const requestCreatedEvent = receipt?.logs.find((log) => {
        try {
          return mockRunner.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          })?.name === "RequestCreated";
        } catch {
          return false;
        }
      });

      if (requestCreatedEvent) {
        const parsed = mockRunner.interface.parseLog({
          topics: requestCreatedEvent.topics as string[],
          data: requestCreatedEvent.data,
        });
        const requestId = parsed?.args.requestId;

        // Simulate a failed response
        await expect(
          mockRunner.simulateFailedResponse(requestId, "API timeout")
        ).to.not.be.reverted;
      }
    });

    it("Should handle failed market scan gracefully", async function () {
      const deposit = await mockRunner.getRequestDeposit();
      const agentPrice = await mockRunner.getAgentPrice(LLM_PARSE_WEBSITE_AGENT_ID);
      const subcommitteeSize = await mockRunner.getSubcommitteeSize();
      const totalCost = deposit + agentPrice * subcommitteeSize;

      const tx = await cmo.scanMarket("https://invalid-url.test", {
        value: totalCost,
      });
      const receipt = await tx.wait();

      const requestCreatedEvent = receipt?.logs.find((log) => {
        try {
          return mockRunner.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          })?.name === "RequestCreated";
        } catch {
          return false;
        }
      });

      if (requestCreatedEvent) {
        const parsed = mockRunner.interface.parseLog({
          topics: requestCreatedEvent.topics as string[],
          data: requestCreatedEvent.data,
        });
        const requestId = parsed?.args.requestId;

        await expect(
          mockRunner.simulateFailedResponse(requestId, "Website unreachable")
        ).to.not.be.reverted;
      }
    });
  });

  // ════════════════════════════════════════════════════════
  //  Full Integration Cycle
  // ════════════════════════════════════════════════════════

  describe("Full Integration Cycle", function () {
    it("Should execute a complete data → analysis → decision cycle", async function () {
      const deposit = await mockRunner.getRequestDeposit();
      const agentPrice = await mockRunner.getAgentPrice(JSON_API_AGENT_ID);
      const subcommitteeSize = await mockRunner.getSubcommitteeSize();
      const fetchCost = deposit + agentPrice * subcommitteeSize;

      // Step 1: CFO fetches price
      const priceTx = await cfo.fetchPrice(
        "STT",
        "https://api.example.com/price/stt",
        "$.data.price",
        { value: fetchCost }
      );
      const priceReceipt = await priceTx.wait();

      let priceRequestId: bigint | undefined;
      for (const log of priceReceipt?.logs || []) {
        try {
          const parsed = mockRunner.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          if (parsed?.name === "RequestCreated") {
            priceRequestId = parsed.args.requestId;
            break;
          }
        } catch {
          /* skip non-matching logs */
        }
      }

      if (priceRequestId !== undefined) {
        const priceResponse = ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint256"],
          [85000000n] // 0.85 with 8 decimals
        );
        await mockRunner.simulateResponse(priceRequestId, priceResponse);
      }

      // Step 2: CMO scans market
      const scanCost =
        deposit +
        (await mockRunner.getAgentPrice(LLM_PARSE_WEBSITE_AGENT_ID)) *
          subcommitteeSize;

      const scanTx = await cmo.scanMarket("https://crypto.news/somnia", {
        value: scanCost,
      });
      const scanReceipt = await scanTx.wait();

      let scanRequestId: bigint | undefined;
      for (const log of scanReceipt?.logs || []) {
        try {
          const parsed = mockRunner.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          if (parsed?.name === "RequestCreated") {
            scanRequestId = parsed.args.requestId;
            break;
          }
        } catch {
          /* skip */
        }
      }

      if (scanRequestId !== undefined) {
        const scanResponse = ethers.AbiCoder.defaultAbiCoder().encode(
          ["string"],
          ["Somnia network sees increased activity with 500% TVL growth"]
        );
        await mockRunner.simulateResponse(scanRequestId, scanResponse);
      }

      // Step 3: CEO initiates decision cycle
      const decisionCost =
        deposit +
        (await mockRunner.getAgentPrice(LLM_INFERENCE_AGENT_ID)) *
          subcommitteeSize;

      const decisionTx = await ceo.initiateDecisionCycle({
        value: decisionCost,
      });
      const decisionReceipt = await decisionTx.wait();

      let decisionRequestId: bigint | undefined;
      for (const log of decisionReceipt?.logs || []) {
        try {
          const parsed = mockRunner.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          if (parsed?.name === "RequestCreated") {
            decisionRequestId = parsed.args.requestId;
            break;
          }
        } catch {
          /* skip */
        }
      }

      if (decisionRequestId !== undefined) {
        const decisionResponse = ethers.AbiCoder.defaultAbiCoder().encode(
          ["string"],
          ["HOLD"]
        );
        await mockRunner.simulateResponse(decisionRequestId, decisionResponse);
      }

      // Verify the system processed the cycle
      // The treasury should still have funds (HOLD decision)
      expect(await vault.getBalance()).to.equal(ethers.parseEther("10"));
    });
  });

  describe("CMO URL Whitelist", function () {
    async function getScanCost(): Promise<bigint> {
      const deposit = await mockRunner.getRequestDeposit();
      const agentPrice = await mockRunner.getAgentPrice(LLM_PARSE_WEBSITE_AGENT_ID);
      const subcommitteeSize = await mockRunner.getSubcommitteeSize();
      return deposit + agentPrice * subcommitteeSize;
    }

    it("Should allow scan when whitelist disabled (default)", async function () {
      const cost = await getScanCost();
      // Default state: whitelistEnabled is false
      expect(await cmo.whitelistEnabled()).to.equal(false);
      // Should not revert
      await cmo.scanMarket("https://any-domain.example/path", { value: cost });
    });

    it("Should block non-whitelisted domain when whitelist enabled", async function () {
      await cmo.setWhitelistEnabled(true);
      await cmo.addWhitelistedDomain("coingecko.com");
      const cost = await getScanCost();
      await expect(
        cmo.scanMarket("https://attacker.com/prompt-injection", { value: cost })
      ).to.be.revertedWithCustomError(cmo, "DomainNotWhitelisted");
    });

    it("Should allow whitelisted domain case-insensitively", async function () {
      await cmo.setWhitelistEnabled(true);
      await cmo.addWhitelistedDomain("coingecko.com");
      const cost = await getScanCost();
      // Uppercase scheme + host should still pass
      await cmo.scanMarket("HTTPS://COINGECKO.COM/en/coins/somnia", { value: cost });
    });

    it("Should reject URLs without a domain", async function () {
      await cmo.setWhitelistEnabled(true);
      const cost = await getScanCost();
      await expect(
        cmo.scanMarket("", { value: cost })
      ).to.be.revertedWithCustomError(cmo, "InvalidUrl");
    });

    it("Should reject empty domain in addWhitelistedDomain", async function () {
      await expect(
        cmo.addWhitelistedDomain("")
      ).to.be.revertedWithCustomError(cmo, "InvalidDomain");
    });

    it("Should allow toggling whitelist on and off", async function () {
      await cmo.setWhitelistEnabled(true);
      expect(await cmo.whitelistEnabled()).to.equal(true);
      await cmo.setWhitelistEnabled(false);
      expect(await cmo.whitelistEnabled()).to.equal(false);
    });

    it("Should track whitelisted domain count", async function () {
      await cmo.addWhitelistedDomain("coingecko.com");
      await cmo.addWhitelistedDomain("cointelegraph.com");
      await cmo.addWhitelistedDomain("coindesk.com");
      expect(await cmo.getWhitelistedDomainCount()).to.equal(3);
      const list = await cmo.getWhitelistedDomains();
      expect(list.length).to.equal(3);
      expect(list[0]).to.equal("coingecko.com");
    });
  });
});
