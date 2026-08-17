import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import {
  ChartWrapper,
  SearchMeta,
  SearchResultItem,
  SearchResults,
  TitleDescriptionWrapper,
  Wrapper,
} from "./styles";
import { TitleWrapper } from "../Comparison/styles";
import PhotoIcon from "../../../../../global/Icons/PhotoIcon";
import PersonCompareChart from "../../../../../global/common/PersonCompareChart";
import InfoIcon from "../../../../../global/Icons/InfoIcon";
import { DescriptionWrapper } from "../Leaderboard/styles";
import DescriptionComponent from "../../../../../global/common/DescriptionComponent";
import ComparedPortfolios from "../ComparedPortfolios";
import SaveShareModal from "../../../../../global/modals/SaveShareModal";
import Placeholder from "../../../../../global/common/Placeholder";
import EntityInfo from "../../../../../global/common/EntityInfo";
import { Button } from "../../../../../global/common/Button";
import fetchPortfolioRoiCompare, {
  PortfolioRoiCompareItem,
  PortfolioRoiCompareRange,
} from "../../../../../../http/portfolio/fetchPortfolioRoiCompare";
import { searchPublicPortfolios } from "../../../../../../http/portfolio";
import { FomiesPersonData } from "../components/types";

interface Props {
  personData: FomiesPersonData;
}

const RANGE_OPTIONS: PortfolioRoiCompareRange[] = [
  "24H",
  "7D",
  "30D",
  "90D",
  "1Y",
  "ALL",
];
const CHART_COLORS = ["#4F85BD", "#EB609C", "#D87D9B", "#0FA57C", "#F3A93B"];
const MAX_COMPARE_USERS = 5;

const getDisplayName = (owner: PortfolioRoiCompareItem["owner"]): string =>
  owner.name || owner.twitterData?.name || "Unnamed user";

const getDisplayUsername = (owner: PortfolioRoiCompareItem["owner"]): string =>
  owner.username || owner.twitterData?.username || "";

const getDisplayAvatar = (owner: PortfolioRoiCompareItem["owner"]): string =>
  owner.photo || owner.twitterData?.photo || "";

const arraysEqual = (left: string[], right: string[]): boolean =>
  left.length === right.length &&
  left.every((item, index) => item === right[index]);

const PortfolioROI: FC<Props> = ({ personData }) => {
  const router = useRouter();
  const roiRef = useRef<HTMLDivElement | null>(null);
  const ownerId = String(personData?._id || "");

  const [range, setRange] = useState<PortfolioRoiCompareRange>("24H");
  const [isDescriptionModal, setIsDescriptionModal] = useState<boolean>(false);
  const [isShareModal, setIsShareModal] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    ownerId ? [ownerId] : []
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchValue(searchValue.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    if (!router.isReady || !ownerId) {
      return;
    }

    const compareQuery = router.query.compare;
    const compareIds = Array.isArray(compareQuery)
      ? compareQuery.join(",")
      : String(compareQuery || "");
    const compareUsers = compareIds
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item, index, array) => array.indexOf(item) === index)
      .filter((item) => item !== ownerId)
      .slice(0, MAX_COMPARE_USERS - 1);
    const nextSelectedUserIds = [ownerId, ...compareUsers];

    setSelectedUserIds((prev) =>
      arraysEqual(prev, nextSelectedUserIds) ? prev : nextSelectedUserIds
    );
  }, [ownerId, router.isReady, router.query.compare]);

  const addUserToCompare = (userId: string) => {
    if (!userId || selectedUserIds.includes(userId)) {
      return;
    }

    if (selectedUserIds.length >= MAX_COMPARE_USERS) {
      return;
    }

    setSelectedUserIds((prev) => [...prev, userId]);
    setSearchValue("");
    setDebouncedSearchValue("");
    setIsSearchOpen(false);
  };

  const removeUserFromCompare = (userId: string) => {
    if (!userId || userId === ownerId) {
      return;
    }

    setSelectedUserIds((prev) => prev.filter((item) => item !== userId));
  };

  const {
    data: portfolioSearchData,
    isLoading: isPortfolioSearchLoading,
    isError: isPortfolioSearchError,
    refetch: refetchPortfolioSearch,
  } = useQuery(
    ["portfolio-roi-search", debouncedSearchValue, selectedUserIds],
    () => searchPublicPortfolios(debouncedSearchValue, 8),
    {
      enabled:
        isSearchOpen &&
        debouncedSearchValue.length >= 2 &&
        selectedUserIds.length < MAX_COMPARE_USERS,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  const { data, isLoading, isError, isFetching, refetch } = useQuery(
    ["portfolio-roi-compare", selectedUserIds, range],
    () => fetchPortfolioRoiCompare(selectedUserIds, range),
    {
      enabled: selectedUserIds.length > 0,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  const items = useMemo(() => {
    const responseItems = data?.items || [];
    const itemsByUserId = new Map(
      responseItems.map((item) => [item.userId, item])
    );

    return selectedUserIds
      .map((userId) => itemsByUserId.get(userId))
      .filter(Boolean) as PortfolioRoiCompareItem[];
  }, [data?.items, selectedUserIds]);

  const portfolioSearchResults = useMemo(
    () =>
      (portfolioSearchData?.items || []).filter(
        (item) =>
          item.owner?.id &&
          !selectedUserIds.includes(item.owner.id) &&
          item.owner.id !== ownerId
      ),
    [ownerId, portfolioSearchData?.items, selectedUserIds]
  );

  const chartSeries = useMemo(
    () =>
      items.map((item, index) => ({
        id: item.userId,
        label: getDisplayName(item.owner),
        username: getDisplayUsername(item.owner),
        logo: getDisplayAvatar(item.owner) || "/avatar.png",
        color: CHART_COLORS[index % CHART_COLORS.length],
        removable: item.userId !== ownerId,
        hasPublicPortfolio: item.hasPublicPortfolio,
        hasHistory: item.chart.hasHistory,
        hasBaseline: item.chart.hasBaseline,
      })),
    [items, ownerId]
  );

  const chartPoints = useMemo(() => {
    const mergedPoints = new Map<
      string,
      Record<string, string | number | null>
    >();

    items.forEach((item) => {
      item.chart.points.forEach((point) => {
        const key = new Date(point.date).toISOString();

        if (!mergedPoints.has(key)) {
          mergedPoints.set(key, { date: key });
        }

        mergedPoints.get(key)![item.userId] = point.roi;
      });
    });

    return Array.from(mergedPoints.values()).sort((left, right) => {
      const leftDate = new Date(String(left.date)).getTime();
      const rightDate = new Date(String(right.date)).getTime();
      return leftDate - rightDate;
    });
  }, [items]);

  const comparedItems = useMemo(
    () =>
      items.map((item) => ({
        userId: item.userId,
        avatar: getDisplayAvatar(item.owner) || "/avatar.png",
        name: getDisplayName(item.owner),
        username: getDisplayUsername(item.owner),
        portfolioName: item.portfolio.portfolioName,
        currentBalance: item.portfolio.currentBalance,
        allTimeRoi: item.portfolio.allTimeRoi,
        change24h: item.portfolio.change24h,
        topHeldToken: item.portfolio.topHeldToken,
        hasPublicPortfolio: item.hasPublicPortfolio,
      })),
    [items]
  );

  const renderSearchResults = () => {
    if (!isSearchOpen) {
      return null;
    }

    if (selectedUserIds.length >= MAX_COMPARE_USERS) {
      return (
        <SearchResults variant="main">
          You can compare up to {MAX_COMPARE_USERS} portfolios at a time.
        </SearchResults>
      );
    }

    if (searchValue.trim().length < 2) {
      return (
        <SearchResults className="empty" variant="main">
          Type at least 2 characters to find a public portfolio.
        </SearchResults>
      );
    }

    if (isPortfolioSearchLoading) {
      return (
        <SearchResults variant="main">
          <Placeholder
            width="100%"
            height="48px"
            borderRadius="10px"
            marginBottom="8px"
          />
          <Placeholder
            width="100%"
            height="48px"
            borderRadius="10px"
            marginBottom="0"
          />
        </SearchResults>
      );
    }

    if (isPortfolioSearchError) {
      return (
        <SearchResults variant="main">
          <Button variant="outlined" onClick={() => refetchPortfolioSearch()}>
            Retry search
          </Button>
        </SearchResults>
      );
    }

    if (!portfolioSearchResults.length) {
      return (
        <SearchResults className="empty" variant="main">
          No public portfolios found.
        </SearchResults>
      );
    }

    return (
      <SearchResults variant="main">
        {portfolioSearchResults.map((item) => (
          <SearchResultItem
            key={item.id}
            type="button"
            onClick={() => addUserToCompare(String(item.owner.id || ""))}
          >
            <EntityInfo
              img={item.owner.avatar || item.logo || "/avatar.png"}
              name={item.owner.displayName || item.name}
              username={item.owner.username || ""}
              niche={item.name}
              variant="default"
            />
            <SearchMeta>
              <span>
                {item.totalBalance !== null && item.totalBalance !== undefined
                  ? `$${Number(item.totalBalance).toLocaleString()}`
                  : "-"}
              </span>
              <span>
                {item.profitPercent !== null && item.profitPercent !== undefined
                  ? `${item.profitPercent > 0 ? "+" : ""}${Number(item.profitPercent).toFixed(1)}% ROI`
                  : "ROI -"}
              </span>
            </SearchMeta>
          </SearchResultItem>
        ))}
      </SearchResults>
    );
  };

  return (
    <>
      <Wrapper ref={roiRef}>
        <ChartWrapper>
          <TitleWrapper>
            <TitleDescriptionWrapper>
              <h2>Portfolio ROI</h2>
              <button
                onMouseEnter={() => setIsDescriptionModal(true)}
                onMouseLeave={() => setIsDescriptionModal(false)}
              >
                <InfoIcon />
              </button>
              <DescriptionWrapper>
                <DescriptionComponent
                  className="description-component"
                  isVisible={isDescriptionModal}
                  date={new Date()}
                  text={`Compare how user portfolios perform over time. Select up to 5 users to see who's really gaining.`}
                  isDate={false}
                />
              </DescriptionWrapper>
            </TitleDescriptionWrapper>
            <button type="button" onClick={() => setIsShareModal(true)}>
              <PhotoIcon />
            </button>
          </TitleWrapper>

          <PersonCompareChart
            title="Compare"
            items={chartSeries}
            points={chartPoints}
            rangeOptions={RANGE_OPTIONS}
            selectedRange={range}
            onRangeChange={(nextRange) =>
              setRange(nextRange as PortfolioRoiCompareRange)
            }
            onRemoveItem={removeUserFromCompare}
            searchValue={searchValue}
            onSearchValueChange={(value) => {
              setSearchValue(value);
              setIsSearchOpen(true);
            }}
            onSearchFocusChange={setIsSearchOpen}
            searchPlaceholder="Search public portfolio"
            searchDropdown={renderSearchResults()}
            filterItemsBySearch={false}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            isFetching={isFetching}
            emptyTitle="No portfolios to compare"
            emptyDescription="No public portfolios were found for the selected users."
            noChartTitle="No chart data available"
            noChartDescription="There isn't enough history to draw ROI lines for this range yet."
            noBaselineTitle="No baseline"
            noBaselineDescription="The selected users do not have a baseline for this range yet."
          />
        </ChartWrapper>

        <ComparedPortfolios items={comparedItems} isLoading={isLoading} />
      </Wrapper>

      <SaveShareModal
        name="Fomies/Portfolio ROI"
        link={typeof window !== "undefined" ? window.location.href : ""}
        html={roiRef.current}
        isVisible={isShareModal}
        onClose={() => setIsShareModal(false)}
      />
    </>
  );
};

export default PortfolioROI;
