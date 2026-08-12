import { coston2 } from '@flarenetwork/flare-wagmi-periphery-package';
import { createPublicClient, http, zeroAddress } from 'viem';
import { flareTestnet } from 'viem/chains';

const registryAddress = '0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019';
const xrpUsdFeedId = '0x015852502f55534400000000000000000000000000';

const client = createPublicClient({
  chain: flareTestnet,
  transport: http(flareTestnet.rpcUrls.default.http[0]),
});

async function main() {
  const [chainId, blockNumber, assetManagerAddress, ftsoV2Address] =
    await Promise.all([
      client.getChainId(),
      client.getBlockNumber(),
      client.readContract({
        address: registryAddress,
        abi: coston2.iFlareContractRegistryAbi,
        functionName: 'getContractAddressByName',
        args: ['AssetManagerFXRP'],
      }),
      client.readContract({
        address: registryAddress,
        abi: coston2.iFlareContractRegistryAbi,
        functionName: 'getContractAddressByName',
        args: ['FtsoV2'],
      }),
    ]);

  if (chainId !== 114) throw new Error(`Expected chain 114, received ${chainId}.`);
  if (assetManagerAddress === zeroAddress || ftsoV2Address === zeroAddress) {
    throw new Error('Registry returned a zero contract address.');
  }

  const settings = await client.readContract({
    address: assetManagerAddress,
    abi: coston2.iAssetManagerAbi,
    functionName: 'getSettings',
  });
  const { result: feed } = await client.simulateContract({
    address: ftsoV2Address,
    abi: coston2.ftsoV2InterfaceAbi,
    functionName: 'getFeedById',
    args: [xrpUsdFeedId],
    value: 0n,
  });

  const [rawValue, decimals, timestamp] = feed;
  const lotSizeFxrp =
    Number(settings.lotSizeAMG) / Math.pow(10, Number(settings.assetDecimals));
  const xrpUsdPrice = Number(rawValue) / Math.pow(10, Number(decimals));

  console.log(
    JSON.stringify(
      {
        ok: true,
        network: flareTestnet.name,
        chainId,
        blockNumber: blockNumber.toString(),
        registryAddress,
        assetManagerFXRP: assetManagerAddress,
        ftsoV2: ftsoV2Address,
        xrpUsdPrice,
        feedTimestamp: timestamp.toString(),
        lotSizeFxrp,
        lotValueUsd: lotSizeFxrp * xrpUsdPrice,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
