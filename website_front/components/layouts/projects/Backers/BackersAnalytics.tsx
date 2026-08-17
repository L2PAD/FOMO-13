import React, { useMemo } from "react";
import { useQuery } from "react-query";
import BarDoubleChart, {
  BarDoubleChartDataItem,
} from "../../../global/common/BarDoubleChart";
import LineDoubleChart, {
  LineDoubleChartPoint,
} from "../../../global/common/LineDoubleChart";
import GlobalMap from "../../../global/GlobalMap";
import NewsBlock from "../../../global/NewsBlock";
import UniversalBarChart from "../../../global/common/BarChart";
import Placeholder from "../../../global/common/Placeholder";
import RegionalPieGraphic from "../Crypto/Project/Fundraising/RegionalPie";
import fetchBackersFundsAnalytics, {
  BackersAnalyticsChartItem,
  BackersAnalyticsCountryItem,
  BackersFundingDynamics,
} from "../../../../http/backers/fetchBackersFundsAnalytics";
import fetchBackersPersonsAnalytics, {
  PersonsAnalyticsChartItem,
  PersonsAnalyticsCountryItem,
} from "../../../../http/backers/fetchBackersPersonsAnalytics";
import { PieContentWrapper, SectionTitle } from "../Persons/styles";
import {
  ChartsWrapper as FundsAnalyticsWrapper,
  HeaderCharts,
  MapWrapper,
  NewsTitle,
  NewsWrapepr,
} from "../Funds/styles";
import { PieWrapper } from "../Crypto/Project/Fundraising/styles";
import {
  BackersDesktopAnalyticsOnly,
  BackersPersonsAnalytics,
} from "./styles";

type BackersTab = "Funds" | "Persons" | "Ecosystem";

interface IBackersAnalyticsProps {
  activeTab: BackersTab;
  fundsQueryString?: string;
  personsQueryString?: string;
  translateText: (value: string) => string;
}

const excludedAnalyticsParams = new Set([
  "page",
  "limit",
  "sortBy",
  "sortOrder",
  "quickFilter",
]);

const sanitizeAnalyticsQueryString = (queryString = "") => {
  const params = new URLSearchParams(queryString.replace(/^\?/, ""));

  excludedAnalyticsParams.forEach((key) => params.delete(key));

  const nextQueryString = params.toString();
  return nextQueryString ? `?${nextQueryString}` : "";
};

const toFiniteNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const normalizeLabel = (value: unknown): string => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || "Unknown";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const properties =
      record.properties && typeof record.properties === "object"
        ? (record.properties as Record<string, unknown>)
        : {};
    return normalizeLabel(
      record.name ||
        record.label ||
        record.displayName ||
        record.title ||
        record.country ||
        record.region ||
        properties.name ||
        record.id ||
        record.code
    );
  }

  return "Unknown";
};

const toPercent = (value: number, total: number) => {
  if (!total) return 0;

  return Math.round((value / total) * 10000) / 100;
};

const isKnownRegionLabel = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return (
    Boolean(normalized) &&
    !["unknown", "n/a", "na", "none"].includes(normalized)
  );
};

const splitAlternatingChartItems = <T extends { value: number }>(
  items: T[]
) => {
  const positiveItems = items.filter((_, index) => index % 2 === 0);
  const negativeItems = items.filter((_, index) => index % 2 === 1);

  return { positiveItems, negativeItems };
};

const toVisualBarValue = (value: number, maxValue: number) => {
  if (!value || !maxValue) return 0;

  const scaledValue = (Math.log1p(value) / Math.log1p(maxValue)) * 100;
  return Math.max(3, Math.round(scaledValue * 100) / 100);
};

const allocationTabs = [
  { label: "90D", key: "90D" },
  { label: "1Y", key: "1Y" },
  { label: "ALL", key: "ALL" },
];

const mapSectorsToBarChartData = (
  items: BackersAnalyticsChartItem[] = []
): BarDoubleChartDataItem[] => {
  const normalizedItems = items
    .map((item) => ({
      label: normalizeLabel(item?.label),
      value: toFiniteNumber(item?.value),
      projectsCount: toFiniteNumber(item?.projectsCount || item?.value),
      topProjects: Array.isArray(item?.topProjects) ? item.topProjects : [],
    }))
    .filter((item) => item.value > 0)
    .sort((firstItem, secondItem) => secondItem.value - firstItem.value)
    .slice(0, 20);
  const total = normalizedItems.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...normalizedItems.map((item) => item.value), 0);
  const { positiveItems, negativeItems } =
    splitAlternatingChartItems(normalizedItems);
  const rowsCount = Math.max(positiveItems.length, negativeItems.length);

  return Array.from({ length: rowsCount }, (_, index) => {
    const item = positiveItems[index];
    const secondItem = negativeItems[index];
    const firstShare = item ? toPercent(item.value, total) : 0;
    const secondShare = secondItem ? toPercent(secondItem.value, total) : 0;
    const firstDisplayValue = item ? toVisualBarValue(item.value, maxValue) : 0;
    const secondDisplayValue = secondItem
      ? toVisualBarValue(secondItem.value, maxValue)
      : 0;

    return {
      name: item?.label || "",
      name2: secondItem?.label || "",
      grow: firstDisplayValue,
      drop: secondItem ? -secondDisplayValue : 0,
      tooltipValue1: firstShare,
      tooltipValue2: secondItem ? -secondShare : 0,
      marketCapShare1: firstShare,
      marketCapShare2: secondShare,
      gainers1: item?.projectsCount || 0,
      gainers2: secondItem?.projectsCount || 0,
      losers1: 0,
      losers2: 0,
      topProjects1: item?.topProjects || [],
      topProjects2: secondItem?.topProjects || [],
      countLabel: "Projects",
      shareLabel: "Allocation Share",
    };
  }).filter((item) => item.name || item.name2);
};

const mapFundingPoints = (
  points: BackersFundingDynamics[keyof BackersFundingDynamics] = []
): LineDoubleChartPoint[] =>
  points
    .map((point) => ({
      ...point,
      name: normalizeLabel(point?.name),
      totalInvestment: toFiniteNumber(point?.totalInvestment),
      categories: Array.isArray(point?.categories)
        ? point.categories.map(normalizeLabel)
        : [],
      keyProjects: Array.isArray(point?.keyProjects)
        ? point.keyProjects
            .map((project) => ({
              name: normalizeLabel(project?.name),
              amount: toFiniteNumber(project?.amount),
              category: project?.category,
            }))
            .filter((project) => project.amount > 0)
        : [],
      investments0: toFiniteNumber(point?.investments0),
      investments1: toFiniteNumber(point?.investments1),
      investments2: toFiniteNumber(point?.investments2),
      investments3: toFiniteNumber(point?.investments3),
      investments4: toFiniteNumber(point?.investments4),
      investments5: toFiniteNumber(point?.investments5),
    }))
    .filter((point) => point.totalInvestment > 0);

const mapCountriesToMapData = (countries: BackersAnalyticsCountryItem[] = []) =>
  countries
    .map((item) => ({
      country: normalizeLabel(item?.country),
      countryCode: item?.countryCode
        ? normalizeLabel(item.countryCode).toUpperCase()
        : undefined,
      value: toFiniteNumber(item?.value),
    }))
    .filter((item) => item.value > 0);

const mapPersonsBarData = (items: PersonsAnalyticsChartItem[] = []) => {
  const normalizedItems = items
    .map((item) => ({
      name: normalizeLabel(item?.label),
      value: toFiniteNumber(item?.value),
      topRoles: normalizeLabel(item?.topRoles || "-"),
      keyRegions: normalizeLabel(item?.keyRegions || "-"),
      sectors: normalizeLabel(item?.sectors || item?.label),
      topProjects: normalizeLabel(item?.topProjects || "-"),
      growth: normalizeLabel(item?.growth || "-"),
    }))
    .filter((item) => item.value > 0)
    .sort((firstItem, secondItem) => secondItem.value - firstItem.value);
  const total = normalizedItems.reduce((sum, item) => sum + item.value, 0);

  return normalizedItems.slice(0, 9).map((item) => ({
    name: item.name,
    value: item.value,
    uv: item.value,
    perPersons: `${toPercent(item.value, total)}%`,
    numPersons: item.value,
    topRoles: item.topRoles,
    keyRegions: item.keyRegions,
    sectors: item.sectors,
    topProjects: item.topProjects,
    growth: item.growth,
  }));
};

const mapPersonsCountriesToPieData = (
  countries: PersonsAnalyticsCountryItem[] = []
) => {
  const normalizedCountries = countries
    .map((item) => ({
      name: normalizeLabel(item?.country),
      country: normalizeLabel(item?.country),
      countryCode: item?.countryCode
        ? normalizeLabel(item.countryCode).toUpperCase()
        : undefined,
      regionLabel: item?.countryCode
        ? `${normalizeLabel(item?.country)} (${normalizeLabel(item.countryCode).toUpperCase()})`
        : normalizeLabel(item?.country),
      value: toFiniteNumber(item?.value),
    }))
    .filter((item) => item.value > 0 && isKnownRegionLabel(item.country))
    .sort((firstItem, secondItem) => secondItem.value - firstItem.value);
  const total = normalizedCountries.reduce((sum, item) => sum + item.value, 0);
  const visibleCountries = normalizedCountries.slice(0, 4);
  const otherValue = normalizedCountries
    .slice(4)
    .reduce((sum, item) => sum + item.value, 0);
  const chartCountries =
    otherValue > 0
      ? [
          ...visibleCountries,
          {
            name: "Other",
            country: "Other",
            regionLabel: "Other",
            value: otherValue,
          },
        ]
      : normalizedCountries.slice(0, 5);

  return chartCountries.map((item) => {
    const percentage = toPercent(item.value, total);

    return {
      ...item,
      percentage,
      perPersons: `${percentage}% of known persons`,
      numPersons: item.value,
      totalPersons: total,
    };
  });
};

const getPercentLabels = (items: Array<{ value: number }>) => {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const maxPercent = total
    ? Math.max(...items.map((item) => toPercent(item.value, total)))
    : 50;
  const step = Math.max(10, Math.ceil(maxPercent / 5 / 10) * 10);

  return Array.from(
    { length: 6 },
    (_, index) => `${Math.max(step * (5 - index), 0)}%`
  );
};

const BackersAnalytics = ({
  activeTab,
  fundsQueryString,
  personsQueryString,
  translateText,
}: IBackersAnalyticsProps) => {
  const analyticsQueryString = useMemo(
    () => sanitizeAnalyticsQueryString(fundsQueryString),
    [fundsQueryString]
  );
  const personsAnalyticsQueryString = useMemo(
    () => sanitizeAnalyticsQueryString(personsQueryString),
    [personsQueryString]
  );
  const { data: analyticsResult, isLoading } = useQuery(
    ["backers-funds-analytics", analyticsQueryString],
    () => fetchBackersFundsAnalytics(analyticsQueryString),
    {
      enabled: activeTab === "Funds",
      refetchOnWindowFocus: false,
    }
  );
  const {
    data: personsAnalyticsResult,
    isLoading: isPersonsAnalyticsLoading,
    isFetching: isPersonsAnalyticsFetching,
  } = useQuery(
    ["backers-persons-analytics", personsAnalyticsQueryString],
    () => fetchBackersPersonsAnalytics(personsAnalyticsQueryString),
    {
      enabled: activeTab === "Persons",
      refetchOnWindowFocus: false,
    }
  );
  const analytics = analyticsResult?.data;
  const analyticsLoading = isLoading && !analyticsResult;
  const personsAnalytics = personsAnalyticsResult?.data;
  const personsAnalyticsLoading =
    isPersonsAnalyticsLoading && !personsAnalyticsResult;
  const personsRegionLoading =
    isPersonsAnalyticsLoading || isPersonsAnalyticsFetching;
  const industryAllocationData = useMemo(
    () =>
      mapSectorsToBarChartData(
        analytics?.topSectorsByPeriod?.chartAll || analytics?.topSectors
      ),
    [analytics?.topSectors, analytics?.topSectorsByPeriod?.chartAll]
  );
  const industryAllocationDataByTab = useMemo(
    () => ({
      "90D": mapSectorsToBarChartData(analytics?.topSectorsByPeriod?.chart90d),
      "1Y": mapSectorsToBarChartData(analytics?.topSectorsByPeriod?.chart1y),
      ALL: mapSectorsToBarChartData(
        analytics?.topSectorsByPeriod?.chartAll || analytics?.topSectors
      ),
    }),
    [analytics?.topSectors, analytics?.topSectorsByPeriod]
  );
  const fundingDynamicsData = useMemo(
    () => ({
      "90D": mapFundingPoints(analytics?.fundingDynamics?.chart90d),
      "1Y": mapFundingPoints(analytics?.fundingDynamics?.chart1y),
      ALL: mapFundingPoints(analytics?.fundingDynamics?.chartAll),
    }),
    [analytics?.fundingDynamics]
  );
  const countryMapData = useMemo(
    () => mapCountriesToMapData(analytics?.backersByCountry),
    [analytics?.backersByCountry]
  );
  const personsSpecializationData = useMemo(
    () => mapPersonsBarData(personsAnalytics?.topSectors),
    [personsAnalytics?.topSectors]
  );
  const personsSpecializationLabels = useMemo(
    () => getPercentLabels(personsSpecializationData),
    [personsSpecializationData]
  );
  const personsRegionData = useMemo(
    () => mapPersonsCountriesToPieData(personsAnalytics?.personsByCountry),
    [personsAnalytics?.personsByCountry]
  );

  if (activeTab === "Funds") {
    return (
      <>
        <FundsAnalyticsWrapper>
          <NewsTitle>{translateText("Analytics")}</NewsTitle>
          <HeaderCharts>
            <BarDoubleChart
              title={translateText("Investment Allocation by Industry")}
              data={industryAllocationData}
              dataByTab={industryAllocationDataByTab}
              tabsOverride={allocationTabs}
              isLoading={analyticsLoading}
            />
            <LineDoubleChart
              title={translateText("Funding Dynamics")}
              dataByTab={fundingDynamicsData}
              isLoading={analyticsLoading}
            />
          </HeaderCharts>
        </FundsAnalyticsWrapper>
        <BackersDesktopAnalyticsOnly>
          <MapWrapper>
            <NewsTitle>{translateText("Global Investment Map")}</NewsTitle>
            <GlobalMap
              countryMetrics={countryMapData}
              investmentMap={analytics?.globalInvestmentMap}
              isLoading={analyticsLoading}
            />
          </MapWrapper>
          <NewsWrapepr>
            <NewsTitle>{translateText("Live News")}</NewsTitle>
            <NewsBlock page="funds" />
          </NewsWrapepr>
        </BackersDesktopAnalyticsOnly>
      </>
    );
  }

  if (activeTab !== "Persons") return null;

  return (
    <>
      <SectionTitle>{translateText("Analytics")}</SectionTitle>
      <BackersPersonsAnalytics>
        <UniversalBarChart
          title={translateText("Industry Specializations")}
          labels={personsSpecializationLabels}
          data={personsSpecializationData}
          isLoading={personsAnalyticsLoading}
        />
        <PieContentWrapper variant="main">
          <h3>{translateText("Regional Distribution")}</h3>
          <PieWrapper>
            {personsRegionLoading ? (
              <Placeholder width="100%" height="300px" />
            ) : (
              <RegionalPieGraphic
                innerRadius={80}
                outerRadius={150}
                width={300}
                height={300}
                items={personsRegionData}
              />
            )}
          </PieWrapper>
        </PieContentWrapper>
      </BackersPersonsAnalytics>
    </>
  );
};

export default BackersAnalytics;
