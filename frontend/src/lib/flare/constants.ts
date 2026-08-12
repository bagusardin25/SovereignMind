import { isAddress, type Address } from 'viem';

export const FLARE_CONTRACT_REGISTRY =
  '0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019' as const;

export const XRP_USD_FEED_ID =
  '0x015852502f55534400000000000000000000000000' as const;

export const COSTON2_EXPLORER_URL = 'https://coston2-explorer.flare.network';

const configuredAdapter = process.env.NEXT_PUBLIC_FLARE_FTSO_ADAPTER_ADDRESS;

export const flareAdapterAddress: Address | null =
  configuredAdapter && isAddress(configuredAdapter)
    ? (configuredAdapter as Address)
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
