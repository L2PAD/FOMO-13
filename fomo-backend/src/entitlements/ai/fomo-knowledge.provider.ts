import { Injectable, Logger } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";

export interface KnowledgeFreshness {
  updatedAt: string | null;
  ageSeconds: number | null;
  status: "fresh" | "stale" | "unknown" | "empty";
}
export interface KnowledgeResult {
  connected: boolean;
  source: string;
  domain: string;
  dataMode: "real" | "mock";
  data: any;
  count: number;
  freshness: KnowledgeFreshness;
  status: "ok" | "not_connected" | "empty" | "access_denied" | "error";
  note?: string;
  latencyMs?: number;
}

/** Domain → canonical FOMO read model/collection. `public:false` sources are
 *  ownership/capability gated and must never leak via AI. Dot-paths in
 *  title/search/expose read nested read-model fields (e.g. publishedSnapshot.name). */
interface DomainDef {
  domain: string;
  collection: string;
  title: string[];
  search: string[];
  public: boolean;
  ownerField?: string;
  freshnessField?: string;
  expose?: string[];
}

const DOMAINS: Record<string, DomainDef> = {
  projects: { domain: "projects", collection: "ico_project_read_models", title: ["name", "projectName", "symbol"], search: ["name", "projectName", "symbol", "ticker", "slug"], public: true },
  funds: { domain: "funds", collection: "funds", title: ["name", "fundName"], search: ["name", "fundName", "slug"], public: true },
  persons: { domain: "persons", collection: "twitterpeople", title: ["name", "username", "handle"], search: ["name", "username", "handle"], public: true },
  ratings: { domain: "ratings", collection: "rating_input_snapshots", title: ["entityName", "projectName"], search: ["entityName", "projectName", "entityId"], public: true },
  signals: { domain: "signals", collection: "market_project_roi_metrics", title: ["symbol", "projectName"], search: ["symbol", "projectName"], public: true },
  // EarlyLand activities carry the only rich real data in this environment; the
  // presentable fields live nested inside publishedSnapshot/currentDraft.
  earlyland: {
    domain: "earlyland",
    collection: "activities",
    title: ["publishedSnapshot.name", "currentDraft.name", "publishedSnapshot.projectName", "slug"],
    search: ["publishedSnapshot.name", "publishedSnapshot.projectName", "publishedSnapshot.symbol", "currentDraft.name", "currentDraft.projectName", "currentDraft.symbol", "slug"],
    public: true,
    freshnessField: "updatedAt",
    expose: ["slug", "accessTier", "lifecycleStatus", "publishedSnapshot.name", "publishedSnapshot.projectName", "publishedSnapshot.symbol", "publishedSnapshot.score", "publishedSnapshot.ecosystem", "publishedSnapshot.category", "publishedSnapshot.activityType", "publishedSnapshot.difficulty"],
  },
  unlocks: { domain: "unlocks", collection: "token_unlock_events", title: ["projectName", "symbol"], search: ["projectName", "symbol"], public: true },
  launchpad: { domain: "launchpad", collection: "launchpad_chain_events", title: ["name", "projectName"], search: ["name", "projectName"], public: true },
  market: { domain: "market", collection: "coinmarketcaps", title: ["name", "symbol"], search: ["name", "symbol", "slug"], public: true },
  portfolio: { domain: "portfolio", collection: "portfolios", title: ["name"], search: [], public: false, ownerField: "userId" },
};

interface DomainTelemetry {
  events: number[];
  errors: number;
  lastSuccessAt: string | null;
  latencies: number[];
}

/**
 * FomoKnowledgeProvider (P10) — single READ-ONLY knowledge layer over the
 * EXISTING canonical FOMO collections. It never invents data: a missing
 * collection returns status not_connected; an existing-but-empty collection
 * returns status empty with connected:true. Every result carries source +
 * freshness + dataMode so answers can be grounded and audited. Non-public
 * domains (portfolio) are ownership-gated. Lightweight in-memory retrieval
 * telemetry powers AI Health / Knowledge Diagnostics.
 */
@Injectable()
export class FomoKnowledgeProvider {
  private readonly logger = new Logger("FomoKnowledgeProvider");
  private collectionNamesCache: { at: number; names: Set<string> } | null = null;
  private telemetry: Record<string, DomainTelemetry> = {};

  constructor(@InjectConnection() private readonly conn: Connection) {}

  domainKeys(): string[] {
    return Object.keys(DOMAINS);
  }

  private async collectionExists(name: string): Promise<boolean> {
    if (!this.collectionNamesCache || Date.now() - this.collectionNamesCache.at > 30_000) {
      const cols = await this.conn.db.listCollections().toArray();
      this.collectionNamesCache = { at: Date.now(), names: new Set(cols.map((c: any) => c.name)) };
    }
    return this.collectionNamesCache.names.has(name);
  }

  private freshnessOf(doc: any, field?: string): KnowledgeFreshness {
    const raw = (field ? getPath(doc, field) : null) || doc?.updatedAt || doc?.createdAt || null;
    if (!raw) return { updatedAt: null, ageSeconds: null, status: "unknown" };
    const t = new Date(raw).getTime();
    const ageSeconds = Math.round((Date.now() - t) / 1000);
    return { updatedAt: new Date(raw).toISOString(), ageSeconds, status: ageSeconds < 86400 ? "fresh" : "stale" };
  }

  private notConnected(domain: string, source: string, note: string): KnowledgeResult {
    return { connected: false, source, domain, dataMode: "real", data: null, count: 0, freshness: { updatedAt: null, ageSeconds: null, status: "unknown" }, status: "not_connected", note };
  }

  private recordTelemetry(domain: string, latencyMs: number, status: string) {
    const t = this.telemetry[domain] || (this.telemetry[domain] = { events: [], errors: 0, lastSuccessAt: null, latencies: [] });
    const now = Date.now();
    t.events.push(now);
    t.events = t.events.filter((ts) => now - ts < 86_400_000);
    t.latencies.push(latencyMs);
    if (t.latencies.length > 50) t.latencies.shift();
    if (status === "error") t.errors += 1;
    if (status === "ok" || status === "empty") t.lastSuccessAt = new Date(now).toISOString();
  }

  private telemetryFor(domain: string) {
    const t = this.telemetry[domain];
    if (!t) return { requests24h: 0, errors: 0, lastSuccessAt: null, avgLatencyMs: null as number | null };
    const now = Date.now();
    const requests24h = t.events.filter((ts) => now - ts < 86_400_000).length;
    const avgLatencyMs = t.latencies.length ? Math.round(t.latencies.reduce((a, b) => a + b, 0) / t.latencies.length) : null;
    return { requests24h, errors: t.errors, lastSuccessAt: t.lastSuccessAt, avgLatencyMs };
  }

  /** Generic domain query. ctx carries the requesting user for ownership checks. */
  async query(
    domainKey: string,
    opts: { search?: string; id?: string; limit?: number; ownerUserId?: string } = {},
    ctx?: { userId?: string; isAdmin?: boolean },
  ): Promise<KnowledgeResult> {
    const started = Date.now();
    const res = await this._query(domainKey, opts, ctx);
    res.latencyMs = Date.now() - started;
    this.recordTelemetry(res.domain || domainKey, res.latencyMs, res.status);
    return res;
  }

  private async _query(
    domainKey: string,
    opts: { search?: string; id?: string; limit?: number; ownerUserId?: string },
    ctx?: { userId?: string; isAdmin?: boolean },
  ): Promise<KnowledgeResult> {
    const def = DOMAINS[domainKey];
    if (!def) return this.notConnected(domainKey, domainKey, "Unknown knowledge domain");

    // Privacy gate (P10): private domains require ownership or admin.
    if (!def.public) {
      const owner = opts.ownerUserId || ctx?.userId;
      if (!ctx?.isAdmin && (!owner || !ctx?.userId || String(owner) !== String(ctx.userId))) {
        return { connected: true, source: def.collection, domain: def.domain, dataMode: "real", data: null, count: 0, freshness: { updatedAt: null, ageSeconds: null, status: "unknown" }, status: "access_denied", note: "Private FOMO dataset — requires ownership/capability" };
      }
    }

    if (!(await this.collectionExists(def.collection))) {
      return this.notConnected(def.domain, def.collection, `Collection ${def.collection} is not present in this environment`);
    }

    try {
      const coll = this.conn.db.collection(def.collection);
      const limit = Math.min(opts.limit || 5, 25);
      let filter: any = {};
      if (opts.id) filter = { $or: [{ _id: safeId(opts.id) }, { id: opts.id }, { slug: opts.id }, { symbol: opts.id }] };
      else if (opts.search && def.search.length) {
        const rx = new RegExp(escapeRx(opts.search), "i");
        filter = { $or: def.search.map((f) => ({ [f]: rx })) };
      }
      if (!def.public && def.ownerField && ctx?.userId) filter[def.ownerField] = safeId(ctx.userId);

      const docs = await coll.find(filter).limit(limit).toArray();
      const total = await coll.estimatedDocumentCount();
      const fresh = docs.length ? this.freshnessOf(docs[0], def.freshnessField) : { updatedAt: null, ageSeconds: null, status: total === 0 ? "empty" : "unknown" as any };
      return {
        connected: true,
        source: def.collection,
        domain: def.domain,
        dataMode: "real",
        data: docs.map((d) => this.project(def, d)),
        count: docs.length,
        freshness: fresh,
        status: docs.length ? "ok" : "empty",
        note: docs.length ? undefined : total === 0 ? "Source connected but currently has no data" : "No match for query",
      };
    } catch (e: any) {
      this.logger.warn(`knowledge query ${domainKey} failed: ${e?.message || e}`);
      return { connected: true, source: def.collection, domain: def.domain, dataMode: "real", data: null, count: 0, freshness: { updatedAt: null, ageSeconds: null, status: "unknown" }, status: "error", note: String(e?.message || e) };
    }
  }

  private project(def: DomainDef, d: any) {
    const title = def.title.map((t) => getPath(d, t)).find((v) => v != null && v !== "") || String(d?._id || "");
    const base = {
      entityId: String(d?._id || d?.id || ""),
      title,
      updatedAt: d?.updatedAt || d?.createdAt || null,
    };
    if (def.expose && def.expose.length) {
      const fields: Record<string, any> = {};
      for (const p of def.expose) {
        const v = getPath(d, p);
        if (v === undefined || v === null) continue;
        const key = p.split(".").pop() as string;
        fields[key] = v instanceof Date ? v.toISOString() : Array.isArray(v) ? `[${v.length} items]` : typeof v === "object" ? "{object}" : v;
      }
      return { ...base, fields };
    }
    return { ...base, fields: shallow(d) };
  }

  /** Diagnostics: health + retrieval telemetry of every knowledge source (P10/AI Health). */
  async health(): Promise<Array<{ domain: string; source: string; connected: boolean; status: string; dataMode: "real" | "mock"; count: number; freshness: KnowledgeFreshness; public: boolean; requests24h: number; errors: number; lastSuccessAt: string | null; avgLatencyMs: number | null }>> {
    const out: any[] = [];
    for (const key of Object.keys(DOMAINS)) {
      const def = DOMAINS[key];
      const tel = this.telemetryFor(def.domain);
      const exists = await this.collectionExists(def.collection);
      if (!exists) {
        out.push({ domain: def.domain, source: def.collection, connected: false, status: "not_connected", dataMode: "real", count: 0, freshness: { updatedAt: null, ageSeconds: null, status: "unknown" }, public: def.public, ...tel });
        continue;
      }
      const coll = this.conn.db.collection(def.collection);
      const count = await coll.estimatedDocumentCount();
      let freshness: KnowledgeFreshness = { updatedAt: null, ageSeconds: null, status: count === 0 ? "empty" : "unknown" };
      if (count > 0) {
        const latest = await coll.find({}).sort({ updatedAt: -1, createdAt: -1 }).limit(1).toArray();
        if (latest[0]) freshness = this.freshnessOf(latest[0], def.freshnessField);
      }
      out.push({ domain: def.domain, source: def.collection, connected: true, status: count === 0 ? "empty" : "ok", dataMode: "real", count, freshness, public: def.public, ...tel });
    }
    return out;
  }
}

function escapeRx(s: string): string {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function getPath(obj: any, path?: string): any {
  if (!path) return undefined;
  if (path.indexOf(".") === -1) return obj?.[path];
  return path.split(".").reduce((a: any, k: string) => (a == null ? a : a[k]), obj);
}
function safeId(v: string): any {
  try {
    const { Types } = require("mongoose");
    return Types.ObjectId.isValid(v) ? new Types.ObjectId(v) : v;
  } catch {
    return v;
  }
}
function shallow(d: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(d || {})) {
    if (k === "_id") continue;
    if (v === null || ["string", "number", "boolean"].includes(typeof v)) out[k] = v;
    else if (v instanceof Date) out[k] = v.toISOString();
    else if (Array.isArray(v)) out[k] = `[${v.length} items]`;
    else out[k] = "{object}";
  }
  return out;
}
