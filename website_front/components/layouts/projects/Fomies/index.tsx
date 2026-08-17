/* eslint-disable */
import React, { useContext, useEffect, useState } from "react";
import { useQuery } from "react-query";
import { Info } from "lucide-react";
import { LocationContext } from "../../../global/Layout";
import Pagination from "../../../global/Pagintaion";
import useComments from "../../../../hooks/useComments";
import Typography from "../../../global/common/Typography";
import { SearchIconStyle } from "../../../global/Navigation/styles";
import { SearchInput, SearchWrapper } from "../P2PExchange/styles";
import CommentBlock from "../../../global/CommentBlock";
import {
  MainInfo,
  MainInfoDescription,
  PageWrapper,
  SearchContainer,
} from "../CryptoMarket/styles";
import UniversalTable from "../../../global/common/UniversalTable";
import { fomonaudsGridColumns, fomonaudsSortHeader } from "../../../../staticContent/tables";
import UniversalFilter from "../../../global/UniversalFilter";
import fetchItems from "../../../../http/fetchItems";
import EmptyList from "../../../global/EmptyList";
import { fomonautsFilter } from "../../../../staticContent/projects/crypto_market";
import { HeaderWrapper, LeftHeaderWrapper, ProjectsWrapper } from "../Crypto/styles";
import PageHeader from "../../../global/PageHeader";
import LocalAdBadge from "../../../global/LocalAdBadge";
import {
  FomiesHeaderActions,
  FomiesHeaderLeft,
  FomiesHeaderRight,
  FomiesHeaderStat,
  FomiesHeaderStats,
  FomiesMobileContent,
  FomiesMobileActions,
} from "./styles";
import { useTranslation } from "i18n";
import { fetchUserReposts } from "../../../../http/comments/repostTopic";
import { getUserId } from "../../../../helpers/getUserRole";
import Link from "next/link";

// Community reposts — topics the current user reposted from the Buzz feed.
const RepostsBlock = () => {
  const uid = typeof window !== "undefined" ? getUserId() : "";
  const { data } = useQuery(
    ["user-reposts", uid],
    () => fetchUserReposts(uid),
    { enabled: !!uid, refetchOnWindowFocus: false }
  );
  const reposts: any[] = Array.isArray(data) ? data : [];
  if (!uid || !reposts.length) return null;

  return (
    <div data-testid="fomies-reposts-block" style={{
      margin: "0 0 20px", padding: 16, borderRadius: 14,
      border: "1px solid #eef2f5", background: "#fbfcfe",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#070b35" }}>Your Reposts</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#04a584", background: "#04a5841a", borderRadius: 999, padding: "2px 8px" }}>{reposts.length}</span>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {reposts.map((r) => (
          <Link key={r._id} href={`/crypto/news`} data-testid={`repost-item-${r._id}`} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
            padding: "10px 14px", borderRadius: 10, background: "#fff",
            border: "1px solid #eef2f5", textDecoration: "none",
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1d26", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.topicName || "Untitled topic"}
            </span>
            <span style={{ fontSize: 12, color: "#98a2b3", flexShrink: 0 }}>
              {(r.likes?.length || 0)} likes · {r.replyCount ?? 0} comments
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

interface IStatsData {
  totalFomies?: number;
  verified?: number;
  avgXP?: number;
  topRank?: string | number;
}

export const buildFomonautsFilterSummary = (
  filters: Record<string, { isActive: boolean; key: string }[]> | undefined
): string => {
  if (!filters) return "";

  const queryParts: string[] = [];

  for (const key in filters) {
    const value = filters[key];
    if (!Array.isArray(value)) continue;

    const activeItems = value
      .filter((item) => item.isActive)
      .map((item) => item.key);

    if (
      activeItems.length &&
      !activeItems.includes("all") &&
      activeItems.length !== value.length
    ) {
      queryParts.push(`${key}=${activeItems.join(",")}`);
    }
  }

  return queryParts.length ? `&${queryParts.join("&")}` : "";
};

const UsersIcon = ({ color }: { color: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M13.3545 17.1441L13.3548 14.4659C13.3549 12.9866 12.1557 11.7873 10.6764 11.7873H4.67868C3.19957 11.7873 2.00047 12.9863 2.0003 14.4654L2 17.1441M17.9998 17.1442L18 14.4661C18.0001 12.9868 16.8009 11.7875 15.3216 11.7875M12.8386 3.38555C13.4964 3.87358 13.9226 4.65596 13.9226 5.5379C13.9226 6.41984 13.4964 7.20222 12.8386 7.69025M10.4115 5.53775C10.4115 7.01698 9.21235 8.21613 7.73312 8.21613C6.25389 8.21613 5.05474 7.01698 5.05474 5.53775C5.05474 4.05853 6.25389 2.85938 7.73312 2.85938C9.21235 2.85938 10.4115 4.05853 10.4115 5.53775Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const VerifiedIcon = ({ color }: { color: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M2 18L2.00034 14.9997C2.00052 13.3429 3.34361 12 5.00034 12H10.9999M13.5 14.5L14.5 15.5L18 12M14.5 2C15.7135 2.68023 16.5 3.77073 16.5 5C16.5 6.22927 15.7135 7.31977 14.5 8M12 5C12 6.65685 10.6569 8 9 8C7.34314 8 6 6.65685 6 5C6 3.34315 7.34314 2 9 2C10.6569 2 12 3.34315 12 5Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChartIcon = ({ color }: { color: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M2 2V18H18M6 12.0001L9.5 8.5001L12 11.0001L16.5001 6.5"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RankIcon = ({ color }: { color: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M13.3545 17.1441L13.3548 14.4659C13.3549 12.9866 12.1557 11.7873 10.6764 11.7873H4.67868C3.19957 11.7873 2.00047 12.9863 2.0003 14.4654L2 17.1441M10.4115 5.53775C10.4115 7.01698 9.21235 8.21613 7.73312 8.21613C6.25389 8.21613 5.05474 7.01698 5.05474 5.53775C5.05474 4.05853 6.25389 2.85938 7.73312 2.85938C9.21235 2.85938 10.4115 4.05853 10.4115 5.53775Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.9997 3.33203L15.708 4.85717L17.3774 5.05949L16.1457 6.2044L16.4692 7.85457L14.9997 7.03703L13.5302 7.85457L13.8537 6.2044L12.6221 5.05949L14.2914 4.85717L14.9997 3.33203Z"
      stroke={color}
      strokeWidth="0.7"
      strokeLinejoin="round"
    />
  </svg>
);

const FomiesLayout = () => {
  const { t, translateText } = useTranslation();
  const [isFavourite, setIsFavourite] = useState(false);
  const [queryString, setQueryString] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState<any>();
  const [filterData, setFilterData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const { path } = useContext(LocationContext);
  const limit = 50;
  const { comments, confirmAddComment, refetch } = useComments(
    `comments/${path}`,
    `comments/${path}`
  );

  const { data, isLoading } = useQuery(
    ["fomonauds", sortValue, page, queryString],
    () =>
      fetchItems(
        `user/fomonauts/all?offset=${(page - 1) * limit}&limit=${limit}${queryString}`
      ),
    {
      refetchOnWindowFocus: false,
    }
  );

  const statistics = useQuery(
    "fomies-statistics",
    () => fetchItems("user/fomonauts/statistics"),
    {
      refetchOnWindowFocus: false,
    }
  );

  const items: Array<any> = data?.data?.users || [];
  const statsData: IStatsData = statistics?.data?.data || {};

  const updateSortValue = (name: string, value: 1 | -1): void => {
    setSortValue((prev: any) => {
      if (prev?.name === name) return { name, value };

      return { name, value: -1 };
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setQueryString(
        buildFomonautsFilterSummary(filterData) +
        `&searchValue=${searchValue || ""}`
      );
    }, 600);

    return () => clearTimeout(timer);
  }, [filterData, searchValue]);

  const renderStats = (color: string) => (
    <>
      <div className="fomonauts">
        <UsersIcon color={color} />
        <div className="fomonauts-info">
          <div className="fomonauts-key">{translateText("Total Fomies")}</div>
          <div className="fomonauts-value">{statsData.totalFomies || 0}</div>
        </div>
      </div>
      <div className="fomonauts">
        <VerifiedIcon color={color} />
        <div className="fomonauts-info">
          <div className="fomonauts-key">{translateText("Verified")}</div>
          <div className="fomonauts-value">{statsData.verified || 0}</div>
        </div>
      </div>
      <div className="fomonauts">
        <ChartIcon color={color} />
        <div className="fomonauts-info">
          <div className="fomonauts-key">{translateText("Avg XP")}</div>
          <div className="fomonauts-value">{statsData.avgXP || 0}</div>
        </div>
      </div>
      <div className="fomonauts">
        <RankIcon color={color} />
        <div className="fomonauts-info">
          <div className="fomonauts-key">{translateText("Top Rank")}</div>
          <div className="fomonauts-value">{statsData.topRank || "-"}</div>
        </div>
      </div>
    </>
  );

  const getContent = (): React.ReactNode => {
    return (
      <ProjectsWrapper style={{ marginTop: "0px" }}>
        {Number(data?.data?.total) > limit ? (
          <Pagination
            page={page}
            total={Number(data?.data?.total)}
            limit={
              Number(data?.data?.total) < page * limit
                ? data?.data?.total
                : page * limit
            }
            totalPage={Math.ceil(Number(data?.data?.total) / limit)}
            onChange={(value) => {
              setPage(value);
            }}
          />
        ) : null}
        <UniversalTable
          className="fomies"
          isFavorite={isFavourite}
          setIsFavorite={setIsFavourite}
          link="/crypto/fomies"
          type="fomonauts"
          favKey="FOMO-FOMONAUTS-ICO-FAV"
          gridColumns={fomonaudsGridColumns}
          sortHeaders={fomonaudsSortHeader}
          updateSortValue={updateSortValue}
          isLoading={isLoading}
          sortValue={{ name: "", value: 1 }}
          page={page}
          items={items}
        />
        {Number(data?.data?.total) > limit ? (
          <Pagination
            page={page}
            total={Number(data?.data?.total)}
            limit={
              Number(data?.data?.total) < page * limit
                ? data?.data?.total
                : page * limit
            }
            totalPage={Math.ceil(Number(data?.data?.total) / limit)}
            onChange={(value) => {
              setPage(value);
            }}
          />
        ) : null}
        <CommentBlock
          items={comments}
          addComment={confirmAddComment}
          refetch={refetch}
        />
        <RepostsBlock />
      </ProjectsWrapper>
    );
  };

  return (
    <PageWrapper>
      <PageHeader className="crypto-projects-header">
        <FomiesHeaderLeft>
          <button className="tooltip-button">
            <Info size={16} color="#738094" />
            <span
              className="tooltip-text"
              style={{
                width: 320,
              }}
            >
              {t("fomies.tooltip")}
            </span>
          </button>
          <h1>{t("fomies.title")}</h1>
          <LocalAdBadge placement="FOMIES_SPOTLIGHT" placementLabel="Fomies" />
        </FomiesHeaderLeft>
        <FomiesHeaderRight>
          <div className="search-section">
            <SearchInput
              className="crypto-market-search width100"
              type="text"
              placeholder={t("common.placeholders.search")}
              onChange={(value: string) => setSearchValue(value)}
              leftIcon={<SearchIconStyle />}
              value={searchValue}
            />
          </div>
          <FomiesHeaderStats>
            <FomiesHeaderStat>
              <UsersIcon color="#04A584" />
              <div className="stat-info">
                <div className="stat-label">{translateText("Total Fomies")}</div>
                <div className="stat-value">{statsData.totalFomies || 0}</div>
              </div>
            </FomiesHeaderStat>
            <FomiesHeaderStat>
              <VerifiedIcon color="#04A584" />
              <div className="stat-info">
                <div className="stat-label">{translateText("Verified")}</div>
                <div className="stat-value">{statsData.verified || 0}</div>
              </div>
            </FomiesHeaderStat>
            <FomiesHeaderStat>
              <ChartIcon color="#04A584" />
              <div className="stat-info">
                <div className="stat-label">{translateText("Avg XP")}</div>
                <div className="stat-value">{statsData.avgXP || 0}</div>
              </div>
            </FomiesHeaderStat>
            <FomiesHeaderStat>
              <RankIcon color="#04A584" />
              <div className="stat-info">
                <div className="stat-label">{translateText("Top Rank")}</div>
                <div className="stat-value">{statsData.topRank || "-"}</div>
              </div>
            </FomiesHeaderStat>
          </FomiesHeaderStats>
          <FomiesHeaderActions>
            <div className="header-filter">
              <UniversalFilter
                onReset={() => {
                  setFilterData(null);
                }}
                filters={fomonautsFilter}
                onChange={(nextFilterData: any) => {
                  setFilterData(nextFilterData);
                }}
              />
            </div>
          </FomiesHeaderActions>
        </FomiesHeaderRight>
      </PageHeader>

      <FomiesMobileContent>
        <MainInfo>
          <MainInfoDescription>
            <Typography variant="h1">{t("fomies.title")}</Typography>
            <br />
            <div className="description-container">
              <p className={isDescriptionExpanded ? "expanded" : "collapsed"}>
                {t("fomies.tooltip")}
              </p>
              <button
                className="toggle-description-btn"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                {" "}
                {isDescriptionExpanded
                  ? translateText("See Less")
                  : translateText("See more")}
              </button>
            </div>
            <br />
            <SearchContainer>
              <SearchWrapper>
                <SearchInput
                  className="width100"
                  type="text"
                  placeholder={translateText("Search by name or wallet")}
                  onChange={(value: string) => setSearchValue(value)}
                  leftIcon={<SearchIconStyle />}
                  value={searchValue}
                />
              </SearchWrapper>
            </SearchContainer>
          </MainInfoDescription>
        </MainInfo>
        <HeaderWrapper>
          <LeftHeaderWrapper>{renderStats("var(--main-gray)")}</LeftHeaderWrapper>
          <FomiesMobileActions className="fomies-left">
            <UniversalFilter
              onReset={() => {
                setFilterData(null);
              }}
              filters={fomonautsFilter}
              onChange={(nextFilterData: any) => {
                setFilterData(nextFilterData);
              }}
            />
          </FomiesMobileActions>
        </HeaderWrapper>
      </FomiesMobileContent>

      {isLoading || items?.length ? (
        getContent()
      ) : (
        <>
          <br />
          <br />
          <br />
          <EmptyList />
        </>
      )}
    </PageWrapper>
  );
};

export default FomiesLayout;
