import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import {
  DescriptionWrapper,
  EmptyState,
  Header,
  PaginationWrapper,
  SwitchWrapper,
  TableHeader,
  TableList,
  TableRow,
  TableWrapper,
  TitleWrapper,
  UserSearchWrapper,
  Wrapper,
} from "./styles";
import {
  TimeButton,
  TimeRangeButtons,
} from "../../../../../global/common/PriceChart/styles";
import { SearchIconStyle, SearchInput } from "../../../P2PExchange/styles";
import Switch from "../../../../../UI/inputs/switch";
import FomiesRank from "../../../../../global/Icons/FomiesRank";
import EntityInfo from "../../../../../global/common/EntityInfo";
import DescriptionComponent from "../../../../../global/common/DescriptionComponent";
import InfoIcon from "../../../../../global/Icons/InfoIcon";
import { Overflow } from "../../../../../global/common/BarDoubleChart/styles";
import Placeholder from "../../../../../global/common/Placeholder";
import Pagination from "../../../../../global/Pagintaion";
import fetchFomiesLeaderboard, {
  FomiesLeaderboardItem,
  FomiesLeaderboardRange,
  FomiesLeaderboardSort,
} from "../../../../../../http/leaderboard/fetchFomiesLeaderboard";

const LEADERBOARD_LIMIT = 10;
const LEADERBOARD_RANGES: FomiesLeaderboardRange[] = [
  "24H",
  "7D",
  "30D",
  "90D",
  "1Y",
  "ALL",
];

const formatRoi = (
  roi: number | null
): { label: string; tone: "green" | "red" | "muted" } => {
  if (roi === null || !Number.isFinite(Number(roi))) {
    return { label: "\u2014", tone: "muted" };
  }

  const normalized = Number(roi);
  const sign = normalized > 0 ? "+" : "";

  return {
    label: `${sign}${normalized.toFixed(1)}%`,
    tone: normalized >= 0 ? "green" : "red",
  };
};

const renderSkeletonRows = () =>
  Array.from({ length: 6 }).map((_, index) => (
    <TableRow key={`leaderboard-skeleton-${index}`}>
      <Placeholder width="44px" height="28px" borderRadius="8px" marginBottom="0" />
      <Placeholder width="100%" height="44px" borderRadius="10px" marginBottom="0" />
      <Placeholder width="72px" height="18px" borderRadius="8px" marginBottom="0" />
      <Placeholder width="56px" height="18px" borderRadius="8px" marginBottom="0" />
      <Placeholder width="52px" height="18px" borderRadius="8px" marginBottom="0" />
    </TableRow>
  ));

const FomiesLeaderboard = () => {
  const [selectedRange, setSelectedRange] =
    useState<FomiesLeaderboardRange>("24H");
  const [isDescriptionModal, setIsDescriptionModal] = useState(false);
  const [sortType, setSortType] = useState<FomiesLeaderboardSort>("ROI");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [selectedRange, sortType, debouncedQuery]);

  const offset = useMemo(() => (page - 1) * LEADERBOARD_LIMIT, [page]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery(
    [
      "fomies-leaderboard",
      selectedRange,
      sortType,
      debouncedQuery,
      offset,
      LEADERBOARD_LIMIT,
    ],
    () =>
      fetchFomiesLeaderboard({
        range: selectedRange,
        sortBy: sortType,
        search: debouncedQuery,
        offset,
        limit: LEADERBOARD_LIMIT,
      }),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  const items = data?.items || [];
  const total = Number(data?.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / LEADERBOARD_LIMIT));

  const renderRow = (item: FomiesLeaderboardItem, index: number) => {
    const displayName = item.name || item.twitterData?.name || "Unnamed user";
    const displayUsername =
      item.username || item.twitterData?.username || "unknown";
    const avatar = item.photo || item.twitterData?.photo || "";
    const roi = formatRoi(item.roi);
    const rankPosition = offset + index + 1;

    return (
      <TableRow key={`${item.userId}-${rankPosition}`}>
        <FomiesRank rank={rankPosition} />
        <EntityInfo
          img={avatar}
          name={displayName}
          username={displayUsername}
          variant={item.hasPublicPortfolio ? "success" : "default"}
          rating={item.rating}
        />
        <div className={`roi ${roi.tone}`}>{roi.label}</div>
        <div>{item.activityXP || 0}</div>
        <div>{item.followersCount || 0}</div>
      </TableRow>
    );
  };

  return (
    <Wrapper>
      <Header>
        <TitleWrapper>
          <h2>Leaderboard</h2>
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
              text={`
                Top users ranked by portfolio ROI and activity score (XP). Track performance, compare strategies, and see who's leading the game.
              `}
              isDate={false}
            />
          </DescriptionWrapper>
        </TitleWrapper>
        <TimeRangeButtons>
          {LEADERBOARD_RANGES.map((range) => (
            <TimeButton
              key={range}
              onClick={() => setSelectedRange(range)}
              active={selectedRange === range}
            >
              {range}
            </TimeButton>
          ))}
        </TimeRangeButtons>
      </Header>
      <UserSearchWrapper>
        <SearchInput
          className="small-input"
          value={query}
          onChange={(value: string) => setQuery(value)}
          placeholder="Search user"
          type="text"
          leftIcon={<SearchIconStyle />}
        />
        <SwitchWrapper>
          <Switch
            leftLabel="ROI"
            rightLabel="XP"
            checked={sortType === "ROI"}
            onChange={() =>
              setSortType((current) => (current === "ROI" ? "XP" : "ROI"))
            }
          />
        </SwitchWrapper>
      </UserSearchWrapper>
      <Overflow>
        <TableWrapper variant="main">
          <TableHeader>
            <div>Rank</div>
            <div>Fomie</div>
            <div>ROI</div>
            <div>XP</div>
            <div>Followers</div>
          </TableHeader>
          <TableList>
            {isLoading ? renderSkeletonRows() : null}
            {!isLoading && !isError && items.map(renderRow)}
          </TableList>
        </TableWrapper>
      </Overflow>
      {!isLoading && isError ? (
        <EmptyState variant="main">
          <h3>Unable to load leaderboard</h3>
          <p>Please try again. The leaderboard data could not be loaded right now.</p>
          <button onClick={() => refetch()}>
            {isFetching ? "Retrying..." : "Retry"}
          </button>
        </EmptyState>
      ) : null}
      {!isLoading && !isError && !items.length ? (
        <EmptyState variant="main">
          <h3>No results</h3>
          <p>No users matched the current filters.</p>
        </EmptyState>
      ) : null}
      {!isLoading && !isError && totalPages > 1 ? (
        <PaginationWrapper>
          <Pagination
            page={page}
            total={total}
            limit={Math.min(page * LEADERBOARD_LIMIT, total)}
            totalPage={totalPages}
            onChange={(value) => setPage(value)}
          />
        </PaginationWrapper>
      ) : null}
    </Wrapper>
  );
};

export default FomiesLeaderboard;
