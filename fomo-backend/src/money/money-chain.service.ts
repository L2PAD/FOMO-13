import { Injectable, Logger } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import * as crypto from "crypto";
import { ethers } from "ethers";
import { MONEY_NETWORKS, ACTIVE_MONEY_NETWORK } from "./money.config";

/**
 * H3 — real zkSync/USDC chain layer.
 *
 * Responsibilities (NO money-core changes):
 *  - resolve the withdrawal signer from the Credentials Manager (encrypted at
 *    rest) with a legacy ENV fallback + a one-time migration into an encrypted
 *    credential;
 *  - a COMPOSITE readiness probe (RPC reachable, chainId, USDC contract code,
 *    signer address derivable, native gas balance) — never a "key exists" fake;
 *  - the actual ERC-20 USDC transfer used by WithdrawalExecutorService.
 *
 * A secret (private key) is only ever read/decrypted server-side and is NEVER
 * returned by any method, logged, or included in audit/diagnostics.
 */

const ALGO = "aes-256-gcm";
const CRED_COL = "money_credentials";
const NET_COL = "money_network_configs";

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

// keccak256("Transfer(address,address,uint256)")
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const topicToAddress = (t: string) => "0x" + String(t).slice(-40).toLowerCase();

const withTimeout = <T>(p: Promise<T>, ms = 6000): Promise<T> =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

export type ReadinessStatus =
  | "READY" | "DEGRADED" | "NOT_CONFIGURED" | "RPC_UNAVAILABLE"
  | "CHAIN_MISMATCH" | "CONTRACT_UNAVAILABLE" | "INVALID_SIGNER" | "INSUFFICIENT_GAS";

@Injectable()
export class MoneyChainService {
  private readonly logger = new Logger("MoneyChain");
  constructor(@InjectConnection() private readonly conn: Connection) {}

  private encKey(): Buffer {
    const src = process.env.CREDENTIAL_ENC_KEY || process.env.JWT_SECRET_ACCESS || "fomo-acquiring-credential-encryption-key";
    return crypto.createHash("sha256").update(src).digest();
  }
  private decrypt(payload: string): string {
    const [ivB, tagB, dataB] = String(payload).split(":");
    const decipher = crypto.createDecipheriv(ALGO, this.encKey(), Buffer.from(ivB, "base64"));
    decipher.setAuthTag(Buffer.from(tagB, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(dataB, "base64")), decipher.final()]).toString("utf8");
  }

  /** Merged network config: DB (CRM-managed, versioned) overrides code defaults. */
  async netConfig(networkId = ACTIVE_MONEY_NETWORK) {
    const base = MONEY_NETWORKS[networkId] || MONEY_NETWORKS[ACTIVE_MONEY_NETWORK];
    const doc: any = await this.conn.collection(NET_COL).findOne({ networkId }).catch(() => null);
    const httpDefault = process.env.MONEY_ZKSYNC_RPC_URL || process.env.MONEY_RPC_URL || "https://zksync.drpc.org";
    // ethers JsonRpcProvider only supports http(s). A ws(s):// endpoint (e.g. a
    // stale CRM value) would make every RPC read fail silently and park deposits
    // as VERIFICATION_UNAVAILABLE — so we ignore it and use the http default.
    const rawRpc = String(doc?.rpcUrl || "").trim();
    const rpcUrl = rawRpc && !/^wss?:\/\//i.test(rawRpc) ? rawRpc : httpDefault;
    return {
      networkId,
      chainId: Number(doc?.chainId ?? base.chainId),
      displayName: doc?.displayName || base.name,
      rpcUrl,
      treasuryAddress: doc?.treasuryAddress || base.treasuryAddress,
      confirmationsRequired: Number(doc?.confirmationsRequired ?? 12),
      token: {
        symbol: doc?.token?.symbol || base.tokenSymbol,
        address: doc?.token?.address || base.tokenAddress,
        decimals: Number(doc?.token?.decimals ?? base.decimals),
      },
      isMainnet: Number(doc?.chainId ?? base.chainId) === 324 || Number(doc?.chainId ?? base.chainId) === 1,
    };
  }

  /**
   * Resolve the active withdrawal signer WITHOUT exposing the secret to callers.
   * Returns only public metadata + an internal getter used inside this service.
   */
  private async resolveSignerSecret(networkId = ACTIVE_MONEY_NETWORK): Promise<{ secret: string; source: "CREDENTIAL" | "ENV"; credentialId: string | null } | null> {
    const c: any = await this.conn.collection(CRED_COL).findOne({ networkId, purpose: "WITHDRAWAL_SIGNER", status: "ACTIVE" }).catch(() => null);
    if (c?.encryptedSecret) {
      try { return { secret: this.decrypt(c.encryptedSecret), source: "CREDENTIAL", credentialId: String(c._id) }; }
      catch { /* fall through */ }
    }
    const envPk = process.env.MONEY_EXECUTOR_PK || process.env.MONEY_TREASURY_PK || "";
    if (envPk) return { secret: envPk, source: "ENV", credentialId: null };
    return null;
  }

  /** Public signer metadata (address + source), never the secret. */
  async signerInfo(networkId = ACTIVE_MONEY_NETWORK): Promise<{ configured: boolean; address: string | null; source: string | null; credentialId: string | null; valid: boolean }> {
    const s = await this.resolveSignerSecret(networkId);
    if (!s) return { configured: false, address: null, source: null, credentialId: null, valid: false };
    try {
      const addr = new ethers.Wallet(s.secret).address;
      return { configured: true, address: addr, source: s.source, credentialId: s.credentialId, valid: true };
    } catch {
      return { configured: true, address: null, source: s.source, credentialId: s.credentialId, valid: false };
    }
  }

  /**
   * Composite readiness. Each check is a runtime probe, not a config string test.
   * Never returns READY unless RPC, chainId, USDC contract, signer and gas pass.
   */
  async readiness(networkId = ACTIVE_MONEY_NETWORK) {
    const cfg = await this.netConfig(networkId);
    const signer = await this.signerInfo(networkId);
    const checks: { key: string; ok: boolean; detail: string }[] = [];
    let status: ReadinessStatus = "READY";
    const fail = (s: ReadinessStatus) => { if (status === "READY" || status === "DEGRADED") status = s; };

    // 1) signer present
    checks.push({ key: "signer_configured", ok: signer.configured, detail: signer.configured ? `source=${signer.source}` : "no ACTIVE WITHDRAWAL_SIGNER credential and no ENV signer" });
    // 2) signer decryptable + address derivable
    checks.push({ key: "signer_valid", ok: signer.valid, detail: signer.valid ? `address ${signer.address}` : "signer secret does not derive a valid address" });
    // 3) rpc configured
    const rpcConfigured = !!cfg.rpcUrl;
    checks.push({ key: "rpc_configured", ok: rpcConfigured, detail: rpcConfigured ? "rpcUrl set" : "no rpcUrl" });

    let rpcReachable = false; let onchainChainId: number | null = null; let latestBlock: number | null = null;
    let contractOk = false; let gasWei: bigint | null = null;

    if (rpcConfigured) {
      try {
        const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
        const net = await withTimeout(provider.getNetwork());
        onchainChainId = Number(net.chainId);
        rpcReachable = true;
        latestBlock = await withTimeout(provider.getBlockNumber()).catch(() => null as any);
        // contract code present at USDC address
        try {
          const code = await withTimeout(provider.getCode(cfg.token.address));
          contractOk = !!code && code !== "0x";
        } catch { contractOk = false; }
        // native gas balance of the signer
        if (signer.address) {
          try { gasWei = await withTimeout(provider.getBalance(signer.address)); } catch { gasWei = null; }
        }
      } catch { rpcReachable = false; }
    }

    checks.push({ key: "rpc_reachable", ok: rpcReachable, detail: rpcReachable ? `block ${latestBlock ?? "?"}` : (rpcConfigured ? "RPC unreachable" : "skipped (no rpc)") });
    const chainOk = rpcReachable && onchainChainId === cfg.chainId;
    checks.push({ key: "chain_id", ok: chainOk, detail: rpcReachable ? `expected ${cfg.chainId}, got ${onchainChainId}` : "skipped" });
    checks.push({ key: "usdc_contract", ok: contractOk, detail: contractOk ? `code present at ${cfg.token.address}` : (rpcReachable ? "no contract code at token address" : "skipped") });
    const gasSufficient = gasWei != null && gasWei > BigInt(0);
    checks.push({ key: "gas_balance", ok: gasSufficient, detail: gasWei != null ? `${ethers.formatEther(gasWei)} native` : "unknown" });
    checks.push({ key: "treasury", ok: /^0x[a-fA-F0-9]{40}$/.test(cfg.treasuryAddress), detail: cfg.treasuryAddress });

    // Derive composite status (first blocking failure wins).
    if (!signer.configured || !rpcConfigured) fail("NOT_CONFIGURED");
    else if (!signer.valid) fail("INVALID_SIGNER");
    else if (!rpcReachable) fail("RPC_UNAVAILABLE");
    else if (!chainOk) fail("CHAIN_MISMATCH");
    else if (!contractOk) fail("CONTRACT_UNAVAILABLE");
    else if (!gasSufficient) fail("INSUFFICIENT_GAS");

    return {
      networkId,
      status: status as ReadinessStatus,
      isMainnet: cfg.isMainnet,
      network: { displayName: cfg.displayName, chainId: cfg.chainId, onchainChainId, rpcConfigured, rpcReachable, latestBlock, confirmationsRequired: cfg.confirmationsRequired },
      token: { symbol: cfg.token.symbol, address: cfg.token.address, decimals: cfg.token.decimals, contractReachable: contractOk },
      treasury: cfg.treasuryAddress,
      signer: { configured: signer.configured, valid: signer.valid, address: signer.address, source: signer.source, credentialId: signer.credentialId },
      gas: { nativeBalance: gasWei != null ? ethers.formatEther(gasWei) : null, sufficient: gasSufficient },
      checks,
    };
  }

  /**
   * H3 — deposit crediting policy (safe for mainnet). On mainnet, crediting
   * REQUIRES RPC_VERIFY; the trust-record fallback is only for an explicit
   * non-mainnet dev/test mode.
   */
  async depositPolicy(networkId = ACTIVE_MONEY_NETWORK) {
    const cfg = await this.netConfig(networkId);
    const mode = await this.depositVerificationMode(networkId);
    const devTrust = String(process.env.MONEY_ALLOW_DEV_DEPOSIT_TRUST || "").toLowerCase() === "true";
    const creditAllowed = mode === "RPC_VERIFY" || (!cfg.isMainnet && devTrust);
    return {
      networkId, isMainnet: cfg.isMainnet, mode, devTrust,
      creditAllowed,
      onRpcUnavailable: cfg.isMainnet ? "NO_CREDIT_PENDING_MANUAL_REVIEW" : (devTrust ? "DEV_TRUST_CREDIT" : "NO_CREDIT_PENDING_MANUAL_REVIEW"),
      note: "На основной сети зачисление возможно только после независимой проверки транзакции через RPC. txHash от клиента без проверки не принимается.",
    };
  }

  /**
   * H3 forensic — the ACTUAL withdrawal execution model, derived from the real
   * code path (not assumed). The current executor performs a direct ERC-20
   * transfer from the signer EOA, so the signer's own balance is the source of
   * both USDC and gas. The deposit treasury (where users send funds) may be a
   * DIFFERENT address — surfaced explicitly so the operator funds the right wallet.
   */
  async withdrawalExecutionModel(networkId = ACTIVE_MONEY_NETWORK) {
    const cfg = await this.netConfig(networkId);
    const signer = await this.signerInfo(networkId);
    const signerAddr = signer.address || null;
    const sameAsTreasury = !!(signerAddr && signerAddr.toLowerCase() === String(cfg.treasuryAddress).toLowerCase());
    return {
      networkId,
      fundsSource: "TREASURY_EOA",
      contractModel: "DIRECT_EOA_ERC20_TRANSFER",
      transactionSigner: signerAddr,
      usdcSource: signerAddr,
      gasPayer: signerAddr,
      depositTreasury: cfg.treasuryAddress,
      signerEqualsTreasury: sameAsTreasury,
      requirements: signerAddr
        ? [`Кошелёк подписанта ${signerAddr} должен держать USDC (для выплат) и ETH (для газа).`,
           sameAsTreasury ? "Подписант совпадает с treasury депозитов: входящие депозиты сразу финансируют выплаты."
                          : "Подписант ≠ treasury депозитов: депозиты копятся в treasury; пополните кошелёк подписанта отдельно или назначьте адрес подписанта равным treasury."]
        : ["Подписант выводов не настроен — добавьте и активируйте ключ с назначением «Подписант выводов»."],
      note: "Модель отражает реальный код исполнителя (перевод ERC-20 с кошелька подписанта). Смарт-контрактное хранилище не используется.",
    };
  }

  /** True only when a real on-chain USDC transfer can be attempted. */
  async isExecutable(networkId = ACTIVE_MONEY_NETWORK): Promise<boolean> {
    const r = await this.readiness(networkId);
    return r.status === "READY";
  }

  /**
   * H3 — deposit detection mode. RPC_VERIFY when an RPC is reachable (backend
   * independently verifies each tx); CLIENT_TX_CONFIRM only as a dev fallback
   * when no RPC is configured (trusts the submitted record — NOT for production).
   */
  async depositVerificationMode(networkId = ACTIVE_MONEY_NETWORK): Promise<"RPC_VERIFY" | "CLIENT_TX_CONFIRM"> {
    const cfg = await this.netConfig(networkId);
    if (!cfg.rpcUrl) return "CLIENT_TX_CONFIRM";
    try {
      const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
      await withTimeout(provider.getBlockNumber());
      return "RPC_VERIFY";
    } catch { return "CLIENT_TX_CONFIRM"; }
  }

  /**
   * Independently verify an on-chain USDC deposit by txHash. Checks the receipt
   * status, confirmations and the ERC-20 Transfer(from -> treasury, token=USDC,
   * value) log. Returns canonical facts read from chain — the caller compares
   * amount/recipient before crediting the MoneyLedger. Never trusts client input.
   */
  async verifyDepositOnChain(txHash: string, networkId = ACTIVE_MONEY_NETWORK): Promise<{
    verified: boolean; reason: string; from?: string; to?: string; token?: string;
    amount?: number; confirmations?: number; blockNumber?: number; status?: number;
  }> {
    const cfg = await this.netConfig(networkId);
    if (!cfg.rpcUrl) return { verified: false, reason: "RPC_NOT_CONFIGURED" };
    if (!/^0x[a-fA-F0-9]{64}$/.test(String(txHash || ""))) return { verified: false, reason: "INVALID_TX_HASH" };
    let provider: ethers.JsonRpcProvider;
    try { provider = new ethers.JsonRpcProvider(cfg.rpcUrl); } catch { return { verified: false, reason: "RPC_UNAVAILABLE" }; }
    let receipt: any; let latest: number;
    try {
      receipt = await withTimeout(provider.getTransactionReceipt(txHash));
      latest = await withTimeout(provider.getBlockNumber());
    } catch { return { verified: false, reason: "RPC_UNAVAILABLE" }; }
    if (!receipt) return { verified: false, reason: "TX_NOT_FOUND" };
    if (Number(receipt.status) !== 1) return { verified: false, reason: "TX_FAILED", status: Number(receipt.status) };

    const usdc = String(cfg.token.address).toLowerCase();
    const treasury = String(cfg.treasuryAddress).toLowerCase();
    const transfer = (receipt.logs || []).find((l: any) =>
      String(l.address).toLowerCase() === usdc &&
      String(l.topics?.[0]).toLowerCase() === TRANSFER_TOPIC &&
      topicToAddress(l.topics?.[2]) === treasury,
    );
    if (!transfer) return { verified: false, reason: "NO_USDC_TRANSFER_TO_TREASURY" };

    const from = topicToAddress(transfer.topics[1]);
    const value = BigInt(transfer.data);
    const amount = Number(ethers.formatUnits(value, cfg.token.decimals));
    const confirmations = Math.max(0, latest - Number(receipt.blockNumber) + 1);
    if (confirmations < cfg.confirmationsRequired) {
      return { verified: false, reason: "INSUFFICIENT_CONFIRMATIONS", from, to: treasury, token: usdc, amount, confirmations, blockNumber: Number(receipt.blockNumber), status: 1 };
    }
    return { verified: true, reason: "OK", from, to: treasury, token: usdc, amount, confirmations, blockNumber: Number(receipt.blockNumber), status: 1 };
  }

  /**
   * Send `amount` USDC to `destination` on the configured network.
   * Throws EXECUTOR_NOT_CONFIGURED / readiness codes if not fully ready.
   * Waits for the tx to be mined so the caller only finalizes a real transfer.
   */
  async sendUsdc(destination: string, amount: number, networkId = ACTIVE_MONEY_NETWORK): Promise<{ txHash: string }> {
    const ready = await this.readiness(networkId);
    if (ready.status !== "READY") throw new Error(ready.status === "NOT_CONFIGURED" ? "EXECUTOR_NOT_CONFIGURED" : ready.status);
    const s = await this.resolveSignerSecret(networkId);
    if (!s) throw new Error("EXECUTOR_NOT_CONFIGURED");
    const cfg = await this.netConfig(networkId);
    const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
    const wallet = new ethers.Wallet(s.secret, provider);
    const usdc = new ethers.Contract(cfg.token.address, ERC20_ABI, wallet);
    const units = ethers.parseUnits(String(amount), cfg.token.decimals);
    const tx = await usdc.transfer(destination, units);
    // Wait for at least 1 confirmation — we never report CONFIRMED for an unmined tx.
    await tx.wait(1);
    return { txHash: tx.hash };
  }

  /**
   * H3/P4 — migrate a legacy ENV signer into an encrypted credential so runtime
   * uses credentialId (never .env). Idempotent; returns a summary (no secret).
   */
  async migrateEnvSigner(networkId = ACTIVE_MONEY_NETWORK, actor = "system"): Promise<{ migrated: boolean; reason: string; credentialId?: string }> {
    const envPk = process.env.MONEY_EXECUTOR_PK || process.env.MONEY_TREASURY_PK || "";
    if (!envPk) return { migrated: false, reason: "no ENV signer present" };
    const existing = await this.conn.collection(CRED_COL).findOne({ networkId, purpose: "WITHDRAWAL_SIGNER", status: { $in: ["ACTIVE", "INACTIVE"] } });
    if (existing) return { migrated: false, reason: "credential already exists" };
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, this.encKey(), iv);
    const enc = Buffer.concat([cipher.update(envPk, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    const encryptedSecret = `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
    const last4 = envPk.length >= 4 ? envPk.slice(-4) : envPk;
    const r = await this.conn.collection(CRED_COL).insertOne({
      label: "Migrated ENV signer", networkId, purpose: "WITHDRAWAL_SIGNER",
      status: "INACTIVE", encryptedSecret, secretLast4: last4, createdAt: new Date(), createdBy: actor, migratedFromEnv: true,
    } as any);
    return { migrated: true, reason: "ENV signer encrypted into credential (INACTIVE — test & activate to use)", credentialId: String(r.insertedId) };
  }

  // ===================================================================
  // H4 — FOMO Custody Contract layer (existing OTC contract 0xc6b848...).
  // Deposit receiver == custody contract; usdBalance(user) is the on-chain
  // spendable. Membership purchases use the fee-free escrow path:
  //   user safeMoneyUSD(itemId,true)  ->  owner adminResolveUSD(itemId,false,false)
  // The owner call is signed by an ACTIVE CONTRACT_OWNER_SETTLEMENT credential
  // whose derived address MUST equal the on-chain owner(). No global feePermille
  // change; takeFee=false so there is NO marketplace fee on subscriptions.
  // ===================================================================
  private static readonly OTC_ABI = [
    "function owner() view returns (address)",
    "function feeAccount() view returns (address)",
    "function feePermille() view returns (uint256)",
    "function usdBalance(address) view returns (uint256)",
    "function createItem(uint64 quantity, uint256 price, uint8 assetType, uint8 mode, address tokenForSale, address seller, uint256 tokenIdOrAmount) returns (uint256)",
    "function adminResolveUSD(uint256 id, bool refundToBuyer, bool takeFee)",
    "event ItemCreated(uint256 indexed id, address indexed seller, uint256 price)",
  ];
  // safeMoneyUSD(uint256,bool) selector — the user's on-chain custody lock call.
  private static readonly SAFE_MONEY_USD_SELECTOR = "0xfb57e6a8";
  // withdrawUSD(uint256) selector — the user's on-chain withdrawal call.
  private static readonly WITHDRAW_USD_SELECTOR = "0x159a71dc";
  // keccak256("ItemCreated(uint256,address,uint256)")
  private static readonly ITEM_CREATED_TOPIC = "0x39e723ac".toLowerCase();

  /** The custody contract address (= configured deposit receiver). */
  async custodyContract(networkId = ACTIVE_MONEY_NETWORK): Promise<string> {
    const cfg = await this.netConfig(networkId);
    return cfg.treasuryAddress;
  }

  /** On-chain owner() of the custody contract. */
  async contractOwner(networkId = ACTIVE_MONEY_NETWORK): Promise<string | null> {
    const cfg = await this.netConfig(networkId);
    try {
      const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
      const c = new ethers.Contract(cfg.treasuryAddress, MoneyChainService.OTC_ABI, provider);
      return await withTimeout(c.owner());
    } catch { return null; }
  }

  /** On-chain spendable usdBalance(user) in the custody contract (human units). */
  async usdBalanceOf(address: string, networkId = ACTIVE_MONEY_NETWORK): Promise<number | null> {
    const cfg = await this.netConfig(networkId);
    try {
      const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
      const c = new ethers.Contract(cfg.treasuryAddress, MoneyChainService.OTC_ABI, provider);
      const bal = await withTimeout(c.usdBalance(address));
      return Number(ethers.formatUnits(bal, cfg.token.decimals));
    } catch { return null; }
  }

  private async resolveOwnerSecret(networkId = ACTIVE_MONEY_NETWORK): Promise<{ secret: string; credentialId: string } | null> {
    const c: any = await this.conn.collection(CRED_COL).findOne({ networkId, purpose: "CONTRACT_OWNER_SETTLEMENT", status: "ACTIVE" }).catch(() => null);
    if (c?.encryptedSecret) {
      try { return { secret: this.decrypt(c.encryptedSecret), credentialId: String(c._id) }; } catch { /* noop */ }
    }
    return null;
  }

  /** Public owner-settlement signer metadata + on-chain owner match (never the secret). */
  async ownerSettlementInfo(networkId = ACTIVE_MONEY_NETWORK): Promise<{ configured: boolean; address: string | null; ownerOnChain: string | null; ownerMatch: boolean; ready: boolean; reason: string }> {
    const s = await this.resolveOwnerSecret(networkId);
    const ownerOnChain = await this.contractOwner(networkId);
    if (!s) return { configured: false, address: null, ownerOnChain, ownerMatch: false, ready: false, reason: "NO_ACTIVE_OWNER_CREDENTIAL" };
    let address: string | null = null;
    try { address = new ethers.Wallet(s.secret).address; } catch { return { configured: true, address: null, ownerOnChain, ownerMatch: false, ready: false, reason: "INVALID_KEY" }; }
    const ownerMatch = !!(address && ownerOnChain && address.toLowerCase() === String(ownerOnChain).toLowerCase());
    return { configured: true, address, ownerOnChain, ownerMatch, ready: ownerMatch, reason: ownerMatch ? "READY" : "DERIVED_ADDRESS_NOT_CONTRACT_OWNER" };
  }

  /**
   * Verify the user's on-chain custody lock (safeMoneyUSD) transaction:
   * receipt success, caller == authenticated user's wallet, target == custody
   * contract, correct selector, and enough confirmations. Never trusts client input.
   */
  async verifyCustodyLockOnChain(txHash: string, userWallet: string, networkId = ACTIVE_MONEY_NETWORK): Promise<{ verified: boolean; reason: string; from?: string; to?: string; itemId?: string; confirmations?: number; blockNumber?: number }> {
    const cfg = await this.netConfig(networkId);
    if (!/^0x[a-fA-F0-9]{64}$/.test(String(txHash || ""))) return { verified: false, reason: "INVALID_TX_HASH" };
    let provider: ethers.JsonRpcProvider;
    try { provider = new ethers.JsonRpcProvider(cfg.rpcUrl); } catch { return { verified: false, reason: "RPC_UNAVAILABLE" }; }
    let receipt: any; let tx: any; let latest: number;
    try {
      receipt = await withTimeout(provider.getTransactionReceipt(txHash));
      tx = await withTimeout(provider.getTransaction(txHash));
      latest = await withTimeout(provider.getBlockNumber());
    } catch { return { verified: false, reason: "RPC_UNAVAILABLE" }; }
    if (!receipt || !tx) return { verified: false, reason: "TX_NOT_FOUND" };
    if (Number(receipt.status) !== 1) return { verified: false, reason: "TX_FAILED" };
    const to = String(tx.to || "").toLowerCase();
    const from = String(tx.from || "").toLowerCase();
    if (to !== String(cfg.treasuryAddress).toLowerCase()) return { verified: false, reason: "WRONG_CONTRACT", from, to };
    if (from !== String(userWallet || "").toLowerCase()) return { verified: false, reason: "WRONG_SENDER", from, to };
    const input = String(tx.data || tx.input || "");
    if (input.slice(0, 10).toLowerCase() !== MoneyChainService.SAFE_MONEY_USD_SELECTOR) return { verified: false, reason: "NOT_SAFEMONEY_CALL", from, to };
    let itemId: string | undefined;
    try { const [id] = ethers.AbiCoder.defaultAbiCoder().decode(["uint256", "bool"], "0x" + input.slice(10)); itemId = id.toString(); } catch { /* noop */ }
    const confirmations = Math.max(0, latest - Number(receipt.blockNumber) + 1);
    if (confirmations < cfg.confirmationsRequired) return { verified: false, reason: "INSUFFICIENT_CONFIRMATIONS", from, to, itemId, confirmations, blockNumber: Number(receipt.blockNumber) };
    return { verified: true, reason: "OK", from, to, itemId, confirmations, blockNumber: Number(receipt.blockNumber) };
  }

  /**
   * Owner-signed fee-free settlement of a locked custody deal.
   * adminResolveUSD(itemId, refundToBuyer, takeFee=false). Requires an ACTIVE
   * CONTRACT_OWNER_SETTLEMENT credential whose address == contract owner().
   * Throws OWNER_SETTLEMENT_NOT_READY until the operator adds & activates it.
   */
  async executeOwnerResolve(itemId: string | number, refundToBuyer: boolean, networkId = ACTIVE_MONEY_NETWORK): Promise<{ txHash: string }> {
    const info = await this.ownerSettlementInfo(networkId);
    if (!info.ready) throw new Error(`OWNER_SETTLEMENT_NOT_READY:${info.reason}`);
    const s = await this.resolveOwnerSecret(networkId);
    if (!s) throw new Error("OWNER_SETTLEMENT_NOT_READY:NO_ACTIVE_OWNER_CREDENTIAL");
    const cfg = await this.netConfig(networkId);
    const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
    const wallet = new ethers.Wallet(s.secret, provider);
    const c = new ethers.Contract(cfg.treasuryAddress, MoneyChainService.OTC_ABI, wallet);
    const tx = await c.adminResolveUSD(itemId, refundToBuyer, false); // takeFee=false → NO marketplace fee
    await tx.wait(1);
    return { txHash: tx.hash };
  }

  /**
   * PlatformPurchaseContractStrategy — how FOMO maps a Purchase onto the custody
   * contract. Because the runtime forensic could NOT prove that a single item is
   * safely reusable across many buyers (item state flags flip on resolve), the
   * canonical, conservative strategy is a FRESH settlement item PER purchase
   * (seller = owner, tokenForSale = 0 so no NFT/ERC20 escrow is required on
   * create). This never hands the buyer any marketplace entity we don't want.
   */
  /** H4 — total USDC token balance actually held by the custody contract on-chain. */
  async contractTokenBalance(networkId = ACTIVE_MONEY_NETWORK): Promise<number | null> {
    try {
      const cfg = await this.netConfig(networkId);
      const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
      const erc = new ethers.Contract(cfg.token.address, ["function balanceOf(address) view returns (uint256)"], provider);
      const bal = await withTimeout(erc.balanceOf(cfg.treasuryAddress));
      return Number(ethers.formatUnits(bal, cfg.token.decimals));
    } catch { return null; }
  }

  custodyItemStrategy() {
    return {
      mode: "PER_PURCHASE_ITEM" as const,
      seller: "CONTRACT_OWNER",
      tokenForSale: "0x0000000000000000000000000000000000000000",
      requiresTokenEscrowOnCreate: false,
      reusable: false,
      settlement: "adminResolveUSD(itemId,false,false)",
      refundPreSettlement: "adminResolveUSD(itemId,true,false)",
      note: "One settlement item per Purchase; created & resolved by the owner credential; fee-free (takeFee=false).",
    };
  }

  /**
   * Owner-signed creation of a per-purchase settlement lot. Requires an ACTIVE
   * CONTRACT_OWNER_SETTLEMENT credential (seller must be the owner). Returns the
   * on-chain itemId (parsed from the ItemCreated event) + txHash. Throws
   * OWNER_SETTLEMENT_NOT_READY until the operator activates the owner key.
   */
  async executeCreateItem(priceHuman: number, networkId = ACTIVE_MONEY_NETWORK): Promise<{ itemId: string; txHash: string; blockNumber: number | null }> {
    const info = await this.ownerSettlementInfo(networkId);
    if (!info.ready) throw new Error(`OWNER_SETTLEMENT_NOT_READY:${info.reason}`);
    const s = await this.resolveOwnerSecret(networkId);
    if (!s) throw new Error("OWNER_SETTLEMENT_NOT_READY:NO_ACTIVE_OWNER_CREDENTIAL");
    const cfg = await this.netConfig(networkId);
    const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
    const wallet = new ethers.Wallet(s.secret, provider);
    const owner = wallet.address;
    const c = new ethers.Contract(cfg.treasuryAddress, MoneyChainService.OTC_ABI, wallet);
    const price = ethers.parseUnits(String(priceHuman), cfg.token.decimals);
    const ZERO = "0x0000000000000000000000000000000000000000";
    // quantity=1, assetType=0, mode=1 (escrow/USD sale), tokenForSale=0, seller=owner, tokenIdOrAmount=0
    const tx = await c.createItem(1, price, 0, 1, ZERO, owner, 0);
    const receipt = await tx.wait(1);
    let itemId = "";
    for (const log of receipt?.logs || []) {
      if (String(log.topics?.[0] || "").toLowerCase().startsWith(MoneyChainService.ITEM_CREATED_TOPIC)) {
        try { itemId = BigInt(log.topics[1]).toString(); break; } catch { /* noop */ }
      }
    }
    return { itemId, txHash: tx.hash, blockNumber: receipt?.blockNumber ?? null };
  }

  /**
   * Verify the user's on-chain withdrawal (withdrawUSD) transaction: receipt
   * success, caller == user wallet, target == custody contract, correct selector,
   * amount from calldata, and enough confirmations. Never trusts client input.
   */
  async verifyWithdrawalOnChain(txHash: string, userWallet: string, networkId = ACTIVE_MONEY_NETWORK): Promise<{ verified: boolean; reason: string; from?: string; to?: string; amount?: number; confirmations?: number; blockNumber?: number }> {
    const cfg = await this.netConfig(networkId);
    if (!/^0x[a-fA-F0-9]{64}$/.test(String(txHash || ""))) return { verified: false, reason: "INVALID_TX_HASH" };
    let provider: ethers.JsonRpcProvider;
    try { provider = new ethers.JsonRpcProvider(cfg.rpcUrl); } catch { return { verified: false, reason: "RPC_UNAVAILABLE" }; }
    let receipt: any; let tx: any; let latest: number;
    try {
      receipt = await withTimeout(provider.getTransactionReceipt(txHash));
      tx = await withTimeout(provider.getTransaction(txHash));
      latest = await withTimeout(provider.getBlockNumber());
    } catch { return { verified: false, reason: "RPC_UNAVAILABLE" }; }
    if (!receipt || !tx) return { verified: false, reason: "TX_NOT_FOUND" };
    if (Number(receipt.status) !== 1) return { verified: false, reason: "TX_FAILED" };
    const to = String(tx.to || "").toLowerCase();
    const from = String(tx.from || "").toLowerCase();
    if (to !== String(cfg.treasuryAddress).toLowerCase()) return { verified: false, reason: "WRONG_CONTRACT", from, to };
    if (from !== String(userWallet || "").toLowerCase()) return { verified: false, reason: "WRONG_SENDER", from, to };
    const input = String(tx.data || tx.input || "");
    if (input.slice(0, 10).toLowerCase() !== MoneyChainService.WITHDRAW_USD_SELECTOR) return { verified: false, reason: "NOT_WITHDRAW_CALL", from, to };
    let amount: number | undefined;
    try { const [amt] = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], "0x" + input.slice(10)); amount = Number(ethers.formatUnits(amt, cfg.token.decimals)); } catch { /* noop */ }
    const confirmations = Math.max(0, latest - Number(receipt.blockNumber) + 1);
    if (confirmations < cfg.confirmationsRequired) return { verified: false, reason: "INSUFFICIENT_CONFIRMATIONS", from, to, amount, confirmations, blockNumber: Number(receipt.blockNumber) };
    return { verified: true, reason: "OK", from, to, amount, confirmations, blockNumber: Number(receipt.blockNumber) };
  }

  /**
   * Custody reconciliation for a single user. During CUSTODY_LOCKED it is NORMAL
   * that on-chain usdBalance(user) < MoneyLedger total, because the escrowed
   * amount left usdBalance into a pending deal and lives in MoneyLedger.reserved.
   * So the invariant compared is: usdBalance ≈ ledger.total − custodyLocked.
   */
  async custodyReconcile(userWallet: string, ledgerTotal: number, ledgerReserved: number, custodyLocked: number, networkId = ACTIVE_MONEY_NETWORK) {
    const onchain = userWallet ? await this.usdBalanceOf(userWallet, networkId) : null;
    const expectedOnchain = Math.round((ledgerTotal - custodyLocked) * 1e6) / 1e6;
    const diff = onchain == null ? null : Math.round((onchain - expectedOnchain) * 1e6) / 1e6;
    let status = "UNKNOWN";
    if (onchain == null) status = "ONCHAIN_UNAVAILABLE";
    else if (Math.abs(diff as number) <= 0.000001) status = "IN_SYNC";
    else if ((diff as number) > 0) status = "ONCHAIN_SURPLUS"; // user funded more than ledger knows (recover deposit)
    else status = "OUT_OF_SYNC";
    return {
      userWallet: userWallet || null,
      onchainUsdBalance: onchain,
      ledgerTotal, ledgerReserved, custodyLocked,
      expectedOnchain,
      difference: diff,
      status,
      note: "custodyLocked = amount escrowed by pending CUSTODY_LOCKED/OWNER_SETTLEMENT_PENDING purchases; not a real out-of-sync.",
    };
  }

  // ===================================================================
  // H5 — CLIENT-SIGNED owner settlement (NO server-held private key).
  // The operator connects the owner wallet (0xD128…) in the CRM and signs
  // createItem / adminResolveUSD in their browser (MetaMask). The backend
  // NEVER holds the owner key — it only (a) tells the CRM what to sign and
  // (b) RPC-verifies the resulting txHash was the exact owner-signed call.
  // ===================================================================
  // keccak256("adminResolveUSD(uint256,bool,bool)")[:4]
  private static readonly ADMIN_RESOLVE_USD_SELECTOR = "0xe6d8c0f7";
  // keccak256("createItem(uint64,uint256,uint8,uint8,address,address,uint256)")[:4]
  private static readonly CREATE_ITEM_SELECTOR = "0xd2e3c2ae";
  private static readonly ZERO_ADDR = "0x0000000000000000000000000000000000000000";

  /** Everything the CRM needs to connect the owner wallet + build/verify calls. */
  async custodyConnectStatus(networkId = ACTIVE_MONEY_NETWORK) {
    const cfg = await this.netConfig(networkId);
    const ownerOnChain = await this.contractOwner(networkId);
    let ownerUsdBalance: number | null = null;
    if (ownerOnChain) {
      try { ownerUsdBalance = await this.usdBalanceOf(String(ownerOnChain), networkId); } catch { ownerUsdBalance = null; }
    }
    return {
      contract: cfg.treasuryAddress,
      chainId: cfg.chainId,
      chainIdHex: "0x" + Number(cfg.chainId).toString(16),
      networkName: cfg.displayName || "zkSync Era",
      rpcUrl: cfg.rpcUrl,
      ownerOnChain: ownerOnChain ? String(ownerOnChain) : null,
      ownerUsdBalance, // owner's internal USD balance on the contract = platform funds withdrawable via withdrawUSD
      token: { symbol: cfg.token.symbol, address: cfg.token.address, decimals: cfg.token.decimals },
      explorerTxBase: "https://explorer.zksync.io/tx/",
      // ABI fragments the CRM signs with (owner-only calls, fee-free).
      abi: [
        "function createItem(uint64 quantity, uint256 price, uint8 assetType, uint8 mode, address tokenForSale, address seller, uint256 tokenIdOrAmount) returns (uint256)",
        "function adminResolveUSD(uint256 id, bool refundToBuyer, bool takeFee)",
        "function withdrawUSD(uint256 amount)",
        "function usdBalance(address account) view returns (uint256)",
        "function owner() view returns (address)",
      ],
    };
  }

  /** Params the CRM feeds into createItem() when the owner signs (fee-free per-purchase lot). */
  async createItemParams(priceHuman: number, networkId = ACTIVE_MONEY_NETWORK) {
    const cfg = await this.netConfig(networkId);
    const ownerOnChain = await this.contractOwner(networkId);
    const price = ethers.parseUnits(String(priceHuman), cfg.token.decimals).toString();
    return {
      contract: cfg.treasuryAddress,
      priceHuman,
      // createItem(quantity=1, price, assetType=0, mode=1 (USD escrow), tokenForSale=0, seller=owner, tokenIdOrAmount=0)
      args: [1, price, 0, 1, MoneyChainService.ZERO_ADDR, ownerOnChain || MoneyChainService.ZERO_ADDR, 0],
      itemCreatedTopic: MoneyChainService.ITEM_CREATED_TOPIC,
    };
  }

  private async loadTx(txHash: string, networkId: string) {
    const cfg = await this.netConfig(networkId);
    if (!/^0x[a-fA-F0-9]{64}$/.test(String(txHash || ""))) return { cfg, err: "INVALID_TX_HASH" as const };
    let provider: ethers.JsonRpcProvider;
    try { provider = new ethers.JsonRpcProvider(cfg.rpcUrl); } catch { return { cfg, err: "RPC_UNAVAILABLE" as const }; }
    try {
      const receipt: any = await withTimeout(provider.getTransactionReceipt(txHash));
      const tx: any = await withTimeout(provider.getTransaction(txHash));
      const latest: number = await withTimeout(provider.getBlockNumber());
      return { cfg, receipt, tx, latest };
    } catch { return { cfg, err: "RPC_UNAVAILABLE" as const }; }
  }

  /**
   * Verify a CLIENT-SIGNED owner adminResolveUSD(itemId, refundToBuyer, takeFee=false) tx:
   * receipt success, target == custody contract, sender == on-chain owner(),
   * correct selector, and calldata args exactly match (itemId, refundToBuyer, takeFee=false).
   */
  async verifyOwnerResolveOnChain(txHash: string, expectedItemId: string | number, expectedRefundToBuyer: boolean, networkId = ACTIVE_MONEY_NETWORK): Promise<{ verified: boolean; reason: string; from?: string; itemId?: string; refundToBuyer?: boolean; blockNumber?: number }> {
    const { cfg, receipt, tx, err } = await this.loadTx(txHash, networkId);
    if (err) return { verified: false, reason: err };
    if (!receipt || !tx) return { verified: false, reason: "TX_NOT_FOUND" };
    if (Number(receipt.status) !== 1) return { verified: false, reason: "TX_FAILED" };
    const to = String(tx.to || "").toLowerCase();
    const from = String(tx.from || "").toLowerCase();
    if (to !== String(cfg.treasuryAddress).toLowerCase()) return { verified: false, reason: "WRONG_CONTRACT", from };
    const ownerOnChain = await this.contractOwner(networkId);
    if (!ownerOnChain || from !== String(ownerOnChain).toLowerCase()) return { verified: false, reason: "NOT_OWNER_SIGNED", from };
    const input = String(tx.data || tx.input || "");
    if (input.slice(0, 10).toLowerCase() !== MoneyChainService.ADMIN_RESOLVE_USD_SELECTOR) return { verified: false, reason: "NOT_ADMIN_RESOLVE_CALL", from };
    let itemId: string | undefined; let refundToBuyer: boolean | undefined; let takeFee: boolean | undefined;
    try {
      const [id, refund, fee] = ethers.AbiCoder.defaultAbiCoder().decode(["uint256", "bool", "bool"], "0x" + input.slice(10));
      itemId = id.toString(); refundToBuyer = Boolean(refund); takeFee = Boolean(fee);
    } catch { return { verified: false, reason: "CALLDATA_DECODE_FAILED", from }; }
    if (String(itemId) !== String(expectedItemId)) return { verified: false, reason: `ITEM_MISMATCH: tx ${itemId} != expected ${expectedItemId}`, from, itemId };
    if (refundToBuyer !== expectedRefundToBuyer) return { verified: false, reason: `REFUND_FLAG_MISMATCH: tx ${refundToBuyer} != expected ${expectedRefundToBuyer}`, from, itemId, refundToBuyer };
    if (takeFee === true) return { verified: false, reason: "FEE_TAKEN_NOT_ALLOWED", from, itemId };
    return { verified: true, reason: "OK", from, itemId, refundToBuyer, blockNumber: Number(receipt.blockNumber) };
  }

  /**
   * Verify a CLIENT-SIGNED owner createItem(...) tx and parse the resulting itemId
   * from the ItemCreated event. sender must be the on-chain owner().
   */
  async verifyItemCreatedOnChain(txHash: string, networkId = ACTIVE_MONEY_NETWORK): Promise<{ verified: boolean; reason: string; itemId?: string; from?: string; blockNumber?: number }> {
    const { cfg, receipt, tx, err } = await this.loadTx(txHash, networkId);
    if (err) return { verified: false, reason: err };
    if (!receipt || !tx) return { verified: false, reason: "TX_NOT_FOUND" };
    if (Number(receipt.status) !== 1) return { verified: false, reason: "TX_FAILED" };
    const to = String(tx.to || "").toLowerCase();
    const from = String(tx.from || "").toLowerCase();
    if (to !== String(cfg.treasuryAddress).toLowerCase()) return { verified: false, reason: "WRONG_CONTRACT", from };
    const ownerOnChain = await this.contractOwner(networkId);
    if (!ownerOnChain || from !== String(ownerOnChain).toLowerCase()) return { verified: false, reason: "NOT_OWNER_SIGNED", from };
    const input = String(tx.data || tx.input || "");
    if (input.slice(0, 10).toLowerCase() !== MoneyChainService.CREATE_ITEM_SELECTOR) return { verified: false, reason: "NOT_CREATE_ITEM_CALL", from };
    let itemId = "";
    for (const log of receipt?.logs || []) {
      if (String(log.topics?.[0] || "").toLowerCase().startsWith(MoneyChainService.ITEM_CREATED_TOPIC)) {
        try { itemId = BigInt(log.topics[1]).toString(); break; } catch { /* noop */ }
      }
    }
    if (!itemId) return { verified: false, reason: "ITEM_CREATED_EVENT_NOT_FOUND", from };
    return { verified: true, reason: "OK", itemId, from, blockNumber: Number(receipt.blockNumber) };
  }

  /**
   * H5 — Scan recent incoming USDC transfers from a wallet to the custody
   * treasury (for "Scan my recent deposits"). Uses eth_getLogs (no global
   * indexer). Best-effort: returns [] on RPC/range errors.
   */
  async scanIncomingDeposits(wallet: string, networkId = ACTIVE_MONEY_NETWORK): Promise<Array<{ txHash: string; amount: number; blockNumber: number }>> {
    try {
      if (!/^0x[a-fA-F0-9]{40}$/.test(String(wallet || ""))) return [];
      const cfg = await this.netConfig(networkId);
      const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
      const latest = await withTimeout(provider.getBlockNumber());
      const WINDOW = 150000; // ~recent history on zkSync Era
      const fromBlock = Math.max(0, Number(latest) - WINDOW);
      const transferTopic = ethers.id("Transfer(address,address,uint256)");
      const pad = (a: string) => ethers.zeroPadValue(ethers.getAddress(a), 32);
      const logs: any[] = await withTimeout(provider.getLogs({
        address: cfg.token.address,
        topics: [transferTopic, pad(wallet), pad(cfg.treasuryAddress)],
        fromBlock, toBlock: Number(latest),
      }));
      return (logs || []).map((l) => ({
        txHash: l.transactionHash,
        amount: Number(ethers.formatUnits(BigInt(l.data), cfg.token.decimals)),
        blockNumber: Number(l.blockNumber),
      })).filter((x) => x.amount > 0);
    } catch {
      return [];
    }
  }
}
