import React, { useContext, useState, useRef, useEffect, useMemo, FC } from "react";
import { useQuery } from "react-query";
import Image from "next/image";
import { Info } from "lucide-react";
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
import PageHeader from "../../../global/PageHeader";
import { Sort } from "../../../global/common/Sort";
import fetchProjects from "../../../../http/projects/fetchProjects";
import getProjectType from "../../../../helpers/getProjectType";
import SearchResults from "../../../global/Navigation/SearchResults";
import useComments from "../../../../hooks/useComments";
import StatisticsCard from "../../../global/common/StatisticsCard";
import { LayoutContext } from "../../../global/Layout";
import Placeholder from "../../../global/common/Placeholder";
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
  HeaderTitleWrapper,
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
import {
  getCustomTabDisplayLabel,
  gridTemplateColumnsMap,
  ICustomTabs,
} from "../../../../staticContent/tabs";
import fetchTabById from "../../../../http/tabhub/fetchTabById";
import { buildQueryString } from ".";
import { buildFilterSummary } from "./useCryptoMarketPage";
import { useTranslation } from "i18n";

const limit: number = 100;
const tabsLimit: number = 20;

export const createCryptoMarketSortHeaders = (
  tabs: Array<any>
): Array<ISortHeaderItem> => {
  return [
    { label: "№", type: "div" },
    { label: "Asset" },
    ...tabs.map((tab) => ({
      label: getCustomTabDisplayLabel(tab),
    })),
  ];
};

export const createCryptoMarketGridColumns = (tabs: Array<string>): string => {
  const baseColumns = "0.35fr 0.3fr 1.45fr";
  const dynamicColumns = tabs
    .map((tabKey) => gridTemplateColumnsMap[tabKey] || "1.2fr")
    .join(" ");

  return `${baseColumns} ${dynamicColumns}`;
};

interface IProps {
  id: string;
  tabType: string;
}

const CustomTabPage: FC<IProps> = ({ id, tabType }) => {
  const { translateText } = useTranslation();
  const [customTabs, setCustomTabs] = useState<Array<ICustomTabs>>([]);
  const layoutData = useContext(LayoutContext);
  const [sortValue, setSortValue] = useState<{ name: string; value: 1 | -1 }>();
  const [filterValue, setFilterValue] = useState("all");
  const [filterData, setFilterData] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const { comments, confirmAddComment } = useComments(
    `comments/market`,
    `comments/market`
  );
  const [queryString, setQueryString] = useState<string>("");
  const { data, isLoading, isFetching } = useQuery(
    ["crypto", id, queryString],
    () => fetchTabById(`${id}${queryString}`),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true,
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
  const isTabDataLoading = (isLoading || isFetching) && !data?.tabData;
  const customTabColumns = data?.tabData?.tabs || [];
  const includedFavoriteItems = useMemo(() => {
    return (data?.projects || []).filter((project: any) => project.isIncludedAsset);
  }, [data?.projects]);

  const updateSortValue = (name: string, value: 1 | -1): void => {
    setSortValue((prev: any) => {
      if (prev?.name === name) return { name, value };

      return { name, value: -1 };
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setQueryString(
        `${buildQueryString(page, sortValue, searchValue)}${buildFilterSummary(
          filterData
        )}`
      );
    }, 600);

    return () => clearTimeout(timer);
  }, [searchValue, page, sortValue, filterData]);

  return (
    <PageWrapper>
      <PageHeader className="crypto-market-header custom-tab-header">
        <div className="title-wrapper">
          {isTabDataLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Placeholder
                width="16px"
                height="16px"
                borderRadius="50%"
                marginBottom="0"
              />
              <Placeholder
                width="188px"
                height="34px"
                borderRadius="8px"
                marginBottom="0"
              />
            </div>
          ) : (
            <button className="tooltip-button">
              <Info size={16} color="#738094" />
              <span
                className="tooltip-text "
                style={{
                  width: 320,
                }}
              >
                {data?.tabData?.description || ""}
              </span>
            </button>
          )}
          {!isTabDataLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1>{data?.tabData?.name || ""}</h1>
            </div>
          ) : null}
        </div>
        <div className="header-right">
          <div className="search-section">
            <SearchInput
              className="crypto-market-search"
              type="text"
              placeholder={translateText("Search for an asset")}
              onChange={(value: string) => setSearchValue(value)}
              leftIcon={<SearchIconStyle />}
              value={searchValue}
            />
          </div>
          <UniversalFilter
            filters={cryptoMarketFilter}
            onChange={(data: any) => setFilterData(data)}
            onReset={() => setFilterData(null)}
            defaultCheckboxKeys={cryptoMarketDefaultCheckboxKeys}
            singleDefaultCheckbox
          />
        </div>
      </PageHeader>

      <MainInfo className="crypto-market">
        <MainInfoDescription>
          <HeaderTitleWrapper>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {isTabDataLoading ? (
                <Placeholder
                  width="220px"
                  height="38px"
                  borderRadius="8px"
                  marginBottom="0"
                />
              ) : (
                <Typography className="main-title" variant="h1">
                  {data?.tabData?.name || ""}
                </Typography>
              )}
            </div>
          </HeaderTitleWrapper>
          {data?.tabData?.description ? (
            <p>{data.tabData.description}</p>
          ) : (
            <></>
          )}
          <SearchContainer>
            <SearchWrapper>
              <SearchInput
                className="width100"
                type="text"
                placeholder={translateText("Search for an asset")}
                onChange={(value: string) => setSearchValue(value)}
                leftIcon={<SearchIconStyle />}
                value={searchValue}
              />
            </SearchWrapper>
          </SearchContainer>
          <TableHeaderLeftWrapper>
            <UniversalFilter
              filters={cryptoMarketFilter}
              onChange={(data: any) => setFilterData(data)}
              onReset={() => setFilterData(null)}
              defaultCheckboxKeys={cryptoMarketDefaultCheckboxKeys}
              singleDefaultCheckbox
            />
          </TableHeaderLeftWrapper>
        </MainInfoDescription>
      </MainInfo>
      <br />
      <div id="scroll-header" />
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
        type="custom"
        sortHeaders={createCryptoMarketSortHeaders(customTabColumns)}
        gridColumns={createCryptoMarketGridColumns(
          customTabColumns.map((column) => column.key)
        )}
        link="/crypto/project"
        favKey="FOMO-CRYPTO-MARKET-FAV"
        isFavorite={isFavorite}
        setIsFavorite={setIsFavorite}
        isLoading={isLoading || isFetching}
        sortValue={sortValue}
        updateSortValue={updateSortValue}
        page={page}
        items={data?.projects || []}
        customColumns={customTabColumns}
        forcedFavorites={includedFavoriteItems}
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

export default CustomTabPage;
