import getAccessToken from "../utils/getAccessToken";
import { configureUrl } from "./config";

export interface BadgeCondition {
  metric: string;
  op: ">=" | ">" | "=" | "<=" | "<";
  value: number;
  unit?: string;
  label?: string;
}
export interface BadgeDefinition {
  code: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  rarity?: string;
  active?: boolean;
  awardMode?: "automatic" | "manual" | "both";
  criteria?: { logic: "AND" | "OR"; conditions: BadgeCondition[] };
  xpReward?: number;
  displayPriority?: number;
  publicVisible?: boolean;
  hiddenProgress?: boolean;
  retentionMode?: "permanent" | "dynamic";
}

const authHeaders = () => ({
  Authorization: `Bearer ${getAccessToken()}`,
  "Content-Type": "application/json",
});

type Res<T> = { success: boolean; data: T | any };

const call = async <T>(path: string, method: string, body?: any): Promise<Res<T>> => {
  try {
    const res = await fetch(configureUrl(path), {
      method,
      headers: authHeaders(),
      credentials: "include",
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    return { success: res.status < 300, data };
  } catch (error) {
    return { success: false, data: error };
  }
};

export const fetchBadgeDefs = () => call<BadgeDefinition[]>("admin/badges", "GET");
export const createBadgeDef = (b: BadgeDefinition) => call<BadgeDefinition>("admin/badges", "POST", b);
export const updateBadgeDef = (code: string, b: Partial<BadgeDefinition>) => call<BadgeDefinition>(`admin/badges/${encodeURIComponent(code)}`, "PUT", b);
export const deleteBadgeDef = (code: string) => call(`admin/badges/${encodeURIComponent(code)}`, "DELETE");
export const fetchBadgeHistory = (userId?: string) => call<any[]>(`admin/badges/history${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`, "GET");
export const fetchBadgeDiagnostics = () => call<any>("admin/badges/diagnostics", "GET");
export const fetchBadgeAnalytics = () => call<any>("admin/badges/analytics", "GET");
export const awardUserBadge = (userId: string, code: string, reason: string) => call(`admin/users/${encodeURIComponent(userId)}/badges/${encodeURIComponent(code)}`, "POST", { reason });
export const revokeUserBadge = (userId: string, code: string, reason: string) => call(`admin/users/${encodeURIComponent(userId)}/badges/${encodeURIComponent(code)}`, "DELETE", { reason });
export const fetchUserBadges = (userId: string) => call<{ badges: any[] }>(`users/${encodeURIComponent(userId)}/badges`, "GET");

// Human-readable metadata for the Rule Builder.
export const BADGE_CATEGORIES = [
  "STAKING", "SPACEPORT", "TRADE", "ACTIVITY", "REFERRAL", "NFT", "CONTENT", "PORTFOLIO", "EARLYLAND", "CONTRIBUTION", "LAUNCHPAD", "SPECIAL",
];
export const BADGE_RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];
export const BADGE_AWARD_MODES = ["automatic", "manual", "both"];
export const BADGE_RETENTION = ["permanent", "dynamic"];
export const BADGE_OPERATORS = [">=", ">", "=", "<=", "<"];

// Metric catalog grouped by category (label + unit) for the builder dropdown.
export const METRIC_CATALOG: Record<string, { metric: string; label: string; unit: string }[]> = {
  STAKING: [{ metric: "stakingDays", label: "Совокупный подтверждённый стейкинг", unit: "дней" }],
  SPACEPORT: [
    { metric: "stakingDays", label: "Совокупный подтверждённый стейкинг", unit: "дней" },
    { metric: "xp", label: "Всего XP", unit: "XP" },
    { metric: "accountLevel", label: "Уровень SpacePort", unit: "уровень" },
    { metric: "launchpads", label: "Участий в launchpad", unit: "раундов" },
    { metric: "otcVolumeUsd", label: "Объём OTC", unit: "USD" },
    { metric: "tasks", label: "Выполнено задач", unit: "задач" },
    { metric: "primeProjects", label: "Prime проектов", unit: "проектов" },
  ],
  TRADE: [
    { metric: "tradesCompleted", label: "Подтверждённых сделок", unit: "сделок" },
    { metric: "uniqueCounterparties", label: "Уникальных контрагентов", unit: "контрагентов" },
    { metric: "tradeScore", label: "Trade Score", unit: "баллов" },
    { metric: "otcVolumeUsd", label: "Объём OTC", unit: "USD" },
  ],
  ACTIVITY: [
    { metric: "activeDays30", label: "Активных дней (окно 30д)", unit: "дней" },
    { metric: "activeDays90", label: "Активных дней (окно 90д)", unit: "дней" },
    { metric: "activeDays365", label: "Активных дней (окно 365д)", unit: "дней" },
    { metric: "xp", label: "Всего XP", unit: "XP" },
    { metric: "tasks", label: "Выполнено задач", unit: "задач" },
  ],
  REFERRAL: [{ metric: "qualifiedReferralsL1", label: "Квалифицированных рефералов", unit: "рефералов" }],
  NFT: [
    { metric: "nftActive", label: "Активный NFT-доступ (1/0)", unit: "" },
    { metric: "nftMembershipDays", label: "Возраст членства", unit: "дней" },
  ],
  CONTENT: [{ metric: "publishedIdeas", label: "Опубликовано идей", unit: "идей" }],
  PORTFOLIO: [
    { metric: "publicPortfolio", label: "Публичный портфель (1/0)", unit: "" },
    { metric: "portfolioAgeDays", label: "Возраст портфеля", unit: "дней" },
    { metric: "qualifiedPortfolioUpdates", label: "Качественных обновлений", unit: "обновлений" },
  ],
  EARLYLAND: [{ metric: "verifiedCampaigns", label: "Verified кампаний", unit: "кампаний" }],
  CONTRIBUTION: [{ metric: "verifiedReports", label: "Verified отчётов", unit: "отчётов" }],
  LAUNCHPAD: [{ metric: "launchpads", label: "Участий в launchpad", unit: "раундов" }],
  SPECIAL: [],
};

export const allMetrics = () => {
  const out: { metric: string; label: string; unit: string }[] = [];
  Object.values(METRIC_CATALOG).forEach((arr) => arr.forEach((m) => { if (!out.find((x) => x.metric === m.metric)) out.push(m); }));
  return out;
};
