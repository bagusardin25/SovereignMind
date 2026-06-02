import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * SovereignMind v4 — Full deploy with Synthetic Portfolio System.
 *
 * Deploys:
 *   1. AgentRegistry (new)
 *   2. PriceOracle (new)
 *   3. SyntheticToken × 3 (sBTC, sETH, sSOL)
 *   4. SyntheticSwapRouter
 *   5. VaultShares
 *   6. TreasuryVault
 *   7. CFOAgent
 *   8. CMOAgent
 *   9. CEOAgent
 *  10. Configure roles & permissions
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log(
    "Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "STT\n"
  );

  const AGENT_RUNNER =
    process.env.AGENT_RUNNER_ADDRESS || "0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776";
  const JSON_API_AGENT_ID = BigInt(
    process.env.JSON_API_AGENT_ID || "13174292974160097713"
  );
  const LLM_INFERENCE_AGENT_ID = BigInt(
    process.env.LLM_INFERENCE_AGENT_ID || "12847293847561029384"
  );
  const LLM_PARSE_WEBSITE_AGENT_ID = BigInt(
    process.env.LLM_PARSE_WEBSITE_AGENT_ID || "12875401142070969085"
  );

  console.log("═".repeat(55));
  console.log("  SovereignMind v4 — Synthetic Portfolio System");
  console.log("═".repeat(55) + "\n");

  // ═══════════════════════════════════════════════════════
  //  1. AgentRegistry
  // ═══════════════════════════════════════════════════════
  console.log("1/10 Deploying AgentRegistry...");
  const Registry = await ethers.getContractFactory("AgentRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("   ✅ AgentRegistry:", registryAddr);

  // ═══════════════════════════════════════════════════════
  //  2. PriceOracle
  // ═══════════════════════════════════════════════════════
  console.log("2/10 Deploying PriceOracle...");
  const Oracle = await ethers.getContractFactory("PriceOracle");
  const oracle = await Oracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddr = await oracle.getAddress();
  console.log("   ✅ PriceOracle:", oracleAddr);

  // ═══════════════════════════════════════════════════════
  //  3. SyntheticTokens (sBTC, sETH, sSOL)
  // ═══════════════════════════════════════════════════════
  console.log("3/10 Deploying SyntheticTokens...");
  const SyntheticToken = await ethers.getContractFactory("SyntheticToken");

  const sBTC = await SyntheticToken.deploy(
    "Synthetic Bitcoin",
    "sBTC",
    "bitcoin"
  );
  await sBTC.waitForDeployment();
  const sBTCAddr = await sBTC.getAddress();
  console.log("   ✅ sBTC:", sBTCAddr);

  const sETH = await SyntheticToken.deploy(
    "Synthetic Ethereum",
    "sETH",
    "ethereum"
  );
  await sETH.waitForDeployment();
  const sETHAddr = await sETH.getAddress();
  console.log("   ✅ sETH:", sETHAddr);

  const sSOL = await SyntheticToken.deploy(
    "Synthetic Solana",
    "sSOL",
    "solana"
  );
  await sSOL.waitForDeployment();
  const sSOLAddr = await sSOL.getAddress();
  console.log("   ✅ sSOL:", sSOLAddr);

  // ═══════════════════════════════════════════════════════
  //  4. SyntheticSwapRouter
  // ═══════════════════════════════════════════════════════
  console.log("4/10 Deploying SyntheticSwapRouter...");
  const Router = await ethers.getContractFactory("SyntheticSwapRouter");
  const router = await Router.deploy(oracleAddr);
  await router.waitForDeployment();
  const routerAddr = await router.getAddress();
  console.log("   ✅ SyntheticSwapRouter:", routerAddr);

  // ═══════════════════════════════════════════════════════
  //  5. VaultShares
  // ═══════════════════════════════════════════════════════
  console.log("5/10 Deploying VaultShares...");
  const VaultShares = await ethers.getContractFactory("VaultShares");
  const vault = await VaultShares.deploy(oracleAddr, routerAddr);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("   ✅ VaultShares:", vaultAddr);

  // ═══════════════════════════════════════════════════════
  //  6. TreasuryVault
  // ═══════════════════════════════════════════════════════
  console.log("6/10 Deploying TreasuryVault...");
  const Treasury = await ethers.getContractFactory("TreasuryVault");
  const treasury = await Treasury.deploy(registryAddr);
  await treasury.waitForDeployment();
  const treasuryAddr = await treasury.getAddress();
  console.log("   ✅ TreasuryVault:", treasuryAddr);

  // ═══════════════════════════════════════════════════════
  //  7. CFOAgent
  // ═══════════════════════════════════════════════════════
  console.log("7/10 Deploying CFOAgent...");
  const CFO = await ethers.getContractFactory("CFOAgent");
  const cfo = await CFO.deploy(
    registryAddr,
    AGENT_RUNNER,
    treasuryAddr,
    JSON_API_AGENT_ID,
    LLM_INFERENCE_AGENT_ID
  );
  await cfo.waitForDeployment();
  const cfoAddr = await cfo.getAddress();
  console.log("   ✅ CFOAgent:", cfoAddr);

  // ═══════════════════════════════════════════════════════
  //  8. CMOAgent
  // ═══════════════════════════════════════════════════════
  console.log("8/10 Deploying CMOAgent...");
  const CMO = await ethers.getContractFactory("CMOAgent");
  const cmo = await CMO.deploy(
    registryAddr,
    AGENT_RUNNER,
    treasuryAddr,
    LLM_PARSE_WEBSITE_AGENT_ID,
    LLM_INFERENCE_AGENT_ID
  );
  await cmo.waitForDeployment();
  const cmoAddr = await cmo.getAddress();
  console.log("   ✅ CMOAgent:", cmoAddr);

  // ═══════════════════════════════════════════════════════
  //  9. CEOAgent
  // ═══════════════════════════════════════════════════════
  console.log("9/10 Deploying CEOAgent...");
  const CEO = await ethers.getContractFactory("CEOAgent");
  const ceo = await CEO.deploy(
    registryAddr,
    AGENT_RUNNER,
    treasuryAddr,
    cfoAddr,
    cmoAddr,
    LLM_INFERENCE_AGENT_ID
  );
  await ceo.waitForDeployment();
  const ceoAddr = await ceo.getAddress();
  console.log("   ✅ CEOAgent:", ceoAddr);

  // ═══════════════════════════════════════════════════════
  //  10. Configure Roles & Permissions
  // ═══════════════════════════════════════════════════════
  console.log("\n10/10 Configuring roles...");

  // AgentRegistry roles
  const CEO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CEO_ROLE"));
  const CFO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CFO_ROLE"));
  const CMO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CMO_ROLE"));

  await (await registry.registerAgent(CEO_ROLE, ceoAddr)).wait();
  console.log("   ✅ CEOAgent registered in registry");
  await (await registry.registerAgent(CFO_ROLE, cfoAddr)).wait();
  console.log("   ✅ CFOAgent registered in registry");
  await (await registry.registerAgent(CMO_ROLE, cmoAddr)).wait();
  console.log("   ✅ CMOAgent registered in registry");

  await (await registry.grantTreasuryAccess(ceoAddr)).wait();
  console.log("   ✅ CEOAgent granted treasury access");
  await (await registry.grantTreasuryAccess(cfoAddr)).wait();
  console.log("   ✅ CFOAgent granted treasury access");

  // PriceOracle: grant UPDATER_ROLE to CFO
  const UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPDATER_ROLE"));
  await (await oracle.grantRole(UPDATER_ROLE, cfoAddr)).wait();
  console.log("   ✅ CFO granted UPDATER_ROLE on PriceOracle");

  // SyntheticTokens: grant MINTER_ROLE to SwapRouter
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  await (await sBTC.grantRole(MINTER_ROLE, routerAddr)).wait();
  await (await sETH.grantRole(MINTER_ROLE, routerAddr)).wait();
  await (await sSOL.grantRole(MINTER_ROLE, routerAddr)).wait();
  console.log("   ✅ SwapRouter granted MINTER_ROLE on all synthetic tokens");

  // SwapRouter: register synthetic tokens + grant EXECUTOR_ROLE to VaultShares
  await (await router.registerSyntheticToken("bitcoin", sBTCAddr)).wait();
  await (await router.registerSyntheticToken("ethereum", sETHAddr)).wait();
  await (await router.registerSyntheticToken("solana", sSOLAddr)).wait();
  console.log("   ✅ Synthetic tokens registered in SwapRouter");

  const EXECUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("EXECUTOR_ROLE"));
  await (await router.grantRole(EXECUTOR_ROLE, vaultAddr)).wait();
  console.log("   ✅ VaultShares granted EXECUTOR_ROLE on SwapRouter");

  // VaultShares: grant PORTFOLIO_MANAGER_ROLE to deployer (orchestrator wallet)
  const PORTFOLIO_MANAGER_ROLE = ethers.keccak256(
    ethers.toUtf8Bytes("PORTFOLIO_MANAGER_ROLE")
  );
  await (
    await vault.grantRole(PORTFOLIO_MANAGER_ROLE, deployer.address)
  ).wait();
  console.log("   ✅ Deployer granted PORTFOLIO_MANAGER_ROLE on VaultShares");

  // CFO: set oracle address
  try {
    await (await cfo.setOracle(oracleAddr)).wait();
    console.log("   ✅ CFO oracle set to PriceOracle");
  } catch (e: any) {
    console.log(
      "   ⚠️ CFO setOracle:",
      e.message?.slice(0, 60),
      "(may not have setOracle yet)"
    );
  }

  // ═══════════════════════════════════════════════════════
  //  Save Addresses
  // ═══════════════════════════════════════════════════════
  const addresses = {
    network: "somnia_testnet",
    chainId: 50312,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    version: "v4-portfolio",
    contracts: {
      agentRegistry: registryAddr,
      treasuryVault: treasuryAddr,
      ceoAgent: ceoAddr,
      cfoAgent: cfoAddr,
      cmoAgent: cmoAddr,
      priceOracle: oracleAddr,
      syntheticSwapRouter: routerAddr,
      vaultShares: vaultAddr,
      syntheticTokens: {
        sBTC: sBTCAddr,
        sETH: sETHAddr,
        sSOL: sSOLAddr,
      },
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

  // Save to frontend/
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
  if (!fs.existsSync(frontendDir)) fs.mkdirSync(frontendDir, { recursive: true });
  fs.writeFileSync(frontendPath, JSON.stringify(addresses, null, 2));
  console.log("📄 Saved:", frontendPath);

  // Copy ABIs
  console.log("\n📋 Copying ABIs to frontend...");
  const abiDir = path.join(frontendDir, "abis");
  if (!fs.existsSync(abiDir)) fs.mkdirSync(abiDir, { recursive: true });

  const contractNames = [
    "AgentRegistry",
    "TreasuryVault",
    "CEOAgent",
    "CFOAgent",
    "CMOAgent",
    "PriceOracle",
    "SyntheticToken",
    "SyntheticSwapRouter",
    "VaultShares",
  ];
  for (const name of contractNames) {
    const artifactPath = path.join(
      __dirname,
      "..",
      "artifacts",
      "contracts",
      `${name}.sol`,
      `${name}.json`
    );
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      fs.writeFileSync(
        path.join(abiDir, `${name}.json`),
        JSON.stringify(artifact.abi, null, 2)
      );
      console.log(`   ✅ ${name}.json`);
    }
  }

  // ═══════════════════════════════════════════════════════
  //  Summary
  // ═══════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(55));
  console.log("  ✅ SovereignMind v4 Deploy Complete!");
  console.log("═".repeat(55));
  console.log(`  AgentRegistry:       ${registryAddr}`);
  console.log(`  TreasuryVault:       ${treasuryAddr}`);
  console.log(`  CEOAgent:            ${ceoAddr}`);
  console.log(`  CFOAgent:            ${cfoAddr}`);
  console.log(`  CMOAgent:            ${cmoAddr}`);
  console.log(`  PriceOracle:         ${oracleAddr}`);
  console.log(`  SyntheticSwapRouter: ${routerAddr}`);
  console.log(`  VaultShares:         ${vaultAddr}`);
  console.log(`  sBTC:                ${sBTCAddr}`);
  console.log(`  sETH:                ${sETHAddr}`);
  console.log(`  sSOL:                ${sSOLAddr}`);
  console.log("\n⚠️  Next steps:");
  console.log("  1. Update orchestrator/.env with new addresses");
  console.log("  2. Fund agent contracts with STT for deposits");
  console.log("  3. Fund SwapRouter with STT reserves for redemptions");
  console.log("  4. Deposit initial STT to VaultShares");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
