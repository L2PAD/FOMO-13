import React, { useEffect, useMemo, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
  Cell,
} from "recharts";
import {
  BarChartLoadingBar,
  BarChartLoadingGrid,
  BarChartLoadingLabel,
  BarChartLoadingRow,
  BarChartLoadingRows,
  BarChartLoadingTrack,
  BarChartLoadingWrapper,
  Chart,
  ChartWrapper,
  EmptyChartState,
  Header,
  LeftHeader,
  ProjectSearchWrapper,
  Projects,
  SearchResultItem,
  SearchResults,
  Tabs,
  Wrapper,
} from "./styles";
import { ButtonsWrapper } from "../BarDoubleChart/styles";
import { TimeButton } from "../PriceChart/styles";
import { SearchIconStyle } from "../../Navigation/styles";
import { SearchInput } from "../../../layouts/projects/P2PExchange/styles";
import { SearchWrapper } from "../../../layouts/projects/Funds/FundsBio/styles";
import { IProject } from "../../../../types/global_types";
import {
  getProjectImage,
  setProjectImageFallback,
} from "../../../../helpers/imageFallbacks";
import { useQuery } from "react-query";
import fetchIcoComparisonHistory from "../../../../http/projects/fetchIcoComparisonHistory";
import fetchIcoComparisonProjectSearch from "../../../../http/projects/fetchIcoComparisonProjectSearch";
import {
  IcoComparisonHistoryPoint,
  IcoComparisonHistoryRange,
  IcoComparisonHistoryResponse,
  IcoComparisonPeer,
} from "../../../../types/icoComparison";
import {
  formatMoney,
  formatRoiX,
  resolveProjectRoiX,
  roiPercentToMultiplier,
  toNullableNumber,
} from "../../../../helpers/roiFormatters";

const tabs: IcoComparisonHistoryRange[] = [
  "30D",
  "90D",
  "6M",
  "YTD",
  "Since ICO",
];
const BAR_VALUE_LABEL_DOMAIN_PADDING = 1.18;
const barLoadingWidths = [78, 56, 88, 44, 66];
const COMPARISON_QUERY_STALE_TIME = 5 * 60 * 1000;
const COMPARISON_QUERY_CACHE_TIME = 15 * 60 * 1000;
const COMPARISON_SEARCH_STALE_TIME = 60 * 1000;
const COMPARISON_SEARCH_CACHE_TIME = 5 * 60 * 1000;

type IcoBarMetric = "marketCap" | "fdv" | "roi" | "raised";

interface IProps {
  title: string;
  project: IProject;
  projects?: Array<IProject>;
  metric?: IcoBarMetric;
  readModel?: "v2" | string;
  lookup?: string;
  onAddProject?: (project: IProject | IcoComparisonPeer) => void;
  onRemoveProject?: (projectId: string) => void;
  canRemoveProject?: (projectId: string) => boolean;
}

interface ChartTabItem {
  id: string;
  color: string;
  label: string;
  logo?: string | null;
}

interface ChartRowItem {
  id?: string;
  name: string;
  value: number;
  logo?: string | null;
  color?: string;
  isCurrent?: boolean;
  isIndustry?: boolean;
}

const BarLoadingSkeleton: React.FC<{ height?: number }> = ({
  height = 400,
}) => (
  <BarChartLoadingWrapper
    $height={height}
    role="status"
    aria-label="Loading comparison chart data"
  >
    <BarChartLoadingGrid />
    <BarChartLoadingRows aria-hidden="true">
      {barLoadingWidths.map((width, index) => (
        <BarChartLoadingRow key={`bar-loading-row-${index}`}>
          <BarChartLoadingLabel
            style={{
              animationDelay: `${index * 0.08}s`,
              width: index % 2 === 0 ? "74%" : "58%",
            }}
          />
          <BarChartLoadingTrack>
            <BarChartLoadingBar
              style={{
                width: `${width}%`,
                animationDelay: `${index * 0.1}s`,
              }}
            />
          </BarChartLoadingTrack>
        </BarChartLoadingRow>
      ))}
    </BarChartLoadingRows>
  </BarChartLoadingWrapper>
);

export const LINE_CHART_COLORS = [
  "#4F85BD",
  "#EB609C",
  "#D87D9B",
  "#E19E4B",
  "#8A0F78",
  "#0FA57C",
];

const projectMatches = (historyProject: any, project: any): boolean => {
  const historyKeys = [
    historyProject?._id,
    historyProject?.id,
    historyProject?.slug,
    historyProject?.name,
    historyProject?.symbol,
  ]
    .map((item) => String(item || "").toLowerCase())
    .filter(Boolean);
  const projectKeys = [
    project?._id,
    project?.id,
    project?.slug,
    project?.name,
    project?.symbol,
    project?.niche,
  ]
    .map((item) => String(item || "").toLowerCase())
    .filter(Boolean);

  return projectKeys.some((key) => historyKeys.includes(key));
};

const getProjectKey = (project: any): string =>
  String(
    project?._id || project?.id || project?.slug || project?.name || ""
  ).trim();

const orderHistoryProjects = (
  historyProjects: Array<any>,
  projects: Array<IProject> | undefined
): Array<any> => {
  if (!projects?.length) return historyProjects;

  return projects
    .map((project) =>
      historyProjects.find((historyProject) =>
        projectMatches(historyProject, project)
      )
    )
    .filter(Boolean);
};

const getRoiMultiplier = (project: any): number | null =>
  resolveProjectRoiX(project);

const getMetricValue = (project: any, metric: IcoBarMetric): number | null => {
  if (metric === "roi") return getRoiMultiplier(project);
  if (metric === "fdv") {
    return toNullableNumber(
      project?.fullyDilutedMarketCap || project?.tokenomics?.fdv
    );
  }
  if (metric === "raised") {
    return toNullableNumber(
      project?.investedAmount || project?.totalRaised || project?.fundsRaised
    );
  }

  return toNullableNumber(project?.marketCap);
};

const getHistoryMetricValue = (
  point: IcoComparisonHistoryPoint | null,
  metric: IcoBarMetric
): number | null => {
  if (!point) return null;
  if (metric === "roi")
    return toNullableNumber(point.roiMultiplier ?? point.value);
  if (metric === "fdv") return toNullableNumber(point.fdv);
  if (metric === "raised") return null;

  return toNullableNumber(point.marketCap);
};

const averageNumber = (values: number[]): number | null => {
  if (!values.length) return null;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getRangeMetricValue = (
  series: IcoComparisonHistoryPoint[] | undefined,
  metric: IcoBarMetric
): number | null => {
  const values = (series || [])
    .map((point) => getHistoryMetricValue(point, metric))
    .filter(
      (value): value is number => value !== null && Number.isFinite(value)
    );

  if (!values.length) return null;
  if (metric === "roi") return Math.max(...values);

  return averageNumber(values);
};

const getIndustryRangeValue = (
  historyData: IcoComparisonHistoryResponse | null,
  metric: IcoBarMetric
): number | null => {
  const values = (historyData?.industryAverageHistory || [])
    .map((point) => {
      if (metric === "roi") {
        return roiPercentToMultiplier(point.roi);
      }

      return toNullableNumber(metric === "fdv" ? point.fdv : point.marketCap);
    })
    .filter(
      (value): value is number => value !== null && Number.isFinite(value)
    );

  if (!values.length) return null;
  if (metric === "roi") return Math.max(...values);

  return averageNumber(values);
};

const sortChartRows = (rows: ChartRowItem[]): ChartRowItem[] =>
  [...rows].sort((left, right) => {
    const valueDiff = Number(right.value) - Number(left.value);
    if (valueDiff !== 0) return valueDiff;

    return left.name.localeCompare(right.name);
  });

const buildChartTabsFromRows = (rows: ChartRowItem[]): ChartTabItem[] =>
  rows
    .filter((row) => !row.isIndustry)
    .map((row, index) => ({
      id: row.id || row.name,
      color: LINE_CHART_COLORS[index % LINE_CHART_COLORS.length],
      label: row.name,
      logo: row.logo,
    }));

const buildHistoricalBarData = (
  historyData: IcoComparisonHistoryResponse | null,
  metric: IcoBarMetric,
  projects: Array<IProject> | undefined,
  currentProject: IProject
): { chartData: Array<any>; chartTabs: ChartTabItem[] } | null => {
  const historyProjects = (historyData?.peerComparisonHistory || []).filter(
    (item) => item.series?.length
  );
  if (metric === "raised") return null;

  const sourceRows = projects?.length ? projects : historyProjects;
  const rows = sourceRows.reduce<ChartRowItem[]>(
    (acc, sourceProject: any, index) => {
      const item = historyProjects.find((historyProject) =>
        projectMatches(historyProject, sourceProject)
      );
      const value =
        getRangeMetricValue(item?.series, metric) ??
        getMetricValue(sourceProject, metric);
      if (value === null) return acc;

      acc.push({
        id: getProjectKey(sourceProject),
        name:
          item?.name ||
          sourceProject.name ||
          sourceProject.slug ||
          `Project ${index + 1}`,
        value,
        logo: item?.logo || sourceProject.logo,
        isCurrent: projectMatches(item || sourceProject, currentProject),
      });

      return acc;
    },
    []
  );
  if (!rows.length && !historyProjects.length) return null;

  const industryValue = getIndustryRangeValue(historyData, metric);
  const chartData = sortChartRows([
    ...rows,
    ...(industryValue !== null
      ? [
          {
            name: "Industry Average",
            value: industryValue,
            color: "#FFC702",
            isIndustry: true,
          },
        ]
      : []),
  ]);

  return {
    chartData,
    chartTabs: buildChartTabsFromRows(chartData),
  };
};

const buildBarData = (
  projects: Array<IProject> | undefined,
  metric: IcoBarMetric,
  historyData: IcoComparisonHistoryResponse | null,
  currentProject: IProject
): { chartData: Array<any>; chartTabs: ChartTabItem[] } => {
  const historicalData = buildHistoricalBarData(
    historyData,
    metric,
    projects,
    currentProject
  );
  if (historicalData) return historicalData;

  if (metric === "roi") {
    return {
      chartData: [],
      chartTabs: [],
    };
  }

  const visibleProjects = projects || [];

  if (!visibleProjects.length) {
    return {
      chartData: [],
      chartTabs: [],
    };
  }

  const rows = visibleProjects.reduce<ChartRowItem[]>(
    (acc, item: any, index: number) => {
      const value = getMetricValue(item, metric);
      if (value === null) return acc;

      acc.push({
        id: getProjectKey(item),
        name: item.name || item.niche || `Project ${index + 1}`,
        value,
        logo: item.logo,
        isCurrent: projectMatches(item, currentProject),
      });

      return acc;
    },
    []
  );
  const chartData = sortChartRows(rows);

  return {
    chartData,
    chartTabs: buildChartTabsFromRows(chartData),
  };
};

const ProjectIcoBar: React.FC<IProps> = ({
  title,
  project,
  projects,
  metric = "marketCap",
  readModel,
  lookup,
  onAddProject,
  onRemoveProject,
  canRemoveProject,
}) => {
  const [selectedTab, setSelectedTab] =
    useState<IcoComparisonHistoryRange>("30D");
  const [searchValue, setSearchValue] = useState<string>("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const activeProjectsForMetric = useMemo(() => projects || [], [projects]);
  const activeProjectIds = useMemo(
    () => new Set(activeProjectsForMetric.map(getProjectKey).filter(Boolean)),
    [activeProjectsForMetric]
  );
  const activeProjectIdsList = useMemo(
    () => Array.from(activeProjectIds),
    [activeProjectIds]
  );
  const activeProjectIdsKey = activeProjectIdsList.join("|");
  const historySlug = useMemo(() => {
    const sourceProject = project as any;
    return String(
      sourceProject?._id ||
        sourceProject?.id ||
        sourceProject?.slug ||
        sourceProject?.sourceId ||
        ""
    ).trim();
  }, [project]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchValue(searchValue.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchValue]);

  const { data: historyResponse, isLoading: isHistoryLoading } = useQuery(
    [
      "project-ico-comparison-history",
      readModel,
      lookup,
      historySlug,
      selectedTab,
      activeProjectIdsKey,
    ],
    () =>
      fetchIcoComparisonHistory(historySlug, {
        range: selectedTab,
        peerLimit: activeProjectIdsList.length ? 0 : 1,
        includeIndustry: true,
        projectIds: activeProjectIdsList,
        readModel,
        lookup,
      }),
    {
      enabled: Boolean(historySlug),
      staleTime: COMPARISON_QUERY_STALE_TIME,
      cacheTime: COMPARISON_QUERY_CACHE_TIME,
      refetchOnWindowFocus: false,
    }
  );
  const historyData = historyResponse?.isSuccess ? historyResponse.data : null;
  const { data: searchResponse, isLoading: isSearchLoading } = useQuery(
    [
      "project-ico-comparison-search",
      readModel,
      lookup,
      historySlug,
      metric,
      debouncedSearchValue,
      activeProjectIdsKey,
    ],
    () =>
      fetchIcoComparisonProjectSearch(historySlug, {
        search: debouncedSearchValue,
        metric,
        excludeIds: activeProjectIdsList,
        limit: 8,
        readModel,
        lookup,
      }),
    {
      enabled: isSearchOpen && Boolean(historySlug),
      staleTime: COMPARISON_SEARCH_STALE_TIME,
      cacheTime: COMPARISON_SEARCH_CACHE_TIME,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    }
  );
  const searchResults = searchResponse?.isSuccess
    ? searchResponse.projects
    : [];
  const { chartData, chartTabs } = useMemo(
    () => buildBarData(activeProjectsForMetric, metric, historyData, project),
    [activeProjectsForMetric, metric, historyData, project]
  );
  const chartHeight = Math.max(400, chartData.length * 72);
  const chartRowHeight = chartData.length ? chartHeight / chartData.length : 80;
  const xAxisDomainMax =
    Math.max(1, ...chartData.map((item) => Math.abs(Number(item.value) || 0))) *
    BAR_VALUE_LABEL_DOMAIN_PADDING;
  const isChartLoading = isHistoryLoading && !historyResponse;
  const addProjectFromSearch = (projectToAdd: IProject | IcoComparisonPeer) => {
    const projectId = getProjectKey(projectToAdd);
    if (!projectId || !onAddProject) return;

    onAddProject(projectToAdd);
    setSearchValue("");
    setDebouncedSearchValue("");
    setIsSearchOpen(false);
  };
  const removeProject = (projectId: string) => {
    if (!projectId || !onRemoveProject) return;
    if (canRemoveProject && !canRemoveProject(projectId)) return;

    onRemoveProject(projectId);
  };

  const CustomRightLabel = (props: any) => {
    const { x, y, value, width } = props;
    const parsedValue = toNullableNumber(value);
    if (parsedValue === null) return null;

    return (
      <text
        x={x + width + 6}
        y={y + 15}
        fill="#070B35"
        fontSize={14}
        fontWeight="bold"
        textAnchor="start"
      >
        {metric === "roi" ? formatRoiX(parsedValue) : formatMoney(parsedValue)}
      </text>
    );
  };

  return (
    <Wrapper variant="main">
      <Header>
        <LeftHeader>
          <h3>{title}</h3>
          <ProjectSearchWrapper>
            <SearchWrapper className="white-input">
              <SearchInput
                value={searchValue}
                onChange={(value) => {
                  setSearchValue(value);
                  setIsSearchOpen(true);
                }}
                onFocus={setIsSearchOpen}
                placeholder="Search project"
                type="text"
                leftIcon={<SearchIconStyle />}
              />
            </SearchWrapper>
            {isSearchOpen ? (
              <SearchResults variant="main">
                {isSearchLoading ? (
                  <div className="empty-result">Loading...</div>
                ) : searchResults.length ? (
                  searchResults.map((item) => (
                    <SearchResultItem
                      key={getProjectKey(item)}
                      type="button"
                      onClick={() => addProjectFromSearch(item)}
                    >
                      <img
                        src={getProjectImage(
                          (item as any).logo,
                          item.name || item.symbol
                        )}
                        alt={item.name}
                        onError={setProjectImageFallback}
                      />
                      <span>{item.name}</span>
                    </SearchResultItem>
                  ))
                ) : (
                  <div className="empty-result">No projects found</div>
                )}
              </SearchResults>
            ) : null}
          </ProjectSearchWrapper>
        </LeftHeader>
        <ButtonsWrapper>
          {tabs.map((item) => (
            <TimeButton
              key={item}
              onClick={() => setSelectedTab(item)}
              active={selectedTab === item}
            >
              {item}
            </TimeButton>
          ))}
        </ButtonsWrapper>
      </Header>
      {isChartLoading ? (
        <BarLoadingSkeleton height={400} />
      ) : (
        <>
          <Tabs>
            {chartTabs.map((item, index: number) => {
              const removable = Boolean(
                onRemoveProject &&
                  chartTabs.length > 1 &&
                  (!canRemoveProject || canRemoveProject(item.id))
              );

              if (!removable) {
                return (
                  <div key={item.id || index} className="tab">
                    <img
                      src={getProjectImage(
                        item.logo || project.logo,
                        item.label || project.name
                      )}
                      alt={item.label}
                      onError={setProjectImageFallback}
                    />
                    <span>{item.label}</span>
                  </div>
                );
              }

              return (
                <button
                  key={item.id || index}
                  type="button"
                  className="tab btn"
                  onClick={() => removeProject(item.id)}
                >
                  <img
                    src={getProjectImage(
                      item.logo || project.logo,
                      item.label || project.name
                    )}
                    alt={item.label}
                    onError={setProjectImageFallback}
                  />
                  <span>{item.label}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="6"
                    height="5"
                    viewBox="0 0 6 5"
                    fill="none"
                  >
                    <path
                      d="M5 0.500001L1 4.5M5 4.5L1 0.5"
                      stroke="#738094"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              );
            })}
          </Tabs>
          {!chartData.length ? (
            <EmptyChartState>No comparison data available.</EmptyChartState>
          ) : (
            <ChartWrapper>
              <Projects $rowHeight={chartRowHeight}>
                {chartData.map((item, index: number) => {
                  return (
                    <div className="project" key={index}>
                      {!item?.color ? (
                        <img
                          src={getProjectImage(
                            item.logo || project.logo,
                            item.name || item.label || project.name
                          )}
                          alt={item.name}
                          onError={setProjectImageFallback}
                        />
                      ) : (
                        <></>
                      )}
                      <div
                        style={{ color: item.color || "black" }}
                        className="name"
                      >
                        {item.name}
                      </div>
                    </div>
                  );
                })}
              </Projects>
              <Chart $height={chartHeight}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    width={500}
                    height={300}
                    data={chartData}
                    layout="vertical"
                  >
                    <defs>
                      <linearGradient
                        id="gradientFill"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="rgba(4, 165, 132, 0)" />
                        <stop
                          offset="1000%"
                          stopColor="rgba(4, 165, 132, 0.6)"
                        />
                      </linearGradient>
                    </defs>
                    <defs>
                      <linearGradient
                        id="gradientRedFill"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="rgba(255, 88, 88, 0)" />
                        <stop
                          offset="100%"
                          stopColor="rgba(255, 88, 88, 0.6)"
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="1 1" vertical={false} />
                    <XAxis
                      type="number"
                      domain={[0, xAxisDomainMax]}
                      stroke="#F5FBFD"
                    />
                    <YAxis
                      tick={{ fill: "#F5FBFD", fontSize: 14 }}
                      orientation="left"
                      dataKey="name"
                      type="category"
                      stroke="#F5FBFD"
                    />
                    <Bar
                      dataKey="value"
                      barSize={20}
                      radius={20}
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#${
                            entry?.isCurrent && index === chartData.length - 1
                              ? "gradientRedFill"
                              : "gradientFill"
                          })`}
                        />
                      ))}
                      <LabelList
                        dataKey="value"
                        content={<CustomRightLabel />}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Chart>
            </ChartWrapper>
          )}
        </>
      )}
    </Wrapper>
  );
};

export default ProjectIcoBar;
