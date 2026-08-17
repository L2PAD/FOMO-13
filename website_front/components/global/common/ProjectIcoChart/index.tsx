import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import {
  Body,
  Bottom,
  Header,
  Labels,
  LeftHeader,
  MiddleButtons,
  ProjectSearchWrapper,
  SearchResultItem,
  SearchResults,
  Tabs,
  Wrapper,
  EmptyChartState,
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
  IcoComparisonHistoryRange,
  IcoComparisonHistoryResponse,
  IcoComparisonHistoryPoint,
  IcoComparisonPeerHistory,
  IcoComparisonPeer,
} from "../../../../types/icoComparison";
import {
  formatMoney,
  formatRoiPercent,
  formatRoiX,
  toNullableNumber,
} from "../../../../helpers/roiFormatters";
import ChartLoadingSkeleton from "../PriceChart/ChartLoadingSkeleton";

const tabs: IcoComparisonHistoryRange[] = [
  "30D",
  "90D",
  "6M",
  "YTD",
  "Since ICO",
];

interface IProps {
  title: string;
  projects?: Array<IProject>;
  historyProject?: IProject;
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

interface ProjectIcoChartData {
  chartData: Array<any>;
  chartTabs: ChartTabItem[];
  bottomLabels: string[];
  leftLabels?: Array<string | number>;
  yDomain?: [number, number];
  emptyMessage?: string;
}

interface RoiScale {
  domain: [number, number];
  labels: number[];
  projectTransforms: Record<string, RoiProjectTransform>;
}

interface RoiProjectTransform {
  centerLog: number;
  amplification: number;
}

interface ValueScale {
  domain: [number, number];
  labels: number[];
}

export const LINE_CHART_COLORS = [
  "#4F85BD",
  "#EB609C",
  "#D87D9B",
  "#E19E4B",
  "#8A0F78",
  "#0FA57C",
];

const VALUE_LABEL_COUNT = 7;
const VALUE_DOMAIN_PADDING_RATIO = 0.08;
const ROI_LABEL_COUNT = 7;
const ROI_LOG_PADDING_RATIO = 0.12;
const ROI_MIN_LOG_PADDING = 0.08;
const ROI_MIN_LOG_SPAN = 0.4;
const ROI_TARGET_LOCAL_LOG_SPAN = 0.8;
const ROI_MAX_CHANGE_AMPLIFICATION = 14;
const LINE_ANIMATION_DURATION = 1500;
const LINE_ANIMATION_STAGGER = 120;
const defaultRoiLabels = [15, 10, 5, 2, 1, 0.5, 0];
const COMPARISON_QUERY_STALE_TIME = 5 * 60 * 1000;
const COMPARISON_QUERY_CACHE_TIME = 15 * 60 * 1000;
const COMPARISON_SEARCH_STALE_TIME = 60 * 1000;
const COMPARISON_SEARCH_CACHE_TIME = 5 * 60 * 1000;
const BOTTOM_LABEL_MAX_COUNT = 8;

const bottomLabelsDates = [
  "23 Dec",
  "24 Dec",
  "25 Dec",
  "26 Dec",
  "27 Dec",
  "28 Dec",
  "29 Dec",
];

const bottomLabelsPrice = ["0", "1M", "3M", "5M", "8M", "12M", "15M"];

const getProjectKey = (project: any): string =>
  String(
    project?._id || project?.id || project?.slug || project?.name || ""
  ).trim();

const projectMatches = (
  historyProject: IcoComparisonPeerHistory,
  project: any
): boolean => {
  const historyKeys = [
    historyProject.id,
    historyProject.slug,
    historyProject.name,
    historyProject.symbol,
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

const orderHistoryProjects = (
  historyProjects: IcoComparisonPeerHistory[],
  projects: Array<IProject> | undefined
): IcoComparisonPeerHistory[] => {
  if (!projects?.length) return historyProjects;

  return projects
    .map((project) =>
      historyProjects.find((historyProject) =>
        projectMatches(historyProject, project)
      )
    )
    .filter(Boolean) as IcoComparisonPeerHistory[];
};

const formatHistoryLabel = (
  timestamp: number,
  range: IcoComparisonHistoryRange
): string => {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return "";
  const monthDay = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (range === "Since ICO") {
    return `${date.getFullYear()}, ${monthDay}`;
  }

  return monthDay;
};

const sampleBottomLabels = (
  labels: string[],
  maxCount = BOTTOM_LABEL_MAX_COUNT
): string[] => {
  const candidates = labels
    .map((label, index) => ({ label, index }))
    .filter((item) => item.label);
  const uniqueCount = new Set(candidates.map((item) => item.label)).size;
  const targetCount = Math.min(maxCount, uniqueCount);
  const picked: Array<{ label: string; index: number }> = [];
  const usedIndexes = new Set<number>();
  const usedLabels = new Set<string>();

  if (!targetCount) return [];

  for (let slot = 0; slot < targetCount; slot += 1) {
    const targetIndex =
      targetCount === 1
        ? 0
        : Math.round((slot * (candidates.length - 1)) / (targetCount - 1));
    const candidate = candidates
      .filter(
        (item) => !usedIndexes.has(item.index) && !usedLabels.has(item.label)
      )
      .sort(
        (left, right) =>
          Math.abs(left.index - targetIndex) -
          Math.abs(right.index - targetIndex)
      )[0];

    if (!candidate) break;

    picked.push(candidate);
    usedIndexes.add(candidate.index);
    usedLabels.add(candidate.label);
  }

  return picked
    .sort((left, right) => left.index - right.index)
    .map((item) => item.label);
};

const getHistoryMetricValue = (
  point: IcoComparisonHistoryPoint | null,
  selectedMode: string
): number | null => {
  if (!point) return null;
  if (selectedMode === "ROI") {
    return toNullableNumber(point.roiMultiplier ?? point.value);
  }
  if (selectedMode === "FDV") {
    return toNullableNumber(point.fdv);
  }

  return toNullableNumber(point.marketCap);
};

const getPositiveRoiValues = (projects: IcoComparisonPeerHistory[]): number[] =>
  projects
    .flatMap((project) =>
      project.series.map((point) =>
        toNullableNumber(point.roiMultiplier ?? point.value)
      )
    )
    .filter((value): value is number => value !== null && value > 0);

const medianNumber = (values: number[]): number => {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

const expandLogDomain = (values: number[]): [number, number] => {
  let minLog = Math.min(...values);
  let maxLog = Math.max(...values);

  if (minLog === maxLog) {
    minLog -= ROI_MIN_LOG_SPAN / 2;
    maxLog += ROI_MIN_LOG_SPAN / 2;
  } else {
    const padding = Math.max(
      (maxLog - minLog) * ROI_LOG_PADDING_RATIO,
      ROI_MIN_LOG_PADDING
    );
    minLog -= padding;
    maxLog += padding;
  }

  return [minLog, maxLog];
};

const buildRoiScale = (
  projects: IcoComparisonPeerHistory[]
): RoiScale | null => {
  const values = getPositiveRoiValues(projects);
  if (!values.length) return null;

  const projectTransforms: Record<string, RoiProjectTransform> = {};
  const visualLogs: number[] = [];

  projects.forEach((project, index) => {
    const dataKey = `investments${index}`;
    const logs = project.series
      .map((point) => toNullableNumber(point.roiMultiplier ?? point.value))
      .filter((value): value is number => value !== null && value > 0)
      .map((value) => Math.log10(value));

    if (!logs.length) return;

    const centerLog = medianNumber(logs);
    const span = Math.max(...logs) - Math.min(...logs);
    const amplification =
      span > 0
        ? Math.min(
            Math.max(ROI_TARGET_LOCAL_LOG_SPAN / span, 1),
            ROI_MAX_CHANGE_AMPLIFICATION
          )
        : ROI_MAX_CHANGE_AMPLIFICATION;
    projectTransforms[dataKey] = { centerLog, amplification };
    visualLogs.push(
      ...logs.map(
        (logValue) => centerLog + (logValue - centerLog) * amplification
      )
    );
  });

  const [minLog, maxLog] = expandLogDomain(
    visualLogs.length ? visualLogs : values.map(Math.log10)
  );

  const labels = Array.from({ length: ROI_LABEL_COUNT }).map((_, index) => {
    const ratio = index / (ROI_LABEL_COUNT - 1);
    return 10 ** (maxLog - (maxLog - minLog) * ratio);
  });

  return {
    domain: [minLog, maxLog],
    labels,
    projectTransforms,
  };
};

const buildValueScale = (
  projects: IcoComparisonPeerHistory[],
  selectedMode: string
): ValueScale | null => {
  if (selectedMode === "ROI") return null;

  const values = projects
    .flatMap((project) =>
      project.series.map((point) => getHistoryMetricValue(point, selectedMode))
    )
    .filter(
      (value): value is number => value !== null && Number.isFinite(value)
    );

  if (!values.length) return null;

  let minValue = Math.min(...values);
  let maxValue = Math.max(...values);

  if (minValue === maxValue) {
    const padding = Math.max(
      Math.abs(maxValue) * VALUE_DOMAIN_PADDING_RATIO,
      1
    );
    minValue = Math.max(0, minValue - padding);
    maxValue += padding;
  } else {
    const padding = (maxValue - minValue) * VALUE_DOMAIN_PADDING_RATIO;
    minValue = Math.max(0, minValue - padding);
    maxValue += padding;
  }

  const labels = Array.from({ length: VALUE_LABEL_COUNT }).map((_, index) => {
    const ratio = index / (VALUE_LABEL_COUNT - 1);
    return maxValue - (maxValue - minValue) * ratio;
  });

  return {
    domain: [minValue, maxValue],
    labels,
  };
};

const getChartPlotValue = (
  value: number | null,
  selectedMode: string,
  roiScale: RoiScale | null,
  dataKey?: string
): number | null => {
  if (value === null) return null;
  if (selectedMode === "ROI") {
    if (!roiScale || value <= 0) return null;
    const logValue = Math.log10(value);
    const transform = dataKey ? roiScale.projectTransforms[dataKey] : null;

    return transform
      ? transform.centerLog +
          (logValue - transform.centerLog) * transform.amplification
      : logValue;
  }

  return value;
};

const findClosestHistoryPoint = (
  series: IcoComparisonHistoryPoint[],
  timestamp: number
): IcoComparisonHistoryPoint | null => {
  if (!series.length) return null;

  return series.reduce((closest, point) =>
    Math.abs(point.timestamp - timestamp) <
    Math.abs(closest.timestamp - timestamp)
      ? point
      : closest
  );
};

const buildHistoricalChartData = (
  historyData: IcoComparisonHistoryResponse | null,
  selectedMode: string,
  projects: Array<IProject> | undefined,
  selectedRange: IcoComparisonHistoryRange
): ProjectIcoChartData | null => {
  const historyProjects = (historyData?.peerComparisonHistory || [])
    .map((project) => ({
      ...project,
      series: (project.series || []).filter((point) => {
        const value = getHistoryMetricValue(point, selectedMode);

        return selectedMode === "ROI"
          ? value !== null && value > 0
          : value !== null;
      }),
    }))
    .filter((project) => project.series.length > 1);
  const visibleProjects = orderHistoryProjects(historyProjects, projects).slice(
    0,
    LINE_CHART_COLORS.length
  );
  const baseSeries = visibleProjects[0]?.series || [];
  const roiScale =
    selectedMode === "ROI" ? buildRoiScale(visibleProjects) : null;
  const valueScale =
    selectedMode === "ROI"
      ? null
      : buildValueScale(visibleProjects, selectedMode);

  if (!visibleProjects.length || !baseSeries.length) return null;

  const chartData = baseSeries.map((basePoint) => {
    const row: any = {
      name: formatHistoryLabel(basePoint.timestamp, selectedRange),
      projectsByKey: {},
    };

    visibleProjects.forEach(
      (project: IcoComparisonPeerHistory, index: number) => {
        const dataKey = `investments${index}`;
        const point =
          project.series.find(
            (item) => item.timestamp === basePoint.timestamp
          ) || findClosestHistoryPoint(project.series, basePoint.timestamp);

        row[dataKey] = getChartPlotValue(
          getHistoryMetricValue(point, selectedMode),
          selectedMode,
          roiScale,
          dataKey
        );
        row.projectsByKey[dataKey] = {
          name: project.name || project.slug || "-",
          symbol: project.symbol || null,
          date: point?.date || null,
          historicalPrice: toNullableNumber(point?.price),
          investmentPrice: toNullableNumber(point?.investmentPrice),
          roundName: point?.roundName || null,
          roiPercent: toNullableNumber(point?.roiFromIco),
          roiMultiplier: toNullableNumber(point?.roiMultiplier),
          marketCap: toNullableNumber(point?.marketCap),
          fdv: toNullableNumber(point?.fdv),
          source: point?.source || null,
          roiSource: point?.roiSource || null,
        };
      }
    );

    return row;
  });

  return {
    chartData,
    chartTabs: visibleProjects.map((project, index) => ({
      id: getProjectKey(
        projects?.find((sourceProject) =>
          projectMatches(project, sourceProject)
        ) || project
      ),
      color: LINE_CHART_COLORS[index],
      label: project.name || project.slug || `Project ${index + 1}`,
      logo: project.logo,
    })),
    bottomLabels: sampleBottomLabels(chartData.map((item) => item.name)),
    leftLabels: selectedMode === "ROI" ? roiScale?.labels : valueScale?.labels,
    yDomain: selectedMode === "ROI" ? roiScale?.domain : valueScale?.domain,
  };
};

const buildProjectChartData = (
  projects: Array<IProject> | undefined,
  selectedMode: string,
  bottomLabels: Array<string>,
  historyData: IcoComparisonHistoryResponse | null,
  selectedRange: IcoComparisonHistoryRange
): ProjectIcoChartData => {
  const historicalData = buildHistoricalChartData(
    historyData,
    selectedMode,
    projects,
    selectedRange
  );
  if (historicalData) return historicalData;

  return {
    chartData: [],
    chartTabs: [],
    bottomLabels,
    emptyMessage: historyData
      ? "No history for selected projects."
      : "No historical comparison data available.",
  };
};

const ProjectIcoChart: React.FC<IProps> = ({
  title,
  projects,
  historyProject,
  readModel,
  lookup,
  onAddProject,
  onRemoveProject,
  canRemoveProject,
}) => {
  const [selectedMode, setSelectedMode] = useState<string>("ROI");
  const [selectedTab, setSelectedTab] =
    useState<IcoComparisonHistoryRange>("30D");
  const [searchValue, setSearchValue] = useState<string>("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hoveredDataKey, setHoveredDataKey] = useState<string>("");
  const activeProjectsForMode = useMemo(() => projects || [], [projects]);
  const activeProjectIds = useMemo(
    () => new Set(activeProjectsForMode.map(getProjectKey).filter(Boolean)),
    [activeProjectsForMode]
  );
  const activeProjectIdsList = useMemo(
    () => Array.from(activeProjectIds),
    [activeProjectIds]
  );
  const activeProjectIdsKey = activeProjectIdsList.join("|");
  const historySlug = useMemo(() => {
    const project = (historyProject || projects?.[0]) as any;
    return String(
      project?._id || project?.id || project?.slug || project?.sourceId || ""
    ).trim();
  }, [historyProject, projects]);

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
      selectedMode,
      debouncedSearchValue,
      activeProjectIdsKey,
    ],
    () =>
      fetchIcoComparisonProjectSearch(historySlug, {
        search: debouncedSearchValue,
        metric: selectedMode,
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

  const { bottomLabels: fallbackBottomLabels, leftLabels: fallbackLeftLabels } =
    useMemo(() => {
      if (selectedMode === "ROI") {
        return {
          bottomLabels: bottomLabelsPrice,
          leftLabels: defaultRoiLabels,
        };
      }

      return { bottomLabels: bottomLabelsDates, leftLabels: [] };
    }, [selectedMode]);
  const {
    chartData,
    chartTabs,
    bottomLabels,
    leftLabels: chartLeftLabels,
    yDomain,
    emptyMessage,
  } = useMemo(
    () =>
      buildProjectChartData(
        activeProjectsForMode,
        selectedMode,
        fallbackBottomLabels,
        historyData,
        selectedTab
      ),
    [
      activeProjectsForMode,
      selectedMode,
      fallbackBottomLabels,
      historyData,
      selectedTab,
    ]
  );
  const leftLabels = chartLeftLabels?.length
    ? chartLeftLabels
    : fallbackLeftLabels;
  const chartRenderKey = `${selectedMode}-${selectedTab}-${activeProjectIdsKey}-${chartData.length}`;
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
        <MiddleButtons>
          <TimeButton
            onClick={() => setSelectedMode("ROI")}
            active={selectedMode === "ROI"}
          >
            ROI
          </TimeButton>
          <TimeButton
            onClick={() => setSelectedMode("M.Cap")}
            active={selectedMode === "M.Cap"}
          >
            M.Cap
          </TimeButton>
          <TimeButton
            onClick={() => setSelectedMode("FDV")}
            active={selectedMode === "FDV"}
          >
            FDV
          </TimeButton>
        </MiddleButtons>
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
        <ChartLoadingSkeleton
          height="390px"
          marginTop="14px"
          variant="compact"
        />
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
                    <div style={{ background: item.color }} className="color" />
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
                  <div style={{ background: item.color }} className="color" />
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
          {!chartTabs.length || !chartData.length ? (
            <EmptyChartState>
              {emptyMessage || "No comparison data available."}
            </EmptyChartState>
          ) : (
            <Body>
              <Labels>
                {leftLabels.map((item: string | number, index: number) => {
                  if (selectedMode === "ROI") {
                    const roiLabelValue = Number(item);

                    return (
                      <div
                        className="date"
                        key={index}
                        style={{
                          color:
                            Number.isFinite(roiLabelValue) && roiLabelValue >= 1
                              ? "var(--main-green)"
                              : "var(--main-red)",
                        }}
                      >
                        {formatRoiX(roiLabelValue)}
                      </div>
                    );
                  }

                  return (
                    <div className="date" key={index}>
                      {typeof item === "number" ? formatMoney(item) : item}
                    </div>
                  );
                })}
              </Labels>
              <div style={{ width: "calc(100% - 50px)" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    key={chartRenderKey}
                    data={chartData}
                    onMouseLeave={() => setHoveredDataKey("")}
                  >
                    <CartesianGrid strokeDasharray="1 1" />
                    <YAxis
                      hide
                      type="number"
                      domain={yDomain || ["auto", "auto"]}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const activePayload =
                            (hoveredDataKey
                              ? payload.find(
                                  (item) =>
                                    String(item.dataKey || "") ===
                                    hoveredDataKey
                                )
                              : null) ||
                            payload.find(
                              (item) =>
                                item.value !== null && item.value !== undefined
                            ) ||
                            payload[0];
                          const dataKey = String(activePayload.dataKey || "");
                          const projectPoint =
                            activePayload.payload?.projectsByKey?.[dataKey];
                          const companyType =
                            projectPoint?.name ||
                            activePayload.payload?.companyType ||
                            "-";
                          const symbol = projectPoint?.symbol || "";
                          const historicalPrice = toNullableNumber(
                            projectPoint?.historicalPrice
                          );
                          const investmentPrice = toNullableNumber(
                            projectPoint?.investmentPrice
                          );
                          const roiPercent = toNullableNumber(
                            projectPoint?.roiPercent
                          );
                          const roiMultiplier = toNullableNumber(
                            projectPoint?.roiMultiplier
                          );
                          const marketCap = toNullableNumber(
                            projectPoint?.marketCap
                          );
                          const fdv = toNullableNumber(projectPoint?.fdv);
                          const isNegativeRoi =
                            (roiPercent !== null && roiPercent < 0) ||
                            (roiPercent === null &&
                              roiMultiplier !== null &&
                              roiMultiplier < 1);
                          const dateLabel = projectPoint?.date
                            ? new Date(projectPoint.date).toLocaleDateString(
                                "en-US",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : activePayload.payload?.name || "-";
                          return (
                            <div
                              style={{
                                background: "#fff",
                                borderRadius: "8px",
                                padding: "10px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                fontFamily: "Arial",
                                fontSize: "12px",
                                color: "#070B35",
                              }}
                            >
                              <p style={{ margin: "5px 0" }}>
                                <strong>Project Name:</strong> {companyType}
                                {symbol ? ` (${symbol})` : ""}
                              </p>
                              <p style={{ margin: "5px 0" }}>
                                <strong>Date:</strong> {dateLabel}
                              </p>
                              {historicalPrice !== null ? (
                                <p style={{ margin: "5px 0" }}>
                                  <strong>Historical Price:</strong>{" "}
                                  {formatMoney(historicalPrice)}
                                </p>
                              ) : null}
                              {investmentPrice !== null ? (
                                <p style={{ margin: "5px 0" }}>
                                  <strong>Investment Price:</strong>{" "}
                                  {formatMoney(investmentPrice)}
                                </p>
                              ) : null}
                              {projectPoint?.roundName ? (
                                <p style={{ margin: "5px 0" }}>
                                  <strong>Round:</strong>{" "}
                                  {projectPoint.roundName}
                                </p>
                              ) : null}
                              {roiPercent !== null || roiMultiplier !== null ? (
                                <p style={{ margin: "5px 0" }}>
                                  <strong>ROI (Multiplier):</strong>{" "}
                                  <span
                                    style={{
                                      color: isNegativeRoi
                                        ? "var(--main-red)"
                                        : "var(--main-green)",
                                    }}
                                  >
                                    {formatRoiPercent(roiPercent)} (
                                    {formatRoiX(roiMultiplier)})
                                  </span>
                                </p>
                              ) : null}
                              {marketCap !== null ? (
                                <p style={{ margin: "5px 0" }}>
                                  <strong>Market Cap at this point:</strong>{" "}
                                  {formatMoney(marketCap)}
                                </p>
                              ) : null}
                              {fdv !== null ? (
                                <p style={{ margin: "5px 0" }}>
                                  <strong>FDV at this point:</strong>{" "}
                                  {formatMoney(fdv)}
                                </p>
                              ) : null}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {chartTabs.map((item, index: number) => {
                      const dataKey = `investments${index}`;

                      return (
                        <Line
                          key={item.id || dataKey}
                          type="linear"
                          dataKey={dataKey}
                          stroke={item.color}
                          strokeWidth={2}
                          isAnimationActive
                          animationBegin={index * LINE_ANIMATION_STAGGER}
                          animationDuration={LINE_ANIMATION_DURATION}
                          animationEasing="ease"
                          onMouseEnter={() => setHoveredDataKey(dataKey)}
                          onMouseLeave={() => setHoveredDataKey("")}
                          activeDot={{
                            r: 6,
                            onMouseEnter: () => setHoveredDataKey(dataKey),
                          }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>{" "}
                <Bottom>
                  {bottomLabels.map((item: string, index: number) => {
                    return <div key={index}>{item}</div>;
                  })}
                </Bottom>
              </div>
            </Body>
          )}
        </>
      )}
    </Wrapper>
  );
};

export default ProjectIcoChart;
