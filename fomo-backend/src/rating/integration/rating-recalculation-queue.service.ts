import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { ModuleRef } from "@nestjs/core";
import { Connection } from "mongoose";
import { RatingIngestionService } from "./rating-ingestion.service";

const JOBS = "rating_recalculation_jobs";
const UNIFIED_TYPES = ["funds", "persons", "projects", "users", "twitter", "trade"];

// Which entity types a reference catalog affects.
const CATALOG_AFFECTS: Record<string, string[]> = {
  rating_crises: ["funds"],
  rating_jurisdictions: ["funds", "projects"],
  rating_tier_registry: ["twitter"],
  rating_red_flag_catalog: ["projects"],
  rating_role_catalog: ["persons", "projects"],
  rating_partnership_types: ["persons"],
  rating_media_source_tiers: ["persons"],
};

export interface RecalcJob {
  _id?: any;
  entityType: string;
  entityId: string;
  reason: string;
  status: "pending" | "processing" | "done" | "failed";
  attempts: number;
  createdAt: string;
  processedAt?: string | null;
  error?: string | null;
  audit?: any;
}

/**
 * Integration-ready recalculation queue. Reacts to new snapshots, config
 * changes, reference-catalog edits and related-score changes by enqueuing
 * deduplicated jobs; an internal interval worker turns each pending job into a
 * fresh rating_result. No external broker required.
 */
@Injectable()
export class RatingRecalculationQueueService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly moduleRef: ModuleRef
  ) {}

  private col() {
    if (!this.connection.db) throw new Error("Mongo connection is not ready");
    return this.connection.db.collection(JOBS);
  }

  onModuleInit() {
    this.timer = setInterval(() => {
      this.processOnce(10).catch(() => undefined);
    }, 5000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /** Enqueue a job, deduplicating against an existing pending job. */
  async enqueue(entityType: string, entityId: string, reason: string): Promise<RecalcJob | null> {
    if (!entityType || !entityId) return null;
    const existing = await this.col().findOne({ entityType, entityId, status: "pending" });
    if (existing) {
      const reasons = new Set(String(existing.reason || "").split(",").filter(Boolean));
      reasons.add(reason);
      await this.col().updateOne(
        { _id: existing._id },
        { $set: { reason: Array.from(reasons).join(","), updatedAt: new Date().toISOString() } }
      );
      return { ...(existing as any), reason: Array.from(reasons).join(",") };
    }
    const job: RecalcJob = {
      entityType,
      entityId,
      reason,
      status: "pending",
      attempts: 0,
      createdAt: new Date().toISOString(),
      processedAt: null,
      error: null,
    };
    const res = await this.col().insertOne(job as any);
    return { ...job, _id: res.insertedId };
  }

  /** Enqueue every entity of a type that already has a stored rating result. */
  async enqueueForType(entityType: string, reason: string): Promise<number> {
    if (!this.connection.db) return 0;
    const ids = (await this.connection.db
      .collection("rating_results")
      .distinct("entityId", { entityType, isCurrent: true })) as string[];
    let n = 0;
    for (const id of ids) {
      await this.enqueue(entityType, id, reason);
      n += 1;
    }
    return n;
  }

  /** Mark entities affected by a reference-catalog change as needing recalc. */
  async enqueueAffectedByCatalog(catalog: string, reason = "reference"): Promise<{ catalog: string; affectedTypes: string[]; enqueued: number }> {
    const types = CATALOG_AFFECTS[catalog] || [];
    let enqueued = 0;
    for (const t of types) enqueued += await this.enqueueForType(t, `${reason}:${catalog}`);
    return { catalog, affectedTypes: types, enqueued };
  }

  /** Config change → all entities of every unified type need recalc. */
  async enqueueAllAfterConfig(reason = "config"): Promise<number> {
    let n = 0;
    for (const t of UNIFIED_TYPES) n += await this.enqueueForType(t, reason);
    return n;
  }

  /** Related-score change: a fund/person change fans out to related projects. */
  async enqueueRelated(entityType: string, entityId: string): Promise<number> {
    if (!this.connection.db) return 0;
    let enqueued = 0;
    try {
      if (entityType === "funds" || entityType === "persons") {
        const field = entityType === "funds" ? ["funds", "backers", "fundIds"] : ["persons", "personIds", "team"];
        const or = field.map((f) => ({ [f]: entityId }));
        const projects = await this.connection.db
          .collection("rating_results")
          .distinct("entityId", { entityType: "projects", isCurrent: true });
        // Best-effort: without a relation store we re-touch existing project
        // results so a fund/person change propagates. Bounded by existing results.
        for (const pid of projects.slice(0, 200) as string[]) {
          await this.enqueue("projects", pid, `related:${entityType}:${entityId}`);
          enqueued += 1;
        }
        void or;
      }
    } catch {
      /* best-effort */
    }
    return enqueued;
  }

  /** Process up to `limit` pending jobs into fresh rating results. */
  async processOnce(limit = 10): Promise<{ processed: number; done: number; failed: number }> {
    if (this.running || !this.connection.db) return { processed: 0, done: 0, failed: 0 };
    this.running = true;
    let done = 0;
    let failed = 0;
    let processed = 0;
    try {
      const ingestion = this.moduleRef.get(RatingIngestionService, { strict: false });
      const jobs = (await this.col().find({ status: "pending" }).sort({ createdAt: 1 }).limit(limit).toArray()) as any[];
      for (const job of jobs) {
        processed += 1;
        await this.col().updateOne({ _id: job._id }, { $set: { status: "processing" }, $inc: { attempts: 1 } });
        try {
          const out = await ingestion.recomputeFromLatestSnapshot(job.entityType, job.entityId);
          await this.col().updateOne(
            { _id: job._id },
            { $set: { status: "done", processedAt: new Date().toISOString(), error: null, audit: { newScore: out?.newScore ?? null, delta: out?.delta ?? null } } }
          );
          done += 1;
          if (!String(job.reason || "").startsWith("related") && (job.entityType === "funds" || job.entityType === "persons")) {
            await this.enqueueRelated(job.entityType, job.entityId);
          }
        } catch (e: any) {
          await this.col().updateOne(
            { _id: job._id },
            { $set: { status: "failed", processedAt: new Date().toISOString(), error: String(e?.message || e) } }
          );
          failed += 1;
        }
      }
    } finally {
      this.running = false;
    }
    return { processed, done, failed };
  }

  async list(filters: { status?: string; entityType?: string; limit?: number } = {}) {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.entityType) query.entityType = filters.entityType;
    const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 200);
    const items = await this.col().find(query).sort({ createdAt: -1 }).limit(limit).toArray();
    return items;
  }

  async stats() {
    const agg = (await this.col()
      .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
      .toArray()) as any[];
    const out: Record<string, number> = { pending: 0, processing: 0, done: 0, failed: 0 };
    agg.forEach((a) => { out[a._id] = a.count; });
    return out;
  }
}
