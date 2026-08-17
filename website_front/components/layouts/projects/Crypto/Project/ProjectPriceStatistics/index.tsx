import React, { FC, useContext, useState } from "react";
import PriceChart from "../../../../../global/common/PriceChart";
import {
  CardIcon,
  CardInfoIcon,
  CardInfoTooltip,
  CardInfoTooltipWrapper,
  CardKey,
  CardRow,
  CardTitle,
  CardValue,
  ChartWrapper,
  PercentKey,
  PercentUpdateItem,
  PercentUpdates,
  PerformanceHeader,
  SecondaryStatisticsWrapper,
  StatisticsCard,
  StatisticsWrapper,
  Wrapper,
} from "./styles";
import { ProjectDataContext } from "../../../../../../contexts/projectDataContext";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import PercentValue from "../../../../../global/common/PercentValue";
import CustomSelect from "../../../../../global/common/CustomSelect";
import moment from "moment";
import { simplifyAmount } from "../../../../../../helpers/simplifyAmount";

import { useTranslation } from "i18n";
import {
  Activity,
  ChartLine,
  CircleDollarSign,
  Coins,
  Info,
  Trophy,
} from "lucide-react";

const formatDominance = (value: any): string => {
  const dominance = Number(value || 0);
  if (!Number.isFinite(dominance) || dominance === 0) return "--";

  return `${dominance.toFixed(2)}%`;
};

const formatSupply = (value: any, symbol?: string): string => {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue) || numericValue === 0) return "--";

  const suffix = String(symbol || "").trim().toUpperCase();
  const formatted = String(clarifyAmount(numericValue));
  return suffix ? `${formatted} ${suffix}` : formatted;
};

const formatDate = (value: any): string => {
  if (!value) return "--";
  const date = moment(String(value));
  return date.isValid() ? date.format("ll") : "--";
};

const formatUsdValue = (value: any): string => {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue) || numericValue === 0) return "--";
  return `$${simplifyAmount(numericValue)}`;
};

type PerformancePeriod = "1H" | "1D" | "1W" | "1M" | "3M" | "1Y";

const PERFORMANCE_PERIODS: Array<{ key: PerformancePeriod; label: string }> = [
  { key: "1H", label: "1h" },
  { key: "1D", label: "24h" },
  { key: "1W", label: "7d" },
  { key: "1M", label: "30d" },
  { key: "3M", label: "90d" },
  { key: "1Y", label: "1y" },
];

const getHistoryPrice = (item: any): number => {
  const value = Number(item?.price?.USD || item?.price || 0);
  return Number.isFinite(value) ? value : 0;
};

const getHistoryDate = (item: any): any => item?.createdAt || item?.timestamp;

const StatInfoTooltip = ({
  id,
  label,
  description,
}: {
  id: string;
  label: string;
  description: string;
}) => {
  const tooltipId = `market-stat-tooltip-${id}`;

  return (
    <CardInfoTooltipWrapper>
      <CardInfoIcon
        aria-label={`${label} info`}
        aria-describedby={tooltipId}
      >
        <Info />
      </CardInfoIcon>
      <CardInfoTooltip id={tooltipId} role="tooltip">
        {description}
      </CardInfoTooltip>
    </CardInfoTooltipWrapper>
  );
};

interface ProjectPriceStatisticsProps {
  compactMode?: boolean;
  onCompactModeChange?: (value: boolean) => void;
}

const ProjectPriceStatistics: FC<ProjectPriceStatisticsProps> = ({
  compactMode = false,
  onCompactModeChange,
}) => {
  const { translateText } = useTranslation();
  const [performanceMode, setPerformanceMode] = useState<"BTC" | "ETH" | "USD">(
    "USD"
  );
  const project = useContext(ProjectDataContext);
  const tokenSymbol = String(project?.symbol || project?.ticker || "").trim().toUpperCase();
  const history = Array.isArray((project as any)?.history)
    ? ((project as any).history as Array<any>)
    : [];
  const historyPoints = history
    .map((item) => ({ item, price: getHistoryPrice(item) }))
    .filter((item) => item.price > 0);
  const historyHigh = historyPoints.reduce(
    (best, item) => (!best || item.price > best.price ? item : best),
    undefined as { item: any; price: number } | undefined
  );
  const historyLow = historyPoints.reduce(
    (best, item) => (!best || item.price < best.price ? item : best),
    undefined as { item: any; price: number } | undefined
  );
  const volume24hChange =
    project?.volume24hChange ?? project?.usdQuote?.volume_change_24h ?? 0;
  const currentPrice = project?.price ?? project?.usdQuote?.price;
  const athUsd = project?.athUsd || project?.highs?.ALL?.USD || historyHigh?.price;
  const athUsdDate =
    project?.athUsdDate || project?.highsDates?.ALL?.USD || getHistoryDate(historyHigh?.item);
  const atlUsd = project?.atlUsd || project?.lows?.ALL?.USD || historyLow?.price;
  const atlUsdDate =
    project?.atlUsdDate || project?.lowsDates?.ALL?.USD || getHistoryDate(historyLow?.item);
  const renderPerformanceValue = (period: PerformancePeriod) => {
    const value = Number(project?.allTimePriceChange?.[period]?.[performanceMode]);

    if (!Number.isFinite(value) || value === 0) {
      return <span>--</span>;
    }

    return <PercentValue isIcon={false} value={value} />;
  };

  // Prepare statistics cards data for easier mapping
  const statisticsCards = [
    // Card 1: Market Cap
    <StatisticsCard key="card1" variant="main" className="market-stats-card">
      <CardTitle>
        <CardIcon>
          <CircleDollarSign />
        </CardIcon>
        <span>{translateText("Market Stats")}</span>
        <StatInfoTooltip
          id="market-stats"
          label={translateText("Market Stats")}
          description={translateText(
            "Key market indicators such as market cap, FDV and dominance."
          )}
        />
      </CardTitle>
      <CardRow>
        <CardKey>{translateText("Market Cap")}</CardKey>
        <CardValue>
          <div>${clarifyAmount(project.marketCap || 0)}</div>
        </CardValue>
      </CardRow>
      <CardRow>
        <CardKey>{translateText("Fully Diluted Valuation (FDV)")}</CardKey>
        <CardValue>
          <div>${clarifyAmount(project?.fullyDilutedMarketCap || 0)}</div>
        </CardValue>
      </CardRow>
      <CardRow>
        <CardKey>{translateText("Dominance")}</CardKey>
        <CardValue>
          <div>{formatDominance(project.dominance)}</div>
        </CardValue>
      </CardRow>
    </StatisticsCard>,

    // Card 2: Supply and Volume
    <StatisticsCard key="card2" variant="main">
      <CardTitle>
        <CardIcon>
          <Coins />
        </CardIcon>
        <span>{translateText("Supply & Volume")}</span>
        <StatInfoTooltip
          id="supply-volume"
          label={translateText("Supply & Volume")}
          description={translateText(
            "Circulating supply, total supply and 24h trading volume."
          )}
        />
      </CardTitle>
      <CardRow>
        <CardKey>{translateText("Circulating Supply")}</CardKey>
        <CardValue>
          <div>{formatSupply(project.circulatingSupply, tokenSymbol)}</div>
        </CardValue>
      </CardRow>
      <CardRow>
        <CardKey>{translateText("Volume 24H")}</CardKey>
        <CardValue>
          <div>${clarifyAmount(project?.volume24h || 0)}</div>
          <PercentValue value={volume24hChange} isIcon={false} />
        </CardValue>
      </CardRow>
      <CardRow>
        <CardKey>{translateText("Total Supply")}</CardKey>
        <CardValue>
          <div>{formatSupply(project?.totalSupply, tokenSymbol)}</div>
        </CardValue>
      </CardRow>
    </StatisticsCard>,

    // Card 3: ATH/ATL
    <StatisticsCard key="card3" variant="main">
      <CardTitle>
        <CardIcon>
          <Trophy />
        </CardIcon>
        <span>{translateText("Price Range")}</span>
        <StatInfoTooltip
          id="price-range"
          label={translateText("Price Range")}
          description={translateText(
            "Current price plus all-time high and all-time low price levels."
          )}
        />
      </CardTitle>
      <CardRow>
        <CardKey>{translateText("Current Price")}</CardKey>
        <CardValue>
          <div>{formatUsdValue(currentPrice)}</div>
        </CardValue>
      </CardRow>
      <CardRow>
        <CardKey>
          {translateText("All Time High")} -{" "}
          {formatDate(athUsdDate)}
        </CardKey>
        <CardValue>
          <div>{formatUsdValue(athUsd)}</div>
        </CardValue>
      </CardRow>
      <CardRow>
        <CardKey>
          {translateText("All Time Low")} -{" "}
          {formatDate(atlUsdDate)}
        </CardKey>
        <CardValue>
          <div>{formatUsdValue(atlUsd)}</div>
        </CardValue>
      </CardRow>
    </StatisticsCard>,
  ];

  const performance = (
    <StatisticsCard key="card4" variant="main" className="performance-card">
      <PerformanceHeader>
        <CardTitle>
          <CardIcon>
            {performanceMode === "USD" ? <ChartLine /> : <Activity />}
          </CardIcon>
          <span>{translateText("Performance")}</span>
          <StatInfoTooltip
            id="performance"
            label={translateText("Performance")}
            description={translateText(
              "Price change across different time periods."
            )}
          />
        </CardTitle>
        <CustomSelect
          placeholder="USD"
          className="small-select market-project-select market-project-select-dark"
          onChange={(value: any) => setPerformanceMode(value)}
          options={[
            {
              label: "USD",
              value: "USD",
            },
            {
              label: "ETH",
              value: "ETH",
            },
            {
              label: "BTC",
              value: "BTC",
            },
          ]}
        />
      </PerformanceHeader>
      <PercentUpdates className="performance-values">
        {PERFORMANCE_PERIODS.map((period) => (
          <PercentUpdateItem className="performance-item" key={period.key}>
            {renderPerformanceValue(period.key)}
            <PercentKey>{period.label}</PercentKey>
          </PercentUpdateItem>
        ))}
      </PercentUpdates>
    </StatisticsCard>
  );

  return (
    <Wrapper $compact={compactMode}>
      <ChartWrapper $compact={compactMode}>
        <PriceChart
          project={project}
          compactMode={compactMode}
          onCompactModeChange={onCompactModeChange}
        />
      </ChartWrapper>

      <StatisticsWrapper $compact={compactMode}>
        {statisticsCards}
        {!compactMode ? performance : null}
      </StatisticsWrapper>

      {compactMode ? (
        <SecondaryStatisticsWrapper>{performance}</SecondaryStatisticsWrapper>
      ) : null}
    </Wrapper>
  );
};

export default ProjectPriceStatistics;
