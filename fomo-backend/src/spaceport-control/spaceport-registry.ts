/**
 * Config-driven Spaceport contract/network registry.
 *
 * The Control Center reads all chain truth through this registry so the network and
 * addresses can be swapped (e.g. BSC Testnet -> production) WITHOUT rewriting business
 * logic. Verified defaults below were proven live on chainId 97 (see SPACEPORT_FORENSIC.md).
 */

export type SpaceportContractRole =
  | 'paymentToken'
  | 'sale'
  | 'nft'
  | 'launchpad'
  | 'genesis';

export interface SpaceportContractRef {
  role: SpaceportContractRole;
  address: string | null;
  label: string;
  kind: string;
}

export interface SpaceportNetwork {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
}

export interface SpaceportRegistry {
  version: number;
  source: 'default' | 'env';
  network: SpaceportNetwork;
  indexRpcUrl: string;
  paymentTokenDecimals: number;
  contracts: Record<SpaceportContractRole, SpaceportContractRef>;
  indexFromBlock: number | null;
  indexLookback: number;
}

// ---- Verified defaults (BSC Testnet, chainId 97) ----
const DEFAULT_RPC = 'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
const DEFAULT_INDEX_RPC = 'https://bsc-testnet-rpc.publicnode.com';
const DEFAULT_EXPLORER = 'https://testnet.bscscan.com';
const DEFAULT_SALE = '0x40198F1A090d9893d7822F8804e5317E28C5A776';
const DEFAULT_NFT = '0x512C670006456D46679A67456eBe8564810C5609';
const DEFAULT_USDT = '0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948';
const DEFAULT_LAUNCHPAD = '0x0608B52aAC58E7313481d0809E8b4525BDD11d33';

function envAddr(...keys: string[]): string | null {
  for (const k of keys) {
    const v = String(process.env[k] || '').trim();
    if (v) return v;
  }
  return null;
}

export function getSpaceportRegistry(): SpaceportRegistry {
  const rpcUrl =
    process.env.SPACEPORT_RPC_URL ||
    process.env.FOMO_V2_LAUNCHPAD_RPC_URL ||
    process.env.BSC_TESTNET_RPC_URL ||
    process.env.WEB3_RPC_URL ||
    DEFAULT_RPC;

  // Index RPC must support eth_getLogs (+ ideally archive). Free data-seed nodes
  // reject getLogs; publicnode serves logs (recent window). Swap to a paid
  // archive-log endpoint here for FULL historical backfill — no code change.
  const indexRpcUrl =
    process.env.SPACEPORT_INDEX_RPC_URL || DEFAULT_INDEX_RPC;

  const chainId = Number(process.env.SPACEPORT_CHAIN_ID || 97);
  const explorerUrl = process.env.SPACEPORT_EXPLORER_URL || DEFAULT_EXPLORER;

  const sale = envAddr('SPACEPORT_SALE_ADDRESS') || DEFAULT_SALE;
  const nft =
    envAddr('SPACEPORT_NFT_ADDRESS', 'FOMO_V2_LAUNCHPAD_STAKING_NFT_ADDRESS') ||
    DEFAULT_NFT;
  const paymentToken =
    envAddr('SPACEPORT_PAYMENT_TOKEN_ADDRESS') || DEFAULT_USDT;
  const launchpad = envAddr('SPACEPORT_LAUNCHPAD_ADDRESS') || DEFAULT_LAUNCHPAD;
  const genesis = envAddr('SPACEPORT_GENESIS_ADDRESS'); // null => NOT_CONFIGURED

  const usedEnv = Boolean(
    process.env.SPACEPORT_RPC_URL ||
      process.env.SPACEPORT_SALE_ADDRESS ||
      process.env.SPACEPORT_NFT_ADDRESS ||
      process.env.SPACEPORT_PAYMENT_TOKEN_ADDRESS,
  );

  const indexFromBlockRaw = Number(process.env.SPACEPORT_INDEX_FROM_BLOCK);
  const indexFromBlock = Number.isFinite(indexFromBlockRaw) && indexFromBlockRaw >= 0
    ? Math.trunc(indexFromBlockRaw)
    : null;
  const indexLookback = Math.max(
    10_000,
    Number(process.env.SPACEPORT_INDEX_LOOKBACK || 4_000_000),
  );

  return {
    version: Number(process.env.SPACEPORT_REGISTRY_VERSION || 1),
    source: usedEnv ? 'env' : 'default',
    network: {
      chainId,
      name: process.env.SPACEPORT_NETWORK_NAME || 'BSC Testnet',
      rpcUrl,
      explorerUrl,
    },
    indexRpcUrl,
    paymentTokenDecimals: Number(process.env.SPACEPORT_PAYMENT_TOKEN_DECIMALS || 18),
    indexFromBlock,
    indexLookback,
    contracts: {
      paymentToken: {
        role: 'paymentToken',
        address: paymentToken,
        label: 'Payment Token (USDT)',
        kind: 'ERC20',
      },
      sale: {
        role: 'sale',
        address: sale,
        label: 'Box Sale / Market',
        kind: 'NFTSale',
      },
      nft: {
        role: 'nft',
        address: nft,
        label: 'Box NFT (SpecialNFT / Staking NFT)',
        kind: 'ERC721Enumerable',
      },
      launchpad: {
        role: 'launchpad',
        address: launchpad,
        label: 'Launchpad Pool',
        kind: 'Launchpad',
      },
      genesis: {
        role: 'genesis',
        address: genesis,
        label: 'Genesis / Main Collection',
        kind: genesis ? 'ERC721' : 'NOT_CONFIGURED',
      },
    },
  };
}

/** ABI-proven capabilities (owner-signed writes). Kept in sync with website_front/smart/abi.ts. */
export const SALE_WRITE_CAPABILITIES = [
  { method: 'setSalePaused(bool)', label: 'Pause / Unpause sale', event: 'SalePaused' },
  { method: 'setPrice(uint256)', label: 'Update price', event: 'PriceUpdated' },
  { method: 'setPaymentToken(address)', label: 'Update payment token', event: 'PaymentTokenUpdated' },
  { method: 'setNFTContract(address)', label: 'Update NFT contract', event: 'NFTContractUpdated' },
  { method: 'rescueTokens(address,address,uint256)', label: 'Rescue ERC20', event: 'RescueTokens' },
  { method: 'rescueNative(address,uint256)', label: 'Rescue native', event: 'RescueNative' },
];

export const NFT_WRITE_CAPABILITIES = [
  { method: 'mint(address,uint8)', label: 'Mint (allowed minter)', event: 'Minted' },
  { method: 'batchMint(address,uint8[])', label: 'Batch mint', event: 'Minted' },
  { method: 'setMinter(address,bool)', label: 'Set minter', event: null },
  { method: 'setBaseURI(string)', label: 'Set base URI', event: null },
  { method: 'openPreMint(uint256)', label: 'Reveal (open pre-mint)', event: null },
  { method: 'setMergeStartTime(uint256)', label: 'Установить старт Fusion/merge', event: null },
  { method: 'mergeShards(uint256[])', label: 'Merge shards', event: 'ShardsMerged' },
];

export const RARITY_NAMES = [
  'Shard',
  'PreMint_Uncommon',
  'PreMint_Epic',
  'PreMint_Legendary',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
  'FOMOGold',
];

export function rarityName(id: number): string {
  return RARITY_NAMES[id] ?? `Unknown(${id})`;
}

/** PreMint_* (1..3) are unrevealed; 4..8 are revealed; 0 is a Shard. */
export function isRevealedRarity(id: number): boolean {
  return id >= 4 && id <= 8;
}
export function isPreMintRarity(id: number): boolean {
  return id >= 1 && id <= 3;
}
export function isShardRarity(id: number): boolean {
  return id === 0;
}

/** Number of shards required for mergeShards (contract array length; env-overridable). */
export function shardMergeCount(): number {
  return Math.max(2, Number(process.env.SPACEPORT_SHARD_MERGE_COUNT || 4));
}

/**
 * Fusion recipes derived from the SpecialNFT ABI (single collection). Fusion is
 * PERMISSIONLESS on-chain (only owner gate is setMergeStartTime). The concrete
 * output rarity for each operation is emitted per-transaction in the event's
 * `newRarity` field (source of truth); the ladder below is the enum-derived
 * expectation, VERIFIED per operation by the indexed event.
 */
export const FUSION_RECIPES = [
  {
    method: 'mergePreMintNFTs(uint256,uint256)',
    event: 'PreMintMerged',
    kind: 'premint_merge',
    inputs: '2× одинаковый PreMint_* (1..3)',
    output: 'раскрытая редкость (newRarity из события)',
    inputCount: 2,
    permissionless: true,
  },
  {
    method: 'mergeUpgradableNFTs(uint256,uint256)',
    event: 'StandardMerged',
    kind: 'standard_upgrade',
    inputs: '2× одинаковая редкость (4..7)',
    output: 'следующая редкость (newRarity из события): Uncommon→Rare→Epic→Legendary→FOMOGold',
    inputCount: 2,
    ladder: [
      { from: 'Uncommon', to: 'Rare' },
      { from: 'Rare', to: 'Epic' },
      { from: 'Epic', to: 'Legendary' },
      { from: 'Legendary', to: 'FOMOGold' },
    ],
    permissionless: true,
  },
  {
    method: 'mergeShards(uint256[])',
    event: 'ShardsMerged',
    kind: 'shard_merge',
    inputs: `${shardMergeCount()}× Shard (0)`,
    output: 'новый токен (newTokenId из события)',
    inputCount: shardMergeCount(),
    permissionless: true,
  },
];

/** Owner-signed Fusion-related controls that DO exist in the NFT ABI. */
export const FUSION_OWNER_CAPABILITIES = [
  { method: 'setMergeStartTime(uint256)', label: 'Установить время старта Fusion/merge', event: null, contract: 'nft' },
];
