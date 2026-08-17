import React, { FC, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import StatisticsCard from "../../../global/common/StatisticsCard";
import Placeholder from "../../../global/common/Placeholder";
import CategoriesTabs from "./CategoriesTabs";
import CryptoLatest from "./CryptoLatestActionsTabs";
import {
  ICryptoStatisticsCard,
  ICryptoStatisticsCards,
  useCryptoStatisticsCards,
} from "./StatisticsCards";
import {
  MobileHighlightPanel,
  MobileHighlightsTabsWrapper,
  MobileStatsSlideGrid,
} from "./styles";
import "swiper/css";
import "swiper/css/pagination";

interface IProps extends ICryptoStatisticsCards {
  isHighlights: boolean;
}

const MobileHighlightsTabs: FC<IProps> = ({
  activitiesData,
  activitiesLoading,
  isHighlights,
  isLoading,
  tabsData,
}) => {
  const statisticsCards = useCryptoStatisticsCards({
    activitiesData,
    activitiesLoading,
    isLoading,
    tabsData,
  });

  const statisticsSlides = useMemo(() => {
    const cardsMap = new Map<string, ICryptoStatisticsCard>(
      statisticsCards.map((card) => [card.key, card])
    );

    const groups = [
      [
        "total-market-cap",
        "dominance",
        "markets",
        "fear-and-greed-index",
      ],
      ["total-2", "dominance", "markets", "altcoin-season-index"],
    ];

    return groups.map((group) =>
      group
        .map((key) => cardsMap.get(key))
        .filter((card): card is ICryptoStatisticsCard => !!card)
    );
  }, [statisticsCards]);

  return (
    <MobileHighlightsTabsWrapper>
      <Swiper
        className="mobile-highlights-swiper"
        modules={[Pagination]}
        slidesPerView={1}
        spaceBetween={12}
        pagination={{ clickable: true }}
      >
        {statisticsSlides.map((slideCards, slideIndex) => (
          <SwiperSlide key={`stats-slide-${slideIndex}`}>
            <MobileStatsSlideGrid>
              {slideCards.map((card) => (
                <StatisticsCard
                  key={`${slideIndex}-${card.key}`}
                  title={card.title}
                  className="statistics-card shadow-card"
                >
                  {card.renderContent()}
                </StatisticsCard>
              ))}
            </MobileStatsSlideGrid>
          </SwiperSlide>
        ))}

        {isHighlights ? (
          isLoading ? (
            <>
              <SwiperSlide key="mobile-categories-placeholder">
                <MobileHighlightPanel>
                  <Placeholder width="100%" height="365px" borderRadius="16px" />
                </MobileHighlightPanel>
              </SwiperSlide>
              <SwiperSlide key="mobile-latest-placeholder">
                <MobileHighlightPanel>
                  <Placeholder width="100%" height="365px" borderRadius="16px" />
                </MobileHighlightPanel>
              </SwiperSlide>
            </>
          ) : (
            <>
              <SwiperSlide key="mobile-categories-slide">
                <MobileHighlightPanel>
                  <CategoriesTabs data={tabsData} />
                </MobileHighlightPanel>
              </SwiperSlide>
              <SwiperSlide key="mobile-latest-slide">
                <MobileHighlightPanel>
                  <CryptoLatest
                    isLoading={false}
                    projects={tabsData?.hotProjects || []}
                    activitiesData={activitiesData}
                    activitiesLoading={activitiesLoading}
                  />
                </MobileHighlightPanel>
              </SwiperSlide>
            </>
          )
        ) : null}
      </Swiper>
    </MobileHighlightsTabsWrapper>
  );
};

export default MobileHighlightsTabs;
