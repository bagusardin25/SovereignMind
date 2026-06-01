import { ethers } from "hardhat";

async function main() {
  const feeData = await ethers.provider.getFeeData();
  console.log("Gas Price:", feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") + " Gwei" : "N/A");
  
  // Estimate gas for CEOAgent deployment
  // CEOAgent is ~22KB bytecode, typically takes around 1.5M - 2.5M gas to deploy.
  const estimatedGas = 2500000n; 
  if (feeData.gasPrice) {
    const costWei = feeData.gasPrice * estimatedGas;
    const costSTT = ethers.formatEther(costWei);
    console.log(`Estimated Deployment Cost: ${costSTT} STT`);
    console.log(`Your balance: 0.1668 STT`);
    if (parseFloat(costSTT) > 0.1668) {
      console.log("⚠️ WARNING: You might NOT have enough STT to deploy and configure roles!");
    } else {
      console.log("✅ SUCCESS: You should have enough STT to deploy!");
    }
  } else {
    console.log("Could not retrieve gas price.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
