import { Injectable } from "@nestjs/common";
import { FomoV2BackerListReadModelService } from "../../backers/services/backer-list-read-model.service";
import { FomoV2BackerPortfolioRebuildService } from "../../backers/services/backer-portfolio-rebuild.service";
import { FomoV2BackerReadService } from "../../backers/services/backer-read.service";
import { FomoV2FundingFeedReadModelService } from "../../funding/services/funding-feed-read-model.service";
import { FomoV2FundingFeedReadService } from "../../funding/services/funding-feed-read.service";
import { FomoV2IcoProjectReadService } from "../../ico/services/ico-project-read.service";
import { FomoV2MarketProjectReadModelService } from "../../market/services/market-project-read-model.service";

export type FomoV2PostWriteMaterializationStatus =
  | "completed"
  | "partial"
  | "skipped";

export type FomoV2PostWriteMaterializationStepStatus =
  | "completed"
  | "partial"
  | "failed";

export type FomoV2PostWriteMaterializationProgressPhase =
  | "before-step"
  | "after-batch"
  | "after-step";

export interface FomoV2PostWriteMaterializationProgress {
  parserKey: string;
  phase: FomoV2PostWriteMaterializationProgressPhase;
  step: FomoV2PostWriteMaterializationStepKey;
  stepIndex: number;
  stepCount: number;
  batch: number;
  scanned: number;
  written: number;
  status?: FomoV2PostWriteMaterializationStepStatus;
}

export interface FomoV2PostWriteMaterializationOptions {
  parserKey: string;
  write: boolean;
  batchSize?: number;
  assertExecutionActive?: () => void | Promise<void>;
  onProgress?: (
    progress: FomoV2PostWriteMaterializationProgress
  ) => void | Promise<void>;
}

export interface FomoV2PostWriteMaterializationStepResult {
  key: FomoV2PostWriteMaterializationStepKey;
  status: FomoV2PostWriteMaterializationStepStatus;
  durationMs: number;
  batches: number;
  scanned: number;
  written: number;
  routes: string[];
  inline?: boolean;
  message?: string;
  error?: string;
  details?: Record<string, any>;
}

export interface FomoV2PostWriteMaterializationResult {
  parserKey: string;
  mode: "dry-run" | "write";
  status: FomoV2PostWriteMaterializationStatus;
  durationMs: number;
  scanned: number;
  written: number;
  routes: string[];
  affectedRoutes: string[];
  skippedReason?: string;
  steps: FomoV2PostWriteMaterializationStepResult[];
  errors: Array<{ step: string; message: string }>;
}

export type FomoV2PostWriteMaterializationStepKey =
  | "ico-project-read-model:inline"
  | "market-project-read-model:inline"
  | "unlock-events:inline"
  | "market-project-read-model"
  | "backer-portfolio-holdings"
  | "backer-list-read-model"
  | "backer-analytics-snapshots"
  | "funding-feed-read-model"
  | "ico-project-funding-read-model";

interface StepMetrics {
  batches: number;
  scanned: number;
  written: number;
  status?: FomoV2PostWriteMaterializationStepStatus;
  inline?: boolean;
  message?: string;
  error?: string;
  details?: Record<string, any>;
}

interface StepExecutionContext {
  parserKey: string;
  batchSize: number;
  stepIndex: number;
  stepCount: number;
  assertExecutionActive?: () => void | Promise<void>;
  onProgress?: (
    progress: FomoV2PostWriteMaterializationProgress
  ) => void | Promise<void>;
}

class FomoV2PostWriteProgressCallbackError extends Error {
  constructor(message: string, readonly cause?: any) {
    super(message);
    this.name = "FomoV2PostWriteProgressCallbackError";
  }
}

class FomoV2PostWriteExecutionFenceError extends Error {
  constructor(message: string, readonly cause?: any) {
    super(message);
    this.name = "FomoV2PostWriteExecutionFenceError";
  }
}

class FomoV2PostWritePagedStepError extends Error {
  constructor(
    message: string,
    readonly metrics: StepMetrics,
    readonly cause?: any
  ) {
    super(message);
    this.name = "FomoV2PostWritePagedStepError";
  }
}

const DEFAULT_BATCH_SIZE = 500;
const MAX_BATCH_SIZE = 5_000;
const MAX_BATCHES_PER_STEP = 100_000;

const MATERIALIZATION_PLANS: Readonly<
  Record<string, readonly FomoV2PostWriteMaterializationStepKey[]>
> = Object.freeze({
  "funding:dropstab": [
    "market-project-read-model",
    "backer-portfolio-holdings",
    "backer-list-read-model",
    "funding-feed-read-model",
    "ico-project-funding-read-model",
    "backer-analytics-snapshots",
  ],
  "funding:icodrops": [
    "market-project-read-model",
    "backer-portfolio-holdings",
    "backer-list-read-model",
    "funding-feed-read-model",
    "ico-project-funding-read-model",
    "backer-analytics-snapshots",
  ],
  "funding:intel_fundraising": [
    "market-project-read-model",
    "backer-portfolio-holdings",
    "backer-list-read-model",
    "funding-feed-read-model",
    "ico-project-funding-read-model",
    "backer-analytics-snapshots",
  ],
  "backers:dropstab": [
    "market-project-read-model",
    "backer-portfolio-holdings",
    "backer-list-read-model",
    "funding-feed-read-model",
    "ico-project-funding-read-model",
    "backer-analytics-snapshots",
  ],
  "backers:intel": [
    "market-project-read-model",
    "backer-portfolio-holdings",
    "backer-list-read-model",
    "funding-feed-read-model",
    "ico-project-funding-read-model",
    "backer-analytics-snapshots",
  ],
  "ico:icodrops": [
    "ico-project-read-model:inline",
    "market-project-read-model",
    "backer-list-read-model",
    "funding-feed-read-model",
    "ico-project-funding-read-model",
    "backer-analytics-snapshots",
  ],
  "vesting:dropstab": ["market-project-read-model"],
  "unlocks:dropstab": ["unlock-events:inline", "market-project-read-model"],
  "market:coingecko": [
    "market-project-read-model:inline",
    "backer-portfolio-holdings",
    "backer-list-read-model",
    "funding-feed-read-model",
    "backer-analytics-snapshots",
  ],
  "activities:dropstab": [],
  "activities:icodrops": [],
  "activities:legacy": [],
});

const INLINE_STEP_MESSAGES: Readonly<
  Partial<Record<FomoV2PostWriteMaterializationStepKey, string>>
> = Object.freeze({
  "ico-project-read-model:inline":
    "ico:icodrops writes ico_project_read_models inside its source-specific importer.",
  "market-project-read-model:inline":
    "market:coingecko writes market_project_read_models inside its source-specific importer.",
  "unlock-events:inline":
    "unlocks:dropstab writes unlock_events directly; /crypto/unlocking reads that collection live.",
});

const STEP_ROUTES: Readonly<
  Record<FomoV2PostWriteMaterializationStepKey, readonly string[]>
> = Object.freeze({
  "ico-project-read-model:inline": ["/crypto/projects"],
  "market-project-read-model:inline": ["/crypto/projects", "/crypto/unlocking"],
  "unlock-events:inline": ["/crypto/unlocking"],
  "market-project-read-model": ["/crypto/projects", "/crypto/unlocking"],
  "backer-portfolio-holdings": ["/crypto/backers"],
  "backer-list-read-model": ["/crypto/backers"],
  "backer-analytics-snapshots": ["/crypto/backers"],
  "funding-feed-read-model": ["/crypto/funding-feed"],
  "ico-project-funding-read-model": ["/crypto/projects"],
});

@Injectable()
export class FomoV2PostWriteMaterializationService {
  constructor(
    private readonly marketReadModel: FomoV2MarketProjectReadModelService,
    private readonly backerPortfolio: FomoV2BackerPortfolioRebuildService,
    private readonly backerListReadModel: FomoV2BackerListReadModelService,
    private readonly fundingFeedReadModel: FomoV2FundingFeedReadModelService,
    private readonly backerReadService: FomoV2BackerReadService,
    private readonly fundingFeedReadService: FomoV2FundingFeedReadService,
    private readonly icoProjectReadService: FomoV2IcoProjectReadService
  ) {}

  async run(
    options: FomoV2PostWriteMaterializationOptions
  ): Promise<FomoV2PostWriteMaterializationResult> {
    const startedAt = Date.now();
    const parserKey = this.normalizeParserKey(options.parserKey);
    const mode = options.write ? "write" : "dry-run";
    const plan = MATERIALIZATION_PLANS[parserKey];
    const affectedRoutes = this.routesForPlan(plan || []);

    if (!options.write) {
      return this.skippedResult(
        parserKey,
        mode,
        startedAt,
        "post-write materialization is skipped in dry-run mode",
        affectedRoutes
      );
    }

    if (!plan) {
      return this.skippedResult(
        parserKey,
        mode,
        startedAt,
        "parserKey has no source-isolated post-write materialization plan",
        []
      );
    }
    if (!plan.length) {
      return this.skippedResult(
        parserKey,
        mode,
        startedAt,
        "parser pipeline does not affect the requested materialized read models",
        []
      );
    }

    const batchSize = this.positiveInteger(
      options.batchSize,
      DEFAULT_BATCH_SIZE,
      MAX_BATCH_SIZE
    );
    const steps: FomoV2PostWriteMaterializationStepResult[] = [];

    for (const [index, stepKey] of plan.entries()) {
      steps.push(
        await this.executeStep(stepKey, {
          parserKey,
          batchSize,
          stepIndex: index + 1,
          stepCount: plan.length,
          assertExecutionActive: options.assertExecutionActive,
          onProgress: options.onProgress,
        })
      );
    }

    const errors = steps
      .filter((step) => step.status !== "completed")
      .map((step) => ({
        step: step.key,
        message: step.error || "Post-write materialization step failed.",
      }));

    // The backing collections are current now; do not keep serving a stale
    // process-local projection from the API instance which ran the worker.
    this.fundingFeedReadService.invalidateReadModelReadinessCache();
    this.icoProjectReadService.invalidateCaches();

    return {
      parserKey,
      mode,
      status: errors.length ? "partial" : "completed",
      durationMs: Date.now() - startedAt,
      scanned: steps.reduce((total, step) => total + step.scanned, 0),
      written: steps.reduce((total, step) => total + step.written, 0),
      routes: affectedRoutes,
      affectedRoutes,
      steps,
      errors,
    };
  }

  private async executeStep(
    stepKey: FomoV2PostWriteMaterializationStepKey,
    context: StepExecutionContext
  ): Promise<FomoV2PostWriteMaterializationStepResult> {
    const startedAt = Date.now();
    const routes = [...STEP_ROUTES[stepKey]];

    await this.emitProgress(context.onProgress, {
      parserKey: context.parserKey,
      phase: "before-step",
      step: stepKey,
      stepIndex: context.stepIndex,
      stepCount: context.stepCount,
      batch: 0,
      scanned: 0,
      written: 0,
    });

    try {
      const metrics = await this.withActiveFence(
        context.assertExecutionActive,
        () => this.executeStepBody(stepKey, context)
      );

      const result: FomoV2PostWriteMaterializationStepResult = {
        key: stepKey,
        status: metrics.status || "completed",
        durationMs: Date.now() - startedAt,
        routes,
        ...metrics,
      };

      await this.emitProgress(context.onProgress, {
        parserKey: context.parserKey,
        phase: "after-step",
        step: stepKey,
        stepIndex: context.stepIndex,
        stepCount: context.stepCount,
        batch: result.batches,
        scanned: result.scanned,
        written: result.written,
        status: result.status,
      });

      return result;
    } catch (error: any) {
      if (error instanceof FomoV2PostWriteProgressCallbackError) throw error;
      if (error instanceof FomoV2PostWriteExecutionFenceError) {
        throw error.cause || error;
      }

      const partialMetrics =
        error instanceof FomoV2PostWritePagedStepError
          ? error.metrics
          : undefined;
      const result: FomoV2PostWriteMaterializationStepResult = {
        key: stepKey,
        status: partialMetrics?.batches ? "partial" : "failed",
        durationMs: Date.now() - startedAt,
        batches: partialMetrics?.batches || 0,
        scanned: partialMetrics?.scanned || 0,
        written: partialMetrics?.written || 0,
        routes,
        error: this.errorMessage(error),
        details: partialMetrics?.details,
      };

      await this.emitProgress(context.onProgress, {
        parserKey: context.parserKey,
        phase: "after-step",
        step: stepKey,
        stepIndex: context.stepIndex,
        stepCount: context.stepCount,
        batch: result.batches,
        scanned: result.scanned,
        written: result.written,
        status: result.status,
      });

      return result;
    }
  }

  private async executeStepBody(
    stepKey: FomoV2PostWriteMaterializationStepKey,
    context: StepExecutionContext
  ): Promise<StepMetrics> {
    const inlineMessage = INLINE_STEP_MESSAGES[stepKey];
    if (inlineMessage) {
      return {
        batches: 0,
        scanned: 0,
        written: 0,
        inline: true,
        message: inlineMessage,
      };
    }

    switch (stepKey) {
      case "market-project-read-model":
        return this.materializeMarketReadModel(context);
      case "backer-portfolio-holdings":
        return this.materializeBackerPortfolio(context);
      case "backer-list-read-model":
        return this.materializeBackerListReadModel(context);
      case "backer-analytics-snapshots":
        return this.materializeBackerAnalyticsSnapshots(context);
      case "funding-feed-read-model":
        return this.materializeFundingFeedReadModel(context);
      case "ico-project-funding-read-model":
        return this.materializeIcoProjectFundingReadModel(context);
      default:
        throw new Error(
          `Unsupported post-write materialization step: ${stepKey}`
        );
    }
  }

  private materializeMarketReadModel(
    context: StepExecutionContext
  ): Promise<StepMetrics> {
    return this.runPagedStep({
      parserKey: context.parserKey,
      stepKey: "market-project-read-model",
      stepIndex: context.stepIndex,
      stepCount: context.stepCount,
      batchSize: context.batchSize,
      assertExecutionActive: context.assertExecutionActive,
      onProgress: context.onProgress,
      executeBatch: (offset, limit) =>
        this.marketReadModel.materializeFromV2Identity({
          offset,
          limit,
          write: true,
          confirmWrite: true,
          writePolicyParserKey: context.parserKey,
          assertExecutionActive: () =>
            this.assertExecutionActive(context.assertExecutionActive),
        }),
      scanned: (result) => Number(result?.scannedMarketAssets || 0),
      written: (result) => Number(result?.written || 0),
      details: (result) => ({
        built: Number(result?.built || 0),
        missingCanonicalLink: Number(
          result?.skipped?.missingCanonicalLink || 0
        ),
        tierFiltered: Number(result?.skipped?.tierFiltered || 0),
      }),
    });
  }

  private async materializeBackerPortfolio(
    context: StepExecutionContext
  ): Promise<StepMetrics> {
    const result = await this.withActiveFence(
      context.assertExecutionActive,
      () =>
        this.backerPortfolio.run({
          write: true,
          dryRun: false,
          replaceExisting: false,
          assertExecutionActive: () =>
            this.assertExecutionActive(context.assertExecutionActive),
        })
    );
    const errors = Array.isArray(result?.errors) ? result.errors.length : 0;
    const scanned = Number(result?.participantsScanned || 0);
    const written = Number(result?.holdingsCreated || 0);

    await this.emitProgress(context.onProgress, {
      parserKey: context.parserKey,
      phase: "after-batch",
      step: "backer-portfolio-holdings",
      stepIndex: context.stepIndex,
      stepCount: context.stepCount,
      batch: 1,
      scanned,
      written,
      status: errors ? "partial" : "completed",
    });

    return {
      batches: 1,
      scanned,
      written,
      status: errors ? "partial" : "completed",
      error: errors
        ? `Backer portfolio rebuild completed with ${errors} item error(s).`
        : undefined,
      details: {
        holdingsDeleted: Number(result?.holdingsDeleted || 0),
        holdingsWithMarketData: Number(result?.holdingsWithMarketData || 0),
        holdingsWithoutMarketData: Number(
          result?.holdingsWithoutMarketData || 0
        ),
        errors,
      },
    };
  }

  private materializeBackerListReadModel(
    context: StepExecutionContext
  ): Promise<StepMetrics> {
    return this.runPagedStep({
      parserKey: context.parserKey,
      stepKey: "backer-list-read-model",
      stepIndex: context.stepIndex,
      stepCount: context.stepCount,
      batchSize: context.batchSize,
      assertExecutionActive: context.assertExecutionActive,
      onProgress: context.onProgress,
      executeBatch: (offset, limit) =>
        this.backerListReadModel.materialize({
          offset,
          limit,
          write: true,
          confirmWrite: true,
          assertExecutionActive: () =>
            this.assertExecutionActive(context.assertExecutionActive),
        }),
      scanned: (result) => Number(result?.scannedBackers || 0),
      written: (result) => Number(result?.written || 0),
      details: (result) => ({
        built: Number(result?.built || 0),
        missingBackerId: Number(result?.skipped?.missingBackerId || 0),
        missingName: Number(result?.skipped?.missingName || 0),
      }),
    });
  }

  private materializeFundingFeedReadModel(
    context: StepExecutionContext
  ): Promise<StepMetrics> {
    return this.runPagedStep({
      parserKey: context.parserKey,
      stepKey: "funding-feed-read-model",
      stepIndex: context.stepIndex,
      stepCount: context.stepCount,
      batchSize: context.batchSize,
      assertExecutionActive: context.assertExecutionActive,
      onProgress: context.onProgress,
      executeBatch: (offset, limit) =>
        this.fundingFeedReadModel.materialize({
          offset,
          limit,
          write: true,
          confirmWrite: true,
          assertExecutionActive: () =>
            this.assertExecutionActive(context.assertExecutionActive),
        }),
      scanned: (result) => Number(result?.scannedRounds || 0),
      written: (result) => Number(result?.written || 0),
      details: (result) => ({
        built: Number(result?.built || 0),
        duplicateSourceRounds: Number(
          result?.skipped?.duplicateSourceRounds || 0
        ),
        missingFundingRoundId: Number(
          result?.skipped?.missingFundingRoundId || 0
        ),
        missingCanonicalProjectId: Number(
          result?.skipped?.missingCanonicalProjectId || 0
        ),
      }),
    });
  }

  private materializeIcoProjectFundingReadModel(
    context: StepExecutionContext
  ): Promise<StepMetrics> {
    return this.runPagedStep({
      parserKey: context.parserKey,
      stepKey: "ico-project-funding-read-model",
      stepIndex: context.stepIndex,
      stepCount: context.stepCount,
      batchSize: context.batchSize,
      assertExecutionActive: context.assertExecutionActive,
      onProgress: context.onProgress,
      executeBatch: (offset, limit) =>
        this.fundingFeedReadModel.materializeIcoProjectFunding({
          offset,
          limit,
          write: true,
          confirmWrite: true,
          assertExecutionActive: () =>
            this.assertExecutionActive(context.assertExecutionActive),
        }),
      scanned: (result) => Number(result?.scannedProjects || 0),
      written: (result) => Number(result?.written || 0),
      details: (result) => ({
        scannedRounds: Number(result?.scannedRounds || 0),
        built: Number(result?.built || 0),
        withFunding: Number(result?.withFunding || 0),
        withoutFunding: Number(result?.withoutFunding || 0),
        dropstabRounds: Number(result?.sourceCounts?.dropstab || 0),
        icodropsRounds: Number(result?.sourceCounts?.icodrops || 0),
        intelFundraisingRounds: Number(
          result?.sourceCounts?.intel_fundraising || 0
        ),
      }),
    });
  }

  private async materializeBackerAnalyticsSnapshots(
    context: StepExecutionContext
  ): Promise<StepMetrics> {
    const result = await this.withActiveFence(
      context.assertExecutionActive,
      () =>
        this.backerReadService.refreshAnalyticsSnapshots(
          `parser-post-write:${context.parserKey}`,
          () => this.assertExecutionActive(context.assertExecutionActive)
        )
    );
    const snapshots = Array.isArray(result?.snapshots)
      ? result.snapshots.length
      : 0;
    const skipped = result?.skipped === true;

    await this.emitProgress(context.onProgress, {
      parserKey: context.parserKey,
      phase: "after-batch",
      step: "backer-analytics-snapshots",
      stepIndex: context.stepIndex,
      stepCount: context.stepCount,
      batch: 1,
      scanned: snapshots,
      written: skipped ? 0 : snapshots,
      status: skipped ? "partial" : "completed",
    });

    return {
      batches: 1,
      scanned: snapshots,
      written: skipped ? 0 : snapshots,
      status: skipped ? "partial" : "completed",
      error: skipped
        ? String(result?.reason || "Backer analytics snapshot refresh skipped.")
        : undefined,
      details: {
        snapshots,
        skipped: skipped ? 1 : 0,
      },
    };
  }

  private async runPagedStep(input: {
    parserKey: string;
    stepKey: FomoV2PostWriteMaterializationStepKey;
    stepIndex: number;
    stepCount: number;
    batchSize: number;
    assertExecutionActive?: () => void | Promise<void>;
    onProgress?: (
      progress: FomoV2PostWriteMaterializationProgress
    ) => void | Promise<void>;
    executeBatch: (offset: number, limit: number) => Promise<any>;
    scanned: (result: any) => number;
    written: (result: any) => number;
    details?: (result: any) => Record<string, number>;
  }): Promise<StepMetrics> {
    let offset = 0;
    let batches = 0;
    let scanned = 0;
    let written = 0;
    const details: Record<string, number> = {};

    while (batches < MAX_BATCHES_PER_STEP) {
      let result: any;
      try {
        result = await this.withActiveFence(input.assertExecutionActive, () =>
          input.executeBatch(offset, input.batchSize)
        );
      } catch (error) {
        if (error instanceof FomoV2PostWriteExecutionFenceError) {
          throw error;
        }
        await this.emitProgress(input.onProgress, {
          parserKey: input.parserKey,
          phase: "after-batch",
          step: input.stepKey,
          stepIndex: input.stepIndex,
          stepCount: input.stepCount,
          batch: batches + 1,
          scanned,
          written,
          status: "failed",
        });
        if (error instanceof FomoV2PostWriteProgressCallbackError) throw error;
        throw new FomoV2PostWritePagedStepError(
          this.errorMessage(error),
          { batches, scanned, written, details },
          error
        );
      }
      const batchScanned = Math.max(0, input.scanned(result));
      const batchWritten = Math.max(0, input.written(result));

      batches += 1;
      scanned += batchScanned;
      written += batchWritten;
      this.addDetails(details, input.details?.(result));

      await this.emitProgress(input.onProgress, {
        parserKey: input.parserKey,
        phase: "after-batch",
        step: input.stepKey,
        stepIndex: input.stepIndex,
        stepCount: input.stepCount,
        batch: batches,
        scanned,
        written,
        status: "completed",
      });

      if (batchScanned < input.batchSize) {
        return { batches, scanned, written, details };
      }

      offset += batchScanned;
    }

    throw new Error(
      `Post-write materialization exceeded ${MAX_BATCHES_PER_STEP} batches.`
    );
  }

  private async withActiveFence<T>(
    assertExecutionActive: (() => void | Promise<void>) | undefined,
    operation: () => Promise<T>
  ): Promise<T> {
    await this.assertExecutionActive(assertExecutionActive);

    let result: T;
    let operationError: any;
    try {
      result = await operation();
    } catch (error: any) {
      operationError = error;
    }

    await this.assertExecutionActive(assertExecutionActive);

    if (operationError) throw operationError;
    return result!;
  }

  private async assertExecutionActive(
    callback: (() => void | Promise<void>) | undefined
  ): Promise<void> {
    if (!callback) return;
    try {
      await callback();
    } catch (error: any) {
      throw new FomoV2PostWriteExecutionFenceError(
        this.errorMessage(error),
        error
      );
    }
  }

  private async emitProgress(
    onProgress:
      | ((
          progress: FomoV2PostWriteMaterializationProgress
        ) => void | Promise<void>)
      | undefined,
    progress: FomoV2PostWriteMaterializationProgress
  ): Promise<void> {
    if (!onProgress) return;

    try {
      await onProgress(progress);
    } catch (error: any) {
      throw new FomoV2PostWriteProgressCallbackError(
        `Post-write materialization progress callback failed: ${this.errorMessage(
          error
        )}`,
        error
      );
    }
  }

  private addDetails(
    target: Record<string, number>,
    values: Record<string, number> | undefined
  ): void {
    for (const [key, value] of Object.entries(values || {})) {
      target[key] = Number(target[key] || 0) + Number(value || 0);
    }
  }

  private skippedResult(
    parserKey: string,
    mode: "dry-run" | "write",
    startedAt: number,
    skippedReason: string,
    affectedRoutes: string[]
  ): FomoV2PostWriteMaterializationResult {
    return {
      parserKey,
      mode,
      status: "skipped",
      durationMs: Date.now() - startedAt,
      scanned: 0,
      written: 0,
      routes: affectedRoutes,
      affectedRoutes,
      skippedReason,
      steps: [],
      errors: [],
    };
  }

  private routesForPlan(
    plan: readonly FomoV2PostWriteMaterializationStepKey[]
  ): string[] {
    return Array.from(
      new Set(plan.flatMap((stepKey) => [...STEP_ROUTES[stepKey]]))
    );
  }

  private normalizeParserKey(value: string): string {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  private positiveInteger(
    value: number | undefined,
    fallback: number,
    maximum: number
  ): number {
    const parsed = Math.floor(Number(value));
    if (!Number.isFinite(parsed) || parsed < 1) return fallback;
    return Math.min(parsed, maximum);
  }

  private errorMessage(error: any): string {
    return String(error?.message || error || "Unknown materialization error");
  }
}
