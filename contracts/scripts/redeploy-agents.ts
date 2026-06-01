import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Redeploy only the 3 agent contracts (CFO, CMO, CEO) with fixed _calculateDeposit.
 * Keeps existing AgentRegistry and TreasuryVault.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "STT\n");

  // Existing contracts (unchanged)
  const REGISTRY = "0x41A6a0c76ddAD6F5dAeC70F7aaFA439eba1AC0c3";
  const TREASURY = "0x8f1c9bd9cc0EF059D0175fF05153D2fEe8Be7f9d";
  const AGENT_RUNNER = "0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776";

  // Agent IDs (from Somnia platform)
  const JSON_API_AGENT_ID = BigInt(process.env.JSON_API_AGENT_ID || "1");
  const LLM_INFERENCE_AGENT_ID = BigInt(process.env.LLM_INFERENCE_AGENT_ID || "2");
  const LLM_PARSE_WEBSITE_AGENT_ID = BigInt(process.env.LLM_PARSE_WEBSITE_AGENT_ID || "3");

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
  const addresses = {
    agentRegistry: REGISTRY,
    treasuryVault: TREASURY,
    agentRunner: AGENT_RUNNER,
    ceoAgent: ceoAddress,
    cfoAgent: cfoAddress,
    cmoAgent: cmoAddress,
    network: "somnia_testnet",
    chainId: 50312,
    deployedAt: new Date().toISOString(),
    note: "v2 redeploy — fixed _calculateDeposit for real AgentRunner",
  };

  const outputPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log("\n📁 Addresses saved to deployed-addresses.json");

  // Also copy to frontend
  const frontendPath = path.join(__dirname, "..", "..", "frontend", "deployed-addresses.json");
  fs.writeFileSync(frontendPath, JSON.stringify(addresses, null, 2));
  console.log("📁 Addresses copied to frontend/deployed-addresses.json");

  console.log("\n" + "═".repeat(50));
  console.log("  ✅ Agent Redeploy Complete!");
  console.log("═".repeat(50));
  console.log(`  CEOAgent: ${ceoAddress}`);
  console.log(`  CFOAgent: ${cfoAddress}`);
  console.log(`  CMOAgent: ${cmoAddress}`);
  console.log("\n⚠️  Update these addresses in:");
  console.log("  - frontend/src/lib/constants.ts");
  console.log("  - orchestrator/.env");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
