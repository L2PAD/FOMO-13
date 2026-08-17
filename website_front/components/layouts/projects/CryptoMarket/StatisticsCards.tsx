import React, { useContext } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import {
  ChartWrapper,
  MainInfoStatistics,
  MarketCapCard,
  MarketCapHeader,
  MarketCapSymbol,
  MarketCapTitle,
  MarketCapValue,
  StatisticsCardLine,
} from "./styles";
import StatisticsCard from "../../../global/common/StatisticsCard";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";
import { LayoutContext } from "../../../global/Layout";
import PercentValue from "../../../global/common/PercentValue";
import TotalMarketCapChart from "../../../global/TotalMarketCapChart";
import { simplifyAmount } from "../../../../helpers/simplifyAmount";
import SemiCircleChart from "../../../global/common/GaugeChart";
import { IProject } from "../../../../types/global_types";
import "swiper/css";
import "swiper/css/pagination";
import Placeholder from "../../../global/common/Placeholder";
import { useTranslation } from "i18n";

export interface ICryptoStatisticsCard {
  key: string;
  title: string;
  renderContent: () => React.ReactNode;
}

export interface ICryptoStatisticsCards {
  isLoading: boolean;
  tabsData?: {
    isSuccess: boolean;
    recentlyAdded: Array<IProject>;
    topGainers: Array<IProject>;
    trending: Array<IProject>;
    accumulation: Array<IProject>;
    hotProjects: Array<IProject>;
  };
  activitiesData?: any;
  activitiesLoading?: boolean;
}

export const useCryptoStatisticsCards = (
  _props: ICryptoStatisticsCards
): Array<ICryptoStatisticsCard> => {
  const { translateText } = useTranslation();
  const layoutData = useContext(LayoutContext);
  const isStatisticsLoading = !!layoutData?.isLoading || _props.isLoading;

  const renderChartPlaceholder = (height = "110px") => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        height: "100%",
      }}
    >
      <Placeholder width="62%" height="28px" borderRadius="8px" marginBottom="0" />
      <Placeholder width="34%" height="18px" borderRadius="999px" marginBottom="0" />
      <Placeholder width="100%" height={height} borderRadius="12px" marginBottom="0" />
    </div>
  );

  const renderListPlaceholder = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        height: "100%",
      }}
    >
      <Placeholder width="56%" height="26px" borderRadius="8px" marginBottom="0" />
      <Placeholder width="38%" height="18px" borderRadius="999px" marginBottom="0" />
      <Placeholder width="100%" height="1px" borderRadius="999px" marginBottom="0" />
      <Placeholder width="48%" height="16px" borderRadius="8px" marginBottom="0" />
      <Placeholder width="66%" height="24px" borderRadius="8px" marginBottom="0" />
      <Placeholder width="32%" height="18px" borderRadius="999px" marginBottom="0" />
    </div>
  );

  const renderGaugePlaceholder = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        height: "100%",
      }}
    >
      <Placeholder width="100%" height="120px" borderRadius="16px" marginBottom="0" />
      <Placeholder width="48%" height="18px" borderRadius="999px" marginBottom="0" />
    </div>
  );

  const statisticsCards: Array<ICryptoStatisticsCard> = [
    {
      key: "total-market-cap",
      title: translateText("Total M. Cap"),
      renderContent: () => (
        isStatisticsLoading ? (
          renderChartPlaceholder()
        ) : (
          <MarketCapCard>
            <MarketCapHeader>
              <MarketCapValue>
                {`$${clarifyAmount(
                  layoutData?.layout?.header?.data?.total_market_cap || 0
                )}`}
              </MarketCapValue>
              <PercentValue
                value={(
                  layoutData?.layout?.header?.data
                    ?.total_market_cap_yesterday_percentage_change || 0
                ).toFixed(2)}
              />
            </MarketCapHeader>
            <TotalMarketCapChart
              data={layoutData?.layout?.header?.history || []}
              dataKey="total_market_cap"
              isGrowing={
                (layoutData?.layout?.header?.data
                  ?.total_market_cap_yesterday_percentage_change || 0) > 0
              }
            />
          </MarketCapCard>
        )
      ),
    },
    {
      key: "dominance",
      title: translateText("Dominance"),
      renderContent: () => (
        isStatisticsLoading ? (
          renderListPlaceholder()
        ) : (
          <MarketCapCard>
            <MarketCapHeader>
              <MarketCapSymbol>BTC</MarketCapSymbol>
              <MarketCapValue>
                {simplifyAmount(
                  layoutData?.layout?.header?.data?.btc_dominance || 0,
                  2
                )}
                %
              </MarketCapValue>
              <PercentValue
                value={(
                  layoutData?.layout?.header?.data
                    ?.btc_dominance_24h_percentage_change || 0
                ).toFixed(2)}
              />
            </MarketCapHeader>

            <MarketCapHeader className="margin-top-12">
              <MarketCapSymbol>ETH</MarketCapSymbol>
              <MarketCapValue>
                {simplifyAmount(
                  layoutData?.layout?.header?.data?.eth_dominance || 0,
                  2
                )}
                %
              </MarketCapValue>
              <PercentValue
                value={(
                  layoutData?.layout?.header?.data
                    ?.eth_dominance_24h_percentage_change || 0
                ).toFixed(2)}
              />
            </MarketCapHeader>

            <StatisticsCardLine />

            <MarketCapTitle>{translateText("BTC 24h Volume")}</MarketCapTitle>
            <MarketCapHeader>
              <MarketCapValue>
                $
                {clarifyAmount(
                  layoutData?.layout?.header?.data?.total_volume_24h || 0
                )}
              </MarketCapValue>
              <PercentValue
                value={(
                  layoutData?.layout?.header?.data
                    ?.total_volume_24h_yesterday_percentage_change || 0
                ).toFixed(2)}
              />
            </MarketCapHeader>
          </MarketCapCard>
        )
      ),
    },
    {
      key: "fear-and-greed-index",
      title: translateText("Fear & Greed Index"),
      renderContent: () => (
        isStatisticsLoading ? (
          renderGaugePlaceholder()
        ) : (
          <ChartWrapper>
            <SemiCircleChart
              value={layoutData?.layout?.header?.data?.fear_and_greed?.value || 0}
            />
          </ChartWrapper>
        )
      ),
    },
    {
      key: "total-2",
      title: translateText("Total 2"),
      renderContent: () => (
        isStatisticsLoading ? (
          renderChartPlaceholder()
        ) : (
          <MarketCapCard>
            <MarketCapHeader>
              <MarketCapValue>
                {`$${clarifyAmount(
                  layoutData?.layout?.header?.data?.marketCapWithoutBTC || 0
                )}`}
              </MarketCapValue>
              <PercentValue
                value={(
                  layoutData?.layout?.header?.data?.marketCapWithoutBTCChange || 0
                ).toFixed(2)}
              />
            </MarketCapHeader>
            <TotalMarketCapChart
              data={layoutData?.layout?.header?.marketCapWithoutBTCHistory || []}
              dataKey="marketCapWithoutBTC"
              isGrowing={
                (layoutData?.layout?.header?.data?.marketCapWithoutBTCChange ||
                  0) > 0
              }
            />
          </MarketCapCard>
        )
      ),
    },
    {
      key: "markets",
      title: "",
      renderContent: () => (
        isStatisticsLoading ? (
          renderListPlaceholder()
        ) : (
          <MarketCapCard className="price-card">
            <MarketCapHeader className="align-flex-end">
              <div>
                <MarketCapSymbol>S&P 500</MarketCapSymbol>
                <MarketCapValue className="margin-top-12">
                  $
                  {clarifyAmount(layoutData?.layout?.header?.data?.spPrice || 0)}
                </MarketCapValue>
              </div>
              <PercentValue
                value={(
                  layoutData?.layout?.header?.data?.spPriceChange || 0
                ).toFixed(2)}
              />
            </MarketCapHeader>

            <StatisticsCardLine style={{ margin: "auto 0" }} />

            <MarketCapHeader className="align-flex-end">
              <div>
                <MarketCapSymbol>{translateText("Gold")}</MarketCapSymbol>
                <MarketCapValue className="margin-top-12">
                  $
                  {clarifyAmount(
                    layoutData?.layout?.header?.data?.goldPrice || 0
                  )}
                </MarketCapValue>
              </div>
              <PercentValue
                value={(
                  layoutData?.layout?.header?.data?.goldPriceChange || 0
                ).toFixed(2)}
              />
            </MarketCapHeader>
          </MarketCapCard>
        )
      ),
    },
    {
      key: "altcoin-season-index",
      title: translateText("Altcoin Season Index"),
      renderContent: () => (
        isStatisticsLoading ? (
          renderGaugePlaceholder()
        ) : (
          <ChartWrapper>
            <SemiCircleChart
              value={layoutData?.layout?.header?.data?.altcoinSeasonIndex || 0}
            />
          </ChartWrapper>
        )
      ),
    },
  ];

  return statisticsCards;
};

const CryptoStatisticsCards = (_props: ICryptoStatisticsCards) => {
  const statisticsCards = useCryptoStatisticsCards(_props);

  return (
    <MainInfoStatistics>
      <div className="statistics-grid">
        {statisticsCards.map((card) => (
          <StatisticsCard
            key={card.key}
            title={card.title}
            className="statistics-card shadow-card"
          >
            {card.renderContent()}
          </StatisticsCard>
        ))}
      </div>

      <div className="statistics-slider">
        <Swiper
          modules={[Pagination]}
          slidesPerView={1}
          spaceBetween={12}
          pagination={{ clickable: true }}
        >
          {statisticsCards.map((card) => (
            <SwiperSlide key={card.key}>
              <StatisticsCard
                title={card.title}
                className="statistics-card shadow-card"
              >
                {card.renderContent()}
              </StatisticsCard>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </MainInfoStatistics>
  );
};

export default CryptoStatisticsCards;
