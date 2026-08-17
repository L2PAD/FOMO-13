/**
 * FOMO Custody Contract — machine-readable capability manifest (H4).
 *
 * The contract `0xc6b848…` is NOT source-verified on the explorer. This manifest
 * is the canonical, machine-readable result of the runtime-bytecode forensic so a
 * future agent never has to re-discover the logic. Keep it in sync with the
 * handoff doc `/app/memory/ACQUIRING_H4_HANDOFF.md`.
 *
 * Money model (fee-free membership purchase = escrow path):
 *   createItem(price, seller=owner, tokenForSale=0)   // platform settlement lot
 *   user  -> safeMoneyUSD(itemId, useInternal=true)    // usdBalance[user] -= price (MetaMask)
 *   owner -> adminResolveUSD(itemId, false, false)      // seller += full price, 0 fee
 *   refund (pre-settle): owner -> adminResolveUSD(itemId, true, false)
 */

export interface ContractFunctionSpec {
  name: string;
  selector: string;
  signature: string;
  access: "public" | "onlyOwner" | "seller";
  usdBalanceEffect: string;
  fee: "NONE" | "feePermille" | "feePermille(if takeFee)";
  feeRecipient: string | null;
  fomoUse: string;
}

export const ZKSYNC_CUSTODY_MANIFEST = {
  version: "H4.1",
  verificationMethod: "RUNTIME_BYTECODE_FORENSIC", // NOT explorer-verified source
  sourceVerified: false,
  network: {
    networkId: "ZKSYNC_USDC",
    name: "zkSync Era Mainnet",
    chainId: 324,
    rpcPrimary: "https://zksync.drpc.org", // http(s) ONLY (ws:// breaks ethers JsonRpcProvider)
    confirmationsRequired: 12,
    isMainnet: true,
  },
  token: {
    symbol: "USDC.e",
    address: "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4",
    decimals: 6,
  },
  contract: {
    // The configured deposit receiver IS the custody contract (not an EOA).
    address: "0xc6b848CA645603521C81D439aC0C856dbDAaeD2F",
    label: "FOMO Custody Contract",
    kind: "OTC/P2P marketplace + custody",
    ownerOnChain: "0xD128f1E3b2938eB005Bc5c750A66b82173f62857", // storage slot 1
    feeAccountOnChain: "0xD128f1E3b2938eB005Bc5c750A66b82173f62857", // storage slot 2
    feePermille: 50, // slot 3 -> 5% (max 200 = 20%, onlyOwner setFeePermille)
    secondaryFeePermille: "slot 4 (double-fee items only, max 500 = 50%)",
    storageSlots: { usdBalanceMapping: 7, ethBalanceMapping: 6, owner: 1, feeAccount: 2, feePermille: 3 },
  },
  functions: <ContractFunctionSpec[]>[
    { name: "depositUSD", selector: "0xdd94cd41", signature: "depositUSD(uint256 amount)", access: "public", usdBalanceEffect: "+amount payer (after USDC transferFrom)", fee: "NONE", feeRecipient: null, fomoUse: "Deposit rail (user-signed)" },
    { name: "withdrawUSD", selector: "0x159a71dc", signature: "withdrawUSD(uint256 amount)", access: "public", usdBalanceEffect: "-amount sender, USDC->sender", fee: "NONE", feeRecipient: null, fomoUse: "Withdraw rail (user-signed, NO server signer needed)" },
    { name: "usdBalance", selector: "0xf752549c", signature: "usdBalance(address) view returns (uint256)", access: "public", usdBalanceEffect: "view", fee: "NONE", feeRecipient: null, fomoUse: "Spendable on-chain balance read" },
    { name: "createItem", selector: "0xd2e3c2ae", signature: "createItem(uint64,uint256,uint8,uint8,address,address,uint256)", access: "public", usdBalanceEffect: "none", fee: "NONE", feeRecipient: null, fomoUse: "Create platform settlement lot (seller=owner, tokenForSale=0)" },
    { name: "safeMoneyUSD", selector: "0xfb57e6a8", signature: "safeMoneyUSD(uint256 id, bool useInternal)", access: "public", usdBalanceEffect: "-price buyer (escrow lock)", fee: "NONE", feeRecipient: null, fomoUse: "PURCHASE step 1 (USER signs): custody lock" },
    { name: "purchaseDirectUSD", selector: "0xade578a8", signature: "purchaseDirectUSD(uint256 id, bool useInternal)", access: "public", usdBalanceEffect: "-price buyer, +net seller, +fee feeAccount", fee: "feePermille", feeRecipient: "feeAccount", fomoUse: "DO NOT use for membership (always charges 5%)" },
    { name: "completeDealUSD", selector: "0x69dbb57d", signature: "completeDealUSD(uint256 id)", access: "seller", usdBalanceEffect: "settle to seller with fee", fee: "feePermille", feeRecipient: "feeAccount", fomoUse: "DO NOT use (takes fee)" },
    { name: "adminResolveUSD", selector: "0xe6d8c0f7", signature: "adminResolveUSD(uint256 id, bool refundToBuyer, bool takeFee)", access: "onlyOwner", usdBalanceEffect: "settle seller (full if takeFee=false) OR refund buyer", fee: "feePermille(if takeFee)", feeRecipient: "feeAccount if takeFee", fomoUse: "PURCHASE step 2 (OWNER signs) fee-free; refund branch" },
    { name: "setFeePermille", selector: "0x6dc96068", signature: "setFeePermille(uint256)", access: "onlyOwner", usdBalanceEffect: "-", fee: "NONE", feeRecipient: null, fomoUse: "admin (do NOT toggle per purchase)" },
    { name: "feeAccount", selector: "0x65e17c9d", signature: "feeAccount() view returns (address)", access: "public", usdBalanceEffect: "view", fee: "NONE", feeRecipient: null, fomoUse: "read" },
    { name: "owner", selector: "0x8da5cb5b", signature: "owner() view returns (address)", access: "public", usdBalanceEffect: "view", fee: "NONE", feeRecipient: null, fomoUse: "read (must equal CONTRACT_OWNER_SETTLEMENT signer)" },
  ],
  events: {
    DepositedUSD: "DepositedUSD",
    WithdrawnUSD: "WithdrawnUSD",
    ItemCreated: "0x39e723ac…",
    Sold: "0x…ee7…",
    Resolved: "0x73cb2424…",
  },
  feeBehavior: {
    appliesIn: ["purchaseDirectUSD", "completeDealUSD", "adminResolveUSD(takeFee=true)"],
    freeIn: ["depositUSD", "withdrawUSD", "adminResolveUSD(takeFee=false)", "refund branch"],
    note: "The 5% feePermille is a MARKETPLACE (OTC/P2P) fee, NOT an Acquiring deposit/withdraw/purchase fee.",
  },
  ownerRequirements: {
    ownerOnlyFunctions: ["setFeePermille", "setFeeAccount", "adminResolveUSD", "setUsdToken"],
    settlementCredentialPurpose: "CONTRACT_OWNER_SETTLEMENT",
    rule: "The settlement signer's derived address MUST equal on-chain owner(). Enforced on Test before Activate.",
  },
  abiSubset: [
    "function owner() view returns (address)",
    "function feeAccount() view returns (address)",
    "function feePermille() view returns (uint256)",
    "function usdBalance(address) view returns (uint256)",
    "function depositUSD(uint256 amount)",
    "function withdrawUSD(uint256 amount)",
    "function createItem(uint64 quantity, uint256 price, uint8 assetType, uint8 mode, address tokenForSale, address seller, uint256 tokenIdOrAmount)",
    "function safeMoneyUSD(uint256 id, bool useInternal)",
    "function adminResolveUSD(uint256 id, bool refundToBuyer, bool takeFee)",
  ],
  invariants: {
    doubleSpend: "withdrawUSD lets a user pull their FULL on-chain usdBalance directly, so a purchase MUST reduce on-chain usdBalance via the escrow path (safeMoneyUSD). Off-chain-only ledger debits are unsafe.",
    reconciliation: "MoneyLedger.available + reserved == on-chain usdBalance(user) (minus settled purchases). During CUSTODY_LOCKED the escrowed amount sits in MoneyLedger.reserved.",
  },
} as const;

export type ZkSyncCustodyManifest = typeof ZKSYNC_CUSTODY_MANIFEST;
