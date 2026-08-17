/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useQuery } from "react-query";
import { useRouter } from "next/router";
import Image from "next/image";
import useComments from "../../../../hooks/useComments";
import Pagination from "../../../global/Pagintaion";
import CommentBlock from "../../../global/CommentBlock";
import Typography from "../../../global/common/Typography";
import { SearchWrapper } from "./FundsBio/styles";
import TrendingIcon from "../../../../assets/icons/trend-sort.svg";
import NewIcon from "../../../../assets/icons/new-sort.svg";
import AllIcon from "../../../../assets/icons/all-sort.svg";
import SortCashIcon from "../../../../assets/icons/sort-cash.svg";
import SmartIcon from "../../../../assets/icons/smart-sort.svg";
import NewsBlock from "../../../global/NewsBlock";
import { SearchIconStyle, SearchInput } from "../P2PExchange/styles";
import UniversalTable from "../../../global/common/UniversalTable";
import {
  fundsGridColumns,
  fundsSortHeader,
} from "../../../../staticContent/tables";
import BarDoubleChart from "../../../global/common/BarDoubleChart";
import LineDoubleChart from "../../../global/common/LineDoubleChart";
import GlobalMap from "../../../global/GlobalMap";
import UniversalFilter from "../../../global/UniversalFilter";
import { fundsFilter } from "../../../../staticContent/projects/crypto_market";
import FomoSpotlight from "./FomoSpotlight";
import fetchFundsByQuery from "../../../../http/funds/fetchFundsByQuery";
import {
  HeaderPaginationWrapper,
  MainInfo,
  MainInfoDescription,
  PageWrapper,
  SearchContainer,
  TableHeaderLeftWrapper,
  TableHeaderRightWrapper,
  TableHeaderWrapper,
} from "../CryptoMarket/styles";
import {
  ChartsWrapper,
  HeaderCharts,
  MapWrapper,
  NewsTitle,
  NewsWrapepr,
} from "./styles";
import fetchChartData from "../../../../http/analytics/fetchChartData";
import fetchItems from "../../../../http/fetchItems";
import SearchResults from "../../../global/Navigation/SearchResults";

function generateQueryString(filters: Record<string, any>): string {
  const queryParams: string[] = [];

  for (const key in filters) {
    if (Array.isArray(filters[key])) {
      const activeItems = filters[key]
        .filter((item: any) =>
          typeof item === "object" ? item.isActive : true
        )
        .map((item: any) => (typeof item === "object" ? item.key : item));

      if (activeItems.length > 0) {
        queryParams.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(
            activeItems.join(",")
          )}`
        );
      }
    }
    if(key === 'name' && filters[key]) queryParams.push(`name=${filters[key]}`)
  }

  return queryParams.join("&");
}

const Funds = () => {
  const limit = 100;
  const router = useRouter();
  const { comments, confirmAddComment, refetch } = useComments(
    "comments/crypto",
    "comments/crypto"
  );
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isSearchModal, setIsSearchModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] =
    useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [sortValue, setSortValue] = useState<{ name: string; value: 1 | -1 }>({
    name: "",
    value: 1,
  });
  const [filterValue, setFilterValue] = useState("All");
  const [isFavorite, setIsFavorite] = useState(false);
  const [filterOptions, setFilterOptions] = useState<any>();
  const { data, isLoading } = useQuery(["funds", filterOptions, page], () =>
    fetchFundsByQuery(
      `?${generateQueryString(filterOptions)}&page=${page}&limit=${limit}`
    ),
    {
      refetchOnWindowFocus: false
    }
  );

  const updateSortValue = (name: string, value: 1 | -1): void => {
    setSortValue((prev: any) => {
      if (prev?.name === name) return { name, value };

      return { name, value: -1 };
    });
  };

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterOptions((prev: any) => {
        return ({
          ...prev,
          name: searchValue
        })
      })
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  return (
    <PageWrapper>
      <MainInfo>
        <MainInfoDescription>
          <Typography className="main-title" variant="h1">
            Funds
          </Typography>
          <br />
          <div className="description-container">
            <p className={isDescriptionExpanded ? "expanded" : "collapsed"}>
              Dive into detailed profiles of crypto investment funds — including
              their portfolio size, industry focus, supported projects, funding
              history, and regional activity. Track where capital flows and
              discover which funds are backing the next wave of innovation.{" "}
            </p>
            <button
              className="toggle-description-btn"
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            >
              {" "}
              {isDescriptionExpanded ? "See Less" : "See more"}
            </button>
          </div>
          <SearchContainer>
            <SearchWrapper>
              <SearchInput
                value={searchValue}
                onChange={(value) => setSearchValue(value)}
                onFocus={(value: boolean) => setIsSearchModal(value)}
                placeholder="Search fund"
                type="text"
                leftIcon={<SearchIconStyle />}
              />
            </SearchWrapper>
            <SearchResults
              className="search-wrapper"
              isVisible={isSearchModal}
              isLoading={isLoading}
              persons={[]}
              funds={data?.funds || []}
              projects={[]}
            />
          </SearchContainer>
        </MainInfoDescription>
        <FomoSpotlight />
      </MainInfo>
      <ChartsWrapper>
        <NewsTitle>Analytics</NewsTitle>
        <HeaderCharts>
          <BarDoubleChart
            title="Investment Allocation by Industry"
          />
          <LineDoubleChart
            title="Funding Dynamics"
          />
        </HeaderCharts>
      </ChartsWrapper>
      <TableHeaderWrapper id="scroll-header" className="row">
        <TableHeaderRightWrapper>
          <button
            className={filterValue === "all" ? "selectedSort" : ""}
            onClick={() => setFilterValue("all")}
          >
            <Image src={AllIcon} alt="all" />
            All
          </button>
          <button
            className={filterValue === "trending" ? "selectedSort" : ""}
            onClick={() => setFilterValue("trending")}
          >
            <Image src={TrendingIcon} alt="trending sort" />
            Trending
          </button>
          <button
            className={filterValue === "new" ? "selectedSort" : ""}
            onClick={() => setFilterValue("new")}
          >
            <Image src={NewIcon} alt="new sort" />
            New (7d)
          </button>

          <button
            className={filterValue === "industry" ? "selectedSort" : ""}
            onClick={() => setFilterValue("industry")}
          >
            <Image src={SmartIcon} alt="new sort" />
            Industry (NFT, AI, DeFi...)
          </button>
          <button
            className={filterValue === "roi" ? "selectedSort" : ""}
            onClick={() => setFilterValue("roi")}
          >
            <Image src={SortCashIcon} alt="new sort" />
            ROI
          </button>
        </TableHeaderRightWrapper>
        <TableHeaderLeftWrapper>
          <UniversalFilter
            filters={fundsFilter}
            onChange={(data: any) => setFilterOptions(data)}
            onReset={() => {
              setFilterOptions({})
            }}
          />
        </TableHeaderLeftWrapper>
      </TableHeaderWrapper>
      <HeaderPaginationWrapper>
        {Number(data?.total) > limit && !isFavorite ? (
          <Pagination
            page={page}
            total={Number(data?.total)}
            limit={
              Number(data?.total) < page * limit ? data?.total : page * limit
            }
            totalPage={Math.ceil(Number(data?.total) / limit)}
            onChange={(value) => {
              setPage(value);
            }}
          />
        ) : (
          <></>
        )}
        <UniversalTable
          type="funds"
          sortHeaders={fundsSortHeader}
          link="/crypto/funds"
          favKey={"FOMO-CRYPTO-MARKET-FAV"}
          gridColumns={fundsGridColumns}
          isFavorite={isFavorite}
          setIsFavorite={setIsFavorite}
          isLoading={isLoading}
          sortValue={sortValue}
          updateSortValue={updateSortValue}
          page={page}
          items={data?.funds || []}
        />
        {Number(data?.total) > limit && !isFavorite ? (
          <Pagination
            page={page}
            total={Number(data?.total)}
            limit={
              Number(data?.total) < page * limit ? data?.total : page * limit
            }
            totalPage={Math.ceil(Number(data?.total) / limit)}
            onChange={(value) => {
              setPage(value);
              document.querySelector("#scroll-header")?.scrollIntoView();
            }}
          />
        ) : (
          <></>
        )}
      </HeaderPaginationWrapper>
      <MapWrapper>
        <NewsTitle>Global Investment Map</NewsTitle>
        <GlobalMap />
      </MapWrapper>
      <NewsWrapepr>
        <NewsTitle>Live News</NewsTitle>
        <NewsBlock page="funds" />
      </NewsWrapepr>
      <CommentBlock
        items={comments}
        addComment={confirmAddComment}
        refetch={refetch}
      />
    </PageWrapper>
  );
};

export default Funds;
