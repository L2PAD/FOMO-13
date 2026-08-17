import React, { useContext, useState } from "react";
import { Info } from "lucide-react";
import { createGlobalStyle } from "styled-components";
import useComments from "../../../../hooks/useComments";
import { useQueryClient } from "react-query";
import { LocationContext } from "../../../global/Layout";
import Market from "./Market";
import { PageWrapper } from "../CryptoMarket/styles";
import CommentBlock from "../../../global/CommentBlock";
import {
  BuzzFilterWrapper,
  BuzzHeaderRight,
  BuzzHeaderTabs,
  BuzzHeaderTitleGroup,
  BuzzSearchWrapper,
} from "./styles";
import Tabs from "../../../global/Tabs";
import { Bell } from "lucide-react";
import NotificationsBell from "../../../global/NotificationsBell";
import { SearchIconStyle } from "../../../global/Navigation/styles";
import { SearchInput } from "../P2PExchange/styles";
import FomoUpdates from "./FomoUpdates";
import BuzzCalendar from "./Calendar";
import MarketDigests from "./Digests";
import FeedGate from "./FeedGate";
import PageHeader from "../../../global/PageHeader";
import Button from "../../../global/common/Button";
import UniversalFilter, {
  IFilterBlock,
} from "../../../global/UniversalFilter";
import CreatePostModal, {
  CreatePostData,
} from "../modals/CreatePostModal";
import createTopicPost from "../../../../http/comments/createTopicPost";
import { topicCommentsQueryKeys } from "../../../../hooks/useTopicComments";

const tabs = ["News", "Feed", "Calendar"];

const isCompleteDateValid = (day: string, month: string, year: string) => {
  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);
  const date = new Date(yearNumber, monthNumber - 1, dayNumber);

  if (
    date.getFullYear() !== yearNumber ||
    date.getMonth() !== monthNumber - 1 ||
    date.getDate() !== dayNumber
  ) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date <= today;
};

const formatDateInput = (value: string, previousValue: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (day.length === 1 && Number(day) > 3) {
    return previousValue;
  }

  if (day.length === 2) {
    const dayNumber = Number(day);

    if (dayNumber < 1 || dayNumber > 31) {
      return previousValue;
    }
  }

  if (month.length === 1 && Number(month) > 1) {
    return previousValue;
  }

  if (month.length === 2) {
    const monthNumber = Number(month);

    if (monthNumber < 1 || monthNumber > 12) {
      return previousValue;
    }
  }

  if (
    day.length === 2 &&
    month.length === 2 &&
    year.length === 4 &&
    !isCompleteDateValid(day, month, year)
  ) {
    return previousValue;
  }

  return [day, month, year].filter(Boolean).join("/");
};

const newsFilters: IFilterBlock[] = [
  {
    id: "buzz-category",
    className: "buzz-filter-body",
    filters: [
      {
        key: "category",
        type: "checkbox",
        label: "Category",
        className: "buzz-category-filter",
        values: [
          { key: "ecosystem", label: "Ecosystem", isActive: true },
          { key: "p2p", label: "P2P", isActive: true },
          { key: "community", label: "Community", isActive: false },
          { key: "earn", label: "Earn", isActive: false },
          { key: "markets", label: "Markets", isActive: false },
          { key: "nft", label: "NFT", isActive: false },
          { key: "research", label: "Research", isActive: false },
          { key: "tech", label: "Tech", isActive: true },
          { key: "launchpool", label: "Launchpool", isActive: false },
          { key: "others", label: "Others", isActive: true },
        ],
      },
      {
        key: "fromDate",
        type: "search",
        label: "",
        className: "buzz-date-filter buzz-date-from",
        placeholder: "From",
        values: "" as any,
        formatValue: formatDateInput,
      },
      {
        key: "toDate",
        type: "search",
        label: "",
        className: "buzz-date-filter",
        placeholder: "To",
        values: "" as any,
        formatValue: formatDateInput,
      },
    ],
  },
];

const BuzzFilterModalStyle = createGlobalStyle`
  .modal-style:has(.buzz-filter-body) {
    width: 493px !important;
    border-radius: 8px;
  }

  .modal-style:has(.buzz-filter-body) .internal-wrapper {
    padding: 18px 27px 22px;
  }

  .modal-style:has(.buzz-filter-body) .header-wrapper {
    display: none;
  }

  .buzz-filter-body {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 19px !important;
    row-gap: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
  }

  .buzz-category-filter {
    grid-column: 1 / -1;
  }

  .buzz-category-filter h4 {
    margin: 0 0 12px !important;
    color: #070b35;
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    line-height: 20px;
  }

  .buzz-category-filter .categories {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    column-gap: 64px;
    row-gap: 14px;
    overflow: visible;
  }

  .buzz-category-filter label {
    width: 100%;
    height: 16px;
    padding-left: 0;
    justify-content: flex-end;
  }

  .buzz-category-filter label p {
    width: 100%;
    margin: 0 0 0 8px;
    color: #070b35;
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 16px;
  }

  .buzz-date-filter {
    position: relative;
    margin-top: 19px;
    padding-top: 19px;
  }

  .buzz-date-from::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: calc(200% + 19px);
    height: 1px;
    background: #eef1f5;
  }

  .buzz-date-filter h4 {
    display: none;
  }

  .buzz-date-filter .inputRootWrapper,
  .buzz-date-filter .inputRootWrapper > div {
    width: 100%;
  }

  .buzz-date-filter svg {
    display: none;
  }

  .buzz-date-filter .inputRootWrapper > div::after {
    content: "";
    position: absolute;
    top: 8px;
    right: 10px;
    width: 14px;
    height: 14px;
    pointer-events: none;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'%3E%3Cpath d='M4.33333 1V3M9.66667 1V3M2 5.33333H12M3.33333 2H10.6667C11.403 2 12 2.59695 12 3.33333V10.6667C12 11.403 11.403 12 10.6667 12H3.33333C2.59695 12 2 11.403 2 10.6667V3.33333C2 2.59695 2.59695 2 3.33333 2Z' stroke='%239AA4B2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat;
  }

  .buzz-date-filter input {
    width: 100% !important;
    height: 30px;
    padding: 7px 32px 7px 12px !important;
    border-radius: 2px;
    background: #f9f9f9 !important;
    color: #070b35;
    font-size: 12px;
    font-weight: var(--font-weight-regular);
  }

  .buzz-date-filter input::placeholder {
    color: #b5bcc7;
    font-size: 12px;
    font-weight: var(--font-weight-regular);
  }

  .modal-style:has(.buzz-filter-body) .content > .buzz-filter-body + div {
    display: flex;
    gap: 12px;
    width: 100%;
    margin: 20px 0 0;
  }

  .modal-style:has(.buzz-filter-body) .content > .buzz-filter-body + div > * {
    width: 50%;
    max-width: 100%;
    min-height: 40px;
    border-radius: 8px;
  }

  .modal-style:has(.buzz-filter-body) .content > .buzz-filter-body + div > *:last-child {
    background: #04a584 !important;
    color: #ffffff;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
  }

  .modal-style:has(.buzz-filter-body) .content > .buzz-filter-body + div + div {
    max-width: fit-content;
    margin: 16px auto 0;
  }

  .modal-style:has(.buzz-filter-body) .content > .buzz-filter-body + div + div button {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #738094;
    font-size: 12px;
    font-weight: var(--font-weight-medium);
  }

  .buzz-create-post {
    height: 40px;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 14px;
    line-height: 18px;
    white-space: nowrap;
  }

  @media (max-width: 600px) {
    .modal-style:has(.buzz-filter-body) {
      width: calc(100vw - 24px) !important;
    }

    .modal-style:has(.buzz-filter-body) .internal-wrapper {
      padding: 18px;
    }

    .buzz-category-filter .categories {
      column-gap: 24px;
    }
  }
`;

const News = () => {
  const { path } = useContext(LocationContext);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const { comments, confirmAddComment, refetch } = useComments(
    `comments/${path}`,
    `comments/${path}`
  );
  const [searchValue, setSearchValue] = useState<string>("");
  const [filterData, setFilterData] = useState<Record<string, any> | null>(null);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  const handleCreatePost = async (data: CreatePostData) => {
    const result = await createTopicPost(data);

    if (!result.isSuccess) {
      throw new Error(result.error || "Unable to publish the post.");
    }

    await queryClient.invalidateQueries(topicCommentsQueryKeys.all);
  };

  const getContent = () => {
    switch (activeTab) {
      case "News":
        return <Market searchValue={searchValue} filterData={filterData} />;
      case "Feed":
        return <FeedGate searchValue={searchValue} filterData={filterData} />;
      case "Calendar":
        return <BuzzCalendar />;
      case "FOMO Updates":
        return <FomoUpdates searchValue={searchValue} sourcePath="all" />;
      default:
        return <Market />;
    }
  };

  return (
    <PageWrapper>
      <BuzzFilterModalStyle />
      <PageHeader className="buzz-news-header">
        <BuzzHeaderTitleGroup>
          <button className="tooltip-button" type="button">
            <Info size={16} color="#738094" />
            <span
              className="tooltip-text"
              style={{
                width: 320,
              }}
            >
              Stay up-to-date with the latest crypto news, market updates, and
              exclusive announcements from Fomoland.
            </span>
          </button>
          <h1>Buzz</h1>
        </BuzzHeaderTitleGroup>
        <BuzzHeaderTabs>
          <Tabs
            className="buzz-header-tabs"
            items={tabs}
            activeItem={activeTab}
            onClick={(value: string) => setActiveTab(value)}
          />
        </BuzzHeaderTabs>
        <BuzzHeaderRight>
          <button
            data-testid="fomo-updates-btn"
            onClick={() => setActiveTab(activeTab === "FOMO Updates" ? "News" : "FOMO Updates")}
            title="System updates from FOMO"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 16px",
              borderRadius: 12,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontSize: 13.5,
              fontWeight: 700,
              color: activeTab === "FOMO Updates" ? "#fff" : "#c7d2fe",
              background: "linear-gradient(135deg,#141b34 0%,#1e2547 100%)",
              border: activeTab === "FOMO Updates" ? "1px solid #04a584" : "1px solid #2a3358",
              boxShadow: activeTab === "FOMO Updates" ? "0 0 0 3px rgba(4,165,132,0.20)" : "none",
            }}
          >
            <Bell size={15} />
            FOMO Updates
          </button>
          {activeTab !== "Calendar" && activeTab !== "FOMO Updates" && (
            <>
              <BuzzSearchWrapper>
                <SearchInput
                  className="width100 buzz-news-search"
                  type="text"
                  placeholder="Search post"
                  onChange={(value: string) => setSearchValue(value)}
                  leftIcon={<SearchIconStyle />}
                  value={searchValue}
                />
              </BuzzSearchWrapper>
              <BuzzFilterWrapper>
                <UniversalFilter
                  filters={newsFilters}
                  onChange={(filterData: Record<string, any>) =>
                    setFilterData(filterData)
                  }
                  onReset={() => setFilterData(null)}
                />
              </BuzzFilterWrapper>
            </>
          )}
          {activeTab === "Feed" ? (
            <Button
              className="buzz-create-post"
              variant="primary"
              onClick={() => setIsCreatePostModalOpen(true)}
            >
              + Create Topic
            </Button>
          ) : (
            <></>
          )}
        </BuzzHeaderRight>
      </PageHeader>
      {getContent()}
      {activeTab === "News" && <MarketDigests />}
      {/* Topics (Feed) are the forum themselves — no generic comment block there.
          Keep general comments only on News / FOMO Updates. */}
      {activeTab !== "Calendar" && activeTab !== "Feed" && (
        <CommentBlock
          items={comments}
          addComment={confirmAddComment}
          refetch={refetch}
        />
      )}
      <CreatePostModal
        isVisible={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        onSubmit={handleCreatePost}
      />
    </PageWrapper>
  );
};

export default News;
