import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AdminParserControl,
  AdminParserControlSnapshot,
  AdminParserRun,
  AdminParserRunMode,
  AdminParserStatus,
  AdminUpstreamAutoImportMode,
  AdminUpstreamControlSnapshot,
  AdminUpstreamParser,
  AdminUpstreamParserFilters,
  AdminUpstreamRun,
  AdminUpstreamSnapshot,
  applyFomoMarketScheduleRebase,
  cancelAdminUpstreamRun,
  CoinGeckoCreditUsage,
  fetchAdminParserControls,
  fetchAdminUpstreamParsers,
  fetchCoinGeckoCreditUsage,
  FomoMarketLatestCadence,
  FomoMarketScheduleRebaseResult,
  FomoMarketScheduleTier,
  importAdminParserSnapshot,
  pauseAdminUpstreamRun,
  previewFomoMarketScheduleRebase,
  resumeAdminUpstreamRun,
  runAdminParser,
  startAdminUpstreamParser,
  updateAdminParser,
  updateAdminParserGlobal,
  updateAdminUpstreamAutoImportPolicy,
  updateAdminUpstreamParser,
} from '../../../components/services/adminDataSync'
import { useStyles } from '../styles'

const pipelineSteps = [
  'External Sources',
  'apiintel Parser Run',
  'Parser DB Snapshot',
  'FOMO Import',
  'FOMO AI Review',
  'Admin / Moderator Review',
  'FOMO v2 Dev DB',
  'Materialized Read Models',
  'Database Manager Promotion',
  'Production DB',
]

const marketScheduleTiers: FomoMarketScheduleTier[] = ['HOT', 'WARM', 'COLD']
const marketLatestCadences: FomoMarketLatestCadence[] = ['HOT', 'HOT_WARM', 'WARM', 'COLD']

interface ParserDraft {
  defaultRunMode: AdminParserRunMode
  intervalMinutes: string
}

interface UpstreamParserDraft {
  entityLimit: string
  defaultEntityLimit: string
  intervalMinutes: string
  onlyMissing: boolean
  refreshOlderThanHours: string
  autoImportMode: AdminUpstreamAutoImportMode
  autoImportTargets: string[]
}

const activeUpstreamStatuses = [
  'creating',
  'queued',
  'running',
  'pause_requested',
  'paused',
  'resume_requested',
  'cancel_requested',
]

const successfulUpstreamStatuses = ['completed', 'succeeded', 'success']

const readySnapshotStatuses = ['complete']

const fallbackDropstabParser: AdminUpstreamParser = {
  parserKey: 'dropstab:coin-details',
  label: 'Dropstab · Coin details',
  description: 'Сбор карточек проектов Dropstab в parser DB.',
  sourceType: 'dropstab',
  importTargets: [
    { pipelineKey: 'funding:dropstab', label: 'Funding · Dropstab' },
    { pipelineKey: 'vesting:dropstab', label: 'Vesting · Dropstab' },
    { pipelineKey: 'unlocks:dropstab', label: 'Unlocks · Dropstab' },
  ],
  autoImportPolicy: {
    autoImportMode: 'off',
    autoImportTargets: ['funding:dropstab', 'vesting:dropstab', 'unlocks:dropstab'],
    revision: 0,
  },
  enabled: false,
  canStart: false,
  status: 'unavailable',
}

const upstreamStatusLabels = new Map<string, string>([
  ['queued', 'В очереди'],
  ['running', 'Выполняется'],
  ['pause_requested', 'Запрошена пауза'],
  ['paused', 'На паузе'],
  ['resume_requested', 'Возобновляется'],
  ['cancel_requested', 'Отменяется'],
  ['cancelled', 'Отменён'],
  ['completed', 'Завершён'],
  ['succeeded', 'Завершён'],
  ['success', 'Завершён'],
  ['partial', 'Частично'],
  ['failed', 'Ошибка'],
  ['stale', 'Нет heartbeat'],
  ['unreachable', 'apiintel недоступен'],
  ['environment_mismatch', 'Несовместимая среда'],
  ['worker_disabled', 'Worker выключен'],
  ['disabled', 'Выключен'],
  ['creating', 'Создаётся'],
  ['idle', 'Готов'],
  ['unavailable', 'Недоступен'],
])

const parserStatusLabels: Record<AdminParserStatus, string> = {
  recovering: 'Восстановление',
  'global-off': 'Глобально выключен',
  paused: 'На паузе',
  idle: 'Готов',
  queued: 'В очереди',
  running: 'Выполняется',
  completed: 'Завершён',
  partial: 'Частично',
  failed: 'Ошибка',
  abandoned: 'Прерван',
  cancelled: 'Отменён',
  skipped: 'Пропущен',
}

const formatParserMode = (mode: AdminParserRunMode) => (mode === 'write' ? 'Запись' : 'Dry run')

const formatParserRunSummary = (summary?: Record<string, unknown>) => {
  const items = Object.entries(summary || {})
    .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
    .slice(0, 6)

  return items.length ? items.map(([key, value]) => `${key}: ${String(value)}`).join(' · ') : '—'
}

const formatMaterializationSummary = (summary?: Record<string, unknown>) => {
  const materialization = summary?.materialization
  if (!materialization || typeof materialization !== 'object' || Array.isArray(materialization)) {
    return ''
  }

  const value = materialization as Record<string, unknown>
  const status = typeof value.status === 'string' ? value.status : 'unknown'
  const steps = Array.isArray(value.steps) ? value.steps : []
  const completed = steps.filter(
    (step) =>
      step &&
      typeof step === 'object' &&
      !Array.isArray(step) &&
      (step as Record<string, unknown>).status === 'completed',
  ).length

  return `Витрины: ${status} · ${completed}/${steps.length}`
}

const formatParserProgress = (run: AdminParserRun) => {
  if (!run.progress?.phase) return ''
  const parts: Array<string | undefined> = [run.progress.phase, run.progress.step]
  if (run.progress.stepCount && run.progress.stepIndex) {
    parts.push(`${run.progress.stepIndex}/${run.progress.stepCount}`)
  }
  if (typeof run.progress.scanned === 'number') parts.push(`scanned ${run.progress.scanned}`)
  if (typeof run.progress.written === 'number') parts.push(`written ${run.progress.written}`)
  return parts.filter(Boolean).join(' · ')
}

const formatUpstreamStatus = (status?: string) =>
  status ? upstreamStatusLabels.get(status) || status : '—'

const getUpstreamStatusBadgeClass = (
  status: string | undefined,
  classes: ReturnType<typeof useStyles>,
) => {
  if (!status) return classes.neutralBadge
  if (successfulUpstreamStatuses.includes(status) || status === 'idle') return classes.successBadge
  if (['failed', 'stale', 'unavailable', 'unreachable', 'environment_mismatch'].includes(status)) {
    return classes.dangerBadge
  }
  if (activeUpstreamStatuses.includes(status) || status === 'partial') return classes.warningBadge
  return classes.neutralBadge
}

const getUpstreamProgressPercent = (run?: AdminUpstreamRun) => {
  if (!run) return 0
  if (typeof run.progress.percent === 'number') {
    return Math.max(0, Math.min(100, run.progress.percent))
  }

  const total = run.progress.total || run.entityLimit || 0
  return total > 0 ? Math.max(0, Math.min(100, (run.progress.processed / total) * 100)) : 0
}

const formatEta = (run?: AdminUpstreamRun) => {
  if (!run) return '—'
  if (run.progress.estimatedCompletionAt)
    return formatParserDate(run.progress.estimatedCompletionAt)
  if (typeof run.progress.etaSeconds !== 'number') return '—'

  const seconds = Math.max(0, Math.round(run.progress.etaSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const tail = seconds % 60
  return [hours ? `${hours} ч` : '', minutes ? `${minutes} мин` : '', !hours ? `${tail} сек` : '']
    .filter(Boolean)
    .join(' ')
}

const isSnapshotReady = (snapshot?: AdminUpstreamSnapshot) =>
  Boolean(snapshot && readySnapshotStatuses.includes(snapshot.status))

const getUpstreamEntityLimitBounds = (parser: AdminUpstreamParser) => ({
  min: Math.max(1, Math.trunc(parser.capabilities?.entityLimit?.min || 1)),
  max: Math.max(1, Math.trunc(parser.capabilities?.entityLimit?.max || 100_000)),
})

const createUpstreamParserDraft = (parser: AdminUpstreamParser): UpstreamParserDraft => ({
  entityLimit: String(parser.defaultEntityLimit || 100),
  defaultEntityLimit: String(parser.defaultEntityLimit || 100),
  intervalMinutes: String(parser.intervalMinutes || 360),
  onlyMissing: parser.defaultFilters?.onlyMissing ?? false,
  refreshOlderThanHours:
    typeof parser.defaultFilters?.refreshOlderThanHours === 'number'
      ? String(parser.defaultFilters.refreshOlderThanHours)
      : '',
  autoImportMode: parser.autoImportPolicy.autoImportMode,
  autoImportTargets: parser.autoImportPolicy.autoImportTargets.filter((pipelineKey) =>
    parser.importTargets.some((target) => target.pipelineKey === pipelineKey),
  ),
})

const getUpstreamErrorMessage = (status: number, message?: string) => {
  if (status === 409) {
    return message || 'Конфликт: для этого парсера уже есть активный запуск. Обновите статус.'
  }
  if (status === 502 || status === 503 || status === 504) {
    return (
      message ||
      'apiintel недоступен или не отвечает. Повторите попытку после восстановления связи.'
    )
  }
  return message || 'Операция apiintel не выполнена.'
}

const formatCredits = (value: number | null) =>
  value === null ? 'unavailable' : Math.round(value).toLocaleString('en-US')

const formatPercent = (value: number | null) =>
  value === null ? 'unavailable' : `${value.toFixed(2)}%`

const formatDate = (value: string | null) => {
  if (!value) return 'not checked'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-US')
}

const formatIntervalMs = (value: number) => {
  const units = [
    { milliseconds: 86_400_000, label: 'day' },
    { milliseconds: 3_600_000, label: 'hour' },
    { milliseconds: 60_000, label: 'minute' },
  ]

  for (const unit of units) {
    if (value >= unit.milliseconds && value % unit.milliseconds === 0) {
      const amount = value / unit.milliseconds
      return `${amount.toLocaleString('en-US')} ${unit.label}${amount === 1 ? '' : 's'}`
    }
  }

  return `${value.toLocaleString('en-US')} ms`
}

const formatParserDate = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ru-RU')
}

const getParserStatusBadgeClass = (
  status: AdminParserStatus,
  classes: ReturnType<typeof useStyles>,
) => {
  if (status === 'completed' || status === 'idle') return classes.successBadge
  if (status === 'failed' || status === 'abandoned') return classes.dangerBadge
  if (
    status === 'queued' ||
    status === 'recovering' ||
    status === 'running' ||
    status === 'partial'
  ) {
    return classes.warningBadge
  }
  return classes.neutralBadge
}

const ParsingManager = () => {
  const classes = useStyles()
  const [parserControl, setParserControl] = useState<AdminParserControlSnapshot | null>(null)
  const [parserDrafts, setParserDrafts] = useState<Record<string, ParserDraft>>({})
  const [parserControlLoading, setParserControlLoading] = useState(false)
  const [parserControlError, setParserControlError] = useState('')
  const [parserControlNotice, setParserControlNotice] = useState('')
  const [parserAction, setParserAction] = useState('')
  const dirtyParserDrafts = useRef<Set<string>>(new Set())
  const [upstreamControl, setUpstreamControl] = useState<AdminUpstreamControlSnapshot | null>(null)
  const [upstreamDrafts, setUpstreamDrafts] = useState<Record<string, UpstreamParserDraft>>({})
  const [upstreamLoading, setUpstreamLoading] = useState(false)
  const [upstreamError, setUpstreamError] = useState('')
  const [upstreamNotice, setUpstreamNotice] = useState('')
  const [upstreamAction, setUpstreamAction] = useState('')
  const upstreamRequestSequence = useRef(0)
  const dirtyUpstreamPolicyDrafts = useRef<Set<string>>(new Set())
  const [creditUsage, setCreditUsage] = useState<CoinGeckoCreditUsage | null>(null)
  const [creditUsageLoading, setCreditUsageLoading] = useState(false)
  const [creditUsageError, setCreditUsageError] = useState('')
  const [scheduleRebase, setScheduleRebase] = useState<FomoMarketScheduleRebaseResult | null>(null)
  const [scheduleRebaseLoading, setScheduleRebaseLoading] = useState(false)
  const [scheduleRebaseError, setScheduleRebaseError] = useState('')
  const [scheduleRebaseNotice, setScheduleRebaseNotice] = useState('')
  const [scheduleRebaseConfirmation, setScheduleRebaseConfirmation] = useState('')

  const loadParserControls = useCallback(async (showLoading = false) => {
    if (showLoading) setParserControlLoading(true)

    try {
      const response = await fetchAdminParserControls()

      if (!response.success) {
        setParserControlError(response.error || 'Не удалось загрузить состояние парсеров.')
        return
      }

      setParserControl(response.data)
      setParserControlError('')
      setParserDrafts((current) => {
        const next: Record<string, ParserDraft> = {}

        response.data.parsers.forEach((parser) => {
          next[parser.parserKey] =
            dirtyParserDrafts.current.has(parser.parserKey) && current[parser.parserKey]
              ? current[parser.parserKey]
              : {
                  defaultRunMode: parser.writeRequiresSnapshot ? 'dry-run' : parser.defaultRunMode,
                  intervalMinutes: String(parser.intervalMinutes),
                }
        })

        return next
      })
    } catch {
      setParserControlError('Не удалось загрузить состояние парсеров.')
    } finally {
      if (showLoading) setParserControlLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadParserControls(true)
    const pollId = window.setInterval(() => {
      void loadParserControls()
    }, 10_000)

    return () => window.clearInterval(pollId)
  }, [loadParserControls])

  const loadUpstreamControls = useCallback(async (showLoading = false) => {
    const requestSequence = upstreamRequestSequence.current + 1
    upstreamRequestSequence.current = requestSequence
    if (showLoading) setUpstreamLoading(true)

    try {
      const response = await fetchAdminUpstreamParsers()
      if (requestSequence !== upstreamRequestSequence.current) return null

      if (!response.success) {
        setUpstreamError(getUpstreamErrorMessage(response.status, response.error))
        return null
      }

      setUpstreamControl(response.data)
      setUpstreamError(response.data.connection.error || '')
      setUpstreamDrafts((current) => {
        const next = { ...current }

        response.data.parsers.forEach((parser) => {
          const serverDraft = createUpstreamParserDraft(parser)
          const existing = next[parser.parserKey]
          if (!existing) {
            next[parser.parserKey] = serverDraft
            return
          }
          if (!dirtyUpstreamPolicyDrafts.current.has(parser.parserKey)) {
            next[parser.parserKey] = {
              ...existing,
              autoImportMode: serverDraft.autoImportMode,
              autoImportTargets: serverDraft.autoImportTargets,
            }
          }
        })

        return next
      })
      return response.data
    } catch {
      if (requestSequence === upstreamRequestSequence.current) {
        setUpstreamError('Не удалось связаться с apiintel.')
      }
      return null
    } finally {
      if (showLoading && requestSequence === upstreamRequestSequence.current) {
        setUpstreamLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    let stopped = false
    let pollTimer: number | undefined
    let polling = false
    let failureCount = 0

    const schedule = (delay: number) => {
      window.clearTimeout(pollTimer)
      pollTimer = window.setTimeout(() => void poll(false), delay)
    }

    const poll = async (showLoading: boolean) => {
      if (stopped || polling) return
      polling = true
      const snapshot = await loadUpstreamControls(showLoading)
      polling = false
      if (stopped) return

      failureCount = snapshot ? 0 : Math.min(failureCount + 1, 3)
      const hasActiveRun = Boolean(
        snapshot?.runs.some((run) => activeUpstreamStatuses.includes(run.status)) ||
          snapshot?.parsers.some(
            (parser) =>
              parser.currentRun && activeUpstreamStatuses.includes(parser.currentRun.status),
          ),
      )
      const baseDelay = document.hidden ? 30_000 : hasActiveRun ? 2_000 : 15_000
      schedule(Math.min(60_000, baseDelay * 2 ** failureCount))
    }

    const handleVisibility = () => {
      if (!document.hidden && !polling) {
        window.clearTimeout(pollTimer)
        void poll(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    void poll(true)

    return () => {
      stopped = true
      window.clearTimeout(pollTimer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [loadUpstreamControls])

  const parserGroups = useMemo(() => {
    const groups = new Map<string, AdminParserControl[]>()
    const availableParsers = parserControl?.parsers || []

    availableParsers.forEach((parser) => {
      const group = groups.get(parser.sourceType) || []
      group.push(parser)
      groups.set(parser.sourceType, group)
    })

    return Array.from(groups.entries())
  }, [parserControl?.parsers])

  const upstreamParsers = useMemo(() => {
    if (!upstreamControl) return []
    return upstreamControl.parsers.length ? upstreamControl.parsers : [fallbackDropstabParser]
  }, [upstreamControl])

  const getActiveUpstreamRun = useCallback(
    (parser: AdminUpstreamParser) =>
      parser.currentRun ||
      upstreamControl?.runs.find(
        (run) => run.parserKey === parser.parserKey && activeUpstreamStatuses.includes(run.status),
      ),
    [upstreamControl?.runs],
  )

  const getLatestUpstreamSnapshot = useCallback(
    (parser: AdminUpstreamParser) =>
      parser.latestSnapshot ||
      upstreamControl?.runs.find(
        (run) => run.parserKey === parser.parserKey && Boolean(run.snapshot),
      )?.snapshot,
    [upstreamControl?.runs],
  )

  const performParserMutation = async (
    action: string,
    operation: () => Promise<{ success: boolean; error?: string }>,
    successMessage: string,
    cleanDraftKey?: string,
  ) => {
    setParserAction(action)
    setParserControlError('')
    setParserControlNotice('')

    try {
      const response = await operation()

      if (!response.success) {
        setParserControlError(response.error || 'Операция с парсером не выполнена.')
        return
      }

      if (cleanDraftKey) dirtyParserDrafts.current.delete(cleanDraftKey)
      setParserControlNotice(successMessage)
      await loadParserControls()
    } catch {
      setParserControlError('Операция с парсером не выполнена.')
    } finally {
      setParserAction('')
    }
  }

  const handleGlobalMode = async (mode: 'test' | 'prod') => {
    if (mode === parserControl?.global.mode) return
    if (
      mode === 'prod' &&
      !window.confirm(
        'Переключить парсеры в PROD? В этом режиме разрешённые задания смогут записывать данные.',
      )
    ) {
      return
    }

    await performParserMutation(
      'global:mode',
      () => updateAdminParserGlobal({ mode }),
      mode === 'test'
        ? 'Включён TEST: записи доменных данных запрещены сервером.'
        : 'Включён PROD. Возможность записи по-прежнему определяется серверной политикой.',
    )
  }

  const handleGlobalEnabled = async () => {
    const enabled = !parserControl?.global.enabled
    await performParserMutation(
      'global:enabled',
      () => updateAdminParserGlobal({ enabled }),
      enabled ? 'Парсеры глобально включены.' : 'Парсеры глобально выключены.',
    )
  }

  const handleParserPatch = async (
    parser: AdminParserControl,
    input: Parameters<typeof updateAdminParser>[1],
    action: string,
    successMessage: string,
    cleanDraft = false,
  ) => {
    await performParserMutation(
      `${parser.parserKey}:${action}`,
      () => updateAdminParser(parser.parserKey, input),
      successMessage,
      cleanDraft ? parser.parserKey : undefined,
    )
  }

  const handleParserSettingsSave = async (parser: AdminParserControl) => {
    const draft = parserDrafts[parser.parserKey]
    if (!draft) return

    const intervalMinutes = Number(draft.intervalMinutes)
    if (!Number.isInteger(intervalMinutes) || intervalMinutes < 1 || intervalMinutes > 10_080) {
      setParserControlError('Частота обновления должна быть от 1 до 10 080 целых минут.')
      return
    }

    await handleParserPatch(
      parser,
      {
        defaultRunMode: parser.writeRequiresSnapshot ? 'dry-run' : draft.defaultRunMode,
        intervalMinutes,
      },
      'settings',
      `Настройки «${parser.label}» сохранены.`,
      true,
    )
  }

  const handleParserRun = async (parser: AdminParserControl, mode: AdminParserRunMode) => {
    if (!parser.canRun || (mode === 'write' && !parser.canWrite)) return
    if (
      mode === 'write' &&
      !window.confirm(`Запустить «${parser.label}» с записью доменных данных?`)
    ) {
      return
    }

    await performParserMutation(
      `${parser.parserKey}:run`,
      () => runAdminParser(parser.parserKey, { mode }),
      `Запуск «${parser.label}» поставлен в очередь (${formatParserMode(mode)}).`,
    )
  }

  const updateParserDraft = (parser: AdminParserControl, patch: Partial<ParserDraft>) => {
    dirtyParserDrafts.current.add(parser.parserKey)
    setParserDrafts((current) => {
      const existing = current[parser.parserKey] || {
        defaultRunMode: parser.writeRequiresSnapshot ? 'dry-run' : parser.defaultRunMode,
        intervalMinutes: String(parser.intervalMinutes),
      }

      return {
        ...current,
        [parser.parserKey]: {
          ...existing,
          ...patch,
        },
      }
    })
  }

  const updateUpstreamDraft = (parserKey: string, patch: Partial<UpstreamParserDraft>) => {
    setUpstreamDrafts((current) => {
      const existing = current[parserKey] || {
        entityLimit: '100',
        defaultEntityLimit: '100',
        intervalMinutes: '360',
        onlyMissing: false,
        refreshOlderThanHours: '',
        autoImportMode: 'off',
        autoImportTargets: [],
      }

      return {
        ...current,
        [parserKey]: {
          ...existing,
          ...patch,
        },
      }
    })
  }

  const updateUpstreamPolicyDraft = (
    parserKey: string,
    patch: Pick<Partial<UpstreamParserDraft>, 'autoImportMode' | 'autoImportTargets'>,
  ) => {
    dirtyUpstreamPolicyDrafts.current.add(parserKey)
    updateUpstreamDraft(parserKey, patch)
  }

  const performUpstreamMutation = async (
    action: string,
    operation: () => Promise<{ success: boolean; status: number; error?: string }>,
    successMessage: string,
    cleanPolicyDraftKey?: string,
  ) => {
    setUpstreamAction(action)
    setUpstreamError('')
    setUpstreamNotice('')

    try {
      const response = await operation()
      if (!response.success) {
        setUpstreamError(getUpstreamErrorMessage(response.status, response.error))
        return
      }

      if (cleanPolicyDraftKey) dirtyUpstreamPolicyDrafts.current.delete(cleanPolicyDraftKey)
      setUpstreamNotice(successMessage)
      await Promise.all([loadUpstreamControls(), loadParserControls()])
    } catch {
      setUpstreamError('Операция apiintel не выполнена.')
    } finally {
      setUpstreamAction('')
    }
  }

  const handleUpstreamStart = async (parser: AdminUpstreamParser) => {
    const draft = upstreamDrafts[parser.parserKey] || createUpstreamParserDraft(parser)
    const entityLimitBounds = getUpstreamEntityLimitBounds(parser)
    const entityLimit = Number(draft.entityLimit)
    if (
      !Number.isInteger(entityLimit) ||
      entityLimit < entityLimitBounds.min ||
      entityLimit > entityLimitBounds.max
    ) {
      setUpstreamError(
        `Количество сущностей должно быть целым числом от ${entityLimitBounds.min.toLocaleString(
          'ru-RU',
        )} до ${entityLimitBounds.max.toLocaleString('ru-RU')}.`,
      )
      return
    }

    let refreshOlderThanHours: number | undefined
    if (draft.refreshOlderThanHours.trim()) {
      refreshOlderThanHours = Number(draft.refreshOlderThanHours)
      if (
        !Number.isInteger(refreshOlderThanHours) ||
        refreshOlderThanHours < 1 ||
        refreshOlderThanHours > 100_000
      ) {
        setUpstreamError('Возраст обновления должен быть от 1 до 100 000 целых часов.')
        return
      }
    }

    const selectedTargets = parser.importTargets.filter((target) =>
      draft.autoImportTargets.includes(target.pipelineKey),
    )
    if (draft.autoImportMode !== 'off' && !selectedTargets.length) {
      setUpstreamError('Выберите хотя бы один downstream pipeline для автоматического импорта.')
      return
    }
    const supportedFilters = new Set(parser.capabilities?.filters || [])
    const filters: AdminUpstreamParserFilters = Object.fromEntries(
      Object.entries(parser.defaultFilters || {}).filter(
        ([key, value]) => supportedFilters.has(key) && value !== undefined,
      ),
    )
    if (supportedFilters.has('onlyMissing')) {
      filters.onlyMissing = Boolean(draft.onlyMissing)
    }
    if (supportedFilters.has('refreshOlderThanHours')) {
      if (refreshOlderThanHours !== undefined) {
        filters.refreshOlderThanHours = refreshOlderThanHours
      } else {
        delete filters.refreshOlderThanHours
      }
    }

    await performUpstreamMutation(
      `${parser.parserKey}:start`,
      () =>
        startAdminUpstreamParser(parser.parserKey, {
          entityLimit,
          ...(Object.keys(filters).length ? { filters } : {}),
          autoImports:
            draft.autoImportMode === 'off'
              ? []
              : selectedTargets.map((target) => ({
                  pipelineKey: target.pipelineKey,
                  mode: draft.autoImportMode as AdminParserRunMode,
                })),
        }),
      `Сбор «${parser.label}» поставлен в очередь на ${entityLimit.toLocaleString(
        'ru-RU',
      )} сущностей.`,
    )
  }

  const handleUpstreamSettingsSave = async (parser: AdminUpstreamParser) => {
    const draft = upstreamDrafts[parser.parserKey]
    if (!draft) return

    const defaultEntityLimit = Number(draft.defaultEntityLimit)
    const intervalMinutes = Number(draft.intervalMinutes)
    const entityLimitBounds = getUpstreamEntityLimitBounds(parser)
    if (
      !Number.isInteger(defaultEntityLimit) ||
      defaultEntityLimit < entityLimitBounds.min ||
      defaultEntityLimit > entityLimitBounds.max
    ) {
      setUpstreamError(
        `Лимит по умолчанию должен быть целым числом от ${entityLimitBounds.min.toLocaleString(
          'ru-RU',
        )} до ${entityLimitBounds.max.toLocaleString('ru-RU')}.`,
      )
      return
    }
    if (!Number.isInteger(intervalMinutes) || intervalMinutes < 1 || intervalMinutes > 10_080) {
      setUpstreamError('Интервал apiintel должен быть от 1 до 10 080 целых минут.')
      return
    }

    await performUpstreamMutation(
      `${parser.parserKey}:settings`,
      () =>
        updateAdminUpstreamParser(parser.parserKey, {
          defaultEntityLimit,
          intervalMinutes,
        }),
      `Настройки upstream-парсера «${parser.label}» сохранены.`,
    )
  }

  const handleUpstreamPolicySave = async (parser: AdminUpstreamParser) => {
    const draft = upstreamDrafts[parser.parserKey]
    if (!draft) return
    const targets = parser.importTargets
      .filter((target) => draft.autoImportTargets.includes(target.pipelineKey))
      .map((target) => target.pipelineKey)
    if (draft.autoImportMode !== 'off' && !targets.length) {
      setUpstreamError('Выберите хотя бы один downstream pipeline для автоматического импорта.')
      return
    }
    if (draft.autoImportMode === 'write' && parserControl?.global.mode !== 'prod') {
      setUpstreamError('Политику автоматической записи можно сохранить только в режиме PROD.')
      return
    }
    if (
      draft.autoImportMode === 'write' &&
      !window.confirm(
        `Сохранять новые complete snapshots «${parser.label}» с автоматической записью во все выбранные pipeline?`,
      )
    ) {
      return
    }

    await performUpstreamMutation(
      `${parser.parserKey}:import-policy`,
      () =>
        updateAdminUpstreamAutoImportPolicy(parser.parserKey, {
          autoImportMode: draft.autoImportMode,
          autoImportTargets: targets,
        }),
      `Flow автоматического импорта «${parser.label}» сохранён.`,
      parser.parserKey,
    )
  }

  const handleUpstreamParserPatch = async (
    parser: AdminUpstreamParser,
    patch: Parameters<typeof updateAdminUpstreamParser>[1],
    action: string,
    message: string,
  ) => {
    await performUpstreamMutation(
      `${parser.parserKey}:${action}`,
      () => updateAdminUpstreamParser(parser.parserKey, patch),
      message,
    )
  }

  const handleUpstreamRunAction = async (
    run: AdminUpstreamRun,
    action: 'pause' | 'resume' | 'cancel',
  ) => {
    if (action === 'cancel' && !window.confirm(`Отменить сбор ${run.runId}?`)) return

    const operation =
      action === 'pause'
        ? () => pauseAdminUpstreamRun(run.runId)
        : action === 'resume'
        ? () => resumeAdminUpstreamRun(run.runId)
        : () => cancelAdminUpstreamRun(run.runId)
    const pauseGranularity = upstreamControl?.parsers.find(
      (parser) => parser.parserKey === run.parserKey,
    )?.capabilities?.controlGranularity?.pause
    const message =
      action === 'pause'
        ? pauseGranularity === 'batch-boundary'
          ? 'Запрошена безопасная пауза после завершения текущего пакетного запуска.'
          : 'Запрошена безопасная пауза после текущей сущности.'
        : action === 'resume'
        ? 'Сбор возобновлён.'
        : 'Запрошена отмена сбора.'

    await performUpstreamMutation(`${run.runId}:${action}`, operation, message)
  }

  const handleSnapshotImport = async (
    snapshot: AdminUpstreamSnapshot,
    target: AdminUpstreamParser['importTargets'][number],
    mode: AdminParserRunMode,
  ) => {
    if (!isSnapshotReady(snapshot)) return
    if (!parserControl?.global.enabled || !parserControl.global.workerEnabled) return
    if (mode === 'write') {
      if (
        parserControl.global.mode !== 'prod' ||
        !parserControl.global.writesDomainData ||
        snapshot.environment !== 'prod' ||
        Number(snapshot.counts?.succeeded || snapshot.entityCount || 0) < 1
      ) {
        return
      }
      const confirmed = window.confirm(
        `Импортировать «${target.label}» с записью?\nИсточник: ${
          snapshot.sourceType || 'dropstab'
        }\nSnapshot: ${snapshot.snapshotId}\nСущностей: ${
          snapshot.counts?.succeeded ?? snapshot.entityCount ?? 'не указано'
        }`,
      )
      if (!confirmed) return
    }

    await performUpstreamMutation(
      `${snapshot.snapshotId}:${target.pipelineKey}:import:${mode}`,
      () =>
        importAdminParserSnapshot(snapshot.snapshotId, {
          pipelineKey: target.pipelineKey,
          mode,
          ...(snapshot.counts?.succeeded || snapshot.entityCount
            ? {
                limit: Math.min(
                  Math.max(Math.trunc(snapshot.counts?.succeeded || snapshot.entityCount || 0), 1),
                  100_000,
                ),
              }
            : {}),
        }),
      `${target.label}: snapshot ${snapshot.snapshotId} поставлен в очередь (${formatParserMode(
        mode,
      )}).`,
    )
  }

  const loadCreditUsage = useCallback(async () => {
    setCreditUsageLoading(true)
    setCreditUsageError('')

    try {
      const response = await fetchCoinGeckoCreditUsage()

      if (!response.success) {
        setCreditUsageError(response.error || 'Unable to load CoinGecko credit usage.')
        return
      }

      setCreditUsage(response.data)
    } catch {
      setCreditUsageError('Unable to load CoinGecko credit usage.')
    } finally {
      setCreditUsageLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCreditUsage()
  }, [loadCreditUsage])

  const previewScheduleRebase = async () => {
    setScheduleRebaseLoading(true)
    setScheduleRebaseError('')
    setScheduleRebaseNotice('')
    setScheduleRebaseConfirmation('')
    setScheduleRebase(null)

    try {
      const response = await previewFomoMarketScheduleRebase()

      if (!response.success) {
        setScheduleRebaseError(response.error || 'Unable to preview the market schedule rebase.')
        return
      }

      setScheduleRebase(response.data)
    } catch {
      setScheduleRebaseError('Unable to preview the market schedule rebase.')
    } finally {
      setScheduleRebaseLoading(false)
    }
  }

  const applyScheduleRebase = async () => {
    if (
      !scheduleRebase?.dryRun ||
      scheduleRebaseConfirmation !== scheduleRebase.confirmationRequired
    ) {
      return
    }

    setScheduleRebaseLoading(true)
    setScheduleRebaseError('')
    setScheduleRebaseNotice('')

    try {
      const response = await applyFomoMarketScheduleRebase(scheduleRebaseConfirmation)

      if (!response.success) {
        setScheduleRebaseError(response.error || 'Unable to apply the market schedule rebase.')
        return
      }

      setScheduleRebase(response.data)
      setScheduleRebaseConfirmation('')
      setScheduleRebaseNotice(
        `Updated ${response.data.counts.modified.toLocaleString('en-US')} schedule records.`,
      )
    } catch {
      setScheduleRebaseError('Unable to apply the market schedule rebase.')
    } finally {
      setScheduleRebaseLoading(false)
    }
  }

  const usageProgress = Math.max(0, Math.min(100, creditUsage?.budgetUtilizationPercent || 0))
  const usageIsHigh =
    (creditUsage?.budgetUtilizationPercent || 0) >= 80 ||
    (creditUsage?.projectedBudgetUtilizationPercent || 0) >= 100 ||
    (creditUsage?.recentCreditsPerHour || 0) >
      (creditUsage?.remainingHourlyBudget ?? Number.POSITIVE_INFINITY)
  const displayedHourlyRate =
    creditUsage?.recentCreditsPerHour ?? creditUsage?.averageCreditsPerHour ?? null

  return (
    <section className={classes.parsingManager}>
      <div className={classes.managerIntro}>
        <div>
          <h2>Сбор и импорт данных</h2>
          <p>Управление apiintel, snapshots и безопасным импортом в FOMO v2.</p>
        </div>
        <div className={classes.badgeRow}>
          <span
            className={`${classes.badge} ${
              parserControl?.global.enabled ? classes.successBadge : classes.neutralBadge
            }`}
          >
            {parserControl
              ? parserControl.global.enabled
                ? 'Система ON'
                : 'Система OFF'
              : 'Загрузка...'}
          </span>
          <span
            className={`${classes.badge} ${
              parserControl?.global.mode === 'prod' ? classes.dangerBadge : classes.warningBadge
            }`}
          >
            {parserControl?.global.mode.toUpperCase() || '—'}
          </span>
        </div>
      </div>

      <section className={classes.panel}>
        <div className={classes.panelHeader}>
          <h2>Глобальный режим</h2>
          <p>Серверная политика применяется к сбору и всем ручным и плановым импортам.</p>
        </div>
        <div className={classes.panelBody}>
          {parserControlError ? <div className={classes.error}>{parserControlError}</div> : null}
          {parserControlNotice ? (
            <div aria-live='polite' className={classes.safetyNotice}>
              {parserControlNotice}
            </div>
          ) : null}
          {parserControlLoading && !parserControl ? (
            <div className={classes.emptyState}>Загружаем состояние парсеров...</div>
          ) : null}

          {parserControl ? (
            <>
              <div className={classes.summaryGrid}>
                <div className={classes.stat}>
                  <span>Глобальный статус</span>
                  <strong>{parserControl.global.enabled ? 'Включено' : 'Выключено'}</strong>
                </div>
                <div className={classes.stat}>
                  <span>Среда</span>
                  <strong>{parserControl.global.mode.toUpperCase()}</strong>
                </div>
                <div className={classes.stat}>
                  <span>Планировщик</span>
                  <strong>
                    {parserControl.global.schedulerEnabled ? 'Активен' : 'Остановлен'}
                  </strong>
                </div>
                <div className={classes.stat}>
                  <span>Исполнитель</span>
                  <strong>
                    {parserControl.global.workerEnabled ? 'Доступен' : 'Отключён на сервере'}
                  </strong>
                </div>
                <div className={classes.stat}>
                  <span>Запись доменных данных</span>
                  <strong>
                    {parserControl.global.writesDomainData ? 'Разрешена' : 'Запрещена'}
                  </strong>
                </div>
              </div>

              <div className={classes.controlToolbar}>
                <button
                  aria-pressed={parserControl.global.enabled}
                  className={`${classes.button} ${
                    parserControl.global.enabled ? classes.dangerButton : classes.secondaryButton
                  }`}
                  disabled={Boolean(parserAction)}
                  onClick={() => void handleGlobalEnabled()}
                  type='button'
                >
                  {parserAction === 'global:enabled'
                    ? 'Сохраняем...'
                    : parserControl.global.enabled
                    ? 'Выключить все'
                    : 'Включить все'}
                </button>

                <div aria-label='Режим работы парсеров' className={classes.segmentedControl}>
                  <button
                    aria-pressed={parserControl.global.mode === 'test'}
                    className={`${classes.button} ${
                      parserControl.global.mode === 'test'
                        ? classes.testModeButton
                        : classes.ghostButton
                    }`}
                    disabled={Boolean(parserAction)}
                    onClick={() => void handleGlobalMode('test')}
                    type='button'
                  >
                    TEST
                  </button>
                  <button
                    aria-pressed={parserControl.global.mode === 'prod'}
                    className={`${classes.button} ${
                      parserControl.global.mode === 'prod'
                        ? classes.dangerButton
                        : classes.ghostButton
                    }`}
                    disabled={Boolean(parserAction)}
                    onClick={() => void handleGlobalMode('prod')}
                    type='button'
                  >
                    PROD
                  </button>
                </div>

                <button
                  className={`${classes.button} ${classes.ghostButton}`}
                  disabled={parserControlLoading || Boolean(parserAction)}
                  onClick={() => void loadParserControls(true)}
                  type='button'
                >
                  {parserControlLoading ? 'Обновляем...' : 'Обновить статусы'}
                </button>
              </div>

              <div className={classes.notice}>
                <strong>TEST запрещает любые записи доменных данных на сервере.</strong> Парсеры
                могут собирать snapshot в изолированное parser storage и сохранять техническую
                историю, но импорт в FOMO выполняется только как dry run.
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section className={classes.panel}>
        <div className={classes.panelHeader}>
          <h2>Сбор данных на apiintel</h2>
          <p>
            Запускает upstream-парсер, показывает прогресс и формирует snapshot в parser DB. Импорт
            в FOMO выполняется отдельным следующим шагом.
          </p>
        </div>
        <div className={classes.panelBody}>
          {upstreamError ? <div className={classes.error}>{upstreamError}</div> : null}
          {upstreamNotice ? (
            <div aria-live='polite' className={classes.safetyNotice}>
              {upstreamNotice}
            </div>
          ) : null}

          <div className={classes.upstreamConnectionRow}>
            <div className={classes.badgeRow}>
              <span
                className={`${classes.badge} ${
                  upstreamControl?.connected ? classes.successBadge : classes.dangerBadge
                }`}
              >
                apiintel: {upstreamControl?.connected ? 'доступен' : 'нет связи'}
              </span>
              {upstreamControl?.connection.status ? (
                <span className={`${classes.badge} ${classes.neutralBadge}`}>
                  {upstreamControl.connection.status}
                </span>
              ) : null}
              {upstreamControl?.environment ? (
                <span
                  className={`${classes.badge} ${
                    upstreamControl.environmentCompatible === false
                      ? classes.dangerBadge
                      : classes.neutralBadge
                  }`}
                >
                  apiintel env={upstreamControl.environment}
                </span>
              ) : null}
            </div>
            <span className={classes.mutedText}>
              Проверено: {formatParserDate(upstreamControl?.connection.checkedAt)} · heartbeat:{' '}
              {formatParserDate(upstreamControl?.connection.heartbeatAt)}
            </span>
            <button
              className={`${classes.button} ${classes.ghostButton}`}
              disabled={upstreamLoading || Boolean(upstreamAction)}
              onClick={() => void loadUpstreamControls(true)}
              type='button'
            >
              {upstreamLoading ? 'Проверяем...' : 'Обновить'}
            </button>
          </div>

          {upstreamLoading && !upstreamControl ? (
            <div className={classes.emptyState}>Подключаемся к apiintel...</div>
          ) : null}

          {!upstreamLoading && upstreamControl && upstreamParsers.length === 0 ? (
            <div className={classes.emptyState}>apiintel не вернул доступные upstream-парсеры.</div>
          ) : null}

          <div className={classes.upstreamParserList}>
            {upstreamParsers.map((parser) => {
              const activeRun = getActiveUpstreamRun(parser)
              const snapshot = getLatestUpstreamSnapshot(parser)
              const draft = upstreamDrafts[parser.parserKey] || createUpstreamParserDraft(parser)
              const policyDirty = dirtyUpstreamPolicyDrafts.current.has(parser.parserKey)
              const selectedImportTargets = parser.importTargets.filter((target) =>
                draft.autoImportTargets.includes(target.pipelineKey),
              )
              const entityLimitBounds = getUpstreamEntityLimitBounds(parser)
              const upstreamFilters = new Set(parser.capabilities?.filters || [])
              const supportsOnlyMissing = upstreamFilters.has('onlyMissing')
              const supportsRefreshAge = upstreamFilters.has('refreshOlderThanHours')
              const progressPercent = getUpstreamProgressPercent(activeRun)
              const total = activeRun?.progress.total || activeRun?.entityLimit
              const status =
                activeRun?.status || (parser.paused ? 'paused' : parser.status) || 'idle'
              const writeAllowed = Boolean(
                parserControl?.global.mode === 'prod' && parserControl.global.writesDomainData,
              )
              const downstreamWorkerReady = Boolean(
                parserControl?.global.enabled && parserControl.global.workerEnabled,
              )
              const snapshotWriteReady = Boolean(
                isSnapshotReady(snapshot) &&
                  snapshot?.environment === 'prod' &&
                  Number(snapshot?.counts?.succeeded || snapshot?.entityCount || 0) > 0 &&
                  writeAllowed &&
                  downstreamWorkerReady,
              )
              const upstreamConfigDisabled = !upstreamControl?.connected || Boolean(upstreamAction)
              const upstreamActivationBlocked = Boolean(
                !parserControl?.global.enabled || upstreamControl?.environmentCompatible === false,
              )
              const canStart = Boolean(
                upstreamControl?.connected &&
                  parserControl?.global.enabled &&
                  upstreamControl.environmentCompatible !== false &&
                  parser.enabled &&
                  !parser.paused &&
                  parser.canStart !== false &&
                  !activeRun &&
                  !policyDirty &&
                  !upstreamAction,
              )
              const lastSuccessfulRun = upstreamControl?.runs.find(
                (run) =>
                  run.parserKey === parser.parserKey &&
                  successfulUpstreamStatuses.includes(run.status),
              )

              return (
                <article className={classes.upstreamParserCard} key={parser.parserKey}>
                  <div className={classes.parserCardHeader}>
                    <div>
                      <h3>{parser.label}</h3>
                      <code className={classes.mono}>{parser.parserKey}</code>
                    </div>
                    <div className={classes.badgeRow}>
                      <span
                        className={`${classes.badge} ${getUpstreamStatusBadgeClass(
                          status,
                          classes,
                        )}`}
                      >
                        {formatUpstreamStatus(status)}
                      </span>
                      <span className={`${classes.badge} ${classes.neutralBadge}`}>
                        source={parser.sourceType}
                      </span>
                    </div>
                  </div>

                  <p className={classes.parserDescription}>
                    {parser.description || 'Получение свежих данных и публикация snapshot.'}
                  </p>
                  {parser.capabilities?.controlGranularity?.pause ? (
                    <p className={classes.mutedText}>
                      Пауза/отмена:{' '}
                      {parser.capabilities.controlGranularity.pause === 'batch-boundary'
                        ? 'после завершения текущего batch'
                        : 'между сущностями'}
                      .
                    </p>
                  ) : null}

                  <div className={classes.parserMetaGrid}>
                    <div>
                      <span>Последний успешный сбор</span>
                      <strong>
                        {formatParserDate(
                          parser.lastSuccessAt ||
                            lastSuccessfulRun?.finishedAt ||
                            lastSuccessfulRun?.startedAt,
                        )}
                      </strong>
                    </div>
                    <div>
                      <span>Heartbeat парсера</span>
                      <strong>
                        {formatParserDate(
                          activeRun?.progress.heartbeatAt ||
                            activeRun?.heartbeatAt ||
                            parser.lastHeartbeatAt,
                        )}
                      </strong>
                    </div>
                  </div>

                  <section className={classes.upstreamConfigPanel}>
                    <div className={classes.snapshotHeader}>
                      <div>
                        <span>Конфигурация apiintel</span>
                        <strong>
                          Следующий запуск:{' '}
                          {parser.scheduleEnabled
                            ? formatParserDate(parser.nextRunAt)
                            : 'расписание выключено'}
                        </strong>
                      </div>
                    </div>
                    <div className={classes.upstreamSettingsGrid}>
                      <label className={classes.label}>
                        Лимит по умолчанию
                        <input
                          className={classes.input}
                          disabled={upstreamConfigDisabled}
                          max={entityLimitBounds.max}
                          min={entityLimitBounds.min}
                          onChange={(event) =>
                            updateUpstreamDraft(parser.parserKey, {
                              defaultEntityLimit: event.target.value,
                            })
                          }
                          step={1}
                          type='number'
                          value={draft.defaultEntityLimit}
                        />
                      </label>
                      <label className={classes.label}>
                        Интервал, минут
                        <input
                          className={classes.input}
                          disabled={upstreamConfigDisabled}
                          max={10_080}
                          min={1}
                          onChange={(event) =>
                            updateUpstreamDraft(parser.parserKey, {
                              intervalMinutes: event.target.value,
                            })
                          }
                          step={1}
                          type='number'
                          value={draft.intervalMinutes}
                        />
                      </label>
                    </div>
                    <div className={classes.parserToggleRow}>
                      <label className={classes.checkboxControl}>
                        <input
                          checked={parser.enabled}
                          disabled={
                            upstreamConfigDisabled || (!parser.enabled && upstreamActivationBlocked)
                          }
                          onChange={() =>
                            void handleUpstreamParserPatch(
                              parser,
                              { enabled: !parser.enabled },
                              'enabled',
                              parser.enabled
                                ? `Upstream-парсер «${parser.label}» выключен.`
                                : `Upstream-парсер «${parser.label}» включён.`,
                            )
                          }
                          type='checkbox'
                        />
                        Парсер {parser.enabled ? 'включён' : 'выключен'}
                      </label>
                      <label className={classes.checkboxControl}>
                        <input
                          checked={Boolean(parser.scheduleEnabled)}
                          disabled={
                            upstreamConfigDisabled ||
                            !parser.enabled ||
                            parser.paused ||
                            (!parser.scheduleEnabled && upstreamActivationBlocked)
                          }
                          onChange={() =>
                            void handleUpstreamParserPatch(
                              parser,
                              { scheduleEnabled: !parser.scheduleEnabled },
                              'schedule',
                              parser.scheduleEnabled
                                ? `Расписание «${parser.label}» выключено.`
                                : `Расписание «${parser.label}» включено.`,
                            )
                          }
                          type='checkbox'
                        />
                        Расписание {parser.scheduleEnabled ? 'включено' : 'выключено'}
                      </label>
                    </div>
                    <div className={classes.actions}>
                      <button
                        className={`${classes.button} ${classes.ghostButton}`}
                        disabled={upstreamConfigDisabled}
                        onClick={() => void handleUpstreamSettingsSave(parser)}
                        type='button'
                      >
                        {upstreamAction === `${parser.parserKey}:settings`
                          ? 'Сохраняем...'
                          : 'Сохранить настройки apiintel'}
                      </button>
                      <button
                        className={`${classes.button} ${classes.ghostButton}`}
                        disabled={
                          upstreamConfigDisabled ||
                          !parser.enabled ||
                          (Boolean(parser.paused) && upstreamActivationBlocked)
                        }
                        onClick={() =>
                          void handleUpstreamParserPatch(
                            parser,
                            { paused: !parser.paused },
                            'paused',
                            parser.paused
                              ? `Upstream-парсер «${parser.label}» возобновлён.`
                              : `Upstream-парсер «${parser.label}» поставлен на паузу.`,
                          )
                        }
                        type='button'
                      >
                        {parser.paused ? 'Снять паузу парсера' : 'Поставить парсер на паузу'}
                      </button>
                    </div>
                  </section>

                  <section className={classes.upstreamConfigPanel}>
                    <div className={classes.snapshotHeader}>
                      <div>
                        <span>Flow после нового snapshot</span>
                        <strong>
                          Локальная policy основного backend · revision{' '}
                          {parser.autoImportPolicy.revision}
                        </strong>
                      </div>
                    </div>
                    <p className={classes.mutedText}>
                      Применяется к новым ручным и плановым сборам. Каждый выбранный pipeline
                      получает тот же immutable snapshot; source проверяется сервером отдельно для
                      каждой сущности.
                    </p>
                    <div className={classes.upstreamSettingsGrid}>
                      <label className={classes.label}>
                        Автоматический импорт
                        <select
                          className={classes.input}
                          disabled={Boolean(upstreamAction)}
                          onChange={(event) =>
                            updateUpstreamPolicyDraft(parser.parserKey, {
                              autoImportMode: event.target.value as AdminUpstreamAutoImportMode,
                            })
                          }
                          value={draft.autoImportMode}
                        >
                          <option value='off'>Off · только создать snapshot</option>
                          <option value='dry-run'>Dry run всех выбранных pipeline</option>
                          <option disabled={!writeAllowed} value='write'>
                            Write {writeAllowed ? '' : '(настройка доступна только в PROD)'}
                          </option>
                        </select>
                      </label>
                    </div>
                    {parser.importTargets.length ? (
                      <div className={classes.parserToggleRow}>
                        {parser.importTargets.map((target) => (
                          <label className={classes.checkboxControl} key={target.pipelineKey}>
                            <input
                              checked={draft.autoImportTargets.includes(target.pipelineKey)}
                              disabled={Boolean(upstreamAction)}
                              onChange={(event) =>
                                updateUpstreamPolicyDraft(parser.parserKey, {
                                  autoImportTargets: event.target.checked
                                    ? Array.from(
                                        new Set([...draft.autoImportTargets, target.pipelineKey]),
                                      )
                                    : draft.autoImportTargets.filter(
                                        (pipelineKey) => pipelineKey !== target.pipelineKey,
                                      ),
                                })
                              }
                              type='checkbox'
                            />
                            {target.label}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className={classes.writeBlockedReason}>
                        Для парсера нет разрешённых downstream target’ов.
                      </p>
                    )}
                    {!writeAllowed && draft.autoImportMode === 'write' ? (
                      <p className={classes.writeBlockedReason}>
                        Сохранённый Write в TEST фактически выполняется как dry run. Изменить или
                        повторно сохранить Write-policy можно только в PROD.
                      </p>
                    ) : null}
                    {parser.autoImportPolicy.invalidReason ? (
                      <p className={classes.writeBlockedReason}>
                        Policy отключена сервером: {parser.autoImportPolicy.invalidReason}
                      </p>
                    ) : null}
                    <div className={classes.actions}>
                      <button
                        className={`${classes.button} ${classes.ghostButton}`}
                        disabled={
                          Boolean(upstreamAction) ||
                          !policyDirty ||
                          (draft.autoImportMode !== 'off' && !selectedImportTargets.length) ||
                          (draft.autoImportMode === 'write' && !writeAllowed)
                        }
                        onClick={() => void handleUpstreamPolicySave(parser)}
                        type='button'
                      >
                        {upstreamAction === `${parser.parserKey}:import-policy`
                          ? 'Сохраняем flow...'
                          : 'Сохранить flow импорта'}
                      </button>
                      <span className={classes.mutedText}>
                        Действует с: {formatParserDate(parser.autoImportPolicy.effectiveFromAt)}
                        {policyDirty ? ' · есть несохранённые изменения' : ''}
                      </span>
                    </div>
                  </section>

                  <h4 className={classes.upstreamSubheading}>Параметры следующего запуска</h4>

                  <div className={classes.upstreamSettingsGrid}>
                    <label className={classes.label}>
                      Количество сущностей
                      <input
                        className={classes.input}
                        disabled={Boolean(activeRun) || Boolean(upstreamAction)}
                        max={entityLimitBounds.max}
                        min={entityLimitBounds.min}
                        onChange={(event) =>
                          updateUpstreamDraft(parser.parserKey, {
                            entityLimit: event.target.value,
                          })
                        }
                        step={1}
                        type='number'
                        value={draft.entityLimit}
                      />
                    </label>
                    {supportsRefreshAge ? (
                      <label className={classes.label}>
                        Обновить старше, часов
                        <input
                          className={classes.input}
                          disabled={Boolean(activeRun) || Boolean(upstreamAction)}
                          max={100_000}
                          min={1}
                          onChange={(event) =>
                            updateUpstreamDraft(parser.parserKey, {
                              refreshOlderThanHours: event.target.value,
                            })
                          }
                          placeholder='Не ограничивать'
                          step={1}
                          type='number'
                          value={draft.refreshOlderThanHours}
                        />
                      </label>
                    ) : null}
                    {supportsOnlyMissing ? (
                      <label className={classes.checkboxControl}>
                        <input
                          checked={draft.onlyMissing}
                          disabled={Boolean(activeRun) || Boolean(upstreamAction)}
                          onChange={(event) =>
                            updateUpstreamDraft(parser.parserKey, {
                              onlyMissing: event.target.checked,
                            })
                          }
                          type='checkbox'
                        />
                        Только отсутствующие сущности
                      </label>
                    ) : null}
                  </div>

                  <div className={classes.actions}>
                    <button
                      className={`${classes.button} ${classes.secondaryButton}`}
                      disabled={!canStart}
                      onClick={() => void handleUpstreamStart(parser)}
                      title={
                        !upstreamControl?.connected
                          ? 'Нет связи с apiintel'
                          : !parserControl?.global.enabled
                          ? 'Глобальный режим выключен'
                          : policyDirty
                          ? 'Сначала сохраните изменения flow автоматического импорта'
                          : !parser.enabled
                          ? 'Парсер выключен в apiintel'
                          : parser.paused
                          ? 'Парсер поставлен на паузу'
                          : activeRun
                          ? 'Сбор уже выполняется'
                          : parser.status === 'environment_mismatch'
                          ? 'Среда apiintel несовместима с выбранным режимом'
                          : parser.status === 'worker_disabled'
                          ? 'Worker apiintel выключен на сервере'
                          : parser.canStart === false
                          ? 'apiintel запретил запуск; обновите статус и конфигурацию'
                          : ''
                      }
                      type='button'
                    >
                      {upstreamAction === `${parser.parserKey}:start`
                        ? 'Запускаем...'
                        : 'Запустить сбор'}
                    </button>
                    {activeRun?.status === 'running' ? (
                      <button
                        className={`${classes.button} ${classes.ghostButton}`}
                        disabled={Boolean(upstreamAction)}
                        onClick={() => void handleUpstreamRunAction(activeRun, 'pause')}
                        type='button'
                      >
                        Пауза
                      </button>
                    ) : null}
                    {activeRun?.status === 'paused' ? (
                      <button
                        className={`${classes.button} ${classes.secondaryButton}`}
                        disabled={Boolean(upstreamAction) || upstreamActivationBlocked}
                        onClick={() => void handleUpstreamRunAction(activeRun, 'resume')}
                        title={
                          upstreamActivationBlocked
                            ? 'Сначала включите глобальный режим и устраните несовпадение среды'
                            : ''
                        }
                        type='button'
                      >
                        Возобновить
                      </button>
                    ) : null}
                    {activeRun ? (
                      <button
                        className={`${classes.button} ${classes.dangerButton}`}
                        disabled={
                          Boolean(upstreamAction) || activeRun.status === 'cancel_requested'
                        }
                        onClick={() => void handleUpstreamRunAction(activeRun, 'cancel')}
                        type='button'
                      >
                        Отменить
                      </button>
                    ) : null}
                  </div>

                  {activeRun ? (
                    <section
                      aria-label='Прогресс upstream-парсера'
                      className={classes.upstreamProgress}
                    >
                      <div className={classes.upstreamProgressHeader}>
                        <strong>
                          {activeRun.progress.processed.toLocaleString('ru-RU')} /{' '}
                          {total?.toLocaleString('ru-RU') || '—'}
                        </strong>
                        <span>{progressPercent.toFixed(1)}%</span>
                      </div>
                      <div
                        aria-label={`Обработано ${progressPercent.toFixed(1)}%`}
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={progressPercent}
                        className={classes.creditProgress}
                        role='progressbar'
                      >
                        <div
                          className={classes.creditProgressFill}
                          style={{ background: '#289D63', width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className={classes.upstreamCounters}>
                        <span>Успешно: {activeRun.progress.succeeded.toLocaleString('ru-RU')}</span>
                        <span>Ошибок: {activeRun.progress.failed.toLocaleString('ru-RU')}</span>
                        <span>Пропущено: {activeRun.progress.skipped.toLocaleString('ru-RU')}</span>
                        <span>Текущая: {activeRun.progress.currentEntity || '—'}</span>
                        <span>ETA: {formatEta(activeRun)}</span>
                      </div>
                      {activeRun.stale || activeRun.status === 'stale' ? (
                        <div className={classes.error}>
                          Heartbeat устарел. Запуск помечен stale; проверьте worker apiintel.
                        </div>
                      ) : null}
                      {activeRun.error ? (
                        <div className={classes.error}>{activeRun.error}</div>
                      ) : null}
                    </section>
                  ) : null}

                  <section className={classes.snapshotPanel}>
                    <div className={classes.snapshotHeader}>
                      <div>
                        <span>Последний snapshot</span>
                        <strong className={classes.mono}>
                          {snapshot?.snapshotId || 'ещё не создан'}
                        </strong>
                      </div>
                      {snapshot ? (
                        <span
                          className={`${classes.badge} ${getUpstreamStatusBadgeClass(
                            snapshot.status,
                            classes,
                          )}`}
                        >
                          {formatUpstreamStatus(snapshot.status)}
                        </span>
                      ) : null}
                    </div>
                    {snapshot ? (
                      <p className={classes.mutedText}>
                        source={snapshot.sourceType || parser.sourceType} · env=
                        {snapshot.environment || '—'} · сущностей:{' '}
                        {snapshot.entityCount?.toLocaleString('ru-RU') || '—'} · создан:{' '}
                        {formatParserDate(snapshot.completedAt || snapshot.createdAt)}
                      </p>
                    ) : null}
                    {parser.importTargets.length ? (
                      parser.importTargets.map((target) => (
                        <div className={classes.downstreamRow} key={target.pipelineKey}>
                          <div>
                            <strong>{target.label}</strong>
                            <span>{target.pipelineKey} · импорт конкретного snapshot в FOMO</span>
                          </div>
                          <div className={classes.actionsInline}>
                            <button
                              className={`${classes.button} ${classes.secondaryButton}`}
                              disabled={
                                !isSnapshotReady(snapshot) ||
                                !downstreamWorkerReady ||
                                Boolean(upstreamAction)
                              }
                              onClick={() =>
                                snapshot && void handleSnapshotImport(snapshot, target, 'dry-run')
                              }
                              type='button'
                            >
                              Dry run
                            </button>
                            <button
                              className={`${classes.button} ${classes.dangerButton}`}
                              disabled={!snapshotWriteReady || Boolean(upstreamAction)}
                              onClick={() =>
                                snapshot && void handleSnapshotImport(snapshot, target, 'write')
                              }
                              title={
                                !downstreamWorkerReady
                                  ? 'Downstream worker основного backend выключен'
                                  : snapshot?.environment !== 'prod'
                                  ? 'Write доступен только для PROD snapshot'
                                  : Number(
                                      snapshot?.counts?.succeeded || snapshot?.entityCount || 0,
                                    ) < 1
                                  ? 'В snapshot нет успешно собранных сущностей'
                                  : writeAllowed
                                  ? ''
                                  : 'Запись доступна только в PROD'
                              }
                              type='button'
                            >
                              Write
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className={classes.writeBlockedReason}>
                        Для этого источника нет разрешённого downstream snapshot-import.
                      </p>
                    )}
                    {snapshot && !isSnapshotReady(snapshot) ? (
                      <p className={classes.writeBlockedReason}>
                        Snapshot со статусом {snapshot.status} нельзя импортировать. Для partial или
                        cancelled требуется новый успешный сбор.
                      </p>
                    ) : null}
                  </section>
                </article>
              )
            })}
          </div>

          {upstreamControl && (upstreamControl.flows.length || upstreamControl.runs.length) ? (
            <>
              <h3 className={classes.upstreamTimelineHeading}>
                История: parse → snapshot → import
              </h3>
              <div className={classes.tableWrap}>
                <table className={classes.table}>
                  <thead>
                    <tr>
                      <th>Время / Flow</th>
                      <th>Сбор apiintel</th>
                      <th>Snapshot</th>
                      <th>Импорт FOMO</th>
                      <th>Ошибка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upstreamControl.flows.length
                      ? upstreamControl.flows.slice(0, 20).map((flow) => (
                          <tr key={flow.flowId}>
                            <td>
                              {formatParserDate(flow.updatedAt || flow.createdAt)}
                              <br />
                              <code className={classes.mono}>{flow.flowId}</code>
                            </td>
                            <td>
                              {formatUpstreamStatus(flow.upstreamStatus)}
                              <br />
                              <span className={classes.mutedText}>{flow.upstreamRunId || '—'}</span>
                            </td>
                            <td>
                              {formatUpstreamStatus(flow.snapshotStatus)}
                              <br />
                              <span className={classes.mutedText}>{flow.snapshotId || '—'}</span>
                            </td>
                            <td>
                              {flow.imports.length ? (
                                flow.imports.map((item) => (
                                  <div key={item.pipelineKey}>
                                    <strong>{item.pipelineKey}</strong> ·{' '}
                                    {item.effectiveMode
                                      ? formatParserMode(item.effectiveMode)
                                      : item.requestedMode
                                      ? formatParserMode(item.requestedMode)
                                      : 'режим не задан'}{' '}
                                    · {formatUpstreamStatus(item.status || flow.importStatus)}
                                    <br />
                                    <span className={classes.mutedText}>{item.runId || '—'}</span>
                                  </div>
                                ))
                              ) : (
                                <>
                                  {flow.importMode
                                    ? formatParserMode(flow.importMode)
                                    : 'Не запущен'}{' '}
                                  · {formatUpstreamStatus(flow.importStatus)}
                                  <br />
                                  <span className={classes.mutedText}>
                                    {flow.importRunId || '—'}
                                  </span>
                                </>
                              )}
                            </td>
                            <td>{flow.error || '—'}</td>
                          </tr>
                        ))
                      : upstreamControl.runs.slice(0, 20).map((run) => (
                          <tr key={run.runId}>
                            <td>
                              {formatParserDate(run.finishedAt || run.startedAt || run.queuedAt)}
                              <br />
                              <code className={classes.mono}>{run.runId}</code>
                            </td>
                            <td>
                              {formatUpstreamStatus(run.status)} · {run.progress.processed}/
                              {run.progress.total || run.entityLimit || '—'}
                            </td>
                            <td>
                              {run.snapshot
                                ? formatUpstreamStatus(run.snapshot.status)
                                : 'Не создан'}
                              <br />
                              <span className={classes.mutedText}>
                                {run.snapshot?.snapshotId || '—'}
                              </span>
                            </td>
                            <td>
                              {run.autoImportMode && run.autoImportMode !== 'off'
                                ? formatParserMode(run.autoImportMode)
                                : 'Не запущен'}
                            </td>
                            <td>
                              {run.error ||
                                (run.status === 'partial' ? 'Частичный результат' : '—')}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section className={classes.panel}>
        <div className={classes.panelHeader}>
          <h2>Импорты в FOMO</h2>
          <p>
            Читают уже собранные данные из parser DB. Источники строго разделены по{' '}
            <code>sourceType</code>; Dropstab и ICODrops импортируются независимо.
          </p>
        </div>
        <div className={classes.panelBody}>
          {!parserControlLoading && parserGroups.length === 0 ? (
            <div className={classes.emptyState}>Сервер не вернул доступные парсеры.</div>
          ) : null}

          <div className={classes.parserSourceList}>
            {parserGroups.map(([sourceType, parsers]) => (
              <section className={classes.parserSourceGroup} key={sourceType}>
                <div className={classes.parserSourceHeader}>
                  <span>Источник</span>
                  <strong className={classes.mono}>{sourceType}</strong>
                </div>

                <div className={classes.parserCards}>
                  {parsers.map((parser) => {
                    const draft = parserDrafts[parser.parserKey]
                    const parserBusy = Boolean(parserAction)

                    return (
                      <article className={classes.parserCard} key={parser.parserKey}>
                        <div className={classes.parserCardHeader}>
                          <div>
                            <h3>{parser.label}</h3>
                            <code className={classes.mono}>{parser.parserKey}</code>
                          </div>
                          <div className={classes.badgeRow}>
                            <span
                              className={`${classes.badge} ${getParserStatusBadgeClass(
                                parser.status,
                                classes,
                              )}`}
                            >
                              {parserStatusLabels[parser.status]}
                            </span>
                            <span className={`${classes.badge} ${classes.neutralBadge}`}>
                              {parser.sourceType}
                            </span>
                          </div>
                        </div>

                        <p className={classes.parserDescription}>{parser.description}</p>

                        <div className={classes.parserMetaGrid}>
                          <div>
                            <span>Pipeline</span>
                            <strong>{parser.pipeline}</strong>
                          </div>
                          <div>
                            <span>Назначение</span>
                            <strong>{parser.target}</strong>
                          </div>
                          <div>
                            <span>Последний запуск</span>
                            <strong>{formatParserDate(parser.lastRunAt)}</strong>
                          </div>
                          <div>
                            <span>Следующий запуск</span>
                            <strong>
                              {parser.scheduleEnabled
                                ? formatParserDate(parser.nextRunAt)
                                : 'Расписание выключено'}
                            </strong>
                          </div>
                          <div>
                            <span>Последний результат</span>
                            <strong>
                              {parser.lastStatus ? parserStatusLabels[parser.lastStatus] : '—'}
                            </strong>
                          </div>
                          <div>
                            <span>Эффективный режим</span>
                            <strong>{formatParserMode(parser.effectiveScheduledMode)}</strong>
                          </div>
                        </div>

                        {parser.lastError ? (
                          <div className={classes.error}>Последняя ошибка: {parser.lastError}</div>
                        ) : null}

                        <div className={classes.parserSettingsGrid}>
                          <label className={classes.label}>
                            {parser.writeRequiresSnapshot
                              ? 'Режим аудитного расписания'
                              : 'Режим по расписанию'}
                            <select
                              className={classes.input}
                              disabled={parserBusy || !draft || parser.writeRequiresSnapshot}
                              onChange={(event) =>
                                updateParserDraft(parser, {
                                  defaultRunMode: event.target.value as AdminParserRunMode,
                                })
                              }
                              value={
                                parser.writeRequiresSnapshot
                                  ? 'dry-run'
                                  : draft?.defaultRunMode || parser.defaultRunMode
                              }
                            >
                              <option value='dry-run'>Dry run</option>
                              {!parser.writeRequiresSnapshot ? (
                                <option value='write'>Write</option>
                              ) : null}
                            </select>
                          </label>
                          <label className={classes.label}>
                            Частота, минут
                            <input
                              className={classes.input}
                              disabled={parserBusy || !draft}
                              max={10_080}
                              min={1}
                              onChange={(event) =>
                                updateParserDraft(parser, { intervalMinutes: event.target.value })
                              }
                              step={1}
                              type='number'
                              value={draft?.intervalMinutes || String(parser.intervalMinutes)}
                            />
                          </label>
                        </div>

                        <div className={classes.parserToggleRow}>
                          <label className={classes.checkboxControl}>
                            <input
                              checked={parser.scheduleEnabled}
                              disabled={
                                parserBusy ||
                                (!parser.scheduleEnabled && !parserControl?.global.enabled)
                              }
                              onChange={() =>
                                void handleParserPatch(
                                  parser,
                                  { scheduleEnabled: !parser.scheduleEnabled },
                                  'schedule',
                                  parser.scheduleEnabled
                                    ? `Расписание «${parser.label}» выключено.`
                                    : `Расписание «${parser.label}» включено.`,
                                )
                              }
                              type='checkbox'
                            />
                            {parser.writeRequiresSnapshot
                              ? 'Аудитное dry-run расписание'
                              : 'Расписание'}{' '}
                            {parser.scheduleEnabled ? 'включено' : 'выключено'}
                          </label>
                          <span className={classes.mutedText}>
                            {parser.paused
                              ? 'Новые ручные и плановые запуски на паузе; текущий завершится'
                              : 'Парсер активен'}
                          </span>
                        </div>

                        {parser.writeRequiresSnapshot ? (
                          <p className={classes.mutedText}>
                            Это расписание только проверяет текущие данные parser DB в dry run.
                            Запись разрешена исключительно кнопкой Write у конкретного complete
                            snapshot в карточке apiintel выше.
                          </p>
                        ) : null}

                        <div className={classes.actions}>
                          <button
                            className={`${classes.button} ${classes.secondaryButton}`}
                            disabled={parserBusy || !parser.canRun}
                            onClick={() => void handleParserRun(parser, 'dry-run')}
                            type='button'
                          >
                            {parserAction === `${parser.parserKey}:run`
                              ? 'Запускаем...'
                              : 'Запустить dry run'}
                          </button>
                          <button
                            className={`${classes.button} ${classes.dangerButton}`}
                            disabled={parserBusy || !parser.canRun || !parser.canWrite}
                            onClick={() => void handleParserRun(parser, 'write')}
                            title={
                              parser.canWrite ? '' : parser.writeBlockedReason || 'Запись запрещена'
                            }
                            type='button'
                          >
                            Запустить с записью
                          </button>
                          <button
                            className={`${classes.button} ${classes.ghostButton}`}
                            disabled={parserBusy || !draft}
                            onClick={() => void handleParserSettingsSave(parser)}
                            type='button'
                          >
                            {parserAction === `${parser.parserKey}:settings`
                              ? 'Сохраняем...'
                              : 'Сохранить настройки'}
                          </button>
                          <button
                            className={`${classes.button} ${classes.ghostButton}`}
                            disabled={
                              parserBusy || (parser.paused && !parserControl?.global.enabled)
                            }
                            onClick={() =>
                              void handleParserPatch(
                                parser,
                                { paused: !parser.paused },
                                'pause',
                                parser.paused
                                  ? `Парсер «${parser.label}» возобновлён.`
                                  : `Новые запуски «${parser.label}» поставлены на паузу; уже выполняющийся запуск завершится.`,
                              )
                            }
                            type='button'
                          >
                            {parser.paused ? 'Возобновить' : 'Пауза'}
                          </button>
                        </div>

                        {!parser.canWrite && parser.writeBlockedReason ? (
                          <p className={classes.writeBlockedReason}>{parser.writeBlockedReason}</p>
                        ) : null}
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className={classes.panel}>
        <div className={classes.panelHeader}>
          <h2>CoinGecko Credits</h2>
          <p>
            Monthly total for the configured API key across backend API, workers, cron jobs,
            runners, retries, and every module using it.
          </p>
        </div>
        <div className={classes.panelBody}>
          {creditUsageError ? <div className={classes.error}>{creditUsageError}</div> : null}

          {creditUsageLoading && !creditUsage ? (
            <div className={classes.emptyState}>Loading credit usage...</div>
          ) : null}

          {creditUsage && !creditUsage.available ? (
            <div className={classes.notice}>
              {creditUsage.error ||
                (creditUsage.configured
                  ? 'CoinGecko credit usage is temporarily unavailable.'
                  : 'COINGECKO_KEY is not configured.')}
            </div>
          ) : null}

          {creditUsage?.available ? (
            <>
              {creditUsage.stale ? (
                <div className={classes.notice}>
                  CoinGecko is temporarily unavailable. Showing the last successful snapshot.
                </div>
              ) : null}

              <div className={classes.summaryGrid}>
                <div className={classes.stat}>
                  <span>Used this month</span>
                  <strong>
                    {formatCredits(creditUsage.usedCredits)} /{' '}
                    {formatCredits(creditUsage.monthlyLimit)}
                  </strong>
                </div>
                <div className={classes.stat}>
                  <span>Budget remaining</span>
                  <strong>{formatCredits(creditUsage.budgetRemainingCredits)}</strong>
                </div>
                <div className={classes.stat}>
                  <span>
                    {creditUsage.recentCreditsPerHour !== null
                      ? `Recent rate (${Math.round(creditUsage.recentWindowMinutes || 0)} min)`
                      : 'Month average / hour'}
                  </span>
                  <strong>{formatCredits(displayedHourlyRate)} credits</strong>
                </div>
                <div className={classes.stat}>
                  <span>Month projection</span>
                  <strong>
                    {formatCredits(creditUsage.projectedMonthlyCredits)} ({' '}
                    {formatPercent(creditUsage.projectedBudgetUtilizationPercent)})
                  </strong>
                </div>
              </div>

              <div
                aria-label={`${formatPercent(
                  creditUsage.budgetUtilizationPercent,
                )} of the monthly CoinGecko operating budget used`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={usageProgress}
                className={classes.creditProgress}
                role='progressbar'
              >
                <div
                  className={classes.creditProgressFill}
                  style={{
                    background: usageIsHigh ? '#BA2F2F' : '#289D63',
                    width: `${usageProgress}%`,
                  }}
                />
              </div>

              <div className={classes.creditUsageMeta}>
                <span>
                  Month average: {formatCredits(creditUsage.averageCreditsPerHour)}/hour ·{' '}
                  {formatCredits(creditUsage.averageCreditsPerDay)}/day
                </span>
                <span>
                  Safe remaining pace: {formatCredits(creditUsage.remainingHourlyBudget)}/hour ·{' '}
                  {formatCredits(creditUsage.remainingDailyBudget)}/day
                </span>
                {creditUsage.recentProjectedDailyCredits !== null ? (
                  <span>
                    Recent pace: ≈{formatCredits(creditUsage.recentProjectedDailyCredits)}/day
                  </span>
                ) : null}
                <span>
                  {formatPercent(creditUsage.budgetUtilizationPercent)} of{' '}
                  {formatCredits(creditUsage.monthlyBudget)} operating budget
                </span>
                <span>
                  {creditUsage.plan || 'Unknown plan'} ·{' '}
                  {creditUsage.scope === 'api_key' ? 'API key total' : 'Account total'}
                  {` · ${formatCredits(creditUsage.remainingCredits)} plan credits remaining`}
                  {creditUsage.rateLimitPerMinute !== null
                    ? ` · ${formatCredits(creditUsage.rateLimitPerMinute)} requests/min`
                    : ''}
                </span>
              </div>
            </>
          ) : null}

          <div className={classes.actions}>
            <button
              className={`${classes.button} ${classes.ghostButton}`}
              disabled={creditUsageLoading}
              onClick={() => void loadCreditUsage()}
              type='button'
            >
              {creditUsageLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <span className={classes.mutedText}>
              Provider checked {formatDate(creditUsage?.checkedAt || null)}. Next uncached check
              after {formatDate(creditUsage?.nextRefreshAt || null)}. Server cache:{' '}
              {creditUsage ? `${Math.round(creditUsage.cacheTtlMs / 60000)} min` : '15 min'}. Recent
              rate uses two in-memory snapshots. No request-level usage records are written to the
              database.
            </span>
          </div>
        </div>
      </section>

      <section className={classes.panel}>
        <div className={classes.panelHeader}>
          <h2>Market Schedule Rebase</h2>
          <p>
            Redistribute current History and Exchanges schedules across their configured HOT, WARM,
            and COLD intervals.
          </p>
        </div>
        <div className={classes.panelBody}>
          <div className={classes.notice}>
            Preview is read-only. Apply writes only <code>historyDueAt</code>
            {' and '}
            <code>exchangesDueAt</code> on active, unlocked production schedule records. Project and
            market data are not changed or deleted.
          </div>

          {scheduleRebaseError ? <div className={classes.error}>{scheduleRebaseError}</div> : null}

          {scheduleRebaseNotice ? (
            <div className={classes.safetyNotice}>{scheduleRebaseNotice}</div>
          ) : null}

          {scheduleRebase ? (
            <>
              <div className={classes.summaryGrid}>
                <div className={classes.stat}>
                  <span>Status</span>
                  <strong>{scheduleRebase.dryRun ? 'Dry-run preview' : 'Applied'}</strong>
                </div>
                <div className={classes.stat}>
                  <span>Eligible schedules</span>
                  <strong>{scheduleRebase.counts.eligible.toLocaleString('en-US')}</strong>
                </div>
                <div className={classes.stat}>
                  <span>{scheduleRebase.dryRun ? 'Planned changes' : 'Modified schedules'}</span>
                  <strong>
                    {(scheduleRebase.dryRun
                      ? scheduleRebase.counts.planned
                      : scheduleRebase.counts.modified
                    ).toLocaleString('en-US')}
                  </strong>
                </div>
                <div className={classes.stat}>
                  <span>Locked schedules skipped</span>
                  <strong>{scheduleRebase.counts.skippedLocked.toLocaleString('en-US')}</strong>
                </div>
              </div>

              {scheduleRebase.latestCadence ? (
                <>
                  <h3 className={classes.subheading}>Latest market data cadence</h3>
                  <div className={classes.notice}>
                    HOT-WARM is a Latest-only band for ranks{' '}
                    {scheduleRebase.latestCadence.hotWarmRankRange.minRank.toLocaleString('en-US')}–
                    {scheduleRebase.latestCadence.hotWarmRankRange.maxRank.toLocaleString('en-US')}.
                    History and Exchanges continue to use the regular WARM tier.
                  </div>
                  <div className={classes.tableWrap}>
                    <table className={classes.table}>
                      <thead>
                        <tr>
                          <th>Latest cadence</th>
                          <th>Active projects</th>
                          <th>Interval</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marketLatestCadences.map((cadence) => (
                          <tr key={cadence}>
                            <td>
                              {cadence}
                              {cadence === 'HOT_WARM' && !scheduleRebase.latestCadence?.enabled
                                ? ' (disabled)'
                                : ''}
                            </td>
                            <td>
                              {scheduleRebase.latestCadence?.byCadence[
                                cadence
                              ].projects.toLocaleString('en-US')}
                            </td>
                            <td>
                              {formatIntervalMs(
                                scheduleRebase.latestCadence?.byCadence[cadence].intervalMs || 0,
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}

              <h3 className={classes.subheading}>History and Exchanges tiers</h3>
              <div className={classes.tableWrap}>
                <table className={classes.table}>
                  <thead>
                    <tr>
                      <th>Tier</th>
                      <th>Eligible</th>
                      <th>{scheduleRebase.dryRun ? 'Planned' : 'Modified'}</th>
                      <th>Locked skipped</th>
                      <th>History interval</th>
                      <th>Exchanges interval</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketScheduleTiers.map((tier) => (
                      <tr key={tier}>
                        <td>{tier}</td>
                        <td>
                          {scheduleRebase.byTier[tier].counts.eligible.toLocaleString('en-US')}
                        </td>
                        <td>
                          {(scheduleRebase.dryRun
                            ? scheduleRebase.byTier[tier].counts.planned
                            : scheduleRebase.byTier[tier].counts.modified
                          ).toLocaleString('en-US')}
                        </td>
                        <td>
                          {scheduleRebase.byTier[tier].counts.skippedLocked.toLocaleString('en-US')}
                        </td>
                        <td>{formatIntervalMs(scheduleRebase.intervalsMs.history[tier])}</td>
                        <td>{formatIntervalMs(scheduleRebase.intervalsMs.exchanges[tier])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className={classes.mutedText}>
                Snapshot generated {formatDate(scheduleRebase.generatedAt)}. Intervals are read from
                the backend API process; verify that the market worker uses the same values before
                applying.
              </p>

              {scheduleRebase.dryRun && scheduleRebase.counts.planned > 0 ? (
                <div className={classes.activePromotion}>
                  <h3 className={classes.subheading}>Confirm schedule update</h3>
                  <p className={classes.mutedText}>
                    Type <code>{scheduleRebase.confirmationRequired}</code> to apply this operation.
                    The server recalculates eligibility again when applying.
                  </p>
                  <label className={classes.label}>
                    Confirmation phrase
                    <input
                      autoComplete='off'
                      className={classes.input}
                      onChange={(event) => setScheduleRebaseConfirmation(event.target.value)}
                      spellCheck={false}
                      type='text'
                      value={scheduleRebaseConfirmation}
                    />
                  </label>
                  <div className={classes.actions}>
                    <button
                      className={`${classes.button} ${classes.dangerButton}`}
                      disabled={
                        scheduleRebaseLoading ||
                        scheduleRebaseConfirmation !== scheduleRebase.confirmationRequired
                      }
                      onClick={() => void applyScheduleRebase()}
                      type='button'
                    >
                      {scheduleRebaseLoading ? 'Applying...' : 'Apply schedule rebase'}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          <div className={classes.actions}>
            <button
              className={`${classes.button} ${classes.ghostButton}`}
              disabled={scheduleRebaseLoading}
              onClick={() => void previewScheduleRebase()}
              type='button'
            >
              {scheduleRebaseLoading ? 'Checking...' : 'Preview schedule rebase'}
            </button>
          </div>
        </div>
      </section>

      <section className={classes.panel}>
        <div className={classes.panelHeader}>
          <h2>История импортов в FOMO</h2>
          <p>
            Ручные и плановые импорты из parser DB с запрошенным и фактически применённым режимом.
          </p>
        </div>
        <div className={classes.panelBody}>
          <div className={classes.tableWrap}>
            <table className={classes.table}>
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Парсер / источник</th>
                  <th>Запуск</th>
                  <th>Режим</th>
                  <th>Статус</th>
                  <th>Результат</th>
                </tr>
              </thead>
              <tbody>
                {(parserControl?.recentRuns || []).map((run) => (
                  <tr key={run._id}>
                    <td>{formatParserDate(run.startedAt || run.queuedAt)}</td>
                    <td>
                      <strong>{run.parserKey}</strong>
                      <br />
                      <span className={classes.mutedText}>{run.sourceType}</span>
                    </td>
                    <td>{run.trigger === 'manual' ? 'Ручной' : 'Расписание'}</td>
                    <td>
                      {formatParserMode(run.requestedMode)} → {formatParserMode(run.effectiveMode)}
                      <br />
                      <span className={classes.mutedText}>
                        {run.writesDomainData ? 'с записью данных' : 'без записи данных'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${classes.badge} ${getParserStatusBadgeClass(
                          run.status,
                          classes,
                        )}`}
                      >
                        {parserStatusLabels[run.status]}
                      </span>
                      {['running', 'recovering'].includes(run.status) &&
                      formatParserProgress(run) ? (
                        <>
                          <br />
                          <span className={classes.mutedText}>{formatParserProgress(run)}</span>
                        </>
                      ) : null}
                      {(run.attempt || 0) > 1 ? (
                        <>
                          <br />
                          <span className={classes.mutedText}>Попытка {run.attempt}</span>
                        </>
                      ) : null}
                    </td>
                    <td>
                      {run.error || run.policyReason ? (
                        run.error || run.policyReason
                      ) : run.summary ? (
                        <details className={classes.runSummaryDetails}>
                          <summary>{formatParserRunSummary(run.summary)}</summary>
                          {formatMaterializationSummary(run.summary) ? (
                            <p className={classes.mutedText}>
                              {formatMaterializationSummary(run.summary)}
                            </p>
                          ) : null}
                          <pre className={classes.jsonBlock}>
                            {JSON.stringify(run.summary, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
                {!parserControlLoading && (parserControl?.recentRuns || []).length === 0 ? (
                  <tr>
                    <td colSpan={6}>Запусков пока нет.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className={classes.panel}>
        <div className={classes.panelHeader}>
          <h2>Pipeline Flow</h2>
          <p>How parser output reaches production through reviewed stages.</p>
        </div>
        <div className={classes.panelBody}>
          <div className={classes.pipeline}>
            {pipelineSteps.map((step, index) => (
              <React.Fragment key={step}>
                <div className={classes.pipelineStep}>{step}</div>
                {index < pipelineSteps.length - 1 ? (
                  <div className={classes.pipelineArrow}>-&gt;</div>
                ) : null}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      <div className={classes.safetyNotice}>
        TEST принудительно переводит каждый импорт в dry run независимо от настройки конкретного
        парсера. PROD разрешает запись только когда сервер возвращает <code>canWrite=true</code>.
        Статусы и техническая история запусков сохраняются в обоих режимах.
      </div>
    </section>
  )
}

export default ParsingManager
