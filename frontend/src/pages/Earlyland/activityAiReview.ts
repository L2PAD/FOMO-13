import { FomoV2ActivityAiChange } from '../../components/services/fomoV2Activities';

export type ActivityAiReviewGroup =
  | 'Overview'
  | 'Content'
  | 'Task guide'
  | 'FOMO review'
  | 'Metrics & flags'
  | 'Links & data';

export interface ActivityAiReviewItem {
  id: string;
  paths: string[];
  label: string;
  group: ActivityAiReviewGroup;
  before: unknown;
  after: unknown;
  reason?: string;
  confidence?: number;
  unchanged: boolean;
  destructive: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Activity name',
  projectName: 'Project name',
  activityType: 'Activity type',
  lifecycleStatus: 'Lifecycle status',
  isHot: 'Hot activity',
  ecosystem: 'Ecosystems',
  platform: 'Platforms',
  tags: 'Tags',
  requirements: 'Requirements',
  'description.about': 'About',
  'description.howToParticipate': 'How to participate',
  'review.text': 'Review text',
  'review.scores': 'Review scores',
  'review.isLocked': 'Review access lock',
  'flags.green': 'Green flags',
  'flags.yellow': 'Yellow flags',
  'flags.red': 'Red flags',
  'taskGuide.title': 'Guide title',
  'taskGuide.description': 'Guide description',
  'taskGuide.ctaLabel': 'Guide button label',
  'taskGuide.ctaUrl': 'Guide button URL',
  'taskGuide.isLocked': 'Guide access lock',
  'taskGuide.steps': 'Guide steps',
  rewards: 'Rewards',
  links: 'Additional links',
  videoGuides: 'Video guides',
  relatedAssets: 'Related assets',
  investors: 'Investors',
  timeline: 'Timeline',
};

const normalizeForComparison = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalizeForComparison);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = normalizeForComparison((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }
  return value;
};

export const areActivityAiValuesEqual = (before: unknown, after: unknown): boolean => {
  if (before === after) return true;
  try {
    return JSON.stringify(normalizeForComparison(before)) === JSON.stringify(normalizeForComparison(after));
  } catch (error) {
    return false;
  }
};

const hasValue = (value: unknown): boolean => {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  return true;
};

const groupForPath = (path: string): ActivityAiReviewGroup => {
  if (path.startsWith('description.')) return 'Content';
  if (path.startsWith('taskGuide.')) return 'Task guide';
  if (path.startsWith('review.')) return 'FOMO review';
  if (path.startsWith('flags.') || path.startsWith('metrics.')) return 'Metrics & flags';
  if (['links', 'videoGuides', 'relatedAssets', 'investors', 'timeline', 'rewards'].includes(path)) {
    return 'Links & data';
  }
  return 'Overview';
};

const humanizePath = (path: string): string => {
  if (FIELD_LABELS[path]) return FIELD_LABELS[path];
  const leaf = path.split('.').pop() || path;
  return leaf
    .replace(/Html$/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (character) => character.toUpperCase());
};

const semanticBasePath = (path: string): string => (path.endsWith('Html') ? path.slice(0, -4) : path);

export const buildActivityAiReviewItems = (
  changes: FomoV2ActivityAiChange[],
): ActivityAiReviewItem[] => {
  const byPath = new Map(changes.map((change) => [change.path, change]));
  const consumed = new Set<string>();

  return changes.flatMap((change) => {
    if (consumed.has(change.path)) return [];

    const basePath = semanticBasePath(change.path);
    const plainChange = byPath.get(basePath);
    const htmlChange = byPath.get(`${basePath}Html`);
    const isRichTextPair = Boolean(plainChange && htmlChange && plainChange.path !== htmlChange.path);
    const pairedChanges: FomoV2ActivityAiChange[] = isRichTextPair && plainChange && htmlChange
      ? [plainChange, htmlChange]
      : [change];
    pairedChanges.forEach((pairedChange) => consumed.add(pairedChange.path));

    const displayChange = plainChange || change;
    const unchanged = pairedChanges.every((pairedChange) => (
      areActivityAiValuesEqual(pairedChange.currentValue, pairedChange.proposedValue)
    ));
    const destructive = pairedChanges.some((pairedChange) => (
      hasValue(pairedChange.currentValue) && !hasValue(pairedChange.proposedValue)
    ));

    return [{
      id: pairedChanges.map((pairedChange) => pairedChange.path).join('|'),
      paths: pairedChanges.map((pairedChange) => pairedChange.path),
      label: humanizePath(basePath),
      group: groupForPath(basePath),
      before: displayChange.currentValue,
      after: displayChange.proposedValue,
      reason: pairedChanges.find((pairedChange) => pairedChange.reason)?.reason,
      confidence: pairedChanges.find((pairedChange) => pairedChange.confidence !== undefined)?.confidence,
      unchanged,
      destructive,
    }];
  });
};

export const getDefaultActivityAiPaths = (items: ActivityAiReviewItem[]): string[] => (
  items
    .filter((item) => !item.unchanged && !item.destructive)
    .flatMap((item) => item.paths)
);
