import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomUUID } from "crypto";
import { Model } from "mongoose";
import {
  FomoV2ParserRunMode,
  FomoV2UpstreamFlowStatus,
  FomoV2UpstreamParserFlow,
  FomoV2UpstreamParserFlowDocument,
  FomoV2UpstreamParserPolicy,
  FomoV2UpstreamParserPolicyDocument,
} from "../../../models/parser-control.model";
import {
  ImportParserSnapshotDto,
  StartUpstreamParserRunDto,
  UpdateUpstreamAutoImportPolicyDto,
  UpdateUpstreamParserDto,
} from "../dto/parser-control.dto";
import {
  FOMO_V2_UPSTREAM_PARSER_FLOWS,
  upstreamParserFlow,
  upstreamPipelineAllowed,
} from "../upstream-parser-flow.constants";
import {
  IntelParserControlClient,
  IntelParserControlClientError,
} from "./intel-parser-control.client";
import { FomoV2ParserControlPolicyService } from "./parser-control-policy.service";
import { FomoV2ParserControlService } from "./parser-control.service";
import { FomoV2ParserControlWorkerService } from "./parser-control-worker.service";

const ACTIVE_FLOW_STATUSES: FomoV2UpstreamFlowStatus[] = [
  "creating",
  "queued",
  "running",
  "pause_requested",
  "paused",
  "resume_requested",
  "cancel_requested",
];
@Injectable()
export class FomoV2UpstreamParserOrchestrationService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(
    FomoV2UpstreamParserOrchestrationService.name
  );
  private reconciling = false;
  private reconcileTimer?: ReturnType<typeof setInterval>;

  constructor(
    @InjectModel(FomoV2UpstreamParserFlow.name)
    private readonly flowModel: Model<FomoV2UpstreamParserFlowDocument>,
    private readonly intel: IntelParserControlClient,
    private readonly policy: FomoV2ParserControlPolicyService,
    private readonly parserControl: FomoV2ParserControlService,
    private readonly parserWorker: FomoV2ParserControlWorkerService,
    @Optional()
    @InjectModel(FomoV2UpstreamParserPolicy.name)
    private readonly upstreamPolicyModel?: Model<FomoV2UpstreamParserPolicyDocument>
  ) {}

  onModuleInit(): void {
    // Upstream runs are also available when the app-wide CRON_ENABLED flag is
    // false: manual admin runs still need progress/snapshot reconciliation.
    // Therefore this control-plane poller intentionally does not depend on
    // Nest ScheduleModule.
    this.reconcileTimer = setInterval(() => void this.reconcile(), 10_000);
    this.reconcileTimer.unref?.();
    const initialTimer = setTimeout(() => void this.reconcile(), 1_000);
    initialTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.reconcileTimer) clearInterval(this.reconcileTimer);
    this.reconcileTimer = undefined;
  }

  async dashboard(): Promise<Record<string, any>> {
    const [localSnapshot, flows, policies] = await Promise.all([
      this.parserControl.getSnapshot(10),
      this.listFlows(50),
      this.listPolicies(),
    ]);
    const policyByParserKey = new Map(
      policies.map((policy) => [String(policy.parserKey), policy])
    );
    const checkedAt = new Date();
    try {
      const upstream = await this.intel.listParsers();
      const upstreamParsers = arrayFrom(upstream, "parsers");
      const upstreamRuns = arrayFrom(upstream, "runs").length
        ? arrayFrom(upstream, "runs")
        : arrayFrom(upstream, "recentRuns");
      const environmentMatches =
        String(upstream.environment || "") ===
        String(localSnapshot.global?.mode || "");
      const environmentCompatible = isEnvironmentCompatible(
        localSnapshot.global?.mode,
        upstream.environment
      );
      const parsers = upstreamParsers
        .filter((parser) =>
          Boolean(upstreamParserFlow(parser.parserKey || parser.key))
        )
        .map((parser) =>
          this.decorateParser(
            parser,
            flows,
            upstreamRuns,
            upstream.worker,
            Boolean(localSnapshot.global?.enabled),
            environmentCompatible,
            policyByParserKey.get(
              String(parser.parserKey || parser.key || "")
            )
          )
        );
      return {
        connected: true,
        health: {
          connected: true,
          status: "online",
          checkedAt,
          heartbeatAt:
            upstream.worker?.lastTickAt ||
            upstream.worker?.heartbeatAt ||
            undefined,
          environmentMatches,
          environmentCompatible,
        },
        global: {
          ...localSnapshot.global,
          upstreamEnvironment: upstream.environment,
          upstreamWorker: upstream.worker,
          environmentMatches,
          environmentCompatible,
        },
        parsers,
        runs: upstreamRuns,
        flows,
      };
    } catch (error: any) {
      return {
        connected: false,
        health: {
          connected: false,
          status: "unreachable",
          checkedAt,
          error: publicClientError(error),
        },
        global: localSnapshot.global,
        parsers: this.localParserFallback(flows, policyByParserKey),
        runs: [],
        flows,
      };
    }
  }

  async startRun(
    adminId: string,
    parserKey: string,
    input: StartUpstreamParserRunDto
  ): Promise<Record<string, any>> {
    const normalizedKey = requireKey(parserKey, "parserKey");
    const flowDefinition = upstreamParserFlow(normalizedKey);
    if (!flowDefinition) {
      throw new BadRequestException(
        `Unsupported upstream parser: ${normalizedKey}`
      );
    }
    const explicitAutoImports = normalizeRequestedAutoImports(input);
    const hasExplicitAutoImportOverride =
      input.autoImport !== undefined || input.autoImports !== undefined;
    const storedPolicy = hasExplicitAutoImportOverride
      ? undefined
      : await this.findPolicy(normalizedKey);
    const requestedAutoImports = hasExplicitAutoImportOverride
      ? explicitAutoImports
      : autoImportsFromPolicy(flowDefinition, storedPolicy);
    for (const autoImport of requestedAutoImports) {
      if (
        !upstreamPipelineAllowed(
          normalizedKey,
          flowDefinition.sourceType,
          autoImport.pipelineKey
        )
      ) {
        throw new BadRequestException(
          `Pipeline ${autoImport.pipelineKey} cannot import snapshots from ${normalizedKey}.`
        );
      }
    }
    const global = await this.policy.getGlobalState();
    if (!global.enabled) {
      throw new ConflictException("Global parser control is OFF.");
    }
    const upstreamEnvironment = await this.assertUpstreamEnvironment(
      global.mode,
      normalizedKey
    );
    const filters = safeFilters(input.filters);
    const flowId = randomUUID();
    const sourceType = flowDefinition.sourceType;
    const created = await this.flowModel.create({
      flowId,
      idempotencyKey: `upstream:${flowId}`,
      parserKey: normalizedKey,
      sourceType,
      globalMode: global.mode,
      upstreamEnvironment,
      requestedByAdminId: cleanText(adminId, 200),
      entityLimit: input.entityLimit,
      filters,
      status: "creating",
      upstreamReachable: false,
      ...(requestedAutoImports.length
        ? {
            autoImport: {
              targets: requestedAutoImports.map((autoImport) => ({
                pipelineKey: autoImport.pipelineKey,
                requestedMode: autoImport.mode,
                mode:
                  global.mode === "test" ? "dry-run" : autoImport.mode,
                limit: autoImport.limit ?? input.entityLimit,
              })),
            },
            autoImportStatus: "pending",
          }
        : {}),
    });

    try {
      const response = await this.intel.startRun(normalizedKey, {
        entityLimit: input.entityLimit,
        filters,
        flowId,
        environment: upstreamEnvironment,
      });
      const run = extractRun(response);
      const externalRunId = runIdOf(run);
      if (!externalRunId) {
        throw new Error("apiintel response does not contain runId.");
      }
      assertRunSource(run, normalizedKey, sourceType);
      return this.updateFlowFromRun(String(created._id), run);
    } catch (error: any) {
      const updated = await this.flowModel
        .findByIdAndUpdate(
          created._id,
          {
            $set: {
              status: "unreachable",
              upstreamReachable: false,
              lastError: safeError(error),
              lastSyncedAt: new Date(),
            },
          },
          { new: true }
        )
        .lean()
        .exec();
      throwUpstreamMutationError(error, updated || created.toObject());
    }
  }

  async updateParser(
    parserKey: string,
    input: UpdateUpstreamParserDto
  ): Promise<Record<string, any>> {
    const normalizedKey = requireKey(parserKey, "parserKey");
    if (!upstreamParserFlow(normalizedKey)) {
      throw new BadRequestException(
        `Unsupported upstream parser: ${normalizedKey}`
      );
    }
    const global = await this.policy.getGlobalState();
    if (
      !global.enabled &&
      (input.enabled === true ||
        input.paused === false ||
        input.scheduleEnabled === true)
    ) {
      throw new ConflictException(
        "Global parser control is OFF. Enable it before activating an upstream parser."
      );
    }
    if (
      input.enabled === true ||
      input.paused === false ||
      input.scheduleEnabled === true
    ) {
      await this.assertUpstreamEnvironment(global.mode, normalizedKey);
    }
    if (
      input.enabled === undefined &&
      input.paused === undefined &&
      input.scheduleEnabled === undefined &&
      input.intervalMinutes === undefined &&
      input.defaultEntityLimit === undefined
    ) {
      throw new BadRequestException(
        "At least one upstream parser setting is required."
      );
    }
    try {
      const response = await this.intel.updateParser(normalizedKey, input);
      const parser =
        response?.parser && typeof response.parser === "object"
          ? response.parser
          : response;
      return { connected: true, parser };
    } catch (error: any) {
      throwUpstreamMutationError(error, {
        parser: { parserKey: normalizedKey },
      });
    }
  }

  async updateAutoImportPolicy(
    adminId: string,
    parserKey: string,
    input: UpdateUpstreamAutoImportPolicyDto
  ): Promise<Record<string, any>> {
    const normalizedKey = requireKey(parserKey, "parserKey");
    const flowDefinition = upstreamParserFlow(normalizedKey);
    if (!flowDefinition) {
      throw new BadRequestException(
        `Unsupported upstream parser: ${normalizedKey}`
      );
    }
    if (!this.upstreamPolicyModel) {
      throw new Error("Upstream parser policy storage is not configured.");
    }
    const targets = normalizeTargetKeys(input.autoImportTargets);
    for (const pipelineKey of targets) {
      if (
        !upstreamPipelineAllowed(
          normalizedKey,
          flowDefinition.sourceType,
          pipelineKey
        )
      ) {
        throw new BadRequestException(
          `Pipeline ${pipelineKey} cannot import snapshots from ${normalizedKey}.`
        );
      }
    }
    if (input.autoImportMode !== "off" && !targets.length) {
      throw new BadRequestException(
        "At least one downstream target is required when automatic import is enabled."
      );
    }
    const global = await this.policy.getGlobalState();
    if (input.autoImportMode === "write" && global.mode !== "prod") {
      throw new ConflictException(
        "Automatic WRITE can be configured only while this main backend is in PROD mode."
      );
    }
    const effectiveFromAt = new Date();
    const updated: any = await this.upstreamPolicyModel
      .findOneAndUpdate(
        { parserKey: normalizedKey },
        {
          $set: {
            sourceType: flowDefinition.sourceType,
            autoImportMode: input.autoImportMode,
            autoImportTargets: targets,
            effectiveFromAt,
            updatedByAdminId: cleanText(adminId, 200),
          },
          $setOnInsert: { parserKey: normalizedKey },
          $inc: { revision: 1 },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
      .lean()
      .exec();
    return {
      connected: true,
      policy: compactAutoImportPolicy(flowDefinition, updated),
    };
  }

  async pauseAllForGlobalOff(): Promise<Record<string, any>> {
    try {
      const [upstream, global] = await Promise.all([
        this.intel.listParsers(),
        this.policy.getGlobalState(),
      ]);
      const environmentMatches = isEnvironmentCompatible(
        global.mode,
        upstream.environment
      );
      const result =
        !global.enabled || !environmentMatches
          ? await this.pauseUpstreamParsers(arrayFrom(upstream, "parsers"))
          : {
              connected: true,
              total: arrayFrom(upstream, "parsers").length,
              paused: 0,
              failures: [],
            };
      return { ...result, environmentMatches };
    } catch (error: any) {
      return {
        connected: false,
        total: 0,
        paused: 0,
        failures: [{ parserKey: "*", error: publicClientError(error) }],
      };
    }
  }

  async listRuns(limit = 50, parserKey?: string): Promise<Record<string, any>> {
    const bounded = Math.min(Math.max(Math.floor(Number(limit) || 50), 1), 100);
    const filter = parserKey
      ? { parserKey: requireKey(parserKey, "parserKey") }
      : {};
    const runs = await this.flowModel
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(bounded)
      .lean()
      .exec();
    return { runs };
  }

  async getRun(runId: string): Promise<Record<string, any>> {
    const flow = await this.requireFlowWithDiscovery(runId);
    if (!flow.externalRunId) return flow;
    try {
      const response = await this.intel.getRun(flow.externalRunId);
      return this.updateFlowFromRun(String(flow._id), extractRun(response));
    } catch (error: any) {
      const updated = await this.markUnreachable(flow, error);
      return { ...updated, upstreamError: publicClientError(error) };
    }
  }

  async controlRun(
    runId: string,
    action: "pause" | "resume" | "cancel"
  ): Promise<Record<string, any>> {
    const flow = await this.requireFlowWithDiscovery(runId);
    if (action === "resume") {
      const global = await this.policy.getGlobalState();
      if (!global.enabled) {
        throw new ConflictException("Global parser control is OFF.");
      }
      await this.assertUpstreamEnvironment(global.mode, flow.parserKey);
    }
    if (!flow.externalRunId) {
      throw new ConflictException("Upstream run has not been created.");
    }
    const requestedStatus: FomoV2UpstreamFlowStatus =
      action === "pause"
        ? "pause_requested"
        : action === "resume"
        ? "resume_requested"
        : "cancel_requested";
    await this.flowModel
      .updateOne(
        { _id: flow._id },
        {
          $set: { status: requestedStatus },
          $unset: { lastError: "" },
        }
      )
      .exec();
    try {
      const response = await this.intel.controlRun(flow.externalRunId, action);
      return this.updateFlowFromRun(String(flow._id), extractRun(response));
    } catch (error: any) {
      const updated = await this.markUnreachable(
        { ...flow, status: requestedStatus },
        error
      );
      throwUpstreamMutationError(error, updated);
    }
  }

  async importSnapshot(
    adminId: string,
    snapshotId: string,
    input: ImportParserSnapshotDto
  ): Promise<Record<string, any>> {
    const cleanSnapshotId = requireKey(snapshotId, "snapshotId", 200);
    const response = await this.intel
      .getSnapshot(cleanSnapshotId)
      .catch((error: any) =>
        throwUpstreamMutationError(error, { snapshotId: cleanSnapshotId })
      );
    const snapshot = extractSnapshot(response);
    const returnedSnapshotId = requireKey(
      snapshot.snapshotId || snapshot.id,
      "snapshot.snapshotId",
      200
    );
    if (returnedSnapshotId !== cleanSnapshotId) {
      throw new BadRequestException(
        `apiintel snapshot identity mismatch: requested ${cleanSnapshotId}, received ${returnedSnapshotId}.`
      );
    }
    const snapshotParserKey = requireKey(
      snapshot.parserKey,
      "snapshot.parserKey"
    );
    const snapshotSourceType = requireKey(
      snapshot.sourceType,
      "snapshot.sourceType"
    ).toLowerCase();
    const snapshotFlowDefinition = upstreamParserFlow(snapshotParserKey);
    if (
      !snapshotFlowDefinition ||
      !upstreamPipelineAllowed(
        snapshotParserKey,
        snapshotSourceType,
        input.pipelineKey
      )
    ) {
      throw new BadRequestException(
        `Pipeline ${input.pipelineKey} cannot import snapshot ${cleanSnapshotId} from ${snapshotParserKey}/${snapshotSourceType}.`
      );
    }
    assertSnapshotSource(
      snapshot,
      snapshotFlowDefinition.parserKey,
      snapshotFlowDefinition.sourceType
    );
    const snapshotEnvironment = requireParserEnvironment(
      snapshot.environment,
      "snapshot.environment"
    );
    if (String(snapshot.status || "") !== "complete") {
      throw new ConflictException(
        "Only complete parser snapshots can be imported."
      );
    }
    const global = await this.policy.getGlobalState();
    if (input.mode === "write" && global.mode !== "prod") {
      throw new ConflictException(
        "Snapshot write imports are available only in PROD."
      );
    }
    if (input.mode === "write" && snapshotEnvironment !== "prod") {
      throw new ConflictException(
        "Only PROD snapshots can be written to FOMO DB."
      );
    }
    const flow: any = await this.flowModel
      .findOne({ snapshotId: cleanSnapshotId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    if (flow) {
      if (
        flow.parserKey !== snapshotParserKey ||
        flow.sourceType !== snapshotSourceType ||
        String(flow.snapshotId || "") !== cleanSnapshotId
      ) {
        throw new BadRequestException(
          "Stored upstream flow identity does not match the requested snapshot."
        );
      }
      if (
        flow.upstreamEnvironment &&
        snapshotEnvironment !== String(flow.upstreamEnvironment)
      ) {
        throw new BadRequestException(
          "Snapshot environment does not match the stored upstream flow."
        );
      }
      assertFlowPipeline(flow, input.pipelineKey);
    }
    const successfulSnapshotItems = Number(snapshot.counts?.succeeded || 0);
    if (
      input.mode === "write" &&
      (!Number.isFinite(successfulSnapshotItems) || successfulSnapshotItems < 1)
    ) {
      throw new ConflictException(
        "Snapshot write requires a positive succeeded item count."
      );
    }
    if (
      input.mode === "write" &&
      input.limit !== undefined &&
      Number(input.limit) !== successfulSnapshotItems
    ) {
      throw new BadRequestException(
        "Snapshot write is always full: omit limit or set it to counts.succeeded."
      );
    }
    const importLimit =
      input.mode === "write"
        ? Math.min(Math.floor(successfulSnapshotItems), 100_000)
        : input.limit ??
          (flow?.entityLimit
            ? Math.min(Math.max(Number(flow.entityLimit), 1), 100_000)
            : successfulSnapshotItems
            ? Math.min(Math.max(successfulSnapshotItems, 1), 100_000)
            : undefined);

    const mappedAutoImportRunId = flow
      ? autoImportRunIdForPipeline(flow, input.pipelineKey)
      : undefined;
    const autoRetryTarget =
      flow &&
      mappedAutoImportRunId &&
      ["failed", "partial", "cancelled"].includes(flow.autoImportStatus)
        ? autoImportTargetsOf(flow).find(
            (target) =>
              target.pipelineKey === input.pipelineKey &&
              target.mode === input.mode &&
              (input.mode === "write" || target.limit === importLimit)
          )
        : undefined;
    const retryingAutoImport = Boolean(autoRetryTarget);
    const importIdempotencyKey = retryingAutoImport
      ? `upstream-flow:${flow.flowId}:${input.pipelineKey}:auto-import`
      : input.mode === "write"
      ? `snapshot:${cleanSnapshotId}:${input.pipelineKey}:write`
      : undefined;

    const run = await this.parserControl.queueManualRun(
      adminId,
      input.pipelineKey,
      input.mode,
      importLimit,
      {
        snapshotId: cleanSnapshotId,
        upstreamRunId:
          flow?.externalRunId || runIdOf(snapshot) || snapshot.upstreamRunId,
        ...(importIdempotencyKey
          ? { idempotencyKey: importIdempotencyKey }
          : {}),
      }
    );
    const queuedRunId = String(run._id || "");
    if (
      flow &&
      retryingAutoImport &&
      ["queued", "recovering", "running"].includes(String(run.status))
    ) {
      const legacyTargetMatches =
        String(flow.autoImport?.pipelineKey || "") === input.pipelineKey ||
        (!flow.autoImport?.targets &&
          autoImportTargetsOf(flow)[0]?.pipelineKey === input.pipelineKey);
      await this.flowModel
        .updateOne(
          {
            _id: flow._id,
            autoImportStatus: { $in: ["failed", "partial", "cancelled"] },
          },
          {
            $set: {
              autoImportStatus: run.status === "queued" ? "queued" : "running",
              autoImportAttemptAt: new Date(),
              [`autoImportRunIds.${input.pipelineKey}`]: queuedRunId,
              ...(legacyTargetMatches
                ? { autoImportRunId: queuedRunId }
                : {}),
            },
            $unset: {
              autoImportError: "",
              autoImportFinishedAt: "",
              autoImportResult: "",
            },
          }
        )
        .exec();
    }
    this.parserWorker.wake();
    return { flow: flow || null, run };
  }

  async reconcile(): Promise<void> {
    if (this.reconciling) return;
    this.reconciling = true;
    try {
      await this.discoverRemoteRuns();
      const active: any[] = await this.flowModel
        .find({
          status: { $in: ACTIVE_FLOW_STATUSES },
          externalRunId: { $exists: true, $ne: "" },
        })
        .sort({ lastSyncedAt: 1, createdAt: 1 })
        .limit(25)
        .lean()
        .exec();
      await Promise.all(active.map((flow) => this.reconcileFlow(flow)));
      await this.queuePendingAutoImports();
      await this.reconcileAutoImports();
    } catch (error: any) {
      this.logger.error(
        `Upstream parser reconciliation failed: ${safeError(error)}`
      );
    } finally {
      this.reconciling = false;
    }
  }

  private async discoverRemoteRuns(): Promise<void> {
    let upstream: Record<string, any>;
    try {
      upstream = await this.intel.listParsers();
    } catch (error: any) {
      this.logger.warn(
        `Cannot discover apiintel parser runs: ${safeError(error)}`
      );
      return;
    }
    const parsers = arrayFrom(upstream, "parsers");
    const runs = [
      ...(arrayFrom(upstream, "recentRuns").length
        ? arrayFrom(upstream, "recentRuns")
        : arrayFrom(upstream, "runs")),
      ...parsers
        .map((parser) => parser.currentRun || parser.activeRun)
        .filter(Boolean),
    ];
    const unique = new Map<string, Record<string, any>>();
    for (const run of runs) {
      const runId = runIdOf(run);
      if (runId) unique.set(runId, run);
    }
    const latestScheduledRunIdByParser = latestScheduledRunIds(
      Array.from(unique.values())
    );
    const global = await this.policy.getGlobalState();
    const upstreamOverviewEnvironment = cleanText(upstream.environment, 20);
    const upstreamEnvironmentCompatible =
      ["test", "prod"].includes(String(upstreamOverviewEnvironment || "")) &&
      isEnvironmentCompatible(global.mode, upstreamOverviewEnvironment);
    const policyByParserKey = new Map(
      (await this.listPolicies()).map((policy) => [
        String(policy.parserKey),
        policy,
      ])
    );
    if (
      !global.enabled ||
      !upstreamEnvironmentCompatible
    ) {
      const pauseResult = await this.pauseUpstreamParsers(parsers);
      if (pauseResult.failures.length) {
        this.logger.warn(
          `Global parser control is OFF, but ${pauseResult.failures.length} apiintel parser(s) could not be paused.`
        );
      }
    }
    await Promise.all(
      Array.from(unique.values()).map(async (run) => {
        const externalRunId = runIdOf(run)!;
        const parserKey = cleanText(run.parserKey, 100);
        if (!parserKey) return;
        try {
          const flowDefinition = upstreamParserFlow(parserKey);
          if (!flowDefinition) {
            throw new Error(`Unsupported apiintel parser: ${parserKey}`);
          }
          const sourceType = flowDefinition.sourceType;
          assertRunSource(run, parserKey, sourceType);
          const runEnvironment = requireParserEnvironment(
            run.environment || run.requested?.environment,
            "run.environment"
          );
          if (runEnvironment !== upstreamOverviewEnvironment) {
            throw new Error(
              `apiintel run environment mismatch: overview is ${String(
                upstreamOverviewEnvironment || "unknown"
              )}, run is ${runEnvironment}.`
            );
          }
          const status = normalizeUpstreamStatus(
            String(run.status || "unknown")
          );
          const snapshotId = snapshotIdOf(run);
          const discoveredEntityLimit = Math.min(
            Math.max(
              Number(run.requested?.entityLimit || run.progress?.total || 100),
              1
            ),
            100_000
          );
          const scheduledAutoImports =
            global.enabled && upstreamEnvironmentCompatible
              ? scheduledAutoImportTargets(
                  run,
                  latestScheduledRunIdByParser.get(parserKey) === externalRunId,
                  policyByParserKey.get(parserKey),
                  flowDefinition,
                  global.mode,
                  discoveredEntityLimit
                )
              : [];
          const set: Record<string, any> = {
            upstreamStatus: cleanText(run.status, 80) || "unknown",
            status,
            progress: compactProgress(run.progress || run),
            upstreamReachable: true,
            upstreamEnvironment: runEnvironment,
            lastSyncedAt: new Date(),
          };
          if (snapshotId) set.snapshotId = snapshotId;
          const remoteFlowId = cleanText(
            run.flowId || run.requested?.flowId,
            200
          );
          set.externalRunId = externalRunId;
          const identityCandidates: Record<string, any>[] = [
            {
              externalRunId,
              parserKey,
              sourceType,
              ...(remoteFlowId ? { flowId: remoteFlowId } : {}),
            },
            ...(remoteFlowId
              ? [
                  {
                    flowId: remoteFlowId,
                    parserKey,
                    sourceType,
                    $or: [
                      { externalRunId: { $exists: false } },
                      { externalRunId: null },
                      { externalRunId: "" },
                      { externalRunId },
                    ],
                  },
                ]
              : []),
          ];
          const identityFences: Record<string, any>[] = [
            { $or: identityCandidates },
            {
              $or: [
                { upstreamEnvironment: { $exists: false } },
                { upstreamEnvironment: null },
                { upstreamEnvironment: runEnvironment },
              ],
            },
            ...(snapshotId
              ? [
                  {
                    $or: [
                      { snapshotId: { $exists: false } },
                      { snapshotId: null },
                      { snapshotId: "" },
                      { snapshotId },
                    ],
                  },
                ]
              : []),
          ];
          const discovered: any = await this.flowModel
            .findOneAndUpdate(
              { $and: identityFences },
              {
                $set: set,
                $setOnInsert: {
                  flowId: remoteFlowId || `remote:${externalRunId}`,
                  idempotencyKey: `upstream-discovered:${externalRunId}`,
                  parserKey,
                  sourceType,
                  // Freeze the local safety mode at first discovery. A TEST
                  // flow must never be promoted to WRITE after a later switch
                  // of the main backend to PROD.
                  globalMode: global.mode,
                  requestedByAdminId: "apiintel-scheduler",
                  entityLimit: discoveredEntityLimit,
                  filters: safeFilters(run.requested?.filters || {}),
                  ...(scheduledAutoImports.length
                    ? {
                        autoImport: { targets: scheduledAutoImports },
                        autoImportStatus: "pending",
                      }
                    : {}),
                },
                $unset: { lastError: "" },
              },
              { new: true, upsert: true, setDefaultsOnInsert: true }
            )
            .lean()
            .exec();
          if (
            discovered?.snapshotId &&
            ["succeeded", "partial"].includes(discovered.status)
          ) {
            await this.refreshSnapshot(discovered);
          }
        } catch (error: any) {
          this.logger.warn(
            `Cannot persist discovered apiintel run ${externalRunId}: ${safeError(
              error
            )}`
          );
        }
      })
    );
  }

  private async pauseUpstreamParsers(parsers: Record<string, any>[]): Promise<{
    connected: boolean;
    total: number;
    paused: number;
    failures: Record<string, any>[];
  }> {
    const targets = parsers
      .map((parser) => ({
        parserKey: cleanText(parser.parserKey || parser.key, 100),
        paused: Boolean(parser.paused ?? parser.config?.paused),
      }))
      .filter((parser) => parser.parserKey && !parser.paused);
    const settled = await Promise.allSettled(
      targets.map((parser) =>
        this.intel.updateParser(parser.parserKey!, { paused: true })
      )
    );
    const failures: Record<string, any>[] = [];
    settled.forEach((result, index) => {
      if (result.status === "rejected") {
        failures.push({
          parserKey: targets[index].parserKey,
          error: publicClientError(result.reason),
        });
      }
    });
    return {
      connected: true,
      total: parsers.length,
      paused: targets.length - failures.length,
      failures,
    };
  }

  private async assertUpstreamEnvironment(
    expected: "test" | "prod",
    parserKey: string
  ): Promise<"test" | "prod"> {
    let upstream: Record<string, any>;
    try {
      upstream = await this.intel.listParsers();
    } catch (error: any) {
      throwUpstreamMutationError(error, { parser: { parserKey } });
    }
    const actual = String(upstream.environment || "");
    if (!isEnvironmentCompatible(expected, actual)) {
      throw new ConflictException(
        `apiintel environment mismatch: main backend is ${expected}, apiintel is ${
          actual || "unknown"
        }. Use matching deployments before starting or enabling parsers.`
      );
    }
    return actual as "test" | "prod";
  }

  private async reconcileFlow(flow: Record<string, any>): Promise<void> {
    try {
      const response = await this.intel.getRun(String(flow.externalRunId));
      const updated = await this.updateFlowFromRun(
        String(flow._id),
        extractRun(response)
      );
      if (
        updated.snapshotId &&
        ["succeeded", "partial"].includes(updated.status)
      ) {
        await this.refreshSnapshot(updated);
      }
    } catch (error: any) {
      await this.markUnreachable(flow, error);
      this.logger.warn(
        `Cannot reconcile apiintel run ${flow.externalRunId}: ${safeError(
          error
        )}`
      );
    }
  }

  private async refreshSnapshot(flow: Record<string, any>): Promise<void> {
    try {
      const response = await this.intel.getSnapshot(String(flow.snapshotId));
      const snapshot = extractSnapshot(response);
      assertSnapshotSource(snapshot, flow.parserKey, flow.sourceType);
      const snapshotEnvironment = requireParserEnvironment(
        snapshot.environment,
        "snapshot.environment"
      );
      const returnedSnapshotId = requireKey(
        snapshot.snapshotId || snapshot.id,
        "snapshot.snapshotId",
        200
      );
      if (returnedSnapshotId !== String(flow.snapshotId)) {
        throw new Error(
          `apiintel snapshot identity mismatch: expected ${flow.snapshotId}, received ${returnedSnapshotId}.`
        );
      }
      const snapshotRunId = requireKey(
        snapshot.runId || snapshot.upstreamRunId,
        "snapshot.runId",
        200
      );
      if (
        flow.externalRunId &&
        snapshotRunId !== String(flow.externalRunId)
      ) {
        throw new Error(
          `apiintel snapshot run mismatch: expected ${flow.externalRunId}, received ${snapshotRunId}.`
        );
      }
      if (
        flow.upstreamEnvironment &&
        snapshotEnvironment !== String(flow.upstreamEnvironment)
      ) {
        throw new Error(
          `apiintel snapshot environment mismatch: expected ${flow.upstreamEnvironment}, received ${snapshotEnvironment}.`
        );
      }
      await this.flowModel
        .updateOne(
          { _id: flow._id },
          {
            $set: {
              snapshot: compactSnapshot(snapshot),
              upstreamReachable: true,
              lastSyncedAt: new Date(),
            },
            $unset: { lastError: "" },
          }
        )
        .exec();
    } catch (error: any) {
      await this.markUnreachable(flow, error);
    }
  }

  private async queuePendingAutoImports(): Promise<void> {
    for (let processed = 0; processed < 10; processed += 1) {
      const staleClaim = new Date(Date.now() - 2 * 60_000);
      const failedRetryAt = new Date(Date.now() - 30_000);
      const flow: any = await this.flowModel
        .findOneAndUpdate(
          {
            status: "succeeded",
            snapshotId: { $exists: true, $ne: "" },
            "snapshot.status": "complete",
            upstreamReachable: true,
            autoImport: { $exists: true },
            $or: [
              { autoImportStatus: "pending" },
              {
                autoImportStatus: "failed",
                autoImportAttemptAt: { $lte: failedRetryAt },
                $and: [
                  {
                    $or: [
                      { autoImportRunId: { $exists: false } },
                      { autoImportRunId: null },
                      { autoImportRunId: "" },
                    ],
                  },
                  {
                    $or: [
                      { autoImportRunIds: { $exists: false } },
                      { autoImportRunIds: null },
                      { autoImportRunIds: {} },
                    ],
                  },
                ],
              },
              {
                autoImportStatus: "queueing",
                autoImportAttemptAt: { $lte: staleClaim },
              },
            ],
          },
          {
            $set: {
              autoImportStatus: "queueing",
              autoImportAttemptAt: new Date(),
            },
            $unset: { autoImportError: "" },
          },
          { new: true, sort: { completedAt: 1, createdAt: 1 } }
        )
        .lean()
        .exec();
      if (!flow) return;
      try {
        const targets = autoImportTargetsOf(flow);
        if (!targets.length) {
          throw new Error("Automatic import policy has no downstream targets.");
        }
        const snapshotSucceeded = Number(flow.snapshot?.counts?.succeeded || 0);
        const runIds: Record<string, string> = {};
        const targetResults: Record<string, any> = {};
        for (const target of targets) {
          assertFlowPipeline(flow, target.pipelineKey);
          const effectiveAutoMode: FomoV2ParserRunMode =
            flow.globalMode === "test"
              ? "dry-run"
              : normalizeMode(target.mode);
          if (
            effectiveAutoMode === "write" &&
            (!Number.isFinite(snapshotSucceeded) || snapshotSucceeded < 1)
          ) {
            throw new Error(
              `Automatic snapshot write for ${target.pipelineKey} requires a positive succeeded item count.`
            );
          }
          const autoImportLimit =
            effectiveAutoMode === "write"
              ? Math.min(Math.floor(snapshotSucceeded), 100_000)
              : target.limit;
          const importRun = await this.parserControl.queueManualRun(
            flow.requestedByAdminId || "upstream-reconciler",
            target.pipelineKey,
            effectiveAutoMode,
            autoImportLimit,
            {
              snapshotId: flow.snapshotId,
              upstreamRunId: flow.externalRunId,
              idempotencyKey: `upstream-flow:${flow.flowId}:${target.pipelineKey}:auto-import`,
            }
          );
          const importRunId = String(importRun._id);
          runIds[target.pipelineKey] = importRunId;
          targetResults[target.pipelineKey] = {
            pipelineKey: target.pipelineKey,
            requestedMode: target.requestedMode || target.mode,
            effectiveMode: effectiveAutoMode,
            runId: importRunId,
            status: importRun.status || "queued",
          };
        }
        const firstRunId = Object.values(runIds)[0];
        await this.flowModel
          .updateOne(
            { _id: flow._id, autoImportStatus: "queueing" },
            {
              $set: {
                autoImportStatus: "queued",
                autoImportRunId: firstRunId,
                autoImportRunIds: runIds,
                autoImportResult: { targets: targetResults },
              },
              $unset: { autoImportError: "" },
            }
          )
          .exec();
        this.parserWorker.wake();
      } catch (error: any) {
        await this.flowModel
          .updateOne(
            { _id: flow._id, autoImportStatus: "queueing" },
            {
              $set: {
                autoImportStatus: "failed",
                autoImportError: safeError(error),
              },
            }
          )
          .exec();
      }
    }
  }

  private async reconcileAutoImports(): Promise<void> {
    const flows: any[] = await this.flowModel
      .find({
        autoImportStatus: { $in: ["queued", "running"] },
        $or: [
          { autoImportRunIds: { $exists: true, $ne: {} } },
          { autoImportRunId: { $exists: true, $ne: "" } },
        ],
      })
      .sort({ autoImportAttemptAt: 1 })
      .limit(25)
      .lean()
      .exec();
    await Promise.all(
      flows.map(async (flow) => {
        try {
          const runIds = autoImportRunIdsOf(flow);
          const runs = await Promise.all(
            Object.entries(runIds).map(async ([pipelineKey, runId]) => ({
              pipelineKey,
              run: await this.parserControl.getRunById(runId),
            }))
          );
          if (!runs.length) {
            throw new Error("Automatic import run ids are missing.");
          }
          const hasRunning = runs.some(({ run }) =>
            ["recovering", "running"].includes(String(run.status))
          );
          const hasQueued = runs.some(
            ({ run }) => String(run.status) === "queued"
          );
          if (hasRunning || hasQueued) {
            await this.flowModel
              .updateOne(
                {
                  _id: flow._id,
                  autoImportStatus: { $in: ["queued", "running"] },
                },
                {
                  $set: {
                    autoImportStatus: hasRunning ? "running" : "queued",
                    autoImportResult: {
                      targets: Object.fromEntries(
                        runs.map(({ pipelineKey, run }) => [
                          pipelineKey,
                          compactDownstreamRun(pipelineKey, run),
                        ])
                      ),
                    },
                  },
                }
              )
              .exec();
            return;
          }
          const status = aggregateDownstreamAutoImportStatus(
            runs.map(({ run }) => run.status)
          );
          const errors = runs
            .filter(({ run }) => {
              if (run.error) return true;
              return (
                ["failed", "cancelled", "abandoned", "skipped"].includes(
                  String(run.status)
                ) && Boolean(run.policyReason)
              );
            })
            .map(
              ({ pipelineKey, run }) =>
                `${pipelineKey}: ${safeError(run.error || run.policyReason)}`
            );
          const set: Record<string, any> = {
            autoImportStatus: status,
            autoImportFinishedAt: new Date(),
            autoImportResult: {
              status,
              targets: Object.fromEntries(
                runs.map(({ pipelineKey, run }) => [
                  pipelineKey,
                  compactDownstreamRun(pipelineKey, run),
                ])
              ),
            },
          };
          if (errors.length) set.autoImportError = errors.join(" | ").slice(0, 2_000);
          const update: Record<string, any> = { $set: set };
          if (!errors.length) update.$unset = { autoImportError: "" };
          await this.flowModel
            .updateOne(
              {
                _id: flow._id,
                autoImportStatus: { $in: ["queued", "running"] },
              },
              update
            )
            .exec();
        } catch (error: any) {
          await this.flowModel
            .updateOne(
              {
                _id: flow._id,
                autoImportStatus: { $in: ["queued", "running"] },
              },
              { $set: { autoImportError: safeError(error) } }
            )
            .exec();
        }
      })
    );
  }

  private async updateFlowFromRun(
    flowObjectId: string,
    run: Record<string, any>
  ): Promise<Record<string, any>> {
    const current: any = await this.flowModel
      .findById(flowObjectId)
      .lean()
      .exec();
    if (!current)
      throw new NotFoundException("Upstream parser flow was not found.");
    const externalRunId = runIdOf(run);
    if (!externalRunId) throw new Error("apiintel run does not contain runId.");
    assertRunSource(run, current.parserKey, current.sourceType);
    if (
      current.externalRunId &&
      String(current.externalRunId) !== externalRunId
    ) {
      throw new Error(
        `apiintel run identity mismatch: expected ${current.externalRunId}, received ${externalRunId}.`
      );
    }
    const remoteFlowId = cleanText(run.flowId || run.requested?.flowId, 200);
    if (remoteFlowId && remoteFlowId !== String(current.flowId)) {
      throw new Error(
        `apiintel flow identity mismatch: expected ${current.flowId}, received ${remoteFlowId}.`
      );
    }
    const remoteEnvironment = requireParserEnvironment(
      run.environment || run.requested?.environment,
      "run.environment"
    );
    if (
      current.upstreamEnvironment &&
      remoteEnvironment !== String(current.upstreamEnvironment)
    ) {
      throw new Error(
        `apiintel run environment mismatch: expected ${current.upstreamEnvironment}, received ${remoteEnvironment}.`
      );
    }
    const upstreamStatus = cleanText(run.status, 80) || "unknown";
    const status = normalizeUpstreamStatus(upstreamStatus);
    const snapshotId = snapshotIdOf(run);
    if (
      current.snapshotId &&
      snapshotId &&
      String(current.snapshotId) !== snapshotId
    ) {
      throw new Error(
        `apiintel run snapshot mismatch: expected ${current.snapshotId}, received ${snapshotId}.`
      );
    }
    const set: Record<string, any> = {
      externalRunId,
      upstreamStatus,
      status,
      progress: compactProgress(run.progress || run),
      upstreamReachable: true,
      upstreamEnvironment: remoteEnvironment,
      lastSyncedAt: new Date(),
    };
    if (snapshotId) set.snapshotId = snapshotId;
    const updated: any = await this.flowModel
      .findByIdAndUpdate(
        flowObjectId,
        { $set: set, $unset: { lastError: "" } },
        { new: true }
      )
      .lean()
      .exec();
    return updated;
  }

  private async markUnreachable(
    flow: Record<string, any>,
    error: any
  ): Promise<Record<string, any>> {
    const updated: any = await this.flowModel
      .findByIdAndUpdate(
        flow._id,
        {
          $set: {
            upstreamReachable: false,
            lastError: safeError(error),
            lastSyncedAt: new Date(),
          },
        },
        { new: true }
      )
      .lean()
      .exec();
    return updated || flow;
  }

  private async requireFlow(runId: string): Promise<Record<string, any>> {
    const id = requireKey(runId, "runId", 200);
    const flow: any = await this.flowModel
      .findOne({ $or: [{ flowId: id }, { externalRunId: id }] })
      .lean()
      .exec();
    if (!flow) throw new NotFoundException(`Upstream run was not found: ${id}`);
    return flow;
  }

  private async requireFlowWithDiscovery(
    runId: string
  ): Promise<Record<string, any>> {
    try {
      return await this.requireFlow(runId);
    } catch (error: any) {
      if (!(error instanceof NotFoundException)) throw error;
      // A scheduled apiintel run can exist before the periodic reconciler has
      // persisted it locally. Discover once on demand so status/control calls
      // do not spuriously return 404 during that window.
      await this.discoverRemoteRuns();
      return this.requireFlow(runId);
    }
  }

  private async listFlows(limit: number): Promise<Record<string, any>[]> {
    return this.flowModel
      .find({})
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec() as unknown as Promise<Record<string, any>[]>;
  }

  private async listPolicies(): Promise<Record<string, any>[]> {
    if (!this.upstreamPolicyModel) return [];
    return this.upstreamPolicyModel
      .find({
        parserKey: {
          $in: FOMO_V2_UPSTREAM_PARSER_FLOWS.map((flow) => flow.parserKey),
        },
      })
      .lean()
      .exec() as unknown as Promise<Record<string, any>[]>;
  }

  private async findPolicy(
    parserKey: string
  ): Promise<Record<string, any> | undefined> {
    if (!this.upstreamPolicyModel) return undefined;
    const policy = await this.upstreamPolicyModel
      .findOne({ parserKey })
      .lean()
      .exec();
    return (policy as unknown as Record<string, any>) || undefined;
  }

  private decorateParser(
    parser: Record<string, any>,
    flows: Record<string, any>[],
    runs: Record<string, any>[],
    worker?: any,
    globalEnabled = true,
    environmentMatches = true,
    autoImportPolicy?: Record<string, any>
  ): Record<string, any> {
    const config =
      parser.config && typeof parser.config === "object" ? parser.config : {};
    const parserKey = String(parser.parserKey || parser.key || "");
    const flowDefinition = upstreamParserFlow(parserKey);
    const local = flows.filter((flow) => flow.parserKey === parserKey);
    const activeFlow = local.find((flow) =>
      ACTIVE_FLOW_STATUSES.includes(flow.status)
    );
    const activeRun =
      parser.activeRun ||
      parser.currentRun ||
      runs.find(
        (run) => runIdOf(run) === String(activeFlow?.externalRunId || "")
      ) ||
      activeFlow ||
      null;
    const latestWithSnapshot = local.find((flow) => flow.snapshotId);
    const workerEnabled =
      typeof worker === "boolean"
        ? worker
        : worker?.enabled === undefined
        ? true
        : Boolean(worker.enabled);
    return {
      ...parser,
      ...config,
      config,
      parserKey,
      label: parser.label || parser.title || flowDefinition?.label || parserKey,
      sourceType: flowDefinition?.sourceType || parser.sourceType,
      // Downstream permissions come only from our closed local manifest. The
      // upstream API currently exposes parser capabilities as string keys and
      // must never be able to broaden which FOMO pipeline accepts a snapshot.
      importTargets: flowDefinition?.importTargets || [],
      autoImportPolicy: compactAutoImportPolicy(
        flowDefinition,
        autoImportPolicy
      ),
      status: environmentMatches
        ? parser.status || parser.currentRun?.status || "idle"
        : "environment_mismatch",
      activeRun,
      worker,
      workerEnabled,
      canStart:
        globalEnabled &&
        environmentMatches &&
        workerEnabled &&
        config.enabled !== false &&
        !Boolean(config.paused) &&
        !activeRun,
      latestSnapshot:
        parser.latestSnapshot ||
        latestWithSnapshot?.snapshot ||
        (latestWithSnapshot
          ? {
              snapshotId: latestWithSnapshot.snapshotId,
              status: latestWithSnapshot.status,
            }
          : null),
    };
  }

  private localParserFallback(
    flows: Record<string, any>[],
    policyByParserKey: Map<string, Record<string, any>> = new Map()
  ): Record<string, any>[] {
    const keys = FOMO_V2_UPSTREAM_PARSER_FLOWS.map((flow) => flow.parserKey);
    return keys.map((parserKey) =>
      this.decorateParser(
        {
          parserKey,
          sourceType: sourceTypeForParser(parserKey),
          config: { enabled: false, paused: true, scheduleEnabled: false },
          status: "unavailable",
        },
        flows,
        [],
        false,
        false,
        false,
        policyByParserKey.get(parserKey)
      )
    );
  }
}

function arrayFrom(
  value: Record<string, any>,
  key: string
): Record<string, any>[] {
  const direct = value?.[key];
  return Array.isArray(direct) ? direct : [];
}

function extractRun(value: Record<string, any>): Record<string, any> {
  return value?.run && typeof value.run === "object" ? value.run : value || {};
}

function extractSnapshot(value: Record<string, any>): Record<string, any> {
  return value?.snapshot && typeof value.snapshot === "object"
    ? value.snapshot
    : value || {};
}

function runIdOf(run: Record<string, any>): string | undefined {
  return cleanText(run?.runId || run?.id || run?._id, 200);
}

function snapshotIdOf(run: Record<string, any>): string | undefined {
  return cleanText(
    run?.snapshotId || run?.snapshot?.snapshotId || run?.snapshot?.id,
    200
  );
}

function normalizeUpstreamStatus(value: string): FomoV2UpstreamFlowStatus {
  const status = String(value || "")
    .trim()
    .toLowerCase();
  if (["pending", "queued"].includes(status)) return "queued";
  if (["running", "in_progress", "processing"].includes(status))
    return "running";
  if (["pause_requested", "pausing"].includes(status)) return "pause_requested";
  if (status === "paused") return "paused";
  if (["resume_requested", "resuming"].includes(status))
    return "resume_requested";
  if (["cancel_requested", "cancelling"].includes(status))
    return "cancel_requested";
  if (["cancelled", "canceled"].includes(status)) return "cancelled";
  if (["complete", "completed", "succeeded", "success"].includes(status)) {
    return "succeeded";
  }
  if (["partial", "partially_completed"].includes(status)) return "partial";
  if (["stale", "abandoned"].includes(status)) return "stale";
  return "failed";
}

function compactProgress(value: any): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of [
    "total",
    "processed",
    "succeeded",
    "failed",
    "skipped",
    "currentEntity",
    "percent",
    "heartbeatAt",
    "etaSeconds",
    "itemsPerSecond",
  ]) {
    const item = value?.[key];
    if (["string", "number", "boolean"].includes(typeof item)) {
      result[key] = item;
    }
  }
  return result;
}

function compactSnapshot(value: Record<string, any>): Record<string, any> {
  return {
    snapshotId: cleanText(value.snapshotId || value.id, 200),
    runId: cleanText(value.runId || value.upstreamRunId, 200),
    parserKey: cleanText(value.parserKey, 100),
    sourceType: cleanText(value.sourceType, 80),
    environment: cleanText(value.environment, 20),
    status: cleanText(value.status, 80),
    schemaVersion: value.schemaVersion,
    counts:
      value.counts && typeof value.counts === "object" ? value.counts : {},
    startedAt: value.startedAt,
    completedAt: value.completedAt,
  };
}

function assertRunSource(
  run: Record<string, any>,
  parserKey: string,
  sourceType: string
): void {
  const remoteParserKey = cleanText(run.parserKey, 100);
  const remoteSourceType = cleanText(run.sourceType, 80);
  if (remoteParserKey !== parserKey) {
    throw new Error(
      `apiintel run parserKey mismatch: expected ${parserKey}, received ${remoteParserKey}.`
    );
  }
  if (remoteSourceType !== sourceType) {
    throw new Error(
      `apiintel run sourceType mismatch: expected ${sourceType}, received ${remoteSourceType}.`
    );
  }
}

function assertSnapshotSource(
  snapshot: Record<string, any>,
  parserKey: string,
  sourceType: string
): void {
  const snapshotParserKey = cleanText(snapshot.parserKey, 100);
  const snapshotSourceType = cleanText(snapshot.sourceType, 80);
  if (snapshotParserKey !== parserKey || snapshotSourceType !== sourceType) {
    throw new Error("apiintel snapshot source does not match its parser flow.");
  }
}

function assertFlowPipeline(
  flow: Record<string, any>,
  pipelineKey: unknown
): void {
  if (!upstreamPipelineAllowed(flow.parserKey, flow.sourceType, pipelineKey)) {
    throw new BadRequestException(
      `Pipeline ${String(pipelineKey || "unknown")} does not accept snapshots from ${String(
        flow.parserKey || "unknown"
      )}/${String(flow.sourceType || "unknown")}.`
    );
  }
  const snapshotStatus = flow.snapshot?.status;
  if (snapshotStatus && snapshotStatus !== "complete") {
    throw new BadRequestException(
      "Only complete parser snapshots can be imported."
    );
  }
}

function normalizeRequestedAutoImports(
  input: StartUpstreamParserRunDto
): Array<{ pipelineKey: string; mode: FomoV2ParserRunMode; limit?: number }> {
  if (input.autoImport !== undefined && input.autoImports !== undefined) {
    throw new BadRequestException(
      "Use either autoImport or autoImports, not both."
    );
  }
  const entries = input.autoImports?.length
    ? input.autoImports
    : input.autoImport
    ? [input.autoImport]
    : [];
  const seen = new Set<string>();
  return entries.map((entry) => {
    const pipelineKey = requireKey(entry?.pipelineKey, "autoImport.pipelineKey");
    if (seen.has(pipelineKey)) {
      throw new BadRequestException(
        `Duplicate auto-import pipeline: ${pipelineKey}`
      );
    }
    seen.add(pipelineKey);
    const mode: FomoV2ParserRunMode =
      entry?.mode === "write" ? "write" : "dry-run";
    const limit = entry?.limit === undefined
      ? undefined
      : Math.min(Math.max(Math.floor(Number(entry.limit)), 1), 100_000);
    return { pipelineKey, mode, ...(limit ? { limit } : {}) };
  });
}

function normalizeTargetKeys(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new BadRequestException("autoImportTargets must be an array.");
  }
  const targets = value.map((entry) =>
    requireKey(entry, "autoImportTargets entry")
  );
  if (new Set(targets).size !== targets.length) {
    throw new BadRequestException("autoImportTargets must be unique.");
  }
  return targets;
}

function compactAutoImportPolicy(
  flowDefinition: ReturnType<typeof upstreamParserFlow>,
  policy?: Record<string, any>
): Record<string, any> {
  const allowedTargets = flowDefinition
    ? flowDefinition.importTargets.map((target) => target.pipelineKey)
    : [];
  if (!flowDefinition || !policy) {
    return {
      autoImportMode: "off",
      autoImportTargets: allowedTargets,
      effectiveFromAt: null,
      revision: 0,
    };
  }
  const identityMatches =
    String(policy.parserKey || "") === flowDefinition.parserKey &&
    String(policy.sourceType || "") === flowDefinition.sourceType;
  const rawTargets = Array.isArray(policy.autoImportTargets)
    ? policy.autoImportTargets.map((target: any) => String(target || "").trim())
    : [];
  const targetsValid =
    new Set(rawTargets).size === rawTargets.length &&
    rawTargets.every((target: string) => allowedTargets.includes(target as any));
  const mode = ["off", "dry-run", "write"].includes(policy.autoImportMode)
    ? policy.autoImportMode
    : "off";
  const valid =
    identityMatches &&
    targetsValid &&
    (mode === "off" || rawTargets.length > 0);
  return {
    autoImportMode: valid ? mode : "off",
    autoImportTargets: valid ? rawTargets : allowedTargets,
    effectiveFromAt: policy.effectiveFromAt || null,
    revision: Number(policy.revision || 0),
    updatedAt: policy.updatedAt,
    ...(valid
      ? {}
      : { invalidReason: "Stored policy failed parser/source/target validation." }),
  };
}

function autoImportsFromPolicy(
  flowDefinition: NonNullable<ReturnType<typeof upstreamParserFlow>>,
  policy?: Record<string, any>
): Array<{
  pipelineKey: string;
  mode: FomoV2ParserRunMode;
  limit?: number;
}> {
  if (!policy || policy.autoImportMode === "off") return [];
  if (
    String(policy.parserKey || "") !== flowDefinition.parserKey ||
    String(policy.sourceType || "") !== flowDefinition.sourceType
  ) {
    throw new BadRequestException(
      `Stored auto-import policy identity mismatch for ${flowDefinition.parserKey}.`
    );
  }
  const mode: FomoV2ParserRunMode =
    policy.autoImportMode === "write"
      ? "write"
      : policy.autoImportMode === "dry-run"
      ? "dry-run"
      : (() => {
          throw new BadRequestException("Invalid stored auto-import mode.");
        })();
  const targets = normalizeTargetKeys(policy.autoImportTargets || []);
  if (!targets.length) {
    throw new BadRequestException(
      `Stored auto-import policy for ${flowDefinition.parserKey} has no targets.`
    );
  }
  return targets.map((pipelineKey) => {
    if (
      !upstreamPipelineAllowed(
        flowDefinition.parserKey,
        flowDefinition.sourceType,
        pipelineKey
      )
    ) {
      throw new BadRequestException(
        `Stored auto-import policy contains unsupported target ${pipelineKey}.`
      );
    }
    return { pipelineKey, mode };
  });
}

function autoImportTargetsOf(flow: Record<string, any>): Array<{
  pipelineKey: string;
  requestedMode: FomoV2ParserRunMode;
  mode: FomoV2ParserRunMode;
  limit?: number;
}> {
  const auto = flow.autoImport || {};
  const rawTargets = Array.isArray(auto.targets)
    ? auto.targets
    : auto.pipelineKey
    ? [auto]
    : [];
  const seen = new Set<string>();
  return rawTargets.map((target: any) => {
    const pipelineKey = requireKey(
      target?.pipelineKey,
      "stored autoImport.pipelineKey"
    );
    if (seen.has(pipelineKey)) {
      throw new Error(`Duplicate stored auto-import target: ${pipelineKey}`);
    }
    seen.add(pipelineKey);
    if (!upstreamPipelineAllowed(flow.parserKey, flow.sourceType, pipelineKey)) {
      throw new Error(
        `Stored auto-import target ${pipelineKey} does not match ${flow.parserKey}/${flow.sourceType}.`
      );
    }
    const requestedMode = normalizeMode(target.requestedMode || target.mode);
    const mode = normalizeMode(target.mode);
    const rawLimit = Math.floor(Number(target.limit));
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, 100_000)
        : undefined;
    return {
      pipelineKey,
      requestedMode,
      mode,
      ...(limit ? { limit } : {}),
    };
  });
}

function autoImportRunIdsOf(flow: Record<string, any>): Record<string, string> {
  const expectedTargets = autoImportTargetsOf(flow).map(
    (target) => target.pipelineKey
  );
  const result: Record<string, string> = {};
  if (
    flow.autoImportRunIds &&
    typeof flow.autoImportRunIds === "object" &&
    !Array.isArray(flow.autoImportRunIds)
  ) {
    for (const [pipelineKey, runId] of Object.entries(flow.autoImportRunIds)) {
      if (!expectedTargets.includes(pipelineKey)) {
        throw new Error(`Unexpected auto-import run target: ${pipelineKey}`);
      }
      result[pipelineKey] = requireKey(runId, "autoImportRunId", 200);
    }
  }
  if (!Object.keys(result).length && flow.autoImportRunId) {
    const pipelineKey = expectedTargets[0];
    if (!pipelineKey) throw new Error("Auto-import target is missing.");
    result[pipelineKey] = requireKey(
      flow.autoImportRunId,
      "autoImportRunId",
      200
    );
  }
  const missing = expectedTargets.filter((target) => !result[target]);
  if (missing.length) {
    throw new Error(`Auto-import run ids are missing for: ${missing.join(", ")}`);
  }
  return result;
}

function autoImportRunIdForPipeline(
  flow: Record<string, any>,
  pipelineKey: string
): string | undefined {
  const mapped = flow.autoImportRunIds?.[pipelineKey];
  if (mapped) return String(mapped);
  const legacyTargets = autoImportTargetsOf(flow);
  if (
    flow.autoImportRunId &&
    legacyTargets[0]?.pipelineKey === pipelineKey
  ) {
    return String(flow.autoImportRunId);
  }
  return undefined;
}

function compactDownstreamRun(
  pipelineKey: string,
  run: Record<string, any>
): Record<string, any> {
  return {
    pipelineKey,
    runId: cleanText(run._id || run.runId || run.id, 200),
    status: cleanText(run.status, 80) || "unknown",
    requestedMode: normalizeMode(run.requestedMode),
    effectiveMode: normalizeMode(run.effectiveMode),
    summary: run.summary || {},
    error: run.error,
    policyReason: run.policyReason,
    finishedAt: run.finishedAt,
  };
}

function aggregateDownstreamAutoImportStatus(
  values: unknown[]
): "completed" | "partial" | "cancelled" | "failed" {
  const statuses = values.map((value) => String(value || ""));
  if (statuses.length && statuses.every((status) => status === "completed")) {
    return "completed";
  }
  if (statuses.length && statuses.every((status) => status === "cancelled")) {
    return "cancelled";
  }
  if (
    statuses.some((status) => ["completed", "partial"].includes(status))
  ) {
    return "partial";
  }
  if (
    statuses.some((status) =>
      ["failed", "abandoned", "skipped"].includes(status)
    )
  ) {
    return "failed";
  }
  return "partial";
}

function latestScheduledRunIds(
  runs: Record<string, any>[]
): Map<string, string> {
  const latest = new Map<
    string,
    { runId: string; createdAt: number; tieBreaker: string }
  >();
  for (const run of runs) {
    if (String(run.trigger || "") !== "schedule") continue;
    const parserKey = cleanText(run.parserKey, 100);
    const runId = runIdOf(run);
    const createdAt = dateTimestamp(run.createdAt || run.queuedAt);
    if (!parserKey || !runId || !createdAt) continue;
    const current = latest.get(parserKey);
    if (
      !current ||
      createdAt > current.createdAt ||
      (createdAt === current.createdAt && runId > current.tieBreaker)
    ) {
      latest.set(parserKey, { runId, createdAt, tieBreaker: runId });
    }
  }
  return new Map(
    Array.from(latest.entries()).map(([parserKey, value]) => [
      parserKey,
      value.runId,
    ])
  );
}

function scheduledAutoImportTargets(
  run: Record<string, any>,
  isLatestScheduledRun: boolean,
  policy: Record<string, any> | undefined,
  flowDefinition: NonNullable<ReturnType<typeof upstreamParserFlow>>,
  localMode: "test" | "prod",
  entityLimit: number
): Array<{
  pipelineKey: string;
  requestedMode: FomoV2ParserRunMode;
  mode: FomoV2ParserRunMode;
  limit: number;
}> {
  if (
    String(run.trigger || "") !== "schedule" ||
    !isLatestScheduledRun ||
    !policy
  ) {
    return [];
  }
  if (
    String(policy.parserKey || "") !== flowDefinition.parserKey ||
    String(policy.sourceType || "") !== flowDefinition.sourceType
  ) {
    throw new BadRequestException(
      `Stored auto-import policy identity mismatch for ${flowDefinition.parserKey}.`
    );
  }
  const requestedMode =
    policy.autoImportMode === "write"
      ? "write"
      : policy.autoImportMode === "dry-run"
      ? "dry-run"
      : undefined;
  if (!requestedMode) return [];

  const runCreatedAt = dateTimestamp(run.createdAt || run.queuedAt);
  const policyEffectiveAt = dateTimestamp(policy.effectiveFromAt);
  // Never backfill historical recentRuns when a policy is enabled. If main
  // was offline for several schedules, only the newest exact snapshot is
  // eligible, preventing an older snapshot from overwriting newer data.
  if (!runCreatedAt || !policyEffectiveAt || runCreatedAt < policyEffectiveAt) {
    return [];
  }

  const targets = normalizeTargetKeys(policy.autoImportTargets || []);
  if (!targets.length) {
    throw new BadRequestException(
      `Auto-import policy for ${flowDefinition.parserKey} has no targets.`
    );
  }
  return targets.map((pipelineKey) => {
    if (
      !upstreamPipelineAllowed(
        flowDefinition.parserKey,
        flowDefinition.sourceType,
        pipelineKey
      )
    ) {
      throw new BadRequestException(
        `Auto-import policy contains unsupported target ${pipelineKey}.`
      );
    }
    return {
      pipelineKey,
      requestedMode,
      mode: localMode === "test" ? "dry-run" : requestedMode,
      limit: entityLimit,
    };
  });
}

function dateTimestamp(value: unknown): number | undefined {
  if (!value) return undefined;
  const timestamp = new Date(value as any).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function sourceTypeForParser(parserKey: string): string {
  const flow = upstreamParserFlow(parserKey);
  if (!flow) {
    throw new BadRequestException(`Unsupported upstream parser: ${parserKey}`);
  }
  return flow.sourceType;
}

function isEnvironmentCompatible(localMode: any, upstreamMode: any): boolean {
  const local = String(localMode || "");
  const upstream = String(upstreamMode || "");
  if (local === "test") return upstream === "test" || upstream === "prod";
  return local === "prod" && upstream === "prod";
}

function requireParserEnvironment(
  value: unknown,
  label: string
): "test" | "prod" {
  const environment = String(value || "")
    .trim()
    .toLowerCase();
  if (environment !== "test" && environment !== "prod") {
    throw new Error(`Invalid ${label}: ${environment || "missing"}.`);
  }
  return environment;
}

function normalizeMode(value: any): FomoV2ParserRunMode {
  return value === "write" ? "write" : "dry-run";
}

function downstreamAutoImportStatus(
  value: any
): "completed" | "partial" | "cancelled" | "failed" {
  const status = String(value || "");
  if (status === "completed") return "completed";
  if (status === "partial") return "partial";
  if (status === "cancelled") return "cancelled";
  return "failed";
}

function requireKey(value: any, label: string, maxLength = 100): string {
  const text = cleanText(value, maxLength);
  if (!text || !/^[a-zA-Z0-9][a-zA-Z0-9:_.-]*$/.test(text)) {
    throw new BadRequestException(`Invalid ${label}.`);
  }
  return text;
}

function safeFilters(value: any): Record<string, any> {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new BadRequestException("filters must be an object.");
  }
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new BadRequestException("filters must be JSON serializable.");
  }
  if (serialized.length > 20_000) {
    throw new BadRequestException("filters payload is too large.");
  }
  return JSON.parse(serialized);
}

function cleanText(value: any, maxLength: number): string | undefined {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, maxLength) : undefined;
}

function safeError(error: any): string {
  return String(error?.message || error?.code || error || "Unknown error")
    .replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, "mongodb://[redacted]@")
    .replace(/[A-Za-z0-9_-]{40,}/g, "[redacted]")
    .slice(0, 2_000);
}

function publicClientError(error: any): Record<string, any> {
  return error instanceof IntelParserControlClientError
    ? error.toPublic()
    : {
        code: "intel_error",
        message: safeError(error),
        statusCode: 502,
        retryable: false,
      };
}

function throwUpstreamMutationError(
  error: any,
  state: Record<string, any>
): never {
  const upstreamError = publicClientError(error);
  const status =
    upstreamError.statusCode === 409
      ? 409
      : upstreamError.statusCode === 503
      ? 503
      : 502;
  throw new HttpException(
    {
      message: upstreamError.message,
      upstreamError,
      flow: state,
    },
    status
  );
}
