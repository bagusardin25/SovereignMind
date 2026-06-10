// Test script to debug CFO deposit calculation issue
const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 Debugging CFO Deposit Calculation\n');

  const [signer] = await ethers.getSigners();
  console.log('Deployer:', signer.address);
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(signer.address)), 'STT\n');

  // Contract addresses
  const CFO_ADDRESS = '0x8dd3a39C84256f272C769183cbD1b5BCF2C68377';
  const AGENT_RUNNER_ADDRESS = '0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776';

  // Load CFOAgent
  const CFOAgent = await ethers.getContractAt('CFOAgent', CFO_ADDRESS);
  console.log('✅ CFOAgent loaded at:', CFO_ADDRESS);

  // Check owner
  const owner = await CFOAgent.owner();
  console.log('Contract owner:', owner);
  console.log('Is signer owner?', owner.toLowerCase() === signer.address.toLowerCase());

  // Get agent IDs
  const jsonApiAgentId = await CFOAgent.jsonApiAgentId();
  const llmAgentId = await CFOAgent.llmAgentId();
  console.log('\nAgent IDs:');
  console.log('  JSON API Agent:', jsonApiAgentId.toString());
  console.log('  LLM Agent:', llmAgentId.toString());

  // Try to get deposit info from AgentRunner
  console.log('\n🔧 Testing AgentRunner calls...');
  const agentRunnerABI = [
    'function getRequestDeposit() view returns (uint256)',
    'function getAgentPrice(uint256 agentId) view returns (uint256)',
    'function getSubcommitteeSize() view returns (uint256)',
  ];
  const agentRunner = new ethers.Contract(AGENT_RUNNER_ADDRESS, agentRunnerABI, signer);

  try {
    const baseDeposit = await agentRunner.getRequestDeposit();
    console.log('✅ Base deposit:', ethers.formatEther(baseDeposit), 'STT');
  } catch (e) {
    console.log('❌ getRequestDeposit failed:', e.message);
  }

  try {
    const jsonApiPrice = await agentRunner.getAgentPrice(jsonApiAgentId);
    console.log('✅ JSON API price:', ethers.formatEther(jsonApiPrice), 'STT');
  } catch (e) {
    console.log('❌ getAgentPrice(jsonApiAgentId) failed:', e.message);
  }

  try {
    const subcommitteeSize = await agentRunner.getSubcommitteeSize();
    console.log('✅ Subcommittee size:', subcommitteeSize.toString());
  } catch (e) {
    console.log('❌ getSubcommitteeSize failed:', e.message);
  }

  // Test estimate gas for fetchPrice
  console.log('\n🧪 Testing fetchPrice estimateGas...');
  const symbol = 'bitcoin';
  const apiUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
  const jsonPath = 'bitcoin.usd';

  // Calculate deposit using orchestrator logic
  console.log('\n💰 Calculating deposit (orchestrator logic)...');
  try {
    let baseDeposit = ethers.parseEther('0.03'); // fallback
    let perAgentCost = ethers.parseEther('0.10'); // fallback

    try {
      baseDeposit = await agentRunner.getRequestDeposit();
      console.log('  Got base deposit from contract:', ethers.formatEther(baseDeposit));
    } catch {
      console.log('  Using fallback base deposit:', ethers.formatEther(baseDeposit));
    }

    try {
      perAgentCost = await agentRunner.getAgentPrice(jsonApiAgentId);
      console.log('  Got per-agent cost from contract:', ethers.formatEther(perAgentCost));
    } catch {
      console.log('  Using fallback per-agent cost:', ethers.formatEther(perAgentCost));
    }

    const totalDeposit = baseDeposit + (perAgentCost * 3n);
    console.log('  Total deposit required:', ethers.formatEther(totalDeposit), 'STT');

    // Try estimate gas
    console.log('\n⚡ Attempting estimateGas with deposit:', ethers.formatEther(totalDeposit), 'STT');
    const estimatedGas = await CFOAgent.fetchPrice.estimateGas(
      symbol,
      apiUrl,
      jsonPath,
      { value: totalDeposit }
    );
    console.log('✅ Estimate gas SUCCESS! Gas:', estimatedGas.toString());

    // Try actual call
    console.log('\n📤 Sending transaction...');
    const tx = await CFOAgent.fetchPrice(symbol, apiUrl, jsonPath, { value: totalDeposit });
    console.log('Transaction hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed! Block:', receipt.blockNumber);

  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.data) {
      console.log('Error data:', error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
