import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { randomUUID } from "crypto";
import { Connection } from "mongoose";
import {
  UnifiedRatingConfigService,
  UnifiedRuntimeResult,
} from "./unified-rating-config.service";
import { calculateByEntity } from "./unified-rating.engine";
import { mapEntityDoc } from "./unified-rating.adapters";
import {
  UNIFIED_ENTITY_TYPES,
  UnifiedEntityType,
  UnifiedRatingConfig,
} from "./unified-rating.types";

/**
 * Recalculates unified ratings and persists results ONLY to the canonical v2
 * collections (configurable per entity). No legacy collection is written.
 */
@Injectable()
export class UnifiedRatingRecalculationService {
  private readonly logger = new Logger(UnifiedRatingRecalculationService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: UnifiedRatingConfigService
  ) {}

  private entityType(value: unknown): UnifiedEntityType {
    const normalized = String(value || "").trim();
    if ((UNIFIED_ENTITY_TYPES as readonly string[]).includes(normalized)) {
      return normalized as UnifiedEntityType;
    }
    throw new BadRequestException(
      `entityType must be one of: ${UNIFIED_ENTITY_TYPES.join(", ")}`
    );
  }

  private collectionName(
    entityType: UnifiedEntityType,
    config: UnifiedRatingConfig
  ): string {
    return config.collections[entityType];
  }

  private db() {
    if (!this.connection.db) throw new Error("Mongo connection is not ready");
    return this.connection.db;
  }

  async start(entityTypeValue: unknown, entityId?: string) {
    const entityType = this.entityType(entityTypeValue);
    const snapshot = await this.configService.getSnapshot();
    const enabled = (snapshot.config as any)[entityType]?.enabled !== false;
    if (!enabled) {
      return { accepted: false, entityType, reason: "entity_disabled" };
    }

    // Single-entity recalculation runs synchronously and returns the result.
    if (entityId) {
      const result = await this.recalculateOne(
        entityType,
        entityId,
        snapshot.config
      );
      return { accepted: true, entityType, entityId, ...result };
    }

    const runId = randomUUID();
    const collectionName = this.collectionName(entityType, snapshot.config);
    const matched = await this.db()
      .collection(collectionName)
      .estimatedDocumentCount();
    if (!matched) {
      return { accepted: false, entityType, reason: "no_data", matched: 0 };
    }

    const acquired = await this.configService.acquireLease(
      entityType,
      runId,
      snapshot.version
    );
    if (!acquired) {
      return { accepted: false, entityType, reason: "already_running" };
    }

    setImmediate(() => {
      void this.executeBulk(entityType, runId, snapshot.config).catch((error) =>
        this.logger.error(
          `Unified rating bulk run failed entity=${entityType}: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      );
    });

    return { accepted: true, entityType, runId, state: "running", matched };
  }

  async recalculateOne(
    entityType: UnifiedEntityType,
    entityId: string,
    config: UnifiedRatingConfig
  ) {
    const collection = this.db().collection(
      this.collectionName(entityType, config)
    );
    const doc = await this.findById(collection, entityId);
    if (!doc) {
      throw new BadRequestException(
        `${entityType} document not found: ${entityId}`
      );
    }
    const before = doc.ratingV2 || null;
    const input = this.extractInput(entityType, doc);
    const result = calculateByEntity(entityType, input, config);
    await collection.updateOne({ _id: doc._id } as any, {
      $set: this.buildWriteSet(result),
    });
    // Which components changed between the previous and new breakdown.
    const changed: Record<string, { from: number; to: number }> = {};
    const beforeComps = (before?.components || {}) as Record<string, any>;
    Object.entries(result.components || {}).forEach(([key, c]: any) => {
      const from = Number(beforeComps[key]?.contribution ?? 0);
      const to = Number(c.contribution ?? 0);
      if (Math.abs(from - to) > 0.001) changed[key] = { from, to };
    });
    return {
      before: before ? { score: before.score, level: before.level } : null,
      result,
      input,
      changed,
    };
  }

  async search(entityTypeValue: unknown, query: string) {
    const entityType = this.entityType(entityTypeValue);
    const config = (await this.configService.getSnapshot()).config;
    const q = String(query || "").trim();
    if (q.length < 2) return { entityType, items: [] };
    const collection = this.db().collection(
      this.collectionName(entityType, config)
    );
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const or =
      entityType === "users"
        ? [{ email: rx }, { username: rx }, { name: rx }]
        : [{ name: rx }, { title: rx }, { symbol: rx }];
    const docs = await collection
      .find({ $or: or } as any)
      .limit(20)
      .toArray();
    const items = docs.map((d: any) => ({
      id: String(d._id ?? d.id ?? ""),
      label: String(d.name || d.title || d.email || d.username || d.symbol || d._id),
      score: d.ratingV2Score ?? d.ratingV2?.score ?? null,
    }));
    return { entityType, items };
  }

  private async executeBulk(
    entityType: UnifiedEntityType,
    runId: string,
    config: UnifiedRatingConfig
  ): Promise<void> {
    const startedAt = Date.now();
    const summary: Omit<UnifiedRuntimeResult, "durationMs"> = {
      scanned: 0,
      updated: 0,
      errors: 0,
    };
    let runError: unknown = null;
    try {
      const collection = this.db().collection(
        this.collectionName(entityType, config)
      );
      const cursor = collection.find({}).batchSize(config.batchSize);
      let operations: any[] = [];

      for await (const doc of cursor as any) {
        summary.scanned += 1;
        try {
          const input = this.extractInput(entityType, doc);
          const result = calculateByEntity(entityType, input, config);
          operations.push({
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: this.buildWriteSet(result) },
            },
          });
        } catch (error) {
          summary.errors += 1;
        }
        if (operations.length >= config.batchSize) {
          const res: any = await collection.bulkWrite(operations, {
            ordered: false,
          });
          summary.updated += Number(res?.modifiedCount || 0);
          operations = [];
        }
      }
      if (operations.length) {
        const res: any = await collection.bulkWrite(operations, {
          ordered: false,
        });
        summary.updated += Number(res?.modifiedCount || 0);
      }
    } catch (error) {
      runError = error;
    } finally {
      const result: UnifiedRuntimeResult = {
        ...summary,
        durationMs: Date.now() - startedAt,
      };
      await this.configService.completeRun(
        entityType,
        runId,
        result,
        runError
      );
      this.logger.log(
        `Unified rating run entity=${entityType} scanned=${result.scanned} updated=${result.updated} errors=${result.errors}`
      );
    }
  }

  private buildWriteSet(result: any): Record<string, any> {
    return {
      ratingV2: result,
      ratingV2Score: result.score,
      ratingV2Level: result.level,
      ratingV2FormulaVersion: result.formulaVersion,
      ratingV2CalculatedAt: result.calculatedAt,
      ratingV2Completeness: result.completeness,
    };
  }

  private async findById(collection: any, id: string): Promise<any> {
    // v2 canonical entities use string UUID ids.
    const byString = await collection.findOne({ _id: id } as any);
    if (byString) return byString;
    return collection.findOne({ id } as any);
  }

  /* ------------------------ input extraction ------------------------ */
  // Prefer an explicit `ratingInputsV2` override on the document; otherwise
  // fall back to best-effort field heuristics. Missing data simply lowers the
  // completeness score instead of throwing.

  extractInput(entityType: UnifiedEntityType, doc: any): any {
    // Manual curation escape hatch: an explicit per-document override wins.
    const override = doc?.ratingInputsV2;
    if (override && typeof override === "object") {
      return override;
    }
    // Otherwise map the REAL entity document via the deterministic adapters.
    // Missing signals return undefined -> engine reports missingFields.
    return mapEntityDoc(entityType, doc);
  }
}
