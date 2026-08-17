import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { buildDefaultUnifiedRatingConfig } from "./unified-rating.defaults";
import {
  UNIFIED_ENTITY_TYPES,
  UnifiedEntityType,
  UnifiedRatingConfig,
} from "./unified-rating.types";

export const UNIFIED_CONFIG_DOCUMENT_ID = "unified";
const CONFIG_COLLECTION = "rating_configs";
const WEIGHT_SUM_TOLERANCE = 1;

export type UnifiedRuntimeResult = {
  scanned: number;
  updated: number;
  errors: number;
  durationMs: number;
};

export type UnifiedRuntimeState = {
  state: "idle" | "running" | "completed" | "failed";
  running: boolean;
  runId: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  lastRunAt: Date | null;
  lastResult: UnifiedRuntimeResult | null;
  lastError: string | null;
  configVersion: number | null;
};

const idleRuntime = (): UnifiedRuntimeState => ({
  state: "idle",
  running: false,
  runId: null,
  startedAt: null,
  finishedAt: null,
  lastRunAt: null,
  lastResult: null,
  lastError: null,
  configVersion: null,
});

@Injectable()
export class UnifiedRatingConfigService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  private collection() {
    if (!this.connection.db) throw new Error("Mongo connection is not ready");
    return this.connection.db.collection(CONFIG_COLLECTION);
  }

  async getDocument(): Promise<any> {
    const collection = this.collection();
    const existing = await collection.findOne({
      _id: UNIFIED_CONFIG_DOCUMENT_ID,
    } as any);
    if (existing) return existing;

    const now = new Date();
    const doc = {
      _id: UNIFIED_CONFIG_DOCUMENT_ID,
      version: 1,
      config: buildDefaultUnifiedRatingConfig(),
      runtime: this.buildRuntimeMap(),
      updatedBy: "system",
      settingsUpdatedAt: now,
      createdAt: now,
    };
    try {
      await collection.insertOne(doc as any);
    } catch (error: any) {
      if (Number(error?.code) !== 11000) throw error;
    }
    return collection.findOne({ _id: UNIFIED_CONFIG_DOCUMENT_ID } as any);
  }

  async getSnapshot(): Promise<{
    version: number;
    updatedAt: Date | null;
    updatedBy: string;
    config: UnifiedRatingConfig;
    runtime: Record<string, UnifiedRuntimeState>;
  }> {
    const document = await this.getDocument();
    return {
      version: Number(document?.version || 1),
      updatedAt: document?.settingsUpdatedAt || document?.createdAt || null,
      updatedBy: document?.updatedBy || "",
      config: this.mergeConfig(document?.config),
      runtime: this.normalizeRuntimeMap(document?.runtime),
    };
  }

  async save(input: any, updatedBy = ""): Promise<any> {
    const requestedVersion = input?.version;
    if (!Number.isInteger(requestedVersion) || requestedVersion < 1) {
      throw new BadRequestException(
        "Rating config version is required and must be a positive integer"
      );
    }
    if (!input?.config || typeof input.config !== "object") {
      throw new BadRequestException("Rating config payload is required");
    }

    const merged = this.mergeConfig(input.config);
    this.validate(merged);

    const result = await this.collection().updateOne(
      { _id: UNIFIED_CONFIG_DOCUMENT_ID, version: requestedVersion } as any,
      {
        $set: {
          config: merged,
          updatedBy: String(updatedBy || ""),
          settingsUpdatedAt: new Date(),
        },
        $inc: { version: 1 },
      }
    );
    if (Number(result?.matchedCount || 0) < 1) {
      throw new ConflictException(
        "Rating config was changed by another session; reload before saving"
      );
    }
    return this.getDocument();
  }

  /* --------------------------- runtime --------------------------- */

  async acquireLease(
    entityType: UnifiedEntityType,
    runId: string,
    configVersion: number
  ): Promise<boolean> {
    await this.getDocument();
    const prefix = `runtime.${entityType}`;
    const now = new Date();
    const updated = await this.collection().findOneAndUpdate(
      {
        _id: UNIFIED_CONFIG_DOCUMENT_ID,
        [`${prefix}.running`]: { $ne: true },
      } as any,
      {
        $set: {
          [`${prefix}.state`]: "running",
          [`${prefix}.running`]: true,
          [`${prefix}.runId`]: runId,
          [`${prefix}.startedAt`]: now,
          [`${prefix}.lastRunAt`]: now,
          [`${prefix}.finishedAt`]: null,
          [`${prefix}.lastError`]: null,
          [`${prefix}.configVersion`]: configVersion,
        },
      }
    );
    return Boolean((updated as any)?.value || (updated as any)?.ok);
  }

  async completeRun(
    entityType: UnifiedEntityType,
    runId: string,
    result: UnifiedRuntimeResult,
    error?: unknown
  ): Promise<void> {
    const prefix = `runtime.${entityType}`;
    await this.collection().updateOne(
      { _id: UNIFIED_CONFIG_DOCUMENT_ID, [`${prefix}.runId`]: runId } as any,
      {
        $set: {
          [`${prefix}.state`]: error ? "failed" : "completed",
          [`${prefix}.running`]: false,
          [`${prefix}.finishedAt`]: new Date(),
          [`${prefix}.lastResult`]: result,
          [`${prefix}.lastError`]: error
            ? error instanceof Error
              ? error.message
              : String(error)
            : null,
        },
      }
    );
  }

  /* --------------------------- helpers --------------------------- */

  private buildRuntimeMap(): Record<string, UnifiedRuntimeState> {
    return Object.fromEntries(
      UNIFIED_ENTITY_TYPES.map((entityType) => [entityType, idleRuntime()])
    );
  }

  private normalizeRuntimeMap(value: any): Record<string, UnifiedRuntimeState> {
    return Object.fromEntries(
      UNIFIED_ENTITY_TYPES.map((entityType) => [
        entityType,
        { ...idleRuntime(), ...(value?.[entityType] || {}) },
      ])
    );
  }

  mergeConfig(value: any): UnifiedRatingConfig {
    return this.mergeKnown(
      buildDefaultUnifiedRatingConfig(),
      value
    ) as UnifiedRatingConfig;
  }

  private mergeKnown(defaults: any, incoming: any): any {
    if (Array.isArray(defaults)) {
      return Array.isArray(incoming) ? incoming : defaults;
    }
    if (defaults && typeof defaults === "object") {
      const out: Record<string, any> = {};
      for (const key of Object.keys(defaults)) {
        out[key] = this.mergeKnown(
          defaults[key],
          incoming ? incoming[key] : undefined
        );
      }
      return out;
    }
    if (typeof defaults === "number") {
      return typeof incoming === "number" && Number.isFinite(incoming)
        ? incoming
        : defaults;
    }
    if (typeof defaults === "boolean") {
      return typeof incoming === "boolean" ? incoming : defaults;
    }
    if (typeof defaults === "string") {
      return typeof incoming === "string" && incoming.trim()
        ? incoming
        : defaults;
    }
    return defaults;
  }

  private validate(config: UnifiedRatingConfig): void {
    const sum = (obj: Record<string, number>) =>
      Object.values(obj).reduce((a, b) => a + Number(b || 0), 0);

    const checks: [string, number][] = [
      ["persons.weights", sum(config.persons.weights)],
      ["projects.weights", sum(config.projects.weights)],
      ["twitter.weights", sum(config.twitter.weights)],
      ["users.weights", sum(config.users.weights)],
      ["funds.limits", sum(config.funds.limits)],
    ];
    for (const [path, total] of checks) {
      if (Math.abs(total - 100) > WEIGHT_SUM_TOLERANCE) {
        throw new BadRequestException(
          `${path} must sum to 100 (got ${Math.round(total * 100) / 100})`
        );
      }
    }
    if (
      config.batchSize < 10 ||
      config.batchSize > 2000 ||
      !Number.isInteger(config.batchSize)
    ) {
      throw new BadRequestException("batchSize must be an integer 10-2000");
    }

    // Platform User model (Phase 3): the 6 weighted components must sum to 100.
    const platformWeights = (config.users as any)?.platformUser?.weights;
    if (platformWeights && typeof platformWeights === "object") {
      const total = sum(platformWeights);
      if (Math.abs(total - 100) > WEIGHT_SUM_TOLERANCE) {
        throw new BadRequestException(
          `users.platformUser.weights must sum to 100 (got ${Math.round(total * 100) / 100})`
        );
      }
    }

    // Threshold tables must be monotonic (at strictly increasing, points
    // non-decreasing) and not exceed the component maximum.
    const checkSteps = (
      label: string,
      steps: { at: number; points: number }[],
      maxPoints?: number
    ) => {
      for (let i = 1; i < steps.length; i += 1) {
        if (steps[i].at <= steps[i - 1].at) {
          throw new BadRequestException(
            `${label}: пороги должны строго возрастать (позиция ${i + 1})`
          );
        }
        if (steps[i].points < steps[i - 1].points) {
          throw new BadRequestException(
            `${label}: баллы не должны убывать (позиция ${i + 1})`
          );
        }
      }
      if (maxPoints !== undefined) {
        const last = steps[steps.length - 1];
        if (last && last.points > maxPoints) {
          throw new BadRequestException(
            `${label}: балл (${last.points}) превышает максимум компонента (${maxPoints})`
          );
        }
      }
    };
    const trade = config.users.trade;
    (["otc", "p2p", "shared"] as const).forEach((dir) => {
      const d = (trade as any)[dir];
      if (!d) return;
      const label = dir === "shared" ? "Общее ядро" : dir.toUpperCase();
      checkSteps(`${label} объём`, d.volumeThresholds, d.componentMax.volume);
      checkSteps(`${label} сделки`, d.tradeThresholds, d.componentMax.trades);
      checkSteps(`${label} контрагенты`, d.counterpartyThresholds, d.componentMax.counterparties);
    });
    checkSteps("Коэффициент доверия к отзывам", trade.reviewConfidence, 1);

    // Unified weights: core + experience must sum to ~1.
    if (
      trade.coreWeight !== undefined &&
      trade.experienceWeight !== undefined
    ) {
      const sum = Number(trade.coreWeight) + Number(trade.experienceWeight);
      if (Math.abs(sum - 1) > 0.001) {
        throw new BadRequestException(
          `Веса торговой репутации (ядро + опыт) должны в сумме давать 1 (сейчас ${sum.toFixed(2)})`
        );
      }
    }

    // Sub-formula sub-weights: every WEIGHTED component's sub-metrics must sum
    // to 100 (positive subs only; penalties excluded) and all caps must be >= 0.
    this.validateSubFormulas(config);
  }

  private validateSubFormulas(config: UnifiedRatingConfig): void {
    const sf: any = (config as any).subFormulas;
    if (!sf || typeof sf !== "object") return;
    const entities = ["funds", "persons", "twitter", "projects", "users"] as const;
    for (const entity of entities) {
      const group = sf[entity];
      if (!group || typeof group !== "object") continue;
      for (const [compKey, formula] of Object.entries<any>(group)) {
        if (!formula || typeof formula !== "object") continue;
        const label = `Подформула ${entity}.${compKey}`;
        if (typeof formula.cap === "number" && formula.cap < 0) {
          throw new BadRequestException(`${label}: cap не может быть отрицательным`);
        }
        if (formula.kind === "weighted" && Array.isArray(formula.subs)) {
          const positive = formula.subs.filter((s: any) => s && !s.penalty);
          if (positive.length) {
            const total = positive.reduce(
              (a: number, s: any) => a + Number(s.weight || 0),
              0
            );
            if (Math.abs(total - 100) > WEIGHT_SUM_TOLERANCE) {
              throw new BadRequestException(
                `${label}: суб-веса должны в сумме давать 100 (сейчас ${Math.round(total * 100) / 100})`
              );
            }
          }
          for (const s of formula.subs) {
            const wv = Number(s?.weight);
            if (!Number.isFinite(wv) || wv < 0) {
              throw new BadRequestException(
                `${label}: вес «${s?.key || "?"}» должен быть неотрицательным числом`
              );
            }
          }
        }
      }
    }
  }
}
