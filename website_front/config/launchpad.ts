import { utils } from "ethers";

export const LAUNCHPAD_CHAIN_ID = 97;
export const LAUNCHPAD_CHAIN_ID_HEX = "0x61";
export const LAUNCHPAD_USDT_DECIMALS = 18;

const addressFromEnv = (
  value: string | undefined,
  fallback: string,
  variableName: string
): string => {
  try {
    return utils.getAddress(value?.trim() || fallback);
  } catch {
    throw new Error(`${variableName} must be a valid EVM address`);
  }
};

export const launchpadDeployment = Object.freeze({
  chainId: LAUNCHPAD_CHAIN_ID,
  chainIdHex: LAUNCHPAD_CHAIN_ID_HEX,
  chainName: "BSC Testnet",
  rpcUrl:
    process.env.NEXT_PUBLIC_LAUNCHPAD_RPC_URL ||
    "https://data-seed-prebsc-1-s1.bnbchain.org:8545/",
  explorerUrl:
    process.env.NEXT_PUBLIC_LAUNCHPAD_EXPLORER_URL ||
    "https://testnet.bscscan.com",
  nativeCurrency: {
    name: "Test BNB",
    symbol: "tBNB",
    decimals: 18,
  },
  contracts: {
    usdt: addressFromEnv(
      process.env.NEXT_PUBLIC_LAUNCHPAD_USDT_ADDRESS,
      "0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948",
      "NEXT_PUBLIC_LAUNCHPAD_USDT_ADDRESS"
    ),
    nft: addressFromEnv(
      process.env.NEXT_PUBLIC_LAUNCHPAD_NFT_ADDRESS,
      "0x512C670006456D46679A67456eBe8564810C5609",
      "NEXT_PUBLIC_LAUNCHPAD_NFT_ADDRESS"
    ),
    nftMarket: addressFromEnv(
      process.env.NEXT_PUBLIC_LAUNCHPAD_NFT_MARKET_ADDRESS,
      "0x40198F1A090d9893d7822F8804e5317E28C5A776",
      "NEXT_PUBLIC_LAUNCHPAD_NFT_MARKET_ADDRESS"
    ),
    launchpad: addressFromEnv(
      process.env.NEXT_PUBLIC_LAUNCHPAD_ADDRESS,
      "0x0608B52aAC58E7313481d0809E8b4525BDD11d33",
      "NEXT_PUBLIC_LAUNCHPAD_ADDRESS"
    ),
  },
});

export type LaunchpadDeployment = typeof launchpadDeployment;
