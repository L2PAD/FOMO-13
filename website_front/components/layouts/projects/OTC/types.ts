import React from "react";
import { SortP2PType } from "../../../global/Filter/p2p_settings";
import { DealSortTypes } from "./DealsList";
import { TopMembersSortBy } from "./TopMembers";

export interface MarketFiltersProps {
  isSearch: boolean;
  searchValue: string;
  pageVariant: "otc" | "p2p";
  activeTab: string;
  filterValue: string;
  availableFilterTabs: Array<{ key: string; name: string }>;
  p2pFilterTabs: string[];
  sortBy: { deals: DealSortTypes; members: TopMembersSortBy };
  sortKey: "deals" | "members";
  filters: any;
  selectedPaymentMethod: string[];
  selectedCurrency: string;
  transactionAmount: string;
  sortByP2P: SortP2PType;
  setSortByP2P: (value: SortP2PType) => void;
  setIsSearch: (value: boolean) => void;
  setSearchValue: (value: string) => void;
  setFilterValue: (value: string) => void;
  setSortBy: React.Dispatch<
    React.SetStateAction<{ deals: DealSortTypes; members: TopMembersSortBy }>
  >;
  setFilters: (filters: any) => void;
  setModal: (value: boolean) => void;
  setSelectedCurrency: (value: string) => void;
  setSelectedPaymentMethod: (value: string[]) => void;
  setTransactionAmount: (value: string) => void;
  variant?: "desktop" | "mobile";
}
