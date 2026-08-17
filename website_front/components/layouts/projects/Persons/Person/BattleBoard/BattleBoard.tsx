import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "react-query";
import {
  Controls,
  DescriptionWrapper,
  EmptyText,
  Header,
  HeaderLeft,
  Pagination,
  SearchWrapper,
  StateCard,
  TableHeader,
  TableList,
  TableRow,
  TableWrapper,
  TitleWrapper,
  Wrapper,
} from "./styles";
import PhotoIcon from "../../../../../global/Icons/PhotoIcon";
import EntityInfo from "../../../../../global/common/EntityInfo";
import DescriptionComponent from "../../../../../global/common/DescriptionComponent";
import InfoIcon from "../../../../../global/Icons/InfoIcon";
import { Overflow } from "../../../../../global/common/BarDoubleChart/styles";
import { SearchIconStyle, SearchInput } from "../../../P2PExchange/styles";
import { Button } from "../../../../../global/common/Button";
import Placeholder from "../../../../../global/common/Placeholder";
import SaveShareModal from "../../../../../global/modals/SaveShareModal";
import fetchBattleBoard, {
  BattleBoardItem,
} from "../../../../../../http/battle/fetchBattleBoard";

const PAGE_LIMIT = 10;

const getDisplayName = (item: BattleBoardItem["owner"]): string =>
  item.name || item.twitterData?.name || "Unnamed user";

const getDisplayUsername = (item: BattleBoardItem["owner"]): string =>
  item.username || item.twitterData?.username || "";

const getDisplayAvatar = (item: BattleBoardItem["owner"]): string =>
  item.photo || item.twitterData?.photo || "";

const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "—";
  }

  const normalized = Number(value);
  const sign = normalized > 0 ? "+" : "";
  return `${sign}${normalized.toFixed(1)}%`;
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "—";
  }

  return `$${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getPercentClassName = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (value > 0) {
    return "green";
  }

  if (value < 0) {
    return "red";
  }

  return "";
};

const BattleBoard = () => {
  const battleBoardRef = useRef<HTMLDivElement | null>(null);
  const [isDescriptionModal, setIsDescriptionModal] = useState(false);
  const [isShareModal, setIsShareModal] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setOffset(0);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery(
    ["battle-board", debouncedSearch, offset],
    () =>
      fetchBattleBoard({
        search: debouncedSearch,
        offset,
        limit: PAGE_LIMIT,
      }),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  const items = data?.items || [];
  const total = data?.total || 0;
  const currentPage = Math.floor(offset / PAGE_LIMIT) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const canGoPrev = offset > 0;
  const canGoNext = offset + PAGE_LIMIT < total;

  const skeletonRows = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={`battle-skeleton-${index}`}>
          <div>
            <Placeholder width="200px" height="44px" borderRadius="12px" marginBottom="0" />
          </div>
          <div>
            <Placeholder width="140px" height="16px" borderRadius="8px" marginBottom="0" />
          </div>
          <div>
            <Placeholder width="70px" height="16px" borderRadius="8px" marginBottom="0" />
          </div>
          <div>
            <Placeholder width="110px" height="16px" borderRadius="8px" marginBottom="0" />
          </div>
          <div>
            <Placeholder width="70px" height="16px" borderRadius="8px" marginBottom="0" />
          </div>
          <div>
            <Placeholder width="24px" height="16px" borderRadius="8px" marginBottom="0" />
          </div>
          <div>
            <Placeholder width="24px" height="16px" borderRadius="8px" marginBottom="0" />
          </div>
        </TableRow>
      )),
    []
  );

  const renderRows = () => {
    if (isLoading && !items.length) {
      return skeletonRows;
    }

    if (!isLoading && !isError && !items.length) {
      return (
        <StateCard variant="main">
          <h3>No battle portfolios</h3>
          <p>No portfolios are in battle mode yet.</p>
        </StateCard>
      );
    }

    return items.map((item: BattleBoardItem) => (
      <TableRow key={item.portfolioId}>
        <EntityInfo
          img={getDisplayAvatar(item.owner)}
          name={getDisplayName(item.owner)}
          username={getDisplayUsername(item.owner)}
          variant={item.owner.verificationStatus ? "success" : "default"}
        />
        <div>{item.portfolioName || "Unnamed portfolio"}</div>
        <div className={getPercentClassName(item.metrics.roi30d)}>
          {formatPercent(item.metrics.roi30d)}
        </div>
        <div>{formatCurrency(item.metrics.currentBalance)}</div>
        <div className={getPercentClassName(item.metrics.change24h)}>
          {formatPercent(item.metrics.change24h)}
        </div>
        <div>—</div>
        <div>—</div>
      </TableRow>
    ));
  };

  return (
    <>
      <Wrapper>
        <Header>
          <TitleWrapper>
            <h2>Battle Board</h2>
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
                  Portfolio battle board. Track user performance and balance trends across portfolios in battle mode.
                `}
                isDate={false}
              />
            </DescriptionWrapper>
          </TitleWrapper>

          <HeaderLeft>
            <button
              onClick={() => setIsShareModal(true)}
              className="photo-btn"
              type="button"
            >
              <PhotoIcon />
            </button>
          </HeaderLeft>
        </Header>

        <Controls>
          <SearchWrapper>
            <SearchInput
              className="small-input"
              value={search}
              onChange={(value: string) => setSearch(value)}
              placeholder="Search battle portfolios"
              type="text"
              leftIcon={<SearchIconStyle />}
            />
          </SearchWrapper>
        </Controls>

        {!isLoading && isError ? (
          <StateCard variant="main">
            <h3>Unable to load battle board</h3>
            <p>The battle portfolio list could not be loaded right now.</p>
            <Button variant="outlined" onClick={() => refetch()}>
              {isFetching ? "Retrying..." : "Retry"}
            </Button>
          </StateCard>
        ) : null}

        <Overflow>
          <div ref={battleBoardRef}>
            <TableWrapper variant="main">
              <TableHeader>
                <div>User</div>
                <div>Portfolio Name</div>
                <div>ROI (30d)</div>
                <div>Current Balance</div>
                <div>24h Change</div>
                <div>Volatility</div>
                <div>Risk Level</div>
              </TableHeader>
              <TableList>{renderRows()}</TableList>
            </TableWrapper>
          </div>
        </Overflow>

        {!isLoading && !isError && total > PAGE_LIMIT ? (
          <Pagination>
            <Button
              variant="outlined"
              onClick={() => setOffset((prev) => Math.max(prev - PAGE_LIMIT, 0))}
              disabled={!canGoPrev}
            >
              Previous
            </Button>
            <EmptyText>
              Page {currentPage} of {totalPages}
            </EmptyText>
            <Button
              variant="outlined"
              onClick={() => setOffset((prev) => prev + PAGE_LIMIT)}
              disabled={!canGoNext}
            >
              Next
            </Button>
          </Pagination>
        ) : null}
      </Wrapper>

      <SaveShareModal
        name="Fomies/Battle Board"
        link={typeof window !== "undefined" ? window.location.href : ""}
        html={battleBoardRef.current}
        isVisible={isShareModal}
        onClose={() => setIsShareModal(false)}
      />
    </>
  );
};

export default BattleBoard;
