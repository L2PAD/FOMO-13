import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { randomUUID } from "crypto";
import { Connection } from "mongoose";
import { FundsRatingService } from "src/funds/funds-rating.service";
import { RatingConfigService } from "./rating-config.service";
import { RatingFormulaService } from "./rating-formula.service";
import { RatingService } from "./rating.service";
import {
  RATING_ENTITY_TYPES,
  RatingEntityConfig,
  RatingEntityType,
  RatingFormulaModeConfig,
  RatingRunResult,
  RatingRunTrigger,
} from "./rating.types";

type RunSummary = Omit<RatingRunResult, "durationMs">;

@Injectable()
export class RatingRecalculationService {
  private readonly logger = new Logger(RatingRecalculationService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly ratingService: RatingService,
    private readonly fundsRatingService: FundsRatingService,
    private readonly formulaService: RatingFormulaService,
    private readonly configService: RatingConfigService
  ) {}

  async start(entityTypeValue: unknown, trigger: RatingRunTrigger) {
    const entityType = this.entityType(entityTypeValue);
    const snapshot = await this.configService.getSnapshot();
    const entityConfig = snapshot.entities[entityType];

    if (!entityConfig.enabled) {
      if (trigger === "manual") {
        throw new ConflictException(
          `Rating recalculation for ${entityType} is disabled`
        );
      }
      return {
        accepted: false,
        entityType,
        state: "disabled",
        reason: "entity_disabled",
      };
    }
    if (trigger === "schedule" && !entityConfig.schedule.enabled) {
      return {
        accepted: false,
        entityType,
        state: "disabled",
        reason: "schedule_disabled",
      };
    }

    const runId = randomUUID();
    const lease = await this.configService.acquireLease(
      entityType,
      runId,
      trigger,
      snapshot.version
    );

    if (!lease.acquired) {
      return {
        accepted: false,
        entityType,
        state: "running",
        reason: "already_running",
        runtime: lease.runtime,
      };
    }

    setImmediate(() => {
      void this.execute(
        entityType,
        runId,
        entityConfig,
        snapshot.version,
        snapshot.updatedAt,
        lease.runtime.fence
      ).catch((error) =>
        this.logger.error(
          `Rating run persistence failed entity=${entityType} runId=${runId}: ${this.errorMessage(
            error
          )}`,
          error instanceof Error ? error.stack : undefined
        )
      );
    });

    return {
      accepted: true,
      entityType,
      runId,
      state: "running",
      startedAt: lease.runtime.startedAt,
      configVersion: snapshot.version,
    };
  }

  private async execute(
    entityType: RatingEntityType,
    runId: string,
    config: RatingEntityConfig,
    configVersion: number,
    configUpdatedAt: Date | null,
    fence: number
  ): Promise<void> {
    const startedAt = Date.now();
    const summary: RunSummary = { scanned: 0, updated: 0, errors: 0 };
    let leaseError: Error | null = null;
    let heartbeatPending = false;
    const heartbeatTimer = setInterval(() => {
      if (heartbeatPending || leaseError) return;
      heartbeatPending = true;
      void this.configService
        .heartbeat(entityType, runId)
        .catch((error) => {
          leaseError =
            error instanceof Error ? error : new Error(String(error));
        })
        .finally(() => {
          heartbeatPending = false;
        });
    }, 60_000);
    heartbeatTimer.unref?.();

    try {
      const audit = {
        ratingConfigVersion: configVersion,
        ratingConfigUpdatedAt: configUpdatedAt,
        ratingRunId: runId,
      };
      if (entityType === "projects") {
        await this.recalculateProjects(
          config,
          audit,
          runId,
          fence,
          summary,
          () => {
            if (leaseError) throw leaseError;
          }
        );
      } else if (entityType === "backers") {
        await this.recalculateBackers(
          config,
          audit,
          runId,
          fence,
          summary,
          () => {
            if (leaseError) throw leaseError;
          }
        );
      } else {
        await this.recalculateUsers(
          config,
          audit,
          runId,
          fence,
          summary,
          () => {
            if (leaseError) throw leaseError;
          }
        );
      }

      if (leaseError) throw leaseError;
      this.assertRunCalculatedRecords(entityType, summary);
      const result: RatingRunResult = {
        ...summary,
        durationMs: Date.now() - startedAt,
      };
      await this.configService.completeRun(entityType, runId, result);
      this.logger.log(
        `Rating run completed entity=${entityType} runId=${runId} scanned=${result.scanned} updated=${result.updated} errors=${result.errors}`
      );
    } catch (error) {
      const result: RatingRunResult = {
        ...summary,
        durationMs: Date.now() - startedAt,
      };
      await this.configService.failRun(entityType, runId, error, result);
      this.logger.error(
        `Rating run failed entity=${entityType} runId=${runId}: ${this.errorMessage(
          error
        )}`,
        error instanceof Error ? error.stack : undefined
      );
    } finally {
      clearInterval(heartbeatTimer);
    }
  }

  private async recalculateProjects(
    config: RatingEntityConfig,
    audit: Record<string, any>,
    runId: string,
    fence: number,
    summary: RunSummary,
    assertLease: () => void
  ): Promise<void> {
    const collection = this.dbCollection("projects");
    const cursor = collection
      .find(
        { projectType: { $in: ["project", "market"] } },
        { noCursorTimeout: true }
      )
      .batchSize(config.batchSize);
    const operations: any[] = [];

    try {
      for await (const project of cursor as any) {
        assertLease();
        summary.scanned += 1;
        try {
          const mode =
            String(project?.projectType || "").toLowerCase() === "market"
              ? "market"
              : "ico";
          const formula = config.formula.modes[mode];
          const scores = this.calculateProjectScores(
            project,
            mode,
            formula,
            audit
          );
          const set: Record<string, any> = {
            rating: String(scores.rating),
            fomoScore: scores.rating,
            fullness: `${scores.fullness}%`,
            ratingBreakdown: scores.ratingBreakdown,
            fullnessBreakdown: scores.fullnessBreakdown,
            lastRatingCalculatedAt: scores.ratingBreakdown.calculatedAt,
          };
          if (mode === "ico") set["rawIcoData.scoring"] = scores;

          operations.push({
            updateOne: {
              filter: this.fencedFilter(project._id, fence),
              update: {
                $set: { ...set, ratingRecalculationFence: fence },
              },
            },
          });
        } catch (error) {
          if (this.isLeaseLost(error)) throw error;
          summary.errors += 1;
          this.logger.warn(
            `Project rating failed id=${project?._id}: ${this.errorMessage(
              error
            )}`
          );
        }
        if (operations.length >= config.batchSize) {
          await this.flush(collection, operations, "projects", runId, summary);
        }
      }
      await this.flush(collection, operations, "projects", runId, summary);
    } finally {
      await cursor.close().catch(() => undefined);
    }
  }

  private async recalculateBackers(
    config: RatingEntityConfig,
    audit: Record<string, any>,
    runId: string,
    fence: number,
    summary: RunSummary,
    assertLease: () => void
  ): Promise<void> {
    // The admin entity name "backers" maps to the legacy `funds` collection,
    // which is the source consumed by the existing FundsRatingService.
    const collection = this.dbCollection("funds");
    const investors = this.dbCollection("investors");
    const cursor = collection
      .find({}, { noCursorTimeout: true })
      .batchSize(config.batchSize);
    const operations: any[] = [];
    const formula = config.formula.modes.default;

    try {
      for await (const fund of cursor as any) {
        assertLease();
        summary.scanned += 1;
        try {
          const investorDetail = await this.findInvestorDetail(investors, fund);
          const fullnessBase = this.fundsRatingService.calculateFullness(
            fund,
            investorDetail
          );
          const fullnessBreakdown = this.formulaService.applyFullness(
            fullnessBase,
            formula,
            audit
          );
          const ratingBase = this.fundsRatingService.calculateRating(
            fund,
            investorDetail,
            fullnessBreakdown.score
          );
          const ratingBreakdown = this.formulaService.applyRating(
            ratingBase,
            formula,
            audit
          );
          operations.push({
            updateOne: {
              filter: this.fencedFilter(fund._id, fence),
              update: {
                $set: {
                  rating: ratingBreakdown.score,
                  fomoScore: ratingBreakdown.score,
                  fullness: fullnessBreakdown.score,
                  tableRating: ratingBreakdown.score,
                  tableFullness: fullnessBreakdown.score,
                  ratingBreakdown,
                  fullnessBreakdown,
                  lastRatingCalculatedAt: ratingBreakdown.calculatedAt,
                  ratingRecalculationFence: fence,
                },
              },
            },
          });
        } catch (error) {
          if (this.isLeaseLost(error)) throw error;
          summary.errors += 1;
          this.logger.warn(
            `Backer rating failed id=${fund?._id}: ${this.errorMessage(error)}`
          );
        }
        if (operations.length >= config.batchSize) {
          await this.flush(collection, operations, "backers", runId, summary);
        }
      }
      await this.flush(collection, operations, "backers", runId, summary);
    } finally {
      await cursor.close().catch(() => undefined);
    }
  }

  private async recalculateUsers(
    config: RatingEntityConfig,
    audit: Record<string, any>,
    runId: string,
    fence: number,
    summary: RunSummary,
    assertLease: () => void
  ): Promise<void> {
    const collection = this.dbCollection("users");
    const cursor = collection
      .find({ role: "user", isCodeActivated: true }, { noCursorTimeout: true })
      .batchSize(config.batchSize);
    const operations: any[] = [];
    const formula = config.formula.modes.default;

    try {
      for await (const user of cursor as any) {
        assertLease();
        summary.scanned += 1;
        try {
          const fullnessBase = this.ratingService.calculateUserFullness(user);
          const fullnessBreakdown = this.formulaService.applyFullness(
            fullnessBase,
            formula,
            audit
          );
          const ratingBase = this.ratingService.calculateUserRatingBreakdown(
            user,
            fullnessBreakdown.score
          );
          const ratingBreakdown = this.formulaService.applyRating(
            ratingBase,
            formula,
            audit
          );
          operations.push({
            updateOne: {
              filter: this.fencedFilter(user._id, fence),
              update: {
                $set: {
                  rating: String(ratingBreakdown.score),
                  fomoScore: ratingBreakdown.score,
                  fullness: `${fullnessBreakdown.score}%`,
                  rank: this.ratingService.calculateUserRank(
                    user?.activityXP ?? user?.points
                  ),
                  ratingBreakdown,
                  fullnessBreakdown,
                  lastRatingCalculatedAt: ratingBreakdown.calculatedAt,
                  ratingRecalculationFence: fence,
                },
              },
            },
          });
        } catch (error) {
          if (this.isLeaseLost(error)) throw error;
          summary.errors += 1;
          this.logger.warn(
            `User rating failed id=${user?._id}: ${this.errorMessage(error)}`
          );
        }
        if (operations.length >= config.batchSize) {
          await this.flush(collection, operations, "users", runId, summary);
        }
      }
      await this.flush(collection, operations, "users", runId, summary);
    } finally {
      await cursor.close().catch(() => undefined);
    }
  }

  private calculateProjectScores(
    project: any,
    mode: "ico" | "market",
    formula: RatingFormulaModeConfig,
    audit: Record<string, any>
  ) {
    const fullnessBase =
      mode === "market"
        ? this.ratingService.calculateMarketProjectFullness(project)
        : this.ratingService.calculateIcoProjectFullness(project);
    const fullnessBreakdown = this.formulaService.applyFullness(
      fullnessBase,
      formula,
      audit
    );
    const ratingBase =
      mode === "market"
        ? this.ratingService.calculateMarketProjectRating(
            project,
            fullnessBreakdown.score
          )
        : this.ratingService.calculateIcoProjectRating(project);
    const ratingBreakdown = this.formulaService.applyRating(
      ratingBase,
      formula,
      audit
    );

    return {
      rating: ratingBreakdown.score,
      fullness: fullnessBreakdown.score,
      ratingBreakdown,
      fullnessBreakdown,
    };
  }

  private async flush(
    collection: any,
    operations: any[],
    entityType: RatingEntityType,
    runId: string,
    summary: RunSummary
  ): Promise<void> {
    if (!operations.length) return;
    await this.configService.heartbeat(entityType, runId);
    const batch = operations.slice();
    const result: any = await collection.bulkWrite(batch, { ordered: false });
    operations.splice(0, batch.length);
    summary.updated += Number(result?.modifiedCount || result?.nModified || 0);
  }

  private async findInvestorDetail(
    collection: any,
    fund: any
  ): Promise<any | null> {
    const or: any[] = [];
    if (fund?.slug) or.push({ slug: fund.slug });
    if (fund?.sourceKey) {
      or.push(
        { "sourceRefs.key": fund.sourceKey },
        { sourceId: fund.sourceKey }
      );
    }
    if (fund?.name) {
      or.push(
        { normalizedName: this.normalizeName(fund.name) },
        { name: fund.name }
      );
    }
    if (!or.length) return null;

    return collection.findOne(
      { $or: or },
      {
        sort: { lastDetailParsedAt: -1, lastSyncedAt: -1 },
        projection: { raw: 0, rawDetailData: 0, rawTableData: 0 },
      }
    );
  }

  private dbCollection(name: string): any {
    if (!this.connection.db) {
      throw new Error("Mongo connection is not ready");
    }
    return this.connection.db.collection(name);
  }

  private fencedFilter(id: any, fence: number): Record<string, any> {
    return {
      _id: id,
      $or: [
        { ratingRecalculationFence: { $exists: false } },
        { ratingRecalculationFence: { $lt: fence } },
      ],
    };
  }

  private entityType(value: unknown): RatingEntityType {
    const normalized = String(value || "").trim();
    if ((RATING_ENTITY_TYPES as readonly string[]).includes(normalized)) {
      return normalized as RatingEntityType;
    }
    throw new BadRequestException(
      `entityType must be one of: ${RATING_ENTITY_TYPES.join(", ")}`
    );
  }

  private assertRunCalculatedRecords(
    entityType: RatingEntityType,
    summary: RunSummary
  ): void {
    if (summary.scanned > 0 && summary.errors >= summary.scanned) {
      throw new Error(
        `Rating run could not calculate any ${entityType} records (${summary.errors}/${summary.scanned} failed)`
      );
    }
  }

  private normalizeName(value: unknown): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : String(error || "Unknown error");
  }

  private isLeaseLost(error: unknown): boolean {
    return this.errorMessage(error).includes("lease was lost");
  }
}
