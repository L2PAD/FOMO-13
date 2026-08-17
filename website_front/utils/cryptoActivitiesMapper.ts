import {
  CryptoActivityApiDetail,
  CryptoActivityApiItem,
  CryptoActivityApiSocialLinks,
} from "../types/cryptoActivities";
import {
  CardTag,
  EarlylandCardData,
  StatusType,
} from "../components/layouts/projects/Crypto/Earlyland/Feed/FeedCard/types";
import {
  ProjectDetailsData,
  SocialLink,
} from "../components/layouts/projects/Crypto/Earlyland/ProjectDetails/types";
import { hasMeaningfulActivityHtml } from "../helpers/activityRichText";

const SCORE_RANK: Record<string, number> = {
  NOT_RATED: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  VERY_HIGH: 4,
};

const emptyToUndefined = (value: any): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  if (!text || text.toUpperCase() === "TBA" || text.toLowerCase() === "undefined") {
    return undefined;
  }

  return text;
};

const richHtmlToUndefined = (value: any): string | undefined => {
  const html = emptyToUndefined(value);
  return html && hasMeaningfulActivityHtml(html) ? html : undefined;
};

const uniqueTextParts = (values: any[]): string | undefined => {
  const seen = new Set<string>();
  const parts = values
    .map(emptyToUndefined)
    .filter((value): value is string => Boolean(value))
    .filter((value) => {
      const key = value.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return parts.length ? parts.join("\n\n") : undefined;
};

const uniqueHtmlParts = (values: any[]): string | undefined => {
  const seen = new Set<string>();
  const parts = values
    .map(richHtmlToUndefined)
    .filter((value): value is string => Boolean(value))
    .filter((value) => {
      const key = value.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return parts.length ? parts.join("") : undefined;
};

export function mapBackendStatusToUiStatus(status?: string): StatusType | undefined {
  const normalized = String(status || "").replace(/[\s_-]/g, "").toUpperCase();

  if (normalized === "LIVE" || normalized === "ACTIVE") return "Active";
  if (normalized === "UPCOMING") return "Upcoming";
  if (normalized === "ENDED" || normalized === "CANCELED" || normalized === "CANCELLED") {
    return "Ended";
  }

  return emptyToUndefined(status) as StatusType | undefined;
}

export function mapUiStatusToBackendStatus(status?: string): string | undefined {
  const normalized = String(status || "").replace(/[\s_-]/g, "").toUpperCase();

  if (normalized === "ACTIVE" || normalized === "LIVE") return "active";
  if (normalized === "ENDINGSOON") return "active";
  if (normalized === "UPCOMING") return "upcoming";
  if (normalized === "ENDED" || normalized === "CANCELED" || normalized === "CANCELLED") {
    return "ended,cancelled";
  }

  return emptyToUndefined(status);
}

export function mapBackendActivityTypeToUiType(activityType?: string): string | undefined {
  const normalized = String(activityType || "").replace(/[\s_-]/g, "").toLowerCase();
  const map: Record<string, string> = {
    airdrop: "Airdrop",
    testnet: "Testnet",
    quest: "Quest",
    quests: "Quest",
    whitelist: "Whitelist",
    farming: "Farming",
    node: "Node",
    nodes: "Node",
    other: "Other",
    others: "Other",
  };

  return (
    map[normalized] ||
    (normalized.includes("quest") ? "Quest" : undefined) ||
    (normalized.includes("farming") ? "Farming" : undefined) ||
    (normalized.includes("node") ? "Node" : undefined) ||
    (normalized.includes("airdrop") ? "Airdrop" : undefined) ||
    (normalized.includes("testnet") ? "Testnet" : undefined) ||
    (normalized.includes("whitelist") ? "Whitelist" : undefined) ||
    emptyToUndefined(activityType)
  );
}

const getUtcDateParts = (
  value?: string | Date | null
): { year: number; month: number; day: number } | undefined => {
  const text = emptyToUndefined(value);
  if (!text) return undefined;

  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (isoDateMatch) {
    return {
      year: Number(isoDateMatch[1]),
      month: Number(isoDateMatch[2]) - 1,
      day: Number(isoDateMatch[3]),
    };
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return undefined;

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
};

const getProgressDateMs = (
  value?: string | Date | null,
  endOfDay = false
): number | undefined => {
  const parts = getUtcDateParts(value);
  if (!parts) return undefined;

  return Date.UTC(
    parts.year,
    parts.month,
    parts.day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );
};

export function calculateProgress(startDate?: string | Date | null, endDate?: string | Date | null) {
  const start = getProgressDateMs(startDate);
  const end = getProgressDateMs(endDate, true);
  const now = Date.now();

  if (start === undefined || end === undefined || end <= start) return undefined;
  if (now <= start) return 0;
  if (now >= end) return 100;

  return Math.round(((now - start) / (end - start)) * 100);
}

const isActiveActivityStatus = (status?: string): boolean => {
  const normalized = String(status || "").replace(/[\s_-]/g, "").toUpperCase();
  return normalized === "LIVE" || normalized === "ACTIVE";
};

const isDateInPast = (value?: string | Date | null): boolean => {
  const dateMs = getProgressDateMs(value, true);
  return dateMs !== undefined && Date.now() > dateMs;
};

const formatDate = (value?: string | Date | null): string | undefined => {
  const text = emptyToUndefined(value);
  if (!text) return undefined;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
};

const getActivityId = (activity: CryptoActivityApiItem): string => {
  return String(activity.slug || activity.coinSlug || activity._id || activity.id || "");
};

const getActivityInteractionId = (activity: CryptoActivityApiItem): string =>
  String(
    activity._id ||
    activity.id ||
    activity.legacyActivityId ||
    activity.parserActivityId ||
    activity.legacyNumericId ||
    getActivityId(activity)
  );

const getProjectName = (activity: CryptoActivityApiItem): string => {
  return (
    emptyToUndefined(activity.projectName) ||
    emptyToUndefined(activity.canonicalProject?.name) ||
    emptyToUndefined(activity.name) ||
    emptyToUndefined(activity.coinName) ||
    emptyToUndefined(activity.canonicalProject?.symbol) ||
    emptyToUndefined(activity.symbol) ||
    emptyToUndefined(activity.coinSymbol) ||
    "Activity"
  );
};

const getLogo = (activity: CryptoActivityApiItem): string | undefined => {
  return (
    emptyToUndefined(activity.projectLogo) ||
    emptyToUndefined(activity.logo) ||
    emptyToUndefined(activity.canonicalProject?.logo) ||
    emptyToUndefined(activity.canonicalProject?.image) ||
    emptyToUndefined(activity.relatedAssets?.[0]?.image) ||
    emptyToUndefined(activity.relatedAssets?.[0]?.logo)
  );
};

const getAccessTier = (activity: CryptoActivityApiItem): "public" | "prime" => {
  const normalized = String(activity.accessTier || "").trim().toLowerCase();
  if (normalized === "prime") return "prime";
  if (normalized === "public") return "public";
  if (activity.nftRequired) return "prime";
  return "public";
};

const getExplicitViewerAccess = (activity: CryptoActivityApiItem): boolean | undefined => {
  const access = activity.viewerAccess;
  const candidates = [
    access?.allowed,
    access?.canView,
    access?.hasAccess,
    access?.entitled,
    access?.isEntitled,
  ];

  return candidates.find((value): value is boolean => typeof value === "boolean");
};

const canViewActivitySection = (
  activity: CryptoActivityApiDetail,
  section: "review" | "taskGuide"
): boolean => {
  const access = activity.contentAccess?.[section];
  const isLocked = Boolean(
    section === "review" ? activity.review?.isLocked : activity.taskGuide?.isLocked
  );
  if (!access) return !isLocked;
  if (access.contentRedacted || access.isRedacted) return false;
  const explicit = [
    access.allowed,
    access.canView,
    access.hasAccess,
    access.entitled,
    access.isEntitled,
  ].find((value): value is boolean => typeof value === "boolean");
  if (explicit !== undefined) return explicit;
  return !isLocked;
};

export const isCryptoActivityRedacted = (activity: CryptoActivityApiItem): boolean =>
  Boolean(
    activity.isRedacted ||
    activity.viewerAccess?.isRedacted ||
    activity.viewerAccess?.contentRedacted
  );

export const canViewCryptoActivityContent = (activity: CryptoActivityApiItem): boolean => {
  if (isCryptoActivityRedacted(activity)) return false;

  const explicitAccess = getExplicitViewerAccess(activity);
  if (explicitAccess !== undefined) return explicitAccess;

  if (getAccessTier(activity) === "prime") return false;
  return !activity.isLocked;
};

const getCategory = (activity: CryptoActivityApiItem): string | undefined => {
  return (
    emptyToUndefined(activity.category) ||
    emptyToUndefined(activity.ecosystem?.[0]) ||
    emptyToUndefined(activity.platform?.[0])
  );
};

const getDescription = (
  activity: CryptoActivityApiItem
): string | undefined => {
  if (typeof activity.description === "string") return emptyToUndefined(activity.description);

  return emptyToUndefined(activity.description?.about);
};

const getDescriptionHtml = (
  activity: CryptoActivityApiItem
): string | undefined => {
  if (typeof activity.description === "string") return undefined;

  return richHtmlToUndefined(activity.description?.aboutHtml);
};

const getHowToParticipate = (activity: CryptoActivityApiDetail): string | undefined => {
  if (typeof activity.description === "string") return undefined;

  return uniqueTextParts([
    activity.description?.howToParticipate,
    activity.taskGuide?.description,
  ]);
};

const getHowToParticipateHtml = (activity: CryptoActivityApiDetail): string | undefined => {
  if (typeof activity.description === "string") {
    return richHtmlToUndefined(activity.taskGuide?.descriptionHtml);
  }

  return uniqueHtmlParts([
    activity.description?.howToParticipateHtml,
    activity.taskGuide?.descriptionHtml,
  ]);
};

const formatAmount = (value?: string | number | null): string | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return emptyToUndefined(value);
  if (numberValue <= 0) return undefined;

  return `$${numberValue.toLocaleString("en-US", { maximumFractionDigits: 1 })}`;
};

const getReward = (activity: CryptoActivityApiItem): string | undefined => {
  const firstReward = activity.rewards?.[0];
  const rewardAmount = typeof firstReward === "object"
    ? emptyToUndefined(firstReward.amount)
    : undefined;
  const rewardUnit = typeof firstReward === "object"
    ? emptyToUndefined(firstReward.token || firstReward.currency)
    : undefined;
  const rewardFromArray =
    typeof firstReward === "string"
      ? firstReward
      : firstReward?.label || firstReward?.value ||
        (rewardAmount ? `${rewardAmount}${rewardUnit ? ` ${rewardUnit}` : ""}` : undefined) ||
        firstReward?.description;

  return (
    emptyToUndefined(activity.rewardLabel) ||
    formatAmount(activity.rewardAmount) ||
    emptyToUndefined(rewardFromArray) ||
    "Potential reward"
  );
};

const getRaised = (activity: CryptoActivityApiItem): string | undefined => {
  return formatAmount(activity.fundsRaised || activity.totalRaised);
};

const getTaskType = (activity: CryptoActivityApiItem): string | undefined => {
  const frequency = emptyToUndefined(activity.taskFrequency);
  if (!frequency) return "Ongoing tasks";

  const normalized = frequency.toLowerCase();
  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return `${label} tasks`;
};

const getDetailTaskType = (activity: CryptoActivityApiItem): string | undefined => {
  const frequency = emptyToUndefined(activity.taskFrequency);
  if (!frequency) return undefined;

  const normalized = frequency.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const tagVariant = (tag: string): CardTag["variant"] => {
  const normalized = tag.toLowerCase();
  if (normalized.includes("deadline") || normalized.includes("ending")) return "deadline";
  if (normalized.includes("new") || normalized.includes("hot")) return "green";
  if (normalized.includes("mainnet") || normalized.includes("testnet")) return "type";

  return "default";
};

const getTags = (activity: CryptoActivityApiItem): CardTag[] => {
  return (activity.tags || [])
    .map((tag) => emptyToUndefined(tag))
    .filter((tag): tag is string => Boolean(tag))
    .slice(0, 3)
    .map((tag) => ({
      label: tag,
      variant: tagVariant(tag),
    }));
};

const getIsHot = (activity: CryptoActivityApiItem): boolean => {
  const score = String(activity.score || "").toUpperCase();
  return Boolean(activity.isHot || SCORE_RANK[score] >= SCORE_RANK.HIGH);
};

const toCount = (value: any): number | undefined => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) return undefined;
  return numberValue;
};

const getReactionCount = (
  activity: CryptoActivityApiItem,
  reaction: "like" | "dislike"
): number => {
  const legacyCount = reaction === "like" ? activity.likesCount : activity.dislikesCount;
  const legacyList = reaction === "like" ? activity.likes : activity.dislikes;

  return (
    toCount(activity.reactionCounts?.[reaction]) ??
    toCount(legacyCount) ??
    (Array.isArray(legacyList) ? legacyList.length : 0)
  );
};

export function mapCryptoActivityToFeedCard(activity: CryptoActivityApiItem): EarlylandCardData {
  const canViewContent = canViewCryptoActivityContent(activity);
  const startDate = activity.startDate || activity.approxStartDate;
  const endDate = activity.endDate || activity.approxEndDate;
  const isApproxOnlyRange = !activity.startDate && !activity.endDate;
  const shouldIgnorePastApproxProgress =
    isApproxOnlyRange &&
    isActiveActivityStatus(activity.lifecycleStatus || activity.status) &&
    isDateInPast(activity.approxEndDate);
  const progress = shouldIgnorePastApproxProgress
    ? undefined
    : calculateProgress(startDate, endDate);
  return {
    id: getActivityId(activity),
    interactionId: getActivityInteractionId(activity),
    projectLogo: getLogo(activity),
    projectName: getProjectName(activity),
    type: mapBackendActivityTypeToUiType(activity.activityType),
    isHot: getIsHot(activity),
    status: mapBackendStatusToUiStatus(activity.lifecycleStatus || activity.status),
    isFavourite: Boolean(activity.userState?.isFavourite),
    category: getCategory(activity),
    difficulty: emptyToUndefined(activity.difficulty),
    reward: canViewContent ? getReward(activity) : undefined,
    tags: getTags(activity),
    description: canViewContent ? getDescription(activity) : undefined,
    descriptionHtml: canViewContent ? getDescriptionHtml(activity) : undefined,
    timeEstimate: emptyToUndefined(activity.timeEstimate),
    cost: emptyToUndefined(activity.cost),
    raised: getRaised(activity),
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    progress: progress ?? 0,
    taskType: getTaskType(activity),
    isLocked: !canViewContent,
    hasFomoTasks: Boolean(activity.hasFomoTasks),
    fomoTasksCount: Number(activity.fomoTasksCount || 0),
    commentsCount: Number((activity as any).commentsCount || 0),
    isPrime: String(activity.accessTier || "").trim().toLowerCase() === "prime",
  };
}

const pushSocial = (
  links: SocialLink[],
  type: SocialLink["type"],
  url?: string
) => {
  const safeUrl = emptyToUndefined(url);
  if (!safeUrl) return;

  links.push({ type, url: safeUrl });
};

const mapSocialLinks = (
  socialLinks?: CryptoActivityApiSocialLinks,
  links?: Array<{ label: string; url: string }>
): SocialLink[] => {
  const result: SocialLink[] = [];

  pushSocial(result, "website", socialLinks?.website);
  pushSocial(result, "twitter", socialLinks?.twitter);
  pushSocial(result, "telegram", socialLinks?.telegram);
  pushSocial(result, "discord", socialLinks?.discord);
  pushSocial(result, "custom", socialLinks?.docs);

  socialLinks?.custom?.forEach((link) => pushSocial(result, "custom", link.url));
  links?.forEach((link) => pushSocial(result, "custom", link.url));

  const seen = new Set<string>();
  return result.filter((link) => {
    if (seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });
};

const isSafeNextImage = (url?: string): boolean => {
  const safeUrl = emptyToUndefined(url);
  if (!safeUrl) return false;
  if (safeUrl.startsWith("/")) return true;

  try {
    const parsed = new URL(safeUrl);
    return ["api.fomo.cx", "localhost", "cdn.sanity.io"].includes(parsed.hostname);
  } catch (error) {
    return false;
  }
};

export function mapCryptoActivityToProjectDetails(
  activity: CryptoActivityApiDetail
): ProjectDetailsData {
  const card = mapCryptoActivityToFeedCard(activity);
  const canViewContent = canViewCryptoActivityContent(activity);
  const canViewReview = canViewContent && canViewActivitySection(activity, "review");
  const canViewTasks = canViewContent && canViewActivitySection(activity, "taskGuide");
  const aboutText = canViewContent
    ? getDescription(activity)
    : undefined;
  const aboutHtml = canViewContent
    ? getDescriptionHtml(activity)
    : undefined;
  const taskDescription = canViewTasks ? getHowToParticipate(activity) : undefined;
  const taskDescriptionHtml = canViewTasks ? getHowToParticipateHtml(activity) : undefined;
  const completedStepIds = canViewTasks && Array.isArray(activity.userState?.completedStepIds)
    ? activity.userState?.completedStepIds || []
    : [];

  return {
    id: card.id,
    interactionId: card.interactionId,
    projectLogo: card.projectLogo,
    projectName: card.projectName || "Activity",
    type: card.type || "",
    status: card.status || "",
    isFavourite: card.isFavourite,
    userReaction: activity.userState?.reaction as ProjectDetailsData["userReaction"],
    likesCount: getReactionCount(activity, "like"),
    dislikesCount: getReactionCount(activity, "dislike"),
    isAddedToCalendar: Boolean(activity.userState?.isAddedToCalendar),
    completedStepIds,
    stepsCompleted: canViewTasks
      ? Number(activity.userState?.stepsCompleted || 0)
      : 0,
    stepsTotal: canViewTasks
      ? Number(activity.userState?.stepsTotal || activity.taskGuide?.steps?.length || 0)
      : 0,
    stepsProgress: canViewTasks
      ? Number(activity.userState?.stepsProgress || 0)
      : 0,
    cost: card.cost || "",
    category: card.category || "",
    difficulty: card.difficulty || "",
    reward: card.reward || "",
    taskType: getDetailTaskType(activity),
    startDate: card.startDate || "",
    endDate: card.endDate || "",
    progress: card.progress || 0,
    socialLinks: canViewContent
      ? mapSocialLinks(activity.socialLinks, activity.links)
      : [],
    aboutText,
    aboutHtml,
    totalRaised: getRaised(activity),
    fundingType: emptyToUndefined(activity.platform?.join(", ")),
    reviewText: canViewReview ? emptyToUndefined(activity.review?.text) : undefined,
    reviewHtml: canViewReview
      ? richHtmlToUndefined(activity.review?.textHtml) ||
        richHtmlToUndefined(activity.review?.html)
      : undefined,
    reviewScores: canViewReview
      ? activity.review?.scores?.map((score) => ({
        label: score.label,
        value: String(score.value),
      }))
      : undefined,
    isReviewLocked: !canViewReview,
    riskLevel: canViewContent ? emptyToUndefined(activity.metrics?.riskLevel) : undefined,
    complexity: canViewContent
      ? emptyToUndefined(activity.metrics?.complexity || card.difficulty)
      : undefined,
    timeRequired: canViewContent
      ? emptyToUndefined(activity.metrics?.timeRequired || card.timeEstimate)
      : undefined,
    potentialReward: canViewContent
      ? emptyToUndefined(activity.metrics?.potentialReward || card.reward)
      : undefined,
    timeline: canViewContent ? activity.timeline?.map((item) => ({
      label: item.label || item.title || "",
      date: formatDate(item.date) || "",
    })).filter((item) => item.label || item.date) : undefined,
    greenFlags: canViewContent ? activity.flags?.green?.map((text) => ({ text })) : undefined,
    yellowFlags: canViewContent ? activity.flags?.yellow?.map((text) => ({ text })) : undefined,
    redFlags: canViewContent ? activity.flags?.red?.map((text) => ({ text })) : undefined,
    taskTitle: canViewTasks
      ? (emptyToUndefined(activity.taskGuide?.title) ||
        (taskDescription || taskDescriptionHtml ? "How to participate" : undefined))
      : undefined,
    taskDescription,
    taskDescriptionHtml,
    taskCtaLabel: canViewTasks
      ? (emptyToUndefined(activity.taskGuide?.ctaLabel) ||
        (emptyToUndefined(activity.joinLink || activity.sourceUrl || activity.originalUrl)
          ? "Open activity"
          : undefined))
      : undefined,
    taskCtaUrl: canViewTasks
      ? emptyToUndefined(activity.taskGuide?.ctaUrl || activity.joinLink || activity.sourceUrl || activity.originalUrl)
      : undefined,
    steps: canViewTasks ? activity.taskGuide?.steps?.map((step, index) => ({
      id: emptyToUndefined(step.id) || `step-${index + 1}`,
      title: emptyToUndefined(step.title) || `Step ${index + 1}`,
      description: emptyToUndefined(step.description) || "",
      descriptionHtml: richHtmlToUndefined(step.descriptionHtml),
      timeEstimate: emptyToUndefined(step.timeEstimate),
      ctaLabel: emptyToUndefined(step.ctaLabel),
      ctaUrl: emptyToUndefined(step.ctaUrl),
      image: isSafeNextImage(step.image) ? step.image : undefined,
      isCompleted: completedStepIds.includes(emptyToUndefined(step.id) || `step-${index + 1}`),
    })) : undefined,
    taskSuccessMessage: canViewTasks
      ? emptyToUndefined(activity.taskGuide?.successMessage)
      : undefined,
    isTasksLocked: !canViewTasks,
    workspace: (activity as any).workspace || undefined,
    similarProjects: activity.similarProjects?.map(mapCryptoActivityToFeedCard),
  };
}
