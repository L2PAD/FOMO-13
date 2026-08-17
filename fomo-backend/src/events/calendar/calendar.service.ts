// EPIC CAL-1 · Canonical Calendar Service (single read/write model over existing `events` collection)
import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import mongoose from "mongoose";
import { Event, EventDocument } from "../models/event.model";
import { CALENDAR_EVENT_TYPES, findEventType } from "./event-type-registry";

const LIFECYCLE = ["DRAFT", "SCHEDULED", "PUBLISHED", "COMPLETED", "CANCELLED", "ARCHIVED"];
const TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SCHEDULED", "PUBLISHED", "CANCELLED", "ARCHIVED"],
  SCHEDULED: ["PUBLISHED", "DRAFT", "CANCELLED", "ARCHIVED"],
  PUBLISHED: ["COMPLETED", "CANCELLED", "ARCHIVED", "DRAFT"],
  COMPLETED: ["ARCHIVED", "PUBLISHED"],
  CANCELLED: ["DRAFT", "ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};

@Injectable()
export class CalendarService {
  constructor(@InjectModel(Event.name) private readonly eventModel: Model<EventDocument>) {}

  private oid(v?: string) {
    return v && mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : undefined;
  }

  // ── mapping ──────────────────────────────────────────────────────────
  private toAdminDto(e: any) {
    if (!e) return e;
    const t = findEventType(e.eventType);
    return {
      id: String(e._id),
      title: e.name,
      shortDescription: e.shortDescription,
      description: e.description,
      eventType: e.eventType,
      category: e.category || t?.category,
      sourceType: e.sourceType,
      sourceId: e.sourceId,
      entityType: e.entityType,
      entityId: e.entityId,
      relatedArticleId: e.relatedArticleId,
      visibility: e.visibility || "PUBLIC",
      lifecycleStatus: e.lifecycleStatus || (e.isPrivate ? "PUBLISHED" : "DRAFT"),
      startAt: e.date,
      endAt: e.endDate,
      allDay: !!e.allDay,
      timezone: e.timezone || "UTC",
      priority: e.priority || 0,
      image: e.image,
      icon: e.icon || t?.icon,
      colorKey: e.colorKey || t?.colorKey,
      ctaLabel: e.ctaLabel,
      ctaUrl: e.ctaUrl,
      tags: e.tags || [],
      projectId: e.projectId,
      projectName: e.projectName,
      tokenSymbol: e.tokenSymbol,
      unlockAmount: e.unlockAmount,
      unlockValueUsd: e.unlockValueUsd,
      unlockPercent: e.unlockPercent,
      sourceName: e.sourceName,
      sourceUrl: e.sourceUrl,
      sourcePublishedAt: e.sourcePublishedAt,
      generatedBy: e.generatedBy || "MANUAL",
      reviewStatus: e.reviewStatus || "UNREVIEWED",
      externalEventId: e.externalEventId,
      publishAt: e.publishAt,
      publishedAt: e.publishedAt,
      isPrivate: !!e.isPrivate,
      userId: e.userId,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  private toPublicDto(e: any) {
    const a = this.toAdminDto(e);
    // strip admin/provenance fields not needed publicly (P19)
    const {
      generatedBy, reviewStatus, externalEventId, sourceName, confidence,
      isPrivate, userId, createdBy, updatedBy, ...pub
    } = a as any;
    return pub;
  }

  private applyBodyToDoc(body: any, doc: any) {
    const map: Record<string, string> = { title: "name", startAt: "date", endAt: "endDate" };
    const passthrough = [
      "shortDescription", "description", "eventType", "category", "sourceType", "sourceId",
      "entityType", "entityId", "visibility", "allDay", "timezone", "priority", "image", "icon",
      "colorKey", "ctaLabel", "ctaUrl", "tags", "projectId", "projectName", "tokenSymbol",
      "unlockAmount", "unlockValueUsd", "unlockPercent", "sourceName", "sourceUrl",
      "sourcePublishedAt", "generatedBy", "reviewStatus", "externalEventId", "publishAt",
      "confidence", "generationRunId", "relatedArticleId",
    ];
    Object.keys(map).forEach((k) => { if (body[k] !== undefined) doc[map[k]] = body[k]; });
    passthrough.forEach((k) => { if (body[k] !== undefined) doc[k] = body[k]; });
    // required legacy fields defaults
    if (!doc.page) doc.page = "calendar";
    if (!doc.endDate) doc.endDate = doc.date;
    if (!doc.status) doc.status = "admin";
    return doc;
  }

  // ── P18 admin CRUD ───────────────────────────────────────────────────
  async adminList(q: any) {
    const filter: any = {};
    if (q.status) filter.lifecycleStatus = q.status;
    if (q.eventType) filter.eventType = q.eventType;
    if (q.category) filter.category = q.category;
    if (q.sourceType) filter.sourceType = q.sourceType;
    if (q.visibility) filter.visibility = q.visibility;
    if (q.entityId) filter.entityId = q.entityId;
    if (q.search) filter.name = { $regex: String(q.search), $options: "i" };
    if (q.from || q.to) {
      filter.date = {};
      if (q.from) filter.date.$gte = new Date(q.from);
      if (q.to) filter.date.$lte = new Date(q.to);
    }
    const page = Math.max(1, Number(q.page || 1));
    const limit = Math.min(200, Number(q.limit || 50));
    const [items, total] = await Promise.all([
      this.eventModel.find(filter).sort({ date: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.eventModel.countDocuments(filter),
    ]);
    return { items: items.map((e) => this.toAdminDto(e)), total, page, limit };
  }

  async adminGet(id: string) {
    const e = await this.eventModel.findById(id).lean();
    if (!e) throw new NotFoundException("Event not found");
    return this.toAdminDto(e);
  }

  async create(body: any, actorId?: string) {
    if (!body.title) throw new BadRequestException("title is required");
    if (!body.startAt) throw new BadRequestException("startAt is required");
    const doc: any = this.applyBodyToDoc(body, {});
    const t = findEventType(body.eventType);
    doc.visibility = body.visibility || t?.defaultVisibility || "PUBLIC";
    doc.lifecycleStatus = body.lifecycleStatus && LIFECYCLE.includes(body.lifecycleStatus) ? body.lifecycleStatus : "DRAFT";
    if (doc.lifecycleStatus === "PUBLISHED") doc.publishedAt = new Date();
    doc.isPrivate = doc.visibility === "PRIVATE";
    if (actorId) doc.createdBy = this.oid(actorId);
    const created = await this.eventModel.create(doc);
    return this.toAdminDto(created.toObject());
  }

  async patch(id: string, body: any, actorId?: string) {
    const doc = await this.eventModel.findById(id);
    if (!doc) throw new NotFoundException("Event not found");
    this.applyBodyToDoc(body, doc);
    if (body.visibility) doc.isPrivate = body.visibility === "PRIVATE";
    if (body.lifecycleStatus && LIFECYCLE.includes(body.lifecycleStatus)) doc.lifecycleStatus = body.lifecycleStatus;
    if (actorId) doc.updatedBy = this.oid(actorId);
    await doc.save();
    return this.toAdminDto(doc.toObject());
  }

  async remove(id: string) {
    const r = await this.eventModel.findByIdAndDelete(id);
    if (!r) throw new NotFoundException("Event not found");
    return { success: true };
  }

  private async transition(id: string, to: string, actorId?: string, extra: any = {}) {
    const doc = await this.eventModel.findById(id);
    if (!doc) throw new NotFoundException("Event not found");
    const from = (doc as any).lifecycleStatus || "DRAFT";
    if (from !== to && !(TRANSITIONS[from] || []).includes(to)) {
      throw new BadRequestException(`Illegal transition ${from} → ${to}`);
    }
    (doc as any).lifecycleStatus = to;
    Object.assign(doc as any, extra);
    if (actorId) (doc as any).updatedBy = this.oid(actorId);
    await doc.save();
    return this.toAdminDto(doc.toObject());
  }

  publish(id: string, actorId?: string) {
    return this.transition(id, "PUBLISHED", actorId, { publishedAt: new Date(), isPrivate: false });
  }
  unpublish(id: string, actorId?: string) {
    return this.transition(id, "DRAFT", actorId, { publishedAt: undefined });
  }
  cancel(id: string, actorId?: string) {
    return this.transition(id, "CANCELLED", actorId);
  }
  async duplicate(id: string, actorId?: string) {
    const src = await this.eventModel.findById(id).lean();
    if (!src) throw new NotFoundException("Event not found");
    const copy: any = { ...src };
    delete copy._id; delete copy.createdAt; delete copy.updatedAt;
    delete copy.externalEventId; delete copy.publishedAt;
    copy.name = `${copy.name} (копия)`;
    copy.lifecycleStatus = "DRAFT";
    if (actorId) copy.createdBy = this.oid(actorId);
    const created = await this.eventModel.create(copy);
    return this.toAdminDto(created.toObject());
  }

  // ── P19 public read (visibility + lifecycle + publishAt) ─────────────
  async publicList(q: any, authed = false) {
    const now = new Date();
    const vis = authed ? ["PUBLIC", "AUTHENTICATED"] : ["PUBLIC"];
    const filter: any = {
      lifecycleStatus: "PUBLISHED",
      dataMode: { $ne: "demo" },
      $and: [
        { $or: [{ visibility: { $in: vis } }, { visibility: { $exists: false } }] },
        { $or: [{ publishAt: { $lte: now } }, { publishAt: { $exists: false } }, { publishAt: null }] },
      ],
    };
    if (q.eventType) filter.eventType = q.eventType;
    if (q.category) filter.category = q.category;
    if (q.sourceType) filter.sourceType = q.sourceType;
    if (q.entityId) filter.entityId = q.entityId;
    if (q.search) filter.name = { $regex: String(q.search), $options: "i" };
    if (q.from || q.to) {
      filter.date = {};
      if (q.from) filter.date.$gte = new Date(q.from);
      if (q.to) filter.date.$lte = new Date(q.to);
    }
    const items = await this.eventModel.find(filter).sort({ date: 1 }).limit(500).lean();
    return { items: items.map((e) => this.toPublicDto(e)) };
  }

  async publicGet(id: string) {
    const e = await this.eventModel.findById(id).lean();
    if (!e || (e as any).lifecycleStatus !== "PUBLISHED") throw new NotFoundException("Event not found");
    return this.toPublicDto(e);
  }

  // P6 — digest read-model (aggregation only, no new collection)
  async digest(period: "week" | "month", authed = false) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const to = new Date(start.getTime() + (period === "month" ? 30 : 7) * 864e5);
    const vis = authed ? ["PUBLIC", "AUTHENTICATED"] : ["PUBLIC"];
    const items = await this.eventModel.find({
      lifecycleStatus: "PUBLISHED",
      dataMode: { $ne: "demo" },
      date: { $gte: start, $lte: to },
      $and: [
        { $or: [{ visibility: { $in: vis } }, { visibility: { $exists: false } }] },
        { $or: [{ publishAt: { $lte: now } }, { publishAt: { $exists: false } }, { publishAt: null }] },
      ],
    }).sort({ date: 1 }).lean();

    const dto = items.map((e) => this.toPublicDto(e));
    const tomorrow = new Date(start.getTime() + 864e5);
    const weekEnd = new Date(start.getTime() + 7 * 864e5);
    const groups: Record<string, any[]> = { Today: [], Tomorrow: [], "This week": [], Later: [] };
    const byType: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    for (const e of dto) {
      const d = new Date(e.startAt);
      if (d < tomorrow) groups.Today.push(e);
      else if (d < new Date(tomorrow.getTime() + 864e5)) groups.Tomorrow.push(e);
      else if (d < weekEnd) groups["This week"].push(e);
      else groups.Later.push(e);
      const t = e.eventType || "CUSTOM"; byType[t] = (byType[t] || 0) + 1;
      const s = e.sourceType || "PLATFORM"; bySource[s] = (bySource[s] || 0) + 1;
    }
    return { period, from: start, to, totalEvents: dto.length, groups, byType, bySource, events: dto };
  }

  // ── registry (P4) ────────────────────────────────────────────────────
  types() {
    return { items: CALENDAR_EVENT_TYPES };
  }

  // ── adapters (P11/P12 EarlyLand, Unlocks) — idempotent upsert ────────
  async upsertFromSource(payload: {
    sourceType: string;
    sourceId: string;
    externalEventId?: string;
    eventType: string;
    title: string;
    startAt: Date;
    endAt?: Date;
    extra?: any;
    publish?: boolean;
  }) {
    const key = payload.externalEventId
      ? { externalEventId: payload.externalEventId }
      : { sourceType: payload.sourceType, sourceId: payload.sourceId, eventType: payload.eventType };
    const t = findEventType(payload.eventType);
    const set: any = {
      name: payload.title,
      date: payload.startAt,
      endDate: payload.endAt || payload.startAt,
      page: "calendar",
      status: "admin",
      sourceType: payload.sourceType,
      sourceId: payload.sourceId,
      eventType: payload.eventType,
      category: t?.category,
      icon: t?.icon,
      colorKey: t?.colorKey,
      visibility: "PUBLIC",
      ...(payload.externalEventId ? { externalEventId: payload.externalEventId } : {}),
      ...(payload.extra || {}),
    };
    if (payload.publish) { set.lifecycleStatus = "PUBLISHED"; set.publishedAt = new Date(); }
    const res = await this.eventModel.findOneAndUpdate(
      key,
      { $set: set, $setOnInsert: { lifecycleStatus: payload.publish ? "PUBLISHED" : "SCHEDULED", generatedBy: "IMPORT" } },
      { new: true, upsert: true },
    ).lean();
    return this.toAdminDto(res);
  }

  async cancelBySource(sourceType: string, sourceId: string) {
    await this.eventModel.updateMany(
      { sourceType, sourceId },
      { $set: { lifecycleStatus: "CANCELLED" } },
    );
    return { success: true };
  }

  // ── diagnostics (P37) ────────────────────────────────────────────────
  async diagnostics() {
    const now = new Date();
    const [total, published, drafts, scheduled, upcoming7d, orphans, invalidDate] = await Promise.all([
      this.eventModel.countDocuments({}),
      this.eventModel.countDocuments({ lifecycleStatus: "PUBLISHED" }),
      this.eventModel.countDocuments({ lifecycleStatus: "DRAFT" }),
      this.eventModel.countDocuments({ lifecycleStatus: "SCHEDULED" }),
      this.eventModel.countDocuments({ lifecycleStatus: "PUBLISHED", date: { $gte: now, $lte: new Date(now.getTime() + 7 * 864e5) } }),
      this.eventModel.countDocuments({ sourceType: { $exists: true }, sourceId: { $in: [null, ""] } }),
      this.eventModel.countDocuments({ date: null }),
    ]);
    // duplicate externalEventId
    const dups = await this.eventModel.aggregate([
      { $match: { externalEventId: { $type: "string" } } },
      { $group: { _id: "$externalEventId", n: { $sum: 1 } } },
      { $match: { n: { $gt: 1 } } },
      { $count: "duplicates" },
    ]);
    const bySource = await this.eventModel.aggregate([
      { $match: { dataMode: { $ne: "demo" } } },
      { $group: { _id: "$sourceType", count: { $sum: 1 }, lastEvent: { $max: "$date" }, lastError: { $last: "$notifyLastError" } } },
    ]);
    const bySourceMap: Record<string, any> = {};
    bySource.forEach((s) => { bySourceMap[s._id || "PLATFORM"] = s; });
    const ADAPTERS = [
      ["EARLYLAND_ACTIVITY", "EarlyLand"],
      ["TOKEN", "Unlocks"],
      ["PLATFORM", "Admin events"],
      ["NEWS", "Crypto News"],
      ["PROJECT", "Project Updates"],
      ["FUNDING", "Funding Feed"],
      ["MARKET", "Market"],
    ];
    const sources = ADAPTERS.map(([key, label]) => {
      const row = bySourceMap[key];
      return {
        sourceType: key,
        label,
        count: row?.count || 0,
        lastEvent: row?.lastEvent || null,
        lastError: row?.lastError || null,
        status: row?.count ? "CONNECTED" : "NOT_CONFIGURED",
      };
    });
    return {
      counts: { total, published, drafts, scheduled, upcoming7d },
      health: {
        orphanSource: orphans,
        invalidDate,
        duplicateExternalId: dups?.[0]?.duplicates || 0,
      },
      sources,
    };
  }

  async completeExpired() {
    const r = await this.eventModel.updateMany(
      { lifecycleStatus: "PUBLISHED", endDate: { $lt: new Date() } },
      { $set: { lifecycleStatus: "COMPLETED" } },
    );
    return { updated: (r as any).modifiedCount || 0 };
  }
}
