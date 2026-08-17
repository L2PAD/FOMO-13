import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Title } from "../Fundraising/styles";
import { IProject } from "../../../../../../types/global_types";
import infoIcon from "../../../../../../assets/icons/info-icon.svg";
import {
  getProjectImage,
  setProjectImageFallback,
} from "../../../../../../helpers/imageFallbacks";
import {
  Body,
  GainWrapper,
  Row,
  RowsWrapper,
  Table,
  TableHeader,
} from "../Comparison/styles";
import { RaisedWrapper, TitleWrapper, Wrapper } from "./styles";
import DescriptionComponent from "../../../../../global/common/DescriptionComponent";
import PhotoIcon from "../../../../../global/Icons/PhotoIcon";
import ProjectIcoChart from "../../../../../global/common/ProjectIcoChart";
import ProjectIcoBar from "../../../../../global/common/ProjectIcoBar";
import SaveShareModal from "../../../../../global/modals/SaveShareModal";
import Placeholder from "../../../../../global/common/Placeholder";
import ChartLoadingSkeleton from "../../../../../global/common/PriceChart/ChartLoadingSkeleton";
import { useTranslation } from "i18n";
import { useQuery } from "react-query";
import fetchIcoComparison from "../../../../../../http/projects/fetchIcoComparison";
import {
  IcoComparisonPeer,
  IcoComparisonResponse,
} from "../../../../../../types/icoComparison";
import {
  EMPTY_VALUE,
  formatMoney,
  formatRoiPercent,
  formatRoiX,
  resolveProjectRoiPercent,
  resolveProjectRoiX,
  toNullableNumber,
} from "../../../../../../helpers/roiFormatters";

interface IProps {
  project: IProject;
}

interface PerformanceChartState {
  extraProjects: Array<any>;
  hiddenProjectIds: string[];
}

const COMPARISON_PROJECT_LIMIT = 5;
const COMPARISON_PEER_LIMIT = COMPARISON_PROJECT_LIMIT - 1;
const INVESTMENT_ROI_PROJECT_LIMIT = 2;
const COMPARISON_QUERY_STALE_TIME = 5 * 60 * 1000;
const COMPARISON_QUERY_CACHE_TIME = 15 * 60 * 1000;

const createEmptyPerformanceChartState = (): PerformanceChartState => ({
  extraProjects: [],
  hiddenProjectIds: [],
});

const firstDefined = (...values: Array<any>): any => {
  for (const value of values) {
    if (value === 0) return value;
    if (value !== undefined && value !== null && value !== "") return value;
  }

  return undefined;
};

const firstPositiveValue = (...values: Array<any>): any => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return value;
  }

  return firstDefined(...values);
};

const getProjectKey = (project: any): string =>
  String(
    project?._id || project?.id || project?.slug || project?.name || ""
  ).trim();

const isV2ComparisonProject = (project: any): boolean =>
  Boolean(
    project?.coingeckoId ||
      project?.canonicalProjectId ||
      project?.marketAssetId ||
      project?.readModelId
  );

const getV2ComparisonLookup = (project: any): string | undefined => {
  if (project?.coingeckoId) return "coingeckoId";
  if (project?.canonicalProjectId) return "canonicalProjectId";
  if (project?.marketAssetId) return "marketAssetId";
  if (project?.readModelId) return "readModelId";
  return undefined;
};

const getComparisonRouteKey = (project: any): string =>
  String(
    project?.coingeckoId ||
      project?.canonicalProjectId ||
      project?.marketAssetId ||
      project?.readModelId ||
      getProjectKey(project) ||
      project?.sourceId ||
      ""
  ).trim();

const hasProjectRoi = (project: any): boolean =>
  resolveProjectRoiX(project) !== null ||
  resolveProjectRoiPercent(project) !== null;

const getUniqueProjects = <T extends any>(
  projects: T[],
  limit?: number
): T[] => {
  const uniqueProjects = projects.filter((item, index, items) => {
    const itemKey = getProjectKey(item);
    return (
      item &&
      itemKey &&
      items.findIndex(
        (projectItem) => getProjectKey(projectItem) === itemKey
      ) === index
    );
  });

  return typeof limit === "number"
    ? uniqueProjects.slice(0, limit)
    : uniqueProjects;
};

const sortProjectsByRoiDesc = <T extends any>(projects: T[]): T[] =>
  projects
    .map((item, index) => ({
      item,
      index,
      roi: resolveProjectRoiX(item),
    }))
    .sort((left, right) => {
      if (left.roi === null && right.roi === null)
        return left.index - right.index;
      if (left.roi === null) return 1;
      if (right.roi === null) return -1;

      return right.roi - left.roi;
    })
    .map(({ item }) => item);

const getProjectScreenshot = (project: any): string =>
  String(
    firstDefined(
      project?.screenshotUrl,
      project?.screenshot,
      project?.descriptionImages?.[0],
      project?.rawIcoData?.screenshots?.[0]?.url,
      project?.rawIcoData?.screenshots?.[0]?.src,
      project?.rawIcoData?.screenshots?.[0]
    ) || ""
  );

const mapPeerToProject = (peer: IcoComparisonPeer): any => ({
  _id: peer.id || peer.slug,
  name: peer.name,
  slug: peer.slug,
  symbol: peer.symbol || "",
  niche: peer.symbol || peer.name,
  logo: peer.logo || "",
  screenshotUrl: peer.screenshotUrl || peer.screenshot || "",
  screenshot: peer.screenshot || peer.screenshotUrl || "",
  categories: peer.categories || [],
  ecosystems: peer.chains || [],
  marketCap: toNullableNumber(peer.marketCap),
  fullyDilutedMarketCap: toNullableNumber(peer.fdv),
  investedAmount: toNullableNumber(
    peer.investedAmount ?? peer.fundraisingTotal
  ),
  currentValue: toNullableNumber(peer.currentValue ?? peer.marketCap),
  totalRaised: toNullableNumber(peer.fundraisingTotal),
  fundsRaised: toNullableNumber(peer.fundraisingTotal),
  investors: [],
  rating: peer.rating ? String(peer.rating) : "",
  fullness: "",
  banner: "",
  lastFunding: new Date(),
  status: "",
  entryPrice: toNullableNumber(peer.entryPrice),
  currentPrice: toNullableNumber(peer.currentPrice),
  athPrice: toNullableNumber(peer.athPrice),
  entryRoundName: peer.entryRoundName || null,
  entrySource: peer.entrySource || null,
  roiX: toNullableNumber(peer.roiX ?? peer.currentRoiXFromIco),
  roiPercent: toNullableNumber(peer.roiPercent ?? peer.currentRoiFromIco),
  athRoiX: toNullableNumber(peer.athRoiX ?? peer.athRoiXFromIco),
  athRoiPercent: toNullableNumber(peer.athRoiPercent ?? peer.athRoiFromIco),
  roiData: {
    roi: toNullableNumber(peer.roiPercent ?? peer.currentRoiFromIco),
    roiPercent: toNullableNumber(peer.roiPercent ?? peer.currentRoiFromIco),
    roiX: toNullableNumber(peer.roiX ?? peer.currentRoiXFromIco),
    athRoi: toNullableNumber(peer.athRoiPercent ?? peer.athRoiFromIco),
    athRoiX: toNullableNumber(peer.athRoiX ?? peer.athRoiXFromIco),
  },
  fomoScore: toNullableNumber(peer.fomoScore),
});

const mapComparisonDataToProject = (
  project: IProject,
  comparisonData: IcoComparisonResponse | null
): IProject => {
  if (!comparisonData) {
    return {
      ...(project as any),
      _id: (project as any)._id || (project as any).id || project.slug,
      screenshotUrl: getProjectScreenshot(project),
      screenshot: getProjectScreenshot(project),
      roiX: resolveProjectRoiX(project),
      roiPercent: resolveProjectRoiPercent(project),
    } as IProject;
  }
  const sourceProject: any = project;
  const roiPercent = toNullableNumber(
    comparisonData.roi?.roiPercent ?? comparisonData.roi?.currentRoiFromIco
  );
  const roiX = toNullableNumber(
    comparisonData.roi?.roiX ?? comparisonData.roi?.currentRoiXFromIco
  );
  const athRoiPercent = toNullableNumber(
    comparisonData.roi?.athRoiPercent ?? comparisonData.roi?.athRoiFromIco
  );
  const athRoiX = toNullableNumber(
    comparisonData.roi?.athRoiX ?? comparisonData.roi?.athRoiXFromIco
  );

  const mappedProject: any = {
    ...sourceProject,
    _id: sourceProject._id || comparisonData.project.id,
    name: sourceProject.name || comparisonData.project.name,
    slug: sourceProject.slug || comparisonData.project.slug,
    symbol: firstDefined(sourceProject.symbol, comparisonData.project.symbol),
    logo: firstDefined(sourceProject.logo, comparisonData.project.logo),
    screenshotUrl: firstDefined(
      getProjectScreenshot(sourceProject),
      comparisonData.project.screenshotUrl,
      comparisonData.project.screenshot
    ),
    screenshot: firstDefined(
      comparisonData.project.screenshot,
      comparisonData.project.screenshotUrl,
      getProjectScreenshot(sourceProject)
    ),
    categories: firstDefined(
      sourceProject.categories,
      comparisonData.project.categories
    ),
    ecosystems: firstDefined(
      sourceProject.ecosystems,
      comparisonData.project.chains
    ),
    price: firstPositiveValue(
      sourceProject.price,
      comparisonData.market?.currentPrice
    ),
    marketCap: toNullableNumber(
      firstPositiveValue(
        sourceProject.marketCap,
        comparisonData.market?.marketCap
      )
    ),
    fullyDilutedMarketCap: toNullableNumber(
      firstPositiveValue(
        sourceProject.fullyDilutedMarketCap,
        comparisonData.market?.fdv
      )
    ),
    investedAmount: toNullableNumber(
      firstPositiveValue(
        sourceProject.investedAmount,
        comparisonData.fundraising?.totalRaised
      )
    ),
    currentValue: toNullableNumber(
      firstPositiveValue(
        sourceProject.currentValue,
        comparisonData.market?.marketCap
      )
    ),
    totalRaised: toNullableNumber(
      firstPositiveValue(
        sourceProject.totalRaised,
        comparisonData.fundraising?.totalRaised
      )
    ),
    fundsRaised: toNullableNumber(
      firstPositiveValue(
        sourceProject.fundsRaised,
        comparisonData.fundraising?.totalRaised
      )
    ),
    entryPrice: toNullableNumber(
      comparisonData.roi?.entryPrice ?? comparisonData.roi?.icoPrice
    ),
    currentPrice: toNullableNumber(comparisonData.roi?.currentPrice),
    athPrice: toNullableNumber(comparisonData.roi?.athPrice),
    roiX,
    roiPercent,
    athRoiX,
    athRoiPercent,
    totalSupply: firstPositiveValue(
      sourceProject.totalSupply,
      comparisonData.market?.totalSupply
    ),
    circulatingSupply: firstPositiveValue(
      sourceProject.circulatingSupply,
      comparisonData.market?.circulatingSupply
    ),
    athUsd: firstPositiveValue(
      sourceProject.athUsd,
      comparisonData.market?.athPrice
    ),
    atlUsd: firstPositiveValue(
      sourceProject.atlUsd,
      comparisonData.market?.atlPrice
    ),
    roiData: {
      ...(sourceProject.roiData || {}),
      roi: roiPercent,
      roiPercent,
      roiX,
      athRoi: athRoiPercent,
      athRoiX,
    },
    tokenomics: {
      ...(sourceProject.tokenomics || {}),
      ...(comparisonData.tokenomics || {}),
    },
  };

  return mappedProject;
};

const getApiPeerRows = (
  comparisonData: IcoComparisonResponse | null
): IcoComparisonPeer[] =>
  comparisonData?.comparisonTable?.length
    ? comparisonData.comparisonTable.slice(1)
    : comparisonData?.comparisonPeers || [];

const buildChartProjectsWithExtras = (
  baseProjects: Array<any>,
  chartState: PerformanceChartState
): Array<any> => {
  const currentProject = baseProjects[0] || null;
  const peerProjects = baseProjects.slice(1);
  const hiddenProjectIds = new Set(chartState.hiddenProjectIds);

  return getUniqueProjects(
    [currentProject, ...chartState.extraProjects, ...peerProjects].filter(
      Boolean
    )
  ).filter((item) => !hiddenProjectIds.has(getProjectKey(item)));
};

const IcoComparison: FC<IProps> = ({ project }) => {
  const { translateText } = useTranslation();
  const [isDescription, setIsDescription] = useState<boolean>(false);
  const [isRoi, setIsRoi] = useState<boolean>(false);
  const [shareModalData, setShareModalData] = useState<{
    name: string;
    html: HTMLDivElement | null;
  } | null>(null);
  const [visibleChartProjectIds, setVisibleChartProjectIds] = useState<
    string[]
  >([]);
  const [extraChartProjects, setExtraChartProjects] = useState<Array<any>>([]);
  const [marketCapAverageChartState, setMarketCapAverageChartState] =
    useState<PerformanceChartState>(createEmptyPerformanceChartState);
  const [fdvAverageChartState, setFdvAverageChartState] =
    useState<PerformanceChartState>(createEmptyPerformanceChartState);
  const [topRoiChartState, setTopRoiChartState] =
    useState<PerformanceChartState>(createEmptyPerformanceChartState);
  const [hasCustomChartProjects, setHasCustomChartProjects] = useState(false);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const lineChartRef = useRef<HTMLDivElement | null>(null);
  const roiBarRef = useRef<HTMLDivElement | null>(null);
  const fdvBarRef = useRef<HTMLDivElement | null>(null);
  const topRoiBarRef = useRef<HTMLDivElement | null>(null);
  const projectKey = getComparisonRouteKey(project);
  const comparisonReadModel = isV2ComparisonProject(project) ? "v2" : undefined;
  const comparisonLookup = comparisonReadModel
    ? getV2ComparisonLookup(project)
    : undefined;
  const { data: icoComparisonResponse, isLoading: isComparisonLoading } =
    useQuery(
      [
        "project-ico-comparison",
        comparisonReadModel,
        comparisonLookup,
        projectKey,
        COMPARISON_PEER_LIMIT,
      ],
      () =>
        fetchIcoComparison(projectKey, {
          peerLimit: COMPARISON_PEER_LIMIT,
          includePeers: true,
          readModel: comparisonReadModel,
          lookup: comparisonLookup,
        }),
      {
        enabled: Boolean(projectKey),
        staleTime: COMPARISON_QUERY_STALE_TIME,
        cacheTime: COMPARISON_QUERY_CACHE_TIME,
        refetchOnWindowFocus: false,
      }
    );
  const icoComparisonData = icoComparisonResponse?.isSuccess
    ? icoComparisonResponse.data
    : null;
  const isInitialComparisonLoading =
    Boolean(projectKey) && isComparisonLoading && !icoComparisonResponse;
  const currentProjectKeys = useMemo(
    () =>
      [
        (project as any)?._id,
        (project as any)?.id,
        project?.slug,
        (project as any)?.sourceId,
        project?.name,
        icoComparisonData?.project?.id,
        icoComparisonData?.project?.slug,
        icoComparisonData?.project?.name,
      ]
        .map((item) => String(item || "").toLowerCase())
        .filter(Boolean),
    [project, icoComparisonData]
  );
  const apiPeerRows = useMemo(
    () => getApiPeerRows(icoComparisonData),
    [icoComparisonData]
  );
  const apiPeerProjects = useMemo(
    () => apiPeerRows.map(mapPeerToProject).filter(hasProjectRoi),
    [apiPeerRows]
  );

  useEffect(() => {
    setExtraChartProjects([]);
    setMarketCapAverageChartState(createEmptyPerformanceChartState());
    setFdvAverageChartState(createEmptyPerformanceChartState());
    setTopRoiChartState(createEmptyPerformanceChartState());
    setHasCustomChartProjects(false);
  }, [projectKey]);

  const comparisonProjects = useMemo(() => {
    const currentProject = mapComparisonDataToProject(
      project,
      icoComparisonData
    );
    const localPeers = ((project.comparison || []) as Array<IProject>).filter(
      hasProjectRoi
    );
    const initialProjects = [currentProject, ...apiPeerProjects, ...localPeers];
    const uniqueProjects = getUniqueProjects(initialProjects);

    return sortProjectsByRoiDesc(uniqueProjects).slice(
      0,
      COMPARISON_PROJECT_LIMIT
    );
  }, [project, icoComparisonData, apiPeerProjects]);
  const defaultChartProjects = useMemo(() => {
    const currentProject = mapComparisonDataToProject(
      project,
      icoComparisonData
    );
    const nearestPeer = apiPeerRows[0]
      ? mapPeerToProject(apiPeerRows[0])
      : null;

    return getUniqueProjects([currentProject, nearestPeer].filter(Boolean));
  }, [project, icoComparisonData, apiPeerRows]);
  const performanceChartBaseProjects = useMemo(() => {
    const currentProject = mapComparisonDataToProject(
      project,
      icoComparisonData
    );
    const localPeers = ((project.comparison || []) as Array<IProject>).filter(
      hasProjectRoi
    );
    const projects = [currentProject, ...apiPeerProjects, ...localPeers];

    return getUniqueProjects(projects);
  }, [project, apiPeerProjects]);
  const performanceChartBaseProjectIds = useMemo(
    () =>
      new Set(performanceChartBaseProjects.map(getProjectKey).filter(Boolean)),
    [performanceChartBaseProjects]
  );
  const marketCapAverageChartProjects = useMemo(
    () =>
      buildChartProjectsWithExtras(
        performanceChartBaseProjects,
        marketCapAverageChartState
      ),
    [performanceChartBaseProjects, marketCapAverageChartState]
  );
  const fdvAverageChartProjects = useMemo(
    () =>
      buildChartProjectsWithExtras(
        performanceChartBaseProjects,
        fdvAverageChartState
      ),
    [performanceChartBaseProjects, fdvAverageChartState]
  );
  const topRoiChartProjects = useMemo(
    () =>
      buildChartProjectsWithExtras(
        performanceChartBaseProjects,
        topRoiChartState
      ),
    [performanceChartBaseProjects, topRoiChartState]
  );
  const chartSourceProjects = useMemo(() => {
    const projects = [...defaultChartProjects, ...extraChartProjects];

    return getUniqueProjects(projects);
  }, [defaultChartProjects, extraChartProjects]);
  const chartSourceProjectIds = useMemo(
    () => chartSourceProjects.map(getProjectKey).filter(Boolean),
    [chartSourceProjects]
  );
  const chartSourceProjectIdsKey = chartSourceProjectIds.join("|");

  useEffect(() => {
    setVisibleChartProjectIds((prev) => {
      if (!chartSourceProjectIds.length) return [];

      if (!hasCustomChartProjects) {
        return chartSourceProjectIds.slice(0, INVESTMENT_ROI_PROJECT_LIMIT);
      }

      const nextVisibleIds = prev.filter((id) =>
        chartSourceProjectIds.includes(id)
      );
      return nextVisibleIds.length
        ? nextVisibleIds
        : [chartSourceProjectIds[0]];
    });
  }, [chartSourceProjectIdsKey, hasCustomChartProjects]);

  const investmentRoiProjects = useMemo(() => {
    if (!hasCustomChartProjects) {
      return chartSourceProjects.slice(0, INVESTMENT_ROI_PROJECT_LIMIT);
    }

    const visibleProjects = chartSourceProjects.filter((comparisonProject) =>
      visibleChartProjectIds.includes(getProjectKey(comparisonProject))
    );

    return visibleProjects.length
      ? visibleProjects
      : chartSourceProjects.slice(0, 1);
  }, [chartSourceProjects, hasCustomChartProjects, visibleChartProjectIds]);
  const addChartProject = (
    projectToAdd: IcoComparisonPeer | IProject | any
  ) => {
    if (!projectToAdd) return;

    const normalizedProject = (projectToAdd as any)._id
      ? projectToAdd
      : mapPeerToProject(projectToAdd as IcoComparisonPeer);
    const projectId = getProjectKey(normalizedProject);
    if (!projectId) return;

    setHasCustomChartProjects(true);
    setExtraChartProjects((prev) => {
      if (
        chartSourceProjectIds.includes(projectId) ||
        prev.some((item) => getProjectKey(item) === projectId)
      ) {
        return prev;
      }

      return [...prev, normalizedProject];
    });
    setVisibleChartProjectIds((prev) =>
      prev.includes(projectId) ? prev : [...prev, projectId]
    );
  };

  const removeChartProject = (projectId: string) => {
    if (!projectId) return;

    setHasCustomChartProjects(true);
    setVisibleChartProjectIds((prev) =>
      prev.length <= 1 ? prev : prev.filter((id) => id !== projectId)
    );
  };

  const canRemoveChartProject = () => visibleChartProjectIds.length > 1;
  const createAddPerformanceChartProject =
    (
      setChartState: React.Dispatch<React.SetStateAction<PerformanceChartState>>
    ) =>
    (projectToAdd: IcoComparisonPeer | IProject | any) => {
      if (!projectToAdd) return;

      const normalizedProject = (projectToAdd as any)._id
        ? projectToAdd
        : mapPeerToProject(projectToAdd as IcoComparisonPeer);
      const projectId = getProjectKey(normalizedProject);
      if (!projectId) return;

      setChartState((prev) => {
        const hiddenProjectIds = prev.hiddenProjectIds.filter(
          (id) => id !== projectId
        );

        if (
          performanceChartBaseProjectIds.has(projectId) ||
          prev.extraProjects.some((item) => getProjectKey(item) === projectId)
        ) {
          return {
            extraProjects: prev.extraProjects,
            hiddenProjectIds,
          };
        }

        return {
          extraProjects: [...prev.extraProjects, normalizedProject],
          hiddenProjectIds,
        };
      });
    };
  const createRemovePerformanceChartProject =
    (
      setChartState: React.Dispatch<React.SetStateAction<PerformanceChartState>>
    ) =>
    (projectId: string) => {
      if (!projectId) return;

      setChartState((prev) => {
        const extraProjects = prev.extraProjects.filter(
          (item) => getProjectKey(item) !== projectId
        );
        const wasExtraProject =
          extraProjects.length !== prev.extraProjects.length;

        return {
          extraProjects,
          hiddenProjectIds:
            wasExtraProject || prev.hiddenProjectIds.includes(projectId)
              ? prev.hiddenProjectIds
              : [...prev.hiddenProjectIds, projectId],
        };
      });
    };
  const addMarketCapAverageChartProject = createAddPerformanceChartProject(
    setMarketCapAverageChartState
  );
  const addFdvAverageChartProject = createAddPerformanceChartProject(
    setFdvAverageChartState
  );
  const addTopRoiChartProject =
    createAddPerformanceChartProject(setTopRoiChartState);
  const removeMarketCapAverageChartProject =
    createRemovePerformanceChartProject(setMarketCapAverageChartState);
  const removeFdvAverageChartProject = createRemovePerformanceChartProject(
    setFdvAverageChartState
  );
  const removeTopRoiChartProject =
    createRemovePerformanceChartProject(setTopRoiChartState);
  const canRemovePerformanceChartProject = (projectId: string) =>
    Boolean(projectId);

  const isCurrentProjectRow = (item: any): boolean => {
    const itemKeys = [
      item?._id,
      item?.id,
      item?.slug,
      item?.sourceId,
      item?.name,
    ]
      .map((key) => String(key || "").toLowerCase())
      .filter(Boolean);

    return itemKeys.some((key) => currentProjectKeys.includes(key));
  };

  const openShareModal = (name: string, html: HTMLDivElement | null) => {
    setShareModalData({ name, html });
  };

  const renderPhotoButton = (
    name: string,
    getHtml: () => HTMLDivElement | null
  ) => (
    <button type="button" onClick={() => openShareModal(name, getHtml())}>
      <PhotoIcon />
    </button>
  );

  const renderTableSkeleton = () => (
    <Body variant="main">
      <Table>
        <TableHeader className="ico">
          <div>№</div>
          <div className="sticky">{translateText("Project")}</div>
          <div>{translateText("Market Cap")}</div>
          <div>{translateText("FDV")}</div>
          <div>{translateText("Raised Funds")}</div>
          <div>{translateText("ROI")}</div>
        </TableHeader>
        <RowsWrapper>
          {Array.from({ length: COMPARISON_PROJECT_LIMIT }).map((_, index) => (
            <Row isNeutral={index === 0} className="ico" key={index}>
              <div className="number">
                <Placeholder width="16px" height="14px" marginBottom="0" />
              </div>
              <div className="sticky">
                <Placeholder
                  width="20px"
                  height="20px"
                  borderRadius="50%"
                  marginBottom="0"
                />
                <Placeholder width="120px" height="16px" marginBottom="0" />
              </div>
              <div>
                <Placeholder width="70px" height="16px" marginBottom="0" />
              </div>
              <div>
                <Placeholder width="70px" height="16px" marginBottom="0" />
              </div>
              <div>
                <Placeholder width="80px" height="16px" marginBottom="0" />
              </div>
              <GainWrapper className="ico-gain" isGrow isNeutral>
                <Placeholder width="96px" height="18px" marginBottom="0" />
              </GainWrapper>
            </Row>
          ))}
        </RowsWrapper>
      </Table>
    </Body>
  );

  const renderChartSkeleton = (isInvestmentRoiChart = false) => (
    <Body variant="main">
      <ChartLoadingSkeleton
        height={isInvestmentRoiChart ? "390px" : "380px"}
        marginTop={isInvestmentRoiChart ? "14px" : "0"}
        variant={isInvestmentRoiChart ? "compact" : "default"}
      />
    </Body>
  );

  return (
    <>
      <Wrapper>
        <div ref={tableRef}>
          <TitleWrapper>
            <Title>{translateText("Project Comparison Table")}</Title>
            {renderPhotoButton(
              translateText("Project Comparison Table"),
              () => tableRef.current
            )}
          </TitleWrapper>
          {isInitialComparisonLoading ? (
            renderTableSkeleton()
          ) : (
            <Body variant="main">
              <Table>
                <TableHeader className="ico">
                  <div>№</div>
                  <div className="sticky">{translateText("Project")}</div>
                  <div>{translateText("Market Cap")}</div>
                  <div>{translateText("FDV")}</div>
                  <div className="info">
                    <button
                      onMouseEnter={() => setIsDescription(true)}
                      onMouseLeave={() => setIsDescription(false)}
                    >
                      <span>{translateText("Raised Funds")}</span>
                      <Image src={infoIcon} alt="info" />
                    </button>
                    <RaisedWrapper>
                      <DescriptionComponent
                        text={translateText(
                          "Total investments secured by the project across all funding rounds"
                        )}
                        className="performance-modal"
                        isDate={false}
                        date={new Date()}
                        isVisible={isDescription}
                      />
                    </RaisedWrapper>
                  </div>
                  <div className="info">
                    <button
                      onMouseEnter={() => setIsRoi(true)}
                      onMouseLeave={() => setIsRoi(false)}
                    >
                      <span>{translateText("ROI")}</span>
                      <Image src={infoIcon} alt="info" />
                    </button>
                    <RaisedWrapper>
                      <DescriptionComponent
                        text={translateText("ROI comparison description")}
                        className="roi-modal"
                        isDate={false}
                        date={new Date()}
                        isVisible={isRoi}
                      />
                    </RaisedWrapper>
                  </div>
                </TableHeader>
                <RowsWrapper>
                  {comparisonProjects.map((item, index) => {
                    const roiX = resolveProjectRoiX(item);
                    const roiPercent = resolveProjectRoiPercent(item);
                    const isPositive = roiPercent === null || roiPercent >= 0;

                    return (
                      <Row
                        isNeutral={isCurrentProjectRow(item)}
                        className="ico"
                        key={getProjectKey(item) || item.name}
                      >
                        <div className="number">{index + 1}</div>
                        <div className="sticky">
                          <img
                            src={getProjectImage(
                              item.logo,
                              item.name || item.symbol
                            )}
                            alt={item.name}
                            onError={setProjectImageFallback}
                          />
                          {item.name}
                        </div>
                        <div>
                          {formatMoney(toNullableNumber(item.marketCap))}
                        </div>
                        <div>
                          {formatMoney(
                            toNullableNumber(
                              item.fullyDilutedMarketCap || item.tokenomics?.fdv
                            )
                          )}
                        </div>
                        <div>
                          {formatMoney(
                            toNullableNumber(
                              item.totalRaised || item.fundsRaised
                            )
                          )}
                        </div>

                        <GainWrapper
                          className="ico-gain"
                          isGrow={isPositive}
                          isNeutral={roiPercent === null}
                        >
                          {roiX === null && roiPercent === null ? (
                            <span className="empty-value">{EMPTY_VALUE}</span>
                          ) : (
                            <>
                              <span className="roi-x">{formatRoiX(roiX)}</span>
                              <span className="roi-percent">
                                {formatRoiPercent(roiPercent)}
                              </span>
                            </>
                          )}
                        </GainWrapper>
                      </Row>
                    );
                  })}
                </RowsWrapper>
              </Table>
            </Body>
          )}
        </div>
        <div ref={lineChartRef}>
          <TitleWrapper style={{ marginTop: "20px" }}>
            <Title>{translateText("Investment vs. ROI Multipliers")}</Title>
            {renderPhotoButton(
              translateText("Investment vs. ROI Multipliers"),
              () => lineChartRef.current
            )}
          </TitleWrapper>
          {isInitialComparisonLoading ? (
            renderChartSkeleton(true)
          ) : (
            <ProjectIcoChart
              projects={investmentRoiProjects}
              historyProject={project}
              title={translateText("Compare")}
              readModel={comparisonReadModel}
              lookup={comparisonLookup}
              onAddProject={addChartProject}
              onRemoveProject={removeChartProject}
              canRemoveProject={canRemoveChartProject}
            />
          )}
        </div>
        <Title style={{ marginTop: "40px" }}>
          {translateText("Performance Comparison with Industry Average")}
        </Title>
        <div ref={roiBarRef}>
          <TitleWrapper style={{ marginTop: "20px" }}>
            <Title style={{ fontSize: "16px" }}>
              {translateText("Market Cap vs. Industry Average")}
            </Title>
            {renderPhotoButton(
              translateText("Market Cap vs. Industry Average"),
              () => roiBarRef.current
            )}
          </TitleWrapper>
          {isInitialComparisonLoading ? (
            renderChartSkeleton()
          ) : (
            <ProjectIcoBar
              metric="marketCap"
              projects={marketCapAverageChartProjects}
              project={project}
              title={translateText("Compare")}
              readModel={comparisonReadModel}
              lookup={comparisonLookup}
              onAddProject={addMarketCapAverageChartProject}
              onRemoveProject={removeMarketCapAverageChartProject}
              canRemoveProject={canRemovePerformanceChartProject}
            />
          )}
        </div>
        <div ref={fdvBarRef}>
          <TitleWrapper style={{ marginTop: "20px" }}>
            <Title style={{ fontSize: "16px" }}>
              {translateText("FDV vs. Industry Average")}
            </Title>
            {renderPhotoButton(
              translateText("FDV vs. Industry Average"),
              () => fdvBarRef.current
            )}
          </TitleWrapper>
          {isInitialComparisonLoading ? (
            renderChartSkeleton()
          ) : (
            <ProjectIcoBar
              metric="fdv"
              projects={fdvAverageChartProjects}
              project={project}
              title={translateText("Compare")}
              readModel={comparisonReadModel}
              lookup={comparisonLookup}
              onAddProject={addFdvAverageChartProject}
              onRemoveProject={removeFdvAverageChartProject}
              canRemoveProject={canRemovePerformanceChartProject}
            />
          )}
        </div>
        <div ref={topRoiBarRef}>
          <TitleWrapper style={{ marginTop: "20px" }}>
            <Title style={{ fontSize: "16px" }}>
              {translateText("ROI Multiplier vs. Top Performers")}
            </Title>
            {renderPhotoButton(
              translateText("ROI Multiplier vs. Top Performers"),
              () => topRoiBarRef.current
            )}
          </TitleWrapper>
          {isInitialComparisonLoading ? (
            renderChartSkeleton()
          ) : (
            <ProjectIcoBar
              metric="roi"
              projects={topRoiChartProjects}
              project={project}
              title={translateText("Compare")}
              readModel={comparisonReadModel}
              lookup={comparisonLookup}
              onAddProject={addTopRoiChartProject}
              onRemoveProject={removeTopRoiChartProject}
              canRemoveProject={canRemovePerformanceChartProject}
            />
          )}
        </div>
      </Wrapper>
      <SaveShareModal
        name={shareModalData?.name}
        link={typeof window !== "undefined" ? window.location.href : ""}
        html={shareModalData?.html || null}
        isVisible={Boolean(shareModalData)}
        onClose={() => setShareModalData(null)}
      />
    </>
  );
};

export default IcoComparison;
