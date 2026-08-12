import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const rawPrivateKey = process.env.PRIVATE_KEY?.trim();
const PRIVATE_KEY = rawPrivateKey
  ? rawPrivateKey.startsWith("0x")
    ? rawPrivateKey
    : `0x${rawPrivateKey}`
  : "0x" + "0".repeat(64);
const SOMNIA_RPC_URL = process.env.SOMNIA_RPC_URL || "https://dream-rpc.somnia.network";
const COSTON2_RPC_URL =
  process.env.COSTON2_RPC_URL || "https://coston2-api.flare.network/ext/C/rpc";

const optimizer = {
  enabled: true,
  runs: 200,
};

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer,
          viaIR: true,
        },
      },
    ],
    overrides: {
      "contracts/flare/FlareFtsoPriceAdapter.sol": {
        version: "0.8.28",
        settings: {
          optimizer,
          viaIR: true,
          evmVersion: "cancun",
        },
      },
    },
  },
  networks: {
    somnia_testnet: {
      url: SOMNIA_RPC_URL,
      chainId: 50312,
      accounts: [PRIVATE_KEY],
    },
    coston2: {
      url: COSTON2_RPC_URL,
      chainId: 114,
      accounts: [PRIVATE_KEY],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
