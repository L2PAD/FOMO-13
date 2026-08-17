import { utils } from "ethers";

export const LAUNCHPAD_CHAIN_ID = 97;
export const LAUNCHPAD_CHAIN_ID_HEX = "0x61";

const DEFAULT_RPC_URL = "https://data-seed-prebsc-1-s1.bnbchain.org:8545/";
const DEFAULT_EXPLORER_URL = "https://testnet.bscscan.com";

const parseAddress = (value: string, variableName: string): string => {
  try {
    return utils.getAddress(value);
  } catch {
    throw new Error(`${variableName} must be a valid EVM address`);
  }
};

const parseConfirmations = (value: string | undefined): number => {
  if (!value) return 1;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new Error("REACT_APP_LAUNCHPAD_CONFIRMATIONS must be an integer from 1 to 100");
  }

  return parsed;
};

export const launchpadDeployment = Object.freeze({
  chainId: LAUNCHPAD_CHAIN_ID,
  chainIdHex: LAUNCHPAD_CHAIN_ID_HEX,
  chainName: "BSC Testnet",
  rpcUrl: process.env.REACT_APP_LAUNCHPAD_RPC_URL || DEFAULT_RPC_URL,
  explorerUrl: process.env.REACT_APP_LAUNCHPAD_EXPLORER_URL || DEFAULT_EXPLORER_URL,
  confirmations: parseConfirmations(process.env.REACT_APP_LAUNCHPAD_CONFIRMATIONS),
  nativeCurrency: {
    name: "Test BNB",
    symbol: "tBNB",
    decimals: 18,
  },
  contracts: {
    usdt: parseAddress(
      process.env.REACT_APP_LAUNCHPAD_USDT_ADDRESS ||
        "0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948",
      "REACT_APP_LAUNCHPAD_USDT_ADDRESS",
    ),
    nft: parseAddress(
      process.env.REACT_APP_LAUNCHPAD_NFT_ADDRESS ||
        "0x512C670006456D46679A67456eBe8564810C5609",
      "REACT_APP_LAUNCHPAD_NFT_ADDRESS",
    ),
    nftMarket: parseAddress(
      process.env.REACT_APP_LAUNCHPAD_NFT_MARKET_ADDRESS ||
        "0x40198F1A090d9893d7822F8804e5317E28C5A776",
      "REACT_APP_LAUNCHPAD_NFT_MARKET_ADDRESS",
    ),
    launchpad: parseAddress(
      process.env.REACT_APP_LAUNCHPAD_ADDRESS ||
        "0x0608B52aAC58E7313481d0809E8b4525BDD11d33",
      "REACT_APP_LAUNCHPAD_ADDRESS",
    ),
  },
});

export type LaunchpadDeployment = typeof launchpadDeployment;
