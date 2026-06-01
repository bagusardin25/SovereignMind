import { ethers } from 'ethers';
import { config } from '../config';
import { logger } from '../logger';
import path from 'path';
import fs from 'fs';

// ---------------------------------------------------------------------------
// ABI Loader
// ---------------------------------------------------------------------------

/**
 * Load a contract ABI from compiled artifacts.
 * Checks the frontend ABIs directory first (pure ABI array),
 * then falls back to Hardhat-style artifacts ({abi, bytecode}).
 */
function loadABI(contractName: string): ethers.InterfaceAbi {
  // Try from frontend ABIs first (pure ABI array)
  const frontendPath = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'frontend',
    'src',
    'lib',
    'somnia',
    'abis',
    `${contractName}.json`,
  );

  if (fs.existsSync(frontendPath)) {
    logger.debug(`Loading ABI for ${contractName} from frontend ABIs`);
    return JSON.parse(fs.readFileSync(frontendPath, 'utf-8'));
  }

  // Fallback: from contracts artifacts (has {abi, bytecode} wrapper)
  const artifactPath = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'contracts',
    'artifacts',
    'contracts',
    `${contractName}.sol`,
    `${contractName}.json`,
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      `ABI not found for ${contractName}. Checked:\n  ${frontendPath}\n  ${artifactPath}`,
    );
  }

  logger.debug(`Loading ABI for ${contractName} from contract artifacts`);
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
  return artifact.abi;
}

// ---------------------------------------------------------------------------
// Contract Instances
// ---------------------------------------------------------------------------

/** Typed map of all on-chain contract instances used by the orchestrator. */
export interface Contracts {
  registry: ethers.Contract;
  treasury: ethers.Contract;
  ceo: ethers.Contract;
  cfo: ethers.Contract;
  cmo: ethers.Contract;
  agentRunner: ethers.Contract;
}

/**
 * Instantiate ethers v6 `Contract` objects for every SovereignMind contract.
 *
 * @param wallet - An ethers `Wallet` connected to a provider.
 * @returns A `Contracts` bundle ready for service consumption.
 */
export function createContracts(wallet: ethers.Wallet): Contracts {
  // Load full ABIs from compiled artifacts
  const registryABI = loadABI('AgentRegistry');
  const treasuryABI = loadABI('TreasuryVault');
  const ceoABI = loadABI('CEOAgent');
  const cfoABI = loadABI('CFOAgent');
  const cmoABI = loadABI('CMOAgent');

  // AgentRunner ABI – minimal human-readable interface for deposit maths
  const agentRunnerABI = [
    'function getRequestDeposit() view returns (uint256)',
    'function getAgentPrice(uint256 agentId) view returns (uint256)',
    'function getSubcommitteeSize() view returns (uint256)',
  ];

  logger.info('📦 Contract instances created for all SovereignMind contracts');

  return {
    registry: new ethers.Contract(config.addresses.agentRegistry, registryABI, wallet),
    treasury: new ethers.Contract(config.addresses.treasuryVault, treasuryABI, wallet),
    ceo: new ethers.Contract(config.addresses.ceoAgent, ceoABI, wallet),
    cfo: new ethers.Contract(config.addresses.cfoAgent, cfoABI, wallet),
    cmo: new ethers.Contract(config.addresses.cmoAgent, cmoABI, wallet),
    agentRunner: new ethers.Contract(config.addresses.agentRunner, agentRunnerABI, wallet),
  };
}

// ---------------------------------------------------------------------------
// Deposit Calculation Helper
// ---------------------------------------------------------------------------

/**
 * Calculate the total deposit required to invoke an on-chain agent request.
 *
 * Formula:  `baseFee + (agentPrice × subcommitteeSize)`
 *
 * @param contracts    - The contracts bundle.
 * @param agentIdGetter - An async getter that returns the target agent's ID
 *                        (e.g. `() => cfo.jsonApiAgentId()`).
 */
export async function calculateDeposit(
  contracts: Contracts,
  agentIdGetter: () => Promise<bigint>,
): Promise<bigint> {
  try {
    // In Somnia Testnet, getAgentPrice and getSubcommitteeSize are not implemented and revert.
    // The only required fee is returned by getRequestDeposit().
    const deposit: bigint = await contracts.agentRunner.getRequestDeposit();
    logger.debug(`Deposit calculation: getRequestDeposit=${ethers.formatEther(deposit)} STT`);
    return deposit;
  } catch (error) {
    // Fallback if RPC call itself fails
    const fallback = ethers.parseEther('0.05'); // 0.05 STT (getRequestDeposit returns 0.03)
    logger.warn(
      `⚠️ Failed to get request deposit from contract, using fallback: ${ethers.formatEther(fallback)} STT`,
    );
    return fallback;
  }
}
