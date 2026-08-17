import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { randomBytes } from "crypto";
import { UserInvite, UserInviteDocument } from "./models/user-invite.model";
import { EmailSettings, EmailSettingsDocument } from "./models/email-settings.model";

@Injectable()
export class UsermgmtService {
  constructor(
    @InjectModel(UserInvite.name) private inviteModel: Model<UserInviteDocument>,
    @InjectModel(EmailSettings.name) private emailModel: Model<EmailSettingsDocument>,
    @InjectModel("User") private userModel: Model<any>
  ) {}

  private maskKey(key?: string): string {
    if (!key) return "";
    const last4 = key.slice(-4);
    return `\u2022\u2022\u2022\u2022${last4}`;
  }

  async getEmailSettings() {
    const doc = await this.emailModel.findOne().lean();
    const configured = !!doc?.apiKey;
    return {
      provider: doc?.provider || "resend",
      apiKeyMasked: this.maskKey(doc?.apiKey),
      hasApiKey: configured,
      fromEmail: doc?.fromEmail || "",
      fromName: doc?.fromName || "",
      replyTo: doc?.replyTo || "",
      status: configured ? "configured" : "not_configured",
    };
  }

  async updateEmailSettings(body: any) {
    const update: any = {
      provider: body?.provider || "resend",
      fromEmail: (body?.fromEmail || "").trim(),
      fromName: (body?.fromName || "").trim(),
      replyTo: (body?.replyTo || "").trim(),
    };
    // Only overwrite the key if a new non-masked value was provided.
    if (typeof body?.apiKey === "string" && body.apiKey.trim() && !body.apiKey.includes("\u2022")) {
      update.apiKey = body.apiKey.trim();
    }
    update.status = (update.apiKey || (await this.emailModel.findOne())?.apiKey) ? "configured" : "not_configured";
    await this.emailModel.updateOne({}, { $set: update }, { upsert: true });
    return this.getEmailSettings();
  }

  async testEmail() {
    const doc = await this.emailModel.findOne().lean();
    if (!doc?.apiKey) {
      return { status: "not_connected", message: "Resend API key is not configured" };
    }
    // Integration-ready stub: real send is intentionally disabled (no live keys).
    return { status: "not_connected", message: "Provider configured. Live sending is disabled in this environment (stub)." };
  }

  async listInvites() {
    return this.inviteModel.find().sort({ createdAt: -1 }).limit(200).lean();
  }

  async createInvite(body: any, adminId: string) {
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email) return { success: false, error: "email_required" };
    const settings = await this.emailModel.findOne().lean();
    const configured = !!settings?.apiKey;
    // Never fake a successful send. Configured => queued (pending); otherwise not_sent.
    const status = configured ? "pending" : "not_sent";
    const token = randomBytes(16).toString("hex");
    const invite = await this.inviteModel.create({
      email,
      userId: body?.userId || null,
      invitedBy: adminId,
      reason: body?.reason || "",
      status,
      token,
      note: configured ? "Queued (stub — live send disabled)" : "Resend not configured",
    });
    return { success: true, invite };
  }

  async resendInvite(id: string) {
    const settings = await this.emailModel.findOne().lean();
    const configured = !!settings?.apiKey;
    const status = configured ? "pending" : "not_sent";
    await this.inviteModel.updateOne({ _id: id }, { $set: { status, note: configured ? "Re-queued (stub)" : "Resend not configured" } });
    return { success: true, status };
  }

  /** Append an audit record to the existing user_action_logs collection (no new store). */
  async get2FAStatus(userId: string) {
    let u: any = null;
    try { u = await this.userModel.findById(userId).select("is2FAEnabled twoFactorSecret").lean(); } catch (_) {}
    const enabled = !!u?.is2FAEnabled;
    const pending = !enabled && !!u?.twoFactorSecret;
    return { state: enabled ? "enabled" : pending ? "setup_pending" : "disabled", is2FAEnabled: enabled };
  }

  private async writeAudit(userId: string, adminId: string, action: string, title: string, metadata: any = {}) {
    try {
      const db = this.userModel.db;
      const oid = (() => { try { return new Types.ObjectId(userId); } catch { return userId; } })();
      await db.collection("user_action_logs").insertOne({
        userId: oid,
        actorId: adminId || null,
        actorType: "admin",
        category: "moderation",
        action,
        severity: action.includes("delete") || action.includes("suspend") ? "warning" : "info",
        title,
        description: metadata?.reason || "",
        entityType: "",
        entityId: "",
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (_) { /* audit best-effort */ }
  }

  async muteUser(id: string, body: any, adminId = "") {
    const days = Math.max(0, Number(body?.days || 0));
    const until = days > 0 ? new Date(Date.now() + days * 86400000) : null;
    await this.userModel.updateOne(
      { _id: id },
      { $set: { mutedUntil: until, muteReason: String(body?.reason || ""), accountState: "muted" } }
    );
    await this.writeAudit(id, adminId, "moderation.mute", "Пользователь заглушён (mute)", { reason: body?.reason || "", days, until });
    return { success: true, mutedUntil: until, accountState: "muted" };
  }

  async unmuteUser(id: string, adminId = "") {
    await this.userModel.updateOne(
      { _id: id },
      { $set: { mutedUntil: null, muteReason: "", accountState: "active" } }
    );
    await this.writeAudit(id, adminId, "moderation.unmute", "Mute снят", {});
    return { success: true, accountState: "active" };
  }

  async suspendUser(id: string, body: any, adminId = "") {
    const days = Math.max(0, Number(body?.days || 0));
    const until = days > 0 ? new Date(Date.now() + days * 86400000) : null;
    await this.userModel.updateOne(
      { _id: id },
      { $set: { suspendedUntil: until, suspendReason: String(body?.reason || ""), accountState: "suspended", banned: true } }
    );
    await this.writeAudit(id, adminId, "moderation.suspend", "Пользователь заблокирован (suspend)", { reason: body?.reason || "", days, until });
    return { success: true, suspendedUntil: until, accountState: "suspended" };
  }

  async unsuspendUser(id: string, adminId = "") {
    await this.userModel.updateOne(
      { _id: id },
      { $set: { suspendedUntil: null, suspendReason: "", accountState: "active", banned: false } }
    );
    await this.writeAudit(id, adminId, "moderation.unsuspend", "Блокировка снята", {});
    return { success: true, accountState: "active" };
  }

  /**
   * SOFT delete — canonical lifecycle terminal state. Preserves the user record,
   * XP ledger, trades, badges, referrals and analytics. NEVER drops the document.
   */
  async softDeleteUser(id: string, body: any, adminId = "") {
    await this.userModel.updateOne(
      { _id: id },
      { $set: { accountState: "deleted", deletedAt: new Date(), deleteReason: String(body?.reason || ""), banned: true } }
    );
    await this.writeAudit(id, adminId, "moderation.soft_delete", "Пользователь удалён (soft-delete)", { reason: body?.reason || "" });
    return { success: true, accountState: "deleted" };
  }

  async restoreUser(id: string, adminId = "") {
    await this.userModel.updateOne(
      { _id: id },
      { $set: { accountState: "active", deletedAt: null, deleteReason: "", banned: false } }
    );
    await this.writeAudit(id, adminId, "moderation.restore", "Пользователь восстановлен", {});
    return { success: true, accountState: "active" };
  }

  private deriveState(u: any): string {
    if (u.accountState) return u.accountState;
    if (u.banned) return "suspended";
    if (u.mutedUntil) return "muted";
    return "active";
  }

  /**
   * Canonical master-list read-model for the Users page & Statistics drill-down.
   * Reads user doc fields (no fabricated data) + light aggregations for badges &
   * activity over the current page's ids only.
   */
  async getMasterList(query: any) {
    const page = Math.max(1, Number(query?.page || 1));
    const limit = Math.min(100, Math.max(5, Number(query?.limit || 25)));
    const search = String(query?.search || "").trim();
    const status = String(query?.status || "all");
    const verified = String(query?.verified || "");
    const sortBy = String(query?.sortBy || "createdAt");
    const sortDir = String(query?.sortDir || "desc") === "asc" ? 1 : -1;

    const filter: any = {};
    if (status === "deleted") filter.accountState = "deleted";
    else if (status === "suspended") filter.$or = [{ accountState: "suspended" }, { banned: true }];
    else if (status === "muted") filter.accountState = "muted";
    else if (status === "active") { filter.accountState = { $nin: ["deleted", "suspended"] }; filter.banned = { $ne: true }; }
    else filter.accountState = { $ne: "deleted" }; // "all" excludes soft-deleted by default
    if (verified === "1") filter.verificationStatus = true;
    if (verified === "0") filter.verificationStatus = { $ne: true };

    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const or: any[] = [{ name: rx }, { username: rx }, { email: rx }, { wallet: rx }];
      if (!Number.isNaN(Number(search))) or.push({ fomoId: Number(search) });
      filter.$and = [{ $or: or }];
    }

    const sortMap: Record<string, string> = {
      createdAt: "createdAt", lastLogin: "lastLogin", xp: "activityXP",
      fomo: "fomoScore", name: "name", deals: "numberOfDeals",
    };
    const sortField = sortMap[sortBy] || "createdAt";

    const total = await this.userModel.countDocuments(filter);
    const users = await this.userModel
      .find(filter)
      .select("name username email wallet fomoId photo accountState banned mutedUntil verificationStatus createdAt createDate lastLogin activityXP fomoScore rank staking numberOfDeals nfts nftsValue refLvlOne refLvlTwo partners spaceportClaimedBadges spaceportClaimedRewards")
      .sort({ [sortField]: sortDir })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const ids = users.map((u: any) => String(u._id));
    const db = this.userModel.db;
    const badgeMap = new Map<string, number>();
    const sessMap = new Map<string, number>();
    try {
      const bAgg = await db.collection("user_badges").aggregate([
        { $match: { status: "earned", userId: { $in: ids } } },
        { $group: { _id: "$userId", c: { $sum: 1 } } },
      ]).toArray();
      bAgg.forEach((r: any) => badgeMap.set(String(r._id), r.c));
    } catch (_) {}
    try {
      const sAgg = await db.collection("user_sessions").aggregate([
        { $match: { userId: { $in: ids } } },
        { $group: { _id: "$userId", c: { $sum: 1 } } },
      ]).toArray();
      sAgg.forEach((r: any) => sessMap.set(String(r._id), r.c));
    } catch (_) {}

    const rows = users.map((u: any) => ({
      id: String(u._id),
      name: u.name || u.username || "",
      username: u.username || "",
      email: u.email || "",
      wallet: u.wallet || "",
      fomoId: u.fomoId ?? null,
      photo: u.photo || "",
      status: this.deriveState(u),
      verified: !!u.verificationStatus,
      fomoScore: Number(u.fomoScore || 0),
      activityXP: Number(u.activityXP || 0),
      rank: u.rank || null,
      spaceportBadges: Array.isArray(u.spaceportClaimedBadges) ? u.spaceportClaimedBadges.length : 0,
      spaceportRewards: Array.isArray(u.spaceportClaimedRewards) ? u.spaceportClaimedRewards.length : 0,
      badges: badgeMap.get(String(u._id)) || 0,
      sessions: sessMap.get(String(u._id)) || 0,
      deals: Number(u.numberOfDeals || 0),
      nftCount: Array.isArray(u.nfts) ? u.nfts.length : 0,
      nftValue: Number(u.nftsValue || 0),
      referrals: Array.isArray(u.refLvlOne) ? u.refLvlOne.length : 0,
      createdAt: u.createdAt || u.createDate || null,
      lastLogin: u.lastLogin || null,
    }));

    return { rows, total, page, limit, hasMore: page * limit < total };
  }

  /**
   * Unified User Timeline — a read-model over EXISTING sources (no new event store).
   * Aggregates registration + XP ledger + badge audit + moderation/admin logs.
   * Missing sources simply contribute nothing (never faked).
   */
  async getTimeline(id: string, type?: string) {
    const db = this.userModel.db;
    const events: any[] = [];
    const oid = (() => { try { return new Types.ObjectId(id); } catch { return null; } })();

    // registration
    try {
      const u: any = await this.userModel.findById(id).select("createdAt name userName").lean();
      if (u?.createdAt) events.push({ timestamp: u.createdAt, type: "registration", source: "users", description: "Пользователь зарегистрирован", metadata: {} });
    } catch (_) {}

    // XP ledger
    try {
      const rows = await db.collection("xp_transactions").find({ userId: id }).sort({ occurredAt: -1 }).limit(80).toArray();
      for (const r of rows) events.push({
        timestamp: r.occurredAt || r.createdAt, type: "xp", source: "xp_transactions",
        description: `XP ${r.finalXp >= 0 ? "+" : ""}${r.finalXp} · ${r.eventType || r.reason || ""}`.trim(),
        relatedEntity: r.sourceId || null, metadata: { eventType: r.eventType, status: r.status, source: r.source },
      });
    } catch (_) {}

    // Badge audit
    try {
      const rows = await db.collection("badge_audit_logs").find({ userId: id }).sort({ createdAt: -1 }).limit(60).toArray();
      for (const r of rows) events.push({
        timestamp: r.createdAt, type: "badge", source: "badge_audit_logs",
        description: `Бейдж ${r.action || ""}: ${r.badgeCode || ""}${r.reason ? " — " + r.reason : ""}`,
        relatedEntity: r.badgeCode || null, metadata: { action: r.action, issuedBy: r.issuedBy },
      });
    } catch (_) {}

    // Moderation / admin actions
    try {
      const q = oid ? { $or: [{ userId: oid }, { userId: id }] } : { userId: id };
      const rows = await db.collection("user_action_logs").find(q as any).sort({ createdAt: -1 }).limit(60).toArray();
      for (const r of rows) events.push({
        timestamp: r.createdAt, type: "moderation", source: "user_action_logs",
        description: r.title || `${r.category || ""} / ${r.action || ""}`, relatedEntity: r.entityId || null,
        metadata: { category: r.category, action: r.action, severity: r.severity, actorType: r.actorType },
      });
    } catch (_) {}

    let all = events.filter((e) => e.timestamp).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (type && type !== "all") all = all.filter((e) => e.type === type);
    return { total: all.length, events: all.slice(0, 150) };
  }
}
