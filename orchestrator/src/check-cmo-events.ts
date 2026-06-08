import { ethers } from 'ethers';
import { config } from './config';
import path from 'path';
import fs from 'fs';

const cmoABI = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../frontend/src/lib/somnia/abis/CMOAgent.json'), 'utf-8'
));

async function main() {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const currentBlock = BigInt(await provider.getBlockNumber());
  const fromBlock = currentBlock - BigInt(999); // 999 blocks only

  console.log('=== CMO Event Check (last 999 blocks) ===\n');
  console.log(`Blocks ${fromBlock} to ${currentBlock}\n`);

  const cmo = new ethers.Contract(config.addresses.cmoAgent, cmoABI, provider);

  const events = ['ScanStarted', 'WebScraped', 'SentimentAnalyzed'];
  for (const eventName of events) {
    try {
      const logs = await cmo.queryFilter(eventName, fromBlock, currentBlock);
      console.log(`${eventName}: ${logs.length} events`);
      for (const e of logs.slice(-5)) {
        if ('args' in e) {
          console.log(`   Block ${e.blockNumber} | tx: ${e.transactionHash} | args: ${JSON.stringify(e.args?.map(a => a.toString?.() ?? a))}`);
        }
      }
    } catch (err) {
      console.log(`${eventName}: ERROR - ${(err as Error).message}`);
    }
  }

  // Also check on-chain state
  const scanCount = await cmo.scanCount();
  const signalCount = await cmo.getSignalCount();
  const pendingRequests = await cmo.scanMarket; // just checking contract is reachable
  console.log(`\n📊 scanCount: ${scanCount}`);
  console.log(`📊 signalCount: ${signalCount}`);
  console.log(`📊 CMO balance: ${ethers.formatEther(await provider.getBalance(config.addresses.cmoAgent))} STT`);
}

main().catch(console.error);
