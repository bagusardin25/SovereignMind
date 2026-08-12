import { ethers } from "hardhat";

const FLARE_CONTRACT_REGISTRY =
  "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";

const registryAbi = [
  "function getContractAddressByName(string calldata name) external view returns (address)",
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
  const ftsoV2Address = await registry.getContractAddressByName("FtsoV2");

  if (ftsoV2Address === ethers.ZeroAddress) {
    throw new Error("Coston2 registry returned a zero FtsoV2 address.");
  }

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

  console.log(
    JSON.stringify(
      {
        network: "Coston2",
        chainId: network.chainId.toString(),
        deployer: deployer.address,
        flareContractRegistry: FLARE_CONTRACT_REGISTRY,
        ftsoV2: ftsoV2Address,
        priceOracle: await oracle.getAddress(),
        flareFtsoPriceAdapter: await adapter.getAddress(),
        updaterRoleGranted: true,
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
