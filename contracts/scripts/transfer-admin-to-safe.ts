// ============================================================
// SovereignMind — Transfer Admin to Gnosis Safe (Multisig)
// ============================================================
// Transfers DEFAULT_ADMIN_ROLE from current EOA admin to a
// Gnosis Safe (2-of-3 or similar) for all SovereignMind contracts.
//
// PREREQUISITE: Create the Safe first at https://safe.global
// (Somnia Testnet is supported via the Safe UI)
//
// Usage:
//   cd contracts
//   npx hardhat run scripts/transfer-admin-to-safe.ts --network somnia
//   (will prompt for SAFE_ADDRESS env var, or set in .env)
// ============================================================

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
  if (!SAFE_ADDRESS || !ethers.isAddress(SAFE_ADDRESS)) {
    throw new Error("Set SAFE_ADDRESS env var to a valid Ethereum address");
  }
  if (SAFE_ADDRESS === ethers.ZeroAddress) {
    throw new Error("SAFE_ADDRESS cannot be zero address");
  }

  const [currentAdmin] = await ethers.getSigners();
  console.log("Current admin (EOA):", currentAdmin.address);
  console.log("Target Safe address:", SAFE_ADDRESS);
  console.log();

  if (currentAdmin.address.toLowerCase() === SAFE_ADDRESS.toLowerCase()) {
    throw new Error("SAFE_ADDRESS is the same as the current admin — aborting");
  }

  // Load deployed addresses
  const deployedPath = path.join(__dirname, "..", "deployed-addresses.json");
  const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
  const contracts = deployed.contracts;

  // Contracts that have DEFAULT_ADMIN_ROLE to transfer
  // (TreasuryVault + PriceOracle + agents)
  const targets = [
    { name: "AgentRegistry", address: contracts.agentRegistry },
    { name: "TreasuryVault", address: contracts.treasuryVault },
    { name: "CEOAgent", address: contracts.ceoAgent },
    { name: "CFOAgent", address: contracts.cfoAgent },
    { name: "CMOAgent", address: contracts.cmoAgent },
  ];

  // Filter out optional contracts (v4 may not be deployed yet)
  if (contracts.priceOracle) {
    targets.push({ name: "PriceOracle", address: contracts.priceOracle });
  }
  if (contracts.vaultShares) {
    targets.push({ name: "VaultShares", address: contracts.vaultShares });
  }
  if (contracts.syntheticSwapRouter) {
    targets.push({ name: "SyntheticSwapRouter", address: contracts.syntheticSwapRouter });
  }

  console.log(`Transferring DEFAULT_ADMIN_ROLE on ${targets.length} contracts\n`);

  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash; // OZ uses bytes32(0) for DEFAULT_ADMIN_ROLE

  for (const target of targets) {
    console.log(`\n━━━ ${target.name} (${target.address}) ━━━`);

    // Check current admin
    const contract = await ethers.getContractAt(
      [
        "function hasRole(bytes32,address) view returns (bool)",
        "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
        "function grantRole(bytes32,address)",
        "function renounceRole(bytes32,address)",
      ],
      target.address
    );

    let adminRole: string;
    try {
      adminRole = await contract.DEFAULT_ADMIN_ROLE();
    } catch {
      adminRole = DEFAULT_ADMIN_ROLE;
    }

    const safeHasAdmin = await contract.hasRole(adminRole, SAFE_ADDRESS);
    const eoaHasAdmin = await contract.hasRole(adminRole, currentAdmin.address);

    console.log(`  EOA has admin:    ${eoaHasAdmin}`);
    console.log(`  Safe has admin:   ${safeHasAdmin}`);

    if (eoaHasAdmin && safeHasAdmin) {
      console.log(`  ⏭ Already transferred, skipping`);
      continue;
    }

    if (!eoaHasAdmin) {
      console.log(`  ⚠️ EOA does not have admin role — cannot transfer. Skipping.`);
      continue;
    }

    // Step 1: Grant admin to Safe
    if (!safeHasAdmin) {
      console.log(`  → Granting DEFAULT_ADMIN_ROLE to Safe...`);
      const grantTx = await contract.grantRole(adminRole, SAFE_ADDRESS);
      console.log(`    tx: ${grantTx.hash}`);
      await grantTx.wait();
      console.log(`    ✅ Granted`);
    } else {
      console.log(`  ⏭ Safe already has admin role`);
    }

    // Step 2: Renounce admin from EOA
    console.log(`  → Renouncing DEFAULT_ADMIN_ROLE from EOA...`);
    try {
      const renounceTx = await contract.renounceRole(adminRole, currentAdmin.address);
      console.log(`    tx: ${renounceTx.hash}`);
      await renounceTx.wait();
      console.log(`    ✅ Renounced`);
    } catch (err) {
      console.log(`    ❌ Renounce failed: ${(err as Error).message?.slice(0, 100)}`);
      console.log(`    ⚠️ Manual action required: call renounceRole(DEFAULT_ADMIN_ROLE, ${currentAdmin.address}) from the Safe`);
    }
  }

  console.log("\n\n═══ Transfer Complete ═══");
  console.log("Next steps:");
  console.log("1. Verify on block explorer: each contract should show the Safe as admin");
  console.log("2. Test admin actions via Safe UI: https://safe.global/");
  console.log("3. Save Safe address to deployed-addresses.json for reference");
  console.log();
  console.log("⚠️  IMPORTANT: The orchestrator's EOA can still trigger cycles (not an admin role).");
  console.log("    If you also want to gate the orchestrator behind the Safe, you'll need");
  console.log("    to redesign the orchestrator to propose→execute pattern via Safe transactions.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
