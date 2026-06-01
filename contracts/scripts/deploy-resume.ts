import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Resume deployment — Deploys CEOAgent and configures roles.
 * Uses already-deployed contract addresses from the first deployment attempt.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Resuming deployment with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "STT"
  );

  // Already deployed addresses from previous run
  const registryAddress = "0x9B4f52744EE60A763d1a1966eCD91e04E668d2d6";
  const treasuryAddress = "0x269B22DFF373Bb3aC9c564141edbfe9De3903a40";
  const cfoAddress = "0x21e908dc15cb5Dbd659f107DC0058Fe2D762E385";
  const cmoAddress = "0xd110592795615D78776c52b0a5B254d5eb7B6662";

  // Agent Runner config
  const AGENT_RUNNER_ADDRESS =
    process.env.AGENT_RUNNER_ADDRESS || ethers.ZeroAddress;
  const JSON_API_AGENT_ID = BigInt(process.env.JSON_API_AGENT_ID || "1");
  const LLM_INFERENCE_AGENT_ID = BigInt(
    process.env.LLM_INFERENCE_AGENT_ID || "2"
  );
  const LLM_PARSE_WEBSITE_AGENT_ID = BigInt(
    process.env.LLM_PARSE_WEBSITE_AGENT_ID || "3"
  );

  console.log("\n═══════════════════════════════════════");
  console.log("  SovereignMind — Resume Deployment");
  console.log("═══════════════════════════════════════\n");
  console.log("Using existing contracts:");
  console.log("   AgentRegistry:", registryAddress);
  console.log("   TreasuryVault:", treasuryAddress);
  console.log("   CFOAgent:", cfoAddress);
  console.log("   CMOAgent:", cmoAddress);

  // ═══════════════════════════════════════
  //  1. Deploy CEOAgent
  // ═══════════════════════════════════════
  console.log("\n1/3 Deploying CEOAgent...");
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
  //  2. Configure Roles
  // ═══════════════════════════════════════
  console.log("2/3 Configuring roles...");
  const registry = await ethers.getContractAt("AgentRegistry", registryAddress);

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
  //  3. Save Deployed Addresses
  // ═══════════════════════════════════════
  console.log("3/3 Saving addresses...");

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
      jsonApiAgentId: JSON_API_AGENT_ID.toString(),
      llmInferenceAgentId: LLM_INFERENCE_AGENT_ID.toString(),
      llmParseWebsiteAgentId: LLM_PARSE_WEBSITE_AGENT_ID.toString(),
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
  console.log("\nAll contract addresses:");
  console.log(`  AgentRegistry:  ${registryAddress}`);
  console.log(`  TreasuryVault:  ${treasuryAddress}`);
  console.log(`  CEOAgent:       ${ceoAddress}`);
  console.log(`  CFOAgent:       ${cfoAddress}`);
  console.log(`  CMOAgent:       ${cmoAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
