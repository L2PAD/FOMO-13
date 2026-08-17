import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UnifiedRatingFacade } from "../unified/unified-rating.facade";
import { UnifiedRatingConfigService } from "../unified/unified-rating-config.service";
import {
  RatingInputEnvelope,
  RATING_ENTITY_TYPES,
  RATING_SCHEMA_VERSION,
  validateRawEnvelope,
} from "./rating-raw-dto";
import { normalizeByEntity } from "./rating-normalizer";
import { RatingInputSnapshotService } from "./rating-input-snapshot.service";
import { RatingReferenceService } from "./rating-reference.service";
import { RatingResultsService } from "./rating-results.service";
import { buildProvenance, EntityProvenance } from "./rating-provenance";
import { RatingRecalculationQueueService } from "./rating-recalculation-queue.service";

export interface IngestionResult {
  entityType: string;
  entityId: string;
  accepted: boolean;
  deduped: boolean;
  validationStatus: "valid" | "invalid";
  errors?: string[];
  score?: number | null;
  level?: string | null;
  provenance?: EntityProvenance;
}

/**
 * Orchestrates: validate DTO -> store snapshot (idempotent) -> normalize with
 * reference data -> compute score via the facade -> attach provenance +
 * recalculation. PREVIEW never persists; INGESTION persists a snapshot only
 * (never a copy of the entity doc).
 */
@Injectable()
export class RatingIngestionService {
  constructor(
    private readonly facade: UnifiedRatingFacade,
    private readonly snapshots: RatingInputSnapshotService,
    private readonly references: RatingReferenceService,
    private readonly results: RatingResultsService,
    private readonly configService: UnifiedRatingConfigService,
    private readonly queue: RatingRecalculationQueueService
  ) {}

  private async refs() {
    const [jurisdictions, crises] = await Promise.all([
      this.references.jurisdictionMap(),
      this.references.crisisMap(),
    ]);
    return { jurisdictions, crises };
  }

  /** Compute a score + provenance from a raw envelope WITHOUT persisting. */
  async computeFromEnvelope(entityType: string, env: RatingInputEnvelope) {
    const { input, present } = normalizeByEntity(entityType, env.payload, await this.refs());
    const result =
      entityType === "trade"
        ? await this.facade.tradeReputation(input.otc, input.p2p)
        : await this.facade.byEntity(entityType, input);

    const componentSources: Record<string, "derived" | "manual" | "missing"> = {};
    for (const [k, isPresent] of Object.entries(present)) componentSources[k] = isPresent ? "derived" : "missing";
    const missingFields = Object.entries(present).filter(([, v]) => !v).map(([k]) => k);
    const provenance = buildProvenance(
      entityType,
      env.source,
      env.observedAt,
      componentSources,
      (result as any).completeness ?? 0,
      missingFields
    );
    return { input, result, provenance };
  }

  async ingest(entityType: string, entityId: string, body: any): Promise<IngestionResult> {
    if (!RATING_ENTITY_TYPES.includes(entityType as any))
      throw new BadRequestException(`Unknown entityType "${entityType}"`);
    if (!entityId) throw new BadRequestException("entityId is required");

    const validation = validateRawEnvelope(entityType, body);
    if (!validation.valid || !validation.envelope) {
      // Persist an invalid snapshot for audit, then reject.
      try {
        await this.snapshots.store(
          entityType,
          entityId,
          { source: body?.source || "unknown", payload: body?.payload ?? {}, idempotencyKey: body?.idempotencyKey },
          "invalid"
        );
      } catch {
        /* ignore audit write errors */
      }
      throw new BadRequestException({ message: "Invalid rating input", errors: validation.errors });
    }

    const env = validation.envelope;
    const { snapshot, deduped } = await this.snapshots.store(entityType, entityId, env, "valid");

    // Idempotent replay with identical payload -> no recompute.
    if (deduped) {
      return {
        entityType,
        entityId,
        accepted: true,
        deduped: true,
        validationStatus: "valid",
        score: snapshot.lastResultScore ?? null,
      };
    }

    const { result, provenance } = await this.computeFromEnvelope(entityType, env);
    const score = (result as any).score ?? null;
    await this.snapshots.attachResult(entityType, entityId, score);

    // Persist a reproducible rating result referencing the config snapshot.
    const cfg = (await this.configService.getSnapshot()).config;
    const configSnapshotId = await this.results.ensureConfigSnapshot(cfg);
    await this.results.record({
      entityType,
      entityId,
      result,
      provenance,
      inputSnapshotIds: [`${env.source}:${entityId}:${env.idempotencyKey || env.observedAt || "latest"}`],
      configSnapshotId,
      reason: `ingest:${env.source}`,
    });

    // React: enqueue a recalculation job (audit trail snapshot -> job -> result).
    await this.queue
      .enqueue(entityType, entityId, `snapshot:${env.source}`)
      .catch(() => undefined);

    return {
      entityType,
      entityId,
      accepted: true,
      deduped: false,
      validationStatus: "valid",
      score,
      level: (result as any).level ?? null,
      provenance,
    };
  }

  /** Recompute from a SPECIFIC stored snapshot (by its id) and record a result. */
  async recomputeFromSnapshotId(id: string) {
    const snap = await this.snapshots.byId(id);
    if (!snap) throw new NotFoundException(`Snapshot not found: ${id}`);
    if (snap.validationStatus === "invalid")
      throw new BadRequestException("Cannot recompute from an invalid snapshot");
    const env: RatingInputEnvelope = {
      source: snap.source,
      observedAt: snap.observedAt,
      schemaVersion: snap.schemaVersion ?? RATING_SCHEMA_VERSION,
      payload: snap.payload,
    };
    const { result, provenance } = await this.computeFromEnvelope(snap.entityType, env);
    const cfg = (await this.configService.getSnapshot()).config;
    const configSnapshotId = await this.results.ensureConfigSnapshot(cfg);
    const prev = await this.results.current(snap.entityType, snap.entityId);
    const stored = await this.results.record({
      entityType: snap.entityType,
      entityId: snap.entityId,
      result,
      provenance,
      inputSnapshotIds: [String(snap._id ?? `${snap.source}:${snap.entityId}`)],
      configSnapshotId,
      reason: "explorer-recalculate",
    });
    return {
      entityType: snap.entityType,
      entityId: snap.entityId,
      previousScore: prev?.score ?? null,
      newScore: stored.score,
      delta: stored.delta,
      level: stored.level,
      completeness: stored.completeness,
      provenance,
      configSnapshotId,
    };
  }

  /** Recompute from the LATEST stored snapshot and write a new result version. */
  async recomputeFromLatestSnapshot(entityType: string, entityId: string) {
    if (!RATING_ENTITY_TYPES.includes(entityType as any))
      throw new BadRequestException(`Unknown entityType "${entityType}"`);
    const snap = await this.snapshots.latest(entityType, entityId);
    if (!snap)
      throw new NotFoundException(`No input snapshot for ${entityType}/${entityId} — ingest data first`);
    const env: RatingInputEnvelope = {
      source: snap.source,
      observedAt: snap.observedAt,
      schemaVersion: snap.schemaVersion ?? RATING_SCHEMA_VERSION,
      payload: snap.payload,
    };
    const { result, provenance } = await this.computeFromEnvelope(entityType, env);
    const cfg = (await this.configService.getSnapshot()).config;
    const configSnapshotId = await this.results.ensureConfigSnapshot(cfg);
    const prev = await this.results.current(entityType, entityId);
    const stored = await this.results.record({
      entityType,
      entityId,
      result,
      provenance,
      inputSnapshotIds: [`${snap.source}:${entityId}`],
      configSnapshotId,
      reason: "manual-recalculate",
    });
    return {
      entityType,
      entityId,
      previousScore: prev?.score ?? null,
      newScore: stored.score,
      delta: stored.delta,
      level: stored.level,
      completeness: stored.completeness,
      provenance,
      configSnapshotId,
    };
  }
}
