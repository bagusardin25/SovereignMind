// ============================================================
// SovereignMind v4 — Incremental Addon Deploy (Synthetic Portfolio)
// ============================================================
// Deploys only the new v4 contracts and links them to EXISTING
// deployed contracts (AgentRegistry, TreasuryVault, agents).
// Preserves all existing on-chain state.
//
// Usage:
//   cd contracts
//   npx hardhat run scripts/deploy-v4-addon.ts --network somnia
// ============================================================

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying v4 addon with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "STT\n");

  // Load existing deployed addresses
  const deployedPath = path.join(__dirname, "..", "deployed-addresses.json");
  const existing = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
  const existingContracts = existing.contracts;

  const AGENT_RUNNER = process.env.AGENT_RUNNER_ADDRESS || "0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776";

  console.log("=".repeat(55));
  console.log("  SovereignMind v4 Addon — Synthetic Portfolio");
  console.log("=".repeat(55) + "\n");

  // 1. Deploy PriceOracle
  console.log("1/4 Deploying PriceOracle...");
  const Oracle = await ethers.getContractFactory("PriceOracle");
  const oracle = await Oracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddr = await oracle.getAddress();
  console.log("   ✅ PriceOracle:", oracleAddr);

  // 2. Deploy SyntheticTokens (sBTC, sETH, sSOL)
  console.log("2/4 Deploying SyntheticTokens...");
  const SyntheticToken = await ethers.getContractFactory("SyntheticToken");
  const sBTC = await SyntheticToken.deploy("Synthetic Bitcoin", "sBTC", "bitcoin");
  await sBTC.waitForDeployment();
  const sBTCAddr = await sBTC.getAddress();
  console.log("   ✅ sBTC:", sBTCAddr);
  const sETH = await SyntheticToken.deploy("Synthetic Ethereum", "sETH", "ethereum");
  await sETH.waitForDeployment();
  const sETHAddr = await sETH.getAddress();
  console.log("   ✅ sETH:", sETHAddr);
  const sSOL = await SyntheticToken.deploy("Synthetic Solana", "sSOL", "solana");
  await sSOL.waitForDeployment();
  const sSOLAddr = await sSOL.getAddress();
  console.log("   ✅ sSOL:", sSOLAddr);

  // 3. Deploy SyntheticSwapRouter
  console.log("3/4 Deploying SyntheticSwapRouter...");
  const Router = await ethers.getContractFactory("SyntheticSwapRouter");
  const router = await Router.deploy(oracleAddr);
  await router.waitForDeployment();
  const routerAddr = await router.getAddress();
  console.log("   ✅ SyntheticSwapRouter:", routerAddr);

  // 4. Deploy VaultShares
  console.log("4/4 Deploying VaultShares...");
  const VaultShares = await ethers.getContractFactory("VaultShares");
  const vault = await VaultShares.deploy(oracleAddr, routerAddr);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("   ✅ VaultShares:", vaultAddr);

  // Configure roles
  console.log("\nConfiguring roles...");

  const UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPDATER_ROLE"));
  await (await oracle.grantRole(UPDATER_ROLE, existingContracts.cfoAgent)).wait();
  console.log("   ✅ CFO granted UPDATER_ROLE on PriceOracle");

  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  await (await sBTC.grantRole(MINTER_ROLE, routerAddr)).wait();
  await (await sETH.grantRole(MINTER_ROLE, routerAddr)).wait();
  await (await sSOL.grantRole(MINTER_ROLE, routerAddr)).wait();
  console.log("   ✅ SwapRouter granted MINTER_ROLE on all synthetic tokens");

  await (await router.registerSyntheticToken("bitcoin", sBTCAddr)).wait();
  await (await router.registerSyntheticToken("ethereum", sETHAddr)).wait();
  await (await router.registerSyntheticToken("solana", sSOLAddr)).wait();
  console.log("   ✅ Synthetic tokens registered in SwapRouter");

  const EXECUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("EXECUTOR_ROLE"));
  await (await router.grantRole(EXECUTOR_ROLE, vaultAddr)).wait();
  console.log("   ✅ VaultShares granted EXECUTOR_ROLE on SwapRouter");

  const PORTFOLIO_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PORTFOLIO_MANAGER_ROLE"));
  await (await vault.grantRole(PORTFOLIO_MANAGER_ROLE, deployer.address)).wait();
  console.log("   ✅ Deployer granted PORTFOLIO_MANAGER_ROLE on VaultShares");

  // Try to set oracle on CFO if the function exists
  try {
    const cfo = await ethers.getContractAt("CFOAgent", existingContracts.cfoAgent);
    await (await cfo.setOracle(oracleAddr)).wait();
    console.log("   ✅ CFO oracle set to PriceOracle");
  } catch {
    console.log("   ⚠️ CFO setOracle not available (might need contract update)");
  }

  // Save updated addresses (merge with existing)
  const updated = {
    ...existing,
    deployedAt: new Date().toISOString(),
    contracts: {
      ...existingContracts,
      priceOracle: oracleAddr,
      syntheticSwapRouter: routerAddr,
      vaultShares: vaultAddr,
      syntheticTokens: {
        sBTC: sBTCAddr,
        sETH: sETHAddr,
        sSOL: sSOLAddr,
      },
    },
  };

  // Save to contracts/
  fs.writeFileSync(deployedPath, JSON.stringify(updated, null, 2));
  console.log("\n📄 Saved:", deployedPath);

  // Save to frontend/
  const frontendPath = path.join(__dirname, "..", "..", "frontend", "src", "lib", "somnia", "deployed-addresses.json");
  const frontendDir = path.dirname(frontendPath);
  if (!fs.existsSync(frontendDir)) fs.mkdirSync(frontendDir, { recursive: true });
  fs.writeFileSync(frontendPath, JSON.stringify(updated, null, 2));
  console.log("📄 Saved:", frontendPath);

  // Copy ABIs
  console.log("\n📋 Copying ABIs to frontend...");
  const abiDir = path.join(frontendDir, "abis");
  if (!fs.existsSync(abiDir)) fs.mkdirSync(abiDir, { recursive: true });

  const newContracts = ["PriceOracle", "SyntheticToken", "SyntheticSwapRouter", "VaultShares"];
  for (const name of newContracts) {
    const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", `${name}.sol`, `${name}.json`);
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      fs.writeFileSync(path.join(abiDir, `${name}.json`), JSON.stringify(artifact.abi, null, 2));
      console.log(`   ✅ ${name}.json`);
    }
  }

  console.log("\n" + "=".repeat(55));
  console.log("  ✅ SovereignMind v4 Addon Deploy Complete!");
  console.log("=".repeat(55));
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
