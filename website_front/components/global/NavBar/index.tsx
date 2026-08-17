import React, { FC } from "react";
import { clarifyAmount } from "../../../helpers/clarifyAmount";
import { simplifyAmount } from "../../../helpers/simplifyAmount";
import {
  DataWrapper,
  LoadingItem,
  LoadingMarquee,
  LoadingTrack,
  NavBarWrapper,
  Percentage,
  Price,
  Title,
} from "./styles";
import "swiper/css";
import "swiper/css/autoplay";
import Placeholder from "../common/Placeholder";
import { useTranslation } from "i18n";

const Marquee: FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="marquee-container">
      <div className="marquee-content">
        <span className="marquee-item">{children}</span>
        <span className="marquee-item" aria-hidden="true">
          {children}
        </span>{" "}
      </div>

      <style>{`
                .marquee-container {
                    width: 100%;
                    overflow: hidden;
                    white-space: nowrap;
                    box-sizing: border-box;
                    position: relative;
                }

                .marquee-content {
                    display: inline-block;
                    white-space: nowrap;
                    animation: marquee 50s linear infinite;
                }

                .marquee-content .marquee-item {
                    display: inline-block;
                    padding-right: 0px;
                }

                .marquee-container:hover .marquee-content {
                    animation-play-state: paused;
                }

                @keyframes marquee {
                    0% {
                        transform: translateX(0%);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
            `}</style>
    </div>
  );
};

export const STORAGE_UPDATES_KEY = "FOMO-UPDATES";

export interface IFomoNotification { _id: string, title: string, page: string, date: Date }

interface IProps {
  statistics: any;
  isLoading?: boolean;
}

const formatTickerPercentage = (
  value?: number | string | null
): string => {
  const numericValue =
    typeof value === "number"
      ? value
      : Number(String(value ?? "").replace(/[^0-9.-]/g, ""));

  if (!Number.isFinite(numericValue) || numericValue === 0) return "0";

  const roundedValue = Number(numericValue.toFixed(4));

  if (roundedValue === 0) {
    return numericValue < 0 ? "-<0.0001" : "<0.0001";
  }

  return roundedValue.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
};

const NavBar: FC<IProps> = ({ statistics, isLoading = false }) => {
  const { t } = useTranslation();
  const placeholderWidths = [
    ["58px", "72px", "34px"],
    ["76px", "54px", "38px"],
    ["74px", "62px", "36px"],
    ["68px", "88px", "40px"],
    ["34px", "64px", "32px"],
    ["70px", "44px"],
    ["88px", "52px"],
  ];

  const renderStatisticsPlaceholder = () => (
    <LoadingMarquee>
      <LoadingTrack>
        {[...placeholderWidths, ...placeholderWidths].map((widths, index) => (
          <LoadingItem key={`${widths.join("-")}-${index}`}>
            {widths.map((width, innerIndex) => (
              <Placeholder
                key={`${width}-${innerIndex}`}
                width={width}
                height="14px"
                borderRadius="6px"
                marginBottom="0"
              />
            ))}
          </LoadingItem>
        ))}
      </LoadingTrack>
    </LoadingMarquee>
  );

  return (
    <NavBarWrapper>
      <DataWrapper>
        {isLoading ? (
          renderStatisticsPlaceholder()
        ) : (
          <Marquee>
            <Title>
              {t("navBar.marketCap")}:{" "}
              <Price>
                {clarifyAmount(statistics?.total_market_cap || 0)} USD
              </Price>{" "}
              <Percentage
                amount={
                  statistics?.total_market_cap_yesterday_percentage_change || 0
                }
              >
                {formatTickerPercentage(
                  statistics?.total_market_cap_yesterday_percentage_change || 0
                )}
                %
              </Percentage>
            </Title>

            <Title>
              {t("navBar.btcDominance")}:{" "}
              <Price>
                {simplifyAmount(statistics?.btc_dominance || 0)} T USD
              </Price>{" "}
              <Percentage
                amount={statistics?.btc_dominance_24h_percentage_change || 0}
              >
                {formatTickerPercentage(
                  statistics?.btc_dominance_24h_percentage_change || 0
                )}
                %
              </Percentage>
            </Title>

            <Title>
              {t("navBar.ethDominance")}:{" "}
              <Price>
                {simplifyAmount(statistics?.eth_dominance || 0)} T USD
              </Price>{" "}
              <Percentage
                amount={statistics?.eth_dominance_24h_percentage_change || 0}
              >
                {formatTickerPercentage(
                  statistics?.eth_dominance_24h_percentage_change || 0
                )}
                %
              </Percentage>
            </Title>

            <Title>
              {t("navBar.volume24h")}:{" "}
              <Price>{clarifyAmount(statistics?.total_volume_24h)} USD</Price>{" "}
              <Percentage
                amount={statistics?.total_volume_24h_yesterday_percentage_change}
              >
                {formatTickerPercentage(
                  statistics?.total_volume_24h_yesterday_percentage_change || 0
                )}
                %
              </Percentage>
            </Title>
            <Title>
              {t("navBar.gold")} <Price>{clarifyAmount(statistics?.goldPrice)} USD</Price>{" "}
              <Percentage amount={statistics?.goldPriceChange}>
                {formatTickerPercentage(statistics?.goldPriceChange || 0)}%
              </Percentage>
            </Title>
            <Title>
              {t("navBar.exchanges")} <Price>{statistics?.active_exchanges || 0}</Price>{" "}
            </Title>
            <Title>
              {t("navBar.fearGreed")}:{" "}
              <Price>{statistics?.fear_and_greed?.value || 0}/100</Price>{" "}
            </Title>
          </Marquee>
        )}
      </DataWrapper>
    </NavBarWrapper>
  );
};

export default NavBar;
