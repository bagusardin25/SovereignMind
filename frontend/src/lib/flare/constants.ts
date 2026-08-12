import { isAddress, type Address } from 'viem';

export const FLARE_CONTRACT_REGISTRY =
  '0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019' as const;

export const XRP_USD_FEED_ID =
  '0x015852502f55534400000000000000000000000000' as const;

export const COSTON2_EXPLORER_URL = 'https://coston2-explorer.flare.network';

const configuredAdapter = process.env.NEXT_PUBLIC_FLARE_FTSO_ADAPTER_ADDRESS;
const configuredGuard = process.env.NEXT_PUBLIC_FXRP_TREASURY_GUARD_ADDRESS;

export const flareAdapterAddress: Address | null =
  configuredAdapter && isAddress(configuredAdapter)
    ? (configuredAdapter as Address)
    : null;

export const fxrpTreasuryGuardAddress: Address | null =
  configuredGuard && isAddress(configuredGuard)
    ? (configuredGuard as Address)
    : null;

export const flareFtsoAdapterAbi = [
  {
    type: 'function',
    name: 'requiredFee',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'syncXrpUsd',
    stateMutability: 'payable',
    inputs: [],
    outputs: [
      { name: 'priceE8', type: 'uint256' },
      { name: 'feedTimestamp', type: 'uint64' },
    ],
  },
] as const;

export const fxrpTreasuryGuardAbi = [
  {
    type: 'function',
    name: 'requiredFee',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'refreshAndAssess',
    stateMutability: 'payable',
    inputs: [{ name: 'limitUsdE8', type: 'uint256' }],
    outputs: [{ name: 'assessmentId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approveAssessment',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'assessmentId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'rejectAssessment',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'assessmentId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getLatestAssessment',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'fxrpBalance', type: 'uint256' },
      { name: 'priceE8', type: 'uint256' },
      { name: 'exposureUsdE8', type: 'uint256' },
      { name: 'limitUsdE8', type: 'uint256' },
      { name: 'feedTimestamp', type: 'uint64' },
      { name: 'oracleUpdatedAt', type: 'uint64' },
      { name: 'signal', type: 'uint8' },
      { name: 'status', type: 'uint8' },
    ],
  },
] as const;
