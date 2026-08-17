import React, { FC, useMemo, useState } from "react";
import Image from "next/image";
import CompareIcon from "../../../../../../assets/icons/compare-Icon.svg";
import CustomSelect from "../../../../../global/common/CustomSelect";
import { IProject } from "../../../../../../types/global_types";
import UserAvatar from "../../../../../global/common/UserAvatar";
import { Title } from "../Fundraising/styles";
import { TimeButton } from "../../../../../global/common/PriceChart/styles";
import Performance from "../Performance";
import {
  BlockchainSelect,
  Body,
  ButtonsWrapper,
  CompareWrapper,
  EmptyStateWrapper,
  GainWrapper,
  Header,
  Overflow,
  PerformanceButton,
  PerformanceHeader,
  ProjectWrapper,
  Row,
  RowsWrapper,
  Table,
  TableHeader,
  Wrapper,
} from "./styles";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import PercentValue from "../../../../../global/common/PercentValue";
import GainChange from "../../../../../global/common/GainChange";
import TokenMetricsComparison from "../TokenMetricsComparison";
import DescriptionComponent from "../../../../../global/common/DescriptionComponent";
import { useQuery } from "react-query";
import fetchMarketTokenComparison, {
  MarketTokenComparisonRow,
} from "../../../../../../http/projects/fetchMarketTokenComparison";
import {
  getProjectImage,
  setProjectImageFallback,
} from "../../../../../../helpers/imageFallbacks";
import PlaceholderTable from "../../../../../global/common/PlaceholderTable";
import { useTranslation } from "i18n";
import EmptyList from "../../../../../global/EmptyList";
import { resolveProjectTokenDisplaySymbol } from "../../../../../../helpers/projectTokenSymbol";
import TableTitleInfo from "../TableTitleInfo";

interface IProps {
  project: IProject;
}

type PerformancePeriod = "1H" | "1D" | "1W" | "1M" | "3M" | "1Y";
type PerformanceQuote = "USD" | "BTC" | "ETH" | "SOL";
type PerformanceStatus = "Bullish" | "Bearish";

const PERFORMANCE_PERIODS: PerformancePeriod[] = [
  "1H",
  "1D",
  "1W",
  "1M",
  "3M",
  "1Y",
];
const PERFORMANCE_QUOTES: PerformanceQuote[] = ["USD", "BTC", "ETH", "SOL"];
const PROJECT_ID_FIELD = "_id";

const getPerformanceScore = (
  project: IProject,
  quotes: PerformanceQuote[]
): number | null => {
  const ticker = resolveProjectTokenDisplaySymbol(project);
  const values = PERFORMANCE_PERIODS.flatMap((period) =>
    quotes
      .filter((quote) => quote !== ticker)
      .map((quote) => Number(project.allTimePriceChange?.[period]?.[quote]))
      .filter((value) => Number.isFinite(value) && value !== 0)
  );

  if (!values.length) return null;

  return values.reduce((sum, value) => sum + value, 0);
};

const getPerformanceStatus = (project: IProject): PerformanceStatus => {
  const usdScore = getPerformanceScore(project, ["USD"]);
  const score = usdScore ?? getPerformanceScore(project, PERFORMANCE_QUOTES);

  return Number(score || 0) > 0 ? "Bullish" : "Bearish";
};

const withProjectSymbol = (text: string, symbol: string): string => {
  const displaySymbol = symbol.trim();

  return displaySymbol ? text.replace(/\bSOL\b/g, displaySymbol) : text;
};

const Comparison: FC<IProps> = ({ project }) => {
  const { translateText } = useTranslation();
  const [chartValue, setChartValue] = useState<
    "marketCap" | "fullyDilutedMarketCap"
  >("marketCap");
  const [currentValue, setCurrentValue] = useState<string>(
    project?.mainCategory?.name
  );
  const projectKey = useMemo(
    () =>
      String(
        project?.coingeckoId ||
          project?.slug ||
          (project as any)?.[PROJECT_ID_FIELD] ||
          (project as any)?.readModelId ||
          ""
      ),
    [project]
  );
  const primaryCategory =
    project?.mainCategory?.name ||
    (project as any)?.category ||
    project?.categories?.[0] ||
    project?.niche ||
    "";
  const selectedCategory = currentValue || primaryCategory;
  const comparisonMetric = chartValue === "marketCap" ? "marketCap" : "fdv";
  const { data, isLoading } = useQuery(
    ["market-token-comparison", projectKey, selectedCategory, comparisonMetric],
    () => {
      return fetchMarketTokenComparison({
        id: projectKey,
        category: selectedCategory,
        metric: comparisonMetric,
        limit: 5,
      });
    },
    { enabled: Boolean(projectKey), refetchOnWindowFocus: false }
  );
  const [isDescription, setIsDescription] = useState<boolean>(false);
  const performance = useMemo(() => getPerformanceStatus(project), [project]);
  const comparisonData = data?.isSuccess ? data.data : null;
  const projectWrapperName =
    resolveProjectTokenDisplaySymbol(project, comparisonData) ||
    project?.name;
  const performanceDescription = withProjectSymbol(
    performance === "Bullish"
      ? translateText("Bullish performance description")
      : translateText("Bearish performance description"),
    projectWrapperName || ""
  );
  const categoryOptions = useMemo(() => {
    const values = comparisonData?.categories?.length
      ? comparisonData.categories
      : project?.categories?.length
        ? project.categories
        : primaryCategory
          ? [primaryCategory]
          : [];

    return values.map((item: string) => ({
      value: item,
      label: item,
    }));
  }, [comparisonData, primaryCategory, project?.categories]);

  const {
    currentProjects,
    currentProject,
  }: {
    currentProjects: Array<MarketTokenComparisonRow>;
    currentProject: MarketTokenComparisonRow | null;
  } =
    useMemo(() => {
      const currentProjects = Array.isArray(comparisonData?.rows)
        ? comparisonData.rows
        : [];
      const currentProject =
        currentProjects.find((item) => item.isBase) ||
        currentProjects.find(
          (item) =>
            item.slug === project.slug ||
            item.coingeckoId === project.coingeckoId ||
            item.readModelId === (project as any)?.readModelId
        ) ||
        null;

      return {
        currentProjects,
        currentProject,
      };
    }, [comparisonData, project]);

  return (
    <Wrapper>
      <TableTitleInfo
        className="comparison-section-title"
        tooltip={translateText(
          "Compares peer assets by price, changes, market cap, FDV, and gain potential."
        )}
      >
        <Title>{translateText("Token Comparison Table")}</Title>
      </TableTitleInfo>
      <Body variant="main">
        <Header>
          <ProjectWrapper>
            <UserAvatar
              variant="default"
              avatar={String(project.logo)}
              name={project.name}
              size="otc"
              fallbackType="project"
            />
            <span className="name">{projectWrapperName}</span>
          </ProjectWrapper>
          <BlockchainSelect>
            <Image src={CompareIcon} alt="compare" />
            {currentValue || comparisonData?.category || selectedCategory}
          </BlockchainSelect>
          <CompareWrapper>
            <div className="label">{translateText("Compare")}</div>
            <CustomSelect
              placeholder={currentValue || comparisonData?.category || selectedCategory || "Blockchain"}
              className="small-select market-project-select"
              options={categoryOptions}
              onChange={(value: string) => {
                setCurrentValue(value);
              }}
            />
          </CompareWrapper>
          <ButtonsWrapper>
            <TimeButton
              onClick={() => setChartValue("marketCap")}
              active={chartValue === "marketCap"}
            >
              {translateText("M.Cap")}
            </TimeButton>
            <TimeButton
              onClick={() => setChartValue("fullyDilutedMarketCap")}
              active={chartValue === "fullyDilutedMarketCap"}
            >
              {translateText("FDV")}
            </TimeButton>
          </ButtonsWrapper>
        </Header>
        <Overflow>
          <Table>
            <TableHeader>
              <div>№</div>
              <div className="sticky">{translateText("Asset")}</div>
              <div>{translateText("Price")}</div>
              <div>24h</div>
              <div>7d</div>
              <div>{translateText(chartValue === "marketCap" ? "FDV" : "M.Cap")}</div>
              <div>
                {translateText(chartValue === "fullyDilutedMarketCap" ? "FDV" : "M.Cap")}/{translateText("Gain Potential")}
              </div>
            </TableHeader>
            {isLoading ? (
              <PlaceholderTable height="55px" rows={5} />
            ) : (
              <RowsWrapper>
                {!currentProjects.length ? (
                  <EmptyStateWrapper>
                    <EmptyList imgWidth={150} lineHeight={170} fontSize={16} gap={10} />
                  </EmptyStateWrapper>
                ) : currentProjects.map((item: any, i: number) => {
                  const baseRank =
                    currentProject?.rank ||
                    comparisonData?.project?.rank ||
                    project?.rank ||
                    0;
                  const isLow: boolean =
                    baseRank > (item.rank || 0);
                  return (
                    <Row key={item.capId || item.id || item.slug}>
                      <div className="number">{i + 1}</div>
                      <div className="sticky">
                        <img
                          src={getProjectImage(item.logo, item.name || item.symbol)}
                          alt={item.name}
                          onError={setProjectImageFallback}
                        />
                        {item.niche}
                      </div>
                      <div>${clarifyAmount(Number(item.price))}</div>
                      <div>
                        <PercentValue
                          isIcon={false}
                          size="small"
                          value={Number(item.change24h)}
                        />
                      </div>
                      <div>
                        <PercentValue
                          isIcon={false}
                          size="small"
                          value={Number(item.change7d)}
                        />
                      </div>
                      <div>
                        $
                        {clarifyAmount(
                          chartValue === "fullyDilutedMarketCap"
                            ? Number(item.marketCap)
                            : Number(item.fdv)
                        )}
                      </div>
                      <GainWrapper
                        isNeutral={item.isBase || item.slug === project.slug}
                        isGrow={isLow}
                      >
                        $
                        {clarifyAmount(
                          chartValue === "fullyDilutedMarketCap"
                            ? Number(item.fdv)
                            : Number(item.marketCap)
                        )}
                        {item.gainPotential ? (
                          <GainChange
                            value={
                              isLow
                                ? (item.gainPotential || 0).toFixed(2)
                                : -(item.gainPotential || 0).toFixed(2)
                            }
                          />
                        ) : (
                          <div />
                        )}
                      </GainWrapper>
                    </Row>
                  );
                })}
              </RowsWrapper>
            )}
          </Table>
        </Overflow>
      </Body>
      <TableTitleInfo
        className="comparison-section-title"
        style={{ marginTop: "20px" }}
        tooltip={translateText(
          "Side-by-side token metrics for the selected assets, including supply and allocation data."
        )}
      >
        <Title>{translateText("Detailed Token Metrics Comparison")}</Title>
      </TableTitleInfo>
      <TokenMetricsComparison initialProject={project} />
      <PerformanceHeader>
        <TableTitleInfo
          tooltip={translateText(
            "Performance by trading pair across recent time windows."
          )}
        >
          <h3>{translateText("Performance")}</h3>
        </TableTitleInfo>
        <PerformanceButton
          type="button"
          onMouseEnter={() => setIsDescription(true)}
          onMouseLeave={() => setIsDescription(false)}
          isBullish={performance === "Bullish"}
        >
          <span>{translateText(performance)}</span>
          {performance === "Bullish" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="8"
              viewBox="0 0 14 8"
              fill="none"
            >
              <path
                d="M0.599609 7.20078L4.18361 3.75463L7.25561 6.70847L13.3996 0.800781M13.3996 0.800781H8.79161M13.3996 0.800781V5.23155"
                stroke="#04A584"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="8"
              viewBox="0 0 14 8"
              fill="none"
            >
              <path
                d="M0.599609 0.799219L4.18361 4.24537L7.25561 1.29153L13.3996 7.19922M13.3996 7.19922H8.79161M13.3996 7.19922V2.76845"
                stroke="#FF5858"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </PerformanceButton>
        <DescriptionComponent
          text={performanceDescription}
          className="performance-modal market-dark-tooltip"
          isDate={false}
          date={new Date()}
          isVisible={isDescription}
        />
      </PerformanceHeader>
      <Performance project={project} />
    </Wrapper>
  );
};

export default Comparison;
