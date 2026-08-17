import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import * as crypto from "crypto";
import { MoneyService } from "./money.service";
import { MoneyChainService } from "./money-chain.service";
import { MONEY_NETWORKS, ACTIVE_MONEY_NETWORK } from "./money.config";

/**
 * FOMO Acquiring control (Phase H2).
 *
 * Manages the ADMIN-facing configuration of FOMO's own payment rail on top of
 * the canonical money core (which is NOT modified here):
 *  - versioned network + treasury (public address) config,
 *  - executor signer credentials (AES-256-GCM at rest, never returned),
 *  - deposits / events / audit read-models.
 *
 * Two distinct entities are kept separate (H2 §10):
 *   MoneyNetworkConfig.treasuryAddress  -> PUBLIC receiving address (editable)
 *   MoneyExecutorCredential.encryptedSecret -> SECRET signer (encrypted, masked)
 */

const ALGO = "aes-256-gcm";
const NET_COL = "money_network_configs";
const NET_HIST = "money_network_config_history";
const CRED_COL = "money_credentials";
const AUDIT_COL = "money_admin_audit";

@Injectable()
export class MoneyAcquiringService {
  constructor(
    @InjectConnection() private readonly conn: Connection,
    private readonly money: MoneyService,
    private readonly chain: MoneyChainService,
  ) {}

  private encKey(): Buffer {
    const src = process.env.CREDENTIAL_ENC_KEY || process.env.JWT_SECRET_ACCESS || "fomo-acquiring-credential-encryption-key";
    return crypto.createHash("sha256").update(src).digest();
  }
  private encrypt(plain: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, this.encKey(), iv);
    const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
  }
  private last4(s: string): string { const t = String(s || ""); return t.length >= 4 ? t.slice(-4) : t; }
  private mask(l4: string): string { return l4 ? `\u2022\u2022\u2022\u2022${l4}` : "\u2022\u2022\u2022\u2022"; }
  private async audit(entry: any) { try { await this.conn.collection(AUDIT_COL).insertOne({ ...entry, at: new Date() }); } catch { /* best-effort */ } }

  // ---------- Network & treasury config (versioned) ----------
  async getNetwork(networkId = ACTIVE_MONEY_NETWORK) {
    let cfg: any = await this.conn.collection(NET_COL).findOne({ networkId });
    if (!cfg) {
      const base = MONEY_NETWORKS[networkId] || MONEY_NETWORKS[ACTIVE_MONEY_NETWORK];
      cfg = {
        networkId, version: 1, enabled: true, displayName: base.name, chainId: base.chainId,
        rpcUrl: process.env.MONEY_ZKSYNC_RPC_URL || process.env.MONEY_RPC_URL || "https://zksync.drpc.org",
        explorerUrl: "https://explorer.zksync.io", confirmationsRequired: 12,
        treasuryAddress: base.treasuryAddress,
        depositFeeMode: "NONE", depositFeeValue: 0, withdrawalFeeMode: "NONE", withdrawalFeeValue: 0,
        token: { symbol: base.tokenSymbol, address: base.tokenAddress, decimals: base.decimals, depositEnabled: base.depositEnabled, withdrawalEnabled: base.withdrawalEnabled, minDeposit: 0.1, minWithdrawal: 1, withdrawalFee: 0 },
        createdAt: new Date(), updatedAt: new Date(),
      };
      await this.conn.collection(NET_COL).insertOne(cfg);
    }
    const readiness = await this.chain.readiness(networkId);
    return { ...cfg, executor: { hasActiveSigner: readiness.signer.configured, rpcConfigured: readiness.network.rpcConfigured, status: readiness.status, readiness } };
  }

  /** H3 — composite executor readiness (no secret exposed). */
  async executorReadiness(networkId = ACTIVE_MONEY_NETWORK) {
    return this.chain.readiness(networkId);
  }

  async depositVerificationMode(networkId = ACTIVE_MONEY_NETWORK) {
    return this.chain.depositVerificationMode(networkId);
  }

  async depositPolicy(networkId = ACTIVE_MONEY_NETWORK) {
    return this.chain.depositPolicy(networkId);
  }

  async withdrawalExecutionModel(networkId = ACTIVE_MONEY_NETWORK) {
    return this.chain.withdrawalExecutionModel(networkId);
  }

  async verifyDepositOnChain(txHash: string, networkId = ACTIVE_MONEY_NETWORK) {
    return this.chain.verifyDepositOnChain(txHash, networkId);
  }

  /** H3/P4 — migrate a legacy ENV signer into an encrypted credential. */
  async migrateEnvSigner(networkId: string, actor: string) {
    const r = await this.chain.migrateEnvSigner(networkId || ACTIVE_MONEY_NETWORK, actor);
    await this.audit({ action: "money.credential.migrate_env", networkId, adminId: actor, result: r.migrated ? "migrated" : "skipped", detail: r.reason, credentialId: r.credentialId });
    return r;
  }

  async listNetworks() {
    // Ensure the active network exists, then return all.
    await this.getNetwork(ACTIVE_MONEY_NETWORK);
    const rows = await this.conn.collection(NET_COL).find({}).toArray();
    return { items: rows };
  }

  async updateNetwork(networkId: string, body: any, actor: string, reason?: string) {
    const cur: any = await this.getNetwork(networkId);
    if (body.treasuryAddress && !/^0x[a-fA-F0-9]{40}$/.test(String(body.treasuryAddress))) {
      throw new BadRequestException("Invalid treasury address");
    }
    const editable: any = {};
    ["enabled", "displayName", "chainId", "rpcUrl", "explorerUrl", "confirmationsRequired", "treasuryAddress", "depositFeeMode", "depositFeeValue", "withdrawalFeeMode", "withdrawalFeeValue"].forEach((k) => { if (body[k] !== undefined) editable[k] = body[k]; });
    if (body.token) {
      editable.token = { ...cur.token };
      ["depositEnabled", "withdrawalEnabled", "minDeposit", "minWithdrawal", "withdrawalFee"].forEach((k) => { if (body.token[k] !== undefined) editable.token[k] = body.token[k]; });
    }
    // Snapshot previous version into history (immutable audit of config over time).
    await this.conn.collection(NET_HIST).insertOne({ networkId, version: cur.version, snapshot: { treasuryAddress: cur.treasuryAddress, rpcUrl: cur.rpcUrl, chainId: cur.chainId, token: cur.token, confirmationsRequired: cur.confirmationsRequired }, archivedAt: new Date(), archivedBy: actor });
    const nextVersion = Number(cur.version || 1) + 1;
    await this.conn.collection(NET_COL).updateOne({ networkId }, { $set: { ...editable, version: nextVersion, updatedAt: new Date(), updatedBy: actor } });
    await this.audit({ action: "money.network.update", networkId, adminId: actor, reason: reason || "", before: { treasuryAddress: cur.treasuryAddress, rpcUrl: cur.rpcUrl }, after: { treasuryAddress: editable.treasuryAddress ?? cur.treasuryAddress, rpcUrl: editable.rpcUrl ?? cur.rpcUrl }, version: nextVersion });
    return this.getNetwork(networkId);
  }

  // ---------- Executor credentials (encrypted, masked) ----------
  private credDto(c: any) {
    return { id: String(c._id), label: c.label, networkId: c.networkId, purpose: c.purpose, status: c.status, maskedSecret: this.mask(c.secretLast4), createdAt: c.createdAt, lastTestedAt: c.lastTestedAt || null, lastUsedAt: c.lastUsedAt || null };
  }
  async listCredentials() {
    const rows = await this.conn.collection(CRED_COL).find({ status: { $ne: "REVOKED" } }).sort({ createdAt: -1 }).toArray();
    const revoked = await this.conn.collection(CRED_COL).find({ status: "REVOKED" }).sort({ createdAt: -1 }).limit(20).toArray();
    return { items: [...rows, ...revoked].map((c) => this.credDto(c)) };
  }
  async createCredential(body: any, actor: string) {
    const secret = String(body.secret || "").trim();
    if (!secret) throw new BadRequestException("Secret is required");
    if (!body.label) throw new BadRequestException("Label is required");
    const doc = {
      label: String(body.label), networkId: body.networkId || ACTIVE_MONEY_NETWORK, purpose: body.purpose || "WITHDRAWAL_SIGNER",
      status: "INACTIVE", encryptedSecret: this.encrypt(secret), secretLast4: this.last4(secret),
      createdAt: new Date(), createdBy: actor,
    };
    const r = await this.conn.collection(CRED_COL).insertOne(doc as any);
    await this.audit({ action: "money.credential.create", credentialId: String(r.insertedId), purpose: doc.purpose, adminId: actor });
    return this.credDto({ ...doc, _id: r.insertedId });
  }
  private async cred(id: string) { const c = await this.conn.collection(CRED_COL).findOne({ _id: new Types.ObjectId(id) }); if (!c) throw new NotFoundException("Credential not found"); return c; }
  async testCredential(id: string, actor: string) {
    const c = await this.cred(id);
    // Decrypt only to validate format server-side; NEVER return the secret.
    let ok = false; let detail = "";
    let derivedAddress: string | null = null;
    let ownerOnChain: string | null = null;
    let ownerMatch: boolean | null = null;
    try {
      const [ivB, tagB, dataB] = String(c.encryptedSecret).split(":");
      const decipher = crypto.createDecipheriv(ALGO, this.encKey(), Buffer.from(ivB, "base64"));
      decipher.setAuthTag(Buffer.from(tagB, "base64"));
      const dec = Buffer.concat([decipher.update(Buffer.from(dataB, "base64")), decipher.final()]).toString("utf8");
      ok = /^0x[a-fA-F0-9]{64}$/.test(dec) || dec.length >= 32;
      try { const { ethers } = require("ethers"); derivedAddress = new ethers.Wallet(dec).address; } catch { /* not a raw pk */ }
      detail = ok ? "Secret decrypts and matches expected signer key format" : "Secret decrypts but does not look like a valid signer key";

      // H4 — a CONTRACT_OWNER_SETTLEMENT key MUST derive to the on-chain owner()
      // of the custody contract, otherwise adminResolveUSD would revert. Block
      // activation unless it matches.
      if (c.purpose === "CONTRACT_OWNER_SETTLEMENT") {
        ownerOnChain = await this.chain.contractOwner(c.networkId || ACTIVE_MONEY_NETWORK);
        ownerMatch = !!(derivedAddress && ownerOnChain && derivedAddress.toLowerCase() === String(ownerOnChain).toLowerCase());
        ok = ok && !!derivedAddress && ownerMatch === true;
        detail = ownerMatch
          ? `Signer derives to the contract owner (${derivedAddress}) — valid for fee-free settlement`
          : `Signer address ${derivedAddress || "n/a"} != contract owner ${ownerOnChain || "n/a"} — cannot activate for settlement`;
      }
    } catch { ok = false; detail = "Secret failed to decrypt"; }
    await this.conn.collection(CRED_COL).updateOne({ _id: c._id }, { $set: { lastTestedAt: new Date(), status: ok ? (c.status === "ACTIVE" ? "ACTIVE" : "INACTIVE") : "INVALID" } });
    await this.audit({ action: "money.credential.test", credentialId: id, adminId: actor, result: ok ? "ok" : "invalid" });
    return { ok, detail, derivedAddress, ownerOnChain, ownerMatch };
  }
  async setCredentialStatus(id: string, status: "ACTIVE" | "INACTIVE" | "REVOKED", actor: string) {
    const c = await this.cred(id);
    if (status === "ACTIVE") {
      // Only one active signer per network+purpose.
      await this.conn.collection(CRED_COL).updateMany({ networkId: c.networkId, purpose: c.purpose, _id: { $ne: c._id }, status: "ACTIVE" }, { $set: { status: "INACTIVE" } });
    }
    await this.conn.collection(CRED_COL).updateOne({ _id: c._id }, { $set: { status } });
    await this.audit({ action: `money.credential.${status.toLowerCase()}`, credentialId: id, adminId: actor });
    return this.credDto({ ...c, status });
  }

  // ---------- Deposits operational read-model ----------
  async deposits(limit = 100) {
    const rows = await this.conn.collection("deposits").find({}).sort({ createdAt: -1 }).limit(Math.min(limit, 500)).toArray();
    const uids = [...new Set(rows.map((r: any) => String(r.userId)))].map((id) => { try { return new Types.ObjectId(id); } catch { return null; } }).filter(Boolean) as Types.ObjectId[];
    const users = await this.conn.collection("users").find({ _id: { $in: uids } }).project({ email: 1, wallet: 1 }).toArray();
    const uMap: Record<string, any> = {}; users.forEach((u: any) => (uMap[String(u._id)] = u));
    const credited = await this.conn.collection("money_ledger_entries").find({ type: "DEPOSIT" }).project({ txHash: 1 }).toArray();
    const creditedSet = new Set(credited.map((c: any) => String(c.txHash)));
    return {
      items: rows.map((d: any) => ({
        id: String(d._id), userId: String(d.userId), user: uMap[String(d.userId)] || null,
        network: d.network || "ZKSYNC", token: d.currency || "USDC", amount: d.amount, netAmount: d.netAmount ?? d.amount,
        txHash: d.transactionHash || "", status: d.status, ledgerCredited: creditedSet.has(String(d.transactionHash)),
        createdAt: d.createdAt,
      })),
      total: rows.length,
    };
  }

  // ---------- Events (blockchain event stream, derived) ----------
  async events(limit = 100) {
    const deps = await this.conn.collection("deposits").find({}).sort({ createdAt: -1 }).limit(60).toArray();
    const wds = await this.conn.collection("withdraws").find({ $or: [{ moneyReserved: true }, { moneyStatus: { $exists: true } }] }).sort({ createdAt: -1 }).limit(60).toArray();
    const ev: any[] = [];
    deps.forEach((d: any) => ev.push({ at: d.createdAt, network: d.network || "ZKSYNC", block: d.blockNumber || null, txHash: d.transactionHash || "", type: d.status === "CONFIRMED" ? "DEPOSIT_CONFIRMED" : "DEPOSIT_DETECTED", wallet: d.walletAddress || d.fromAddress || "", amount: d.amount, status: d.status, processed: true }));
    wds.forEach((w: any) => ev.push({ at: w.createdAt, network: w.network || "ZKSYNC", block: null, txHash: w.transactionHash || "", type: w.moneyStatus === "CONFIRMED" ? "WITHDRAWAL_CONFIRMED" : "WITHDRAWAL_SUBMITTED", wallet: w.walletAddress || "", amount: w.amount, status: w.moneyStatus || "REQUESTED", processed: w.moneyStatus === "CONFIRMED", error: w.lastExecutorError || "" }));
    ev.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return { items: ev.slice(0, Math.min(limit, 200)) };
  }

  // ---------- Audit log ----------
  async auditLog(limit = 100) {
    const rows = await this.conn.collection(AUDIT_COL).find({}).sort({ at: -1 }).limit(Math.min(limit, 500)).toArray();
    return { items: rows.map((r: any) => ({ ...r, _id: String(r._id) })) };
  }

  // ---------- Diagnostics (acquiring mode) ----------
  async diagnostics() {
    const base = await this.money.diagnostics();
    const net: any = await this.getNetwork();
    return {
      ...base,
      depositConfirmationMode: "CLIENT_TX_CONFIRM",
      withdrawalMode: net.executor.status === "READY" ? "SERVER_EXECUTOR" : "MANUAL",
      executorStatus: net.executor.status,
      rpcStatus: net.rpcUrl ? "CONFIGURED" : "NOT_CONFIGURED",
      networkVersion: net.version,
    };
  }

  // ---------- Extended reconciliation (treasury decomposition) ----------
  async reconciliation() {
    const ledger = await this.money.reconciliation();
    const settledRevenue = ledger.inputs.settledPurchases; // already realized platform funds
    const pendingWithdrawals = await this.conn.collection("withdraws").aggregate([
      { $match: { moneyReserved: true } }, { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]).toArray();
    const pendingOutflow = Number(pendingWithdrawals[0]?.sum || 0);
    return {
      ...ledger,
      decomposition: {
        userLiabilities: ledger.ledgerLiability,
        realizedPlatformFunds: settledRevenue,
        pendingOutflow,
        note: "Treasury on-chain balance = userLiabilities + realizedPlatformFunds − alreadyWithdrawn. We do NOT require treasury == userLiabilities because settled purchases are already platform revenue.",
      },
    };
  }
}
