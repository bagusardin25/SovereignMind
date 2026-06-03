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
  // 1. Local ABIs bundled with the orchestrator (works on Railway & standalone deploys)
  const localPath = path.resolve(
    __dirname,
    '..',
    'abis',
    `${contractName}.json`,
  );

  if (fs.existsSync(localPath)) {
    logger.debug(`Loading ABI for ${contractName} from local abis/`);
    return JSON.parse(fs.readFileSync(localPath, 'utf-8'));
  }

  // 2. Frontend ABIs (monorepo local dev — pure ABI array)
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

  // 3. Hardhat artifacts (monorepo local dev — {abi, bytecode} wrapper)
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
      `ABI not found for ${contractName}. Checked:\n  ${localPath}\n  ${frontendPath}\n  ${artifactPath}`,
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

// Fallback per-agent execution costs (used only if on-chain query fails)
const FALLBACK_PER_AGENT_COSTS: Record<string, bigint> = {
  '13174292974160097713': ethers.parseEther('0.03'), // JSON API Request Agent
  '12847293847561029384': ethers.parseEther('0.07'), // LLM Inference Agent
  '12875401142070969085': ethers.parseEther('0.10'), // LLM Parse Website Agent
};
const SUBCOMMITTEE_SIZE = 3n;

/**
 * Calculate the total deposit required for an on-chain agent request.
 *
 * Formula (from official docs):
 *   `deposit = reserve + (perAgentCost × subcommitteeSize)`
 *
 * Reads per-agent cost from on-chain `getAgentPrice()` when possible,
 * falling back to hardcoded values if the call fails.
 */
export async function calculateDeposit(
  contracts: Contracts,
  agentIdGetter: () => Promise<bigint>,
): Promise<bigint> {
  try {
    const reserve: bigint = await contracts.agentRunner.getRequestDeposit();
    const agentId = await agentIdGetter();

    let perAgentCost: bigint;
    try {
      perAgentCost = await contracts.agentRunner.getAgentPrice(agentId);
    } catch {
      perAgentCost = FALLBACK_PER_AGENT_COSTS[agentId.toString()] ?? ethers.parseEther('0.10');
      logger.debug(`getAgentPrice failed, using fallback: ${ethers.formatEther(perAgentCost)} STT`);
    }

    const totalDeposit = reserve + perAgentCost * SUBCOMMITTEE_SIZE;

    logger.debug(
      `Deposit: reserve=${ethers.formatEther(reserve)} + reward=${ethers.formatEther(perAgentCost * SUBCOMMITTEE_SIZE)} = ${ethers.formatEther(totalDeposit)} STT (agent ${agentId})`,
    );
    return totalDeposit;
  } catch (error) {
    // Fallback: 0.33 STT (highest deposit — Parse Website cost, safe default)
    const fallback = ethers.parseEther('0.33');
    logger.warn(
      `⚠️ Failed to calculate deposit from contract, using fallback: ${ethers.formatEther(fallback)} STT`,
    );
    return fallback;
  }
}
