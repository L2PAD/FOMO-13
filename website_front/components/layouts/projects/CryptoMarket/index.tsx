import React from "react";
import Image from "next/image";
import { Info } from "lucide-react";
import {
  cryptoMarketDefaultCheckboxKeys,
  cryptoMarketFilter,
} from "../../../../staticContent/projects/crypto_market";
import {
  cryptoMarketGridColumns,
  cryptoMarketSortHeaders,
} from "../../../../staticContent/tables";
import { AssetIcon } from "../../../global/Icons";
import TabHub from "../../../global/Icons/TabHub";
import SearchResults from "../../../global/Navigation/SearchResults";
import { SearchIconStyle } from "../../../global/Navigation/styles";
import Pagination from "../../../global/Pagintaion";
import PageHeader from "../../../global/PageHeader";
import CategoriesTabs from "./CategoriesTabs";
import CommentBlock from "../../../global/CommentBlock";
import CreateOwnAsset from "../modals/CreateOwnAsset";
import NFTAccessLabel from "../../../global/common/NFTAccessLabel";
import Placeholder from "../../../global/common/Placeholder";
import Typography from "../../../global/common/Typography";
import UniversalTable from "../../../global/common/UniversalTable";
import UniversalFilter from "../../../global/UniversalFilter";
import Switch from "../../../UI/inputs/switch";
import AllIcon from "../../../../assets/icons/all-sort.svg";
import CryptoLatest from "./CryptoLatestActionsTabs";
import { ICryptoTab } from "./createTabContext";
import CryptoStatisticsCards from "./StatisticsCards";
import MobileHighlightsTabs from "./MobileHighlightsTabs";
import { SearchInput, SearchWrapper } from "../P2PExchange/styles";
import TabHubContext from "./tabHub";
import useCryptoMarketPage, {
  buildFilterSummary,
  buildQueryString,
} from "./useCryptoMarketPage";
import {
  DesktopTabs,
  HeaderPaginationWrapper,
  HeaderTitleWrapper,
  MainInfo,
  MainInfoDescription,
  MainSections,
  PageWrapper,
  SearchContainer,
  TableHeaderLeftWrapper,
  TableHeaderRightWrapper,
  TableHeaderWrapperCrypto,
  TabsBody,
  TabsInfoRow,
} from "./styles";
import imageLoader from "../../../../helpers/imageLoader";
import { useTranslation } from "i18n";
import LocalAdBadge from "../../../global/LocalAdBadge";

export { buildFilterSummary, buildQueryString };

const CryptoMarketPageLayout = () => {
  const { t, translateText } = useTranslation();
  const {
    activitiesQuery,
    comments,
    confirmAddComment,
    filterValue,
    handleHighlightsChange,
    homeTabs,
    isFavorite,
    isHighlights,
    isLoading,
    isSearchModal,
    limit,
    newAsset,
    page,
    projects,
    refetch,
    router,
    searchValue,
    setFilterData,
    setFilterValue,
    setIsFavorite,
    setIsSearchModal,
    setNewAsset,
    setPage,
    setSearchValue,
    setTabHub,
    sortValue,
    tabHub,
    tabsData,
    total,
    updateSortValue,
    userTabs,
  } = useCryptoMarketPage();
  const marketHomeTabs = homeTabs.data?.tabs || [];

  return (
    <PageWrapper>

      <PageHeader className="crypto-market-header">
        <div className="title-wrapper">
          <button className="tooltip-button">
            <Info size={16} color="#738094" />
            <span
              className="tooltip-text "
              style={{
                width: 320,
              }}
            >
              {t("market.tooltip")}
            </span>
          </button>
          <h1>{t("market.title")}</h1>
          <LocalAdBadge placement="CRYPTO_PROMOTED" placementLabel="Crypto" />
        </div>
        <div className="header-right">
          <div className="search-section">
            <SearchInput
              className="crypto-market-search"
              type="text"
              placeholder={translateText("Search for an asset")}
              onFocus={(value: boolean) => setIsSearchModal(value)}
              onChange={(value: string) => setSearchValue(value)}
              leftIcon={<SearchIconStyle />}
              value={searchValue}
            />
            <SearchResults
              className="search-wrapper"
              isVisible={isSearchModal}
              isLoading={isLoading}
              persons={[]}
              funds={[]}
              projects={projects}
            />
          </div>
          <Switch
            checked={isHighlights}
            onChange={handleHighlightsChange}
            rightLabel={translateText("Highlights")}
            leftLabel=""
          />
          <NFTAccessLabel />
        </div>
      </PageHeader>

      <MainInfo className="crypto-market">
        <MainInfoDescription>
          <HeaderTitleWrapper>
            <Typography className="main-title" variant="h1">
              {t("market.title")}
            </Typography>
            <Switch
              checked={isHighlights}
              onChange={handleHighlightsChange}
              rightLabel={translateText("Highlights")}
              leftLabel=""
            />
          </HeaderTitleWrapper>
          <span className="main-subtitle">{translateText("Stay Updated, Stay Informed")}</span>
          <div className="description-container">
            <p>
              {t("market.tooltip")}
            </p>
          </div>
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
              projects={projects}
            />
          </SearchContainer>
        </MainInfoDescription>
      </MainInfo>

      <DesktopTabs>
        <MainSections>
          <CryptoStatisticsCards
            tabsData={tabsData.data}
            isLoading={tabsData.isLoading}
            activitiesData={activitiesQuery.data}
            activitiesLoading={activitiesQuery.isLoading}
          />
        </MainSections>
        {isHighlights ? (
          <TabsBody>
            {tabsData.isLoading ? (
              <TabsInfoRow grid="8.2fr 4fr">
                <Placeholder width="100%" height="100%" />
                <Placeholder width="100%" height="100%" />
              </TabsInfoRow>
            ) : (
              <TabsInfoRow grid="8.2fr 4fr">
                <CryptoLatest
                  isLoading={false}
                  projects={tabsData.data?.hotProjects || []}
                  activitiesData={activitiesQuery.data}
                  activitiesLoading={activitiesQuery.isLoading}
                />
                <CategoriesTabs data={tabsData.data} />
              </TabsInfoRow>
            )}
          </TabsBody>
        ) : (
          <br />
        )}

      </DesktopTabs>

      <MobileHighlightsTabs
        isLoading={tabsData.isLoading}
        tabsData={tabsData.data}
        activitiesData={activitiesQuery.data}
        activitiesLoading={activitiesQuery.isLoading}
        isHighlights={isHighlights}
      />

      <TableHeaderWrapperCrypto id="scroll-header">
        <TableHeaderRightWrapper className="crypto">
          <button
            className={filterValue === "Full Market" ? "selectedSort" : ""}
            onClick={() => setFilterValue("Full Market")}
          >
            <Image className="sort-icon" src={AllIcon} alt="all" />
            {translateText("Full Market")}
          </button>
          {marketHomeTabs.map((item: ICryptoTab) => {
            const tabValue = item.key || item.name;
            const tabImage = String(
              (item as any)?.image || (item as any)?.logo || ""
            ).trim();

            return (
              <button
                key={item._id}
                className={filterValue === tabValue ? "selectedSort" : ""}
                onClick={() => {
                  setFilterValue(tabValue);
                  router.push(`/crypto/${item.key || item.name}?id=${item._id}`);
                }}
              >
                {tabImage ? (
                  <img
                    className="user-tab-logo"
                    src={imageLoader(tabImage)}
                    alt={item.name}
                  />
                ) : null}
                {item.name}
              </button>
            );
          })}
          {userTabs.data?.tabs.map((item: ICryptoTab) => {
            const tabImage = String((item as any)?.image || (item as any)?.logo || "").trim();

            return (
              <button
                key={item._id}
                className={filterValue === item.name ? "selectedSort" : ""}
                onClick={() => router.push(`/crypto/${item.name}?id=${item._id}`)}
              >
                {tabImage ? (
                  <img
                    className="user-tab-logo"
                    src={imageLoader(tabImage)}
                    alt={item.name}
                  />
                ) : null}
                {item.name}
              </button>
            );
          })}
        </TableHeaderRightWrapper>
        <TableHeaderLeftWrapper>
          <UniversalFilter
            filters={cryptoMarketFilter}
            onChange={(filterData: any) => setFilterData(filterData)}
            onReset={() => setFilterData(null)}
            defaultCheckboxKeys={cryptoMarketDefaultCheckboxKeys}
            singleDefaultCheckbox
          />
          <button onClick={() => setTabHub(true)}>
            <TabHub />
            {translateText("Tab Hub")}
          </button>
          <button onClick={() => setNewAsset(true)}>
            <AssetIcon />
            {translateText("Add Asset")}
          </button>
        </TableHeaderLeftWrapper>
      </TableHeaderWrapperCrypto>

      <HeaderPaginationWrapper>
        {total > limit && !isFavorite ? (
          <Pagination
            page={page}
            total={total}
            limit={total < page * limit ? total : page * limit}
            totalPage={Math.ceil(total / limit)}
            onChange={(value) => {
              setPage(value);
            }}
          />
        ) : (
          <></>
        )}
      </HeaderPaginationWrapper>

      <UniversalTable
        type="crypto"
        sortHeaders={cryptoMarketSortHeaders}
        link="/crypto/project"
        favKey="FOMO-CRYPTO-MARKET-FAV"
        gridColumns={cryptoMarketGridColumns}
        isFavorite={isFavorite}
        setIsFavorite={setIsFavorite}
        isLoading={isLoading}
        sortValue={sortValue}
        updateSortValue={updateSortValue}
        page={page}
        items={projects}
      />
      {total > limit && !isFavorite ? (
        <Pagination
          page={page}
          total={total}
          limit={total < page * limit ? total : page * limit}
          totalPage={Math.ceil(total / limit)}
          onChange={(value) => {
            setPage(value);
            document.querySelector("#scroll-header")?.scrollIntoView();
          }}
        />
      ) : (
        <></>
      )}
      <CommentBlock
        items={comments}
        addComment={confirmAddComment}
        refetch={refetch}
      />
      <TabHubContext isMainModal={tabHub} setIsMainModal={setTabHub} />
      <CreateOwnAsset isVisible={newAsset} onClose={() => setNewAsset(false)} />
    </PageWrapper>
  );
};

export default CryptoMarketPageLayout;
