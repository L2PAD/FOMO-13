import React from "react";
import ButtonSwitch from "../../../UI/inputs/button-switch";
import { HeaderWrapper } from "./styles";
import { useTranslation } from "i18n";

export type BoxShopHeaderView = "shop" | "boxes";

interface BoxShopHeaderProps {
  userBoxesCount: number;
  maxBoxes: number;
  subtitle?: string;
  isLoading?: boolean;
  activeView: BoxShopHeaderView;
  onViewChange: (view: BoxShopHeaderView) => void;
}

const BoxShopHeader: React.FC<BoxShopHeaderProps> = ({
  userBoxesCount,
  maxBoxes,
  subtitle,
  isLoading = false,
  activeView,
  onViewChange,
}) => {
  const { t } = useTranslation();

  return (
    <HeaderWrapper>
      <div className="left-section">
        <div className="icon-title">
          <svg
            width="30"
            height="30"
            viewBox="0 0 30 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.00025 17.6193L3 11.0346C2.99994 9.37769 4.34309 8.03448 5.99998 8.03447L24.0002 8.03434C25.6571 8.03433 27.0002 9.37747 27.0002 11.0343V17.6193M3.00025 17.6193H27.0002M3.00025 17.6193L3 24.5342C2.99994 26.1911 4.3431 27.5343 6 27.5343H24.0002C25.6571 27.5343 27.0002 26.1912 27.0002 24.5343V17.6193M15.2184 27.5343V8.03431M13.7055 7.40283C13.9301 7.3936 14.1378 7.27549 14.2495 7.08206C14.3612 6.88863 14.3595 6.64967 14.2553 6.45058C13.857 5.72469 12.4594 3.31111 11.5473 2.78452C10.411 2.12845 8.95135 2.51555 8.29853 3.64627C7.64575 4.77691 8.04019 6.23456 9.17662 6.89068C10.1036 7.42589 12.8777 7.42082 13.7055 7.40283ZM15.7935 6.45037C15.6892 6.64953 15.6876 6.88843 15.7993 7.08186C15.911 7.27529 16.1187 7.39333 16.3433 7.40262C17.1711 7.4206 19.9601 7.41707 20.8722 6.89047C22.0085 6.23441 22.4031 4.77679 21.7502 3.64607C21.0975 2.51543 19.6379 2.1282 18.5015 2.78431C17.5745 3.31952 16.1918 5.72451 15.7935 6.45037Z"
              stroke="#05A584"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2>{t("spaceport.boxShop.title")}</h2>
        </div>
        <span className="subtitle">
          {subtitle ||
            t("spaceport.boxShop.subtitleFallback")}
        </span>
      </div>
      <div className="right-section">
        <div className="header-switch">
          <ButtonSwitch
            className="bg-switch"
            checked={activeView === "boxes"}
            onChange={(checked) => onViewChange(checked ? "boxes" : "shop")}
            leftLabel={t("spaceport.tabs.boxShop")}
            rightLabel={t("spaceport.boxShop.myBoxes")}
          />
        </div>
        <span className="counter">
          {t("spaceport.boxShop.yourBoxesCounter")}
          <div className="result">
            {isLoading ? "-- / --" : `${userBoxesCount} / ${maxBoxes}`}
          </div>
        </span>
      </div>
    </HeaderWrapper>
  );
};

export default BoxShopHeader;
