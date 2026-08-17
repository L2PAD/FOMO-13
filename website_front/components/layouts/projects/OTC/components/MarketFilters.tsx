import React from "react";
import DealsBalanceComponent from "../../../../global/DealsBalanceComponent";
import OtcFilter from "../../../../global/Filter/otc_filter";
import OtcSearch from "../../../../global/Filter/otc_search";
import OtcSort from "../../../../global/Filter/otc_sort";
import P2PSettings from "../../../../global/Filter/p2p_settings";
import { Button } from "../../../../global/common/Button";
import { FilterWrapper } from "../styles";
import { MarketFiltersProps } from "../types";

const OtcFilters: React.FC<
  Omit<
    MarketFiltersProps,
    | "filterValue"
    | "setFilterValue"
    | "p2pFilterTabs"
    | "selectedPaymentMethod"
    | "setSelectedPaymentMethod"
    | "selectedCurrency"
    | "setSelectedCurrency"
    | "transactionAmount"
    | "setTransactionAmount"
  >
> = ({
  isSearch,
  setIsSearch,
  searchValue,
  setSearchValue,
  activeTab,
  availableFilterTabs,
  sortBy,
  setSortBy,
  sortKey,
  filters,
  setFilters,
  setModal,
  variant = "desktop",
}) => {
  if (variant === "mobile") {
    return (
      <>
        <div className="mobile-control-actions">
          <DealsBalanceComponent />
          <Button
            className="create-deal create-deal-mobile"
            variant={"outlined"}
            onClick={() => setModal(true)}
          >
            + Create Deal
          </Button>
        </div>
        <div className="mobile-control mobile-sort">
          <div>
            <OtcSort
              className="mobile-icon-button"
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortKey={sortKey}
              tabs={availableFilterTabs}
            />
          </div>
        </div>
        <div className="mobile-control mobile-filter">
          <div>
            <OtcFilter
              className="mobile-icon-button"
              variant={activeTab === "Top members" ? "small" : "big"}
              filterDataInitial={filters}
              onSave={(filtersData: any) => setFilters(filtersData)}
              onReset={() => setFilters(null)}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <FilterWrapper>
      <div className="right">
        <OtcSearch
          isSearch={isSearch}
          setIsSearch={setIsSearch}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
        <OtcSort
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortKey={sortKey}
          tabs={availableFilterTabs}
        />
        <OtcFilter
          variant={activeTab === "Top members" ? "small" : "big"}
          filterDataInitial={filters}
          onSave={(filtersData: any) => setFilters(filtersData)}
          onReset={() => setFilters(null)}
        />
        <DealsBalanceComponent />
        <Button
          className="create-deal"
          variant={"outlined"}
          onClick={() => setModal(true)}
        >
          + Create Deal
        </Button>
      </div>
    </FilterWrapper>
  );
};

const P2PFilters: React.FC<Omit<MarketFiltersProps, "availableFilterTabs">> = ({
  isSearch,
  searchValue,
  filterValue,
  p2pFilterTabs,
  sortByP2P,
  transactionAmount,
  selectedPaymentMethod,
  selectedCurrency,
  setIsSearch,
  setSearchValue,
  setSortByP2P,
  setModal,
  setSelectedPaymentMethod,
  setSelectedCurrency,
  setFilterValue,
  setTransactionAmount,
  variant = "desktop",
}) => {
  if (variant === "mobile") {
    return (
      <>
        <div className="mobile-control-actions">
          <DealsBalanceComponent />
          <Button
            className="create-deal create-deal-mobile"
            variant={"outlined"}
            onClick={() => setModal(true)}
          >
            + Create Deal
          </Button>
        </div>
        <div className="mobile-control mobile-settings">
          <div>
            <P2PSettings
              transactionAmount={transactionAmount}
              setTransactionAmount={setTransactionAmount}
              selectedPaymentMethod={selectedPaymentMethod}
              setSelectedPaymentMethod={setSelectedPaymentMethod}
              selectedCurrency={selectedCurrency}
              p2pFilterTabs={p2pFilterTabs}
              filterValue={filterValue}
              sortBy={sortByP2P}
              setSortByP2p={setSortByP2P}
              setSelectedCurrency={setSelectedCurrency}
              setFilterValue={setFilterValue}
              buttonClassName="mobile-icon-button"
              dropdownClassName="mobile-settings-dropdown"
              wrapperClassName="mobile-settings-wrapper"
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <FilterWrapper>
      <div className="right">
        <OtcSearch
          isSearch={isSearch}
          setIsSearch={setIsSearch}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
        <P2PSettings
          transactionAmount={transactionAmount}
          setTransactionAmount={setTransactionAmount}
          selectedPaymentMethod={selectedPaymentMethod}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
          selectedCurrency={selectedCurrency}
          p2pFilterTabs={p2pFilterTabs}
          filterValue={filterValue}
          sortBy={sortByP2P}
          setSortByP2p={setSortByP2P}
          setSelectedCurrency={setSelectedCurrency}
          setFilterValue={setFilterValue}
        />
        <DealsBalanceComponent />
        <Button
          className="create-deal"
          variant={"outlined"}
          onClick={() => setModal(true)}
        >
          + Create Deal
        </Button>
      </div>
    </FilterWrapper>
  );
};

const MarketFilters: React.FC<MarketFiltersProps> = (props) => {
  if (props.pageVariant === "otc") {
    return <OtcFilters {...props} />;
  }

  return <P2PFilters {...props} />;
};

export default MarketFilters;
