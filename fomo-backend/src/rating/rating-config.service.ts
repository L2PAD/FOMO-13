import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CronTime } from "cron";
import { Model } from "mongoose";
import {
  buildDefaultRatingEntitiesConfig,
  buildIdleRatingRuntime,
  getRatingFormulaCatalog,
} from "./rating.defaults";
import {
  RatingConfig,
  RatingConfigDocument,
  RATING_CONFIG_DOCUMENT_ID,
} from "./models/rating-config.model";
import {
  RATING_ENTITY_TYPES,
  RatingEntitiesConfig,
  RatingEntityConfig,
  RatingEntityType,
  RatingFormulaModeConfig,
  RatingRunResult,
  RatingRunTrigger,
  RatingRuntimeState,
} from "./rating.types";
import { setRatingFormulaRuntime } from "./rating-formula.runtime";

const LEASE_DURATION_MS = 5 * 60 * 1000;
const MIN_SCHEDULE_INTERVAL_MS = 5 * 60 * 1000;
const SCHEDULE_VALIDATION_OCCURRENCES = 256;

@Injectable()
export class RatingConfigService implements OnModuleInit, OnModuleDestroy {
  private refreshTimer?: NodeJS.Timeout;
  private ensurePromise?: Promise<void>;

  constructor(
    @InjectModel(RatingConfig.name)
    private readonly configModel: Model<RatingConfigDocument>
  ) {}

  async onModuleInit(): Promise<void> {
    await this.getSnapshot();
    this.refreshTimer = setInterval(() => {
      void this.getSnapshot().catch(() => undefined);
    }, 5_000);
    this.refreshTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  async getDocument(): Promise<any> {
    await this.ensureDocument();
    return this.configModel.findById(RATING_CONFIG_DOCUMENT_ID).lean().exec();
  }

  async getEntities(): Promise<RatingEntitiesConfig> {
    const document = await this.getDocument();
    return this.normalizeStoredEntities(document?.entities);
  }

  async getSnapshot(): Promise<{
    version: number;
    updatedAt: Date | null;
    entities: RatingEntitiesConfig;
  }> {
    const document = await this.getDocument();
    const snapshot = {
      version: Number(document?.version || 1),
      updatedAt: document?.settingsUpdatedAt || document?.createdAt || null,
      entities: this.normalizeStoredEntities(document?.entities),
    };
    setRatingFormulaRuntime(snapshot);
    return snapshot;
  }

  async save(input: any, updatedBy = ""): Promise<any> {
    const document = await this.getDocument();
    const current = this.normalizeStoredEntities(document?.entities);
    const source = input?.entities;

    const requestedVersion = input?.version;
    if (!Number.isInteger(requestedVersion) || requestedVersion < 1) {
      throw new BadRequestException(
        "Rating config version is required and must be a positive integer"
      );
    }

    if (!source || typeof source !== "object" || Array.isArray(source)) {
      throw new BadRequestException("Rating entities config is required");
    }
    this.validateNestedConfigShape(source);
    const unknownEntities = Object.keys(source).filter(
      (key) => !(RATING_ENTITY_TYPES as readonly string[]).includes(key)
    );
    if (unknownEntities.length) {
      throw new BadRequestException(
        `Unknown rating config entity key(s): ${unknownEntities.join(", ")}`
      );
    }

    const entities = this.sanitizeEntities(source, current);
    const filter: Record<string, any> = {
      _id: RATING_CONFIG_DOCUMENT_ID,
      version: requestedVersion,
    };
    const result = await this.configModel
      .updateOne(filter, {
        $set: {
          entities,
          updatedBy: String(updatedBy || ""),
          settingsUpdatedAt: new Date(),
        },
        $inc: { version: 1 },
      })
      .exec();
    if (Number(result?.matchedCount || 0) < 1) {
      throw new ConflictException(
        "Rating config was changed by another session; reload before saving"
      );
    }

    const updated = await this.getDocument();
    setRatingFormulaRuntime({
      version: Number(updated?.version || 1),
      updatedAt: updated?.settingsUpdatedAt || updated?.createdAt || null,
      entities: this.normalizeStoredEntities(updated?.entities),
    });
    return updated;
  }

  async acquireLease(
    entityType: RatingEntityType,
    runId: string,
    trigger: RatingRunTrigger,
    configVersion: number
  ): Promise<{ acquired: boolean; runtime: RatingRuntimeState }> {
    await this.ensureDocument();
    const now = new Date();
    const leaseExpiresAt = new Date(now.getTime() + LEASE_DURATION_MS);
    const statePath = `runtime.${entityType}.state`;
    const leasePath = `runtime.${entityType}.leaseExpiresAt`;
    const prefix = `runtime.${entityType}`;
    const updated: any = await this.configModel
      .findOneAndUpdate(
        {
          _id: RATING_CONFIG_DOCUMENT_ID,
          $or: [
            { [statePath]: { $ne: "running" } },
            { [leasePath]: { $lte: now } },
            { [leasePath]: null },
          ],
        },
        {
          $set: {
            [`${prefix}.state`]: "running",
            [`${prefix}.running`]: true,
            [`${prefix}.runId`]: runId,
            [`${prefix}.trigger`]: trigger,
            [`${prefix}.configVersion`]: configVersion,
            [`${prefix}.startedAt`]: now,
            [`${prefix}.heartbeatAt`]: now,
            [`${prefix}.leaseExpiresAt`]: leaseExpiresAt,
            [`${prefix}.finishedAt`]: null,
            [`${prefix}.lastRunAt`]: now,
            [`${prefix}.lastError`]: null,
          },
          $inc: { [`${prefix}.fence`]: 1 },
        },
        { new: true, timestamps: false } as any
      )
      .lean()
      .exec();

    if (updated) {
      return {
        acquired: true,
        runtime: this.normalizeRuntime(updated.runtime?.[entityType]),
      };
    }

    const current = await this.getDocument();
    return {
      acquired: false,
      runtime: this.normalizeRuntime(current?.runtime?.[entityType]),
    };
  }

  async heartbeat(entityType: RatingEntityType, runId: string): Promise<void> {
    const now = new Date();
    const prefix = `runtime.${entityType}`;
    const result = await this.configModel
      .updateOne(
        {
          _id: RATING_CONFIG_DOCUMENT_ID,
          [`${prefix}.state`]: "running",
          [`${prefix}.runId`]: runId,
        },
        {
          $set: {
            [`${prefix}.heartbeatAt`]: now,
            [`${prefix}.leaseExpiresAt`]: new Date(
              now.getTime() + LEASE_DURATION_MS
            ),
          },
        },
        { timestamps: false } as any
      )
      .exec();
    if (Number(result?.matchedCount || 0) < 1) {
      throw new Error(`Rating ${entityType} lease was lost for run ${runId}`);
    }
  }

  async completeRun(
    entityType: RatingEntityType,
    runId: string,
    result: RatingRunResult
  ): Promise<void> {
    const now = new Date();
    const prefix = `runtime.${entityType}`;
    await this.configModel
      .updateOne(
        {
          _id: RATING_CONFIG_DOCUMENT_ID,
          [`${prefix}.runId`]: runId,
        },
        {
          $set: {
            [`${prefix}.state`]: "completed",
            [`${prefix}.running`]: false,
            [`${prefix}.heartbeatAt`]: now,
            [`${prefix}.leaseExpiresAt`]: null,
            [`${prefix}.finishedAt`]: now,
            [`${prefix}.lastResult`]: result,
            [`${prefix}.lastError`]: null,
          },
        },
        { timestamps: false } as any
      )
      .exec();
  }

  async failRun(
    entityType: RatingEntityType,
    runId: string,
    error: unknown,
    result: RatingRunResult
  ): Promise<void> {
    const now = new Date();
    const prefix = `runtime.${entityType}`;
    await this.configModel
      .updateOne(
        {
          _id: RATING_CONFIG_DOCUMENT_ID,
          [`${prefix}.runId`]: runId,
        },
        {
          $set: {
            [`${prefix}.state`]: "failed",
            [`${prefix}.running`]: false,
            [`${prefix}.heartbeatAt`]: now,
            [`${prefix}.leaseExpiresAt`]: null,
            [`${prefix}.finishedAt`]: now,
            [`${prefix}.lastResult`]: result,
            [`${prefix}.lastError`]: this.errorMessage(error),
          },
        },
        { timestamps: false } as any
      )
      .exec();
  }

  getCatalog() {
    return getRatingFormulaCatalog();
  }

  normalizeRuntime(value: any): RatingRuntimeState {
    const runtime = {
      ...buildIdleRatingRuntime(),
      ...(value && typeof value === "object" ? value : {}),
      running: value?.state === "running" && value?.running !== false,
    };
    const leaseTime = runtime.leaseExpiresAt
      ? new Date(runtime.leaseExpiresAt).getTime()
      : 0;
    if (runtime.running && leaseTime > 0 && leaseTime <= Date.now()) {
      return {
        ...runtime,
        state: "failed",
        running: false,
        lastError:
          runtime.lastError ||
          "Worker lease expired; a new run can safely acquire the entity.",
      };
    }
    return runtime;
  }

  private async ensureDocument(): Promise<void> {
    if (this.ensurePromise) return this.ensurePromise;
    this.ensurePromise = this.createDocumentIfMissing();
    try {
      await this.ensurePromise;
    } catch (error) {
      this.ensurePromise = undefined;
      throw error;
    }
  }

  private async createDocumentIfMissing(): Promise<void> {
    const defaults = buildDefaultRatingEntitiesConfig();
    const runtime = Object.fromEntries(
      RATING_ENTITY_TYPES.map((entityType) => [
        entityType,
        buildIdleRatingRuntime(),
      ])
    );

    const now = new Date();
    try {
      await this.configModel
        .updateOne(
          { _id: RATING_CONFIG_DOCUMENT_ID },
          {
            $setOnInsert: {
              _id: RATING_CONFIG_DOCUMENT_ID,
              version: 1,
              entities: defaults,
              runtime,
              updatedBy: "system",
              settingsUpdatedAt: now,
              createdAt: now,
              updatedAt: now,
            },
          },
          { upsert: true, timestamps: false } as any
        )
        .exec();
    } catch (error) {
      if (Number((error as any)?.code) !== 11000) throw error;
      // Another replica inserted the deterministic singleton first.
    }
  }

  private normalizeStoredEntities(value: any): RatingEntitiesConfig {
    return this.sanitizeEntities(
      value && typeof value === "object" ? value : {},
      buildDefaultRatingEntitiesConfig()
    );
  }

  private validateNestedConfigShape(source: Record<string, any>): void {
    const entityKeys = ["enabled", "batchSize", "schedule", "formula"];
    const scheduleKeys = ["enabled", "cron", "timezone"];
    const formulaKeys = ["modes"];
    const modeKeys = [
      "componentWeights",
      "fullnessComponentWeights",
      "penaltyMultipliers",
      "capValues",
      "minScore",
      "maxScore",
      "preserveDefaultCaps",
    ];

    for (const [entityType, rawEntity] of Object.entries(source)) {
      if (!(RATING_ENTITY_TYPES as readonly string[]).includes(entityType)) {
        continue;
      }
      const entity = this.requiredPlainObject(rawEntity, entityType);
      this.rejectUnknownKeys(entity, entityKeys, entityType);

      if (Object.prototype.hasOwnProperty.call(entity, "schedule")) {
        const schedule = this.requiredPlainObject(
          entity.schedule,
          `${entityType}.schedule`
        );
        this.rejectUnknownKeys(
          schedule,
          scheduleKeys,
          `${entityType}.schedule`
        );
      }

      if (!Object.prototype.hasOwnProperty.call(entity, "formula")) continue;
      const formula = this.requiredPlainObject(
        entity.formula,
        `${entityType}.formula`
      );
      this.rejectUnknownKeys(formula, formulaKeys, `${entityType}.formula`);
      if (!Object.prototype.hasOwnProperty.call(formula, "modes")) continue;

      const modes = this.requiredPlainObject(
        formula.modes,
        `${entityType}.formula.modes`
      );
      for (const [mode, rawMode] of Object.entries(modes)) {
        const modePath = `${entityType}.formula.modes.${mode}`;
        const modeConfig = this.requiredPlainObject(rawMode, modePath);
        this.rejectUnknownKeys(modeConfig, modeKeys, modePath);
      }
    }
  }

  private requiredPlainObject(value: any, path: string): Record<string, any> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new BadRequestException(`${path} must be an object`);
    }
    return value;
  }

  private rejectUnknownKeys(
    value: Record<string, any>,
    allowed: string[],
    path: string
  ): void {
    const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
    if (unknown.length) {
      throw new BadRequestException(
        `Unknown ${path} key(s): ${unknown.join(", ")}`
      );
    }
  }

  private sanitizeEntities(
    source: any,
    current: RatingEntitiesConfig
  ): RatingEntitiesConfig {
    return Object.fromEntries(
      RATING_ENTITY_TYPES.map((entityType) => [
        entityType,
        this.sanitizeEntity(
          entityType,
          source?.[entityType],
          current[entityType]
        ),
      ])
    ) as RatingEntitiesConfig;
  }

  private sanitizeEntity(
    entityType: RatingEntityType,
    source: any,
    current: RatingEntityConfig
  ): RatingEntityConfig {
    const input = source && typeof source === "object" ? source : {};
    const enabled = this.boolean(input.enabled, current.enabled);
    const batchSize = this.integer(
      input.batchSize,
      current.batchSize,
      10,
      2000,
      `${entityType}.batchSize`
    );
    const scheduleInput =
      input.schedule && typeof input.schedule === "object"
        ? input.schedule
        : {};
    const schedule = {
      enabled: this.boolean(scheduleInput.enabled, current.schedule.enabled),
      cron: this.string(scheduleInput.cron, current.schedule.cron),
      timezone: this.string(scheduleInput.timezone, current.schedule.timezone),
    };
    this.validateCron(schedule.cron, schedule.timezone, entityType);

    const sourceModes = input?.formula?.modes;
    if (
      sourceModes !== undefined &&
      (!sourceModes ||
        typeof sourceModes !== "object" ||
        Array.isArray(sourceModes))
    ) {
      throw new BadRequestException(
        `${entityType}.formula.modes must be an object`
      );
    }
    const allowedModes = Object.keys(current.formula.modes);
    const unknownModes = Object.keys(sourceModes || {}).filter(
      (mode) => !allowedModes.includes(mode)
    );
    if (unknownModes.length) {
      throw new BadRequestException(
        `Unknown ${entityType} formula mode(s): ${unknownModes.join(", ")}`
      );
    }
    const modes = Object.fromEntries(
      allowedModes.map((mode) => [
        mode,
        this.sanitizeMode(
          entityType,
          mode,
          sourceModes?.[mode],
          current.formula.modes[mode]
        ),
      ])
    );

    return { enabled, batchSize, schedule, formula: { modes } };
  }

  private sanitizeMode(
    entityType: RatingEntityType,
    mode: string,
    source: any,
    current: RatingFormulaModeConfig
  ): RatingFormulaModeConfig {
    const input = source && typeof source === "object" ? source : {};
    const prefix = `${entityType}.formula.modes.${mode}`;
    const componentWeights = this.sanitizeMultipliers(
      input.componentWeights,
      current.componentWeights,
      `${prefix}.componentWeights`
    );
    const fullnessComponentWeights = this.sanitizeMultipliers(
      input.fullnessComponentWeights,
      current.fullnessComponentWeights,
      `${prefix}.fullnessComponentWeights`
    );
    const penaltyMultipliers = this.sanitizeMultipliers(
      input.penaltyMultipliers,
      current.penaltyMultipliers,
      `${prefix}.penaltyMultipliers`
    );
    const capValues = this.sanitizeNumberRecord(
      input.capValues,
      current.capValues,
      `${prefix}.capValues`,
      100
    );
    const minScore = this.number(
      input.minScore,
      current.minScore,
      0,
      100,
      `${prefix}.minScore`
    );
    const maxScore = this.number(
      input.maxScore,
      current.maxScore,
      0,
      100,
      `${prefix}.maxScore`
    );
    if (minScore >= maxScore) {
      throw new BadRequestException(
        `${prefix}.minScore must be less than maxScore`
      );
    }

    return {
      componentWeights,
      fullnessComponentWeights,
      penaltyMultipliers,
      capValues,
      minScore,
      maxScore,
      preserveDefaultCaps: this.boolean(
        input.preserveDefaultCaps,
        current.preserveDefaultCaps
      ),
    };
  }

  private sanitizeMultipliers(
    source: any,
    current: Record<string, number>,
    path: string
  ): Record<string, number> {
    return this.sanitizeNumberRecord(source, current, path, 10);
  }

  private sanitizeNumberRecord(
    source: any,
    current: Record<string, number>,
    path: string,
    max: number
  ): Record<string, number> {
    if (
      source !== undefined &&
      (!source || typeof source !== "object" || Array.isArray(source))
    ) {
      throw new BadRequestException(`${path} must be an object`);
    }
    const unknown = Object.keys(source || {}).filter(
      (key) => !Object.prototype.hasOwnProperty.call(current, key)
    );
    if (unknown.length) {
      throw new BadRequestException(
        `Unknown ${path} key(s): ${unknown.join(", ")}`
      );
    }

    return Object.fromEntries(
      Object.keys(current).map((key) => [
        key,
        this.number(source?.[key], current[key], 0, max, `${path}.${key}`),
      ])
    );
  }

  private validateCron(
    expression: string,
    timezone: string,
    entityType: RatingEntityType
  ): void {
    try {
      const cronTime = new CronTime(expression, timezone);
      const nextDates: any[] = cronTime.sendAt(
        SCHEDULE_VALIDATION_OCCURRENCES
      ) as any;
      for (let index = 1; index < nextDates.length; index += 1) {
        if (
          nextDates[index].toMillis() - nextDates[index - 1].toMillis() <
          MIN_SCHEDULE_INTERVAL_MS
        ) {
          throw new Error("schedule interval must be at least 5 minutes");
        }
      }
    } catch (error) {
      throw new BadRequestException(
        `Invalid ${entityType} schedule: ${this.errorMessage(error)}`
      );
    }
  }

  private boolean(value: any, fallback: boolean): boolean {
    if (value === undefined) return fallback;
    if (typeof value !== "boolean") {
      throw new BadRequestException("Expected a boolean config value");
    }
    return value;
  }

  private string(value: any, fallback: string): string {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || !value.trim()) {
      throw new BadRequestException("Expected a non-empty string config value");
    }
    return value.trim();
  }

  private integer(
    value: any,
    fallback: number,
    min: number,
    max: number,
    path: string
  ): number {
    const parsed = this.number(value, fallback, min, max, path);
    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(`${path} must be an integer`);
    }
    return parsed;
  }

  private number(
    value: any,
    fallback: number,
    min: number,
    max: number,
    path: string
  ): number {
    if (value === undefined) return fallback;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new BadRequestException(`${path} must be a finite number`);
    }
    if (value < min || value > max) {
      throw new BadRequestException(
        `${path} must be between ${min} and ${max}`
      );
    }
    return value;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : String(error || "Unknown error");
  }
}
