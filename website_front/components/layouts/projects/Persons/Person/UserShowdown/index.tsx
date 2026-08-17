import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import {
  AnimatedSection,
  CompareCard,
  CompareCardWrapper,
  CompareHeader,
  CompareRow,
  CompareSectionToggleBtn,
  CompareWrapper,
  DescriptionWrapper,
  Header,
  HeaderLeft,
  SearchResultItem,
  SearchResults,
  StateCard,
  TitleWrapper,
  Wrapper,
  UserSearchWrapper,
} from "./styles";
import InfoIcon from "../../../../../global/Icons/InfoIcon";
import DescriptionComponent from "../../../../../global/common/DescriptionComponent";
import PhotoIcon from "../../../../../global/Icons/PhotoIcon";
import { Button } from "../../../../../global/common/Button";
import { SearchIconStyle, SearchInput } from "../../../P2PExchange/styles";
import ArrowSelectIcon from "../../../../../global/Icons/ArrowSelectIcon";
import EntityInfo from "../../../../../global/common/EntityInfo";
import moment from "moment";
import Placeholder from "../../../../../global/common/Placeholder";
import SaveShareModal from "../../../../../global/modals/SaveShareModal";
import fetchFomiesShowdown, {
  FomiesShowdownItem,
} from "../../../../../../http/showdown/fetchFomiesShowdown";
import searchFomiesUsers, {
  FomiesSearchUser,
} from "../../../../../../http/showdown/searchFomiesUsers";
import { FomiesPersonData } from "../components/types";
import { IPortfolio } from "../../../../../../types/global_types";

interface Props {
  personData: FomiesPersonData;
  publicPortfolio?: IPortfolio | null;
}

const SHOWDOWN_LIMIT = 5;

const arraysEqual = (left: string[], right: string[]): boolean =>
  left.length === right.length && left.every((item, index) => item === right[index]);

const getDisplayName = (item: {
  name?: string;
  twitterData?: { name?: string } | null;
}): string => item.name || item.twitterData?.name || "Unnamed user";

const getDisplayUsername = (item: {
  username?: string;
  twitterData?: { username?: string } | null;
}): string => item.username || item.twitterData?.username || "";

const getDisplayAvatar = (item: {
  photo?: string;
  twitterData?: { photo?: string } | null;
}): string => item.photo || item.twitterData?.photo || "";

const getOwnerTopHeldToken = (publicPortfolio?: IPortfolio | null): string | null => {
  const assets = publicPortfolio?.calculatedAssets || [];

  if (!assets.length) {
    return null;
  }

  const topAsset = assets.reduce((bestAsset, asset) => {
    if (!bestAsset) {
      return asset;
    }

    const bestScore = Number(bestAsset.allocationPercent || bestAsset.currentValue || 0);
    const nextScore = Number(asset.allocationPercent || asset.currentValue || 0);

    return nextScore > bestScore ? asset : bestAsset;
  }, assets[0]);

  return topAsset?.currency || null;
};

const resolveNullableValue = <T,>(
  primary: T | null | undefined,
  fallback: T | null | undefined
): T | null => {
  if (primary !== null && primary !== undefined && primary !== "") {
    return primary;
  }

  if (fallback !== null && fallback !== undefined && fallback !== "") {
    return fallback;
  }

  return null;
};

const resolvePreferredCount = (
  primary: number | null | undefined,
  fallback: number | null | undefined
): number | null => {
  const normalizedPrimary =
    primary !== null && primary !== undefined ? Number(primary) : null;
  const normalizedFallback =
    fallback !== null && fallback !== undefined ? Number(fallback) : null;

  if (normalizedPrimary === null) {
    return normalizedFallback;
  }

  if (normalizedFallback === null) {
    return normalizedPrimary;
  }

  return normalizedFallback > normalizedPrimary ? normalizedFallback : normalizedPrimary;
};

const formatNullable = (
  value: string | number | null | undefined,
  formatter?: (nextValue: string | number) => string
): string => {
  if (value === null || value === undefined || value === "") {
    return "\u2014";
  }

  return formatter ? formatter(value) : String(value);
};

const formatPercent = (value: number | null | undefined): string =>
  formatNullable(value, (nextValue) => `${Number(nextValue).toFixed(1)}%`);

const formatCurrency = (value: number | null | undefined): string =>
  formatNullable(value, (nextValue) => `$${Number(nextValue).toFixed(2)}`);

const getPercentClassName = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "row-item";
  }

  return value >= 0 ? "row-item green" : "row-item red";
};

const renderHeaderSkeleton = (key: string) => (
  <div key={key} className="header-item">
    <CompareCard variant="main">
      <Placeholder width="100%" height="52px" borderRadius="12px" marginBottom="0" />
    </CompareCard>
  </div>
);

const renderColumnSkeleton = (key: string, rows: number) => (
  <CompareCard key={key} variant="main">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={`${key}-${index}`} className="row-item">
        <Placeholder width="72%" height="16px" borderRadius="8px" marginBottom="0" />
      </div>
    ))}
  </CompareCard>
);

const UserShowdown: FC<Props> = ({ personData, publicPortfolio }) => {
  const router = useRouter();
  const ownerId = String(personData?._id || "");
  const showdownRef = useRef<HTMLDivElement | null>(null);
  const compareWrapperRef = useRef<HTMLDivElement | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);
  const searchToggleRef = useRef<HTMLDivElement | null>(null);

  const [isDescriptionModal, setIsDescriptionModal] = useState(false);
  const [isShareModal, setIsShareModal] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSections, setActiveSections] = useState<Array<string>>([
    "portfolio",
    "activity",
    "interactions",
  ]);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(ownerId ? [ownerId] : []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isSearchOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;

      if (!target) {
        return;
      }

      const clickedSearch = searchWrapperRef.current?.contains(target);
      const clickedToggle = searchToggleRef.current?.contains(target);

      if (!clickedSearch && !clickedToggle) {
        setIsSearchOpen(false);
        setSearch("");
        setDebouncedSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen]);

  useEffect(() => {
    if (isMobile && compareWrapperRef.current) {
      const element = compareWrapperRef.current;
      element.style.boxShadow = "0 0 10px rgba(4, 165, 132, 0.3)";

      const timeout = window.setTimeout(() => {
        element.style.boxShadow = "none";
      }, 1500);

      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [isMobile, activeSections]);

  useEffect(() => {
    if (!router.isReady || !ownerId) return;

    const compareQuery = router.query.compare;
    const compareIds = Array.isArray(compareQuery)
      ? compareQuery.join(",")
      : String(compareQuery || "");
    const normalized = compareIds
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item, index, array) => array.indexOf(item) === index)
      .filter((item) => item !== ownerId)
      .slice(0, SHOWDOWN_LIMIT - 1);
    const nextSelectedUsers = [ownerId, ...normalized];

    setSelectedUsers((prev) => (arraysEqual(prev, nextSelectedUsers) ? prev : nextSelectedUsers));
  }, [ownerId, router.isReady, router.query.compare]);

  useEffect(() => {
    if (!router.isReady || !ownerId || !selectedUsers.length) return;

    const compareIds = selectedUsers.filter((item) => item !== ownerId);
    const currentCompare = Array.isArray(router.query.compare)
      ? router.query.compare.join(",")
      : String(router.query.compare || "");
    const nextCompare = compareIds.join(",");

    if (currentCompare === nextCompare) {
      return;
    }

    const nextQuery = { ...router.query };

    if (nextCompare) {
      nextQuery.compare = nextCompare;
    } else {
      delete nextQuery.compare;
    }

    router.replace(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      { shallow: true }
    );
  }, [ownerId, router, router.isReady, selectedUsers]);

  const {
    data: searchData,
    isLoading: isSearchLoading,
    isError: isSearchError,
    refetch: refetchSearch,
  } = useQuery(
    ["fomies-showdown-search", debouncedSearch, selectedUsers],
    () =>
      searchFomiesUsers({
        search: debouncedSearch,
        excludeIds: selectedUsers,
        limit: 10,
      }),
    {
      enabled:
        isSearchOpen &&
        debouncedSearch.length > 0 &&
        selectedUsers.length < SHOWDOWN_LIMIT,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  const {
    data: showdownData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery(
    ["fomies-showdown", selectedUsers],
    () => fetchFomiesShowdown(selectedUsers),
    {
      enabled: selectedUsers.length > 0,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  const items = showdownData?.items || [];
  const searchResults = searchData?.items || [];

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearch("");
    setDebouncedSearch("");
  };

  const openSearch = () => {
    if (selectedUsers.length >= SHOWDOWN_LIMIT) {
      setIsSearchOpen(true);
      return;
    }

    setIsSearchOpen(true);
  };

  const normalizedItems = useMemo(() => {
    const itemsById = new Map(items.map((item) => [item.userId, item]));
    return selectedUsers.map((userId) => itemsById.get(userId)).filter(Boolean) as FomiesShowdownItem[];
  }, [items, selectedUsers]);

  const normalizedItemsWithOwnerFallback = useMemo(() => {
    const ownerTotalCategories = publicPortfolio?.categoryDistribution
      ? Object.keys(publicPortfolio.categoryDistribution).length
      : null;
    const ownerTopHeldToken = getOwnerTopHeldToken(publicPortfolio);
    const ownerPortfolioRoi30d =
      publicPortfolio?.performance30d?.usd !== undefined &&
      publicPortfolio?.performance30d?.usd !== null
        ? Number(publicPortfolio.performance30d.usd)
        : null;
    const ownerPortfolioBalance =
      publicPortfolio?.totalBalance !== undefined && publicPortfolio?.totalBalance !== null
        ? Number(publicPortfolio.totalBalance)
        : null;
    const ownerAverageRoi =
      publicPortfolio?.profitPercent !== undefined && publicPortfolio?.profitPercent !== null
        ? Number(publicPortfolio.profitPercent)
        : null;
    const ownerMemberSinceRaw =
      personData?.createDate || (personData as any)?.createdAt || null;
    const ownerMemberSince = ownerMemberSinceRaw
      ? new Date(ownerMemberSinceRaw).toISOString()
      : null;

    return normalizedItems.map((item) => {
      if (item.userId !== ownerId) {
        return item;
      }

      return {
        ...item,
        portfolio: {
          ...item.portfolio,
          roi30d: resolveNullableValue(item.portfolio.roi30d, ownerPortfolioRoi30d),
          totalAssets: resolveNullableValue(
            item.portfolio.totalAssets,
            Array.isArray(publicPortfolio?.calculatedAssets)
              ? publicPortfolio?.calculatedAssets?.length || 0
              : null
          ),
          totalCategories: resolveNullableValue(
            item.portfolio.totalCategories,
            ownerTotalCategories
          ),
          topHeldToken: resolveNullableValue(
            item.portfolio.topHeldToken,
            ownerTopHeldToken
          ),
          linkedPortfoliosCount: resolveNullableValue(
            item.portfolio.linkedPortfoliosCount,
            Array.isArray(personData?.portfolio) ? personData.portfolio.length : null
          ),
          portfolioBalance: resolveNullableValue(
            item.portfolio.portfolioBalance,
            resolveNullableValue(
              ownerPortfolioBalance,
              personData?.portfolioBalance as number | null | undefined
            )
          ),
          numberOfDeals: resolveNullableValue(
            item.portfolio.numberOfDeals,
            personData?.numberOfDeals as number | null | undefined
          ),
          averageRoi: resolveNullableValue(
            item.portfolio.averageRoi,
            ownerAverageRoi
          ),
        },
        activity: {
          ...item.activity,
          commentsCount: resolvePreferredCount(
            item.activity.commentsCount,
            personData?.commentsCount
          ),
          referralCount: resolvePreferredCount(
            item.activity.referralCount,
            Array.isArray(personData?.refLvlOne) ? personData.refLvlOne.length : null
          ),
          claimedTasksCount: resolveNullableValue(
            item.activity.claimedTasksCount,
            Array.isArray((personData as any)?.claimedTasks)
              ? (personData as any).claimedTasks.length
              : null
          ),
          activityCount: resolvePreferredCount(
            item.activity.activityCount,
            Array.isArray((personData as any)?.activity)
              ? (personData as any).activity.length
              : null
          ),
          hoursOnline: resolveNullableValue(
            item.activity.hoursOnline,
            personData?.hoursOnline as number | null | undefined
          ),
        },
        interactions: {
          ...item.interactions,
          memberSince: resolveNullableValue(
            item.interactions.memberSince,
            ownerMemberSince
          ),
        },
      };
    });
  }, [normalizedItems, ownerId, personData, publicPortfolio]);

  useEffect(() => {
    if (isLoading || isFetching || !ownerId || !items.length) return;

    const validIds = new Set(items.map((item) => item.userId));
    const nextSelectedUsers = selectedUsers.filter(
      (userId) => userId === ownerId || validIds.has(userId)
    );

    if (!arraysEqual(selectedUsers, nextSelectedUsers)) {
      setSelectedUsers(nextSelectedUsers);
    }
  }, [isFetching, isLoading, items, ownerId, selectedUsers]);

  const toggleSection = (key: string) => {
    setActiveSections((prev) =>
      prev.includes(key)
        ? prev.filter((section) => section !== key)
        : [...prev, key]
    );
  };

  const addUserToCompare = (userId: string) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId) || prev.length >= SHOWDOWN_LIMIT) {
        return prev;
      }

      return [...prev, userId];
    });
    closeSearch();
  };

  const removeUserFromCompare = (userId: string) => {
    if (userId === ownerId) return;

    setSelectedUsers((prev) => prev.filter((item) => item !== userId));
  };

  const renderSearchResults = () => {
    if (!isSearchOpen) return null;

    if (selectedUsers.length >= SHOWDOWN_LIMIT) {
      return (
        <SearchResults variant="main">
          You can compare up to {SHOWDOWN_LIMIT} users at a time.
        </SearchResults>
      );
    }

    if (!debouncedSearch) return null;

    if (isSearchLoading) {
      return (
        <SearchResults variant="main">
          <Placeholder width="100%" height="48px" borderRadius="10px" marginBottom="8px" />
          <Placeholder width="100%" height="48px" borderRadius="10px" marginBottom="0" />
        </SearchResults>
      );
    }

    if (isSearchError) {
      return (
        <SearchResults variant="main">
          <Button variant="outlined" onClick={() => refetchSearch()}>
            Retry search
          </Button>
        </SearchResults>
      );
    }

    if (!searchResults.length) {
      return (
        <SearchResults className="empty" variant="main">
          No users found.
        </SearchResults>
      );
    }

    return (
      <SearchResults variant="main">
        {searchResults.map((item: FomiesSearchUser) => (
          <SearchResultItem
            key={item.userId}
            type="button"
            onClick={() => addUserToCompare(item.userId)}
          >
            <EntityInfo
              img={getDisplayAvatar(item)}
              name={getDisplayName(item)}
              username={getDisplayUsername(item)}
              variant={item.verificationStatus ? "success" : "default"}
            />
            <div className="meta">
              <span>{item.activityXP || 0} XP</span>
              <span>{item.rank || "\u2014"}</span>
            </div>
          </SearchResultItem>
        ))}
      </SearchResults>
    );
  };

  const renderHeaderItems = () => {
    if (isLoading && !normalizedItemsWithOwnerFallback.length) {
      return Array.from({ length: 2 }).map((_, index) =>
        renderHeaderSkeleton(`showdown-header-skeleton-${index}`)
      );
    }

    return normalizedItemsWithOwnerFallback.map((item) => (
      <div key={item.userId} className="header-item">
        {item.userId !== ownerId ? (
          <button
            type="button"
            className="remove-user-btn"
            onClick={() => removeUserFromCompare(item.userId)}
          >
            ×
          </button>
        ) : null}
        <EntityInfo
          img={getDisplayAvatar(item)}
          name={getDisplayName(item)}
          username={getDisplayUsername(item)}
          variant={item.verificationStatus ? "success" : "default"}
        />
      </div>
    ));
  };

  const renderMetricCard = (
    key: string,
    renderRows: (item: FomiesShowdownItem) => React.ReactNode
  ) => {
    if (isLoading && !normalizedItemsWithOwnerFallback.length) {
      return Array.from({ length: 2 }).map((_, index) =>
        renderColumnSkeleton(`${key}-skeleton-${index}`, 4)
      );
    }

    return normalizedItemsWithOwnerFallback.map((item) => (
      <CompareCard key={`${key}-${item.userId}`} variant="main">
        {renderRows(item)}
      </CompareCard>
    ));
  };

  return (
    <>
      <Wrapper>
        <Header>
          <TitleWrapper>
            <h2>User Showdown</h2>
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
                  Compare performance, activity, and portfolio data across multiple users. Add up to 5 users to see who's really winning the game.
                `}
                isDate={false}
              />
            </DescriptionWrapper>
          </TitleWrapper>

          <HeaderLeft>
            <div ref={searchToggleRef}>
              <Button
                onClick={() => (isSearchOpen ? closeSearch() : openSearch())}
                className={isSearchOpen ? "red-btn" : "contact-btn"}
                variant="outlined"
              >
                {isSearchOpen ? "Cancel" : isMobile ? "+ Add" : "+ Add User"}
              </Button>
            </div>
            <button
              onClick={() => setIsShareModal(true)}
              className="photo-btn"
            >
              <PhotoIcon />
            </button>
          </HeaderLeft>
        </Header>

        {isSearchOpen ? (
          <UserSearchWrapper ref={searchWrapperRef}>
            <SearchInput
              className="small-input"
              value={search}
              onChange={(value: string) => setSearch(value)}
              placeholder="Search user"
              type="text"
              leftIcon={<SearchIconStyle />}
            />
            {renderSearchResults()}
          </UserSearchWrapper>
        ) : null}

        {/* {selectedUsers.length === 1 ? (
          <StateCard variant="main">
            <h3>Add users to compare</h3>
            <p>Select up to 4 more fomies to compare them with the current profile.</p>
          </StateCard>
        ) : null} */}

        {!isLoading && isError ? (
          <StateCard variant="main">
            <h3>Unable to load showdown</h3>
            <p>The comparison data could not be loaded right now.</p>
            <Button variant="outlined" onClick={() => refetch()}>
              {isFetching ? "Retrying..." : "Retry"}
            </Button>
          </StateCard>
        ) : null}

        <CompareWrapper ref={compareWrapperRef}>
          <div ref={showdownRef}>
            <CompareHeader>
              <div className="header-item" />
              {renderHeaderItems()}
            </CompareHeader>
            <CompareRow>
              <CompareCard variant="main">
                <div className="row-item key">Verification</div>
                <div className="row-item key">XP (Activity Score)</div>
                <div className="row-item key">Rank</div>
                <div className="row-item key">Followers</div>
              </CompareCard>
              {renderMetricCard("base", (item) => (
                <>
                  <div
                    className={
                      item.verificationStatus ? "row-item green" : "row-item red"
                    }
                  >
                    {item.verificationStatus ? "Yes" : "No"}
                  </div>
                  <div className="row-item">{formatNullable(item.activityXP)}</div>
                  <div className="row-item">{formatNullable(item.rank)}</div>
                  <div className="row-item">{formatNullable(item.followersCount)}</div>
                </>
              ))}
            </CompareRow>

            <CompareCardWrapper>
              <CompareSectionToggleBtn onClick={() => toggleSection("portfolio")}>
                Portfolio
                <ArrowSelectIcon
                  style={{
                    transform: activeSections.includes("portfolio")
                      ? "rotate(180deg)"
                      : "rotate(0)",
                    transition: "transform 0.3s ease",
                  }}
                />
              </CompareSectionToggleBtn>
              <AnimatedSection isOpen={activeSections.includes("portfolio")}>
                <CompareCard variant="main">
                  <div className="row-item key">Portfolio ROI (30d)</div>
                  <div className="row-item key">Average ROI</div>
                  <div className="row-item key">Portfolio Balance</div>
                  <div className="row-item key">Total Assets</div>
                  <div className="row-item key">Total Categories</div>
                  <div className="row-item key">Top Held Token</div>
                  <div className="row-item key">Linked Portfolios</div>
                  <div className="row-item key">Number of Deals</div>
                </CompareCard>
                {renderMetricCard("portfolio", (item) => (
                  <>
                    <div className={getPercentClassName(item.portfolio.roi30d)}>
                      {formatPercent(item.portfolio.roi30d)}
                    </div>
                    <div className={getPercentClassName(item.portfolio.averageRoi)}>
                      {formatPercent(item.portfolio.averageRoi)}
                    </div>
                    <div className="row-item">
                      {formatCurrency(item.portfolio.portfolioBalance)}
                    </div>
                    <div className="row-item">
                      {formatNullable(item.portfolio.totalAssets)}
                    </div>
                    <div className="row-item">
                      {formatNullable(item.portfolio.totalCategories)}
                    </div>
                    <div className="row-item">
                      {formatNullable(item.portfolio.topHeldToken)}
                    </div>
                    <div className="row-item">
                      {formatNullable(item.portfolio.linkedPortfoliosCount)}
                    </div>
                    <div className="row-item">
                      {formatNullable(item.portfolio.numberOfDeals)}
                    </div>
                  </>
                ))}
              </AnimatedSection>
            </CompareCardWrapper>

            <CompareCardWrapper>
              <CompareSectionToggleBtn onClick={() => toggleSection("activity")}>
                Activity
                <ArrowSelectIcon
                  style={{
                    transform: activeSections.includes("activity")
                      ? "rotate(180deg)"
                      : "rotate(0)",
                    transition: "transform 0.3s ease",
                  }}
                />
              </CompareSectionToggleBtn>
              <AnimatedSection isOpen={activeSections.includes("activity")}>
                <CompareCard variant="main">
                  <div className="row-item key">Number of Comments</div>
                  <div className="row-item key">Referral Count</div>
                  <div className="row-item key">Activity Count</div>
                  <div className="row-item key">Claimed Tasks</div>
                  <div className="row-item key">Hours Online</div>
                </CompareCard>
                {renderMetricCard("activity", (item) => (
                  <>
                    <div className="row-item">
                      {formatNullable(item.activity.commentsCount)}
                    </div>
                    <div className="row-item">
                      {formatNullable(item.activity.referralCount)}
                    </div>
                    <div className="row-item">
                      {formatNullable(item.activity.activityCount)}
                    </div>
                    <div className="row-item">
                      {formatNullable(item.activity.claimedTasksCount)}
                    </div>
                    <div className="row-item">
                      {formatNullable(item.activity.hoursOnline)}
                    </div>
                  </>
                ))}
              </AnimatedSection>
            </CompareCardWrapper>

            <CompareCardWrapper>
              <CompareSectionToggleBtn
                onClick={() => toggleSection("interactions")}
              >
                Interactions
                <ArrowSelectIcon
                  style={{
                    transform: activeSections.includes("interactions")
                      ? "rotate(180deg)"
                      : "rotate(0)",
                    transition: "transform 0.3s ease",
                  }}
                />
              </CompareSectionToggleBtn>
              <AnimatedSection isOpen={activeSections.includes("interactions")}>
                <CompareCard variant="main">
                  <div className="row-item key">Red Flags</div>
                  <div className="row-item key">Member Since</div>
                  <div className="row-item key">Location</div>
                </CompareCard>
                {renderMetricCard("interactions", (item) => (
                  <>
                    <div className="row-item">
                      {formatNullable(item.interactions.redFlagsCount)}
                    </div>
                    <div className="row-item">
                      {item.interactions.memberSince
                        ? moment(item.interactions.memberSince).format("ll")
                        : "\u2014"}
                    </div>
                    <div className="row-item">
                      {formatNullable(item.interactions.location)}
                    </div>
                  </>
                ))}
              </AnimatedSection>
            </CompareCardWrapper>
          </div>
        </CompareWrapper>
      </Wrapper>
      <SaveShareModal
        name="Fomies/User Showdown"
        link={typeof window !== "undefined" ? window.location.href : ""}
        html={showdownRef.current}
        isVisible={isShareModal}
        onClose={() => setIsShareModal(false)}
      />
    </>
  );
};

export default UserShowdown;
