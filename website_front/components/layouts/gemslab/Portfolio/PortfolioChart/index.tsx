import React, { FC, useRef, useState } from "react";
import { Body, ChartWrapperBody, Header, Wrapper } from "./styles";
import {
  MonthWrapper,
  PriceDetails,
  TimeButton,
  TimeRangeButtons,
} from "../../../../global/common/PriceChart/styles";
import UniversalChartBody, {
  MetricType,
  RangeType,
} from "../../../../global/common/PriceChart/ChartBody";
import PhotoIcon from "../../../../global/Icons/PhotoIcon";
import PriceChart, {
  generateDateRange,
  getChartType,
  getDateFormatByRange,
} from "../../../../global/common/PriceChart";
import { fakeHistoryData } from "../../../../../staticContent/global";
import moment from "moment";
import PortfolioDashboard from "../Dashboard";
import UniversalPortfolioChartBody from "../../../../global/common/PriceChart/PortfolioBalanceChart";
import { IChartPriceData, IPortfolio, IPortfolioPriceData } from "../../../../../types/global_types";
import { useQuery } from "react-query";
import { fetchPortfolioChart } from "../../../../../http/portfolio";
import SaveShareModal from "../../../../global/modals/SaveShareModal";
import PortfolioChartSkeleton from "./PortfolioChartSkeleton";

interface IProps {
  portfolio: IPortfolio
  readOnlyHistory?: IPortfolioPriceData[]
  isPublic?: boolean
}

const PortfolioChart: FC<IProps> = ({ portfolio, readOnlyHistory, isPublic = false }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("price");
  const [selectedRange, setSelectedRange] = useState<RangeType>("24H");
  const [isScreenModal, setIsScreenModal] = useState<boolean>(false);
  const [htmlData, setHtmlData] = useState<HTMLDivElement | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [history, setHistory] = useState<IPortfolioPriceData[]>(readOnlyHistory || [])
  const [customRange, setCustomRange] = useState<[Date, Date] | null>(null);
  const { isLoading } = useQuery(['portfolio-chart', portfolio._id, selectedRange, isPublic],
    () => fetchPortfolioChart({ portfolioId: portfolio._id, chartType: getChartType(selectedRange), isPublic }), {
    refetchOnWindowFocus: false,
    enabled: !readOnlyHistory && !!portfolio._id,
    onSuccess: (data) => {
      setHistory(data.data)
    }
  })

  React.useEffect(() => {
    if (readOnlyHistory) {
      setHistory(readOnlyHistory);
    }
  }, [readOnlyHistory]);

  const historyPointsCount = Array.isArray(history) ? history.length : 0;
  const shouldHideChart = !isLoading && historyPointsCount <= 1;

  const handleTimeRangeChange = (range: any): void => {
    setSelectedRange(range);
  };
  const shareLink = portfolio?.shareLink || (typeof window !== "undefined" ? window.location.href : "");

  return (
    <>
      <Wrapper>
        <Header>
          <div>
            <h2>Portfolio Chart</h2>
          </div>
          <TimeRangeButtons>
            {["24H", "7D", "30D", "90D", "1Y", "ALL"].map((range: any) => (
              <TimeButton
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                active={selectedRange === range}
              >
                {range}
              </TimeButton>
            ))}
            <button
              onClick={() => {
                setIsScreenModal(true);
                setHtmlData(chartRef.current);
              }}
              className="photo-btn"
            >
              <PhotoIcon />
            </button>
          </TimeRangeButtons>
        </Header>
        <Body id="portfolio-chart-body" ref={chartRef}>
          <ChartWrapperBody variant="main">
            {isLoading ? (
              <PortfolioChartSkeleton />
            ) : historyPointsCount > 1 ? (
              <UniversalPortfolioChartBody
                name="Portfolio"
                customRange={customRange}
                setCustomRange={setCustomRange}
                history={history}
                isGrowing={Number(portfolio.totalInvested) < Number(history[history.length - 1]?.totalBalance || 0)}
              />
            ) : null}
          </ChartWrapperBody>
          <PortfolioDashboard
            portfolio={portfolio}
            isEmpty={!portfolio?.assets?.length}
          />
        </Body>
      </Wrapper>

      <SaveShareModal
        name={`${portfolio?.name || "Portfolio"}/Portfolio Chart`}
        link={shareLink}
        html={htmlData || chartRef.current}
        isVisible={isScreenModal}
        onClose={() => setIsScreenModal(false)}
      />
    </>
  );
};

export default PortfolioChart;
