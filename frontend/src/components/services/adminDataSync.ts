import getAccessToken from '../utils/getAccessToken'
import { configureUrl } from './config'

export interface AdminDataSyncConfig {
  enabled: boolean
  prodToDevEnabled: boolean
  devToProdDiffEnabled: boolean
  devToProdApplyEnabled: boolean
  sourceDb: string
  targetDb: string
  prodDb: string
  devDb: string
  prodToDevRunMode: 'disabled' | 'backend-native' | 'host-runner'
  prodToDevRunEnabled: boolean
  mongoContainer: string
  backupDir: string
  scriptPath: string
  allowDevToProd: boolean
  requireApproval: boolean
  requireConfirmationPhrase: boolean
  disableDelete: boolean
  maxDiffDocuments: number
  maxApplyDocuments: number
  maxCollectionsPerPromotion: number
  prodToDevAllowlist: string[]
  devToProdAllowlist: string[]
  derivedHeavyCollections: string[]
  sensitiveCollectionsExcluded: string[]
  confirmationPhrase: string
  devToProdMode: 'dry_run_only' | 'guarded_apply'
}

export type AdminParserGlobalMode = 'test' | 'prod'
export type AdminParserRunMode = 'dry-run' | 'write'
export type AdminParserStatus =
  | 'global-off'
  | 'paused'
  | 'idle'
  | 'queued'
  | 'recovering'
  | 'running'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'abandoned'
  | 'cancelled'
  | 'skipped'

export interface AdminParserGlobalControl {
  enabled: boolean
  mode: AdminParserGlobalMode
  schedulerEnabled: boolean
  workerEnabled: boolean
  writesDomainData: boolean
}

export interface AdminParserRun {
  _id: string
  parserKey: string
  pipeline: string
  sourceType: string
  trigger: 'manual' | 'schedule'
  requestedMode: AdminParserRunMode
  effectiveMode: AdminParserRunMode
  globalMode: AdminParserGlobalMode
  dryRun: boolean
  writesDomainData: boolean
  status: AdminParserStatus
  requestedByAdminId?: string
  queuedAt: string
  startedAt?: string
  finishedAt?: string
  attempt?: number
  recoveryCount?: number
  progress?: {
    phase?: string
    step?: string
    stepIndex?: number
    stepCount?: number
    batch?: number
    scanned?: number
    written?: number
    updatedAt?: string
  }
  summary?: Record<string, unknown>
  error?: string
  policyReason?: string
}

export interface AdminParserControl {
  parserKey: string
  label: string
  description: string
  pipeline: string
  sourceType: string
  target: string
  paused: boolean
  scheduleEnabled: boolean
  defaultRunMode: AdminParserRunMode
  intervalMinutes: number
  status: AdminParserStatus
  effectiveScheduledMode: AdminParserRunMode
  canRun: boolean
  canWrite: boolean
  writeRequiresSnapshot?: boolean
  writeBlockedReason?: string
  nextRunAt?: string
  lastRunAt?: string
  lastStatus?: AdminParserStatus
  lastError?: string
  currentRun?: AdminParserRun | null
}

export interface AdminParserControlSnapshot {
  global: AdminParserGlobalControl
  parsers: AdminParserControl[]
  recentRuns: AdminParserRun[]
}

export type AdminUpstreamAutoImportMode = 'off' | AdminParserRunMode

export interface AdminUpstreamAutoImportPolicy {
  autoImportMode: AdminUpstreamAutoImportMode
  autoImportTargets: string[]
  effectiveFromAt?: string
  revision: number
  updatedAt?: string
  invalidReason?: string
}

export interface AdminUpstreamParserFilters {
  onlyMissing?: boolean
  refreshOlderThanHours?: number
  [key: string]: unknown
}

export interface AdminUpstreamConnection {
  connected: boolean
  status?: string
  baseUrl?: string
  checkedAt?: string
  heartbeatAt?: string
  error?: string
}

export interface AdminUpstreamProgress {
  total?: number
  processed: number
  succeeded: number
  failed: number
  skipped: number
  percent?: number
  currentEntity?: string
  etaSeconds?: number
  estimatedCompletionAt?: string
  heartbeatAt?: string
}

export interface AdminUpstreamSnapshot {
  snapshotId: string
  status: string
  parserKey?: string
  sourceType?: string
  environment?: AdminParserGlobalMode
  entityCount?: number
  counts?: {
    total: number
    processed: number
    succeeded: number
    failed: number
    skipped: number
  }
  createdAt?: string
  completedAt?: string
  schemaVersion?: string | number
  checksum?: string
}

export interface AdminUpstreamImportTarget {
  pipelineKey: string
  label: string
  sourceType?: string
  modes?: AdminParserRunMode[]
  writeRequiresFullSnapshot?: boolean
}

export interface AdminUpstreamParserCapabilities {
  entityLimit?: {
    min: number
    max: number
  }
  filters: string[]
  executionMode?: 'entity' | 'batch'
  controlGranularity?: {
    pause?: 'entity-boundary' | 'batch-boundary'
    cancel?: 'entity-boundary' | 'batch-boundary'
    snapshotPublication?: string
  }
}

export interface AdminUpstreamRun {
  runId: string
  parserKey: string
  sourceType: string
  status: string
  entityLimit?: number
  queuedAt?: string
  startedAt?: string
  finishedAt?: string
  heartbeatAt?: string
  progress: AdminUpstreamProgress
  snapshot?: AdminUpstreamSnapshot
  autoImportMode?: AdminUpstreamAutoImportMode
  error?: string
  stale?: boolean
}

export interface AdminUpstreamParser {
  parserKey: string
  label: string
  description?: string
  sourceType: string
  importTargets: AdminUpstreamImportTarget[]
  capabilities?: AdminUpstreamParserCapabilities
  enabled: boolean
  paused?: boolean
  scheduleEnabled?: boolean
  intervalMinutes?: number
  defaultEntityLimit?: number
  defaultFilters?: AdminUpstreamParserFilters
  autoImportPolicy: AdminUpstreamAutoImportPolicy
  status?: string
  canStart?: boolean
  nextRunAt?: string
  lastSuccessAt?: string
  lastHeartbeatAt?: string
  currentRun?: AdminUpstreamRun
  latestSnapshot?: AdminUpstreamSnapshot
}

export interface AdminUpstreamFlow {
  flowId: string
  parserKey?: string
  sourceType?: string
  status?: string
  upstreamRunId?: string
  upstreamStatus?: string
  snapshotId?: string
  snapshotStatus?: string
  importRunId?: string
  importStatus?: string
  importMode?: AdminParserRunMode
  imports: Array<{
    pipelineKey: string
    requestedMode?: AdminParserRunMode
    effectiveMode?: AdminParserRunMode
    runId?: string
    status?: string
    error?: string
  }>
  createdAt?: string
  updatedAt?: string
  error?: string
}

export interface AdminUpstreamControlSnapshot {
  connected: boolean
  connection: AdminUpstreamConnection
  environment?: AdminParserGlobalMode
  environmentCompatible?: boolean
  parsers: AdminUpstreamParser[]
  runs: AdminUpstreamRun[]
  flows: AdminUpstreamFlow[]
}

export interface StartAdminUpstreamParserInput {
  entityLimit: number
  filters?: AdminUpstreamParserFilters
  autoImport?: {
    pipelineKey: string
    mode: AdminParserRunMode
  }
  autoImports?: Array<{
    pipelineKey: string
    mode: AdminParserRunMode
  }>
}

export interface UpdateAdminUpstreamParserInput {
  enabled?: boolean
  paused?: boolean
  scheduleEnabled?: boolean
  intervalMinutes?: number
  defaultEntityLimit?: number
}

export interface UpdateAdminUpstreamAutoImportPolicyInput {
  autoImportMode: AdminUpstreamAutoImportMode
  autoImportTargets: string[]
}

export interface ImportAdminParserSnapshotInput {
  pipelineKey: string
  mode: AdminParserRunMode
  limit?: number
}

export interface UpdateAdminParserGlobalInput {
  enabled?: boolean
  mode?: AdminParserGlobalMode
}

export interface UpdateAdminParserInput {
  paused?: boolean
  scheduleEnabled?: boolean
  defaultRunMode?: AdminParserRunMode
  intervalMinutes?: number
}

export interface RunAdminParserInput {
  mode: AdminParserRunMode
  limit?: number
}

export interface CoinGeckoCreditUsage {
  configured: boolean
  available: boolean
  cached: boolean
  stale: boolean
  scope: 'api_key' | 'account' | null
  plan: string | null
  usedCredits: number | null
  monthlyLimit: number | null
  remainingCredits: number | null
  utilizationPercent: number | null
  monthlyBudget: number
  budgetRemainingCredits: number | null
  budgetUtilizationPercent: number | null
  averageCreditsPerHour: number | null
  averageCreditsPerDay: number | null
  recentCreditsPerHour: number | null
  recentProjectedDailyCredits: number | null
  recentWindowMinutes: number | null
  projectedMonthlyCredits: number | null
  projectedUtilizationPercent: number | null
  projectedBudgetUtilizationPercent: number | null
  remainingHourlyBudget: number | null
  remainingDailyBudget: number | null
  rateLimitPerMinute: number | null
  billingMonth: string
  checkedAt: string | null
  nextRefreshAt: string
  cacheTtlMs: number
  error?: string
}

export type FomoMarketScheduleTier = 'HOT' | 'WARM' | 'COLD'
export type FomoMarketLatestCadence = FomoMarketScheduleTier | 'HOT_WARM'

export interface FomoMarketScheduleRebaseCounts {
  scanned: number
  eligible: number
  skippedLocked: number
  planned: number
  matched: number
  modified: number
  skippedDuringApply: number
}

export interface FomoMarketScheduleRebaseResult {
  dryRun: boolean
  applied: boolean
  generatedAt: string
  confirmationRequired: string
  scope: {
    collection: string
    fields: string[]
    kinds: string[]
    activeOnly: boolean
    unlockedOnly: boolean
  }
  counts: FomoMarketScheduleRebaseCounts
  intervalsMs: {
    history: Record<FomoMarketScheduleTier, number>
    exchanges: Record<FomoMarketScheduleTier, number>
  }
  latestCadence?: {
    enabled: boolean
    hotWarmRankRange: {
      minRank: number
      maxRank: number
    }
    byCadence: Record<
      FomoMarketLatestCadence,
      {
        projects: number
        intervalMs: number
      }
    >
  }
  byTier: Record<
    FomoMarketScheduleTier,
    {
      counts: FomoMarketScheduleRebaseCounts
    }
  >
}

export interface AdminDataSyncPreview {
  sourceDb: string
  targetDb: string
  allowlistedCollections: string[]
  sourceCounts: Record<string, number | null>
  targetCounts: Record<string, number | null>
  missingCollections: string[]
  missingCollectionDetection?: 'skipped'
  warnings?: string[]
  sensitiveCollectionsExcluded: string[]
  estimatedRisk: 'low' | 'medium'
  backupWillBeCreated: boolean
}

export interface AdminDataSyncJob {
  _id: string
  type: 'prod_to_dev'
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled'
  startedByAdminId?: string
  startedAt?: string
  finishedAt?: string
  durationMs?: number
  sourceDb: string
  targetDb: string
  collections: string[]
  copiedCounts?: Record<string, number>
  skippedCollections?: string[]
  backupPath?: string
  errorSummary?: string
  stdoutSummary?: string
  createdAt?: string
  updatedAt?: string
}

export interface AdminDataSyncDiffSample {
  collection: string
  _id: string
  operation: 'insert' | 'update' | 'conflict' | 'skip'
  changedFields: string[]
  beforeSummary?: Record<string, unknown>
  afterSummary?: Record<string, unknown>
  hashBeforeProd?: string
  hashFromDev?: string
  riskLevel: 'low' | 'medium' | 'high'
}

export interface AdminDataSyncDiffCollection {
  collection: string
  inserts: number
  updates: number
  deletes: number
  conflicts: number
  skipped: number
  samples: AdminDataSyncDiffSample[]
}

export interface AdminDataSyncDiffResult {
  promotionId: string
  status: 'draft'
  sourceDb: string
  targetDb: string
  collections: AdminDataSyncDiffCollection[]
  hasChanges?: boolean
  totalOperations?: number
  emptyReason?: string
}

export interface AdminDataSyncPromotion {
  _id: string
  promotionId: string
  createdByAdminId?: string
  approvedByAdminId?: string
  appliedByAdminId?: string
  status: 'draft' | 'approved' | 'applying' | 'applied' | 'failed' | 'rejected'
  sourceDb: string
  targetDb: string
  selectedCollections: string[]
  selectedFilters?: Record<string, unknown>
  diffSummary?: {
    collections?: AdminDataSyncDiffCollection[]
    totalOperations?: number
    hasChanges?: boolean
    emptyReason?: string
  }
  backupPath?: string
  appliedSummary?: Record<string, unknown>
  errorSummary?: string
  createdAt?: string
  approvedAt?: string
  appliedAt?: string
}

export interface AdminDataSyncResponse<T = unknown> {
  success: boolean
  status: number
  data: T
  error?: string
}

export interface AdminDataSyncDiffInput {
  collections: string[]
  filter?: {
    canonicalProjectId?: string
    ids?: string[]
    slug?: string
    updatedSince?: string
  }
  mode: 'selected_docs' | 'selected_collections'
}

const getErrorMessage = (data: unknown, fallback: string) => {
  if (data && typeof data === 'object') {
    const errorData = data as {
      message?: unknown
      upstreamError?: unknown
      error?: unknown
    }
    const message = errorData.message || errorData.upstreamError || errorData.error
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string' && message) return message
    if (message && typeof message === 'object' && 'message' in message) {
      const nestedMessage = (message as { message?: unknown }).message
      if (typeof nestedMessage === 'string' && nestedMessage) return nestedMessage
    }
  }

  return fallback
}

const request = async <T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<AdminDataSyncResponse<T>> => {
  const token = getAccessToken()

  if (!token) {
    return {
      success: false,
      status: 401,
      data: {} as T,
      error: 'Not authorized',
    }
  }

  const response = await fetch(configureUrl(path), {
    ...options,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  })

  const text = await response.text()
  let data: unknown = {}

  try {
    data = text ? JSON.parse(text) : {}
  } catch (error) {
    data = { message: text }
  }

  return {
    success: response.status < 300,
    status: response.status,
    data: data as T,
    error: response.status < 300 ? undefined : getErrorMessage(data, response.statusText),
  }
}

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const readString = (...values: unknown[]) =>
  values.find((value): value is string => typeof value === 'string' && value.length > 0)

const readErrorString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value) return value
    const record = asRecord(value)
    const message = record ? readString(record.message, record.error, record.code) : undefined
    if (message) return message
  }
  return undefined
}

const readNumber = (...values: unknown[]) =>
  values.find((value): value is number => typeof value === 'number' && Number.isFinite(value))

const readBoolean = (...values: unknown[]) =>
  values.find((value): value is boolean => typeof value === 'boolean')

const unwrapEnvelope = (value: unknown) => {
  let current = value

  for (let depth = 0; depth < 3; depth += 1) {
    const record = asRecord(current)
    if (!record || !('data' in record)) break

    const nested = record.data
    if (!asRecord(nested) && !Array.isArray(nested)) break
    current = nested
  }

  return current
}

const normalizeUpstreamSnapshot = (value: unknown): AdminUpstreamSnapshot | undefined => {
  const snapshot = asRecord(value)
  if (!snapshot) return undefined
  const counts = asRecord(snapshot.counts) || {}

  const snapshotId = readString(snapshot.snapshotId, snapshot.id, snapshot._id)
  if (!snapshotId) return undefined

  return {
    snapshotId,
    status: readString(snapshot.status, snapshot.state) || 'unknown',
    parserKey: readString(snapshot.parserKey),
    sourceType: readString(snapshot.sourceType, snapshot.source),
    environment: readString(snapshot.environment) as AdminParserGlobalMode | undefined,
    entityCount: readNumber(
      snapshot.entityCount,
      snapshot.count,
      snapshot.total,
      counts.succeeded,
      counts.total,
    ),
    counts: {
      total: readNumber(counts.total, snapshot.total) || 0,
      processed: readNumber(counts.processed, snapshot.processed) || 0,
      succeeded: readNumber(counts.succeeded, snapshot.succeeded) || 0,
      failed: readNumber(counts.failed, snapshot.failed) || 0,
      skipped: readNumber(counts.skipped, snapshot.skipped) || 0,
    },
    createdAt: readString(snapshot.createdAt),
    completedAt: readString(snapshot.completedAt, snapshot.finishedAt),
    schemaVersion:
      typeof snapshot.schemaVersion === 'string' || typeof snapshot.schemaVersion === 'number'
        ? snapshot.schemaVersion
        : undefined,
    checksum: readString(snapshot.checksum),
  }
}

const normalizeUpstreamRun = (value: unknown): AdminUpstreamRun | undefined => {
  const run = asRecord(value)
  if (!run) return undefined

  const progress = asRecord(run.progress) || {}
  const requested = asRecord(run.requested) || {}
  const options = asRecord(run.options) || asRecord(run.input) || requested
  const autoImport = asRecord(run.autoImport) || asRecord(options.autoImport) || {}
  const runId = readString(run.runId, run.externalRunId, run.flowId, run.id, run._id)
  const parserKey = readString(run.parserKey, run.key, options.parserKey)
  if (!runId || !parserKey) return undefined

  const currentEntityValue =
    progress.currentEntity ?? progress.current ?? progress.currentItem ?? run.currentEntity
  const currentEntity =
    typeof currentEntityValue === 'string'
      ? currentEntityValue
      : asRecord(currentEntityValue)
      ? readString(
          asRecord(currentEntityValue)?.slug,
          asRecord(currentEntityValue)?.name,
          asRecord(currentEntityValue)?.id,
        )
      : undefined
  const snapshot =
    normalizeUpstreamSnapshot(run.snapshot) ||
    normalizeUpstreamSnapshot(run.latestSnapshot) ||
    normalizeUpstreamSnapshot(
      run.snapshotId
        ? {
            snapshotId: run.snapshotId,
            status: run.snapshotStatus,
            entityCount: run.snapshotEntityCount,
          }
        : undefined,
    )

  return {
    runId,
    parserKey,
    sourceType: readString(run.sourceType, run.source, snapshot?.sourceType) || 'unknown',
    status: readString(run.status, run.upstreamStatus, run.state) || 'unknown',
    entityLimit: readNumber(
      run.entityLimit,
      requested.entityLimit,
      options.entityLimit,
      progress.total,
    ),
    queuedAt: readString(run.queuedAt, run.createdAt),
    startedAt: readString(run.startedAt),
    finishedAt: readString(run.finishedAt, run.completedAt),
    heartbeatAt: readString(run.heartbeatAt, progress.heartbeatAt, run.lastSyncedAt, run.updatedAt),
    progress: {
      total: readNumber(
        progress.total,
        run.total,
        run.entityLimit,
        requested.entityLimit,
        options.entityLimit,
      ),
      processed: readNumber(progress.processed, run.processed) || 0,
      succeeded:
        readNumber(progress.succeeded, progress.success, progress.successful, run.succeeded) || 0,
      failed: readNumber(progress.failed, run.failed) || 0,
      skipped: readNumber(progress.skipped, run.skipped) || 0,
      percent: readNumber(progress.percent, progress.percentage, run.percent),
      currentEntity,
      etaSeconds: readNumber(progress.etaSeconds, run.etaSeconds),
      estimatedCompletionAt: readString(
        progress.estimatedCompletionAt,
        progress.etaAt,
        run.estimatedCompletionAt,
      ),
      heartbeatAt: readString(
        progress.heartbeatAt,
        run.heartbeatAt,
        run.lastSyncedAt,
        run.updatedAt,
      ),
    },
    snapshot,
    autoImportMode:
      (readString(autoImport.mode, run.autoImportMode) as AdminUpstreamAutoImportMode) || undefined,
    error: readErrorString(
      run.error,
      run.errorSummary,
      run.lastError,
      run.upstreamError,
      run.message,
    ),
    stale: readBoolean(run.stale) || readString(run.status) === 'stale',
  }
}

const normalizeUpstreamParser = (value: unknown): AdminUpstreamParser | undefined => {
  const parser = asRecord(value)
  if (!parser) return undefined
  const schedule = asRecord(parser.schedule) || {}
  const config = asRecord(parser.config) || {}
  const worker = asRecord(parser.worker) || {}
  const capabilities = asRecord(parser.capabilities) || {}
  const entityLimitCapability = asRecord(capabilities.entityLimit)
  const entityLimitMin = readNumber(entityLimitCapability?.min)
  const entityLimitMax = readNumber(entityLimitCapability?.max)
  const controlGranularity = asRecord(capabilities.controlGranularity)
  const defaultFilters = asRecord(config.defaultFilters) || asRecord(parser.defaultFilters) || {}
  const autoImportPolicy = asRecord(parser.autoImportPolicy) || {}

  const parserKey = readString(parser.parserKey, parser.key, parser.id)
  if (!parserKey) return undefined

  const importTargets = asArray(parser.importTargets || parser.downstreamTargets)
    .map((value) => {
      const target = asRecord(value)
      const pipelineKey = readString(target?.pipelineKey, target?.key)
      if (!target || !pipelineKey) return undefined
      const rawModes = asArray(target.modes).filter(
        (mode): mode is AdminParserRunMode => mode === 'dry-run' || mode === 'write',
      )
      return {
        pipelineKey,
        label: readString(target.label, target.title) || pipelineKey,
        sourceType: readString(target.sourceType),
        modes: rawModes.length ? rawModes : undefined,
        writeRequiresFullSnapshot: readBoolean(target.writeRequiresFullSnapshot),
      }
    })
    .filter((target): target is NonNullable<typeof target> => Boolean(target))
  const allowedImportTargets = new Set(importTargets.map((target) => target.pipelineKey))
  const policyMode = readString(autoImportPolicy.autoImportMode)
  const normalizedPolicyMode: AdminUpstreamAutoImportMode =
    policyMode === 'dry-run' || policyMode === 'write' ? policyMode : 'off'
  const policyTargets = asArray(autoImportPolicy.autoImportTargets)
    .map((target) => readString(target))
    .filter((target): target is string => Boolean(target && allowedImportTargets.has(target)))

  return {
    parserKey,
    label: readString(parser.label, parser.name, parser.title) || parserKey,
    description: readString(parser.description),
    sourceType:
      readString(parser.sourceType, parser.source) || parserKey.split(':')[0] || 'unknown',
    importTargets,
    capabilities: {
      entityLimit:
        entityLimitMin !== undefined && entityLimitMax !== undefined
          ? {
              min: entityLimitMin,
              max: entityLimitMax,
            }
          : undefined,
      filters: asArray(capabilities.filters)
        .map((filter) => readString(filter))
        .filter((filter): filter is string => Boolean(filter)),
      executionMode:
        capabilities.executionMode === 'entity' || capabilities.executionMode === 'batch'
          ? capabilities.executionMode
          : undefined,
      controlGranularity: controlGranularity
        ? {
            pause:
              controlGranularity.pause === 'entity-boundary' ||
              controlGranularity.pause === 'batch-boundary'
                ? controlGranularity.pause
                : undefined,
            cancel:
              controlGranularity.cancel === 'entity-boundary' ||
              controlGranularity.cancel === 'batch-boundary'
                ? controlGranularity.cancel
                : undefined,
            snapshotPublication: readString(controlGranularity.snapshotPublication),
          }
        : undefined,
    },
    enabled: readBoolean(config.enabled, parser.enabled) ?? true,
    paused: readBoolean(config.paused, parser.paused) ?? false,
    scheduleEnabled: readBoolean(config.scheduleEnabled, parser.scheduleEnabled, schedule.enabled),
    intervalMinutes: readNumber(
      config.intervalMinutes,
      parser.intervalMinutes,
      schedule.intervalMinutes,
    ),
    defaultEntityLimit: readNumber(
      config.defaultEntityLimit,
      parser.defaultEntityLimit,
      parser.entityLimit,
    ),
    defaultFilters: {
      ...defaultFilters,
      ...(readBoolean(defaultFilters.onlyMissing) !== undefined
        ? { onlyMissing: readBoolean(defaultFilters.onlyMissing) }
        : {}),
      ...(readNumber(defaultFilters.refreshOlderThanHours) !== undefined
        ? { refreshOlderThanHours: readNumber(defaultFilters.refreshOlderThanHours) }
        : {}),
    },
    autoImportPolicy: {
      autoImportMode: normalizedPolicyMode,
      autoImportTargets: policyTargets,
      effectiveFromAt: readString(autoImportPolicy.effectiveFromAt) || undefined,
      revision: readNumber(autoImportPolicy.revision) || 0,
      updatedAt: readString(autoImportPolicy.updatedAt),
      invalidReason: readString(autoImportPolicy.invalidReason),
    },
    status: readString(parser.status, parser.state),
    canStart: readBoolean(parser.canStart),
    nextRunAt: readString(config.nextRunAt, parser.nextRunAt, schedule.nextRunAt),
    lastSuccessAt: readString(parser.lastSuccessAt, parser.lastSucceededAt),
    lastHeartbeatAt: readString(
      parser.lastHeartbeatAt,
      parser.heartbeatAt,
      worker.heartbeatAt,
      worker.lastHeartbeatAt,
    ),
    currentRun: normalizeUpstreamRun(parser.currentRun || parser.activeRun),
    latestSnapshot: normalizeUpstreamSnapshot(parser.latestSnapshot || parser.lastSnapshot),
  }
}

const normalizeUpstreamFlow = (value: unknown): AdminUpstreamFlow | undefined => {
  const flow = asRecord(value)
  if (!flow) return undefined

  const upstream = asRecord(flow.upstream) || asRecord(flow.parse) || {}
  const snapshot = asRecord(flow.snapshot) || {}
  const importStep = asRecord(flow.import) || asRecord(flow.downstreamImport) || {}
  const autoImport = asRecord(flow.autoImport) || {}
  const autoImportResult = asRecord(flow.autoImportResult) || {}
  const resultTargets = asRecord(autoImportResult.targets) || {}
  const runIds = asRecord(flow.autoImportRunIds) || {}
  const flowId = readString(flow.flowId, flow.id, flow._id)
  if (!flowId) return undefined
  const status = readString(flow.status)
  const snapshotId = readString(flow.snapshotId, snapshot.snapshotId, snapshot.id)
  const plannedTargets = asArray(autoImport.targets)
  const importKeys = new Set<string>()
  plannedTargets.forEach((entry) => {
    const pipelineKey = readString(asRecord(entry)?.pipelineKey)
    if (pipelineKey) importKeys.add(pipelineKey)
  })
  Object.keys(resultTargets).forEach((pipelineKey) => importKeys.add(pipelineKey))
  Object.keys(runIds).forEach((pipelineKey) => importKeys.add(pipelineKey))
  const imports = Array.from(importKeys).map((pipelineKey) => {
    const planned =
      asRecord(
        plannedTargets.find((entry) => readString(asRecord(entry)?.pipelineKey) === pipelineKey),
      ) || {}
    const result = asRecord(resultTargets[pipelineKey]) || {}
    return {
      pipelineKey,
      requestedMode: readString(result.requestedMode, planned.requestedMode, planned.mode) as
        | AdminParserRunMode
        | undefined,
      effectiveMode: readString(result.effectiveMode, planned.mode) as
        | AdminParserRunMode
        | undefined,
      runId: readString(result.runId, runIds[pipelineKey]),
      status: readString(result.status, flow.autoImportStatus),
      error: readErrorString(result.error, result.policyReason),
    }
  })

  return {
    flowId,
    parserKey: readString(flow.parserKey, upstream.parserKey),
    sourceType: readString(flow.sourceType, upstream.sourceType),
    status,
    upstreamRunId: readString(flow.upstreamRunId, flow.externalRunId, upstream.runId, upstream.id),
    upstreamStatus: readString(flow.upstreamStatus, upstream.status, flow.status),
    snapshotId,
    snapshotStatus:
      readString(flow.snapshotStatus, snapshot.status) ||
      (snapshotId && status && ['succeeded', 'completed', 'success'].includes(status)
        ? 'complete'
        : undefined),
    importRunId: readString(
      flow.importRunId,
      flow.autoImportRunId,
      importStep.runId,
      importStep.id,
    ),
    importStatus: readString(flow.importStatus, flow.autoImportStatus, importStep.status),
    importMode: readString(flow.importMode, asRecord(flow.autoImport)?.mode, importStep.mode) as
      | AdminParserRunMode
      | undefined,
    imports,
    createdAt: readString(flow.createdAt),
    updatedAt: readString(flow.updatedAt),
    error: readErrorString(
      flow.error,
      flow.errorSummary,
      flow.lastError,
      flow.autoImportError,
      importStep.error,
      upstream.error,
    ),
  }
}

const normalizeUpstreamControl = (value: unknown): AdminUpstreamControlSnapshot => {
  const envelope = asRecord(unwrapEnvelope(value)) || {}
  const content = asRecord(envelope.apiintel) || envelope
  const connection = asRecord(content.connection) || asRecord(content.health) || {}
  const global = asRecord(content.global) || {}
  const rawRuns = asArray(content.runs || content.recentRuns)
  const parsers = asArray(content.parsers || content.items)
    .map(normalizeUpstreamParser)
    .filter((parser): parser is AdminUpstreamParser => Boolean(parser))
  const runs = rawRuns
    .map(normalizeUpstreamRun)
    .filter((run): run is AdminUpstreamRun => Boolean(run))

  parsers.forEach((parser) => {
    if (!parser.currentRun) {
      parser.currentRun = runs.find(
        (run) =>
          run.parserKey === parser.parserKey &&
          ['queued', 'running', 'pause_requested', 'paused', 'cancel_requested'].includes(
            run.status,
          ),
      )
    }
  })

  const status = readString(connection.status, content.connectionStatus)
  const connected =
    readBoolean(
      content.connected,
      connection.connected,
      connection.available,
      connection.reachable,
    ) ??
    ['connected', 'healthy', 'ok', 'online', 'available'].includes((status || '').toLowerCase())

  return {
    connected,
    environment: readString(
      content.environment,
      global.upstreamEnvironment,
      connection.environment,
    ) as AdminParserGlobalMode | undefined,
    environmentCompatible: readBoolean(
      global.environmentCompatible,
      global.environmentMatches,
      connection.environmentCompatible,
      connection.environmentMatches,
    ),
    connection: {
      connected,
      status: status || (connected ? 'connected' : 'unreachable'),
      baseUrl: readString(connection.baseUrl, connection.url, content.baseUrl),
      checkedAt: readString(connection.checkedAt, content.checkedAt),
      heartbeatAt: readString(connection.heartbeatAt, connection.lastHeartbeatAt),
      error: readErrorString(connection.error, content.connectionError),
    },
    parsers,
    runs,
    flows: asArray(content.flows)
      .map(normalizeUpstreamFlow)
      .filter((flow): flow is AdminUpstreamFlow => Boolean(flow)),
  }
}

const withNormalizedData = <T>(
  response: AdminDataSyncResponse<unknown>,
  data: T,
): AdminDataSyncResponse<T> => ({
  ...response,
  data,
})

export const fetchAdminDataSyncConfig = () =>
  request<AdminDataSyncConfig>('admin-data-sync/config', { method: 'GET' })

export const fetchAdminParserControls = () =>
  request<AdminParserControlSnapshot>('admin-data-sync/parsers', { method: 'GET' })

export const updateAdminParserGlobal = (input: UpdateAdminParserGlobalInput) =>
  request<unknown>('admin-data-sync/parsers/global', {
    method: 'PATCH',
    body: JSON.stringify(input),
  })

export const updateAdminParser = (parserKey: string, input: UpdateAdminParserInput) =>
  request<unknown>(`admin-data-sync/parsers/${encodeURIComponent(parserKey)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })

export const runAdminParser = (parserKey: string, input: RunAdminParserInput) =>
  request<unknown>(`admin-data-sync/parsers/${encodeURIComponent(parserKey)}/run`, {
    method: 'POST',
    body: JSON.stringify(input),
  })

export const fetchAdminParserRuns = (limit = 20) =>
  request<AdminParserRun[]>(`admin-data-sync/parsers/runs?limit=${encodeURIComponent(limit)}`, {
    method: 'GET',
  })

export const fetchAdminUpstreamParsers = async () => {
  const response = await request<unknown>('admin-data-sync/upstream-parsers', { method: 'GET' })
  return withNormalizedData(response, normalizeUpstreamControl(response.data))
}

export const fetchAdminUpstreamRuns = async () => {
  const response = await request<unknown>('admin-data-sync/upstream-runs', { method: 'GET' })
  const payload = unwrapEnvelope(response.data)
  const record = asRecord(payload)
  const runs = asArray(record?.runs || record?.items || payload)
    .map(normalizeUpstreamRun)
    .filter((run): run is AdminUpstreamRun => Boolean(run))

  return withNormalizedData(response, runs)
}

export const fetchAdminUpstreamRun = async (runId: string) => {
  const response = await request<unknown>(
    `admin-data-sync/upstream-runs/${encodeURIComponent(runId)}`,
    { method: 'GET' },
  )
  const payload = unwrapEnvelope(response.data)
  const record = asRecord(payload)
  const run = normalizeUpstreamRun(record?.run || payload)
  return withNormalizedData(response, run)
}

export const startAdminUpstreamParser = (parserKey: string, input: StartAdminUpstreamParserInput) =>
  request<unknown>(`admin-data-sync/upstream-parsers/${encodeURIComponent(parserKey)}/runs`, {
    method: 'POST',
    body: JSON.stringify(input),
  })

export const updateAdminUpstreamParser = (
  parserKey: string,
  input: UpdateAdminUpstreamParserInput,
) =>
  request<unknown>(`admin-data-sync/upstream-parsers/${encodeURIComponent(parserKey)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })

export const updateAdminUpstreamAutoImportPolicy = (
  parserKey: string,
  input: UpdateAdminUpstreamAutoImportPolicyInput,
) =>
  request<unknown>(
    `admin-data-sync/upstream-parsers/${encodeURIComponent(parserKey)}/import-policy`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  )

export const pauseAdminUpstreamRun = (runId: string) =>
  request<unknown>(`admin-data-sync/upstream-runs/${encodeURIComponent(runId)}/pause`, {
    method: 'POST',
    body: JSON.stringify({}),
  })

export const resumeAdminUpstreamRun = (runId: string) =>
  request<unknown>(`admin-data-sync/upstream-runs/${encodeURIComponent(runId)}/resume`, {
    method: 'POST',
    body: JSON.stringify({}),
  })

export const cancelAdminUpstreamRun = (runId: string) =>
  request<unknown>(`admin-data-sync/upstream-runs/${encodeURIComponent(runId)}/cancel`, {
    method: 'POST',
    body: JSON.stringify({}),
  })

export const importAdminParserSnapshot = (
  snapshotId: string,
  input: ImportAdminParserSnapshotInput,
) =>
  request<unknown>(`admin-data-sync/parser-snapshots/${encodeURIComponent(snapshotId)}/imports`, {
    method: 'POST',
    body: JSON.stringify(input),
  })

export const fetchCoinGeckoCreditUsage = () =>
  request<CoinGeckoCreditUsage>('admin/coingecko/usage', { method: 'GET' })

export const previewFomoMarketScheduleRebase = () =>
  request<FomoMarketScheduleRebaseResult>('admin/fomo-v2/market/schedule/rebase', {
    method: 'POST',
    body: JSON.stringify({ dryRun: true }),
  })

export const applyFomoMarketScheduleRebase = (confirm: string) =>
  request<FomoMarketScheduleRebaseResult>('admin/fomo-v2/market/schedule/rebase', {
    method: 'POST',
    body: JSON.stringify({ dryRun: false, confirm }),
  })

export const fetchAdminDataSyncJobs = () =>
  request<AdminDataSyncJob[]>('admin-data-sync/jobs', { method: 'GET' })

export const previewProdToDevSync = () =>
  request<AdminDataSyncPreview>('admin-data-sync/prod-to-dev/preview', {
    method: 'POST',
    body: JSON.stringify({}),
  })

export const runProdToDevSync = () =>
  request<{
    jobId: string
    status: AdminDataSyncJob['status']
    runMode?: AdminDataSyncConfig['prodToDevRunMode']
  }>('admin-data-sync/prod-to-dev/run', {
    method: 'POST',
    body: JSON.stringify({}),
  })

export const createDevToProdDiff = (input: AdminDataSyncDiffInput) =>
  request<AdminDataSyncDiffResult>('admin-data-sync/dev-to-prod/diff', {
    method: 'POST',
    body: JSON.stringify(input),
  })

export const fetchAdminDataSyncPromotions = () =>
  request<AdminDataSyncPromotion[]>('admin-data-sync/dev-to-prod/promotions', {
    method: 'GET',
  })

export const approveAdminDataSyncPromotion = (promotionId: string) =>
  request<AdminDataSyncPromotion>(
    `admin-data-sync/dev-to-prod/promotions/${encodeURIComponent(promotionId)}/approve`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  )

export const rejectAdminDataSyncPromotion = (promotionId: string) =>
  request<AdminDataSyncPromotion>(
    `admin-data-sync/dev-to-prod/promotions/${encodeURIComponent(promotionId)}/reject`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  )

export const applyAdminDataSyncPromotion = (promotionId: string, confirmationPhrase: string) =>
  request<AdminDataSyncPromotion>(
    `admin-data-sync/dev-to-prod/promotions/${encodeURIComponent(promotionId)}/apply`,
    {
      method: 'POST',
      body: JSON.stringify({ confirmationPhrase }),
    },
  )
