import { ethers } from 'ethers';
import { config } from './config';
import path from 'path';
import fs from 'fs';

const agentRunnerABI = [
  'event RequestCreated(uint256 indexed id, uint256 indexed agentId, address requester)',
  'event ResponseSubmitted(uint256 indexed requestId, address indexed validator, uint8 status)',
  'event RequestFulfilled(uint256 indexed id, uint8 status)',
];

const cmoABI = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../frontend/src/lib/somnia/abis/CMOAgent.json'), 'utf-8'
));

async function main() {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const currentBlock = BigInt(await provider.getBlockNumber());
  const fromBlock = currentBlock - BigInt(5000);

  console.log('=== Agent Runner Callback Check ===\n');
  console.log(`Checking blocks ${fromBlock} to ${currentBlock}\n`);

  // Check AgentRunner events
  const runner = new ethers.Contract(config.addresses.agentRunner, agentRunnerABI, provider);

  // Check for RequestFulfilled events (callbacks)
  try {
    const fulfilled = await runner.queryFilter('RequestFulfilled', fromBlock, currentBlock);
    console.log(`📡 RequestFulfilled events: ${fulfilled.length}`);
    for (const e of fulfilled.slice(-5)) {
      if ('args' in e) {
        console.log(`   Request #${e.args[0]} → status: ${e.args[1]} (${['None','Pending','Success','Failed','TimedOut'][Number(e.args[1])] || '?'})`);
      }
    }
  } catch (err) {
    console.log('⚠️ Could not query RequestFulfilled:', (err as Error).message);
  }

  // Check CMO-specific events
  const cmo = new ethers.Contract(config.addresses.cmoAgent, cmoABI, provider);

  try {
    const scanStarted = await cmo.queryFilter('ScanStarted', fromBlock, currentBlock);
    console.log(`\n🌐 ScanStarted events: ${scanStarted.length}`);
    for (const e of scanStarted.slice(-3)) {
      if ('args' in e) {
        console.log(`   Block ${e.blockNumber}: requestId=${e.args[0]}, url=${e.args[1]}`);
      }
    }
  } catch (err) {
    console.log('⚠️ Could not query ScanStarted:', (err as Error).message);
  }

  try {
    const webScraped = await cmo.queryFilter('WebScraped', fromBlock, currentBlock);
    console.log(`\n📄 WebScraped events (Agent Runner callback received): ${webScraped.length}`);
    for (const e of webScraped.slice(-3)) {
      if ('args' in e) {
        console.log(`   Block ${e.blockNumber}: source=${e.args[0]}, dataLength=${e.args[1]}`);
      }
    }
  } catch (err) {
    console.log('⚠️ Could not query WebScraped:', (err as Error).message);
  }

  try {
    const sentiment = await cmo.queryFilter('SentimentAnalyzed', fromBlock, currentBlock);
    console.log(`\n💭 SentimentAnalyzed events: ${sentiment.length}`);
    for (const e of sentiment.slice(-3)) {
      if ('args' in e) {
        console.log(`   Block ${e.blockNumber}: source=${e.args[0]}, sentiment=${e.args[1]}`);
      }
    }
  } catch (err) {
    console.log('⚠️ Could not query SentimentAnalyzed:', (err as Error).message);
  }

  // Check on-chain state
  const scanCount = await cmo.scanCount();
  const signalCount = await cmo.getSignalCount();
  console.log(`\n📊 On-chain state: scanCount=${scanCount}, signalCount=${signalCount}`);
}

main().catch(console.error);
