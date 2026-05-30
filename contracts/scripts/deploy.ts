import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "STT"
  );

  // Configuration from env
  const AGENT_RUNNER_ADDRESS =
    process.env.AGENT_RUNNER_ADDRESS || ethers.ZeroAddress;
  const JSON_API_AGENT_ID = parseInt(process.env.JSON_API_AGENT_ID || "1");
  const LLM_INFERENCE_AGENT_ID = parseInt(
    process.env.LLM_INFERENCE_AGENT_ID || "2"
  );
  const LLM_PARSE_WEBSITE_AGENT_ID = parseInt(
    process.env.LLM_PARSE_WEBSITE_AGENT_ID || "3"
  );

  console.log("\n═══════════════════════════════════════");
  console.log("  SovereignMind Contract Deployment");
  console.log("═══════════════════════════════════════\n");

  // ═══════════════════════════════════════
  //  1. Deploy AgentRegistry
  // ═══════════════════════════════════════
  console.log("1/6 Deploying AgentRegistry...");
  const Registry = await ethers.getContractFactory("AgentRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("   ✅ AgentRegistry:", registryAddress);

  // ═══════════════════════════════════════
  //  2. Deploy TreasuryVault
  // ═══════════════════════════════════════
  console.log("2/6 Deploying TreasuryVault...");
  const Treasury = await ethers.getContractFactory("TreasuryVault");
  const treasury = await Treasury.deploy(registryAddress);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("   ✅ TreasuryVault:", treasuryAddress);

  // ═══════════════════════════════════════
  //  3. Deploy CFOAgent
  // ═══════════════════════════════════════
  console.log("3/6 Deploying CFOAgent...");
  const CFO = await ethers.getContractFactory("CFOAgent");
  const cfo = await CFO.deploy(
    registryAddress,
    AGENT_RUNNER_ADDRESS,
    treasuryAddress,
    JSON_API_AGENT_ID,
    LLM_INFERENCE_AGENT_ID
  );
  await cfo.waitForDeployment();
  const cfoAddress = await cfo.getAddress();
  console.log("   ✅ CFOAgent:", cfoAddress);

  // ═══════════════════════════════════════
  //  4. Deploy CMOAgent
  // ═══════════════════════════════════════
  console.log("4/6 Deploying CMOAgent...");
  const CMO = await ethers.getContractFactory("CMOAgent");
  const cmo = await CMO.deploy(
    registryAddress,
    AGENT_RUNNER_ADDRESS,
    treasuryAddress,
    LLM_PARSE_WEBSITE_AGENT_ID,
    LLM_INFERENCE_AGENT_ID
  );
  await cmo.waitForDeployment();
  const cmoAddress = await cmo.getAddress();
  console.log("   ✅ CMOAgent:", cmoAddress);

  // ═══════════════════════════════════════
  //  5. Deploy CEOAgent
  // ═══════════════════════════════════════
  console.log("5/6 Deploying CEOAgent...");
  const CEO = await ethers.getContractFactory("CEOAgent");
  const ceo = await CEO.deploy(
    registryAddress,
    AGENT_RUNNER_ADDRESS,
    treasuryAddress,
    cfoAddress,
    cmoAddress,
    LLM_INFERENCE_AGENT_ID
  );
  await ceo.waitForDeployment();
  const ceoAddress = await ceo.getAddress();
  console.log("   ✅ CEOAgent:", ceoAddress);

  // ═══════════════════════════════════════
  //  6. Configure Roles
  // ═══════════════════════════════════════
  console.log("6/6 Configuring roles...");
  const CEO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CEO_ROLE"));
  const CFO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CFO_ROLE"));
  const CMO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CMO_ROLE"));

  await registry.registerAgent(CEO_ROLE, ceoAddress);
  console.log("   ✅ CEO Agent registered");

  await registry.registerAgent(CFO_ROLE, cfoAddress);
  console.log("   ✅ CFO Agent registered");

  await registry.registerAgent(CMO_ROLE, cmoAddress);
  console.log("   ✅ CMO Agent registered");

  // Grant treasury access
  await registry.grantTreasuryAccess(ceoAddress);
  console.log("   ✅ CEO granted treasury access");

  await registry.grantTreasuryAccess(cfoAddress);
  console.log("   ✅ CFO granted treasury access");

  // ═══════════════════════════════════════
  //  Save Deployed Addresses
  // ═══════════════════════════════════════
  const addresses = {
    network: "somnia_testnet",
    chainId: 50312,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      agentRegistry: registryAddress,
      treasuryVault: treasuryAddress,
      ceoAgent: ceoAddress,
      cfoAgent: cfoAddress,
      cmoAgent: cmoAddress,
    },
    config: {
      agentRunnerAddress: AGENT_RUNNER_ADDRESS,
      jsonApiAgentId: JSON_API_AGENT_ID,
      llmInferenceAgentId: LLM_INFERENCE_AGENT_ID,
      llmParseWebsiteAgentId: LLM_PARSE_WEBSITE_AGENT_ID,
    },
  };

  // Save to contracts directory
  const contractsPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(contractsPath, JSON.stringify(addresses, null, 2));
  console.log("\n📄 Addresses saved to:", contractsPath);

  // Also save to frontend directory
  const frontendPath = path.join(
    __dirname,
    "..",
    "..",
    "frontend",
    "src",
    "lib",
    "somnia",
    "deployed-addresses.json"
  );
  const frontendDir = path.dirname(frontendPath);
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }
  fs.writeFileSync(frontendPath, JSON.stringify(addresses, null, 2));
  console.log("📄 Addresses saved to frontend:", frontendPath);

  console.log("\n═══════════════════════════════════════");
  console.log("  Deployment Complete! 🚀");
  console.log("═══════════════════════════════════════");
  console.log("\nUpdate your frontend .env.local with:");
  console.log(`NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`NEXT_PUBLIC_TREASURY_VAULT_ADDRESS=${treasuryAddress}`);
  console.log(`NEXT_PUBLIC_CEO_AGENT_ADDRESS=${ceoAddress}`);
  console.log(`NEXT_PUBLIC_CFO_AGENT_ADDRESS=${cfoAddress}`);
  console.log(`NEXT_PUBLIC_CMO_AGENT_ADDRESS=${cmoAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
