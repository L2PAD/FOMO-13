import React from "react";
import Image from "next/image";
import BuyIcon from "../../../../../assets/icons/otc/buy-item.svg";
import SellIcon from "../../../../../assets/icons/otc/sell-item.svg";
import { SearchIcon } from "../../../../global/Icons";
import ButtonSwitch from "../../../../UI/inputs/button-switch";
import LocalAdBadge from "../../../../global/LocalAdBadge";
import {
  MobileActionSwitchWrapper,
  MobileAdWrapper,
  MobileControlsRow,
  MobileHeaderDescription,
  MobileHeaderTitle,
  MobileHeaderTop,
  MobilePageHeaderWrapper,
  MobileSearchRow,
  MobileSearchWrapper,
  MobileSeeMoreButton,
} from "../styles";
import MarketFilters from "./MarketFilters";
import { MarketFiltersProps } from "../types";
import { useTranslation } from "i18n";

interface MobileMarketHeaderProps {
  pageVariant: "otc" | "p2p";
  activeTab: string;
  updateActiveTab: (tab: string) => void;
  handleUpdatePageVariant: (variant: "otc" | "p2p") => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  isSearch: boolean;
  setIsSearch: (value: boolean) => void;
  isMobileAdOpen: boolean;
  setIsMobileAdOpen: (value: boolean) => void;
  isMobileDescriptionExpanded: boolean;
  setIsMobileDescriptionExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  mobileDescription: string;
  mobileSearchInputRef: React.RefObject<HTMLInputElement>;
  handleExpandMobileSearch: () => void;
  handleMobileSearchBlur: () => void;
  marketFiltersProps: MarketFiltersProps;
}

const MobileMarketHeader: React.FC<MobileMarketHeaderProps> = ({
  pageVariant,
  activeTab,
  updateActiveTab,
  handleUpdatePageVariant,
  searchValue,
  setSearchValue,
  isSearch,
  setIsSearch,
  isMobileAdOpen,
  setIsMobileAdOpen,
  isMobileDescriptionExpanded,
  setIsMobileDescriptionExpanded,
  mobileDescription,
  mobileSearchInputRef,
  handleExpandMobileSearch,
  handleMobileSearchBlur,
  marketFiltersProps,
}) => {
  const { translateText } = useTranslation();

  return (
    <MobilePageHeaderWrapper>
      <MobileHeaderTop>
        <MobileHeaderTitle>
          {pageVariant === "p2p"
            ? translateText("P2P Market")
            : translateText("OTC Market")}
        </MobileHeaderTitle>
        <ButtonSwitch
          className="deal-switch"
          checked={pageVariant === "p2p"}
          onChange={(checked) => handleUpdatePageVariant(checked ? "p2p" : "otc")}
          leftLabel="OTC"
          rightLabel="P2P"
        />
      </MobileHeaderTop>
      <div>
        <MobileHeaderDescription expanded={isMobileDescriptionExpanded}>
          {mobileDescription}
        </MobileHeaderDescription>
        <MobileSeeMoreButton
          onClick={() => setIsMobileDescriptionExpanded((prev) => !prev)}
        >
          {isMobileDescriptionExpanded
            ? translateText("See less")
            : translateText("See more")}
        </MobileSeeMoreButton>
      </div>
      <MobileSearchRow adOpen={isMobileAdOpen}>
        <MobileSearchWrapper
          collapsed={isMobileAdOpen}
          onClick={handleExpandMobileSearch}
        >
          <SearchIcon fill="var(--main-gray)" />
          <input
            ref={mobileSearchInputRef}
            placeholder={translateText("Search")}
            value={searchValue}
            onBlur={handleMobileSearchBlur}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              setSearchValue(value);
              setIsSearch(value.trim().length > 0);
            }}
          />
        </MobileSearchWrapper>
        <MobileAdWrapper adOpen={isMobileAdOpen}>
          <LocalAdBadge placement="OTC_MARKET" placementLabel="OTC / P2P" />
        </MobileAdWrapper>
      </MobileSearchRow>
      <MobileActionSwitchWrapper>
        <button
          className={activeTab === "Buy" ? "active buy" : "buy"}
          onClick={() => updateActiveTab("Buy")}
        >
          <Image src={BuyIcon} alt="buy" />
          {translateText("Buy")}
        </button>
        <button
          className={activeTab === "Sell" ? "active sell" : "sell"}
          onClick={() => updateActiveTab("Sell")}
        >
          <Image src={SellIcon} alt="sell" />
          {translateText("Sell")}
        </button>
      </MobileActionSwitchWrapper>
      <MobileControlsRow>
        <MarketFilters {...marketFiltersProps} variant="mobile" />
      </MobileControlsRow>
    </MobilePageHeaderWrapper>
  );
};

export default MobileMarketHeader;
