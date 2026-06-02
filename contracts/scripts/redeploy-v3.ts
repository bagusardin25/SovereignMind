import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Redeploy TreasuryVault + 3 agent contracts (v3 — perbaikan fixes).
 * Keeps existing AgentRegistry.
 *
 * Changes from v2:
 *   - TreasuryVault: 2-step emergency withdraw + real executeRebalance
 *   - CFOAgent:  access control + deposit formula + safe risk fallback
 *   - CMOAgent:  access control + deposit formula + real confidence parsing
 *   - CEOAgent:  deposit formula + rebalance execution + request timeout
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log(
    "Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "STT\n"
  );

  // ── Existing contract (unchanged) ───────────────────────────
  const REGISTRY = "0x41A6a0c76ddAD6F5dAeC70F7aaFA439eba1AC0c3";
  const AGENT_RUNNER = "0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776";

  // Agent IDs (from Somnia platform / .env)
  const JSON_API_AGENT_ID = BigInt(
    process.env.JSON_API_AGENT_ID || "13174292974160097713"
  );
  const LLM_INFERENCE_AGENT_ID = BigInt(
    process.env.LLM_INFERENCE_AGENT_ID || "12847293847561029384"
  );
  const LLM_PARSE_WEBSITE_AGENT_ID = BigInt(
    process.env.LLM_PARSE_WEBSITE_AGENT_ID || "12875401142070969085"
  );

  console.log("═".repeat(50));
  console.log("  SovereignMind v3 Redeploy");
  console.log("  Keeping: AgentRegistry", REGISTRY);
  console.log("═".repeat(50) + "\n");

  // ── 1. Deploy TreasuryVault ───────────────────────────────────
  console.log("1/5 Deploying TreasuryVault (v3)...");
  const Treasury = await ethers.getContractFactory("TreasuryVault");
  const treasury = await Treasury.deploy(REGISTRY);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("   ✅ TreasuryVault:", treasuryAddress);

  // ── 2. Deploy CFOAgent ────────────────────────────────────────
  console.log("2/5 Deploying CFOAgent (v3)...");
  const CFO = await ethers.getContractFactory("CFOAgent");
  const cfo = await CFO.deploy(
    REGISTRY,
    AGENT_RUNNER,
    treasuryAddress,
    JSON_API_AGENT_ID,
    LLM_INFERENCE_AGENT_ID
  );
  await cfo.waitForDeployment();
  const cfoAddress = await cfo.getAddress();
  console.log("   ✅ CFOAgent:", cfoAddress);

  // ── 3. Deploy CMOAgent ────────────────────────────────────────
  console.log("3/5 Deploying CMOAgent (v3)...");
  const CMO = await ethers.getContractFactory("CMOAgent");
  const cmo = await CMO.deploy(
    REGISTRY,
    AGENT_RUNNER,
    treasuryAddress,
    LLM_PARSE_WEBSITE_AGENT_ID,
    LLM_INFERENCE_AGENT_ID
  );
  await cmo.waitForDeployment();
  const cmoAddress = await cmo.getAddress();
  console.log("   ✅ CMOAgent:", cmoAddress);

  // ── 4. Deploy CEOAgent ────────────────────────────────────────
  console.log("4/5 Deploying CEOAgent (v3)...");
  const CEO = await ethers.getContractFactory("CEOAgent");
  const ceo = await CEO.deploy(
    REGISTRY,
    AGENT_RUNNER,
    treasuryAddress,
    cfoAddress,
    cmoAddress,
    LLM_INFERENCE_AGENT_ID
  );
  await ceo.waitForDeployment();
  const ceoAddress = await ceo.getAddress();
  console.log("   ✅ CEOAgent:", ceoAddress);

  // ── 5. Configure roles ────────────────────────────────────────
  console.log("\n5/5 Configuring roles in AgentRegistry...");
  const registry = await ethers.getContractAt("AgentRegistry", REGISTRY);

  const CEO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CEO_ROLE"));
  const CFO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CFO_ROLE"));
  const CMO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CMO_ROLE"));

  // Deactivate old agents (ignore errors if already inactive or not registered)
  console.log("   Deactivating old agents...");
  for (const oldAddr of [
    "0xd58a92F4BF829921a6cdc6FeE54d7CC8743F75c9", // old CEO
    "0xEE3dB72FBBF25248edDe8324670aC8F1b9285869", // old CFO
    "0x9C13A3d3ca1BB420F6f2489c93785eCE3125c600", // old CMO
  ]) {
    try {
      const tx = await registry.deactivateAgent(oldAddr);
      await tx.wait();
      console.log(`   ✅ Deactivated ${oldAddr.slice(0, 10)}...`);
    } catch {
      console.log(`   ⚠️ Could not deactivate ${oldAddr.slice(0, 10)}... (may already be inactive)`);
    }
  }

  // Register new agents
  console.log("   Registering new agents...");
  const agents = [
    { address: cfoAddress, role: CFO_ROLE, name: "CFOAgent v3" },
    { address: cmoAddress, role: CMO_ROLE, name: "CMOAgent v3" },
    { address: ceoAddress, role: CEO_ROLE, name: "CEOAgent v3" },
  ];

  for (const agent of agents) {
    try {
      const tx = await registry.registerAgent(agent.role, agent.address);
      await tx.wait();
      console.log(`   ✅ ${agent.name} registered`);
    } catch (e: any) {
      console.log(`   ⚠️ ${agent.name}: ${e.message?.slice(0, 80)}`);
    }
  }

  // Grant treasury access to CEO
  try {
    await registry.grantTreasuryAccess(ceoAddress);
    console.log("   ✅ CEOAgent granted treasury access");
  } catch (e: any) {
    console.log("   ⚠️ Treasury access:", e.message?.slice(0, 80));
  }

  // ── Save addresses ──────────────────────────────────────────
  const addresses = {
    network: "somnia_testnet",
    chainId: 50312,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      agentRegistry: REGISTRY,
      treasuryVault: treasuryAddress,
      ceoAgent: ceoAddress,
      cfoAgent: cfoAddress,
      cmoAgent: cmoAddress,
    },
    config: {
      agentRunnerAddress: AGENT_RUNNER,
      jsonApiAgentId: JSON_API_AGENT_ID.toString(),
      llmInferenceAgentId: LLM_INFERENCE_AGENT_ID.toString(),
      llmParseWebsiteAgentId: LLM_PARSE_WEBSITE_AGENT_ID.toString(),
    },
  };

  // Save to contracts/
  const contractsPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(contractsPath, JSON.stringify(addresses, null, 2));
  console.log("\n📄 Saved:", contractsPath);

  // Save to frontend/src/lib/somnia/
  const frontendPath = path.join(
    __dirname, "..", "..", "frontend", "src", "lib", "somnia", "deployed-addresses.json"
  );
  fs.writeFileSync(frontendPath, JSON.stringify(addresses, null, 2));
  console.log("📄 Saved:", frontendPath);

  // ── Copy ABIs ───────────────────────────────────────────────
  console.log("\n📋 Copying ABIs to frontend...");
  const abiDir = path.join(__dirname, "..", "..", "frontend", "src", "lib", "somnia", "abis");
  if (!fs.existsSync(abiDir)) fs.mkdirSync(abiDir, { recursive: true });

  for (const name of ["AgentRegistry", "TreasuryVault", "CEOAgent", "CFOAgent", "CMOAgent"]) {
    const artifactPath = path.join(
      __dirname, "..", "artifacts", "contracts", `${name}.sol`, `${name}.json`
    );
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      fs.writeFileSync(path.join(abiDir, `${name}.json`), JSON.stringify(artifact.abi, null, 2));
      console.log(`   ✅ ${name}.json`);
    }
  }

  // ── Summary ─────────────────────────────────────────────────
  console.log("\n" + "═".repeat(50));
  console.log("  ✅ SovereignMind v3 Redeploy Complete!");
  console.log("═".repeat(50));
  console.log(`  AgentRegistry: ${REGISTRY} (unchanged)`);
  console.log(`  TreasuryVault: ${treasuryAddress}`);
  console.log(`  CEOAgent:      ${ceoAddress}`);
  console.log(`  CFOAgent:      ${cfoAddress}`);
  console.log(`  CMOAgent:      ${cmoAddress}`);
  console.log("\n⚠️  Next steps:");
  console.log("  1. Update orchestrator/.env with new contract addresses");
  console.log("  2. Update frontend/README.md with new addresses");
  console.log("  3. Fund new agent contracts with STT for deposits");
  console.log("  4. Deposit STT to new TreasuryVault");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
