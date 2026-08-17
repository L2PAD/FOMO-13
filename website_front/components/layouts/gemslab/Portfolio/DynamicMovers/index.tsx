import React, { FC, useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import Placeholder from "../../../../global/common/Placeholder";
import PercentValue from "../../../../global/common/PercentValue";
import UserAvatar from "../../../../global/common/UserAvatar";
import { Button } from "../../../../global/common/Button";
import EmptySection from "../../../../global/EmptySection";
import EmptyList from "../../../../global/EmptyList";
import imageLoader from "../../../../../helpers/imageLoader";
import fetchPublicPortfolioMovers, {
  PublicPortfolioMoverItem,
  PublicPortfolioMoversDirection,
  PublicPortfolioMoversRange,
  PublicPortfolioMoversResponse,
} from "../../../../../http/portfolio/fetchPublicPortfolioMovers";
import {
  TimeButton,
  TimeRangeButtons,
} from "../../../../global/common/PriceChart/styles";
import {
  Asset,
  Assets,
  Header,
  PriceInfo,
  ProjectData,
  Wrapper,
} from "./styles";

const MOVERS_LIMIT = 10;
const RANGE_OPTIONS: PublicPortfolioMoversRange[] = ["24H", "7D"];

const formatUsd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);

const getEmptyTitle = (
  direction: PublicPortfolioMoversDirection,
  range: PublicPortfolioMoversRange
) => `No ${direction} for ${range}`;

const getAvatarSrc = (avatar?: string) =>
  avatar ? imageLoader(String(avatar)) : undefined;

const renderSkeletonCards = () =>
  Array.from({ length: 3 }).map((_, index) => (
    <Asset variant="main" key={`dynamic-movers-skeleton-${index}`}>
      <Header>
        <ProjectData>
          <Placeholder
            width="48px"
            height="48px"
            borderRadius="999px"
            marginBottom="0"
          />
          <div
            style={{
              display: "grid",
              gap: 8,
              width: "100%",
              minWidth: 0,
            }}
          >
            <Placeholder
              width="120px"
              height="14px"
              borderRadius="999px"
              marginBottom="0"
            />
            <Placeholder
              width="88px"
              height="12px"
              borderRadius="999px"
              marginBottom="0"
            />
          </div>
        </ProjectData>
      </Header>
      <PriceInfo>
        <div className="info">
          <div className="key">Portfolio</div>
          <Placeholder
            width="94px"
            height="18px"
            borderRadius="8px"
            marginBottom="0"
          />
        </div>
        <div className="info" style={{ alignItems: "flex-end" }}>
          <div className="key">Change</div>
          <Placeholder
            width="70px"
            height="18px"
            borderRadius="8px"
            marginBottom="0"
          />
        </div>
      </PriceInfo>
    </Asset>
  ));

const DynamicMovers: FC = () => {
  const router = useRouter();
  const [selectedRange, setSelectedRange] =
    useState<PublicPortfolioMoversRange>("24H");
  const [direction, setDirection] =
    useState<PublicPortfolioMoversDirection>("gainers");
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery<PublicPortfolioMoversResponse>(
    ["public-portfolio-movers", selectedRange, direction, MOVERS_LIMIT],
    () => fetchPublicPortfolioMovers(selectedRange, direction, MOVERS_LIMIT),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      staleTime: 30 * 1000,
    }
  );
  const items = data?.items || [];

  const handleOpenPortfolio = async (item: PublicPortfolioMoverItem) => {
    if (!item.shareCode) return;
    await router.push(`/portfolio/${item.shareCode}`);
  };

  const stateContent = (() => {
    if (isError) {
      return (
        <div
          style={{
            display: "grid",
            gap: 16,
            justifyItems: "center",
            padding: "32px 0 8px",
          }}
        >
          <EmptyList />
          <div style={{ textAlign: "center", color: "var(--main-gray)" }}>
            Failed to load dynamic movers
          </div>
          <Button variant="outlined" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      );
    }

    if (!isLoading && !isFetching && !items.length) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "32px 0 8px",
          }}
        >
          <EmptySection
            className="small-empty-section"
            title={getEmptyTitle(direction, selectedRange)}
            description="No public portfolios match this filter yet."
          />
        </div>
      );
    }

    return null;
  })();

  return (
    <Wrapper>
      <Header>
        <h2>Dynamic Movers</h2>
        <TimeRangeButtons>
          {RANGE_OPTIONS.map((range) => (
            <TimeButton
              key={range}
              onClick={() => setSelectedRange(range)}
              active={selectedRange === range}
            >
              {range}
            </TimeButton>
          ))}
          <button
            type="button"
            onClick={() => setDirection("gainers")}
            className={
              direction === "gainers" ? "sort-btn active" : "sort-btn"
            }
            aria-label="Show gainers"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="11"
              height="11"
              viewBox="0 0 11 11"
              fill="none"
            >
              <path
                d="M2.72353 1.5L9.40588 1.59412M9.40588 1.59412L9.5 8.27647M9.40588 1.59412L1.5 9.5"
                stroke="#04A584"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setDirection("losers")}
            className={direction === "losers" ? "sort-btn active" : "sort-btn"}
            aria-label="Show losers"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="11"
              height="11"
              viewBox="0 0 11 11"
              fill="none"
            >
              <path
                d="M2.72353 9.5L9.40588 9.40588M9.40588 9.40588L9.5 2.72353M9.40588 9.40588L1.5 1.5"
                stroke="#FF5858"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </TimeRangeButtons>
      </Header>
      {stateContent ? (
        stateContent
      ) : (
        <Assets>
          {(isLoading || (isFetching && !items.length)) && !items.length
            ? renderSkeletonCards()
            : items.map((item) => {
              const displayName = item.owner.displayName || "Unknown creator";
              const secondaryText = item.owner.username
                ? `@${item.owner.username}`
                : item.portfolioName
                  ? item.portfolioName
                  : item.owner.fomoId
                    ? `FOMO #${item.owner.fomoId}`
                    : "";

              return (
                <Asset variant="main" key={item.portfolioId}>
                  <Header>
                    <ProjectData>
                      <UserAvatar
                        avatar={getAvatarSrc(item.owner.avatar)}
                        size="otc"
                        variant="success"
                        name={displayName}
                      />
                      <div className="info">
                        <div>{displayName}</div>
                        <span>{secondaryText}</span>
                      </div>
                    </ProjectData>
                    <button
                      type="button"
                      onClick={() => handleOpenPortfolio(item)}
                      aria-label={`Open ${item.portfolioName}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="16"
                        viewBox="0 0 18 16"
                        fill="none"
                      >
                        <path
                          d="M10.3333 1L17 8M17 8L10.3333 15M17 8L1 8"
                          stroke="#738094"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </Header>
                  <PriceInfo>
                    <div className="info">
                      <div className="key">Portfolio</div>
                      <div
                        className="value"
                        title={item.portfolioName || "Unnamed portfolio"}
                      >
                        {formatUsd(Number(item.totalBalance || 0))}
                      </div>
                    </div>
                    <div className="info">
                      <div className="key">{selectedRange} Change</div>
                      <PercentValue value={Number(item.performanceValue || 0)} />
                    </div>
                  </PriceInfo>
                </Asset>
              );
            })}
        </Assets>
      )}
    </Wrapper>
  );
};

export default DynamicMovers;
