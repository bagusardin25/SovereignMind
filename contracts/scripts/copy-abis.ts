import * as fs from "fs";
import * as path from "path";

const CONTRACTS = [
  "AgentRegistry",
  "TreasuryVault",
  "CEOAgent",
  "CFOAgent",
  "CMOAgent",
];

const ARTIFACTS_DIR = path.join(__dirname, "..", "artifacts", "contracts");
const OUTPUT_DIR = path.join(
  __dirname,
  "..",
  "..",
  "frontend",
  "src",
  "lib",
  "somnia",
  "abis"
);

function main() {
  console.log("═══════════════════════════════════════");
  console.log("  Copying ABIs to Frontend");
  console.log("═══════════════════════════════════════\n");

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log("📁 Created output directory:", OUTPUT_DIR, "\n");
  }

  let successCount = 0;
  let skippedCount = 0;

  for (const contractName of CONTRACTS) {
    const artifactPath = path.join(
      ARTIFACTS_DIR,
      `${contractName}.sol`,
      `${contractName}.json`
    );

    if (!fs.existsSync(artifactPath)) {
      console.log(
        `⚠️  Artifact not found: ${contractName} (run 'npx hardhat compile' first)`
      );
      skippedCount++;
      continue;
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    const abi = artifact.abi;

    const outputPath = path.join(OUTPUT_DIR, `${contractName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));
    console.log(`✅ ${contractName}.json (${abi.length} ABI entries)`);
    successCount++;
  }

  console.log("\n═══════════════════════════════════════");
  console.log(`  Done! ${successCount} copied, ${skippedCount} skipped`);
  console.log("  Output:", OUTPUT_DIR);
  console.log("═══════════════════════════════════════");
}

main();
