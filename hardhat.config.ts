import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "hardhat-gas-reporter";
import "hardhat-docgen";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";

import "./tasks/accounts";
import "./tasks/clean";

import { resolve } from "path";

import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ganache";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const chainIds = {
  ganache: 5777,
  goerli: 5,
  hardhat: 7545,
  kovan: 42,
  mainnet: 1,
  rinkeby: 4,
  bscTestnet: 97,
  bscMainnet: 56,
  MaticTestnet: 80001,
  MaticMainnet: 137,
  ropsten: 3,
};

// Ensure that we have all the environment variables we need.
const mnemonic = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set your MNEMONIC in a .env file");
}

const infuraApiKey = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error("Please set your INFURA_API_KEY in a .env file");
}

function createTestnetConfig(network: keyof typeof chainIds): NetworkUserConfig {
  const url: string = "https://" + network + ".infura.io/v3/" + infuraApiKey;
  return {
    accounts: {
      count: 10,
      initialIndex: 0,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[network],
    url,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    src: "./contracts",
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
      },
      chainId: chainIds.hardhat,
    },
    ganache: {
      chainId: 5777,
      url: "http://127.0.0.1:8545/",
    },

    mainnet: {
      accounts: {
        count: 10,
        initialIndex: 0,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
      chainId: chainIds["mainnet"],
      url: "https://mainnet.infura.io/v3/" + infuraApiKey + "",
    },
    rinkeby: {
      saveDeployments: true,
      accounts: {
        initialIndex: 0,
        mnemonic,
        // path: "m/44'/60'/0'/0",
      },
      chainId: chainIds["rinkeby"],
      url: "https://rinkeby.infura.io/v3/" + infuraApiKey + "",
    },
    bscTestnet: {
      saveDeployments: true,
      accounts: {
        initialIndex: 0,
        mnemonic,
        // path: "m/44'/60'/0'/0",
      },
      chainId: chainIds["bscTestnet"],
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
    },
    bscMainnet: {
      saveDeployments: true,
      accounts: {
        initialIndex: 0,
        mnemonic,
        // path: "m/44'/60'/0'/0",
      },
      chainId: chainIds["bscMainnet"],
      url: "https://bsc-dataseed.binance.org/",
    },
    MaticTestnet: {
      saveDeployments: true,
      accounts: {
        initialIndex: 0,
        mnemonic,
        // path: "m/44'/60'/0'/0",
      },
      // chainId: chainIds["MaticTestnet"],     
      chainId: 80001,
      url: "https://rpc-mumbai.maticvigil.com",
    },
    MaticMainnet: {
      saveDeployments: true,
      accounts: {
        initialIndex: 0,
        mnemonic,
        // path: "m/44'/60'/0'/0",
      },
      chainId: chainIds["MaticMainnet"],
      url: "https://rpc-mainnet.maticvigil.com/",
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
    deploy: "./deploy",
    deployments: "./deployments",
    imports: "./imports",
  },
  docgen: {
    path: "./docs",
    clear: true,
    runOnCompile: true,
  },
  solidity: {
    version: "0.6.12",
    settings: {
      metadata: {
        bytecodeHash: "none",
      },
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEYS,
  },
};

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // code here
};
export default config;
