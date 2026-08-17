import { Injectable, Logger, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import { Model, Types } from "mongoose";
import { projectSourceTypeMongoPattern } from "../../../shared/source-policy";
import { FomoV2ParserControlPolicyService } from "../../parser-control/services/parser-control-policy.service";
import {
  FomoV2TokenAllocation,
  FomoV2VestingRound,
  FomoV2VestingSchedule,
  FomoV2VestingSummary,
} from "../../vesting/models";
import { FomoV2UnlockEvent } from "../models";

const DEFAULT_UNLOCK_EVENT_APPLY_CRON =
  process.env.FOMO_V2_UNLOCK_APPLY_CRON || "0 */10 * * * *";
const DEFAULT_BATCH_LIMIT = 500;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_LOCK_TTL_MS = 30 * 60 * 1000;
const RUNNER_NAME = "fomo-v2:unlock-event-apply";

export interface FomoV2UnlockEventApplyOptions {
  limit?: number;
  now?: Date | string;
  write?: boolean;
  dryRun?: boolean;
  canonicalProjectId?: Types.ObjectId | string;
  sourceType?: string;
  maxAttempts?: number;
}

export interface FomoV2UnlockEventApplyResult {
  mode: "dry-run" | "write";
  dryRun: boolean;
  now: string;
  limit: number;
  scannedEvents: number;
  eventsApplied: number;
  eventsWouldApply: number;
  eventsSkipped: number;
  eventsWouldSkip: number;
  eventsFailed: number;
  eventsWouldFail: number;
  claimSkipped: number;
  vestingSchedulesUpdated: number;
  vestingRoundsUpdated: number;
  vestingSummariesUpdated: number;
  samples: Array<Record<string, any>>;
  errors: Array<Record<string, any>>;
}

interface ApplyContext {
  write: boolean;
  now: Date;
  maxAttempts: number;
  result: FomoV2UnlockEventApplyResult;
}

interface ResolvedTargets {
  schedule?: any;
  round?: any;
  allocation?: any;
  summary?: any;
}

@Injectable()
export class FomoV2UnlockEventApplyService {
  private readonly logger = new Logger(FomoV2UnlockEventApplyService.name);
  private running = false;

  constructor(
    @InjectModel(FomoV2UnlockEvent.name)
    private readonly unlockEventModel: Model<FomoV2UnlockEvent>,
    @InjectModel(FomoV2TokenAllocation.name)
    private readonly tokenAllocationModel: Model<FomoV2TokenAllocation>,
    @InjectModel(FomoV2VestingRound.name)
    private readonly vestingRoundModel: Model<FomoV2VestingRound>,
    @InjectModel(FomoV2VestingSchedule.name)
    private readonly vestingScheduleModel: Model<FomoV2VestingSchedule>,
    @InjectModel(FomoV2VestingSummary.name)
    private readonly vestingSummaryModel: Model<FomoV2VestingSummary>,
    private readonly configService: ConfigService,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService
  ) {}

  @Cron(DEFAULT_UNLOCK_EVENT_APPLY_CRON, {
    name: "fomo-v2-unlock-event-apply",
  })
  async handleCron(): Promise<void> {
    if (!this.cronEnabled()) return;
    if (
      this.parserControlPolicy &&
      !(await this.parserControlPolicy.canWriteDomainData("unlocks:dropstab"))
    ) {
      return;
    }
    if (this.running) {
      this.logger.warn("Unlock event apply cron skipped: previous run is active.");
      return;
    }

    this.running = true;
    try {
      const result = await this.run({
        write: true,
        limit: this.batchLimit(),
        maxAttempts: this.maxAttempts(),
      });
      if (
        result.scannedEvents > 0 ||
        result.eventsApplied > 0 ||
        result.eventsFailed > 0
      ) {
        this.logger.log(
          `Unlock event apply cron completed: scanned=${result.scannedEvents} applied=${result.eventsApplied} skipped=${result.eventsSkipped} failed=${result.eventsFailed}`
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Unlock event apply cron failed: ${error?.message || error}`,
        error?.stack
      );
    } finally {
      this.running = false;
    }
  }

  async run(
    options: FomoV2UnlockEventApplyOptions = {}
  ): Promise<FomoV2UnlockEventApplyResult> {
    const write = Boolean(options.write) && options.dryRun !== true;
    if (write && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        "unlocks:dropstab"
      );
    }
    const now = this.toDate(options.now) || new Date();
    const limit = this.positiveInteger(options.limit, this.batchLimit());
    const maxAttempts = this.positiveInteger(
      options.maxAttempts,
      this.maxAttempts()
    );
    const result = this.emptyResult(write, now, limit);
    const filter = this.buildDueFilter(now, maxAttempts, options);
    const events = await this.unlockEventModel
      .find(filter)
      .sort({ unlockDate: 1, _id: 1 } as any)
      .limit(limit)
      .lean();

    for (const event of events as any[]) {
      result.scannedEvents += 1;
      try {
        const applyEvent = write
          ? await this.claimEvent(event, now, maxAttempts)
          : event;
        if (!applyEvent) {
          result.claimSkipped += 1;
          continue;
        }
        await this.applyOne(applyEvent, { write, now, maxAttempts, result });
      } catch (error: any) {
        await this.failEvent(event, contextlessErrorReason(error), {
          write,
          now,
          result,
        });
      }
    }

    return result;
  }

  private async applyOne(event: any, context: ApplyContext): Promise<void> {
    const unlockDate = this.toDate(event?.unlockDate);
    const amount = this.firstPositiveNumber(event?.amount);
    if (!unlockDate) {
      await this.skipEvent(event, "missing_unlock_date", context);
      return;
    }
    if (amount === undefined) {
      await this.skipEvent(event, "missing_unlock_amount", context);
      return;
    }

    const targets = await this.resolveTargets(event);
    if (!targets.schedule && !targets.round) {
      await this.failEvent(event, "missing_vesting_relation", context);
      return;
    }

    const totalAmount = this.firstPositiveNumber(
      targets.round?.totalAmount,
      targets.allocation?.amount
    );
    if (totalAmount === undefined) {
      await this.failEvent(event, "missing_vesting_total_amount", context);
      return;
    }

    const existingUnlockedAmount = this.firstNonNegativeNumber(
      targets.round?.unlockedAmountSource,
      this.amountFromPercent(totalAmount, targets.round?.unlockedPercentSource),
      this.amountFromPercent(
        totalAmount,
        targets.schedule?.currentUnlockedPercentSource
      ),
      0
    );
    const previousUnlockedAmount = Number(existingUnlockedAmount || 0);
    const newUnlockedAmount = this.roundNumber(
      Math.min(totalAmount, previousUnlockedAmount + amount),
      6
    );
    const lockedAmount = this.roundNumber(
      Math.max(0, totalAmount - newUnlockedAmount),
      6
    );
    const newUnlockedPercent = this.roundNumber(
      (newUnlockedAmount / totalAmount) * 100,
      6
    );
    const newLockedPercent = this.roundNumber(
      Math.max(0, 100 - newUnlockedPercent),
      6
    );
    const previousUnlockedPercent = this.percentFromAmount(
      previousUnlockedAmount,
      totalAmount
    );
    const appliedTo = {
      vestingScheduleId: this.toIdString(targets.schedule?._id),
      vestingRoundId: this.toIdString(targets.round?._id),
      vestingSummaryId: this.toIdString(targets.summary?._id),
      appliedAmount: amount,
      previousUnlockedAmount,
      newUnlockedAmount,
      previousUnlockedPercent,
      newUnlockedPercent,
      runner: RUNNER_NAME,
    };

    if (!context.write) {
      context.result.eventsWouldApply += 1;
      this.pushSample(context.result, event, {
        status: "would_apply",
        ...appliedTo,
      });
      return;
    }

    if (targets.round) {
      await this.vestingRoundModel.updateOne(
        { _id: targets.round._id },
        {
          $set: {
            unlockedAmountSource: newUnlockedAmount,
            lockedAmountSource: lockedAmount,
            unlockedPercentSource: newUnlockedPercent,
            lockedPercentSource: newLockedPercent,
            "metadata.unlockEvents.lastAppliedEventId": this.toIdString(
              event?._id
            ),
            "metadata.unlockEvents.lastAppliedEventDate": unlockDate,
            "metadata.unlockEvents.lastAppliedAt": context.now,
          },
        }
      );
      context.result.vestingRoundsUpdated += 1;
    }

    if (targets.schedule) {
      await this.vestingScheduleModel.updateOne(
        { _id: targets.schedule._id },
        {
          $set: {
            currentUnlockedPercentSource: newUnlockedPercent,
            currentLockedPercentSource: newLockedPercent,
            "metadata.unlockEvents.lastAppliedEventId": this.toIdString(
              event?._id
            ),
            "metadata.unlockEvents.lastAppliedEventDate": unlockDate,
            "metadata.unlockEvents.lastAppliedAt": context.now,
          },
        }
      );
      context.result.vestingSchedulesUpdated += 1;
    }

    if (targets.summary) {
      const summaryUpdate = await this.buildSummaryUpdate(
        targets.summary,
        event,
        amount,
        unlockDate,
        context.now
      );
      if (summaryUpdate) {
        await this.vestingSummaryModel.updateOne(
          { _id: targets.summary._id },
          { $set: summaryUpdate }
        );
        context.result.vestingSummariesUpdated += 1;
      }
    }

    await this.unlockEventModel.updateOne(
      { _id: event._id },
      {
        $set: {
          appliedAt: context.now,
          appliedStatus: "applied",
          appliedTo,
          lastApplyAttemptAt: context.now,
        },
        $unset: { applyError: "" },
      }
    );
    context.result.eventsApplied += 1;
    this.pushSample(context.result, event, { status: "applied", ...appliedTo });
  }

  private async resolveTargets(event: any): Promise<ResolvedTargets> {
    let schedule = await this.findById(
      this.vestingScheduleModel,
      event?.vestingScheduleId
    );
    let round = await this.findById(this.vestingRoundModel, event?.vestingRoundId);

    if (!schedule && round?._id) {
      schedule = await this.vestingScheduleModel
        .findOne({ vestingRoundId: round._id })
        .lean();
    }
    if (!round && schedule?.vestingRoundId) {
      round = await this.findById(this.vestingRoundModel, schedule.vestingRoundId);
    }

    if (!round || !schedule) {
      const fallback = this.fallbackRelationQuery(event);
      if (fallback) {
        if (!round) {
          round = await this.vestingRoundModel.findOne(fallback).lean();
        }
        if (!schedule) {
          schedule = await this.vestingScheduleModel.findOne(fallback).lean();
        }
      }
    }

    const allocationId =
      event?.tokenAllocationId || schedule?.tokenAllocationId || undefined;
    const allocation = await this.findById(this.tokenAllocationModel, allocationId);
    const summary = await this.vestingSummaryModel
      .findOne({
        canonicalProjectId: event?.canonicalProjectId,
        sourceType: projectSourceTypeMongoPattern(event?.sourceType),
      })
      .lean();

    return { schedule, round, allocation, summary };
  }

  private fallbackRelationQuery(event: any): Record<string, any> | undefined {
    const canonicalProjectId = this.toObjectId(event?.canonicalProjectId);
    if (!canonicalProjectId || !event?.sourceType) return undefined;
    const base: Record<string, any> = {
      canonicalProjectId,
      sourceType: projectSourceTypeMongoPattern(event.sourceType),
    };
    if (event?.saleId !== undefined && event?.saleId !== null && event?.saleId !== "") {
      return { ...base, saleId: event.saleId };
    }
    if (event?.normalizedRoundName) {
      return { ...base, normalizedRoundName: event.normalizedRoundName };
    }
    return undefined;
  }

  private async buildSummaryUpdate(
    summary: any,
    event: any,
    amount: number,
    unlockDate: Date,
    now: Date
  ): Promise<Record<string, any> | undefined> {
    const totalAmount = this.firstPositiveNumber(summary?.totalAmount);
    if (totalAmount === undefined) return undefined;

    const untrackedAmount = this.firstNonNegativeNumber(
      summary?.untrackedAmount,
      0
    ) as number;
    const capacity = Math.max(0, totalAmount - untrackedAmount);
    const previousUnlockedAmount = this.firstNonNegativeNumber(
      summary?.unlockedAmount,
      this.amountFromPercent(totalAmount, summary?.unlockedPercent),
      0
    ) as number;
    const unlockedAmount = this.roundNumber(
      Math.min(capacity, previousUnlockedAmount + amount),
      6
    );
    const lockedAmount = this.roundNumber(
      Math.max(0, capacity - unlockedAmount),
      6
    );
    const unlockedPercent = this.roundNumber(
      (unlockedAmount / totalAmount) * 100,
      6
    );
    const lockedPercent = this.roundNumber(
      (lockedAmount / totalAmount) * 100,
      6
    );
    const nextEvent = await this.findNextPendingEvent(event, unlockDate);

    return {
      unlockedAmount,
      lockedAmount,
      unlockedPercent,
      lockedPercent,
      lastUnlockDate: unlockDate,
      nextUnlockDate: nextEvent?.unlockDate,
      nextUnlockEventId: nextEvent?._id,
      calculatedAt: now,
    };
  }

  private async findNextPendingEvent(
    event: any,
    unlockDate: Date
  ): Promise<any | undefined> {
    if (!event?.sourceType) return undefined;
    return this.unlockEventModel
      .findOne({
        canonicalProjectId: event?.canonicalProjectId,
        sourceType: projectSourceTypeMongoPattern(event.sourceType),
        _id: { $ne: event?._id },
        unlockDate: { $gt: unlockDate },
        $and: [
          {
            $or: [{ appliedAt: { $exists: false } }, { appliedAt: null }],
          },
          {
            $or: [
              { appliedStatus: { $exists: false } },
              { appliedStatus: null },
              { appliedStatus: { $nin: ["applied", "skipped"] } },
            ],
          },
        ],
      })
      .sort({ unlockDate: 1, _id: 1 } as any)
      .lean();
  }

  private async claimEvent(
    event: any,
    now: Date,
    maxAttempts: number
  ): Promise<any | undefined> {
    return this.unlockEventModel
      .findOneAndUpdate(
        {
          _id: event?._id,
          unlockDate: { $lte: now },
          ...this.buildApplyStateFilter(now, maxAttempts),
        },
        {
          $set: {
            appliedStatus: "processing",
            lastApplyAttemptAt: now,
          },
          $unset: { applyError: "" },
          $inc: { applyAttempts: 1 },
        },
        { new: true }
      )
      .lean();
  }

  private async skipEvent(
    event: any,
    reason: string,
    context: Pick<ApplyContext, "write" | "now" | "result">
  ): Promise<void> {
    if (context.write) {
      await this.unlockEventModel.updateOne(
        { _id: event?._id },
        {
          $set: {
            appliedStatus: "skipped",
            appliedAt: context.now,
            appliedTo: {
              reason,
              runner: RUNNER_NAME,
            },
            lastApplyAttemptAt: context.now,
          },
          $unset: { applyError: "" },
        }
      );
      context.result.eventsSkipped += 1;
      this.pushSample(context.result, event, { status: "skipped", reason });
      return;
    }

    context.result.eventsWouldSkip += 1;
    this.pushSample(context.result, event, { status: "would_skip", reason });
  }

  private async failEvent(
    event: any,
    reason: string,
    context: Pick<ApplyContext, "write" | "now" | "result">
  ): Promise<void> {
    if (context.write) {
      await this.unlockEventModel.updateOne(
        { _id: event?._id },
        {
          $set: {
            appliedStatus: "failed",
            applyError: reason,
            lastApplyAttemptAt: context.now,
          },
        }
      );
      context.result.eventsFailed += 1;
    } else {
      context.result.eventsWouldFail += 1;
    }
    context.result.errors.push({
      eventId: this.toIdString(event?._id),
      reason,
      roundName: event?.roundName,
      unlockDate: event?.unlockDate,
    });
    this.pushSample(context.result, event, {
      status: context.write ? "failed" : "would_fail",
      reason,
    });
  }

  private buildDueFilter(
    now: Date,
    maxAttempts: number,
    options: FomoV2UnlockEventApplyOptions
  ): Record<string, any> {
    const filter: Record<string, any> = {
      unlockDate: { $lte: now },
      ...this.buildApplyStateFilter(now, maxAttempts),
    };
    const canonicalProjectId = this.toObjectId(options.canonicalProjectId);
    if (canonicalProjectId) filter.canonicalProjectId = canonicalProjectId;
    if (options.sourceType) {
      filter.sourceType = projectSourceTypeMongoPattern(options.sourceType);
    }
    return filter;
  }

  private buildApplyStateFilter(now: Date, maxAttempts: number): Record<string, any> {
    const staleBefore = new Date(now.getTime() - DEFAULT_LOCK_TTL_MS);
    return {
      $and: [
        {
          $or: [{ appliedAt: { $exists: false } }, { appliedAt: null }],
        },
        {
          $or: [
            { appliedStatus: { $exists: false } },
            { appliedStatus: null },
            { appliedStatus: "pending" },
            { appliedStatus: "failed", applyAttempts: { $lt: maxAttempts } },
            {
              appliedStatus: "processing",
              lastApplyAttemptAt: { $lt: staleBefore },
            },
          ],
        },
      ],
    };
  }

  private emptyResult(
    write: boolean,
    now: Date,
    limit: number
  ): FomoV2UnlockEventApplyResult {
    return {
      mode: write ? "write" : "dry-run",
      dryRun: !write,
      now: now.toISOString(),
      limit,
      scannedEvents: 0,
      eventsApplied: 0,
      eventsWouldApply: 0,
      eventsSkipped: 0,
      eventsWouldSkip: 0,
      eventsFailed: 0,
      eventsWouldFail: 0,
      claimSkipped: 0,
      vestingSchedulesUpdated: 0,
      vestingRoundsUpdated: 0,
      vestingSummariesUpdated: 0,
      samples: [],
      errors: [],
    };
  }

  private async findById(model: Model<any>, id: any): Promise<any | undefined> {
    const objectId = this.toObjectId(id);
    if (!objectId) return undefined;
    return model.findById(objectId).lean();
  }

  private pushSample(
    result: FomoV2UnlockEventApplyResult,
    event: any,
    extra: Record<string, any>
  ): void {
    if (result.samples.length >= 20) return;
    result.samples.push({
      eventId: this.toIdString(event?._id),
      projectId: this.toIdString(event?.canonicalProjectId),
      roundName: event?.roundName,
      unlockDate: event?.unlockDate,
      amount: event?.amount,
      percentOfSupply: event?.percentOfSupply,
      ...extra,
    });
  }

  private cronEnabled(): boolean {
    return this.booleanConfig("FOMO_V2_UNLOCK_APPLY_ENABLED", true);
  }

  private batchLimit(): number {
    return this.positiveInteger(
      this.configService.get<string>("FOMO_V2_UNLOCK_APPLY_BATCH_LIMIT"),
      DEFAULT_BATCH_LIMIT
    );
  }

  private maxAttempts(): number {
    return this.positiveInteger(
      this.configService.get<string>("FOMO_V2_UNLOCK_APPLY_MAX_ATTEMPTS"),
      DEFAULT_MAX_ATTEMPTS
    );
  }

  private booleanConfig(key: string, fallback: boolean): boolean {
    const value = this.configService.get<string>(key);
    if (value === undefined || value === null || value === "") return fallback;
    const normalized = String(value).trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
    return fallback;
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : undefined;
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value;
    const text = String(value);
    return Types.ObjectId.isValid(text) ? new Types.ObjectId(text) : undefined;
  }

  private toIdString(value: any): string | undefined {
    if (!value) return undefined;
    return typeof value?.toString === "function" ? value.toString() : String(value);
  }

  private firstPositiveNumber(...values: any[]): number | undefined {
    for (const value of values) {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return undefined;
  }

  private firstNonNegativeNumber(...values: any[]): number | undefined {
    for (const value of values) {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    }
    return undefined;
  }

  private amountFromPercent(totalAmount: number, percent: any): number | undefined {
    const parsed = Number(percent);
    if (!Number.isFinite(parsed) || parsed < 0) return undefined;
    return this.roundNumber((totalAmount * parsed) / 100, 6);
  }

  private percentFromAmount(amount: number, totalAmount: number): number {
    return this.roundNumber((amount / totalAmount) * 100, 6);
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.trunc(parsed);
  }

  private roundNumber(value: number, precision = 6): number {
    if (!Number.isFinite(value)) return value;
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
  }
}

function contextlessErrorReason(error: any): string {
  return error?.message || String(error || "unknown_error");
}
