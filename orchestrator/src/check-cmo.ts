import { ethers } from 'ethers';
import { config } from './config';
import path from 'path';
import fs from 'fs';

// Load CMO ABI
const cmoABI = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../frontend/src/lib/somnia/abis/CMOAgent.json'),
  'utf-8'
));

async function main() {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const cmo = new ethers.Contract(config.addresses.cmoAgent, cmoABI, provider);

  console.log('=== CMO Agent Diagnostics ===\n');

  // Check balance
  const balance = await provider.getBalance(config.addresses.cmoAgent);
  console.log(`💰 CMO Balance: ${ethers.formatEther(balance)} STT`);

  // Check whitelist status
  const whitelistEnabled = await cmo.whitelistEnabled();
  console.log(`🔒 Whitelist Enabled: ${whitelistEnabled}`);

  if (whitelistEnabled) {
    const domains = await cmo.getWhitelistedDomains();
    console.log(`📋 Whitelisted domains: ${domains.join(', ') || '(none)'}`);

    const scanUrl = config.marketScanUrl;
    const domain = new URL(scanUrl).hostname.replace('www.', '');
    const isWhitelisted = await cmo.whitelistedDomains(domain);
    console.log(`🌐 Target URL: ${scanUrl}`);
    console.log(`✅ Domain "${domain}" whitelisted: ${isWhitelisted}`);
  }

  // Check signal count
  const signalCount = await cmo.getSignalCount();
  console.log(`📊 Signal count: ${signalCount}`);

  // Check scan count
  const scanCount = await cmo.scanCount();
  console.log(`🔄 Scan count: ${scanCount}`);

  // Check agent IDs
  const parseWebAgentId = await cmo.parseWebAgentId();
  const llmAgentId = await cmo.llmAgentId();
  console.log(`🤖 ParseWeb Agent ID: ${parseWebAgentId}`);
  console.log(`🤖 LLM Agent ID: ${llmAgentId}`);
}

main().catch(console.error);
