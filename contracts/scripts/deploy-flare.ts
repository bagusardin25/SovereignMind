import { ethers } from "hardhat";

const FLARE_CONTRACT_REGISTRY =
  "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";

const registryAbi = [
  "function getContractAddressByName(string calldata name) external view returns (address)",
] as const;

const assetManagerAbi = [
  "function fAsset() external view returns (address)",
] as const;

const tokenMetadataAbi = [
  "function decimals() external view returns (uint8)",
] as const;

async function main() {
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 114n) {
    throw new Error(
      `Refusing Flare deployment on chain ${network.chainId}; expected Coston2 (114).`
    );
  }

  const [deployer] = await ethers.getSigners();
  const registry = new ethers.Contract(
    FLARE_CONTRACT_REGISTRY,
    registryAbi,
    ethers.provider
  );
  const [ftsoV2Address, assetManagerAddress] = await Promise.all([
    registry.getContractAddressByName("FtsoV2"),
    registry.getContractAddressByName("AssetManagerFXRP"),
  ]);

  if (
    ftsoV2Address === ethers.ZeroAddress ||
    assetManagerAddress === ethers.ZeroAddress
  ) {
    throw new Error(
      "Coston2 registry returned an unavailable FtsoV2 or AssetManagerFXRP address."
    );
  }

  const assetManager = new ethers.Contract(
    assetManagerAddress,
    assetManagerAbi,
    ethers.provider
  );
  const fxrpAddress = await assetManager.fAsset();
  if (fxrpAddress === ethers.ZeroAddress) {
    throw new Error("AssetManagerFXRP returned a zero FXRP token address.");
  }
  const fxrp = new ethers.Contract(
    fxrpAddress,
    tokenMetadataAbi,
    ethers.provider
  );
  const fxrpDecimals = await fxrp.decimals();

  const oracle = await ethers.deployContract("PriceOracle");
  await oracle.waitForDeployment();

  const adapter = await ethers.deployContract("FlareFtsoPriceAdapter", [
    await oracle.getAddress(),
    ftsoV2Address,
  ]);
  await adapter.waitForDeployment();

  const updaterRole = await oracle.UPDATER_ROLE();
  const grantTx = await oracle.grantRole(updaterRole, await adapter.getAddress());
  await grantTx.wait();

  const guard = await ethers.deployContract("FXRPTreasuryGuard", [
    await oracle.getAddress(),
    await adapter.getAddress(),
    fxrpAddress,
  ]);
  await guard.waitForDeployment();

  console.log(
    JSON.stringify(
      {
        network: "Coston2",
        chainId: network.chainId.toString(),
        deployer: deployer.address,
        flareContractRegistry: FLARE_CONTRACT_REGISTRY,
        ftsoV2: ftsoV2Address,
        assetManagerFXRP: assetManagerAddress,
        fxrp: fxrpAddress,
        fxrpDecimals: fxrpDecimals.toString(),
        priceOracle: await oracle.getAddress(),
        flareFtsoPriceAdapter: await adapter.getAddress(),
        fxrpTreasuryGuard: await guard.getAddress(),
        updaterRoleGranted: true,
        authorityBoundary:
          "The guard records assessments and approvals but never transfers FXRP.",
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
