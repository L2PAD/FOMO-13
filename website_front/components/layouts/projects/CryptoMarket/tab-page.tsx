import React, { useContext, useState, useRef, useEffect, FC } from "react";
import { useQuery } from "react-query";
import Image from "next/image";
import {
  accumulationData,
  cryptoMarketDefaultCheckboxKeys,
  cryptoMarketFilter,
  recentlyAddedData,
  recentlyAddedDataMore,
} from "../../../../staticContent/projects/crypto_market";
import Filter from "../../../global/Filter";
import { AssetIcon, GearIcon } from "../../../global/Icons";
import CustomizeTabModal from "../modals/CustomizeTabModal";
import AssetModal from "../modals/AssetModal";
import NewAssetModal from "../modals/NewAssetModal";
import UsersModal from "../modals/UsersModal";
import SemiCircleChart from "../../../global/common/GaugeChart";
import Pagination from "../../../global/Pagintaion";
import RecentlyAdded, { ColumnType } from "./recently_added";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../FomoChat/styles";
import { SearchIconStyle } from "../../../global/Navigation/styles";
import { SearchInput, SearchWrapper } from "../P2PExchange/styles";
import CommentBlock from "../../../global/CommentBlock";
import { Sort } from "../../../global/common/Sort";
import fetchProjects from "../../../../http/projects/fetchProjects";
import getProjectType from "../../../../helpers/getProjectType";
import SearchResults from "../../../global/Navigation/SearchResults";
import useComments from "../../../../hooks/useComments";
import StatisticsCard from "../../../global/common/StatisticsCard";
import { LayoutContext } from "../../../global/Layout";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";
import { simplifyAmount } from "../../../../helpers/simplifyAmount";
import MarketCapChart from "../../../../assets/icons/Chart.svg";
import PercentValue from "../../../global/common/PercentValue";
import TrendingIcon from "../../../../assets/icons/trend-sort.svg";
import NewIcon from "../../../../assets/icons/new-sort.svg";
import AllIcon from "../../../../assets/icons/all-sort.svg";
import UniversalTable, {
  ISortHeaderItem,
} from "../../../global/common/UniversalTable";
import UniversalFilter from "../../../global/UniversalFilter";
import {
  accumulationGridColumns,
  accumulationSortHeaders,
  cryptoMarketGridColumns,
  cryptoMarketSortHeaders,
  gainersSortHeaders,
  recentlyAddedSortHeaders,
  trandingSortHeaders,
  trendingGridColumns,
} from "../../../../staticContent/tables";
import {
  CardsWrapper,
  ChartWrapper,
  HeaderPaginationWrapper,
  MainInfo,
  MainInfoDescription,
  MainInfoStatistics,
  MarketCapCard,
  MarketCapChartWrapper,
  MarketCapHeader,
  MarketCapTitle,
  MarketCapValue,
  PageWrapper,
  SearchContainer,
  StatisticsCardLine,
  TableHeaderLeftWrapper,
  TableHeaderRightWrapper,
  TableHeaderWrapper,
} from "./styles";
import { ICustomTabs } from "../../../../staticContent/tabs";
import { buildFilterSummary } from ".";
import { useTranslation } from "i18n";

const limit: number = 100;
const tabsLimit: number = 20;

const buildQueryString = (
  page: number,
  sortValue: { name: string; value: any } | undefined,
  searchValue: string
): string => {
  const params: any = {
    limit,
    offset: (page - 1) * limit,
    status: "Ended",
  };

  if (searchValue) {
    params.searchValue = searchValue;
  }

  if (sortValue?.name) {
    params.sortKey = sortValue.name;
    params.sortNumberValue = sortValue.value;
  }

  const queryString = new URLSearchParams(params).toString();
  return `?${queryString}`;
};

interface IProps {
  tabType: ColumnType;
}

const TabPage: FC<IProps> = ({ tabType }) => {
  const { translateText } = useTranslation();
  const [customTabs, setCustomTabs] = useState<Array<ICustomTabs>>([]);
  const layoutData = useContext(LayoutContext);
  const [sortValue, setSortValue] = useState<{ name: string; value: 1 | -1 }>();
  const [filterValue, setFilterValue] = useState("all");
  const [page, setPage] = useState(1);
  const [filterData, setFilterData] = useState<any | null>(null);
  const { comments, confirmAddComment } = useComments(
    `comments/market`,
    `comments/market`
  );
  const [queryString, setQueryString] = useState<string>("");
  const { data, isLoading } = useQuery(
    ["market-categories", tabType, page, filterData],
    () =>
      fetchProjects(
        `category/${tabType}`,
        "",
        "",
        `?offset=${(page - 1) * 100}&limit=${limit}${buildFilterSummary(filterData)}`,
        { source: "fomo-v2" }
      ),
    {
      refetchOnWindowFocus: false,
      refetchInterval: 60000,
    }
  );
  const [isSearchModal, setIsSearchModal] = useState(false);
  const [customizeModal, setCustomizeModal] = useState(false);
  const [isAssetModal, setIsAssetModal] = useState(false);
  const [newAsset, setNewAsset] = useState(false);
  const [recentlyModal, setRecentlyModal] = useState(false);
  const [biggestModal, setBiggestModal] = useState(false);
  const [trendingModal, setTrendingModal] = useState(false);
  const [accModal, setAccModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  const updateSortValue = (name: string, value: 1 | -1): void => {
    setSortValue((prev: any) => {
      if (prev?.name === name) return { name, value };

      return { name, value: -1 };
    });
  };

  const getPageDescriptionByType = (): React.ReactNode => {
    const descriptions = {
      recently: (
        <>
          <Typography className="main-title" variant="h1">
            {translateText("Recently Added")}
          </Typography>
          <p>
            {translateText("Discover the newest tokens added to the market, their performance, and key metrics at a glance")}
          </p>
        </>
      ),
      gainers: (
        <>
          <Typography className="main-title" variant="h1">
            {translateText("TOP Gainers (24h)")}
          </Typography>
          <p>
            {translateText("Explore the leading performers in the market over the past 24 hours. Stay updated on the tokens that have shown the most growth and discover potential investment opportunities among the top gainers")}
          </p>
        </>
      ),
      trending: (
        <>
          <Typography className="main-title" variant="h1">
            {translateText("Trending")}
          </Typography>
          <p>
            {translateText("Discover the hottest tokens making waves in the market. Stay informed on the assets gaining traction and explore the latest trends shaping the crypto landscape")}
          </p>
        </>
      ),
      accumulation: (
        <>
          <Typography className="main-title" variant="h1">
            {translateText("Accumulation (24h)")}
          </Typography>
          <p>
            {translateText("Explore tokens actively accumulated over the last 24 hours. Identify trends and analyze assets showing strong market interest")}
          </p>
        </>
      ),
    };

    return descriptions[tabType];
  };

  const getTableHeaders = (): Array<ISortHeaderItem> => {
    const headers = {
      recently: recentlyAddedSortHeaders,
      gainers: gainersSortHeaders,
      trending: trandingSortHeaders,
      accumulation: accumulationSortHeaders,
    };

    return headers[tabType];
  };

  const getTableGridColumns = (): string => {
    const grids = {
      recently: cryptoMarketGridColumns,
      gainers: cryptoMarketGridColumns,
      trending: trendingGridColumns,
      accumulation: accumulationGridColumns,
    };

    return grids[tabType];
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setQueryString(buildQueryString(page, sortValue, searchValue));
    }, 600);

    return () => clearTimeout(timer);
  }, [searchValue, page, sortValue]);

  return (
    <PageWrapper>
      <MainInfo>
        <MainInfoDescription>
          {getPageDescriptionByType()}
          <SearchContainer>
            <SearchWrapper>
              <SearchInput
                className="width100"
                type="text"
                placeholder={translateText("Search for an asset")}
                onFocus={(value: boolean) => setIsSearchModal(value)}
                onChange={(value: string) => setSearchValue(value)}
                leftIcon={<SearchIconStyle />}
                value={searchValue}
              />
            </SearchWrapper>
            <SearchResults
              className="search-wrapper"
              isVisible={isSearchModal}
              isLoading={isLoading}
              persons={[]}
              funds={[]}
              projects={data?.projects || []}
            />
          </SearchContainer>
        </MainInfoDescription>
      </MainInfo>
      <br />
      <TableHeaderWrapper id="scroll-header">
        <TableHeaderRightWrapper>
          <button
            className={filterValue === "all" ? "selectedSort" : ""}
            onClick={() => setFilterValue("all")}
          >
            <Image src={AllIcon} alt="all" />
            {translateText("All")}
          </button>
        </TableHeaderRightWrapper>
        <TableHeaderLeftWrapper>
          <UniversalFilter
            filters={cryptoMarketFilter}
            onChange={(data: any) => setFilterData(data)}
            defaultCheckboxKeys={cryptoMarketDefaultCheckboxKeys}
            singleDefaultCheckbox
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
      </HeaderPaginationWrapper>
      <UniversalTable
        type={tabType}
        sortHeaders={getTableHeaders()}
        link="/crypto/project"
        favKey="FOMO-CRYPTO-MARKET-FAV"
        gridColumns={getTableGridColumns()}
        isFavorite={isFavorite}
        setIsFavorite={setIsFavorite}
        isLoading={isLoading}
        sortValue={sortValue}
        updateSortValue={updateSortValue}
        page={page}
        items={data?.projects || []}
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
      <CommentBlock items={comments} addComment={confirmAddComment} />
      <CustomizeTabModal
        isVisible={customizeModal}
        onClose={() => setCustomizeModal(false)}
        tabs={customTabs}
        onChange={(tabs: Array<ICustomTabs>) => setCustomTabs(tabs)}
      />
      <AssetModal
        isVisible={isAssetModal}
        onClose={() => setIsAssetModal(false)}
        onNew={() => {
          setNewAsset(true);
          setIsAssetModal(false);
        }}
      />
      {newAsset && (
        <NewAssetModal
          onClose={() => {
            setNewAsset(false);
            setIsAssetModal(true);
          }}
        />
      )}
    </PageWrapper>
  );
};

export default TabPage;
