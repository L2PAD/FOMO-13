import {
  BackersAnalyticsResponse,
  BackersAnalyticsChartItem,
} from "../../../../../../http/funds/fetchFundsAnalytics";
import { IFund } from "../../../../../../types/global_types";

export type PerformanceTab = "30D" | "90D" | "6M" | "YTD" | "All Time";

export type PerformanceLine = {
  label: string;
  color: string;
};

export type PerformanceChartPoint = {
  name: string;
  date?: string;
  companyType?: string;
  totalInvestment?: number;
  keyProjects?: Array<{ name: string; amount: number; category?: string }>;
  categories?: string[];
  [key: string]: any;
};

export type GrowthProjectItem = {
  logo?: string;
  name: string;
  nich?: string;
  a: number;
  b: number;
};

export type GrowthCategoryItem = {
  name: string;
  a: number;
  b: number;
  items: GrowthProjectItem[];
};

export type FundPerformanceData = {
  roiLines: PerformanceLine[];
  roiByTab: Record<PerformanceTab, PerformanceChartPoint[]>;
  roiLabels: Array<number>;
  growthByTab: Record<PerformanceTab, GrowthCategoryItem[]>;
};

const tabs: PerformanceTab[] = ["30D", "90D", "6M", "YTD", "All Time"];

const emptyByTab = <T,>(fallback: T): Record<PerformanceTab, T> =>
  tabs.reduce(
    (result, tab) => ({
      ...result,
      [tab]: fallback,
    }),
    {} as Record<PerformanceTab, T>,
  );

const toNumber = (value: any): number => {
  const parsed = Number(
    typeof value === "string"
      ? value.replace(/[$,%\sxX]/g, "").replace(/,/g, "")
      : value,
  );

  return Number.isFinite(parsed) ? parsed : 0;
};

const toDate = (value: any): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getCutoff = (tab: PerformanceTab): Date | null => {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  if (tab === "30D") return new Date(now.getTime() - 30 * day);
  if (tab === "90D") return new Date(now.getTime() - 90 * day);
  if (tab === "6M") return new Date(now.getTime() - 183 * day);
  if (tab === "YTD") return new Date(now.getFullYear(), 0, 1);
  return null;
};

const normalizeKey = (value: any): string =>
  String(value || "")
    .trim()
    .toLowerCase();

const getProjectKey = (project: any): string =>
  normalizeKey(project?.slug || project?.projectSlug || project?.id || project?.name);

const getProjectName = (project: any): string =>
  String(project?.name || project?.projectName || project?.symbol || "-");

const getFirstArrayValue = (value: any): string => {
  if (Array.isArray(value)) {
    const firstValue = value.find((item) => item);
    return firstValue ? String(firstValue) : "";
  }

  return value ? String(value) : "";
};

const getProjectCategory = (project: any, round?: any): string =>
  String(
    project?.category ||
      getFirstArrayValue(project?.categories) ||
      project?.sector ||
      project?.niche ||
      project?.stage ||
      round?.projectCategory ||
      round?.category ||
      round?.stage ||
      "Other",
  );

const getProjectLogo = (project: any, round?: any): string =>
  String(
    project?.logo ||
      project?.image ||
      project?.avatar ||
      project?.metadataLogo ||
      project?.projectLogo ||
      round?.projectLogo ||
      round?.logo ||
      "",
  );

const getProjectRoi = (project: any, round?: any): number =>
  toNumber(
    project?.roi ??
      project?.currentRoi ??
      project?.roiUsd ??
      project?.usdRoi ??
      project?.athRoi ??
      project?.roiData?.roi ??
      project?.xfromIco?.USD ??
      round?.roi ??
      round?.currentRoi ??
      round?.roiUsd ??
      round?.usdRoi,
  );

const getRoundKey = (round: any): string =>
  normalizeKey(round?.projectSlug || round?.slug || round?.projectName || round?.name);

const getRoundDate = (round: any): Date | null =>
  toDate(
    round?.date ||
      round?.roundDate ||
      round?.lastRoundDate ||
      round?.startDate ||
      round?.endDate,
  );

const getFundRoiMultiplier = (fund: IFund): number => {
  const roi = toNumber(fund.roi || fund.averageRoi);
  if (!roi) return 1;
  return roi > 20 ? 1 + roi / 100 : roi;
};

const getSupportedProjects = (fund: IFund): any[] => {
  const legacyPortfolio = (fund.investmentPorfolio || []).map((item: any) => ({
    ...(item.project || {}),
    stage: item.investedRound,
    amount: item.investedAmount,
    roi: item.currentRoi,
    status: item.status,
    exitDate: item.exitDate,
    exitRoi: item.exitRoi,
  }));

  return [
    ...(fund.supportedProjects || []),
    ...(fund.supportedProjectsPreview || []),
    ...legacyPortfolio,
    ...(fund.portfolioCoins || []),
    ...((fund.projects || []) as any[]).filter((project: any) => typeof project === "object"),
  ].filter((project: any) => getProjectName(project) !== "-");
};

const getRounds = (fund: IFund): any[] => {
  const rounds: any[] = fund.fundraisingRounds?.length
    ? (fund.fundraisingRounds as any[])
    : ((fund.activities || []) as any[]);

  return rounds.filter(Boolean);
};

const buildRoundLookup = (rounds: any[]): Map<string, any> => {
  const lookup = new Map<string, any>();

  rounds.forEach((round) => {
    const key = getRoundKey(round);
    if (key && !lookup.has(key)) lookup.set(key, round);
  });

  return lookup;
};

const buildProjectRows = (fund: IFund) => {
  const rounds = getRounds(fund);
  const roundLookup = buildRoundLookup(rounds);
  const seen = new Set<string>();
  const projectRows = getSupportedProjects(fund)
    .map((project) => {
      const key = getProjectKey(project);
      if (!key || seen.has(key)) return null;
      seen.add(key);
      const round = roundLookup.get(key);
      const date =
        toDate(
          project?.roundDate ||
            project?.date ||
            project?.lastRoundDate ||
            project?.lastFunding ||
            project?.startDate,
        ) ||
        getRoundDate(round) ||
        toDate(fund.lastRoundDate || fund.lastFunding);
      const amount = toNumber(
        project?.amount ||
          project?.fundsRaised ||
          project?.totalRaised ||
          project?.investedAmount ||
          round?.amount ||
          round?.fundsRaised ||
          round?.raised,
      );
      const roi = getProjectRoi(project, round);

      return {
        key,
        name: getProjectName(project),
        slug: project?.slug || project?.projectSlug,
        logo: getProjectLogo(project, round),
        category: getProjectCategory(project, round),
        stage: String(project?.stage || round?.stage || round?.roundName || "-"),
        date,
        amount,
        roi,
        status: String(project?.status || ""),
        exitDate: project?.exitDate,
        exitRoi: toNumber(project?.exitRoi),
      };
    })
    .filter(Boolean) as ProjectRow[];

  const roundRows = rounds
    .map((round) => {
      const key = getRoundKey(round);
      if (!key || seen.has(key)) return null;
      seen.add(key);

      const name = getProjectName({
        name: round?.projectName || round?.name || round?.coinSymbol || round?.coinSlug,
      });
      if (name === "-") return null;

      return {
        key,
        name,
        slug: round?.projectSlug || round?.slug || round?.coinSlug,
        logo: getProjectLogo({}, round),
        category: getProjectCategory({}, round),
        stage: String(round?.stage || round?.roundName || round?.round || "-"),
        date: getRoundDate(round) || toDate(fund.lastRoundDate || fund.lastFunding),
        amount: toNumber(round?.amount || round?.fundsRaised || round?.raised),
        roi: getProjectRoi({}, round),
        status: String(round?.status || ""),
        exitDate: round?.exitDate,
        exitRoi: toNumber(round?.exitRoi),
      };
    })
    .filter(Boolean) as ProjectRow[];

  return [...projectRows, ...roundRows];
};

type ProjectRow = {
    key: string;
    name: string;
    slug?: string;
    logo: string;
    category: string;
    stage: string;
    date: Date | null;
    amount: number;
    roi: number;
    status: string;
    exitDate?: string;
    exitRoi?: number;
};

const getFallbackInvestmentPerProject = (
  fund: IFund,
  projectRows: ProjectRow[],
): number => {
  const hasProjectInvestment = projectRows.some((project) => project.amount > 0);
  if (hasProjectInvestment || !projectRows.length) return 0;

  const fundInvestment = toNumber(
    fund.currentAum || fund.investAmount || fund.totalRaised || fund.stats?.totalInvestedAmount,
  );

  return fundInvestment > 0 ? fundInvestment / projectRows.length : 0;
};

const getEffectiveAmount = (
  project: ProjectRow,
  fallbackInvestmentPerProject: number,
): number => project.amount || fallbackInvestmentPerProject;

const getAnalyticsPeriod = (
  analytics: BackersAnalyticsResponse | undefined,
  tab: PerformanceTab,
): BackersAnalyticsChartItem[] => {
  if (!analytics) return [];
  if (tab === "30D") return analytics.topSectorsByPeriod.chart30d || [];
  if (tab === "90D") return analytics.topSectorsByPeriod.chart90d || [];
  if (tab === "6M") return analytics.topSectorsByPeriod.chart1y || [];
  if (tab === "YTD") return analytics.topSectorsByPeriod.chart1y || [];
  return analytics.topSectorsByPeriod.chartAll || analytics.topSectors || [];
};

const buildGrowthFromAnalytics = (
  fund: IFund,
  analytics: BackersAnalyticsResponse | undefined,
  tab: PerformanceTab,
  roiByProjectName: Map<string, number>,
): GrowthCategoryItem[] => {
  const fundRoi = getFundRoiMultiplier(fund);

  return getAnalyticsPeriod(analytics, tab)
    .slice(0, 8)
    .map((category) => {
      const topProjects = (category.topProjects || []).slice(0, 4).map((project) => {
        const amount = toNumber(project.amount);
        const roi = roiByProjectName.get(normalizeKey(project.name)) || fundRoi;

        return {
          logo: project.logo || project.image,
          name: project.name || "-",
          nich: category.label,
          a: amount,
          b: amount * Math.max(roi, 1),
        };
      });
      const invested = toNumber(category.value);
      const valuation = topProjects.length
        ? topProjects.reduce((sum, project) => sum + project.b, 0)
        : invested * Math.max(fundRoi, 1);

      return {
        name: category.label,
        a: invested,
        b: valuation,
        items: topProjects,
      };
    })
    .filter((item) => item.a > 0 || item.b > 0);
};

const buildGrowthFromProjects = (
  fund: IFund,
  projectRows: ProjectRow[],
  tab: PerformanceTab,
): GrowthCategoryItem[] => {
  const cutoff = getCutoff(tab);
  const filteredRows = projectRows.filter((project) => {
    if (!cutoff || !project.date) return true;
    return project.date >= cutoff;
  });
  const rows = filteredRows.length ? filteredRows : projectRows;
  const fundRoi = getFundRoiMultiplier(fund);
  const fallbackInvestmentPerProject = getFallbackInvestmentPerProject(fund, rows);
  const grouped = new Map<string, GrowthCategoryItem>();

  rows.forEach((project) => {
    const category = project.category || "Other";
    const invested = getEffectiveAmount(project, fallbackInvestmentPerProject);
    const roi = project.roi || fundRoi;
    const currentValue = invested ? invested * Math.max(roi, 1) : 0;
    const existing =
      grouped.get(category) ||
      ({
        name: category,
        a: 0,
        b: 0,
        items: [],
      } as GrowthCategoryItem);

    existing.a += invested;
    existing.b += currentValue;
    existing.items.push({
      logo: project.logo,
      name: project.name,
      nich: project.category,
      a: invested,
      b: currentValue,
    });
    grouped.set(category, existing);
  });

  return Array.from(grouped.values())
    .map((category) => ({
      ...category,
      items: category.items
        .sort((a, b) => b.a - a.a)
        .slice(0, 4),
    }))
    .sort((a, b) => b.a - a.a)
    .slice(0, 8);
};

const buildGrowth = (
  fund: IFund,
  analytics: BackersAnalyticsResponse | undefined,
  projectRows: ReturnType<typeof buildProjectRows>,
) => {
  const roiByProjectName = new Map<string, number>();
  projectRows.forEach((project) => {
    if (project.roi > 0) roiByProjectName.set(normalizeKey(project.name), project.roi);
  });

  return tabs.reduce((result, tab) => {
    const analyticsItems = buildGrowthFromAnalytics(
      fund,
      analytics,
      tab,
      roiByProjectName,
    );

    result[tab] = analyticsItems.length
      ? analyticsItems
      : buildGrowthFromProjects(fund, projectRows, tab);

    return result;
  }, {} as Record<PerformanceTab, GrowthCategoryItem[]>);
};

export const buildFundPerformanceData = (
  fund: IFund,
  analytics?: BackersAnalyticsResponse,
): FundPerformanceData => {
  const projectRows = buildProjectRows(fund);

  return {
    roiLines: [],
    roiByTab: emptyByTab<PerformanceChartPoint[]>([]),
    roiLabels: [1, 0.8, 0.7, 0.5, 0.3, 0.2, 0],
    growthByTab: buildGrowth(fund, analytics, projectRows),
  };
};
