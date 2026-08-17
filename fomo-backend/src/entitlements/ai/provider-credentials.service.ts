import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as crypto from "crypto";
import { AiProviderCredential } from "../models/ai-provider-credential.model";
import { AiGlobalSettings } from "../models/ai-provider-price.model";

const ALGO = "aes-256-gcm";
const DEFAULT_BASE: Record<string, string> = {
  OPENAI: "https://api.openai.com/v1",
  EMERGENT: "https://integrations.emergentagent.com/llm",
};

/**
 * ProviderCredentialsService (P51-P55). Full lifecycle for provider API keys:
 * create / rotate / test / activate / deactivate / revoke. Secrets are
 * AES-256-GCM encrypted at rest and never returned. Activating a credential
 * syncs its decrypted secret into ai_global_settings so the existing Gateway
 * keeps working with zero changes (add→test→activate→revoke, no downtime).
 */
@Injectable()
export class ProviderCredentialsService {
  constructor(
    @InjectModel(AiProviderCredential.name) private readonly credModel: Model<any>,
    @InjectModel(AiGlobalSettings.name) private readonly settingsModel: Model<any>,
    @InjectModel("AiUsageEvent") private readonly usageModel: Model<any>,
  ) {}

  private encKey(): Buffer {
    const src = process.env.CREDENTIAL_ENC_KEY || process.env.JWT_SECRET_ACCESS || "fomo-provider-credential-encryption-key";
    return crypto.createHash("sha256").update(String(src)).digest();
  }
  private encrypt(plain: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, this.encKey(), iv);
    const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
  }
  private decrypt(payload: string): string {
    try {
      const [ivB, tagB, dataB] = String(payload).split(":");
      const decipher = crypto.createDecipheriv(ALGO, this.encKey(), Buffer.from(ivB, "base64"));
      decipher.setAuthTag(Buffer.from(tagB, "base64"));
      return Buffer.concat([decipher.update(Buffer.from(dataB, "base64")), decipher.final()]).toString("utf8");
    } catch {
      return "";
    }
  }
  private last4(s: string): string { const t = String(s || ""); return t.length >= 4 ? t.slice(-4) : t; }
  private mask(last4: string): string { return last4 ? `\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022${last4}` : "\u2022\u2022\u2022\u2022"; }

  /** Masked DTO — NEVER includes the secret. */
  private dto(c: any) {
    return {
      id: String(c._id),
      provider: c.provider,
      label: c.label,
      maskedSecret: this.mask(c.secretLast4),
      secretLast4: c.secretLast4,
      baseUrl: c.baseUrl || DEFAULT_BASE[c.provider] || "",
      status: c.status,
      priority: c.priority,
      isDefault: c.isDefault,
      lastTestedAt: c.lastTestedAt,
      lastTestStatus: c.lastTestStatus,
      lastTestLatencyMs: c.lastTestLatencyMs,
      lastUsedAt: c.lastUsedAt,
      revokedAt: c.revokedAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  private envPresence() {
    return {
      OPENAI: Boolean(String(process.env.OPEN_AI_SECRET_KEY || "").trim()),
      EMERGENT: Boolean(String(process.env.EMERGENT_LLM_KEY || "").trim()),
    };
  }

  async list() {
    const rows = await this.credModel.find({ status: { $ne: "REVOKED" } }).sort({ provider: 1, priority: 1, createdAt: -1 }).lean();
    const revoked = await this.credModel.find({ status: "REVOKED" }).sort({ revokedAt: -1 }).limit(20).lean();
    // Attach 30d usage stats per credential (real events only).
    const withStats = await Promise.all([...rows, ...revoked].map(async (c) => ({ ...this.dto(c), stats: await this.credStats(String(c._id)) })));
    const settings = await this.settingsModel.findOne({ key: "default" }).lean();
    const env = this.envPresence();
    const managed = Boolean(settings?.activeCredentialId);
    const providerRuntime = managed ? "READY" : (env.OPENAI || env.EMERGENT) ? "READY_FROM_ENV" : "NOT_CONFIGURED";
    const credentialSource = managed ? "MANAGED" : (env.OPENAI || env.EMERGENT) ? "NOT_MIGRATED" : "NONE";
    return {
      items: withStats,
      activeProvider: settings?.activeProvider || "openai",
      activeCredentialId: settings?.activeCredentialId || null,
      runtime: { providerRuntime, credentialSource, env, canMigrate: !managed && (env.OPENAI || env.EMERGENT) },
    };
  }

  /**
   * One-time, explicit ENV → managed migration. Reads the plaintext key from
   * the environment (never exposed to the UI), stores it encrypted as a managed
   * credential and activates the one matching the current runtime provider.
   * Idempotent: an env key already imported (same last4) is skipped.
   */
  async migrateFromEnv(actor: string) {
    const envMap = [
      { provider: "OPENAI", secret: String(process.env.OPEN_AI_SECRET_KEY || "").trim() },
      { provider: "EMERGENT", secret: String(process.env.EMERGENT_LLM_KEY || "").trim() },
    ];
    const created: any[] = [];
    for (const e of envMap) {
      if (!e.secret) continue;
      const last4 = this.last4(e.secret);
      const exists = await this.credModel.findOne({ provider: e.provider, secretLast4: last4, status: { $ne: "REVOKED" } }).lean();
      if (exists) { created.push({ provider: e.provider, skipped: "already_managed" }); continue; }
      const doc = await this.credModel.create({
        provider: e.provider,
        label: `${e.provider} (импорт из ENV)`,
        encryptedSecret: this.encrypt(e.secret),
        secretLast4: last4,
        baseUrl: DEFAULT_BASE[e.provider] || "",
        status: "INACTIVE",
        priority: 50,
        createdBy: actor,
        updatedBy: actor,
      });
      created.push({ provider: e.provider, id: String(doc._id), imported: true });
    }
    // Activate the credential matching the current runtime provider (if none active yet).
    const settings = await this.settingsModel.findOne({ key: "default" }).lean();
    if (!settings?.activeCredentialId) {
      const target = String(settings?.activeProvider || process.env.AI_PROVIDER || "openai").toUpperCase() === "EMERGENT" ? "EMERGENT" : "OPENAI";
      let cred = await this.credModel.findOne({ provider: target, status: { $ne: "REVOKED" } }).sort({ createdAt: -1 }).lean();
      if (!cred) cred = await this.credModel.findOne({ status: { $ne: "REVOKED" } }).sort({ createdAt: -1 }).lean();
      if (cred) await this.activate(String(cred._id), actor);
    }
    return { ok: true, created, audit: { action: "credential.migrated_from_env", adminId: actor } };
  }

  private async credStats(credentialId: string) {
    const since = new Date(Date.now() - 30 * 86400000);
    const rows = await this.usageModel.aggregate([
      { $match: { credentialId, dataMode: "real", createdAt: { $gte: since } } },
      { $group: { _id: null, requests: { $sum: 1 }, tokens: { $sum: "$totalTokens" }, cogs: { $sum: "$providerCostUsd" }, last: { $max: "$createdAt" } } },
    ]);
    const r = rows[0] || {};
    return { requests30d: r.requests || 0, tokens30d: r.tokens || 0, cogs30dUsd: Math.round((r.cogs || 0) * 1e6) / 1e6, lastUsedAt: r.last || null };
  }

  async create(body: any, actor: string) {
    const provider = String(body.provider || "").toUpperCase();
    if (!["OPENAI", "EMERGENT"].includes(provider)) throw new BadRequestException("Unknown provider");
    const secret = String(body.secret || "").trim();
    if (!secret) throw new BadRequestException("Secret is required");
    const doc = await this.credModel.create({
      provider,
      label: String(body.label || `${provider} key`).trim(),
      encryptedSecret: this.encrypt(secret),
      secretLast4: this.last4(secret),
      baseUrl: String(body.baseUrl || DEFAULT_BASE[provider] || "").trim(),
      status: "INACTIVE",
      priority: Number(body.priority) || 100,
      createdBy: actor,
      updatedBy: actor,
    });
    return { ok: true, credential: this.dto(doc.toObject()), audit: { action: "credential.created", credentialId: String(doc._id), provider, adminId: actor } };
  }

  async patch(id: string, body: any, actor: string) {
    const c: any = await this.credModel.findById(id);
    if (!c || c.status === "REVOKED") throw new NotFoundException("Credential not found");
    const set: any = { updatedBy: actor };
    if (typeof body.label === "string") set.label = body.label.trim();
    if (typeof body.baseUrl === "string") set.baseUrl = body.baseUrl.trim();
    if (body.priority !== undefined) set.priority = Number(body.priority) || c.priority;
    let rotated = false;
    // Rotation: only overwrite secret when a fresh (non-masked) value is supplied.
    const secret = typeof body.secret === "string" ? body.secret.trim() : "";
    if (secret && !secret.includes("\u2022")) {
      set.encryptedSecret = this.encrypt(secret);
      set.secretLast4 = this.last4(secret);
      set.status = "INACTIVE"; // require re-test/re-activate after rotation
      rotated = true;
    }
    await this.credModel.updateOne({ _id: id }, { $set: set });
    // If this credential currently feeds runtime, re-sync the new secret.
    const settings = await this.settingsModel.findOne({ key: "default" }).lean();
    if (rotated && String(settings?.activeCredentialId) === String(id)) {
      const fresh = await this.credModel.findById(id).lean();
      await this.syncActiveToSettings(fresh, actor);
    }
    const out = await this.credModel.findById(id).lean();
    return { ok: true, rotated, credential: this.dto(out), audit: { action: rotated ? "credential.rotated" : "credential.updated", credentialId: id, provider: c.provider, adminId: actor } };
  }

  async remove(id: string, actor: string) {
    const c: any = await this.credModel.findById(id);
    if (!c) throw new NotFoundException("Credential not found");
    const used = await this.usageModel.countDocuments({ credentialId: id });
    const settings = await this.settingsModel.findOne({ key: "default" }).lean();
    const isActive = String(settings?.activeCredentialId) === String(id);
    if (isActive) throw new BadRequestException("Cannot delete the active credential. Activate another key first.");
    if (used === 0) {
      // Never used → safe hard delete.
      await this.credModel.deleteOne({ _id: id });
      return { ok: true, hardDeleted: true, audit: { action: "credential.deleted", credentialId: id, provider: c.provider, adminId: actor } };
    }
    // Otherwise soft-revoke so historical usage stays attributable.
    await this.credModel.updateOne({ _id: id }, { $set: { status: "REVOKED", revokedAt: new Date(), revokedBy: actor } });
    return { ok: true, revoked: true, audit: { action: "credential.revoked", credentialId: id, provider: c.provider, adminId: actor } };
  }

  /** Live probe of a SPECIFIC credential WITHOUT activating it (SYSTEM, no user billing). */
  async test(id: string) {
    const c: any = await this.credModel.findById(id).lean();
    if (!c || c.status === "REVOKED") throw new NotFoundException("Credential not found");
    const secret = this.decrypt(c.encryptedSecret);
    const base = (c.baseUrl || DEFAULT_BASE[c.provider] || "").replace(/\/$/, "");
    const started = Date.now();
    let status = "FAILED"; let credStatus = "INVALID"; let httpStatus: number | null = null; let message = "";
    try {
      // Minimal chat-completion probe (works for OpenAI + OpenAI-compatible proxies
      // like Emergent). SYSTEM context, tiny output, never billed to a user.
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4.1-mini", messages: [{ role: "user", content: "ping" }], max_tokens: 1 }),
      } as any);
      httpStatus = res.status;
      if (res.ok) { status = "SUCCESS"; credStatus = "ACTIVE"; message = "OK"; }
      else if (res.status === 429) { credStatus = "PROVIDER_BALANCE_EMPTY"; message = "Provider account has no credits (429)."; }
      else if (res.status === 401 || res.status === 403) { credStatus = "INVALID"; message = "Invalid API key."; }
      else { credStatus = "INVALID"; message = `HTTP ${res.status}`; }
    } catch (e: any) {
      credStatus = "INVALID"; message = "Unreachable: " + String(e?.message || e).slice(0, 120);
    }
    const latencyMs = Date.now() - started;
    // Keep credential status coherent, but do not downgrade an ACTIVE runtime key on a transient probe.
    const set: any = { lastTestedAt: new Date(), lastTestStatus: status, lastTestLatencyMs: latencyMs };
    if (c.status !== "ACTIVE") set.status = credStatus;
    else if (credStatus === "PROVIDER_BALANCE_EMPTY") set.status = "PROVIDER_BALANCE_EMPTY";
    await this.credModel.updateOne({ _id: id }, { $set: set });
    return { ok: status === "SUCCESS", status, credentialStatus: credStatus, httpStatus, latencyMs, message };
  }

  /** Write the decrypted secret + provider into runtime settings (Gateway source). */
  private async syncActiveToSettings(c: any, actor: string) {
    const secret = this.decrypt(c.encryptedSecret);
    const provider = c.provider === "OPENAI" ? "openai" : "emergent";
    const set: any = { activeProvider: provider, activeCredentialId: String(c._id), updatedBy: actor };
    if (c.provider === "OPENAI") { set.openAiApiKey = secret; if (c.baseUrl) set.openAiBaseUrl = c.baseUrl; }
    else { set.emergentLlmKey = secret; if (c.baseUrl) set.emergentBaseUrl = c.baseUrl; }
    await this.settingsModel.updateOne({ key: "default" }, { $set: set }, { upsert: true });
  }

  async activate(id: string, actor: string) {
    const c: any = await this.credModel.findById(id).lean();
    if (!c || c.status === "REVOKED") throw new NotFoundException("Credential not found");
    // Mark all other creds of same provider INACTIVE, this one ACTIVE + default.
    await this.credModel.updateMany({ provider: c.provider, _id: { $ne: id }, status: { $ne: "REVOKED" } }, { $set: { isDefault: false, status: "INACTIVE" } });
    await this.credModel.updateOne({ _id: id }, { $set: { status: "ACTIVE", isDefault: true, updatedBy: actor } });
    await this.syncActiveToSettings(c, actor);
    return { ok: true, audit: { action: "credential.activated", credentialId: id, provider: c.provider, adminId: actor } };
  }

  async deactivate(id: string, actor: string) {
    const c: any = await this.credModel.findById(id).lean();
    if (!c) throw new NotFoundException("Credential not found");
    await this.credModel.updateOne({ _id: id }, { $set: { status: "INACTIVE", isDefault: false, updatedBy: actor } });
    // If it was serving runtime, clear the runtime secret so it can't be used.
    const settings = await this.settingsModel.findOne({ key: "default" }).lean();
    if (String(settings?.activeCredentialId) === String(id)) {
      const clear: any = { activeCredentialId: "", updatedBy: actor };
      if (c.provider === "OPENAI") clear.openAiApiKey = "";
      else clear.emergentLlmKey = "";
      await this.settingsModel.updateOne({ key: "default" }, { $set: clear });
    }
    return { ok: true, audit: { action: "credential.deactivated", credentialId: id, provider: c.provider, adminId: actor } };
  }
}
