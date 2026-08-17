import React, { FC, RefObject, useEffect, useRef, useState } from "react";
import { ArrowDownUp, Info } from "lucide-react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import {
  IPublicPortfolioSearchItem,
  IPublicPortfolioSearchResponse,
  IPortfolioSummary,
} from "../../../../../types/global_types";
import { searchPublicPortfolios } from "../../../../../http/portfolio";
import imageLoader from "../../../../../helpers/imageLoader";
import { useDebounce } from "../../../../../hooks/useDebounce";
import { SearchIconStyle } from "../../../../global/Navigation/styles";
import { Button } from "../../../../global/common/Button";
import Placeholder from "../../../../global/common/Placeholder";
import UserAvatar from "../../../../global/common/UserAvatar";
import { SearchInput } from "../../../projects/P2PExchange/styles";
import {
  CorePortfolioDesktopButton,
  CorePortfolioDropdownEmpty,
  CorePortfolioDropdownItem,
  CorePortfolioDropdownList,
  CorePortfolioHeader,
  CorePortfolioHeaderRight,
  CorePortfolioSearchDropdown,
  CorePortfolioSearchDropdownItem,
  CorePortfolioSearchDropdownState,
  CorePortfolioSearchWrapper,
  CorePortfolioTitleGroup,
} from "../styles";
import {
  PORTFOLIO_PAGE_TITLE,
  PORTFOLIO_TOOLTIP_FOLLOWUP_TEXT,
  PORTFOLIO_TOOLTIP_LEAD_TEXT,
  PUBLIC_PORTFOLIO_SEARCH_DEBOUNCE_MS,
  PUBLIC_PORTFOLIO_SEARCH_LIMIT,
  PUBLIC_PORTFOLIO_SEARCH_MIN_LENGTH,
} from "../constants";
import {
  formatDropdownBalance,
  formatDropdownChange,
  getDropdownChangeClass,
} from "../helpers/portfolio";

interface PortfolioPageIntroProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  portfolioDropdownRef: RefObject<HTMLDivElement>;
  isPortfolioDropdownOpen: boolean;
  portfolioItems: IPortfolioSummary[];
  activePortfolioId: string;
  onTogglePortfolioDropdown: () => void;
  onSelectPortfolio: (portfolioId: string) => void;
  onOpenCreatePortfolio: () => void;
}

const PortfolioPageIntro: FC<PortfolioPageIntroProps> = ({
  searchValue,
  onSearchChange,
  portfolioDropdownRef,
  isPortfolioDropdownOpen,
  portfolioItems,
  activePortfolioId,
  onTogglePortfolioDropdown,
  onSelectPortfolio,
  onOpenCreatePortfolio,
}) => {
  const [isPublicSearchOpen, setIsPublicSearchOpen] = useState(false);
  const publicSearchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debouncedSearchValue = useDebounce(
    searchValue,
    PUBLIC_PORTFOLIO_SEARCH_DEBOUNCE_MS
  );
  const normalizedSearchQuery = debouncedSearchValue.trim();
  const isPublicSearchReady =
    normalizedSearchQuery.length >= PUBLIC_PORTFOLIO_SEARCH_MIN_LENGTH;
  const {
    data: publicPortfolioSearchData,
    isLoading: isPublicPortfolioSearchLoading,
    isFetching: isPublicPortfolioSearchFetching,
    isError: isPublicPortfolioSearchError,
    refetch: refetchPublicPortfolioSearch,
  } = useQuery<IPublicPortfolioSearchResponse>(
    ["public-portfolio-search", normalizedSearchQuery],
    () =>
      searchPublicPortfolios(
        normalizedSearchQuery,
        PUBLIC_PORTFOLIO_SEARCH_LIMIT
      ),
    {
      enabled: isPublicSearchReady,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      staleTime: 30 * 1000,
    }
  );

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (!publicSearchRef.current) return;

      if (!publicSearchRef.current.contains(event.target as Node)) {
        setIsPublicSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  const publicSearchResults = isPublicSearchReady
    ? publicPortfolioSearchData?.items || []
    : [];
  const isPublicSearchLoading =
    isPublicSearchReady &&
    (isPublicPortfolioSearchLoading || isPublicPortfolioSearchFetching);
  const shouldShowPublicSearchDropdown =
    isPublicSearchOpen && isPublicSearchReady;

  const handleSearchChange = (value: string) => {
    onSearchChange(value);

    if (value.trim().length >= PUBLIC_PORTFOLIO_SEARCH_MIN_LENGTH) {
      setIsPublicSearchOpen(true);
      return;
    }

    setIsPublicSearchOpen(false);
  };

  const handleSearchFocus = (isFocused: boolean) => {
    if (
      isFocused &&
      searchValue.trim().length >= PUBLIC_PORTFOLIO_SEARCH_MIN_LENGTH
    ) {
      setIsPublicSearchOpen(true);
    }
  };

  const handlePublicSearchBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const nextFocusedElement = event.relatedTarget as Node | null;

    if (event.currentTarget.contains(nextFocusedElement)) return;
    setIsPublicSearchOpen(false);
  };

  const handlePublicPortfolioSelect = async (shareCode: string) => {
    setIsPublicSearchOpen(false);
    await router.push(`/portfolio/${shareCode}`);
  };

  const formatUpdatedAt = (value?: string) => {
    if (!value) return "Recently updated";

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  };

  const getPortfolioInitials = (value: string) => {
    const initials = value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("");

    return initials || "PF";
  };

  const getPublicPortfolioSecondaryText = (
    portfolio: IPublicPortfolioSearchItem
  ) => {
    if (portfolio.description?.trim()) return portfolio.description.trim();
    if (portfolio.owner.username) {
      return `@${portfolio.owner.username} · Updated ${formatUpdatedAt(
        portfolio.updatedAt
      )}`;
    }

    return `Updated ${formatUpdatedAt(portfolio.updatedAt)}`;
  };
  const activePortfolioName =
    portfolioItems.find((item) => item._id === activePortfolioId)?.name ||
    "My Portfolio";

  return (
    <>
      <CorePortfolioHeader>
        <CorePortfolioTitleGroup>
          <button
            className="tooltip-button"
            type="button"
            aria-label="About portfolio analytics"
          >
            <Info size={16} color="#738094" aria-hidden="true" />
            <span
              className="tooltip-text"
              style={{
                width: 320,
              }}
            >
              {PORTFOLIO_TOOLTIP_LEAD_TEXT}
              <br />
              <br />
              {PORTFOLIO_TOOLTIP_FOLLOWUP_TEXT}
            </span>
          </button>
          <h1>{PORTFOLIO_PAGE_TITLE}</h1>
        </CorePortfolioTitleGroup>
        <CorePortfolioHeaderRight>
          <CorePortfolioSearchWrapper
            ref={publicSearchRef}
            onBlur={handlePublicSearchBlur}
          >
            <SearchInput
              className="width100"
              type="text"
              placeholder="Search"
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              leftIcon={<SearchIconStyle />}
              value={searchValue}
            />
            {shouldShowPublicSearchDropdown ? (
              <CorePortfolioSearchDropdown>
                {isPublicSearchLoading ? (
                  <>
                    {[1, 2, 3].map((item) => (
                      <Placeholder
                        key={item}
                        width="100%"
                        height="60px"
                        borderRadius="8px"
                        marginBottom="0"
                      />
                    ))}
                  </>
                ) : isPublicPortfolioSearchError ? (
                  <CorePortfolioSearchDropdownState>
                    <strong>Search is temporarily unavailable</strong>
                    <span>
                      Public portfolios could not be loaded right now.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        void refetchPublicPortfolioSearch();
                      }}
                    >
                      Retry
                    </button>
                  </CorePortfolioSearchDropdownState>
                ) : publicSearchResults.length ? (
                  publicSearchResults.map((portfolio) => {
                    const logo = portfolio.logo
                      ? imageLoader(portfolio.logo)
                      : "";
                    const ownerAvatar = portfolio.owner.avatar
                      ? imageLoader(portfolio.owner.avatar)
                      : undefined;

                    return (
                      <CorePortfolioSearchDropdownItem
                        key={`${portfolio.id}-${portfolio.shareCode}`}
                        type="button"
                        onPointerDown={(event) => {
                          event.preventDefault();
                          void handlePublicPortfolioSelect(portfolio.shareCode);
                        }}
                        onClick={(event) => {
                          if (event.detail === 0) {
                            void handlePublicPortfolioSelect(
                              portfolio.shareCode
                            );
                          }
                        }}
                      >
                        <div className="logo">
                          {logo ? (
                            <img src={logo} alt={portfolio.name} />
                          ) : (
                            <span>{getPortfolioInitials(portfolio.name)}</span>
                          )}
                        </div>
                        <div className="content">
                          <div className="top-row">
                            <strong>{portfolio.name}</strong>
                            <span className="share-code">
                              #{portfolio.shareCode}
                            </span>
                          </div>
                          <div className="owner-row">
                            <UserAvatar
                              className="owner-avatar"
                              size="xSmall"
                              variant="default"
                              avatar={ownerAvatar}
                              name={portfolio.owner.displayName}
                            />
                            <span className="owner">
                              @{portfolio.owner.displayName}
                            </span>
                          </div>
                          <p>{getPublicPortfolioSecondaryText(portfolio)}</p>
                        </div>
                      </CorePortfolioSearchDropdownItem>
                    );
                  })
                ) : (
                  <CorePortfolioSearchDropdownState>
                    <strong>No public portfolios found</strong>
                    <span>Nothing matched "{normalizedSearchQuery}".</span>
                  </CorePortfolioSearchDropdownState>
                )}
              </CorePortfolioSearchDropdown>
            ) : null}
          </CorePortfolioSearchWrapper>
          <CorePortfolioDesktopButton ref={portfolioDropdownRef}>
            <Button
              className="portfolio-header-btn"
              variant="outlined"
              leftIcon={<ArrowDownUp size={14} />}
              onClick={onTogglePortfolioDropdown}
            >
              <span
                className="active-portfolio-label"
                title={activePortfolioName}
              >
                {activePortfolioName}
              </span>
            </Button>
            {isPortfolioDropdownOpen ? (
              <CorePortfolioDropdownList>
                {portfolioItems.length ? (
                  portfolioItems.map((portfolio) => (
                    <CorePortfolioDropdownItem
                      key={portfolio._id || portfolio.name}
                      active={activePortfolioId === portfolio._id}
                      onClick={() => onSelectPortfolio(portfolio._id)}
                    >
                      {portfolio.logo ? (
                        <img
                          src={imageLoader(portfolio.logo)}
                          alt={portfolio.name}
                        />
                      ) : (
                        <span
                          className="portfolio-logo-fallback"
                          aria-hidden="true"
                        >
                          {getPortfolioInitials(portfolio.name)}
                        </span>
                      )}
                      <div className="portfolio-dropdown-content">
                        <div className="portfolio-dropdown-top">
                          <span className="portfolio-name">
                            {portfolio.name}
                          </span>
                          <span className="portfolio-balance">
                            {formatDropdownBalance(portfolio.totalBalance)}
                          </span>
                        </div>
                        <div className="portfolio-dropdown-bottom">
                          <span
                            className="portfolio-description"
                            title={
                              portfolio.description?.trim() ||
                              "No description"
                            }
                          >
                            {portfolio.description?.trim() ||
                              "No description"}
                          </span>
                          <span
                            className={`portfolio-change ${getDropdownChangeClass(
                              portfolio?.performance1h?.usd
                            )}`}
                          >
                            {formatDropdownChange(
                              portfolio?.performance1h?.usd
                            )}
                          </span>
                        </div>
                      </div>
                    </CorePortfolioDropdownItem>
                  ))
                ) : (
                  <CorePortfolioDropdownEmpty>
                    No portfolios yet
                  </CorePortfolioDropdownEmpty>
                )}
              </CorePortfolioDropdownList>
            ) : (
              <></>
            )}
          </CorePortfolioDesktopButton>
          <CorePortfolioDesktopButton>
            <Button
              className="portfolio-header-btn primary"
              variant="outlined"
              onClick={onOpenCreatePortfolio}
            >
              + New Portfolio
            </Button>
          </CorePortfolioDesktopButton>
        </CorePortfolioHeaderRight>
      </CorePortfolioHeader>
    </>
  );
};

export default PortfolioPageIntro;
