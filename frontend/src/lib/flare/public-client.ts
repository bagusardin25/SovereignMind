import { coston2 } from '@flarenetwork/flare-wagmi-periphery-package';
import { createPublicClient, http, zeroAddress } from 'viem';
import { flareTestnet } from 'viem/chains';
import { FLARE_CONTRACT_REGISTRY, XRP_USD_FEED_ID } from './constants';

export interface FlareSnapshot {
  chainId: number;
  blockNumber: string;
  assetManagerAddress: `0x${string}`;
  ftsoV2Address: `0x${string}`;
  xrpUsdPrice: number;
  feedDecimals: number;
  feedTimestamp: number;
  lotSizeFxrp: number;
  lotValueUsd: number;
  fetchedAt: number;
}

export const flarePublicClient = createPublicClient({
  chain: flareTestnet,
  transport: http(flareTestnet.rpcUrls.default.http[0]),
});

export async function fetchFlareSnapshot(): Promise<FlareSnapshot> {
  const [chainId, blockNumber, assetManagerAddress, ftsoV2Address] =
    await Promise.all([
      flarePublicClient.getChainId(),
      flarePublicClient.getBlockNumber(),
      flarePublicClient.readContract({
        address: FLARE_CONTRACT_REGISTRY,
        abi: coston2.iFlareContractRegistryAbi,
        functionName: 'getContractAddressByName',
        args: ['AssetManagerFXRP'],
      }),
      flarePublicClient.readContract({
        address: FLARE_CONTRACT_REGISTRY,
        abi: coston2.iFlareContractRegistryAbi,
        functionName: 'getContractAddressByName',
        args: ['FtsoV2'],
      }),
    ]);

  if (chainId !== flareTestnet.id) {
    throw new Error(`Coston2 chain ID mismatch: expected 114, received ${chainId}.`);
  }
  if (assetManagerAddress === zeroAddress || ftsoV2Address === zeroAddress) {
    throw new Error('Flare registry returned an unavailable contract address.');
  }

  const [settings, feed] = await Promise.all([
    flarePublicClient.readContract({
      address: assetManagerAddress,
      abi: coston2.iAssetManagerAbi,
      functionName: 'getSettings',
    }),
    flarePublicClient.simulateContract({
      address: ftsoV2Address,
      abi: coston2.ftsoV2InterfaceAbi,
      functionName: 'getFeedById',
      args: [XRP_USD_FEED_ID],
      value: BigInt(0),
    }),
  ]);

  const [rawValue, rawDecimals, rawTimestamp] = feed.result;
  const feedDecimals = Number(rawDecimals);
  if (feedDecimals < 0 || feedDecimals > 18 || rawValue === BigInt(0)) {
    throw new Error('FTSO returned invalid XRP/USD feed data.');
  }

  // These conversions follow Flare's official FAssets settings guide.
  const lotSizeFxrp =
    Number(settings.lotSizeAMG) /
    Math.pow(10, Number(settings.assetDecimals));
  const xrpUsdPrice = Number(rawValue) / Math.pow(10, feedDecimals);

  return {
    chainId,
    blockNumber: blockNumber.toString(),
    assetManagerAddress,
    ftsoV2Address,
    xrpUsdPrice,
    feedDecimals,
    feedTimestamp: Number(rawTimestamp),
    lotSizeFxrp,
    lotValueUsd: lotSizeFxrp * xrpUsdPrice,
    fetchedAt: Date.now(),
  };
}
