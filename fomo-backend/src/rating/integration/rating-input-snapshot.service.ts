import { ConflictException, Injectable, OnModuleInit } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { createHash } from "crypto";
import { RatingInputEnvelope } from "./rating-raw-dto";

export const SNAPSHOT_COLLECTION = "rating_input_snapshots";

export interface StoredSnapshot {
  _id?: any;
  entityType: string;
  entityId: string;
  source: string;
  sourceVersion?: string;
  schemaVersion?: number;
  payload: any;
  observedAt?: string;
  receivedAt: string;
  idempotencyKey?: string;
  checksum: string;
  validationStatus: "valid" | "invalid";
  lastResultScore?: number | null;
}

/**
 * Single append-friendly collection of RAW ingested snapshots. We do NOT copy
 * Project/Fund/Person/User docs. Idempotent by (entityType, idempotencyKey):
 * a replay with the SAME checksum is a no-op; a new checksum updates in place.
 */
@Injectable()
export class RatingInputSnapshotService implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    try { await this.ensureIndexes(); } catch { /* non-fatal */ }
  }

  private col() {
    return this.connection.db.collection(SNAPSHOT_COLLECTION);
  }

  static checksum(payload: any): string {
    return createHash("sha256").update(JSON.stringify(payload ?? {})).digest("hex");
  }

  async ensureIndexes() {
    await this.col().createIndex({ entityType: 1, entityId: 1, observedAt: -1 });
    await this.col().createIndex(
      { source: 1, entityType: 1, entityId: 1, idempotencyKey: 1 },
      { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
    );
  }

  async store(
    entityType: string,
    entityId: string,
    env: RatingInputEnvelope,
    validationStatus: "valid" | "invalid" = "valid"
  ): Promise<{ snapshot: StoredSnapshot; deduped: boolean }> {
    const checksum = RatingInputSnapshotService.checksum(env.payload);
    const now = new Date().toISOString();

    // Idempotency keyed by (source, entityType, entityId, idempotencyKey).
    if (env.idempotencyKey) {
      const existing = (await this.col().findOne({
        source: env.source,
        entityType,
        entityId,
        idempotencyKey: env.idempotencyKey,
      })) as StoredSnapshot | null;
      if (existing) {
        if (existing.checksum === checksum) {
          return { snapshot: existing, deduped: true }; // exact replay -> no-op
        }
        // Same key, different payload -> conflict; never silently overwrite.
        throw new ConflictException({
          code: "IDEMPOTENCY_CONFLICT",
          message: `idempotencyKey "${env.idempotencyKey}" already used for ${entityType}/${entityId} from "${env.source}" with a different payload`,
          existingChecksum: existing.checksum,
          incomingChecksum: checksum,
        });
      }
    }

    const doc: StoredSnapshot = {
      entityType,
      entityId,
      source: env.source,
      sourceVersion: env.sourceVersion,
      schemaVersion: env.schemaVersion,
      payload: env.payload,
      observedAt: env.observedAt,
      receivedAt: now,
      idempotencyKey: env.idempotencyKey,
      checksum,
      validationStatus,
    };

    if (env.idempotencyKey) {
      await this.col().insertOne(doc as any);
    } else {
      await this.col().updateOne(
        { source: env.source, entityType, entityId, idempotencyKey: { $exists: false } },
        { $set: doc },
        { upsert: true }
      );
    }
    return { snapshot: doc, deduped: false };
  }

  async latest(entityType: string, entityId: string): Promise<StoredSnapshot | null> {
    return (await this.col().findOne(
      { entityType, entityId },
      { sort: { receivedAt: -1 } }
    )) as StoredSnapshot | null;
  }

  /** Admin explorer: filtered + paginated list of ingested snapshots. */
  async list(filters: {
    entityType?: string;
    entityId?: string;
    source?: string;
    validationStatus?: string;
    from?: string;
    to?: string;
    limit?: number;
    skip?: number;
  } = {}): Promise<{ items: StoredSnapshot[]; total: number; limit: number; skip: number }> {
    const query: Record<string, any> = {};
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.entityId) query.entityId = { $regex: String(filters.entityId).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    if (filters.source) query.source = filters.source;
    if (filters.validationStatus) query.validationStatus = filters.validationStatus;
    if (filters.from || filters.to) {
      query.receivedAt = {};
      if (filters.from) query.receivedAt.$gte = filters.from;
      if (filters.to) query.receivedAt.$lte = filters.to;
    }
    const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 200);
    const skip = Math.max(Number(filters.skip) || 0, 0);
    const [items, total] = await Promise.all([
      this.col().find(query).sort({ receivedAt: -1 }).skip(skip).limit(limit).toArray(),
      this.col().countDocuments(query),
    ]);
    return { items: items as any, total, limit, skip };
  }

  /** Distinct sources present in the store (for the explorer filter). */
  async sources(): Promise<string[]> {
    const values = await this.col().distinct("source");
    return (values as string[]).filter(Boolean).sort();
  }

  async byId(id: string): Promise<StoredSnapshot | null> {
    let query: any = { _id: id };
    try {
      const { ObjectId } = require("mongodb");
      if (ObjectId.isValid(id)) query = { _id: new ObjectId(id) };
    } catch {
      /* keep string id */
    }
    return (await this.col().findOne(query)) as StoredSnapshot | null;
  }

  async attachResult(entityType: string, entityId: string, score: number | null) {
    await this.col().updateOne(
      { entityType, entityId },
      { $set: { lastResultScore: score } }
    );
  }
}
