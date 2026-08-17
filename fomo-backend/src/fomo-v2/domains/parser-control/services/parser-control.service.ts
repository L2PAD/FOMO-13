import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { createHash, randomUUID } from "crypto";
import { Model, Types } from "mongoose";
import { isCronEnabled } from "src/config/cron.config";
import {
  FomoV2ParserControlConfig,
  FomoV2ParserControlConfigDocument,
  FomoV2ParserControlMode,
  FomoV2ParserControlRun,
  FomoV2ParserControlRunDocument,
  FomoV2ParserControlRunStatus,
  FomoV2ParserGlobalControl,
  FomoV2ParserGlobalControlDocument,
  FomoV2ParserRunMode,
} from "../../../models/parser-control.model";
import {
  FOMO_V2_MANAGED_PARSERS,
  FOMO_V2_PARSER_CONTROL_DEFAULT_LEASE_MS,
  FOMO_V2_PARSER_GLOBAL_DOCUMENT_ID,
  FomoV2ManagedParserDefinition,
  isFomoV2ParserControlWorkerEnabled,
  managedParserDefinition,
} from "../parser-control.constants";
import {
  FomoV2ParserControlPolicyService,
  resolveFomoV2ParserExecutionPolicy,
} from "./parser-control-policy.service";

type ParserTrigger = "manual" | "schedule";
const IMMUTABLE_SNAPSHOT_RETRYABLE_STATUSES = [
  "failed",
  "abandoned",
  "partial",
  "cancelled",
  "skipped",
] as const;

export interface FomoV2ParserRunContext {
  snapshotId?: string;
  upstreamRunId?: string;
  idempotencyKey?: string;
}

export class FomoV2ParserControlLeaseLostError extends ConflictException {
  constructor(parserKey: string) {
    super(`Parser control lease was lost for ${parserKey}.`);
  }
}

@Injectable()
export class FomoV2ParserControlService {
  constructor(
    @InjectModel(FomoV2ParserGlobalControl.name)
    private readonly globalModel: Model<FomoV2ParserGlobalControlDocument>,
    @InjectModel(FomoV2ParserControlConfig.name)
    private readonly configModel: Model<FomoV2ParserControlConfigDocument>,
    @InjectModel(FomoV2ParserControlRun.name)
    private readonly runModel: Model<FomoV2ParserControlRunDocument>,
    private readonly policyService: FomoV2ParserControlPolicyService
  ) {}

  async getSnapshot(recentLimit = 20): Promise<Record<string, any>> {
    await this.ensureParserConfigs();
    const [global, configs, recentRuns] = await Promise.all([
      this.policyService.getGlobalState(),
      this.configModel
        .find({
          parserKey: {
            $in: FOMO_V2_MANAGED_PARSERS.map((item) => item.parserKey),
          },
        })
        .lean()
        .exec(),
      this.listRuns(recentLimit),
    ]);
    const currentRunIds = configs
      .map((config: any) => config.activeRunId)
      .filter(Boolean);
    const currentRuns = currentRunIds.length
      ? await this.runModel
          .find({ _id: { $in: currentRunIds } })
          .lean()
          .exec()
      : [];
    const currentById = new Map(
      currentRuns.map((run: any) => [String(run._id), run])
    );
    const configByKey = new Map(
      configs.map((config: any) => [config.parserKey, config])
    );
    const workerEnabled = isFomoV2ParserControlWorkerEnabled();

    return {
      global: {
        ...global,
        schedulerEnabled: isCronEnabled() && workerEnabled,
        workerEnabled,
        writesDomainData: global.enabled && global.mode === "prod",
      },
      parsers: FOMO_V2_MANAGED_PARSERS.map((definition) => {
        const config: any = configByKey.get(definition.parserKey) || {};
        const currentRun = config.activeRunId
          ? currentById.get(String(config.activeRunId))
          : undefined;
        const canRun =
          global.enabled && workerEnabled && !config.paused && !currentRun;
        const snapshotOnlyWrite = definition.writeRequiresSnapshot === true;
        const canWrite = canRun && global.mode === "prod" && !snapshotOnlyWrite;
        const status = this.deriveStatus(global.enabled, config, currentRun);
        return {
          ...definition,
          paused: Boolean(config.paused),
          scheduleEnabled: Boolean(config.scheduleEnabled),
          defaultRunMode:
            config.defaultRunMode === "write" ? "write" : "dry-run",
          intervalMinutes: Number(
            config.intervalMinutes || definition.defaultIntervalMinutes
          ),
          status,
          effectiveScheduledMode:
            global.mode === "test" || snapshotOnlyWrite
              ? "dry-run"
              : config.defaultRunMode,
          canRun,
          canWrite,
          writeBlockedReason: !global.enabled
            ? "Глобальный режим выключен"
            : !workerEnabled
            ? "Исполнитель парсеров выключен на сервере"
            : config.paused
            ? "Парсер на паузе"
            : currentRun
            ? "Предыдущий запуск ещё не завершён"
            : snapshotOnlyWrite
            ? "Write доступен только из complete apiintel snapshot"
            : global.mode === "test"
            ? "TEST принудительно запрещает записи"
            : undefined,
          nextRunAt: config.nextRunAt,
          lastRunId: config.lastRunId,
          lastRunAt: config.lastRunAt,
          lastFinishedAt: config.lastFinishedAt,
          lastStatus: config.lastStatus,
          lastError: config.lastError,
          currentRun,
        };
      }),
      recentRuns,
    };
  }

  async listRuns(
    limit = 20,
    parserKey?: string
  ): Promise<Record<string, any>[]> {
    const bounded = Math.min(Math.max(Math.floor(Number(limit) || 20), 1), 100);
    const filter = parserKey
      ? { parserKey: this.requireDefinition(parserKey).parserKey }
      : {};
    return this.runModel
      .find(filter)
      .sort({ queuedAt: -1, _id: -1 })
      .limit(bounded)
      .lean()
      .exec() as unknown as Promise<Record<string, any>[]>;
  }

  async getRunById(runId: string): Promise<Record<string, any>> {
    const id = String(runId || "").trim();
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Parser control run was not found: ${id}`);
    }
    const run: any = await this.runModel.findById(id).lean().exec();
    if (!run) {
      throw new NotFoundException(`Parser control run was not found: ${id}`);
    }
    return run;
  }

  async updateGlobal(
    adminId: string,
    input: { enabled?: boolean; mode?: FomoV2ParserControlMode }
  ): Promise<Record<string, any>> {
    if (input.enabled === undefined && input.mode === undefined) {
      throw new BadRequestException(
        "At least one global parser setting is required."
      );
    }
    const current = await this.policyService.getGlobalState();
    const nextEnabled = input.enabled ?? current.enabled;
    const nextMode = input.mode ?? current.mode;
    const reducesWriteAccess = !nextEnabled || nextMode === "test";
    if (reducesWriteAccess) {
      const activeFilter = !nextEnabled
        ? { status: { $in: ["running", "recovering"] } }
        : {
            status: { $in: ["running", "recovering"] },
            writesDomainData: true,
          };
      const activeRun = await this.runModel
        .findOne(activeFilter)
        .select({ parserKey: 1 })
        .lean()
        .exec();
      if (activeRun) {
        throw new ConflictException(
          `Cannot switch parser control to ${
            !nextEnabled ? "OFF" : "TEST"
          } while active run ${
            activeRun.parserKey
          } is active. Wait for it to finish.`
        );
      }
    }

    const globalFilter: Record<string, any> = {
      _id: new Types.ObjectId(FOMO_V2_PARSER_GLOBAL_DOCUMENT_ID),
    };
    const now = new Date();
    if (reducesWriteAccess) {
      globalFilter.$or = [
        { activeWriteRunId: { $exists: false } },
        { activeWriteRunId: null },
        { activeWriteLeaseExpiresAt: { $lte: now } },
      ];
    }
    const globalSet: Record<string, any> = {
      updatedByAdminId: cleanAdminId(adminId),
    };
    // Partial PATCH requests must never write a value copied from a stale
    // pre-read. Otherwise concurrent {enabled:false} and {mode:"test"}
    // requests can undo one another despite touching different fields.
    if (input.enabled !== undefined) globalSet.enabled = input.enabled;
    if (input.mode !== undefined) globalSet.mode = input.mode;
    const globalUpdate: Record<string, any> = {
      $set: globalSet,
      $inc: { revision: 1 },
    };
    if (reducesWriteAccess) {
      globalUpdate.$unset = {
        activeWriteRunId: "",
        activeWriteLeaseOwner: "",
        activeWriteLeaseExpiresAt: "",
      };
    }
    const globalChanged = await this.globalModel
      .updateOne(
        globalFilter,
        globalUpdate,
        { upsert: false }
      )
      .exec();
    if (!mongoMatched(globalChanged)) {
      throw new ConflictException(
        `Cannot switch parser control to ${
          !nextEnabled ? "OFF" : "TEST"
        } while a write import or materialization lease is active.`
      );
    }

    const appliedGlobal = await this.policyService.getGlobalState();
    if (!appliedGlobal.enabled) {
      await this.cancelQueuedRuns(undefined, "global-off");
    } else if (appliedGlobal.mode === "test") {
      await this.runModel
        .updateMany(
          { status: "queued", effectiveMode: "write" },
          {
            $set: {
              effectiveMode: "dry-run",
              dryRun: true,
              writesDomainData: false,
              globalMode: "test",
              policyReason: "test-mode",
            },
          }
        )
        .exec();
    }
    return this.getSnapshot();
  }

  async updateParser(
    adminId: string,
    parserKey: string,
    input: {
      paused?: boolean;
      scheduleEnabled?: boolean;
      defaultRunMode?: FomoV2ParserRunMode;
      intervalMinutes?: number;
    }
  ): Promise<Record<string, any>> {
    const definition = this.requireDefinition(parserKey);
    if (
      input.paused === undefined &&
      input.scheduleEnabled === undefined &&
      input.defaultRunMode === undefined &&
      input.intervalMinutes === undefined
    ) {
      throw new BadRequestException("At least one parser setting is required.");
    }
    await this.ensureParserConfig(definition);
    const current: any = await this.configModel
      .findOne({ parserKey: definition.parserKey })
      .lean()
      .exec();
    const intervalMinutes = Number(
      input.intervalMinutes ??
        current?.intervalMinutes ??
        definition.defaultIntervalMinutes
    );
    const set: Record<string, any> = {
      updatedByAdminId: cleanAdminId(adminId),
    };
    if (input.paused !== undefined) set.paused = input.paused;
    if (input.scheduleEnabled !== undefined) {
      set.scheduleEnabled = input.scheduleEnabled;
    }
    if (input.defaultRunMode !== undefined) {
      set.defaultRunMode = input.defaultRunMode;
    }
    if (input.intervalMinutes !== undefined) {
      set.intervalMinutes = intervalMinutes;
    }
    const nextPaused = input.paused ?? Boolean(current?.paused);
    const nextScheduleEnabled =
      input.scheduleEnabled ?? Boolean(current?.scheduleEnabled);
    if (
      !nextPaused &&
      nextScheduleEnabled &&
      (input.paused === false ||
        input.scheduleEnabled === true ||
        input.intervalMinutes !== undefined)
    ) {
      set.nextRunAt = new Date(Date.now() + intervalMinutes * 60_000);
    }
    await this.configModel
      .updateOne({ parserKey: definition.parserKey }, { $set: set })
      .exec();
    if (input.paused === true) {
      await this.cancelQueuedRuns(definition.parserKey, "parser-paused");
    } else if (input.scheduleEnabled === false) {
      await this.cancelQueuedRuns(
        definition.parserKey,
        "schedule-disabled",
        "schedule"
      );
    }
    const snapshot = await this.getSnapshot();
    return (snapshot.parsers as Record<string, any>[]).find(
      (parser) => parser.parserKey === definition.parserKey
    ) as Record<string, any>;
  }

  async queueManualRun(
    adminId: string,
    parserKey: string,
    requestedMode: FomoV2ParserRunMode,
    limit?: number,
    context: FomoV2ParserRunContext = {}
  ): Promise<Record<string, any>> {
    const cleanContext = this.cleanRunContext(context);
    const definition = this.requireDefinition(parserKey);
    if (
      definition.writeRequiresSnapshot &&
      requestedMode === "write" &&
      !cleanContext.snapshotId
    ) {
      throw new ConflictException(
        `${definition.parserKey} write is allowed only from a complete apiintel snapshot.`
      );
    }
    if (cleanContext.idempotencyKey) {
      const existing: any = await this.runModel
        .findOne({ idempotencyKey: cleanContext.idempotencyKey })
        .lean()
        .exec();
      if (existing) {
        this.assertIdempotentRun(
          existing,
          parserKey,
          requestedMode,
          cleanContext,
          limit
        );
        if (
          cleanContext.snapshotId &&
          IMMUTABLE_SNAPSHOT_RETRYABLE_STATUSES.includes(
            String(existing.status) as any
          )
        ) {
          return this.retryImmutableTerminalRun(
            existing,
            adminId,
            requestedMode,
            limit,
            cleanContext
          );
        }
        return existing;
      }
    }
    if (!isFomoV2ParserControlWorkerEnabled()) {
      throw new ConflictException("Parser worker is disabled on this server.");
    }
    const run = await this.queueRun({
      definition,
      requestedMode,
      trigger: "manual",
      adminId,
      limit,
      context: cleanContext,
    });
    if (!run) {
      throw new ConflictException(
        `Parser ${definition.parserKey} already has an active run.`
      );
    }
    return run;
  }

  async queueDueRuns(now = new Date()): Promise<number> {
    const global = await this.policyService.getGlobalState();
    if (!global.enabled) return 0;
    await this.ensureParserConfigs();
    const due = await this.configModel
      .find({
        parserKey: {
          $in: FOMO_V2_MANAGED_PARSERS.map((item) => item.parserKey),
        },
        scheduleEnabled: true,
        paused: false,
        nextRunAt: { $lte: now },
      })
      .sort({ nextRunAt: 1 })
      .limit(FOMO_V2_MANAGED_PARSERS.length)
      .lean()
      .exec();
    let queued = 0;
    for (const config of due) {
      const definition = managedParserDefinition(config.parserKey);
      if (!definition) continue;
      const run = await this.queueRun({
        definition,
        requestedMode:
          definition.writeRequiresSnapshot
            ? "dry-run"
            : config.defaultRunMode === "write"
            ? "write"
            : "dry-run",
        trigger: "schedule",
        adminId: "scheduler",
        now,
      });
      if (run) queued += 1;
    }
    return queued;
  }

  /**
   * Requeues only expired immutable snapshot imports. Mutable-source
   * and legacy writes are deliberately never replayed automatically.
   */
  async recoverExpiredSnapshotRuns(
    now = new Date(),
    maxRuns = 25
  ): Promise<number> {
    const global = await this.policyService.getGlobalState();
    if (!global.enabled) return 0;
    const bounded = Math.min(Math.max(Math.floor(maxRuns || 25), 1), 100);
    let recovered = 0;

    for (let attempt = 0; attempt < bounded; attempt += 1) {
      const recoveryOwner = `recovery:${process.pid}:${randomUUID()}`;
      const leaseExpiresAt = new Date(
        now.getTime() + FOMO_V2_PARSER_CONTROL_DEFAULT_LEASE_MS
      );
      const expired: any = await this.runModel
        .findOneAndUpdate(
          {
            status: { $in: ["running", "recovering"] },
            parserKey: {
              $in: FOMO_V2_MANAGED_PARSERS.filter(
                (definition) => definition.writeRequiresSnapshot
              ).map((definition) => definition.parserKey),
            },
            snapshotId: { $exists: true, $type: "string", $ne: "" },
            $or: [
              { leaseExpiresAt: { $lte: now } },
              { leaseExpiresAt: { $exists: false } },
            ],
          },
          [
            {
              $set: {
                status: "recovering",
                previousLeaseOwner: "$leaseOwner",
                leaseOwner: recoveryOwner,
                leaseExpiresAt,
                lastRecoveredAt: now,
                policyReason: "expired-immutable-snapshot-lease",
                attempt: { $add: [{ $ifNull: ["$attempt", 1] }, 1] },
                recoveryCount: {
                  $add: [{ $ifNull: ["$recoveryCount", 0] }, 1],
                },
              },
            },
          ],
          { new: false, sort: { leaseExpiresAt: 1, queuedAt: 1, _id: 1 } }
        )
        .lean()
        .exec();
      if (!expired?._id) break;

      const knownConfigOwners = Array.from(
        new Set(
          [expired.leaseOwner, expired.previousLeaseOwner]
            .map((value) => String(value || "").trim())
            .filter(Boolean)
        )
      );
      const ownedRunFilter = knownConfigOwners.length
        ? {
            activeRunId: expired._id,
            activeLeaseOwner: { $in: knownConfigOwners },
          }
        : {
            activeRunId: expired._id,
            activeLeaseOwner: { $in: [null, ""] },
          };
      const configFilter: Record<string, any> = {
        parserKey: expired.parserKey,
        paused: false,
        $or: [
          ownedRunFilter,
          {
            activeRunId: expired._id,
            activeLeaseExpiresAt: { $lte: now },
          },
          {
            activeRunId: expired._id,
            activeLeaseOwner: { $in: [null, ""] },
          },
          { activeRunId: { $exists: false } },
          { activeRunId: null },
        ],
      };
      const configFence = await this.configModel
        .updateOne(configFilter, {
          $set: {
            activeRunId: expired._id,
            activeLeaseOwner: recoveryOwner,
            activeLeaseExpiresAt: leaseExpiresAt,
          },
        })
        .exec();

      if (!mongoMatched(configFence)) {
        await this.runModel
          .updateOne(
            {
              _id: expired._id,
              status: "recovering",
              leaseOwner: recoveryOwner,
            },
            {
              $set: {
                status: "abandoned",
                finishedAt: now,
                writesDomainData: false,
                error:
                  "Expired snapshot run could not reacquire its parser config fence.",
                policyReason: "snapshot-recovery-config-fence-lost",
              },
            }
          )
          .exec();
        await this.releaseExpiredRecoveryConfig(
          expired,
          now,
          "snapshot-recovery-config-fence-lost"
        );
        continue;
      }

      const requeued = await this.runModel
        .updateOne(
          {
            _id: expired._id,
            status: "recovering",
            leaseOwner: recoveryOwner,
          },
          {
            $set: {
              status: "queued",
              queuedAt: now,
              previousLeaseOwner: expired.leaseOwner,
              leaseExpiresAt,
              policyReason: "recovered-expired-snapshot-lease",
              writesDomainData: false,
            },
            $unset: {
              startedAt: "",
              heartbeatAt: "",
              finishedAt: "",
              error: "",
              progress: "",
              summary: "",
            },
          }
        )
        .exec();
      if (mongoMatched(requeued)) {
        recovered += 1;
        continue;
      }

      await this.runModel
        .updateOne(
          {
            _id: expired._id,
            status: "recovering",
            leaseOwner: recoveryOwner,
          },
          {
            $set: {
              status: "abandoned",
              finishedAt: now,
              writesDomainData: false,
              error: "Snapshot recovery lost its run-state transition.",
              policyReason: "snapshot-recovery-run-fence-lost",
            },
          }
        )
        .exec();
      await this.configModel
        .updateOne(
          {
            parserKey: expired.parserKey,
            activeRunId: expired._id,
            activeLeaseOwner: recoveryOwner,
          },
          {
            $unset: {
              activeRunId: "",
              activeLeaseOwner: "",
              activeLeaseExpiresAt: "",
            },
          }
        )
        .exec();
    }

    return recovered;
  }

  async claimNextRun(leaseOwner: string): Promise<Record<string, any> | null> {
    // A queued run and its config live in separate collections. Claim the run,
    // then fence it against the config ownership that existed before claim.
    // If a pause/cancel/stale takeover won the race, abandon this claim and
    // continue looking instead of executing a superseded run.
    for (let attempts = 0; attempts < 100; attempts += 1) {
      const now = new Date();
      const leaseExpiresAt = new Date(
        now.getTime() + FOMO_V2_PARSER_CONTROL_DEFAULT_LEASE_MS
      );
      const queuedRun: any = await this.runModel
        .findOneAndUpdate(
          { status: "queued" },
          {
            $set: {
              status: "running",
              startedAt: now,
              heartbeatAt: now,
              leaseOwner,
              leaseExpiresAt,
            },
          },
          { new: false, sort: { queuedAt: 1, _id: 1 } }
        )
        .lean()
        .exec();
      if (!queuedRun?._id) return null;

      const configFilter: Record<string, any> = {
        parserKey: queuedRun.parserKey,
        activeRunId: queuedRun._id,
        paused: false,
      };
      if (queuedRun.leaseOwner) {
        configFilter.activeLeaseOwner = queuedRun.leaseOwner;
      }
      const configClaim = await this.configModel
        .updateOne(configFilter, {
          $set: {
            activeLeaseOwner: leaseOwner,
            activeLeaseExpiresAt: leaseExpiresAt,
          },
        })
        .exec();
      if (mongoMatched(configClaim)) {
        return {
          ...queuedRun,
          status: "running",
          startedAt: now,
          heartbeatAt: now,
          leaseOwner,
          leaseExpiresAt,
        };
      }

      await this.runModel
        .updateOne(
          { _id: queuedRun._id, status: "running", leaseOwner },
          {
            $set: {
              status: "abandoned",
              finishedAt: now,
              error:
                "Parser control ownership changed before the queued run was claimed.",
              policyReason: "lease-lost-before-claim",
              writesDomainData: false,
            },
          }
        )
        .exec();
    }

    return null;
  }

  async applyExecutionPolicy(run: Record<string, any>): Promise<{
    canRun: boolean;
    effectiveMode: FomoV2ParserRunMode;
    writesDomainData: boolean;
    blockedReason?: string;
  }> {
    // A mode already downgraded while queued can never be upgraded later.
    const candidateMode: FomoV2ParserRunMode =
      run.effectiveMode === "dry-run" ? "dry-run" : run.requestedMode;
    const policy = await this.policyService.resolve(
      String(run.parserKey),
      candidateMode
    );
    const policyUpdate = await this.runModel
      .updateOne(
        {
          _id: run._id,
          status: "running",
          leaseOwner: run.leaseOwner,
        },
        {
          $set: {
            effectiveMode: policy.effectiveMode,
            globalMode: policy.globalMode,
            dryRun: policy.effectiveMode === "dry-run",
            writesDomainData: policy.writesDomainData,
            policyReason: policy.blockedReason,
          },
          ...(!policy.blockedReason ? { $unset: { policyReason: "" } } : {}),
        }
      )
      .exec();
    this.requireLease(policyUpdate, String(run.parserKey));
    return policy;
  }

  async acquireGlobalWriteLease(
    runId: string,
    parserKey: string,
    leaseOwner: string
  ): Promise<"acquired" | "busy" | "blocked"> {
    const now = new Date();
    const leaseExpiresAt = new Date(
      now.getTime() + FOMO_V2_PARSER_CONTROL_DEFAULT_LEASE_MS
    );
    const acquired = await this.globalModel
      .updateOne(
        {
          _id: new Types.ObjectId(FOMO_V2_PARSER_GLOBAL_DOCUMENT_ID),
          enabled: true,
          mode: "prod",
          $or: [
            {
              activeWriteRunId: new Types.ObjectId(runId),
              activeWriteLeaseOwner: leaseOwner,
            },
            { activeWriteRunId: { $exists: false } },
            { activeWriteRunId: null },
            { activeWriteLeaseExpiresAt: { $lte: now } },
          ],
        },
        {
          $set: {
            activeWriteRunId: new Types.ObjectId(runId),
            activeWriteLeaseOwner: leaseOwner,
            activeWriteLeaseExpiresAt: leaseExpiresAt,
          },
        }
      )
      .exec();
    if (mongoMatched(acquired)) return "acquired";

    const policy = await this.policyService.resolve(parserKey, "write");
    return policy.canRun && policy.writesDomainData ? "busy" : "blocked";
  }

  async releaseGlobalWriteLease(
    runId: string,
    leaseOwner: string
  ): Promise<void> {
    await this.globalModel
      .updateOne(
        {
          _id: new Types.ObjectId(FOMO_V2_PARSER_GLOBAL_DOCUMENT_ID),
          activeWriteRunId: new Types.ObjectId(runId),
          activeWriteLeaseOwner: leaseOwner,
        },
        {
          $unset: {
            activeWriteRunId: "",
            activeWriteLeaseOwner: "",
            activeWriteLeaseExpiresAt: "",
          },
        }
      )
      .exec();
  }

  async deferClaimedRunForGlobalWriteLease(
    run: Record<string, any>
  ): Promise<void> {
    const leaseOwner = String(run.leaseOwner || "").trim();
    const deferred = await this.runModel
      .updateOne(
        { _id: run._id, status: "running", leaseOwner },
        {
          $set: {
            status: "queued",
            queuedAt: new Date(),
            writesDomainData: false,
            policyReason: "global-write-lease-busy",
          },
          $unset: { startedAt: "", heartbeatAt: "" },
        }
      )
      .exec();
    this.requireLease(deferred, String(run.parserKey));
  }

  async heartbeat(
    runId: string,
    leaseOwner: string,
    requireGlobalWriteLease = false
  ): Promise<void> {
    const now = new Date();
    const leaseExpiresAt = new Date(
      now.getTime() + FOMO_V2_PARSER_CONTROL_DEFAULT_LEASE_MS
    );
    const runHeartbeat = await this.runModel
      .updateOne(
        { _id: runId, status: "running", leaseOwner },
        { $set: { heartbeatAt: now, leaseExpiresAt } }
      )
      .exec();
    this.requireLease(runHeartbeat, runId);

    const configHeartbeat = await this.configModel
      .updateOne(
        { activeRunId: runId, activeLeaseOwner: leaseOwner },
        { $set: { activeLeaseExpiresAt: leaseExpiresAt } }
      )
      .exec();
    if (mongoMatched(configHeartbeat)) {
      if (requireGlobalWriteLease) {
        const globalHeartbeat = await this.globalModel
          .updateOne(
            {
              _id: new Types.ObjectId(FOMO_V2_PARSER_GLOBAL_DOCUMENT_ID),
              enabled: true,
              mode: "prod",
              activeWriteRunId: new Types.ObjectId(runId),
              activeWriteLeaseOwner: leaseOwner,
            },
            { $set: { activeWriteLeaseExpiresAt: leaseExpiresAt } }
          )
          .exec();
        this.requireLease(globalHeartbeat, runId);
      }
      return;
    }

    await this.runModel
      .updateOne(
        { _id: runId, status: "running", leaseOwner },
        {
          $set: {
            status: "abandoned",
            finishedAt: now,
            error: "Parser control lease ownership was lost during execution.",
            policyReason: "lease-lost",
          },
        }
      )
      .exec();
    throw new FomoV2ParserControlLeaseLostError(runId);
  }

  async reportExecutionProgress(
    runId: string,
    leaseOwner: string,
    input: Record<string, any>,
    requireGlobalWriteLease = false
  ): Promise<void> {
    await this.heartbeat(runId, leaseOwner, requireGlobalWriteLease);
    const progress = this.normalizeExecutionProgress(input);
    const result = await this.runModel
      .updateOne(
        { _id: runId, status: "running", leaseOwner },
        { $set: { progress } }
      )
      .exec();
    this.requireLease(result, runId);
  }

  async finishRun(
    run: Record<string, any>,
    input: {
      status: FomoV2ParserControlRunStatus;
      summary?: Record<string, any>;
      error?: string;
      policyReason?: string;
    }
  ): Promise<void> {
    const now = new Date();
    const leaseOwner = String(run.leaseOwner || "").trim();
    if (!leaseOwner) {
      throw new FomoV2ParserControlLeaseLostError(String(run.parserKey));
    }
    const leaseExpiresAt = new Date(
      now.getTime() + FOMO_V2_PARSER_CONTROL_DEFAULT_LEASE_MS
    );
    const ownershipFence = await this.configModel
      .updateOne(
        {
          parserKey: run.parserKey,
          activeRunId: run._id,
          activeLeaseOwner: leaseOwner,
        },
        { $set: { activeLeaseExpiresAt: leaseExpiresAt } }
      )
      .exec();
    this.requireLease(ownershipFence, String(run.parserKey));

    const error = cleanError(input.error);
    const runSet: Record<string, any> = {
      status: input.status,
      finishedAt: now,
      summary: input.summary || {},
    };
    if (error) runSet.error = error;
    if (input.policyReason) runSet.policyReason = input.policyReason;
    const runUpdate: Record<string, any> = { $set: runSet };
    if (!error) runUpdate.$unset = { error: "" };
    const finishedRun = await this.runModel
      .updateOne({ _id: run._id, status: "running", leaseOwner }, runUpdate)
      .exec();
    this.requireLease(finishedRun, String(run.parserKey));

    const configSet: Record<string, any> = {
      lastRunId: run._id,
      lastStatus: input.status,
      lastRunAt: run.startedAt || run.queuedAt || now,
      lastFinishedAt: now,
    };
    if (error) configSet.lastError = error;
    const configUpdate: Record<string, any> = {
      $set: configSet,
      $unset: {
        activeRunId: "",
        activeLeaseOwner: "",
        activeLeaseExpiresAt: "",
        ...(!error ? { lastError: "" } : {}),
      },
    };
    const releasedConfig = await this.configModel
      .updateOne(
        {
          parserKey: run.parserKey,
          activeRunId: run._id,
          activeLeaseOwner: leaseOwner,
        },
        configUpdate
      )
      .exec();
    this.requireLease(releasedConfig, String(run.parserKey));
  }

  private async queueRun(input: {
    definition: FomoV2ManagedParserDefinition;
    requestedMode: FomoV2ParserRunMode;
    trigger: ParserTrigger;
    adminId: string;
    limit?: number;
    now?: Date;
    context?: FomoV2ParserRunContext;
  }): Promise<Record<string, any> | null> {
    if (
      input.definition.writeRequiresSnapshot &&
      input.requestedMode === "write" &&
      !input.context?.snapshotId
    ) {
      if (input.trigger === "schedule") return null;
      throw new ConflictException(
        `${input.definition.parserKey} write is allowed only from a complete apiintel snapshot.`
      );
    }
    await this.ensureParserConfig(input.definition);
    const now = input.now || new Date();
    const [global, config]: [any, any] = await Promise.all([
      this.policyService.getGlobalState(),
      this.configModel
        .findOne({ parserKey: input.definition.parserKey })
        .lean()
        .exec(),
    ]);
    const policy = resolveFomoV2ParserExecutionPolicy({
      globalEnabled: global.enabled,
      globalMode: global.mode,
      paused: Boolean(config?.paused),
      requestedMode: input.requestedMode,
    });
    if (!policy.canRun) {
      if (input.trigger === "schedule") return null;
      throw new ConflictException(
        policy.blockedReason === "global-off"
          ? "Global parser control is OFF."
          : `Parser ${input.definition.parserKey} is paused.`
      );
    }

    const runId = new Types.ObjectId();
    const leaseOwner = `queue:${process.pid}:${randomUUID()}`;
    const leaseExpiresAt = new Date(
      now.getTime() + FOMO_V2_PARSER_CONTROL_DEFAULT_LEASE_MS
    );
    const acquisitionFilter: Record<string, any> = {
      parserKey: input.definition.parserKey,
      paused: false,
      $or: [
        { activeRunId: { $exists: false } },
        { activeRunId: null },
        { activeLeaseExpiresAt: { $lte: now } },
      ],
    };
    if (input.trigger === "schedule") {
      acquisitionFilter.scheduleEnabled = true;
      acquisitionFilter.nextRunAt = { $lte: now };
    }
    const configSet: Record<string, any> = {
      activeRunId: runId,
      activeLeaseOwner: leaseOwner,
      activeLeaseExpiresAt: leaseExpiresAt,
    };
    if (input.trigger === "schedule") {
      configSet.nextRunAt = new Date(
        now.getTime() + Number(config.intervalMinutes) * 60_000
      );
    }
    const previous: any = await this.configModel
      .findOneAndUpdate(acquisitionFilter, { $set: configSet }, { new: false })
      .lean()
      .exec();
    if (!previous) return null;

    if (previous.activeRunId) {
      const abandonedFilter: Record<string, any> = {
        _id: previous.activeRunId,
        status: { $in: ["queued", "running", "recovering"] },
      };
      if (previous.activeLeaseOwner) {
        abandonedFilter.leaseOwner = previous.activeLeaseOwner;
      }
      await this.runModel
        .updateOne(abandonedFilter, {
          $set: {
            status: "abandoned",
            finishedAt: now,
            error: "Parser control lease expired before the run completed.",
            policyReason: "lease-expired",
          },
        })
        .exec();
    }

    const maxLimit = input.context?.snapshotId ? 100_000 : 1_000;
    const limit = Math.min(
      Math.max(
        Math.floor(Number(input.limit || input.definition.defaultLimit)),
        1
      ),
      maxLimit
    );
    try {
      const created = await this.runModel.create({
        _id: runId,
        parserKey: input.definition.parserKey,
        pipeline: input.definition.pipeline,
        sourceType: input.definition.sourceType,
        trigger: input.trigger,
        requestedMode: input.requestedMode,
        effectiveMode: policy.effectiveMode,
        globalMode: global.mode,
        dryRun: policy.effectiveMode === "dry-run",
        writesDomainData: policy.writesDomainData,
        status: "queued",
        attempt: 1,
        recoveryCount: 0,
        requestedByAdminId: cleanAdminId(input.adminId),
        queuedAt: now,
        leaseOwner,
        leaseExpiresAt,
        limit,
        policyReason: policy.blockedReason,
        snapshotId: input.context?.snapshotId,
        upstreamRunId: input.context?.upstreamRunId,
        idempotencyKey: input.context?.idempotencyKey,
      });
      return created.toObject();
    } catch (error: any) {
      await this.configModel
        .updateOne(
          {
            parserKey: input.definition.parserKey,
            activeRunId: runId,
            activeLeaseOwner: leaseOwner,
          },
          {
            $unset: {
              activeRunId: "",
              activeLeaseOwner: "",
              activeLeaseExpiresAt: "",
            },
          }
        )
        .exec();
      if (error?.code === 11000 && input.context?.idempotencyKey) {
        const existing: any = await this.runModel
          .findOne({ idempotencyKey: input.context.idempotencyKey })
          .lean()
          .exec();
        if (existing) {
          this.assertIdempotentRun(
            existing,
            input.definition.parserKey,
            input.requestedMode,
            input.context,
            input.limit
          );
          if (
            input.context.snapshotId &&
            IMMUTABLE_SNAPSHOT_RETRYABLE_STATUSES.includes(
              String(existing.status) as any
            )
          ) {
            return this.retryImmutableTerminalRun(
              existing,
              input.adminId,
              input.requestedMode,
              input.limit,
              input.context
            );
          }
          return existing;
        }
      }
      throw error;
    }
  }

  private async cancelQueuedRuns(
    parserKey?: string,
    reason = "cancelled",
    trigger?: ParserTrigger
  ): Promise<void> {
    const filter: Record<string, any> = {
      status: { $in: ["queued", "recovering"] },
    };
    if (parserKey) filter.parserKey = parserKey;
    if (trigger) filter.trigger = trigger;
    while (true) {
      const now = new Date();
      const cancelled: any = await this.runModel
        .findOneAndUpdate(
          filter,
          {
            $set: {
              status: "cancelled",
              finishedAt: now,
              policyReason: reason,
              writesDomainData: false,
            },
          },
          { new: true, sort: { queuedAt: 1, _id: 1 } }
        )
        .lean()
        .exec();
      if (!cancelled?._id) return;

      const configFilter: Record<string, any> = {
        parserKey: cancelled.parserKey,
        activeRunId: cancelled._id,
      };
      if (cancelled.leaseOwner) {
        configFilter.activeLeaseOwner = cancelled.leaseOwner;
      }
      await this.configModel
        .updateOne(configFilter, {
          $set: {
            lastRunId: cancelled._id,
            lastStatus: "cancelled",
            lastRunAt: cancelled.queuedAt || now,
            lastFinishedAt: now,
          },
          $unset: {
            activeRunId: "",
            activeLeaseOwner: "",
            activeLeaseExpiresAt: "",
          },
        })
        .exec();
    }
  }

  private async retryImmutableTerminalRun(
    existing: Record<string, any>,
    adminId: string,
    requestedMode: FomoV2ParserRunMode,
    requestedLimit: number | undefined,
    context: FomoV2ParserRunContext
  ): Promise<Record<string, any>> {
    const definition = managedParserDefinition(String(existing.parserKey || ""));
    if (
      !definition?.writeRequiresSnapshot ||
      !context.snapshotId ||
      !IMMUTABLE_SNAPSHOT_RETRYABLE_STATUSES.includes(
        String(existing.status) as any
      )
    ) {
      return existing;
    }
    if (!isFomoV2ParserControlWorkerEnabled()) {
      throw new ConflictException("Parser worker is disabled on this server.");
    }
    await this.ensureParserConfig(definition);
    const now = new Date();
    const [global, config]: [any, any] = await Promise.all([
      this.policyService.getGlobalState(),
      this.configModel
        .findOne({ parserKey: definition.parserKey })
        .lean()
        .exec(),
    ]);
    const policy = resolveFomoV2ParserExecutionPolicy({
      globalEnabled: global.enabled,
      globalMode: global.mode,
      paused: Boolean(config?.paused),
      requestedMode,
    });
    if (!policy.canRun) {
      throw new ConflictException(
        policy.blockedReason === "global-off"
          ? "Global parser control is OFF."
          : `Parser ${definition.parserKey} is paused.`
      );
    }

    const leaseOwner = `retry:${process.pid}:${randomUUID()}`;
    const leaseExpiresAt = new Date(
      now.getTime() + FOMO_V2_PARSER_CONTROL_DEFAULT_LEASE_MS
    );

    // Claim the terminal run before touching its config. This serializes
    // concurrent requests using the same idempotency key and prevents a loser
    // from clearing the winner's config fence.
    const claimed: any = await this.runModel
      .findOneAndUpdate(
        {
          _id: existing._id,
          status: { $in: [...IMMUTABLE_SNAPSHOT_RETRYABLE_STATUSES] },
          snapshotId: context.snapshotId,
        },
        {
          $set: {
            status: "recovering",
            leaseOwner,
            leaseExpiresAt,
            previousLeaseOwner: existing.leaseOwner,
            policyReason: "explicit-immutable-snapshot-retry-claim",
            writesDomainData: false,
          },
        },
        { new: false }
      )
      .lean()
      .exec();
    if (!claimed) {
      const current: any = await this.runModel
        .findOne({ _id: existing._id })
        .lean()
        .exec();
      if (
        current &&
        ["queued", "recovering", "running"].includes(String(current.status))
      ) {
        return current;
      }
      throw new ConflictException(
        "Immutable snapshot retry lost its run-state claim."
      );
    }

    const sameRunOwner = claimed.leaseOwner
      ? {
          activeRunId: existing._id,
          activeLeaseOwner: claimed.leaseOwner,
        }
      : {
          activeRunId: existing._id,
          activeLeaseOwner: { $in: [null, ""] },
        };
    const previous: any = await this.configModel
      .findOneAndUpdate(
        {
          parserKey: definition.parserKey,
          paused: false,
          $or: [
            { activeRunId: { $exists: false } },
            { activeRunId: null },
            { activeLeaseExpiresAt: { $lte: now } },
            sameRunOwner,
          ],
        },
        {
          $set: {
            activeRunId: existing._id,
            activeLeaseOwner: leaseOwner,
            activeLeaseExpiresAt: leaseExpiresAt,
          },
        },
        { new: false }
      )
      .lean()
      .exec();
    if (!previous) {
      await this.runModel
        .updateOne(
          {
            _id: existing._id,
            status: "recovering",
            leaseOwner,
          },
          {
            $set: {
              status: claimed.status,
              writesDomainData: false,
              ...(claimed.leaseOwner ? { leaseOwner: claimed.leaseOwner } : {}),
              ...(claimed.leaseExpiresAt
                ? { leaseExpiresAt: claimed.leaseExpiresAt }
                : {}),
              policyReason: "immutable-snapshot-retry-config-busy",
            },
            $unset: {
              ...(!claimed.leaseOwner ? { leaseOwner: "" } : {}),
              ...(!claimed.leaseExpiresAt ? { leaseExpiresAt: "" } : {}),
            },
          }
        )
        .exec();
      throw new ConflictException(
        `Parser ${definition.parserKey} already has an active run.`
      );
    }

    if (
      previous.activeRunId &&
      String(previous.activeRunId) !== String(existing._id)
    ) {
      const abandonedFilter: Record<string, any> = {
        _id: previous.activeRunId,
        status: { $in: ["queued", "running", "recovering"] },
      };
      if (previous.activeLeaseOwner) {
        abandonedFilter.leaseOwner = previous.activeLeaseOwner;
      }
      await this.runModel
        .updateOne(abandonedFilter, {
          $set: {
            status: "abandoned",
            finishedAt: now,
            writesDomainData: false,
            error: "Parser control lease expired before retry acquisition.",
            policyReason: "lease-expired-before-immutable-retry",
          },
        })
        .exec();
    }

    const limit = Math.min(
      Math.max(
        Math.floor(
          Number(requestedLimit || existing.limit || definition.defaultLimit)
        ),
        1
      ),
      100_000
    );
    const retried: any = await this.runModel
      .findOneAndUpdate(
        {
          _id: existing._id,
          status: "recovering",
          leaseOwner,
          snapshotId: context.snapshotId,
        },
        {
          $set: {
            status: "queued",
            requestedMode,
            effectiveMode: policy.effectiveMode,
            globalMode: global.mode,
            dryRun: policy.effectiveMode === "dry-run",
            writesDomainData: policy.writesDomainData,
            requestedByAdminId: cleanAdminId(adminId),
            queuedAt: now,
            leaseOwner,
            leaseExpiresAt,
            limit,
            upstreamRunId: context.upstreamRunId,
            policyReason: "explicit-immutable-snapshot-retry",
          },
          $inc: { attempt: 1 },
          $unset: {
            startedAt: "",
            heartbeatAt: "",
            finishedAt: "",
            error: "",
            progress: "",
            summary: "",
          },
        },
        { new: true }
      )
      .lean()
      .exec();
    if (retried) return retried;

    await this.configModel
      .updateOne(
        {
          parserKey: definition.parserKey,
          activeRunId: existing._id,
          activeLeaseOwner: leaseOwner,
        },
        {
          $unset: {
            activeRunId: "",
            activeLeaseOwner: "",
            activeLeaseExpiresAt: "",
          },
        }
      )
      .exec();
    const current: any = await this.runModel
      .findOne({ _id: existing._id })
      .lean()
      .exec();
    if (
      current &&
      ["queued", "recovering", "running"].includes(String(current.status))
    ) {
      return current;
    }
    throw new ConflictException(
      "Immutable snapshot retry lost its queue race."
    );
  }

  private async releaseExpiredRecoveryConfig(
    run: Record<string, any>,
    now: Date,
    reason: string
  ): Promise<void> {
    const knownOwners = Array.from(
      new Set(
        [run.leaseOwner, run.previousLeaseOwner]
          .map((value) => String(value || "").trim())
          .filter(Boolean)
      )
    );
    if (!knownOwners.length) return;
    const filter: Record<string, any> = {
      parserKey: run.parserKey,
      activeRunId: run._id,
      activeLeaseOwner: { $in: knownOwners },
    };
    await this.configModel
      .updateOne(filter, {
        $set: {
          lastRunId: run._id,
          lastStatus: "abandoned",
          lastRunAt: run.startedAt || run.queuedAt || now,
          lastFinishedAt: now,
          lastError: reason,
        },
        $unset: {
          activeRunId: "",
          activeLeaseOwner: "",
          activeLeaseExpiresAt: "",
        },
      })
      .exec();
  }

  private requireLease(
    result: { matchedCount?: number; n?: number },
    parserKey: string
  ): void {
    if (mongoMatched(result)) return;
    throw new FomoV2ParserControlLeaseLostError(parserKey);
  }

  private normalizeExecutionProgress(
    input: Record<string, any>
  ): Record<string, any> {
    const output: Record<string, any> = { updatedAt: new Date() };
    for (const key of ["phase", "step", "status"] as const) {
      const value = String(input?.[key] || "").trim();
      if (value) output[key] = value.slice(0, 160);
    }
    for (const key of [
      "stepIndex",
      "stepCount",
      "batch",
      "scanned",
      "written",
    ] as const) {
      const value = Number(input?.[key]);
      if (Number.isFinite(value) && value >= 0) {
        output[key] = Math.floor(value);
      }
    }
    return output;
  }

  private async ensureParserConfigs(): Promise<void> {
    for (const definition of FOMO_V2_MANAGED_PARSERS) {
      await this.ensureParserConfig(definition);
    }
  }

  private async ensureParserConfig(
    definition: FomoV2ManagedParserDefinition
  ): Promise<void> {
    const now = new Date();
    await this.configModel
      .updateOne(
        { _id: parserConfigId(definition.parserKey) },
        {
          $set: {
            parserKey: definition.parserKey,
            pipeline: definition.pipeline,
            sourceType: definition.sourceType,
          },
          $setOnInsert: {
            paused: false,
            scheduleEnabled: false,
            defaultRunMode: definition.defaultRunMode,
            intervalMinutes: definition.defaultIntervalMinutes,
            nextRunAt: new Date(
              now.getTime() + definition.defaultIntervalMinutes * 60_000
            ),
          },
        },
        { upsert: true, setDefaultsOnInsert: true }
      )
      .exec();
  }

  private deriveStatus(
    globalEnabled: boolean,
    config: Record<string, any>,
    currentRun?: Record<string, any>
  ): string {
    if (
      currentRun &&
      ["queued", "recovering", "running"].includes(currentRun.status)
    ) {
      return currentRun.status;
    }
    if (!globalEnabled) return "global-off";
    if (config.paused) return "paused";
    return config.lastStatus || "idle";
  }

  private requireDefinition(parserKey: string): FomoV2ManagedParserDefinition {
    const definition = managedParserDefinition(parserKey);
    if (!definition) {
      throw new NotFoundException(`Managed parser was not found: ${parserKey}`);
    }
    return definition;
  }

  private cleanRunContext(
    context: FomoV2ParserRunContext
  ): FomoV2ParserRunContext {
    const snapshotId = cleanContextValue(context.snapshotId, 200);
    const upstreamRunId = cleanContextValue(context.upstreamRunId, 200);
    const idempotencyKey = cleanContextValue(context.idempotencyKey, 300);
    if (snapshotId && !/^[a-zA-Z0-9][a-zA-Z0-9:_.-]*$/.test(snapshotId)) {
      throw new BadRequestException("Invalid parser snapshotId.");
    }
    if (upstreamRunId && !/^[a-zA-Z0-9][a-zA-Z0-9:_.-]*$/.test(upstreamRunId)) {
      throw new BadRequestException("Invalid upstreamRunId.");
    }
    if (idempotencyKey && /[\r\n]/.test(idempotencyKey)) {
      throw new BadRequestException("Invalid parser run idempotencyKey.");
    }
    return { snapshotId, upstreamRunId, idempotencyKey };
  }

  private assertIdempotentRun(
    existing: Record<string, any>,
    parserKey: string,
    requestedMode: FomoV2ParserRunMode,
    context: FomoV2ParserRunContext,
    requestedLimit?: number
  ): void {
    if (
      existing.parserKey !== parserKey ||
      existing.requestedMode !== requestedMode ||
      String(existing.snapshotId || "") !== String(context.snapshotId || "") ||
      String(existing.upstreamRunId || "") !==
        String(context.upstreamRunId || "") ||
      (requestedLimit !== undefined &&
        Number(existing.limit) !== Number(requestedLimit))
    ) {
      throw new ConflictException(
        "Parser run idempotency key was already used with different input."
      );
    }
  }
}

function parserConfigId(parserKey: string): Types.ObjectId {
  const hex = createHash("sha256")
    .update(`parser-control:${parserKey}`)
    .digest("hex");
  return new Types.ObjectId(hex.slice(0, 24));
}

function cleanAdminId(value: string): string | undefined {
  const text = String(value || "").trim();
  return text ? text.slice(0, 200) : undefined;
}

function cleanContextValue(value: any, maxLength: number): string | undefined {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, maxLength) : undefined;
}

function cleanError(value?: string): string | undefined {
  const text = String(value || "").trim();
  return text ? text.slice(0, 2_000) : undefined;
}

function mongoMatched(result: { matchedCount?: number; n?: number }): boolean {
  return Number(result?.matchedCount ?? result?.n ?? 0) > 0;
}
