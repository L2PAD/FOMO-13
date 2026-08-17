import React, { FC, useRef, useState } from "react";
import {
  ChartWrapper,
  ComparisonItem,
  PieValuesPercentageWrapper,
  ProjectBody,
  ProjectBottom,
  ProjectData,
  ProjectHeader,
  ProjectRow,
  ReverseButton,
  Wrapper,
} from "./styles";
import { IProject } from "../../../../../../types/global_types";
import SearchProject from "../../../../../global/SearchProject";
import {
  getProjectImage,
  setProjectImageFallback,
} from "../../../../../../helpers/imageFallbacks";
import PercentValue from "../../../../../global/common/PercentValue";
import { PieValuesPercentage } from "../Fundraising/styles";
import { COLORS } from "../Fundraising";
import {
  formatAllocationPercent,
  normalizeTokenAllocationItems,
} from "../../../../../../helpers/dropstabTokenAllocation";

import fetchFundsByQuery from "../../../../../../http/funds/fetchFundsByQuery";
import { extractInvestorSlugs } from "../../../../../global/MarketCapInvestorsTab";
import UsersRow from "../../../../../global/UsersRow";
import { useQuery } from "react-query";
import fetchTokenUnlocks from "../../../../../../http/unlocks/fetchTokenUnlocks";
import PieAllocationsGraphic from "../Fundraising/tokenAllocations";
import fetchMarketProjectSearch from "../../../../../../http/projects/fetchMarketProjectSearch";
import fetchProjectById from "../../../../../../http/projects/fetchProjectById";
import fetchProjectTopInvestors from "../../../../../../http/investors/fetchProjectTopInvestors";
import EmptySection from "../../../../../global/EmptySection";


interface IProps {
  initialProject: IProject;
}

const PROJECT_ID_FIELD = "_id";

const toFiniteNumber = (value?: number | string | null): number => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const hasNonZeroMetricValue = (value?: number | string | null): boolean => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue !== 0;
};

const getMetricValueClassName = (value?: number | string | null): string => {
  return hasNonZeroMetricValue(value) ? "value" : "value empty-value";
};

const formatUsdMetric = (value?: number | string | null): string => {
  if (!hasNonZeroMetricValue(value)) return "--";

  return `$${toFiniteNumber(value).toLocaleString()}`;
};

const formatIcoPriceMetric = (value?: number | string | null): string => {
  if (!hasNonZeroMetricValue(value)) return "--";

  return `$${toFiniteNumber(value).toFixed(2)}`;
};

const renderComparisonMetric = (
  value: number,
  rightLabel = "%",
  lowValue?: number
) => {
  if (!hasNonZeroMetricValue(value)) {
    return <span className="empty-value comparison-placeholder">--</span>;
  }

  return (
    <PercentValue
      lowValue={lowValue}
      isIcon={false}
      size="small"
      value={value}
      rightLabel={rightLabel}
    />
  );
};

const calculateDifference = (
  valueA: number = 0,
  valueB: number = 0
): number => {
  if (valueA === 0) return 0;
  return valueB / valueA;
};

const calculateDifferencePercent = (
  valueA: number = 0,
  valueB: number = 0
): number => {
  if (valueA === 0) return 0;
  return ((valueB - valueA) / valueA) * 100;
};

const getMarketProjectLookupId = (project?: IProject | any): string => {
  return String(
    project?.coingeckoId ||
      project?.providerIds?.coingeckoId ||
      project?.projectData?.coingeckoId ||
      ""
  ).trim();
};

const getProjectIdentity = (project?: IProject | any): string => {
  const projectAny = project as any;

  return String(
    getMarketProjectLookupId(project) ||
      project?.slug ||
      projectAny?.[PROJECT_ID_FIELD] ||
      project?.id ||
      ""
  ).trim();
};

const isV2MarketProject = (project?: IProject | any): boolean => {
  return Boolean(project?.projectType === "market" && getMarketProjectLookupId(project));
};

const mapMarketSearchAssetToProject = (asset: any): IProject => {
  const projectData = asset?.projectData || {};
  const coingeckoId = projectData.coingeckoId || asset.coingeckoId || "";
  const symbol = projectData.symbol || asset.symbol || asset.ticker || "";
  const routeId =
    projectData[PROJECT_ID_FIELD] ||
    projectData.id ||
    coingeckoId ||
    asset[PROJECT_ID_FIELD] ||
    asset.id ||
    "";

  return {
    ...(projectData || {}),
    [PROJECT_ID_FIELD]: routeId,
    id: routeId,
    coingeckoId,
    slug: projectData.slug || coingeckoId || asset.slug || routeId,
    name: projectData.name || asset.name || symbol || "Unknown",
    symbol,
    ticker: symbol,
    logo: projectData.logo || asset.logo || "",
    price: toFiniteNumber(asset.price ?? projectData.price),
    rank: projectData.rank || asset.rank,
    projectType: "market",
    readModelId: projectData.readModelId || asset.readModelId,
    marketAssetId: projectData.marketAssetId || asset.marketAssetId,
    canonicalProjectId: projectData.canonicalProjectId || asset.canonicalProjectId,
  } as IProject;
};

const fetchMarketSearchProjects = async (
  queryString: string,
  searchValue: string
): Promise<{ projects: Array<IProject>; total?: number; isSuccess?: boolean }> => {
  const params = new URLSearchParams(queryString.replace(/^\?/, ""));
  const query = params.get("searchValue") || searchValue || "";
  const response = await fetchMarketProjectSearch(query, 25);
  const projects = (response.assets || []).map(mapMarketSearchAssetToProject);

  return {
    isSuccess: response.isSuccess,
    projects,
    total: projects.length,
  };
};

const hydrateMarketProject = async (project: IProject): Promise<IProject> => {
  const coingeckoId = getMarketProjectLookupId(project);

  if (!coingeckoId) return project;

  const response = await fetchProjectById(
    coingeckoId,
    "?projectType=market&lookup=coingeckoId"
  );

  if (!response?.isSuccess || !response.project) return project;

  return {
    ...project,
    ...response.project,
    coingeckoId,
    projectType: "market",
  } as IProject;
};

const getTotalRaised = (project?: IProject | any): number => {
  return toFiniteNumber(project?.totalRaised ?? project?.fundsRaised);
};

const getIcoPriceUsd = (project?: IProject | any): number => {
  return toFiniteNumber(project?.icoPrice?.USD);
};

const getVolume24h = (project?: IProject | any): number => {
  return toFiniteNumber(project?.volume24h ?? project?.volume);
};

const getTvl = (project?: IProject | any): number => {
  return toFiniteNumber(project?.tvl);
};

const getMarketCap = (project?: IProject | any): number => {
  return toFiniteNumber(project?.marketCap);
};

const TokenMetricsComparison: FC<IProps> = ({ initialProject }) => {
  const [projectA, setProjectA] = useState<IProject | undefined>(
    initialProject
  );
  const [projectB, setProjectB] = useState<IProject | undefined>();
  const [isReversed, setIsReversed] = useState(false);
  const projectARequestRef = useRef(0);
  const projectBRequestRef = useRef(0);
  useQuery(
    ["token-unlocks-a", projectA?.slug],
    () => fetchTokenUnlocks(`?search=${projectA?.slug}`),
    {
      onSuccess: (data) => {
        if (!projectA) return;
        if (!data.allocations?.length) return;
        setProjectA({
          ...projectA,
          totalAllocation: data.allocations,
        });
      },
      refetchOnWindowFocus: false,
      enabled: !!projectA?.slug,
    }
  );
  useQuery(
    ["token-unlocks-b", projectB?.slug],
    () => fetchTokenUnlocks(`?search=${projectB?.slug}`),
    {
      onSuccess: (data) => {
        if (!projectB) {
          return
        }
        if (!data.allocations?.length) return;
        setProjectB({
          ...projectB,
          totalAllocation: data.allocations,
        });
      },
      refetchOnWindowFocus: false,
      enabled: !!projectB?.slug,
    }
  );
  const { data: investorsA } = useQuery(
    ["project-investors", "projectA", getProjectIdentity(projectA)],
    async () => {
      if (isV2MarketProject(projectA)) {
        const response = await fetchProjectTopInvestors(
          getMarketProjectLookupId(projectA),
          5,
          { source: "fomo-v2", lookup: "coingeckoId" }
        );

        return { funds: response.investors, total: response.total };
      }

      if (!projectA?.fundsRounds?.length) return { funds: [], total: 0 };

      return fetchFundsByQuery(
        `project/public?slugs=${extractInvestorSlugs(projectA.fundsRounds)}`
      );
    },
    { refetchOnWindowFocus: false, enabled: Boolean(getProjectIdentity(projectA)) }
  );

  const { data: investorsB } = useQuery(
    ["project-investors", "projectB", getProjectIdentity(projectB)],
    async () => {
      if (isV2MarketProject(projectB)) {
        const response = await fetchProjectTopInvestors(
          getMarketProjectLookupId(projectB),
          5,
          { source: "fomo-v2", lookup: "coingeckoId" }
        );

        return { funds: response.investors, total: response.total };
      }

      if (!projectB?.fundsRounds?.length) return { funds: [], total: 0 };

      return fetchFundsByQuery(
        `project/public?slugs=${extractInvestorSlugs(projectB.fundsRounds)}`
      );
    },
    { refetchOnWindowFocus: false, enabled: Boolean(getProjectIdentity(projectB)) }
  );
  const handleProjectAChange = async (project: IProject) => {
    const requestId = projectARequestRef.current + 1;
    projectARequestRef.current = requestId;
    setProjectA(project);
    const hydratedProject = await hydrateMarketProject(project);

    if (projectARequestRef.current === requestId) {
      setProjectA(hydratedProject);
    }
  };

  const handleProjectBChange = async (project: IProject) => {
    const requestId = projectBRequestRef.current + 1;
    projectBRequestRef.current = requestId;
    setProjectB(project);
    const hydratedProject = await hydrateMarketProject(project);

    if (projectBRequestRef.current === requestId) {
      setProjectB(hydratedProject);
    }
  };

  const handleReverse = () => {
    setIsReversed(!isReversed);
    const temp = projectA;
    setProjectA(projectB);
    setProjectB(temp);
  };

  const renderProjectData = (
    project: IProject | undefined,
    isComparison: boolean,
    investors: Array<any>
  ) => {
    if (!project)
      return (
        <ProjectData className="empty" variant="main">
          <div className="name">Project not selected</div>
          <div className="description">Select project to compare</div>
        </ProjectData>
      );

    const projectAny = project as any;
    const totalRaised = getTotalRaised(project);
    const icoPriceUsd = getIcoPriceUsd(project);
    const volume24h = getVolume24h(project);
    const tvl = getTvl(project);
    const marketCap = getMarketCap(project);
    const allocationSource =
      project.totalAllocation?.length
        ? project.totalAllocation
        : projectAny?.allocations?.length
          ? projectAny.allocations
          : projectAny?.tokenDistribution?.length
            ? projectAny.tokenDistribution
            : [];
    const tokenAllocationItems = normalizeTokenAllocationItems(
      allocationSource,
      project
    );
    const tokenSymbol = String(project?.symbol || project?.ticker || "")
      .trim()
      .toUpperCase();

    return (
      <ProjectData variant="main">
        <ProjectHeader>
          <img
            src={getProjectImage(project?.logo || project?.image, project?.name)}
            alt={String(project?.name)}
            onError={setProjectImageFallback}
          />
          <div className="name">{project?.name || "-"}</div>
          <div className="niche">{tokenSymbol || "-"}</div>
        </ProjectHeader>
        <ProjectBody>
          <ProjectRow>
            <div className="key">Total Funds Raised:</div>
            <div className={getMetricValueClassName(totalRaised)}>
              {formatUsdMetric(totalRaised)}
              {isComparison && projectA && projectB && (
                renderComparisonMetric(
                  calculateDifference(
                    getTotalRaised(projectA),
                    getTotalRaised(projectB)
                  ),
                  "x",
                  1
                )
              )}
            </div>
          </ProjectRow>
          <ProjectRow>
            <div className="key">ICO Price:</div>
            <div className={getMetricValueClassName(icoPriceUsd)}>
              {formatIcoPriceMetric(icoPriceUsd)}
              {isComparison && projectA && projectB && (
                renderComparisonMetric(
                  calculateDifference(
                    getIcoPriceUsd(projectA),
                    getIcoPriceUsd(projectB)
                  ),
                  "x",
                  1
                )
              )}
            </div>
          </ProjectRow>
          <ProjectRow>
            <div className="key">Top Investors:</div>
            <div className="investors">
              {
                investors?.length
                  ?
                  <UsersRow
                    users={investors.map((item: any) => {
                      return ({
                        logo: item?.logo || item?.image || item?.avatar || '',
                        name: item.name || item.displayName || item.slug || ""
                      })
                    })}
                  />
                  :
                  <span className="empty-value">--</span>
              }
            </div>
          </ProjectRow>
          <ProjectRow>
            <div className="key">Volume (24h):</div>
            <div className={getMetricValueClassName(volume24h)}>
              {formatUsdMetric(volume24h)}
              {isComparison && projectA && projectB && (
                renderComparisonMetric(
                  calculateDifferencePercent(
                    getVolume24h(projectA),
                    getVolume24h(projectB)
                  )
                )
              )}
            </div>
          </ProjectRow>
          <ProjectRow>
            <div className="key">TVL (Total Value Locked):</div>
            <div className={getMetricValueClassName(tvl)}>
              {formatUsdMetric(tvl)}
              {isComparison && projectA && projectB && (
                renderComparisonMetric(
                  calculateDifference(getTvl(projectA), getTvl(projectB)),
                  "x",
                  1
                )
              )}
            </div>
          </ProjectRow>
          <ProjectRow>
            <div className="key">MC (Market Cap):</div>
            <div className={getMetricValueClassName(marketCap)}>
              {formatUsdMetric(marketCap)}
              {isComparison && projectA && projectB && (
                renderComparisonMetric(
                  calculateDifference(
                    getMarketCap(projectA),
                    getMarketCap(projectB)
                  ),
                  "x",
                  1
                )
              )}
            </div>
          </ProjectRow>
          <ProjectBottom
            className={tokenAllocationItems.length ? undefined : "empty"}
          >
            {tokenAllocationItems.length ? (
              <>
                <ChartWrapper>
                  <PieAllocationsGraphic
                    symbol={tokenSymbol}
                    width={170}
                    height={170}
                    outerRadius={85}
                    items={tokenAllocationItems}
                    labelFontSize={12}
                  />
                </ChartWrapper>
                <PieValuesPercentageWrapper>
                  {tokenAllocationItems.map((item: any, index: number) => {
                    return (
                      <PieValuesPercentage
                        key={index}
                        color={COLORS[index % COLORS.length]}
                        variant="p"
                      >
                        <i />
                        {item.name}:{" "}
                        {formatAllocationPercent(
                          item.tokensAllocatedPercent ?? item.value
                        )}
                        %
                      </PieValuesPercentage>
                    );
                  })}
                </PieValuesPercentageWrapper>
              </>
            ) : (
              <div className="empty-section-wrapper">
                <EmptySection className="small-empty-section" />
              </div>
            )}
          </ProjectBottom>
        </ProjectBody>
      </ProjectData>
    );
  };
  return (
    <Wrapper>
      <ComparisonItem>
        <SearchProject
          className="project-page-left"
          onChange={handleProjectAChange}
          label="Select an asset A"
          initialProject={initialProject}
          displaySymbol
          fetchProjectsRequest={fetchMarketSearchProjects}
        />
        {renderProjectData(projectA, false, investorsA?.funds || [])}
      </ComparisonItem>

      <ReverseButton onClick={handleReverse}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M4.375 7.75L1 4.375M1 4.375L4.375 1M1 4.375H19M15.625 12.25L19 15.625M19 15.625L15.625 19M19 15.625H1"
            stroke="#738094"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </ReverseButton>

      <ComparisonItem>
        <SearchProject
          className="project-page-right"
          onChange={handleProjectBChange}
          label="Select an asset B"
          displaySymbol
          fetchProjectsRequest={fetchMarketSearchProjects}
        />
        {renderProjectData(projectB, true, investorsB?.funds || [])}
      </ComparisonItem>
    </Wrapper>
  );
};

export default TokenMetricsComparison;
