import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { createHash } from "crypto";
import { EntityProvenance } from "./rating-provenance";

export const RESULTS_COLLECTION = "rating_results";
export const CONFIG_SNAPSHOT_COLLECTION = "rating_config_snapshots";

export interface RatingResult {
  _id?: any;
  entityType: string;
  entityId: string;
  score: number | null;
  level: string | null;
  rank?: string | null;
  components?: any;
  penalties?: any;
  completeness?: number;
  confidence?: number;
  freshness?: number;
  provenance?: EntityProvenance | null;
  inputSnapshotIds?: string[];
  configSnapshotId?: string;
  previousResultId?: string | null;
  previousScore?: number | null;
  delta?: number | null;
  calculatedAt: string;
  calculationReason?: string;
  isCurrent: boolean;
}

/**
 * Stores CURRENT + HISTORICAL rating results, each referencing the immutable
 * input snapshot(s) and config snapshot used, so any past result is fully
 * reproducible and auditable (delta vs previous, reason, timestamps).
 */
@Injectable()
export class RatingResultsService implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    try { await this.ensureIndexes(); } catch { /* non-fatal */ }
  }

  private results() {
    return this.connection.db.collection(RESULTS_COLLECTION);
  }
  private configSnaps() {
    return this.connection.db.collection(CONFIG_SNAPSHOT_COLLECTION);
  }

  async ensureIndexes() {
    await this.results().createIndex({ entityType: 1, entityId: 1, isCurrent: 1 });
    await this.results().createIndex({ entityType: 1, entityId: 1, calculatedAt: -1 });
  }

  /** Immutable config snapshot, deduped by checksum. Returns snapshot id. */
  async ensureConfigSnapshot(config: any, createdBy = "system", reason = "auto"): Promise<string> {
    const checksum = createHash("sha256").update(JSON.stringify(config ?? {})).digest("hex");
    const existing = await this.configSnaps().findOne({ _id: checksum as any });
    if (!existing) {
      await this.configSnaps().insertOne({
        _id: checksum,
        checksum,
        config,
        createdBy,
        reason,
        createdAt: new Date().toISOString(),
      } as any);
    }
    return checksum;
  }

  async record(input: {
    entityType: string;
    entityId: string;
    result: any;
    provenance?: EntityProvenance | null;
    inputSnapshotIds?: string[];
    configSnapshotId?: string;
    reason?: string;
  }): Promise<RatingResult> {
    const { entityType, entityId } = input;
    const prev = (await this.results().findOne(
      { entityType, entityId, isCurrent: true }
    )) as RatingResult | null;

    const score = (input.result?.score ?? null) as number | null;
    const now = new Date().toISOString();
    const doc: RatingResult = {
      entityType,
      entityId,
      score,
      level: input.result?.level ?? null,
      rank: input.result?.rank ?? input.result?.meta?.rank ?? null,
      components: input.result?.meta?.components ?? input.result?.components ?? null,
      penalties: input.result?.meta?.penalties ?? null,
      completeness: input.result?.completeness ?? input.provenance?.completeness,
      confidence: input.provenance ? input.provenance.completeness / 100 : undefined,
      freshness: input.provenance?.freshness,
      provenance: input.provenance ?? null,
      inputSnapshotIds: input.inputSnapshotIds ?? [],
      configSnapshotId: input.configSnapshotId,
      previousResultId: prev?._id ? String(prev._id) : null,
      previousScore: prev?.score ?? null,
      delta: prev?.score != null && score != null ? Math.round((score - prev.score) * 100) / 100 : null,
      calculatedAt: now,
      calculationReason: input.reason ?? "recalculate",
      isCurrent: true,
    };

    if (prev?._id) {
      await this.results().updateOne({ _id: prev._id }, { $set: { isCurrent: false } });
    }
    const ins = await this.results().insertOne(doc as any);
    doc._id = ins.insertedId;
    return doc;
  }

  async current(entityType: string, entityId: string): Promise<RatingResult | null> {
    return (await this.results().findOne({ entityType, entityId, isCurrent: true })) as RatingResult | null;
  }

  async history(entityType: string, entityId: string, limit = 50): Promise<RatingResult[]> {
    return (await this.results()
      .find({ entityType, entityId })
      .sort({ calculatedAt: -1 })
      .limit(limit)
      .toArray()) as RatingResult[];
  }
}
