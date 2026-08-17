import React from "react";
import DealsList, { DealSortTypes } from "../DealsList";
import { SortP2PType } from "../../../../global/Filter/p2p_settings";

interface DealsTabsContentProps {
  activeTab: string;
  transactionAmount: string;
  p2pFilterTabs: string[];
  filterValue: string;
  selectedCurrency: string;
  selectedPaymentMethod: string[];
  sortByP2P: SortP2PType;
  searchValue: string;
  pageVariant: "otc" | "p2p";
  sortByDeals: DealSortTypes;
  filters: any;
  modal: boolean;
  setModal: (value: boolean) => void;
  limit: number;
  setLimit: (value: number) => void;
}

const DealsTabsContent: React.FC<DealsTabsContentProps> = ({
  activeTab,
  transactionAmount,
  p2pFilterTabs,
  filterValue,
  selectedCurrency,
  selectedPaymentMethod,
  sortByP2P,
  searchValue,
  pageVariant,
  sortByDeals,
  filters,
  modal,
  setModal,
  limit,
  setLimit,
}) => {
  const dealType = activeTab === "Sell" ? "sell" : "buy";

  return (
    <DealsList
      settingsP2P={{
        transactionAmount,
        p2pFilterTabs,
        filterValue,
        selectedCurrency,
        selectedPaymentMethod,
        sortBy: sortByP2P,
      }}
      searchValue={searchValue}
      pageVariant={pageVariant}
      sortBy={sortByDeals}
      filters={filters}
      isCreateDeal={modal}
      setIsCreateDeal={(value: boolean) => setModal(value)}
      limit={limit}
      setLimit={(value: number) => setLimit(value)}
      activeTab={activeTab}
      type={dealType}
      isP2p={pageVariant === "p2p"}
    />
  );
};

export default DealsTabsContent;
