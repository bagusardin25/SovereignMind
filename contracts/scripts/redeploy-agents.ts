import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Redeploy only the 3 agent contracts (CFO, CMO, CEO) with fixed
 * scanMarket value forwarding. Keeps existing AgentRegistry and TreasuryVault.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "STT\n");

  // Load existing deployed addresses
  const existingPath = path.join(__dirname, "..", "deployed-addresses.json");
  const existing = JSON.parse(fs.readFileSync(existingPath, "utf-8"));
  const addr = existing.contracts;

  const REGISTRY = addr.agentRegistry;
  const TREASURY = addr.treasuryVault;
  const AGENT_RUNNER = existing.config.agentRunnerAddress;

  // Agent IDs (from Somnia platform)
  const JSON_API_AGENT_ID = BigInt(existing.config.jsonApiAgentId);
  const LLM_INFERENCE_AGENT_ID = BigInt(existing.config.llmInferenceAgentId);
  const LLM_PARSE_WEBSITE_AGENT_ID = BigInt(existing.config.llmParseWebsiteAgentId);

  // ── 1. Deploy CFOAgent ──────────────────────────────────────
  console.log("📊 Deploying CFOAgent...");
  const CFOAgent = await ethers.getContractFactory("CFOAgent");
  const cfo = await CFOAgent.deploy(
    REGISTRY,
    AGENT_RUNNER,
    TREASURY,
    JSON_API_AGENT_ID,
    LLM_INFERENCE_AGENT_ID
  );
  await cfo.waitForDeployment();
  const cfoAddress = await cfo.getAddress();
  console.log("   CFOAgent:", cfoAddress);

  // ── 2. Deploy CMOAgent ──────────────────────────────────────
  console.log("🌐 Deploying CMOAgent...");
  const CMOAgent = await ethers.getContractFactory("CMOAgent");
  const cmo = await CMOAgent.deploy(
    REGISTRY,
    AGENT_RUNNER,
    TREASURY,
    LLM_PARSE_WEBSITE_AGENT_ID,
    LLM_INFERENCE_AGENT_ID
  );
  await cmo.waitForDeployment();
  const cmoAddress = await cmo.getAddress();
  console.log("   CMOAgent:", cmoAddress);

  // ── 3. Deploy CEOAgent ──────────────────────────────────────
  console.log("🧠 Deploying CEOAgent...");
  const CEOAgent = await ethers.getContractFactory("CEOAgent");
  const ceo = await CEOAgent.deploy(
    REGISTRY,
    AGENT_RUNNER,
    TREASURY,
    cfoAddress,
    cmoAddress,
    LLM_INFERENCE_AGENT_ID
  );
  await ceo.waitForDeployment();
  const ceoAddress = await ceo.getAddress();
  console.log("   CEOAgent:", ceoAddress);

  // ── 4. Register agents in AgentRegistry ─────────────────────
  console.log("\n📋 Registering agents in AgentRegistry...");
  const registry = await ethers.getContractAt("AgentRegistry", REGISTRY);
  
  const CFO_ROLE = ethers.id("CFO_ROLE");
  const CMO_ROLE = ethers.id("CMO_ROLE");
  const CEO_ROLE = ethers.id("CEO_ROLE");

  try {
    const tx1 = await registry.registerAgent(cfoAddress, CFO_ROLE, "CFOAgent v2");
    await tx1.wait();
    console.log("   ✅ CFOAgent registered");
  } catch (e: any) {
    console.log("   ⚠️ CFO registration:", e.message?.slice(0, 80));
  }

  try {
    const tx2 = await registry.registerAgent(cmoAddress, CMO_ROLE, "CMOAgent v2");
    await tx2.wait();
    console.log("   ✅ CMOAgent registered");
  } catch (e: any) {
    console.log("   ⚠️ CMO registration:", e.message?.slice(0, 80));
  }

  try {
    const tx3 = await registry.registerAgent(ceoAddress, CEO_ROLE, "CEOAgent v2");
    await tx3.wait();
    console.log("   ✅ CEOAgent registered");
  } catch (e: any) {
    console.log("   ⚠️ CEO registration:", e.message?.slice(0, 80));
  }

  // ── 5. Authorize agents in TreasuryVault ────────────────────
  console.log("\n🔑 Authorizing agents in TreasuryVault...");
  const treasury = await ethers.getContractAt("TreasuryVault", TREASURY);
  const AGENT_ROLE = ethers.id("AGENT_ROLE");

  try {
    const tx4 = await treasury.grantRole(AGENT_ROLE, ceoAddress);
    await tx4.wait();
    console.log("   ✅ CEOAgent authorized");
  } catch (e: any) {
    console.log("   ⚠️ CEO treasury auth:", e.message?.slice(0, 80));
  }

  // ── 6. Save addresses ───────────────────────────────────────
  const outputPath = path.join(__dirname, "..", "deployed-addresses.json");
  const addresses = {
    ...existing,
    deployedAt: new Date().toISOString(),
    contracts: {
      ...addr,
      ceoAgent: ceoAddress,
      cfoAgent: cfoAddress,
      cmoAgent: cmoAddress,
    },
  };

  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log("\n📁 Addresses saved to deployed-addresses.json");

  // Also copy to frontend
  const frontendPath = path.join(__dirname, "..", "..", "frontend", "src", "lib", "somnia", "deployed-addresses.json");
  fs.writeFileSync(frontendPath, JSON.stringify(addresses, null, 2));
  console.log("📁 Addresses copied to frontend/src/lib/somnia/deployed-addresses.json");

  console.log("\n" + "═".repeat(50));
  console.log("  ✅ Agent Redeploy Complete!");
  console.log("═".repeat(50));
  console.log(`  CEOAgent: ${ceoAddress}`);
  console.log(`  CFOAgent: ${cfoAddress}`);
  console.log(`  CMOAgent: ${cmoAddress}`);
  console.log("\n⚠️  Update orchestrator/.env with the new agent addresses above.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
