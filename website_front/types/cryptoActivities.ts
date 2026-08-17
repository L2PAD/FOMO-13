export interface CryptoActivityUserState {
  isFavourite: boolean;
  reaction?: string | null;
  isAddedToCalendar: boolean;
  completedStepIds?: string[];
  stepsCompleted?: number;
  stepsTotal?: number;
  stepsProgress?: number;
}

export interface CryptoActivityApiLink {
  label: string;
  url: string;
}

export interface CryptoActivityApiSocialLinks {
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  docs?: string;
  custom?: CryptoActivityApiLink[];
}

export interface CryptoActivityApiDescription {
  about?: string;
  aboutHtml?: string;
  howToParticipate?: string;
  howToParticipateHtml?: string;
}

export type CryptoActivityAccessTier = "public" | "prime";

export interface CryptoActivityViewerAccess {
  allowed?: boolean;
  canView?: boolean;
  hasAccess?: boolean;
  entitled?: boolean;
  isEntitled?: boolean;
  isAuthenticated?: boolean;
  isRedacted?: boolean;
  contentRedacted?: boolean;
  reason?: string | null;
  redactedFields?: string[];
}

export interface CryptoActivityCanonicalProject {
  _id?: string;
  id?: string;
  slug?: string;
  name?: string;
  symbol?: string;
  logo?: string;
  image?: string;
  website?: string;
  socialLinks?: CryptoActivityApiSocialLinks;
}

export interface CryptoActivityApiReview {
  text?: string;
  html?: string;
  textHtml?: string;
  scores?: Array<{
    label: string;
    value: number | string;
  }>;
  isLocked?: boolean;
}

export interface CryptoActivityApiMetrics {
  riskLevel?: string;
  complexity?: string;
  timeRequired?: string;
  potentialReward?: string;
}

export interface CryptoActivityApiTimelineItem {
  title?: string;
  label?: string;
  date?: string | Date;
  description?: string;
}

export interface CryptoActivityApiFlags {
  green?: string[];
  yellow?: string[];
  red?: string[];
}

export interface CryptoActivityApiReactionCounts {
  like?: number;
  dislike?: number;
  hot?: number;
  interested?: number;
}

export interface CryptoActivityApiTaskGuide {
  title?: string;
  description?: string;
  descriptionHtml?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  successMessage?: string;
  isLocked?: boolean;
  steps?: Array<{
    id?: string;
    title?: string;
    description?: string;
    descriptionHtml?: string;
    timeEstimate?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    image?: string;
    video?: string;
  }>;
}

export interface CryptoActivityApiAsset {
  name?: string;
  symbol?: string;
  image?: string;
  logo?: string;
  slug?: string;
}

export interface CryptoActivityApiItem {
  _id?: string;
  id?: string | number;
  legacyActivityId?: string;
  legacyNumericId?: number;
  parserActivityId?: string;
  slug?: string;
  name?: string;
  symbol?: string;
  coinSlug?: string;
  coinName?: string;
  coinSymbol?: string;
  projectName?: string;
  logo?: string;
  projectLogo?: string;
  score?: string | number;
  status?: string;
  activityType?: string;
  category?: string;
  difficulty?: string;
  cost?: string;
  timeEstimate?: string;
  taskFrequency?: string;
  isHot?: boolean;
  isLocked?: boolean;
  nftRequired?: boolean;
  accessTier?: CryptoActivityAccessTier | string;
  publicationStatus?: string;
  isSponsored?: boolean;
  sponsoredPriority?: number;
  lifecycleStatus?: string;
  viewerAccess?: CryptoActivityViewerAccess;
  contentAccess?: {
    review?: CryptoActivityViewerAccess;
    taskGuide?: CryptoActivityViewerAccess;
  };
  isRedacted?: boolean;
  canonicalProjectId?: string | null;
  canonicalProject?: CryptoActivityCanonicalProject | null;
  reactionCounts?: CryptoActivityApiReactionCounts;
  likesCount?: number;
  dislikesCount?: number;
  likes?: string[];
  dislikes?: string[];
  rewardLabel?: string;
  sourceUrl?: string;
  originalUrl?: string;
  ecosystem?: string[];
  platform?: string[];
  tags?: string[];
  requirements?: string[];
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  approxStartDate?: string | Date | null;
  approxEndDate?: string | Date | null;
  description?: CryptoActivityApiDescription | string;
  rewardAmount?: number | string | null;
  rewards?: Array<string | {
    label?: string;
    value?: string;
    amount?: number | string;
    currency?: string;
    token?: string;
    description?: string;
  }>;
  participants?: number | null;
  relatedAssets?: CryptoActivityApiAsset[];
  fundsRaised?: number | string;
  totalRaised?: number | string;
  joinLink?: string;
  links?: CryptoActivityApiLink[];
  socialLinks?: CryptoActivityApiSocialLinks;
  videoGuides?: string[];
  investors?: any[];
  userState?: CryptoActivityUserState;
}

export interface CryptoActivityWorkspaceCalendar {
  added: boolean;
  eventsCount?: number;
  nextDate?: string | null;
  href?: string;
}

export interface CryptoActivityWorkspaceBoard {
  added: boolean;
  cardId?: string | null;
  status?: string | null;
  notePreview?: string | null;
  href?: string;
}

export interface CryptoActivityWorkspaceFomoTasks {
  count: number;
  available: number;
  inProgress: number;
  review: number;
  completed: number;
  totalXp: number;
  href?: string;
}

export interface CryptoActivityWorkspace {
  calendar: CryptoActivityWorkspaceCalendar;
  board: CryptoActivityWorkspaceBoard;
  fomoTasks: CryptoActivityWorkspaceFomoTasks;
}

export interface CryptoActivityApiDetail extends CryptoActivityApiItem {
  review?: CryptoActivityApiReview;
  metrics?: CryptoActivityApiMetrics;
  timeline?: CryptoActivityApiTimelineItem[];
  flags?: CryptoActivityApiFlags;
  taskGuide?: CryptoActivityApiTaskGuide;
  similarProjects?: CryptoActivityApiItem[];
  workspace?: CryptoActivityWorkspace;
}

export interface CryptoActivityListResponse {
  items: CryptoActivityApiItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CryptoActivityListParams {
  limit?: number;
  offset?: number;
  search?: string;
  type?: string;
  excludeType?: string;
  status?: string;
  lifecycleStatus?: string;
  accessTier?: CryptoActivityAccessTier;
  canonicalProjectId?: string;
  category?: string;
  difficulty?: string;
  sort?: string;
  hasInvestors?: boolean | string;
  favourite?: boolean | string;
  favorite?: boolean | string;
}

export interface CryptoActivityFilterOption {
  key: string;
  value: string;
  label: string;
  count: number;
}

export interface CryptoActivityFiltersResponse {
  total: number;
  otherActivityCount: number;
  activityTypes: CryptoActivityFilterOption[];
  categories: CryptoActivityFilterOption[];
}

export type CryptoActivityBoardTaskStatus = "todo" | "in-progress" | "completed";

export type CryptoActivityBoardTaskCategory =
  | "testnet"
  | "airdrop"
  | "quest"
  | "node"
  | "other";

export type CryptoActivityBoardTaskDifficulty = "high" | "medium" | "low";

export interface CryptoActivityBoardTaskApi {
  id: string;
  backendId?: string;
  activityId?: string;
  v2ActivityId?: string;
  columnId?: string;
  boardId?: string;
  sourceType?: "user-task" | "admin-task" | string;
  isSystem?: boolean;
  isGlobal?: boolean;
  canDelete?: boolean;
  canEdit?: boolean;
  accessTier?: CryptoActivityAccessTier | string;
  isPrime?: boolean;
  nftRequired?: boolean;
  isLocked?: boolean;
  isRedacted?: boolean;
  viewerAccess?: CryptoActivityViewerAccess;
  activityPath?: string;
  title?: string;
  projectLogo?: string;
  projectName: string;
  projectPlatform: string;
  category: CryptoActivityBoardTaskCategory;
  difficulty: CryptoActivityBoardTaskDifficulty;
  status: CryptoActivityBoardTaskStatus;
  isExpired?: boolean;
  daysLeft?: number;
  scheduledDate?: string;
  description?: string;
  descriptionHtml?: string;
  notes?: string;
  sourceUrl?: string;
  tags?: string[];
  rewards?: Array<string | { label?: string; value?: string }>;
  requirements?: string[];
  dayProgress?: { current: number; total: number; percent: number };
}

export interface CryptoActivityBoardColumnApi {
  id: string;
  backendId?: string;
  label: string;
  dotColor: string;
  tasks: CryptoActivityBoardTaskApi[];
}

export interface CryptoActivityBoardItemApi {
  id: string;
  label: string;
  count: number;
  icon: "all" | "airdrop" | "testnet" | "quest" | "node" | "other" | "folder";
}

export interface CryptoActivityBoardStatsApi {
  totalTasks: number;
  inProgress: number;
  completed: number;
  xpEarned: number;
  overallProgress: number;
}

export interface CryptoActivityBoardResponse {
  boards: CryptoActivityBoardItemApi[];
  columns: CryptoActivityBoardColumnApi[];
  stats: CryptoActivityBoardStatsApi;
  permissions?: {
    canManagePersonalBoard?: boolean;
  };
}

export interface CryptoActivityBoardParams {
  boardId?: string;
  search?: string;
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface CryptoActivityBoardTaskPayload {
  activityId?: string;
  boardId?: string;
  columnId?: string;
  title?: string;
  projectName?: string;
  projectPlatform?: string;
  projectLogo?: string;
  description?: string;
  category?: CryptoActivityBoardTaskCategory | string;
  difficulty?: CryptoActivityBoardTaskDifficulty | string;
  notes?: string;
  sourceUrl?: string;
  tags?: string[];
  rewards?: Array<string | { label?: string; value?: string }>;
  requirements?: string[];
  dueDate?: string | Date | null;
  scheduledDate?: string | Date | null;
  status?: CryptoActivityBoardTaskStatus | string;
  order?: number;
}

export interface CryptoActivityCalendarItem {
  id: string;
  activityId?: string;
  v2ActivityId?: string;
  boardTaskId?: string;
  title: string;
  description?: string;
  descriptionHtml?: string;
  type?: string;
  status?: string;
  project?: {
    id?: string;
    name?: string;
    symbol?: string;
    logo?: string;
  };
  date?: string;
  startDate?: string;
  endDate?: string;
  sourceUrl?: string;
  originalUrl?: string;
  source?: string;
  priority?: string;
  tags?: string[];
  rewards?: Array<string | { label?: string; value?: string }>;
  requirements?: string[];
  links?: CryptoActivityApiLink[];
  socialLinks?: CryptoActivityApiSocialLinks;
  sourceType?: "activity" | "saved-activity" | "board-task" | string;
  boardTask?: CryptoActivityBoardTaskApi;
  taskGuide?: CryptoActivityApiTaskGuide;
  accessTier?: "public" | "prime" | string;
  isPrime?: boolean;
  isSystem?: boolean;
  isGlobal?: boolean;
  canDelete?: boolean;
  canEdit?: boolean;
  isLocked?: boolean;
  nftRequired?: boolean;
  isRedacted?: boolean;
  activityPath?: string;
  viewerAccess?: CryptoActivityViewerAccess;
  contentAccess?: {
    review?: CryptoActivityViewerAccess;
    taskGuide?: CryptoActivityViewerAccess;
  };
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
}

export interface CryptoActivityCalendarParams {
  startDate?: string;
  endDate?: string;
  date?: string;
  month?: string;
  type?: string;
  status?: string;
  search?: string;
  project?: string;
  limit?: number;
  offset?: number;
}

export interface CryptoActivityCalendarResponse {
  items: CryptoActivityCalendarItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  startDate?: string;
  endDate?: string;
}
