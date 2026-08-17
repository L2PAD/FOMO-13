import React, { useContext, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { CheckCheck, Info } from "lucide-react";
import Layout, { LayoutContext } from "../components/global/Layout";
import Navigation from "../components/global/Navigation";
import PageHeader from "../components/global/PageHeader";
import DescriptionComponent from "../components/global/common/DescriptionComponent";
import { IFomoNotification, STORAGE_UPDATES_KEY } from "../components/global/NavBar";
import FomoUpdates from "../components/layouts/projects/News/FomoUpdates";
import { PageWrapper } from "../components/layouts/projects/CryptoMarket/styles";
import {
  SearchInput,
} from "../components/layouts/projects/P2PExchange/styles";
import { SearchIconStyle } from "../components/global/Navigation/styles";
import { UtilityPages } from "../staticContent/tabs";
import { FilterButton } from "../components/global/Filter/styles";

const UpdatesHeader = styled(PageHeader)`
  &.updates-page-header {
    display: grid;
    grid-template-columns: auto auto 1fr minmax(260px, 320px) auto;
    align-items: center;
    gap: 10px;
    min-height: 58px;
    margin-bottom: 20px;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 2px 2px 8px 0px #00053014;
  }

  .tooltip-button {
    display: flex;
    padding: 0;
    border: none;
    background: transparent;
  }

  .tooltip-anchor {
    position: relative;
    display: flex;
    margin-top: 3px;
  }

  .tooltip-anchor .updates-description {
    position: absolute;
    z-index: 10;
    left: 0;
    top: calc(100% + 8px);
    width: 320px;
    max-width: min(320px, calc(100vw - 24px));
    padding: 8px 10px;
    border-radius: 8px;
    background: #070b35;
    box-sizing: border-box;
  }

  .tooltip-anchor .updates-description .description-modal-text {
    color: #ffffff;
    font-size: 12px;
    font-weight: var(--font-weight-regular);
    line-height: 16px;
    text-align: left;
    white-space: normal;
  }

  @media (max-width: 1100px) {
    &.updates-page-header {
      grid-template-columns: 1fr auto;
      gap: 12px;
    }
  }

  @media (max-width: 767px) {
    &.updates-page-header {
      display: grid;
      grid-template-columns: 1fr;
      align-items: stretch;
      padding: 12px;
    }
  }
`;

const UpdatesHeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  h1 {
    margin: 0;
    color: var(--main-black);
    font-size: 32px;
    font-weight: var(--font-weight-medium);
    line-height: 1;
    white-space: nowrap;
  }

  svg {
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 26px;
    }
  }
`;

const UpdatesMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 22px;
  min-width: 0;
  margin-left:6px;

  @media (max-width: 1100px) {
    justify-content: flex-end;
  }

  @media (max-width: 767px) {
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 12px;
  }
`;

const UpdatesMetaItem = styled.span<{ $accent?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${({ $accent }) => ($accent ? "#2f80d5" : "var(--main-gray)")};
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  white-space: nowrap;

  &::before {
    content: "";
    display: ${({ $accent }) => ($accent ? "block" : "none")};
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2f80d5;
  }
`;

const MarkAllReadButton = styled.button`
  max-width: 150px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 34px;
  padding: 8px 16px;
  border: 1px solid #eef1f5;
  border-radius: 6px;
  background: #ffffff;
  color: var(--main-black);
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  line-height: 18px;
  white-space: nowrap;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: #f9f9f9;
    border-color: #e5e9ef;
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  @media (max-width: 767px) {
    width: 100%;
  }
`;

const UpdatesSearchWrapper = styled.div`
  width: 100%;

  .crypto-market-search {
    width: 100%;

    input {
      width: 100%;
    }
  }

  @media (max-width: 1100px) {
    grid-column: 1 / -1;
  }
`;

const SortButton = styled(FilterButton).attrs({ as: "button" })`
  justify-content: center;
  border: none;
  min-height: 40px;
  padding: 10px 18px;

  @media (max-width: 767px) {
    width: 100%;
  }
`;

const getStoredSeenUpdateIds = (): string[] => {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(STORAGE_UPDATES_KEY);
    const parsed = value ? JSON.parse(value) : [];

    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const UpdatesPage = () => {
  const { layout } = useContext(LayoutContext);
  const updates = useMemo<IFomoNotification[]>(
    () => (Array.isArray(layout?.updates) ? layout.updates : []),
    [layout?.updates]
  );
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const unreadCount = updates.filter(
    (update) => !seenIds.includes(String(update._id))
  ).length;

  useEffect(() => {
    setSeenIds(getStoredSeenUpdateIds());
  }, []);

  const markAllRead = () => {
    const nextSeenIds = Array.from(
      new Set([...seenIds, ...updates.map((update) => String(update._id))])
    );

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_UPDATES_KEY,
        JSON.stringify(nextSeenIds)
      );
      window.dispatchEvent(new Event("fomo-updates-seen-change"));
    }

    setSeenIds(nextSeenIds);
  };

  return (
    <Layout title="FOMO: Updates">
      <Navigation project="updates" pagesList={UtilityPages} />
      <PageWrapper>
        <UpdatesHeader className="updates-page-header">
          <UpdatesHeaderTitle>
            <div
              className="tooltip-anchor"
              onMouseEnter={() => setIsTooltipVisible(true)}
              onMouseLeave={() => setIsTooltipVisible(false)}
            >
              <button
                className="tooltip-button"
                type="button"
                onFocus={() => setIsTooltipVisible(true)}
                onBlur={() => setIsTooltipVisible(false)}
                aria-label="About updates"
              >
                <Info size={16} color="#9aa4b2" strokeWidth={1.8} />
              </button>
              <DescriptionComponent
                className="updates-description"
                isVisible={isTooltipVisible}
                date={new Date()}
                isDate={false}
                text="Stay up to date with new features, improvements and system changes."
              />
            </div>
            <h1>FOMO Updates</h1>
          </UpdatesHeaderTitle>
          <UpdatesMeta>
            <UpdatesMetaItem>
              <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 13.3182C5.03076 13.7422 5.73165 14 6.5 14C7.26835 14 7.96924 13.7422 8.5 13.3182M0.880725 11.1363C0.564516 11.1363 0.387905 10.6396 0.579181 10.3636C1.02302 9.72316 1.45141 8.78386 1.45141 7.65274L1.46972 6.01374C1.46972 2.96859 3.72185 0.5 6.5 0.5C9.31907 0.5 11.6044 3.00495 11.6044 6.09496L11.5861 7.65274C11.5861 8.79163 11.9997 9.73605 12.4255 10.3767C12.6094 10.6534 12.4323 11.1363 12.12 11.1363H0.880725Z" stroke="#728094" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {updates.length} total updates</UpdatesMetaItem>
            <UpdatesMetaItem $accent>{unreadCount} unread</UpdatesMetaItem>
          </UpdatesMeta>
          <MarkAllReadButton
            type="button"
            disabled={unreadCount === 0}
            onClick={markAllRead}
          >
            <CheckCheck size={15} strokeWidth={1.8} />
            Mark all read
          </MarkAllReadButton>
          <UpdatesSearchWrapper>
            <SearchInput
              className="crypto-market-search width100"
              type="text"
              placeholder="Search updates..."
              onChange={(value: string) => setSearchValue(value)}
              leftIcon={<SearchIconStyle />}
              value={searchValue}
            />
          </UpdatesSearchWrapper>
          <SortButton
            onClick={() =>
              setSortOrder((current) => (current === "desc" ? "asc" : "desc"))
            }
            newSort
          >
            <div className="sort-trigger">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.0625 2.46875L9.03125 0.5M9.03125 0.5L11 2.46875M9.03125 0.5L9.03125 11M4.4375 9.03125L2.46875 11M2.46875 11L0.5 9.03125M2.46875 11L2.46875 0.5" stroke="#728094" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Sort</span>
            </div>
          </SortButton>
        </UpdatesHeader>
        <FomoUpdates
          searchValue={searchValue}
          sortOrder={sortOrder}
          sourcePath="all"
        />
      </PageWrapper>
    </Layout>
  );
};

export default UpdatesPage;
