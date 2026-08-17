/**
 * Money network abstraction (Phase H / H36).
 *
 * The MoneyLedger, Purchase Engine, subscriptions, reconciliation and CRM MUST
 * remain network-agnostic. The only place that knows about a concrete chain is
 * this config + the blockchain adapter. Switching zkSync -> Ethereum later means
 * adding an adapter + a config entry, NOT changing the money core.
 *
 * Canonical acquiring is FOMO's own rail:
 *   Wallet -> zkSync/USDC Deposit -> MoneyLedger -> FOMO Balance -> Purchase -> Withdraw
 * No external acquiring (Binance Pay / Stripe / CoinPayments / etc.).
 */

export interface MoneyNetworkConfig {
  networkId: string;
  chainId: number;
  name: string;
  tokenSymbol: string;
  tokenAddress: string;
  decimals: number;
  treasuryAddress: string;
  depositEnabled: boolean;
  withdrawalEnabled: boolean;
}

const env = (k: string, d: string) => process.env[k] || d;

export const MONEY_NETWORKS: Record<string, MoneyNetworkConfig> = {
  ZKSYNC_USDC: {
    networkId: "ZKSYNC_USDC",
    chainId: Number(env("MONEY_ZKSYNC_CHAIN_ID", "324")),
    name: "zkSync Era",
    tokenSymbol: "USDC",
    tokenAddress: env("MONEY_ZKSYNC_USDC_ADDRESS", "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4"),
    decimals: 6,
    treasuryAddress: env("MONEY_TREASURY_ADDRESS", "0xc6b848CA645603521C81D439aC0C856dbDAaeD2F"),
    depositEnabled: true,
    withdrawalEnabled: true,
  },
  // Future: ETHEREUM_USDC — add here + implement an EthereumMoneyAdapter. No core change.
};

export const ACTIVE_MONEY_NETWORK = env("MONEY_ACTIVE_NETWORK", "ZKSYNC_USDC");

/** Map a stored withdraw `network` value (e.g. "ZKSYNC") to a config key. */
export const resolveNetworkConfig = (network?: string): MoneyNetworkConfig => {
  const n = (network || "").toUpperCase();
  if (n.includes("ETH")) return MONEY_NETWORKS.ETHEREUM_USDC || MONEY_NETWORKS[ACTIVE_MONEY_NETWORK];
  return MONEY_NETWORKS.ZKSYNC_USDC || MONEY_NETWORKS[ACTIVE_MONEY_NETWORK];
};
