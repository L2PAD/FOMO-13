import React from "react";
import Image from "next/image";
import BuyIcon from "../../../../../assets/icons/otc/buy-item.svg";
import SellIcon from "../../../../../assets/icons/otc/sell-item.svg";
import DescriptionComponent from "../../../../global/common/DescriptionComponent";
import InfoIcon from "../../../../global/Icons/InfoIcon";
import ButtonSwitch from "../../../../UI/inputs/button-switch";
import LocalAdBadge from "../../../../global/LocalAdBadge";
import {
  BazzarSwitchWrapper,
  PageDesciptionWrapper,
  PageHeaderWrapper,
  PageHeaderWrapperLeft,
  TitleWrapper,
} from "../styles";
import MarketFilters from "./MarketFilters";
import { MarketFiltersProps } from "../types";
import { useTranslation } from "i18n";

interface DesktopMarketHeaderProps {
  pageVariant: "otc" | "p2p";
  activeTab: string;
  updateActiveTab: (tab: string) => void;
  handleUpdatePageVariant: (variant: "otc" | "p2p") => void;
  isSearch: boolean;
  setIsSearch: (value: boolean) => void;
  isDesktopAdOpen: boolean;
  isDescriptionsVisible: boolean;
  setIsDescriptionsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isBuyVisible: boolean;
  setIsBuyVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isSellVisible: boolean;
  setIsSellVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDesktopAdOpen: (value: boolean) => void;
  marketFiltersProps: MarketFiltersProps;
}

const DesktopMarketHeader: React.FC<DesktopMarketHeaderProps> = ({
  pageVariant,
  activeTab,
  updateActiveTab,
  handleUpdatePageVariant,
  isSearch,
  setIsSearch,
  isDesktopAdOpen,
  isDescriptionsVisible,
  setIsDescriptionsVisible,
  isBuyVisible,
  setIsBuyVisible,
  isSellVisible,
  setIsSellVisible,
  setIsDesktopAdOpen,
  marketFiltersProps,
}) => {
  const { t, translateText } = useTranslation();

  return (
    <PageHeaderWrapper>
      <PageHeaderWrapperLeft>
        <div className="left">
          <button
            onMouseEnter={() => setIsDescriptionsVisible(true)}
            onMouseLeave={() => setIsDescriptionsVisible(false)}
            className="info-button"
          >
            <InfoIcon />
          </button>
          <ButtonSwitch
            className="deal-switch"
            checked={pageVariant === "p2p"}
            onChange={(checked) => handleUpdatePageVariant(checked ? "p2p" : "otc")}
            leftLabel="OTC"
            rightLabel="P2P"
          />
          <TitleWrapper>
            <PageDesciptionWrapper>
              <DescriptionComponent
                isDate={false}
                date={new Date()}
                isVisible={isDescriptionsVisible}
                className="gray-description"
                text={
                  pageVariant === "p2p"
                    ? t("bazaar.p2pTooltip")
                    : t("bazaar.otcTooltip")
                }
              />
            </PageDesciptionWrapper>
          </TitleWrapper>
          <BazzarSwitchWrapper>
            <div className="button-wrapper">
              <button
                className={activeTab === "Buy" ? "active buy" : "buy"}
                onClick={() => updateActiveTab("Buy")}
                onMouseEnter={() => setIsBuyVisible(true)}
                onMouseLeave={() => setIsBuyVisible(false)}
              >
                <Image src={BuyIcon} alt="buy" />
                {translateText("Buy")}
              </button>
              <PageDesciptionWrapper className="switch-description">
                <DescriptionComponent
                  isDate={false}
                  date={new Date()}
                  isVisible={isBuyVisible}
                  className="gray-description"
                  text={t("bazaar.buyTooltip")}
                />
              </PageDesciptionWrapper>
            </div>
            <div className="button-wrapper">
              <button
                onMouseEnter={() => setIsSellVisible(true)}
                onMouseLeave={() => setIsSellVisible(false)}
                className={activeTab === "Sell" ? "active sell" : "sell"}
                onClick={() => updateActiveTab("Sell")}
              >
                <Image src={SellIcon} alt="sell" />
                {translateText("Sell")}
              </button>
              <PageDesciptionWrapper className="switch-description">
                <DescriptionComponent
                  isDate={false}
                  date={new Date()}
                  isVisible={isSellVisible}
                  className="gray-description"
                  text={t("bazaar.sellTooltip")}
                />
              </PageDesciptionWrapper>
            </div>
          </BazzarSwitchWrapper>
        </div>
        <LocalAdBadge placement="OTC_MARKET" placementLabel="OTC / P2P" />
      </PageHeaderWrapperLeft>
      <MarketFilters {...marketFiltersProps} />
    </PageHeaderWrapper>
  );
};

export default DesktopMarketHeader;
