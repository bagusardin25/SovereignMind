// ============================================================
// SovereignMind — ABI Sync Script
// ============================================================
// Copies contract ABIs from Hardhat artifacts to frontend and
// orchestrator. Run after every contract change.
//
// Usage:
//   cd contracts
//   npx hardhat run scripts/copy-abis.ts
// ============================================================

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..", "..");
const ARTIFACTS = path.join(ROOT, "contracts", "artifacts", "contracts");

const TARGETS = [
  { name: "AgentRegistry", source: "AgentRegistry.sol/AgentRegistry.json" },
  { name: "CEOAgent", source: "CEOAgent.sol/CEOAgent.json" },
  { name: "CFOAgent", source: "CFOAgent.sol/CFOAgent.json" },
  { name: "CMOAgent", source: "CMOAgent.sol/CMOAgent.json" },
  { name: "TreasuryVault", source: "TreasuryVault.sol/TreasuryVault.json" },
  { name: "PriceOracle", source: "PriceOracle.sol/PriceOracle.json" },
  { name: "SyntheticToken", source: "SyntheticToken.sol/SyntheticToken.json" },
  { name: "SyntheticSwapRouter", source: "SyntheticSwapRouter.sol/SyntheticSwapRouter.json" },
  { name: "VaultShares", source: "VaultShares.sol/VaultShares.json" },
];

const DESTINATIONS = [
  path.join(ROOT, "frontend", "src", "lib", "somnia", "abis"),
  path.join(ROOT, "orchestrator", "src", "abis"),
];

async function main() {
  console.log("Syncing ABIs from artifacts to frontend + orchestrator\n");

  for (const target of TARGETS) {
    const artifactPath = path.join(ARTIFACTS, target.source);
    if (!fs.existsSync(artifactPath)) {
      console.error(`❌ Missing artifact: ${artifactPath}`);
      console.error(`   Run 'npx hardhat compile' first.`);
      process.exit(1);
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abi = artifact.abi;
    if (!abi) {
      console.error(`❌ No ABI in artifact: ${target.name}`);
      process.exit(1);
    }
    const abiJson = JSON.stringify(abi, null, 2) + "\n";

    for (const destDir of DESTINATIONS) {
      const destPath = path.join(destDir, `${target.name}.json`);
      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(destPath, abiJson, "utf8");
    }

    console.log(`✅ ${target.name} — ${abi.length} entries`);
  }

  console.log("\n✔ ABIs synced. Verify with:");
  console.log("  diff frontend/src/lib/somnia/abis/CEOAgent.json orchestrator/src/abis/CEOAgent.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
