import React, { useEffect, useRef, useState } from "react";
import { Tag, ShoppingCart } from "lucide-react";
import styled from "styled-components";
import { useCart } from "../../../../../contexts/CartContext";
import ButtonSwitch from "../../../../UI/inputs/button-switch";
import InfoIcon from "../../../../global/Icons/InfoIcon";
import OtcSearch from "../../../../global/Filter/otc_search";
import CollectionFilter from "../../../../global/Filter/collection_filter";
import Typography from "../../../../global/common/Typography";
import {
  FilterButton,
  SortDropdown,
  SortOption,
} from "../../../../global/Filter/styles";
import DescriptionComponent from "../../../../global/common/DescriptionComponent";
import { Button } from "../../../../global/common/Button";
import { ICollectionMarketFilters } from "../../../../../utils/collectionMarketFilters";
import {
  InfoDescriptionWrapper,
  MarketCurrencyWrapper,
  MarketHeaderActions,
  MarketHeaderControls,
  MarketHeaderInfo,
  MarketHeaderLeft,
  MarketHeaderTitle,
  MarketHeaderTitleGroup,
} from "../styles";

const ResponsiveMarketHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 2px 2px 8px 2px #00053014;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 2px 2px 8px 2px #0005302c;
  }

  .info-button {
    margin-top: 4px;
    display: flex;
  }

  .info-button svg {
    width: 16px;
    height: 16px;
  }

  @media (max-width: 1120px) {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  @media (max-width: 767px) {
    gap: 12px;
    padding: 12px;
  }
`;

const MarketHeaderButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 767px) {
    width: 100%;
    flex-wrap: wrap;

    .market-list-button {
      flex: 1 1 calc(50% - 4px);
      justify-content: center;
      min-width: 0;
    }
  }

  @media (max-width: 480px) {
    .market-list-button {
      flex-basis: 100%;
      width: 100%;
    }
  }
`;

export type MarketSort =
  | "newest"
  | "oldest"
  | "price-asc"
  | "price-desc";

const sortOptions: Array<{ key: MarketSort; name: string }> = [
  { key: "newest", name: "Newest" },
  { key: "oldest", name: "Oldest" },
  { key: "price-asc", name: "Price (Low to High)" },
  { key: "price-desc", name: "Price (High to Low)" },
];

const MarketSortControl = ({
  value,
  onChange,
  className,
}: {
  value: MarketSort;
  onChange: (value: MarketSort) => void;
  className?: string;
}) => {
  const [isActive, setIsActive] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <FilterButton
      className={className}
      newSort
      ref={dropdownRef}
      onClick={() => setIsActive((state) => !state)}
    >
      <div className="sort-trigger">
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.0625 2.46875L9.03125 0.5M9.03125 0.5L11 2.46875M9.03125 0.5L9.03125 11M4.4375 9.03125L2.46875 11M2.46875 11L0.5 9.03125M2.46875 11L2.46875 0.5"
            stroke="#728094"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <Typography variant="p">Sort</Typography>
      </div>
      <SortDropdown isVisible={isActive} className="sort-dropdown market-sort-dropdown">
        {sortOptions.map((item) => (
          <SortOption
            key={item.key}
            className={value === item.key ? "selected" : ""}
            onClick={() => {
              onChange(item.key);
              setIsActive(false);
            }}
          >
            <div className="option-content">
              <span className="option-name">{item.name}</span>
            </div>
            {value === item.key ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M13.3334 4L6.00002 11.3333L2.66669 8"
                  stroke="var(--main-green)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </SortOption>
        ))}
      </SortDropdown>
    </FilterButton>
  );
};

interface NftMarketHeaderProps {
  currency: "ETH" | "USDC";
  setCurrency: (currency: "ETH" | "USDC") => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  isSearch: boolean;
  setIsSearch: (value: boolean) => void;
  filterValue: MarketSort;
  setFilterValue: (value: MarketSort) => void;
  setFilters: (filters: ICollectionMarketFilters) => void;
  onOpenListForSale: () => void;
  onOpenCart: () => void;
}

const NftMarketHeader: React.FC<NftMarketHeaderProps> = ({
  currency,
  setCurrency,
  searchValue,
  setSearchValue,
  isSearch,
  setIsSearch,
  filterValue,
  setFilterValue,
  setFilters,
  onOpenListForSale,
  onOpenCart,
}) => {
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
  const infoRef = useRef<HTMLDivElement | null>(null);
  const { items: cartItems } = useCart();
  const currencyCartCount = cartItems.filter((item) => {
    const itemCurrency = item.currency || (item.isUsdc ? "USDC" : "ETH");

    return itemCurrency === currency;
  }).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setIsDescriptionVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <ResponsiveMarketHeader>
      <MarketHeaderLeft>
        <MarketHeaderTitleGroup>
          <InfoDescriptionWrapper
            ref={infoRef}
            onMouseEnter={() => setIsDescriptionVisible(true)}
            onMouseLeave={() => setIsDescriptionVisible(false)}
          >
            <MarketHeaderInfo>
              <button
                type="button"
                className="info-button"
                onClick={() => setIsDescriptionVisible((state) => !state)}
              >
                <InfoIcon />
              </button>
            </MarketHeaderInfo>
            <DescriptionComponent
              isDate={false}
              date={new Date()}
              isVisible={isDescriptionVisible}
              className="gray-description"
              text={`
                <h2>NFT Market</h2>
                A curated marketplace for token allocation rights represented as NFTs.<br/>
                Access verified funding rounds, evaluate issuer profiles and deal terms, and trade allocations on the secondary market with full transparency.
              `}
            />
          </InfoDescriptionWrapper>
          <MarketHeaderTitle>NFT Market</MarketHeaderTitle>
        </MarketHeaderTitleGroup>
        <MarketCurrencyWrapper>
          <ButtonSwitch
            className="bg-switch"
            checked={currency === "USDC"}
            onChange={(checked) => setCurrency(checked ? "USDC" : "ETH")}
            leftLabel="ETH"
            rightLabel="USDC"
          />
        </MarketCurrencyWrapper>
      </MarketHeaderLeft>
      <MarketHeaderActions>
        <MarketHeaderControls>
          <OtcSearch
            isSearch={isSearch}
            setIsSearch={setIsSearch}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
          />
          <CollectionFilter
            className="market-filter-button"
            onSave={(filtersData) => setFilters(filtersData)}
          />
          <MarketSortControl
            className="market-sort-button"
            value={filterValue}
            onChange={(value) => setFilterValue(value)}
          />
        </MarketHeaderControls>

        <MarketHeaderButtonGroup>
          <Button
            className="market-list-button"
            variant="outlined"
            onClick={onOpenListForSale}
          >
            <Tag
              width={16}
              height={16}
              style={{
                transform: "rotate(90deg)",
              }}
            />
            List for sale
          </Button>
          <Button
            className="market-list-button"
            variant="outlined"
            onClick={onOpenCart}
          >
            <ShoppingCart width={16} height={16} />
            Cart{currencyCartCount > 0 ? ` (${currencyCartCount})` : ""}
          </Button>
        </MarketHeaderButtonGroup>
      </MarketHeaderActions>
    </ResponsiveMarketHeader>
  );
};

export default NftMarketHeader;
