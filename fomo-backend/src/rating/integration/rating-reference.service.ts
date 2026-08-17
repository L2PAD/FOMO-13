import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { RATING_REFERENCE_SEED } from "./rating-reference.seed";

export const REFERENCE_CATALOGS = [
  "rating_crises",
  "rating_jurisdictions",
  "rating_tier_registry",
  "rating_red_flag_catalog",
  "rating_role_catalog",
  "rating_partnership_types",
  "rating_media_source_tiers",
] as const;
export type ReferenceCatalog = (typeof REFERENCE_CATALOGS)[number];

/**
 * Generic CRUD over the rating reference directories. These are admin-managed
 * (crises, jurisdictions, Tier-1 registry, red-flag catalog, roles, partnership
 * & media tiers). Seed rows are marked `system: true` so admins can tell system
 * defaults from their own edits. No fake real-world data — just the structure +
 * canonical seed the formulas reference.
 */
@Injectable()
export class RatingReferenceService implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    try {
      await this.seedIfEmpty();
    } catch {
      /* non-fatal at boot */
    }
  }

  private assertCatalog(catalog: string): asserts catalog is ReferenceCatalog {
    if (!REFERENCE_CATALOGS.includes(catalog as ReferenceCatalog))
      throw new BadRequestException(`Unknown reference catalog "${catalog}"`);
  }

  private col(catalog: string) {
    this.assertCatalog(catalog);
    return this.connection.db.collection(catalog);
  }

  catalogs() {
    return REFERENCE_CATALOGS;
  }

  async list(catalog: string) {
    const items = await this.col(catalog).find({}).sort({ _id: 1 }).toArray();
    return { catalog, count: items.length, items };
  }

  async upsert(catalog: string, code: string, body: any, adminId?: string) {
    this.assertCatalog(catalog);
    if (!code) throw new BadRequestException("code is required");
    const now = new Date().toISOString();
    const existing = await this.col(catalog).findOne({ _id: code as any });
    const doc = {
      ...existing,
      ...body,
      _id: code,
      code,
      system: existing?.system ?? false,
      enabled: body?.enabled ?? existing?.enabled ?? true,
      updatedAt: now,
      updatedBy: adminId || "admin",
      createdAt: existing?.createdAt ?? now,
    };
    await this.col(catalog).updateOne({ _id: code as any }, { $set: doc }, { upsert: true });
    return doc;
  }

  async remove(catalog: string, code: string) {
    const existing = await this.col(catalog).findOne({ _id: code as any });
    if (existing?.system)
      throw new BadRequestException("System default rows cannot be deleted (disable it instead)");
    await this.col(catalog).deleteOne({ _id: code as any });
    return { deleted: true, code };
  }

  async seedIfEmpty() {
    for (const [catalog, rows] of Object.entries(RATING_REFERENCE_SEED)) {
      const col = this.connection.db.collection(catalog);
      const count = await col.countDocuments({});
      if (count > 0) continue;
      const now = new Date().toISOString();
      const docs = rows.map((r: any) => ({
        ...r,
        _id: r.code,
        system: true,
        enabled: r.enabled ?? true,
        createdAt: now,
        updatedAt: now,
      }));
      if (docs.length) await col.insertMany(docs as any);
    }
  }

  /** jurisdiction code (lower) -> base score, for the normalizer. */
  async jurisdictionMap(): Promise<Record<string, number>> {
    const rows = await this.connection.db
      .collection("rating_jurisdictions")
      .find({ enabled: { $ne: false } })
      .toArray();
    const map: Record<string, number> = {};
    for (const r of rows) map[String(r.code).toLowerCase()] = Number(r.baseScore ?? 0);
    return map;
  }

  /** enabled crisis id -> period, for the normalizer. */
  async crisisMap(): Promise<Record<string, { startDate?: string; endDate?: string; enabled?: boolean }>> {
    const rows = await this.connection.db.collection("rating_crises").find({}).toArray();
    const map: Record<string, any> = {};
    for (const r of rows) map[String(r.code)] = { startDate: r.startDate, endDate: r.endDate, enabled: r.enabled !== false };
    return map;
  }
}
