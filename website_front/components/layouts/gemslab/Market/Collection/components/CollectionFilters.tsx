import React from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import CollectionFilter from "../../../../../global/Filter/collection_filter";
import ButtonSwitch from "../../../../../UI/inputs/button-switch";
import { AddFavAction } from "../../../News/Parsing/styles";
import { TableHeaderRightWrapper } from "../../../../projects/CryptoMarket/styles";
import { FilterWrapper, SwitchWrapper } from "../../styles";
import AllIcon from "../../../../../../assets/icons/all-sort.svg";
import TrendingIcon from "../../../../../../assets/icons/trend-sort.svg";
import NewIcon from "../../../../../../assets/icons/new.svg";
import { ICollectionMarketFilters } from "../../../../../../utils/collectionMarketFilters";

interface CollectionFiltersProps {
  tabs: string[];
  filterValue: string;
  currency: "ETH" | "USDC";
  onFilterChange: (value: string) => void;
  onCurrencyChange: (currency: "ETH" | "USDC") => void;
  onMakeOffer: () => void;
  onFiltersSave: (filters: ICollectionMarketFilters) => void;
}

export const CollectionFilters: React.FC<CollectionFiltersProps> = ({
  tabs,
  filterValue,
  currency,
  onFilterChange,
  onCurrencyChange,
  onMakeOffer,
  onFiltersSave,
}) => (
  <FilterWrapper>
    <ButtonSwitch
      className="bg-switch"
      checked={currency === "USDC"}
      onChange={(checked) => onCurrencyChange(checked ? "USDC" : "ETH")}
      leftLabel="ETH"
      rightLabel="USDC"
    />
    <CollectionFilter onSave={onFiltersSave} />
  </FilterWrapper>
);
