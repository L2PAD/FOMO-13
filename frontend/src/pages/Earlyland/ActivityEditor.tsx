import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useHistory, useParams } from 'react-router-dom';
import ActivityTasksSection from './ActivityTasksSection';
import Layout from '../../components/layouts/main_layout/layout';
import Loader from '../../components/common/loader';
import Switch from '../../components/common/switch';
import loader from '../../components/services/loader';
import ActivityRichTextEditor from './ActivityRichTextEditor';
import ActivityAiReviewModal from './ActivityAiReviewModal';
import { AdminSelect } from '../AdminRating/AdminControls';
import {
  buildActivityAiReviewItems,
  getDefaultActivityAiPaths,
} from './activityAiReview';
import {
  applyFomoV2ActivityAiReview,
  approveFomoV2Activity,
  fetchFomoV2Activity,
  FomoV2ActivityAiChange,
  FomoV2ActivityAiProposal,
  FomoV2ActivityScore,
  FomoV2ActivityStep,
  FomoV2AdminActivity,
  generateFomoV2ActivityAiReview,
  getFomoV2ActivityKey,
  hideFomoV2Activity,
  noMatchFomoV2ActivityCanonical,
  publishFomoV2Activity,
  rejectFomoV2Activity,
  rejectFomoV2ActivityAiReview,
  rejectFomoV2ActivityCanonical,
  resolveFomoV2ActivityCanonical,
  unhideFomoV2Activity,
  updateFomoV2Activity,
  verifyFomoV2ActivityCanonical,
} from '../../components/services/fomoV2Activities';
import {
  ActionBar,
  ActionBarActions,
  ActionBarDivider,
  ActionBarStatus,
  ActionButton,
  AdvancedBody,
  AdvancedDetails,
  AdvancedSummary,
  AdvancedSummaryHint,
  AiAssistantActions,
  AiAssistantHero,
  AiAssistantIcon,
  AiAssistantTitle,
  AiReviewButton,
  BackButton,
  CandidateCard,
  CandidateMeta,
  CandidateTitle,
  EditorColumn,
  EditorGrid,
  EditorHeader,
  EditorHeaderActions,
  EditorHeaderTop,
  EditorIdentity,
  EditorLogo,
  EditorExternalLink,
  EditorStatusRow,
  EditorSummaryGrid,
  EditorSummaryItem,
  EditorSummaryLabel,
  EditorSummaryValue,
  EditorTitleRow,
  EditorSectionStack,
  EditorWorkspace,
  ErrorText,
  Field,
  FieldLabel,
  FieldsGrid,
  InlineRow,
  Input,
  JsonError,
  MutedText,
  PageSubtitle,
  PageTitle,
  PageWrapper,
  ProjectMeta,
  SectionCard,
  SectionHeader,
  SectionHero,
  SectionHeroIndex,
  SectionHeroKicker,
  SectionHeroTitle,
  SectionHint,
  SectionNavigation,
  SectionNavigationButton,
  SectionNavigationCaption,
  SectionNavigationHint,
  SectionNavigationIndex,
  SectionNavigationText,
  SectionPager,
  SectionPagerActions,
  SectionPagerStatus,
  SectionTitle,
  Select,
  SmallButton,
  StatusBadge,
  StepCard,
  Textarea,
  ToggleRow,
} from './ActivitiesStyles';

interface RouteParams { id: string }

interface JsonDrafts {
  rewards: string;
  links: string;
  videoGuides: string;
  relatedAssets: string;
  investors: string;
  timeline: string;
}

const emptyActivity = (): FomoV2AdminActivity => ({
  description: {},
  socialLinks: {},
  review: { scores: [] },
  metrics: {},
  flags: { green: [], yellow: [], red: [] },
  taskGuide: { steps: [] },
  rewards: [],
  links: [],
  videoGuides: [],
  relatedAssets: [],
  investors: [],
  timeline: [],
  tags: [],
  ecosystem: [],
  platform: [],
  requirements: [],
  accessTier: 'public',
  isSponsored: false,
  sponsoredPriority: 0,
});

const normalizeLifecycle = (value?: string): string => {
  const normalized = String(value || '').toLowerCase();
  if (['live', 'active'].includes(normalized)) return 'active';
  if (['cancelled', 'canceled'].includes(normalized)) return 'cancelled';
  if (['upcoming', 'ended'].includes(normalized)) return normalized;
  return normalized || 'upcoming';
};

const hydrateActivity = (activity: FomoV2AdminActivity): FomoV2AdminActivity => ({
  ...emptyActivity(),
  ...activity,
  lifecycleStatus: normalizeLifecycle(activity.lifecycleStatus || activity.status),
  accessTier: String(activity.accessTier || (activity.nftRequired ? 'prime' : 'public')).toLowerCase(),
  difficulty: activity.difficulty ? String(activity.difficulty).toLowerCase() : '',
  taskFrequency: activity.taskFrequency ? String(activity.taskFrequency).toLowerCase() : '',
  description: { ...emptyActivity().description, ...(activity.description || {}) },
  socialLinks: { ...emptyActivity().socialLinks, ...(activity.socialLinks || {}) },
  review: {
    ...emptyActivity().review,
    ...(activity.review || {}),
    scores: Array.isArray(activity.review?.scores) ? activity.review?.scores : [],
  },
  metrics: { ...emptyActivity().metrics, ...(activity.metrics || {}) },
  flags: {
    green: activity.flags?.green || [],
    yellow: activity.flags?.yellow || [],
    red: activity.flags?.red || [],
  },
  taskGuide: {
    ...emptyActivity().taskGuide,
    ...(activity.taskGuide || {}),
    steps: Array.isArray(activity.taskGuide?.steps) ? activity.taskGuide?.steps : [],
  },
  rewards: Array.isArray(activity.rewards) ? activity.rewards : [],
  links: Array.isArray(activity.links) ? activity.links : [],
  videoGuides: Array.isArray(activity.videoGuides) ? activity.videoGuides : [],
  relatedAssets: Array.isArray(activity.relatedAssets) ? activity.relatedAssets : [],
  investors: Array.isArray(activity.investors) ? activity.investors : [],
  timeline: Array.isArray(activity.timeline) ? activity.timeline : [],
  tags: Array.isArray(activity.tags) ? activity.tags : [],
  ecosystem: Array.isArray(activity.ecosystem) ? activity.ecosystem : [],
  platform: Array.isArray(activity.platform) ? activity.platform : [],
  requirements: Array.isArray(activity.requirements) ? activity.requirements : [],
});

const toDateInput = (value?: string | null): string => {
  if (!value) return '';
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  if (iso) return iso[1];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const plainTextToEditorHtml = (value?: string): string => {
  const text = String(value || '').trim();
  if (!text) return '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br />')}</p>`)
    .join('');
};

const richEditorValue = (html?: string, plainText?: string): string => {
  const htmlValue = String(html || '');
  return htmlValue.trim() ? htmlValue : plainTextToEditorHtml(plainText);
};

const formatSummaryDate = (
  value?: string | number | null,
  approximate?: string | null,
): string => {
  if (value) {
    const dateOnly = typeof value === 'string'
      ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
      : null;
    const date = dateOnly
      ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
      : new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  }
  return approximate || 'Не задано';
};

const lines = (value?: string[]): string => (value || []).join('\n');
const fromLines = (value: string): string[] => value.split('\n').map((item) => item.trim()).filter(Boolean);

type EditorSectionId = 'overview' | 'schedule' | 'content' | 'guide' | 'review';

const editorSections: Array<{
  id: EditorSectionId;
  label: string;
  hint: string;
}> = [
  { id: 'overview', label: 'Основное', hint: 'Идентификация и видимость' },
  { id: 'schedule', label: 'Сроки и награды', hint: 'Тайминг и стимулы' },
  { id: 'content', label: 'Контент', hint: 'Тексты, ссылки и данные' },
  { id: 'guide', label: 'Гайд по заданию', hint: 'Шаги и выполнение' },
  { id: 'review', label: 'FOMO Review', hint: 'Качество и риск' },
];

const titleOf = (activity: FomoV2AdminActivity): string => (
  activity.projectName || activity.name || activity.coinName || 'Активность'
);

const STATUS_RU: Record<string, string> = {
  ingested: 'Импортировано',
  pending_ai: 'Ожидает AI',
  pending_human: 'На проверке',
  needs_changes: 'Нужны правки',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  draft: 'Черновик',
  published: 'Опубликовано',
  hidden: 'Скрыто',
  archived: 'Архив',
  public: 'Public',
  prime: 'Prime',
  upcoming: 'Скоро',
  active: 'Активно',
  ended: 'Завершено',
  cancelled: 'Отменено',
  unprocessed: 'Не обработано',
  proposed: 'Предложено',
  verified: 'Подтверждено',
  conflict: 'Конфликт',
  no_candidates: 'Нет кандидатов',
  ai_ready: 'Готово для AI',
  'not set': 'Не задано',
};

const prettyStatus = (value?: string | null): string => {
  const key = String(value || 'not set');
  return STATUS_RU[key] || key.replace(/_/g, ' ');
};

const toneFor = (value?: string | null): string => {
  const normalized = String(value || '').toLowerCase();
  if (['approved', 'published', 'verified', 'public'].includes(normalized)) return 'green';
  if (['rejected', 'hidden', 'conflict', 'archived'].includes(normalized)) return 'red';
  if (['pending_human', 'needs_changes', 'pending_ai', 'proposed'].includes(normalized)) return 'yellow';
  if (['prime', 'ai_ready', 'draft'].includes(normalized)) return 'blue';
  return 'gray';
};

const getAtPath = (source: unknown, path: string): unknown => {
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  return keys.reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);
};

const flattenProposal = (
  source: Record<string, unknown>,
  current: FomoV2AdminActivity,
  prefix = '',
): FomoV2ActivityAiChange[] => Object.entries(source).flatMap(([key, value]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return flattenProposal(value as Record<string, unknown>, current, path);
  }
  return [{ path, currentValue: getAtPath(current, path), proposedValue: value }];
});

const getAiProposal = (activity: FomoV2AdminActivity): FomoV2ActivityAiProposal | null => {
  const proposal = activity.aiProposal || activity.aiReview;
  if (proposal) return proposal;
  const editorial = activity.editorial as { aiProposal?: FomoV2ActivityAiProposal } | undefined;
  return editorial?.aiProposal || null;
};

const getAiChanges = (
  activity: FomoV2AdminActivity,
  proposal: FomoV2ActivityAiProposal | null,
): FomoV2ActivityAiChange[] => {
  if (Array.isArray(proposal?.changes)) return proposal?.changes || [];
  if (proposal?.proposal && typeof proposal.proposal === 'object') {
    return flattenProposal(proposal.proposal, activity);
  }
  return [];
};

const getCandidates = (activity: FomoV2AdminActivity) => {
  if (Array.isArray(activity.canonicalCandidates)) return activity.canonicalCandidates;
  if (Array.isArray(activity.candidates)) return activity.candidates;
  const canonical = activity.canonical as { candidates?: FomoV2AdminActivity['canonicalCandidates'] } | undefined;
  return Array.isArray(canonical?.candidates) ? canonical?.candidates || [] : [];
};

const getCanonicalProjectId = (activity: FomoV2AdminActivity): string => {
  if (activity.canonicalProjectId) return String(activity.canonicalProjectId);
  const canonical = activity.canonical as { canonicalProjectId?: string } | undefined;
  return canonical?.canonicalProjectId || '';
};

const parseNumberOrNull = (value: unknown): number | null => {
  if (value === '' || value === undefined || value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const parseJsonArray = <T,>(value: string, label: string): T[] => {
  const parsed = JSON.parse(value || '[]') as unknown;
  if (!Array.isArray(parsed)) throw new Error(`${label} JSON must be an array`);
  return parsed as T[];
};

const buildPayload = (
  draft: FomoV2AdminActivity,
  jsonDrafts: JsonDrafts,
): Record<string, unknown> => {
  const rewards = parseJsonArray<unknown>(jsonDrafts.rewards, 'Rewards');
  const links = parseJsonArray<{ label: string; url: string }>(jsonDrafts.links, 'Links');
  const videoGuides = parseJsonArray<string>(jsonDrafts.videoGuides, 'Video guides');
  const relatedAssets = parseJsonArray<Record<string, unknown>>(jsonDrafts.relatedAssets, 'Related assets');
  const investors = parseJsonArray<Record<string, unknown>>(jsonDrafts.investors, 'Investors');
  const timeline = parseJsonArray<Record<string, unknown>>(jsonDrafts.timeline, 'Timeline');

  const currentDraft = {
    ...(draft.currentDraft || {}),
    name: draft.name || '',
    projectName: draft.projectName || '',
    symbol: draft.symbol || draft.coinSymbol || '',
    logo: draft.logo || '',
    projectLogo: draft.projectLogo || '',
    activityType: draft.activityType || '',
    category: draft.category || '',
    ...(draft.difficulty ? { difficulty: String(draft.difficulty).toLowerCase() } : { difficulty: undefined }),
    score: draft.score || '',
    cost: draft.cost || '',
    timeEstimate: draft.timeEstimate || '',
    ...(draft.taskFrequency ? { taskFrequency: String(draft.taskFrequency).toLowerCase() } : { taskFrequency: undefined }),
    isHot: Boolean(draft.isHot),
    startDate: draft.startDate || null,
    endDate: draft.endDate || null,
    approxStartDate: draft.approxStartDate || undefined,
    approxEndDate: draft.approxEndDate || undefined,
    timezone: draft.timezone || undefined,
    rewardLabel: draft.rewardLabel || '',
    rewardAmount: parseNumberOrNull(draft.rewardAmount),
    rewardSupply: parseNumberOrNull(draft.rewardSupply),
    rewardDistribution: draft.rewardDistribution || undefined,
    rewardDistributionApprox: draft.rewardDistributionApprox || undefined,
    participants: parseNumberOrNull(draft.participants),
    fundsRaised: parseNumberOrNull(draft.fundsRaised),
    rewards,
    videoGuides,
    relatedAssets,
    investors,
    timeline,
    tags: draft.tags || [],
    ecosystem: draft.ecosystem || [],
    platform: draft.platform || [],
    requirements: draft.requirements || [],
    description: draft.description || {},
    joinLink: draft.joinLink || '',
    links,
    socialLinks: draft.socialLinks || {},
    review: draft.review || {},
    metrics: draft.metrics || {},
    flags: draft.flags || {},
    taskGuide: draft.taskGuide || {},
  };

  return {
    ...(Number.isFinite(Number(draft.revision)) ? { expectedRevision: Number(draft.revision) } : {}),
    slug: draft.slug || '',
    lifecycleStatus: draft.lifecycleStatus,
    accessTier: draft.accessTier || 'public',
    isSponsored: Boolean(draft.isSponsored),
    sponsoredPriority: Number.isFinite(Number(draft.sponsoredPriority))
      ? Math.trunc(Number(draft.sponsoredPriority))
      : 0,
    currentDraft,
  };
};

const ActivityEditorPage = () => {
  const history = useHistory();
  const { id } = useParams<RouteParams>();
  const [activity, setActivity] = useState<FomoV2AdminActivity | null>(null);
  const [draft, setDraft] = useState<FomoV2AdminActivity>(emptyActivity());
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState('');
  const [error, setError] = useState('');
  const [manualCanonicalId, setManualCanonicalId] = useState('');
  const [jsonDrafts, setJsonDrafts] = useState<JsonDrafts>({
    rewards: '[]',
    links: '[]',
    videoGuides: '[]',
    relatedAssets: '[]',
    investors: '[]',
    timeline: '[]',
  });
  const [jsonError, setJsonError] = useState('');
  const [selectedAiPaths, setSelectedAiPaths] = useState<string[]>([]);
  const [activeEditorSection, setActiveEditorSection] = useState<EditorSectionId>('overview');
  const [isAiReviewOpen, setIsAiReviewOpen] = useState(false);

  const acceptActivity = useCallback((next: FomoV2AdminActivity) => {
    const hydrated = hydrateActivity(next);
    setActivity(hydrated);
    setDraft(hydrated);
    setManualCanonicalId(getCanonicalProjectId(hydrated));
    setJsonDrafts({
      rewards: JSON.stringify(hydrated.rewards || [], null, 2),
      links: JSON.stringify(hydrated.links || [], null, 2),
      videoGuides: JSON.stringify(hydrated.videoGuides || [], null, 2),
      relatedAssets: JSON.stringify(hydrated.relatedAssets || [], null, 2),
      investors: JSON.stringify(hydrated.investors || [], null, 2),
      timeline: JSON.stringify(hydrated.timeline || [], null, 2),
    });
    setJsonError('');
  }, []);

  const loadActivity = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      acceptActivity(await fetchFomoV2Activity(id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load activity');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [acceptActivity, id]);

  useEffect(() => { loadActivity(); }, [loadActivity]);

  const aiProposal = useMemo(() => getAiProposal(draft), [draft]);
  const aiChanges = useMemo(() => getAiChanges(draft, aiProposal), [aiProposal, draft]);
  const aiReviewItems = useMemo(() => buildActivityAiReviewItems(aiChanges), [aiChanges]);

  useEffect(() => {
    setSelectedAiPaths(getDefaultActivityAiPaths(aiReviewItems));
  }, [aiProposal?.id, aiProposal?.generatedAt, aiReviewItems]);

  const isDirty = useMemo(() => {
    if (!activity) return false;
    const comparableDraft = {
      ...draft,
      rewards: undefined,
      links: undefined,
      videoGuides: undefined,
      relatedAssets: undefined,
      investors: undefined,
      timeline: undefined,
    };
    const comparableActivity = {
      ...activity,
      rewards: undefined,
      links: undefined,
      videoGuides: undefined,
      relatedAssets: undefined,
      investors: undefined,
      timeline: undefined,
    };
    return JSON.stringify(comparableDraft) !== JSON.stringify(comparableActivity)
      || jsonDrafts.rewards !== JSON.stringify(activity.rewards || [], null, 2)
      || jsonDrafts.links !== JSON.stringify(activity.links || [], null, 2)
      || jsonDrafts.videoGuides !== JSON.stringify(activity.videoGuides || [], null, 2)
      || jsonDrafts.relatedAssets !== JSON.stringify(activity.relatedAssets || [], null, 2)
      || jsonDrafts.investors !== JSON.stringify(activity.investors || [], null, 2)
      || jsonDrafts.timeline !== JSON.stringify(activity.timeline || [], null, 2);
  }, [activity, draft, jsonDrafts]);

  const setTop = (key: keyof FomoV2AdminActivity, value: unknown) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const setDescriptionRich = (
    htmlKey: 'aboutHtml' | 'howToParticipateHtml',
    textKey: 'about' | 'howToParticipate',
    html: string,
    plainText: string,
  ) => {
    setDraft((current) => ({
      ...current,
      description: {
        ...(current.description || {}),
        [htmlKey]: html,
        [textKey]: plainText,
      },
    }));
  };

  const setSocial = (key: string, value: unknown) => {
    setDraft((current) => ({ ...current, socialLinks: { ...(current.socialLinks || {}), [key]: value } }));
  };

  const setReview = (key: string, value: unknown) => {
    setDraft((current) => ({ ...current, review: { ...(current.review || {}), [key]: value } }));
  };

  const setMetric = (key: string, value: unknown) => {
    setDraft((current) => ({ ...current, metrics: { ...(current.metrics || {}), [key]: value } }));
  };

  const setGuide = (key: string, value: unknown) => {
    setDraft((current) => ({ ...current, taskGuide: { ...(current.taskGuide || {}), [key]: value } }));
  };

  const persistDraft = async (): Promise<FomoV2AdminActivity> => {
    setJsonError('');
    let payload: Record<string, unknown>;
    try {
      payload = buildPayload(draft, jsonDrafts);
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : 'Invalid JSON';
      setJsonError(message);
      throw parseError;
    }
    const saved = await updateFomoV2Activity(id, payload);
    if (getFomoV2ActivityKey(saved)) {
      acceptActivity(saved);
      return saved;
    }
    const refreshed = await fetchFomoV2Activity(id);
    acceptActivity(refreshed);
    return refreshed;
  };

  const save = async () => {
    setBusyAction('Сохранение');
    setError('');
    try {
      await persistDraft();
      toast.success('Черновик сохранён');
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Не удалось сохранить черновик';
      setError(message);
      toast.error(message);
    } finally {
      setBusyAction('');
    }
  };

  const runAction = async (
    name: string,
    action: (activityId: string, payload: Record<string, unknown>) => Promise<FomoV2AdminActivity>,
    options: { saveFirst?: boolean; askNote?: boolean; confirm?: string } = {},
  ): Promise<FomoV2AdminActivity | null> => {
    if (options.confirm && !window.confirm(options.confirm)) return null;
    const note = options.askNote ? window.prompt('Комментарий к решению (необязательно)', '') || undefined : undefined;
    setBusyAction(name);
    setError('');
    try {
      const current = options.saveFirst && isDirty ? await persistDraft() : draft;
      const result = await action(id, {
        ...(Number.isFinite(Number(current.revision)) ? { expectedRevision: Number(current.revision) } : {}),
        ...(note ? { reason: note } : {}),
      });
      if (getFomoV2ActivityKey(result)) acceptActivity(result);
      else await loadActivity(false);
      toast.success('Готово');
      return result;
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка операции';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setBusyAction('');
    }
  };

  const runCanonical = async (
    name: string,
    action: (activityId: string, payload: Record<string, unknown>) => Promise<FomoV2AdminActivity>,
    payload: Record<string, unknown>,
  ) => {
    setBusyAction(name);
    setError('');
    try {
      const current = isDirty ? await persistDraft() : draft;
      await action(id, {
        ...payload,
        ...(Number.isFinite(Number(current.revision)) ? { expectedRevision: Number(current.revision) } : {}),
      });
      // Canonical actions return the updated activity row, but only the detail
      // endpoint enriches candidate/project labels used by this editor.
      await loadActivity(false);
      toast.success('Готово');
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка операции';
      setError(message);
      toast.error(message);
    } finally {
      setBusyAction('');
    }
  };

  const generateAi = async () => {
    setBusyAction('Генерация AI');
    setError('');
    try {
      const current = isDirty ? await persistDraft() : draft;
      const result = await generateFomoV2ActivityAiReview(id, {
        ...(Number.isFinite(Number(current.revision)) ? { expectedRevision: Number(current.revision) } : {}),
      });
      if (getFomoV2ActivityKey(result)) acceptActivity(result);
      else await loadActivity(false);
      setIsAiReviewOpen(true);
      toast.success('AI-предложение сформировано');
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Не удалось сгенерировать AI-обзор';
      setError(message);
      toast.error(message);
    } finally {
      setBusyAction('');
    }
  };

  const applyAi = async (): Promise<boolean> => {
    if (!selectedAiPaths.length) return false;
    if (isDirty) {
      const message = 'Сначала сохраните или отмените ручные правки, затем применяйте AI-предложение';
      setError(message);
      toast.error(message);
      return false;
    }
    const proposalId = aiProposal?.proposalId || aiProposal?.id;
    if (!proposalId) {
      setError('У активного AI-предложения нет proposalId');
      return false;
    }
    setBusyAction('Применение AI');
    setError('');
    try {
      const result = await applyFomoV2ActivityAiReview(id, {
        proposalId,
        paths: Array.from(new Set(selectedAiPaths)),
        ...(Number.isFinite(Number(draft.revision)) ? { expectedRevision: Number(draft.revision) } : {}),
      });
      if (getFomoV2ActivityKey(result)) acceptActivity(result);
      else await loadActivity(false);
      setIsAiReviewOpen(false);
      toast.success('Выбранные AI-поля применены');
      return true;
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Не удалось применить AI-поля';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setBusyAction('');
    }
  };

  const rejectAi = async (reason?: string): Promise<boolean> => {
    if (isDirty) {
      const message = 'Сначала сохраните или отмените ручные правки, затем отклоняйте AI-предложение';
      setError(message);
      toast.error(message);
      return false;
    }
    const proposalId = aiProposal?.proposalId || aiProposal?.id;
    if (!proposalId) return false;
    setBusyAction('Отклонение AI');
    setError('');
    try {
      const result = await rejectFomoV2ActivityAiReview(id, {
        proposalId,
        ...(Number.isFinite(Number(draft.revision)) ? { expectedRevision: Number(draft.revision) } : {}),
        ...(reason ? { reason } : {}),
      });
      if (getFomoV2ActivityKey(result)) acceptActivity(result);
      else await loadActivity(false);
      setIsAiReviewOpen(false);
      toast.success('AI-предложение отклонено');
      return true;
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Не удалось отклонить AI-предложение';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setBusyAction('');
    }
  };

  const updateScore = (index: number, patch: Partial<FomoV2ActivityScore>) => {
    const scores = [...(draft.review?.scores || [])];
    scores[index] = { ...scores[index], ...patch };
    setReview('scores', scores);
  };

  const updateStep = (index: number, patch: Partial<FomoV2ActivityStep>) => {
    setDraft((current) => {
      const steps = [...(current.taskGuide?.steps || [])];
      steps[index] = { ...steps[index], ...patch };
      return {
        ...current,
        taskGuide: { ...(current.taskGuide || {}), steps },
      };
    });
  };

  const moveStep = (index: number, dir: number) => {
    setDraft((current) => {
      const steps = [...(current.taskGuide?.steps || [])];
      const target = index + dir;
      if (target < 0 || target >= steps.length) return current;
      [steps[index], steps[target]] = [steps[target], steps[index]];
      return { ...current, taskGuide: { ...(current.taskGuide || {}), steps } };
    });
  };

  const selectEditorSection = (sectionId: EditorSectionId) => {
    setActiveEditorSection(sectionId);
    window.requestAnimationFrame(() => {
      document.getElementById('activity-editor-workspace')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  if (loading) {
    return <Layout><PageWrapper><Loader /></PageWrapper></Layout>;
  }

  if (!activity) {
    return (
      <Layout>
        <PageWrapper>
          <BackButton type="button" onClick={() => history.goBack()}>← Назад к активностям</BackButton>
          <ErrorText>{error || 'Активность не найдена'}</ErrorText>
        </PageWrapper>
      </Layout>
    );
  }

  const candidates = getCandidates(draft);
  const canonicalProjectId = getCanonicalProjectId(draft);
  const disabled = Boolean(busyAction);
  const summaryTitle = titleOf(draft);
  const summaryLogo = draft.projectLogo || draft.logo || '';
  const summaryInitials = summaryTitle
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join('') || 'AC';
  const summarySource = draft.primarySource || draft.source || 'Не задано';
  const activeSectionIndex = editorSections.findIndex((section) => section.id === activeEditorSection);
  const activeSection = editorSections[activeSectionIndex];
  const previousSection = activeSectionIndex > 0 ? editorSections[activeSectionIndex - 1] : null;
  const nextSection = activeSectionIndex < editorSections.length - 1
    ? editorSections[activeSectionIndex + 1]
    : null;

  return (
    <Layout>
      <PageWrapper>
        <BackButton type="button" onClick={() => history.push('/early_land')}>
          ← Назад к активностям
        </BackButton>

        <EditorHeader>
          <EditorHeaderTop>
            <EditorIdentity>
              <EditorLogo aria-label={`${summaryTitle} logo`}>
                <span>{summaryInitials}</span>
                {summaryLogo ? (
                  <img
                    key={summaryLogo}
                    src={loader(summaryLogo)}
                    alt=""
                    onError={(event) => { event.currentTarget.style.display = 'none'; }}
                  />
                ) : null}
              </EditorLogo>
              <div>
                <EditorTitleRow>
                  <PageTitle>{summaryTitle}</PageTitle>
                  {isDirty ? <StatusBadge $tone="yellow">Не сохранено</StatusBadge> : null}
                </EditorTitleRow>
                <PageSubtitle>{draft.slug || draft.parserActivityId || id}</PageSubtitle>
                <EditorStatusRow>
                  <StatusBadge $tone={toneFor(draft.reviewStatus)}>Проверка: {prettyStatus(draft.reviewStatus)}</StatusBadge>
                  <StatusBadge $tone={toneFor(draft.publicationStatus)}>Публикация: {prettyStatus(draft.publicationStatus)}</StatusBadge>
                  <StatusBadge $tone={toneFor(draft.accessTier)}>Доступ: {prettyStatus(draft.accessTier)}</StatusBadge>
                  <StatusBadge $tone={toneFor(draft.canonicalStatus)}>Каноника: {prettyStatus(draft.canonicalStatus)}</StatusBadge>
                </EditorStatusRow>
              </div>
            </EditorIdentity>
            <EditorHeaderActions>
              {draft.sourceUrl ? (
                <EditorExternalLink href={draft.sourceUrl} target="_blank" rel="noreferrer">
                  Открыть источник ↗
                </EditorExternalLink>
              ) : null}
            </EditorHeaderActions>
          </EditorHeaderTop>

          <EditorSummaryGrid>
            <EditorSummaryItem>
              <EditorSummaryLabel>Символ</EditorSummaryLabel>
              <EditorSummaryValue>{draft.symbol || draft.coinSymbol || 'Не задано'}</EditorSummaryValue>
            </EditorSummaryItem>
            <EditorSummaryItem>
              <EditorSummaryLabel>Ревизия</EditorSummaryLabel>
              <EditorSummaryValue>r{draft.revision ?? '—'}</EditorSummaryValue>
            </EditorSummaryItem>
            <EditorSummaryItem>
              <EditorSummaryLabel>Источник</EditorSummaryLabel>
              <EditorSummaryValue title={String(summarySource)}>{summarySource}</EditorSummaryValue>
            </EditorSummaryItem>
            <EditorSummaryItem>
              <EditorSummaryLabel>Старт</EditorSummaryLabel>
              <EditorSummaryValue>{formatSummaryDate(draft.startDate, draft.approxStartDate)}</EditorSummaryValue>
            </EditorSummaryItem>
            <EditorSummaryItem>
              <EditorSummaryLabel>Дедлайн</EditorSummaryLabel>
              <EditorSummaryValue>{formatSummaryDate(draft.endDate, draft.approxEndDate)}</EditorSummaryValue>
            </EditorSummaryItem>
            <EditorSummaryItem>
              <EditorSummaryLabel>Обновлено</EditorSummaryLabel>
              <EditorSummaryValue>{formatSummaryDate(draft.updatedAt)}</EditorSummaryValue>
            </EditorSummaryItem>
          </EditorSummaryGrid>
        </EditorHeader>

        {error ? <ErrorText>{error}</ErrorText> : null}

        <EditorWorkspace id="activity-editor-workspace">
          <SectionNavigation aria-label="Разделы редактора активности">
            <SectionNavigationCaption>Разделы редактирования</SectionNavigationCaption>
            {editorSections.map((section, index) => {
              const isActive = section.id === activeEditorSection;
              return (
                <SectionNavigationButton
                  key={section.id}
                  type="button"
                  $active={isActive}
                  aria-current={isActive ? 'step' : undefined}
                  onClick={() => selectEditorSection(section.id)}
                >
                  <SectionNavigationIndex $active={isActive}>0{index + 1}</SectionNavigationIndex>
                  <SectionNavigationText>
                    {section.label}
                    <SectionNavigationHint>{section.hint}</SectionNavigationHint>
                  </SectionNavigationText>
                </SectionNavigationButton>
              );
            })}
          </SectionNavigation>

          <EditorGrid>
            <EditorColumn>
              {activeEditorSection === 'overview' ? (
                <EditorSectionStack>
                  <SectionHero>
                    <SectionHeroIndex>01</SectionHeroIndex>
                    <div>
                      <SectionHeroKicker>Настройка активности</SectionHeroKicker>
                      <SectionHeroTitle>Основное</SectionHeroTitle>
                      <SectionHint>Определите, как активность идентифицируется, классифицируется и продвигается.</SectionHint>
                    </div>
                  </SectionHero>
            <SectionCard>
              <SectionHeader>
                <div><SectionTitle>Идентификация и жизненный цикл</SectionTitle><SectionHint>Публичная идентичность и классификация активности.</SectionHint></div>
              </SectionHeader>
              <FieldsGrid $columns={3}>
                <Field><FieldLabel>Название</FieldLabel><Input value={draft.name || ''} onChange={(event) => setTop('name', event.target.value)} /></Field>
                <Field><FieldLabel>Название проекта</FieldLabel><Input value={draft.projectName || ''} onChange={(event) => setTop('projectName', event.target.value)} /></Field>
                <Field><FieldLabel>Slug</FieldLabel><Input value={draft.slug || ''} onChange={(event) => setTop('slug', event.target.value)} /></Field>
                <Field><FieldLabel>Символ</FieldLabel><Input value={draft.symbol || draft.coinSymbol || ''} onChange={(event) => setTop('symbol', event.target.value)} /></Field>
                <Field><FieldLabel>Тип активности</FieldLabel><Input value={draft.activityType || ''} onChange={(event) => setTop('activityType', event.target.value)} /></Field>
                <Field><FieldLabel>Категория</FieldLabel><Input value={draft.category || ''} onChange={(event) => setTop('category', event.target.value)} /></Field>
                <Field><FieldLabel>Жизненный цикл</FieldLabel><AdminSelect value={draft.lifecycleStatus || 'upcoming'} onChange={(v) => setTop('lifecycleStatus', v)} options={[{ value: 'upcoming', label: 'Скоро' }, { value: 'active', label: 'Активно' }, { value: 'ended', label: 'Завершено' }, { value: 'cancelled', label: 'Отменено' }]} /></Field>
                <Field><FieldLabel>Сложность</FieldLabel><AdminSelect value={draft.difficulty || ''} onChange={(v) => setTop('difficulty', v)} placeholder="Не задано" options={[{ value: '', label: 'Не задано' }, { value: 'easy', label: 'Лёгкая' }, { value: 'medium', label: 'Средняя' }, { value: 'hard', label: 'Сложная' }]} /></Field>
                <Field><FieldLabel>Оценка</FieldLabel><AdminSelect value={draft.score || ''} onChange={(v) => setTop('score', v)} placeholder="Не задано" options={[{ value: '', label: 'Не задано' }, { value: 'NOT_RATED', label: 'Без оценки' }, { value: 'LOW', label: 'Низкая' }, { value: 'MEDIUM', label: 'Средняя' }, { value: 'HIGH', label: 'Высокая' }, { value: 'VERY_HIGH', label: 'Очень высокая' }]} /></Field>
                <Field $full><FieldLabel>URL логотипа</FieldLabel><Input value={draft.projectLogo || draft.logo || ''} onChange={(event) => setTop('projectLogo', event.target.value)} /></Field>
              </FieldsGrid>
              <ToggleRow><div><FieldLabel>Горячая активность</FieldLabel><ProjectMeta>Выделяет активность в лентах.</ProjectMeta></div><Switch checked={Boolean(draft.isHot)} onChange={(checked) => setTop('isHot', checked)} /></ToggleRow>
              <ToggleRow><div><FieldLabel>Рекламный баннер EarlyLand</FieldLabel><ProjectMeta>Показывает активность в спонсорском баннере EarlyLand после публикации.</ProjectMeta></div><Switch checked={Boolean(draft.isSponsored)} onChange={(checked) => setTop('isSponsored', checked)} /></ToggleRow>
              {draft.isSponsored ? (
                <FieldsGrid>
                  <Field><FieldLabel>Приоритет баннера</FieldLabel><Input type="number" min="-100000" max="100000" step="1" value={draft.sponsoredPriority ?? 0} onChange={(event) => setTop('sponsoredPriority', event.target.value)} /><ProjectMeta>Чем выше значение — тем раньше показывается.</ProjectMeta></Field>
                </FieldsGrid>
              ) : null}
            </SectionCard>
                </EditorSectionStack>
              ) : null}

              {activeEditorSection === 'schedule' ? (
                <EditorSectionStack>
                  <SectionHero>
                    <SectionHeroIndex>02</SectionHeroIndex>
                    <div>
                      <SectionHeroKicker>Тайминг и стимулы</SectionHeroKicker>
                      <SectionHeroTitle>Сроки и награды</SectionHeroTitle>
                      <SectionHint>Задайте окно участия, трудозатраты и ожидания по наградам.</SectionHint>
                    </div>
                  </SectionHero>
            <SectionCard>
              <SectionHeader><div><SectionTitle>Сроки и награды</SectionTitle><SectionHint>Используйте точные даты, когда они известны, и приблизительные значения только для диапазонов TBA.</SectionHint></div></SectionHeader>
              <FieldsGrid $columns={3}>
                <Field><FieldLabel>Дата старта</FieldLabel><Input type="date" value={toDateInput(draft.startDate)} onChange={(event) => setTop('startDate', event.target.value || null)} /></Field>
                <Field><FieldLabel>Окончание / дедлайн</FieldLabel><Input type="date" value={toDateInput(draft.endDate)} onChange={(event) => setTop('endDate', event.target.value || null)} /></Field>
                <Field><FieldLabel>Частота задания</FieldLabel><AdminSelect value={draft.taskFrequency || ''} onChange={(v) => setTop('taskFrequency', v)} placeholder="Не задано" options={[{ value: '', label: 'Не задано' }, { value: 'daily', label: 'Ежедневно' }, { value: 'weekly', label: 'Еженедельно' }, { value: 'monthly', label: 'Ежемесячно' }, { value: 'ongoing', label: 'Постоянно' }]} /></Field>
                <Field><FieldLabel>Приблизительный старт</FieldLabel><Input value={draft.approxStartDate || ''} onChange={(event) => setTop('approxStartDate', event.target.value)} placeholder="Q3 2026 / TBA" /></Field>
                <Field><FieldLabel>Приблизительное окончание</FieldLabel><Input value={draft.approxEndDate || ''} onChange={(event) => setTop('approxEndDate', event.target.value)} placeholder="Q4 2026 / TBA" /></Field>
                <Field><FieldLabel>Часовой пояс</FieldLabel><Input value={draft.timezone || ''} onChange={(event) => setTop('timezone', event.target.value)} placeholder="UTC / Asia/Bangkok" /></Field>
                <Field><FieldLabel>Оценка времени</FieldLabel><Input value={draft.timeEstimate || ''} onChange={(event) => setTop('timeEstimate', event.target.value)} /></Field>
                <Field><FieldLabel>Участников</FieldLabel><Input type="number" min="0" step="1" value={draft.participants ?? ''} onChange={(event) => setTop('participants', event.target.value)} /></Field>
                <Field><FieldLabel>Привлечено средств</FieldLabel><Input type="number" min="0" value={draft.fundsRaised ?? ''} onChange={(event) => setTop('fundsRaised', event.target.value)} /></Field>
                <Field><FieldLabel>Название награды</FieldLabel><Input value={draft.rewardLabel || ''} onChange={(event) => setTop('rewardLabel', event.target.value)} /></Field>
                <Field><FieldLabel>Размер награды</FieldLabel><Input type="number" value={draft.rewardAmount ?? ''} onChange={(event) => setTop('rewardAmount', event.target.value)} /></Field>
                <Field><FieldLabel>Объём награды</FieldLabel><Input type="number" value={draft.rewardSupply ?? ''} onChange={(event) => setTop('rewardSupply', event.target.value)} /></Field>
                <Field><FieldLabel>Стоимость</FieldLabel><Input value={draft.cost || ''} onChange={(event) => setTop('cost', event.target.value)} /></Field>
                <Field><FieldLabel>Распределение</FieldLabel><Input value={draft.rewardDistribution || ''} onChange={(event) => setTop('rewardDistribution', event.target.value)} /></Field>
                <Field><FieldLabel>Распределение (прибл.)</FieldLabel><Input value={draft.rewardDistributionApprox || ''} onChange={(event) => setTop('rewardDistributionApprox', event.target.value)} /></Field>
              </FieldsGrid>
              <AdvancedDetails>
                <AdvancedSummary>
                  Расширенная структура наград
                  <AdvancedSummaryHint>Редактируйте сырой массив наград только когда стандартных полей недостаточно.</AdvancedSummaryHint>
                </AdvancedSummary>
                <AdvancedBody>
                  <Field><FieldLabel>Rewards JSON</FieldLabel><Textarea value={jsonDrafts.rewards} onChange={(event) => setJsonDrafts((current) => ({ ...current, rewards: event.target.value }))} placeholder='[{"label":"Points","value":"1000"}]' />{jsonError ? <JsonError>{jsonError}</JsonError> : null}</Field>
                </AdvancedBody>
              </AdvancedDetails>
            </SectionCard>
                </EditorSectionStack>
              ) : null}

              {activeEditorSection === 'content' ? (
                <EditorSectionStack>
                  <SectionHero>
                    <SectionHeroIndex>03</SectionHeroIndex>
                    <div>
                      <SectionHeroKicker>Публичный контент</SectionHeroKicker>
                      <SectionHeroTitle>Контент и навигация</SectionHeroTitle>
                      <SectionHint>Напишите публичные тексты, подключите ссылки и организуйте метаданные для навигации.</SectionHint>
                    </div>
                  </SectionHero>

            <SectionCard>
              <SectionHeader><div><SectionTitle>Описания</SectionTitle><SectionHint>«Визуально» — для обычного редактирования, «HTML» — для продвинутой разметки, «Предпросмотр» — для проверки итогового результата.</SectionHint></div></SectionHeader>
              <FieldsGrid>
                <Field as="div" $full>
                  <FieldLabel>О проекте</FieldLabel>
                  <ActivityRichTextEditor
                    ariaLabel="Описание «О проекте»"
                    value={richEditorValue(draft.description?.aboutHtml, draft.description?.about)}
                    onChange={(html, plainText) => setDescriptionRich('aboutHtml', 'about', html, plainText)}
                  />
                </Field>
                <Field as="div" $full>
                  <FieldLabel>Как участвовать</FieldLabel>
                  <ActivityRichTextEditor
                    ariaLabel="Описание «Как участвовать»"
                    value={richEditorValue(draft.description?.howToParticipateHtml, draft.description?.howToParticipate)}
                    onChange={(html, plainText) => setDescriptionRich('howToParticipateHtml', 'howToParticipate', html, plainText)}
                  />
                </Field>
              </FieldsGrid>
            </SectionCard>

            <SectionCard>
              <SectionHeader><div><SectionTitle>Ссылки и таксономия</SectionTitle><SectionHint>Вся публичная навигация и фильтры.</SectionHint></div></SectionHeader>
              <FieldsGrid>
                <Field><FieldLabel>Ссылка для участия</FieldLabel><Input value={draft.joinLink || ''} onChange={(event) => setTop('joinLink', event.target.value)} /></Field>
                <Field><FieldLabel>Source URL (происхождение, только чтение)</FieldLabel><Input disabled value={draft.sourceUrl || ''} /></Field>
                <Field><FieldLabel>Original URL (происхождение, только чтение)</FieldLabel><Input disabled value={draft.originalUrl || ''} /></Field>
                <Field><FieldLabel>Сайт</FieldLabel><Input value={draft.socialLinks?.website || ''} onChange={(event) => setSocial('website', event.target.value)} /></Field>
                <Field><FieldLabel>Twitter / X</FieldLabel><Input value={draft.socialLinks?.twitter || ''} onChange={(event) => setSocial('twitter', event.target.value)} /></Field>
                <Field><FieldLabel>Telegram</FieldLabel><Input value={draft.socialLinks?.telegram || ''} onChange={(event) => setSocial('telegram', event.target.value)} /></Field>
                <Field><FieldLabel>Discord</FieldLabel><Input value={draft.socialLinks?.discord || ''} onChange={(event) => setSocial('discord', event.target.value)} /></Field>
                <Field><FieldLabel>Документация</FieldLabel><Input value={draft.socialLinks?.docs || ''} onChange={(event) => setSocial('docs', event.target.value)} /></Field>
                <Field><FieldLabel>Теги (по одному в строке)</FieldLabel><Textarea value={lines(draft.tags)} onChange={(event) => setTop('tags', fromLines(event.target.value))} /></Field>
                <Field><FieldLabel>Экосистемы (по одной в строке)</FieldLabel><Textarea value={lines(draft.ecosystem)} onChange={(event) => setTop('ecosystem', fromLines(event.target.value))} /></Field>
                <Field><FieldLabel>Платформы (по одной в строке)</FieldLabel><Textarea value={lines(draft.platform)} onChange={(event) => setTop('platform', fromLines(event.target.value))} /></Field>
                <Field><FieldLabel>Требования (по одному в строке)</FieldLabel><Textarea value={lines(draft.requirements)} onChange={(event) => setTop('requirements', fromLines(event.target.value))} /></Field>
              </FieldsGrid>
              <AdvancedDetails>
                <AdvancedSummary>
                  Расширенные структурированные данные
                  <AdvancedSummaryHint>Сырые массивы для ссылок, медиа, активов, инвесторов и таймлайна. Большинство ревьюеров могут не открывать это.</AdvancedSummaryHint>
                </AdvancedSummary>
                <AdvancedBody>
                  <FieldsGrid>
                    <Field $full><FieldLabel>Additional links JSON</FieldLabel><Textarea value={jsonDrafts.links} onChange={(event) => setJsonDrafts((current) => ({ ...current, links: event.target.value }))} placeholder='[{"label":"Guide","url":"https://..."}]' /></Field>
                    <Field $full><FieldLabel>Video guides JSON</FieldLabel><Textarea value={jsonDrafts.videoGuides} onChange={(event) => setJsonDrafts((current) => ({ ...current, videoGuides: event.target.value }))} placeholder='["https://youtube.com/..."]' /></Field>
                    <Field $full><FieldLabel>Related assets JSON</FieldLabel><Textarea value={jsonDrafts.relatedAssets} onChange={(event) => setJsonDrafts((current) => ({ ...current, relatedAssets: event.target.value }))} placeholder='[{"name":"Token","symbol":"TKN","slug":"token"}]' /></Field>
                    <Field $full><FieldLabel>Investors JSON</FieldLabel><Textarea value={jsonDrafts.investors} onChange={(event) => setJsonDrafts((current) => ({ ...current, investors: event.target.value }))} placeholder='[{"name":"Fund","website":"https://...","source":"parser"}]' /></Field>
                    <Field $full><FieldLabel>Timeline JSON</FieldLabel><Textarea value={jsonDrafts.timeline} onChange={(event) => setJsonDrafts((current) => ({ ...current, timeline: event.target.value }))} placeholder='[{"title":"Snapshot","date":"2026-09-01","description":"Expected snapshot"}]' />{jsonError ? <JsonError>{jsonError}</JsonError> : null}</Field>
                  </FieldsGrid>
                </AdvancedBody>
              </AdvancedDetails>
            </SectionCard>
                </EditorSectionStack>
              ) : null}

              {activeEditorSection === 'guide' ? (
                <EditorSectionStack>
                  <SectionHero>
                    <SectionHeroIndex>04</SectionHeroIndex>
                    <div>
                      <SectionHeroKicker>Порядок участия</SectionHeroKicker>
                      <SectionHeroTitle>Гайд по заданию</SectionHeroTitle>
                      <SectionHint>Превратите активность в понятную и выполнимую последовательность шагов для пользователей.</SectionHint>
                    </div>
                  </SectionHero>
            <SectionCard>
              <SectionHeader><div><SectionTitle>Гайд по заданию</SectionTitle><SectionHint>Инструкции и шаги, отображаемые на публичной странице активности EarlyLand.</SectionHint></div><SmallButton type="button" onClick={() => setGuide('steps', [...(draft.taskGuide?.steps || []), { id: `step-${(draft.taskGuide?.steps?.length || 0) + 1}`, title: '' }])}>Добавить шаг</SmallButton></SectionHeader>
              <FieldsGrid>
                <Field><FieldLabel>Заголовок гайда</FieldLabel><Input value={draft.taskGuide?.title || ''} onChange={(event) => setGuide('title', event.target.value)} /></Field>
                <Field><FieldLabel>Текст кнопки (CTA)</FieldLabel><Input value={draft.taskGuide?.ctaLabel || ''} onChange={(event) => setGuide('ctaLabel', event.target.value)} /></Field>
                <Field $full><FieldLabel>Ссылка кнопки (CTA)</FieldLabel><Input value={draft.taskGuide?.ctaUrl || ''} onChange={(event) => setGuide('ctaUrl', event.target.value)} /></Field>
                <Field as="div" $full>
                  <FieldLabel>Описание</FieldLabel>
                  <ActivityRichTextEditor
                    ariaLabel="Описание гайда по заданию"
                    value={richEditorValue(draft.taskGuide?.descriptionHtml, draft.taskGuide?.description)}
                    onChange={(html, plainText) => setDraft((current) => ({
                      ...current,
                      taskGuide: {
                        ...(current.taskGuide || {}),
                        descriptionHtml: html,
                        description: plainText,
                      },
                    }))}
                  />
                </Field>
                <Field $full><FieldLabel>Сообщение об успехе</FieldLabel><Input value={draft.taskGuide?.successMessage || ''} onChange={(event) => setGuide('successMessage', event.target.value)} /></Field>
              </FieldsGrid>
              <ToggleRow><div><FieldLabel>Заблокировать гайд</FieldLabel><ProjectMeta>Доступ к Prime-контенту должен проверяться на стороне сервера.</ProjectMeta></div><Switch checked={Boolean(draft.taskGuide?.isLocked)} onChange={(checked) => setGuide('isLocked', checked)} /></ToggleRow>
              {(draft.taskGuide?.steps || []).map((step, index) => (
                <StepCard key={step.id || index}>
                  <SectionHeader><div><SectionTitle>Шаг {index + 1}</SectionTitle></div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <SmallButton type="button" disabled={index === 0} onClick={() => moveStep(index, -1)} title="Вверх">↑</SmallButton>
                      <SmallButton type="button" disabled={index === (draft.taskGuide?.steps || []).length - 1} onClick={() => moveStep(index, 1)} title="Вниз">↓</SmallButton>
                      <SmallButton $danger type="button" onClick={() => setGuide('steps', (draft.taskGuide?.steps || []).filter((_, stepIndex) => stepIndex !== index))}>Удалить</SmallButton>
                    </div>
                  </SectionHeader>
                  <FieldsGrid>
                    <Field><FieldLabel>ID</FieldLabel><Input value={step.id || ''} onChange={(event) => updateStep(index, { id: event.target.value })} /></Field>
                    <Field><FieldLabel>Заголовок</FieldLabel><Input value={step.title || ''} onChange={(event) => updateStep(index, { title: event.target.value })} /></Field>
                    <Field><FieldLabel>Оценка времени</FieldLabel><Input value={step.timeEstimate || ''} onChange={(event) => updateStep(index, { timeEstimate: event.target.value })} /></Field>
                    <Field as="div" $full>
                      <FieldLabel>Описание</FieldLabel>
                      <ActivityRichTextEditor
                        ariaLabel={`Описание шага ${index + 1}`}
                        minHeight={150}
                        maxHtmlLength={100_000}
                        maxPlainLength={20_000}
                        value={richEditorValue(step.descriptionHtml, step.description)}
                        onChange={(html, plainText) => updateStep(index, {
                          descriptionHtml: html,
                          description: plainText,
                        })}
                      />
                    </Field>
                    <Field><FieldLabel>URL изображения</FieldLabel><Input value={step.image || ''} onChange={(event) => updateStep(index, { image: event.target.value })} /></Field>
                    <Field><FieldLabel>URL видео</FieldLabel><Input value={step.video || ''} onChange={(event) => updateStep(index, { video: event.target.value })} /></Field>
                    <Field><FieldLabel>Текст кнопки (CTA)</FieldLabel><Input value={step.ctaLabel || ''} onChange={(event) => updateStep(index, { ctaLabel: event.target.value })} /></Field>
                    <Field><FieldLabel>Ссылка кнопки (CTA)</FieldLabel><Input value={step.ctaUrl || ''} onChange={(event) => updateStep(index, { ctaUrl: event.target.value })} /></Field>
                  </FieldsGrid>
                </StepCard>
              ))}
            </SectionCard>
                </EditorSectionStack>
              ) : null}

              {activeEditorSection === 'review' ? (
                <EditorSectionStack>
                  <SectionHero>
                    <SectionHeroIndex>05</SectionHeroIndex>
                    <div>
                      <SectionHeroKicker>Редакторское качество</SectionHeroKicker>
                      <SectionHeroTitle>FOMO Review и риск</SectionHeroTitle>
                      <SectionHint>Кратко опишите возможность и дайте админам сбалансированный сигнал качества и риска.</SectionHint>
                    </div>
                  </SectionHero>
            <SectionCard>
              <SectionHeader><div><SectionTitle>FOMO Review</SectionTitle><SectionHint>Редакторский обзор, отображаемый в блоке FOMO Review на основном сайте.</SectionHint></div><SmallButton type="button" onClick={() => setReview('scores', [...(draft.review?.scores || []), { label: '', value: 0 }])}>Добавить оценку</SmallButton></SectionHeader>
              <FieldsGrid>
                <Field as="div" $full>
                  <FieldLabel>Текст обзора</FieldLabel>
                  <ActivityRichTextEditor
                    ariaLabel="Текст FOMO Review"
                    value={richEditorValue(draft.review?.textHtml, draft.review?.text)}
                    onChange={(html, plainText) => setDraft((current) => ({
                      ...current,
                      review: {
                        ...(current.review || {}),
                        textHtml: html,
                        text: plainText,
                      },
                    }))}
                  />
                </Field>
              </FieldsGrid>
              {(draft.review?.scores || []).map((score, index) => (
                <InlineRow key={`${score.label}-${index}`}>
                  <Input value={score.label} onChange={(event) => updateScore(index, { label: event.target.value })} placeholder="Название оценки" />
                  <Input type="number" min="0" max="100" value={score.value} onChange={(event) => updateScore(index, { value: Number(event.target.value) })} />
                  <SmallButton $danger type="button" onClick={() => setReview('scores', (draft.review?.scores || []).filter((_, scoreIndex) => scoreIndex !== index))}>Удалить</SmallButton>
                </InlineRow>
              ))}
              <ToggleRow><div><FieldLabel>Заблокировать FOMO Review</FieldLabel><ProjectMeta>Бэкенд должен скрывать заблокированный контент для пользователей без доступа.</ProjectMeta></div><Switch checked={Boolean(draft.review?.isLocked)} onChange={(checked) => setReview('isLocked', checked)} /></ToggleRow>
            </SectionCard>

            <SectionCard>
              <SectionHeader><div><SectionTitle>Метрики и флаги</SectionTitle><SectionHint>По одному флагу в строке.</SectionHint></div></SectionHeader>
              <FieldsGrid>
                <Field><FieldLabel>Уровень риска</FieldLabel><Input value={draft.metrics?.riskLevel || ''} onChange={(event) => setMetric('riskLevel', event.target.value)} /></Field>
                <Field><FieldLabel>Сложность</FieldLabel><Input value={draft.metrics?.complexity || ''} onChange={(event) => setMetric('complexity', event.target.value)} /></Field>
                <Field><FieldLabel>Требуемое время</FieldLabel><Input value={draft.metrics?.timeRequired || ''} onChange={(event) => setMetric('timeRequired', event.target.value)} /></Field>
                <Field><FieldLabel>Потенциальная награда</FieldLabel><Input value={draft.metrics?.potentialReward || ''} onChange={(event) => setMetric('potentialReward', event.target.value)} /></Field>
                <Field><FieldLabel>Зелёные флаги</FieldLabel><Textarea value={lines(draft.flags?.green)} onChange={(event) => setTop('flags', { ...(draft.flags || {}), green: fromLines(event.target.value) })} /></Field>
                <Field><FieldLabel>Жёлтые флаги</FieldLabel><Textarea value={lines(draft.flags?.yellow)} onChange={(event) => setTop('flags', { ...(draft.flags || {}), yellow: fromLines(event.target.value) })} /></Field>
                <Field $full><FieldLabel>Красные флаги</FieldLabel><Textarea value={lines(draft.flags?.red)} onChange={(event) => setTop('flags', { ...(draft.flags || {}), red: fromLines(event.target.value) })} /></Field>
              </FieldsGrid>
            </SectionCard>
                </EditorSectionStack>
              ) : null}

              <SectionPager>
                <SectionPagerStatus>
                  Раздел {activeSectionIndex + 1} из {editorSections.length} · {activeSection.label}
                </SectionPagerStatus>
                <SectionPagerActions>
                  {previousSection ? (
                    <SmallButton type="button" onClick={() => selectEditorSection(previousSection.id)}>
                      ← {previousSection.label}
                    </SmallButton>
                  ) : null}
                  {nextSection ? (
                    <AiReviewButton $primary type="button" onClick={() => selectEditorSection(nextSection.id)}>
                      {nextSection.label} →
                    </AiReviewButton>
                  ) : null}
                </SectionPagerActions>
              </SectionPager>
            </EditorColumn>

            <EditorColumn $sticky>
            <SectionCard>
              <SectionHeader><div><SectionTitle>Тип доступа активности</SectionTitle><SectionHint>Это тип самой активности (Обычная или Prime), а НЕ политика доступа. Кто именно может открыть Prime-контент, настраивается в EarlyLand → «Настройки доступа» и проверяется на бэкенде.</SectionHint></div></SectionHeader>
              <Field><FieldLabel>Тип доступа</FieldLabel><AdminSelect value={draft.accessTier || 'public'} onChange={(v) => setTop('accessTier', v)} options={[{ value: 'public', label: 'Обычная (Public)' }, { value: 'prime', label: 'Prime' }]} /></Field>
              <ProjectMeta>Изменение этого поля не публикует активность — публикация остаётся отдельным решением. Политика доступа к Prime (Без ограничений / NFT / Ручной доступ / …) задаётся во вкладке «Настройки доступа».</ProjectMeta>
            </SectionCard>

            <SectionCard>
              <SectionHeader><div><SectionTitle>Канонический проект</SectionTitle><SectionHint>Подтвердите сильного кандидата, отклоните отдельные совпадения или явно отметьте, что совпадения нет.</SectionHint></div><SmallButton type="button" disabled={disabled} onClick={() => runCanonical('Поиск кандидатов', resolveFomoV2ActivityCanonical, {})}>Найти кандидатов</SmallButton></SectionHeader>
              {canonicalProjectId ? <CandidateCard $selected><CandidateTitle><span>Связанный проект</span><StatusBadge $tone="green">Подтверждён</StatusBadge></CandidateTitle><CandidateMeta>{canonicalProjectId}</CandidateMeta></CandidateCard> : <ProjectMeta>Канонический проект не подтверждён.</ProjectMeta>}
              {candidates.map((candidate, index) => {
                const candidateProjectId = candidate.canonicalProjectId || candidate.id || candidate._id || '';
                return (
                  <CandidateCard key={String(candidateProjectId || index)}>
                    <CandidateTitle><span>{candidate.name || candidate.slug || 'Кандидат'} {candidate.symbol ? `(${candidate.symbol})` : ''}</span><StatusBadge $tone="blue">{candidate.confidence ?? '—'}</StatusBadge></CandidateTitle>
                    <CandidateMeta>{candidateProjectId}</CandidateMeta>
                    <CandidateMeta>{candidate.matchedBy || candidate.reason || 'Нет данных о совпадении'}</CandidateMeta>
                    <InlineRow>
                      <SmallButton type="button" disabled={disabled} onClick={() => runCanonical('Подтверждение', verifyFomoV2ActivityCanonical, { canonicalProjectId: candidateProjectId })}>Подтвердить связь</SmallButton>
                      <SmallButton $danger type="button" disabled={disabled} onClick={() => runCanonical('Отклонение', rejectFomoV2ActivityCanonical, { canonicalProjectId: candidateProjectId })}>Отклонить</SmallButton>
                    </InlineRow>
                  </CandidateCard>
                );
              })}
              <Field><FieldLabel>ID канонического проекта (вручную)</FieldLabel><Input value={manualCanonicalId} onChange={(event) => setManualCanonicalId(event.target.value)} placeholder="Mongo ID / канонический ID" /></Field>
              <InlineRow>
                <SmallButton type="button" disabled={disabled || !manualCanonicalId.trim()} onClick={() => runCanonical('Подтверждение', verifyFomoV2ActivityCanonical, { canonicalProjectId: manualCanonicalId.trim() })}>Связать вручную</SmallButton>
                <SmallButton $danger type="button" disabled={disabled} onClick={() => runCanonical('Нет совпадения', noMatchFomoV2ActivityCanonical, {})}>Нет совпадения</SmallButton>
              </InlineRow>
            </SectionCard>

            <SectionCard>
              <SectionHeader>
                <div>
                  <SectionTitle>AI-ассистент</SectionTitle>
                  <SectionHint>Сгенерируйте редакторские улучшения, затем проверьте каждое изменение перед применением.</SectionHint>
                </div>
              </SectionHeader>
              <AiAssistantHero>
                <AiAssistantIcon aria-hidden="true">AI</AiAssistantIcon>
                <div>
                  <AiAssistantTitle>
                    {aiProposal ? `Предложено изменений: ${aiReviewItems.filter((item) => !item.unchanged).length}` : 'Предложения пока нет'}
                  </AiAssistantTitle>
                  <ProjectMeta>
                    {aiProposal?.model
                      ? `${aiProposal.model} · ${prettyStatus(aiProposal.status)}`
                      : 'Результат генерации откроется в полном режиме сравнения «До / После».'}
                  </ProjectMeta>
                </div>
              </AiAssistantHero>
              {aiProposal?.warnings?.length ? (
                <StatusBadge $tone="yellow">Предупреждений: {aiProposal.warnings.length}</StatusBadge>
              ) : null}
              <AiAssistantActions>
                <AiReviewButton
                  type="button"
                  disabled={disabled}
                  onClick={generateAi}
                >
                  {busyAction === 'Генерация AI' ? 'Генерация…' : aiProposal ? 'Сгенерировать заново' : 'Сгенерировать предложение'}
                </AiReviewButton>
                <AiReviewButton
                  $primary
                  type="button"
                  disabled={!aiProposal || !aiReviewItems.length}
                  onClick={() => setIsAiReviewOpen(true)}
                >
                  Проверить изменения
                </AiReviewButton>
              </AiAssistantActions>
            </SectionCard>

            <SectionCard>
              <SectionHeader><div><SectionTitle>Источник и история</SectionTitle><SectionHint>Справочный контекст доступен по требованию.</SectionHint></div></SectionHeader>
              <AdvancedDetails>
                <AdvancedSummary>
                  Происхождение источника
                  <AdvancedSummaryHint>{draft.primarySource || draft.source || 'Нет источника'} · обновлено {formatSummaryDate(draft.updatedAt)}</AdvancedSummaryHint>
                </AdvancedSummary>
                <AdvancedBody>
                  <CandidateMeta>Основной источник: {draft.primarySource || draft.source || '—'}</CandidateMeta>
                  <CandidateMeta>Активность парсера: {draft.parserActivityId || '—'}</CandidateMeta>
                  <CandidateMeta>Source URL: {draft.sourceUrl || '—'}</CandidateMeta>
                  <CandidateMeta>Создано: {draft.createdAt ? new Date(draft.createdAt).toLocaleString('ru-RU') : '—'}</CandidateMeta>
                  <CandidateMeta>Обновлено: {draft.updatedAt ? new Date(draft.updatedAt).toLocaleString('ru-RU') : '—'}</CandidateMeta>
                </AdvancedBody>
              </AdvancedDetails>
              <AdvancedDetails>
                <AdvancedSummary>
                  Журнал изменений
                  <AdvancedSummaryHint>{(draft.auditTrail || []).length} событий редактирования и публикации</AdvancedSummaryHint>
                </AdvancedSummary>
                <AdvancedBody>
                  {(draft.auditTrail || []).length ? [...(draft.auditTrail || [])].reverse().slice(0, 20).map((entry, index) => (
                    <CandidateCard key={`${entry.revision ?? index}-${entry.at || index}`}>
                      <CandidateTitle><span>{prettyStatus(entry.action)}</span><StatusBadge $tone="gray">r{entry.revision ?? '—'}</StatusBadge></CandidateTitle>
                      <CandidateMeta>{entry.actor || 'система'} · {entry.at ? new Date(entry.at).toLocaleString('ru-RU') : '—'}</CandidateMeta>
                      {entry.note ? <CandidateMeta>{entry.note}</CandidateMeta> : null}
                      {entry.changedFields?.length ? <CandidateMeta>{entry.changedFields.join(', ')}</CandidateMeta> : null}
                    </CandidateCard>
                  )) : <ProjectMeta>Записей журнала пока нет.</ProjectMeta>}
                </AdvancedBody>
              </AdvancedDetails>
            </SectionCard>

            <SectionCard>
              <ActivityTasksSection activityId={id} />
            </SectionCard>
            </EditorColumn>
          </EditorGrid>
        </EditorWorkspace>

        <ActionBar>
          <ActionBarStatus $dirty={isDirty}>
            <MutedText>{busyAction ? `${busyAction}…` : isDirty ? 'Есть несохранённые изменения' : 'Все изменения сохранены'}</MutedText>
          </ActionBarStatus>
          <ActionBarActions>
            <ActionButton type="button" $tone="neutral" disabled={disabled || !isDirty} onClick={() => acceptActivity(activity)}>Отменить</ActionButton>
            <ActionButton type="button" disabled={disabled || !isDirty} onClick={save}>{busyAction === 'Сохранение' ? 'Сохранение…' : 'Сохранить черновик'}</ActionButton>
            <ActionBarDivider aria-hidden="true" />
            <ActionButton type="button" $tone="success" disabled={disabled} onClick={() => runAction('Одобрение', approveFomoV2Activity, { saveFirst: true, askNote: true })}>Одобрить</ActionButton>
            <ActionButton type="button" $tone="success" disabled={disabled || draft.reviewStatus !== 'approved'} onClick={() => runAction('Публикация', publishFomoV2Activity, { saveFirst: true, askNote: true })}>Опубликовать</ActionButton>
            <ActionBarDivider aria-hidden="true" />
            <ActionButton type="button" $tone="danger" disabled={disabled} onClick={() => runAction('Отклонение', rejectFomoV2Activity, { saveFirst: true, askNote: true, confirm: 'Отклонить эту активность? Она останется в базе и не будет публичной.' })}>Отклонить</ActionButton>
            {draft.publicationStatus === 'hidden' ? (
              <ActionButton type="button" $tone="warning" disabled={disabled} onClick={() => runAction('Показать', unhideFomoV2Activity, { askNote: true })}>Показать</ActionButton>
            ) : (
              <ActionButton type="button" $tone="warning" disabled={disabled} onClick={() => runAction('Скрытие', hideFomoV2Activity, { saveFirst: true, askNote: true, confirm: 'Скрыть эту активность со всех публичных страниц EarlyLand?' })}>Скрыть</ActionButton>
            )}
          </ActionBarActions>
        </ActionBar>
        {isAiReviewOpen && aiProposal ? (
          <ActivityAiReviewModal
            activityName={summaryTitle}
            proposal={aiProposal}
            items={aiReviewItems}
            selectedPaths={selectedAiPaths}
            busy={disabled}
            hasUnsavedChanges={isDirty}
            onSelectionChange={setSelectedAiPaths}
            onApply={applyAi}
            onReject={rejectAi}
            onClose={() => setIsAiReviewOpen(false)}
          />
        ) : null}
      </PageWrapper>
    </Layout>
  );
};

export default ActivityEditorPage;
