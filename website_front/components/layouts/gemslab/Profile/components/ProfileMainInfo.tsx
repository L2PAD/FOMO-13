import React from "react";
import moment from "moment";
import Placeholder from "../../../../global/common/Placeholder";
import Region from "../../../../global/common/Region";
import InfoIcon from "../../../../global/Icons/InfoIcon";
import DescriptionComponent from "../../../../global/common/DescriptionComponent";
import { CopyIcon } from "../../../../global/Icons";
import sliceAddress from "../../../../../helpers/sliceAddress";
import { HeaderItem } from "../../../projects/Persons/Person/styles";
import { DescriptionWrapper, MainInfoRow } from "../styles";
import { DescriptionModalKey, IDescriptionModals } from "../types";
import { useTranslation } from "i18n";
import { getPortfolioDisplaySymbol } from "../../Portfolio/helpers/portfolio";

interface Props {
  descriptionModals: IDescriptionModals;
  onCopyWallet: () => void;
  onDescriptionModalChange: (
    key: DescriptionModalKey,
    isVisible: boolean
  ) => void;
  userData: any;
}

const getScopeDescription = (
  points: number,
  translateText: (text: string) => string
): string => {
  if (points < 400) {
    return `
      <div>
        ${translateText("Current Rank")}: <span class="bold">${translateText("Explorer")}</span>
        <p>${translateText("You're starting your journey on FOMO. Interact, explore, and grow experience!")}</p>
        ${translateText("Next level")}: <span class="bold">${translateText("Builder")} (400 XP)</span>
      </div>
    `;
  }

  if (points < 800) {
    return `
      <div>
        ${translateText("Current Rank")}: <span class="bold">${translateText("Builder")}</span>
        <p>${translateText("You're becoming an active member of the community. Stay engaged to reach the Pro level!")}</p>
        ${translateText("Next level")}: <span class="bold">Pro (800 XP)</span>
      </div>
    `;
  }

  return `
    <div>
      ${translateText("Current Rank")}: <span class="bold">Pro</span>
      <p>${translateText("You've reached the highest rank! A respected and recognized member of the platform.")}</p>
      ${translateText("Next level")}: <span class="bold">${translateText("Max level achieved!")}</span>
    </div>
  `;
};

const getDisplayNumber = (value?: number | string | null): string => {
  if (value === null || value === undefined || value === "") return "-";

  const numberValue =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[%,$\s]/g, ""));

  if (!Number.isFinite(numberValue)) return "-";

  return numberValue.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
};

const getDisplayCurrency = (value?: number | string | null): string => {
  const formattedValue = getDisplayNumber(value);

  return formattedValue === "-" ? "-" : `$${formattedValue}`;
};

const getDisplayPercent = (value?: number | string | null): string => {
  const formattedValue = getDisplayNumber(value);

  return formattedValue === "-" ? "-" : `${formattedValue}%`;
};

const getSignedValueClassName = (value?: number | string | null): string => {
  const numberValue =
    typeof value === "number"
      ? value
      : Number(String(value ?? "").replace(/[%,$\s]/g, ""));

  if (!Number.isFinite(numberValue) || numberValue === 0) {
    return "value main-black";
  }

  return numberValue > 0 ? "value main-green" : "value main-red";
};

const getSpaceportNftCount = (userData: any): string => {
  if (!userData?.wallet) return "-";
  if (userData?.spaceportNftCountStatus !== "ready") return "-";

  return getDisplayNumber(userData?.spaceportNftCount);
};

const getRedFlagsCount = (userData: any): string => {
  const redFlags = userData?.redFlagsCount ?? userData?.redFlags;

  if (redFlags !== null && redFlags !== undefined && redFlags !== "") {
    return getDisplayNumber(redFlags);
  }

  if (Array.isArray(userData?.redFlagsList)) {
    return getDisplayNumber(userData.redFlagsList.length);
  }

  return "-";
};

const getPortfolioMainInfo = (userData: any) =>
  userData?.portfolioMainInfo || userData?.portfolioSnapshot || {};

const getTopFundedProject = (userData: any): string => {
  const portfolioMainInfo = getPortfolioMainInfo(userData);
  const value =
    portfolioMainInfo?.topFundedProject ??
    userData?.topFundedProject ??
    userData?.topFundedProjects;

  if (Array.isArray(value)) {
    const firstItem = value[0];

    if (!firstItem) return "-";
    if (typeof firstItem === "string") return firstItem || "-";

    const symbol = getPortfolioDisplaySymbol(firstItem);

    return (
      symbol ||
      firstItem.name ||
      firstItem.title ||
      firstItem.projectName ||
      "-"
    );
  }

  if (value && typeof value === "object") {
    return (
      getPortfolioDisplaySymbol(value) ||
      value.name ||
      value.title ||
      value.projectName ||
      "-"
    );
  }

  if (value === null || value === undefined || value === "") return "-";

  return String(value);
};

const getMemberSince = (userData: any): string => {
  const date = userData?.createDate || userData?.createdAt;

  return date ? moment(date).format("ll") : "-";
};

const ProfileMainInfo = ({
  descriptionModals,
  onCopyWallet,
  onDescriptionModalChange,
  userData,
}: Props) => {
  const { translateText } = useTranslation();

  if (!userData?.email) {
    const placeholderWidths = [
      ["48%", "82%"],
      ["54%", "68%"],
      ["46%", "34%"],
      ["62%", "78%"],
      ["40%", "26%"],
      ["58%", "30%"],
      ["56%", "28%"],
      ["52%", "24%"],
      ["50%", "32%"],
      ["42%", "26%"],
      ["44%", "38%"],
      ["46%", "64%"],
    ];

    return (
      <MainInfoRow aria-busy="true">
        {placeholderWidths.map(([labelWidth, valueWidth], index) => (
          <HeaderItem
            key={`profile-main-placeholder-${index}`}
            className="profile-item"
            style={{ pointerEvents: "none" }}
          >
            <Placeholder
              width={labelWidth}
              height="16px"
              borderRadius="8px"
              marginBottom="0"
            />
            <Placeholder
              width={valueWidth}
              height="18px"
              borderRadius="8px"
              marginBottom="0"
            />
          </HeaderItem>
        ))}
      </MainInfoRow>
    );
  }

  const getDescriptionHandlers = (key: DescriptionModalKey) => ({
    onMouseEnter: () => onDescriptionModalChange(key, true),
    onMouseLeave: () => onDescriptionModalChange(key, false),
  });
  const wallet = userData?.wallet || "";
  const activityScore = userData?.activityXP ?? userData?.points;
  const scopePoints = Number.isFinite(Number(activityScore))
    ? Number(activityScore)
    : 0;
  const predictionAccuracy =
    userData?.predictionAccuracyPercent ?? userData?.predictionAccuracy;
  const portfolioMainInfo = getPortfolioMainInfo(userData);
  const totalInvested =
    portfolioMainInfo?.totalInvestedUsd ?? userData?.totalInvested;
  const athRoi =
    portfolioMainInfo?.athRoiPercent ??
    userData?.athRoi ??
    userData?.highestRoi ??
    userData?.averageRoi;

  return (
    <MainInfoRow>
      <HeaderItem className="profile-item">
        <span className="key">{translateText("Wallet")}</span>
        <div className="value action-value">
          {wallet ? (
            <button onClick={onCopyWallet}>
              <CopyIcon />
            </button>
          ) : null}
          {wallet ? sliceAddress(wallet) : "-"}
        </div>
      </HeaderItem>
      <HeaderItem className="profile-item">
        <span className="key">{translateText("Specialization")}</span>
        <span className="value">{userData.specialization || "-"}</span>
      </HeaderItem>
      <HeaderItem className="profile-item">
        <span className="key">{translateText("Total Invested")}</span>
        <span className="value">{getDisplayCurrency(totalInvested)}</span>
      </HeaderItem>
      <HeaderItem className="profile-item">
        <span className="key">{translateText("Top Funded Project")}</span>
        <span className="value">{getTopFundedProject(userData)}</span>
      </HeaderItem>
      <HeaderItem className="profile-item">
        <span className="key">{translateText("NFTs Owned")}:</span>
        <span className="value">{getSpaceportNftCount(userData)}</span>
      </HeaderItem>
      <HeaderItem className="profile-item">
        <div className="key">
          {translateText("Activity Score (XP)")}
          <button {...getDescriptionHandlers("isScope")}>
            <InfoIcon />
          </button>
        </div>
        <span className="value">{getDisplayNumber(activityScore)}</span>
        <DescriptionWrapper>
          <DescriptionComponent
            className="description-component"
            isVisible={descriptionModals.isScope}
            date={new Date()}
            text={getScopeDescription(scopePoints, translateText)}
            isDate={false}
          />
        </DescriptionWrapper>
      </HeaderItem>
      <HeaderItem className="profile-item">
        <div className="key">
          {translateText("Referrals (Lvl 1)")}
          <button {...getDescriptionHandlers("isLvlOne")}>
            <InfoIcon />
          </button>
        </div>
        <span className="value">{userData?.refLvlOne?.length || 0}</span>

        <DescriptionWrapper style={{ bottom: "-80px" }}>
          <DescriptionComponent
            className="description-component"
            isVisible={descriptionModals.isLvlOne}
            date={new Date()}
            text={`
              <p>
              ${translateText("Users who joined the platform directly via your referral link.")}
              </p>       
              ${translateText("+10 XP for each Level 1 referral.")}
            `}
            isDate={false}
          />
        </DescriptionWrapper>
      </HeaderItem>
      <HeaderItem className="profile-item">
        <div className="key">
          {translateText("Referrals (Lvl 2)")}
          <button {...getDescriptionHandlers("isLvlTwo")}>
            <InfoIcon />
          </button>
        </div>
        <span className="value">{userData?.refLvlTwo?.length || 0}</span>
        <DescriptionWrapper style={{ bottom: "-60px", left: "-160px" }}>
          <DescriptionComponent
            className="description-component"
            isVisible={descriptionModals.isLvlTwo}
            date={new Date()}
            text={`
              <p>
             ${translateText("Users invited by your direct referrals.")}
              </p>       
              ${translateText("+5 XP for each Level 2 referral.")}
            `}
            isDate={false}
          />
        </DescriptionWrapper>
      </HeaderItem>
      <HeaderItem className="profile-item">
        <div className="key">{translateText("Prediction Accuracy")}:</div>
        <span className="value">{getDisplayPercent(predictionAccuracy)}</span>
      </HeaderItem>
      <HeaderItem className="profile-item">
        <div className="key">{translateText("Red Flags")}</div>
        <span className="value">{getRedFlagsCount(userData)}</span>
      </HeaderItem>
      <HeaderItem className="profile-item">
        <span className="key">{translateText("ATH ROI")}</span>
        <span className={getSignedValueClassName(athRoi)}>
          {getDisplayPercent(athRoi)}
        </span>
      </HeaderItem>
      <HeaderItem className="profile-item">
        <span className="key">{translateText("Member since")}</span>
        <span className="value">{getMemberSince(userData)}</span>
      </HeaderItem>
      <HeaderItem className="profile-item">
        <span className="key">{translateText("Location")}</span>
        <span className="value">
          {userData?.regionData?.id ? (
            <Region>
              {userData?.regionData?.id || ""}, {userData?.regionData?.region}
            </Region>
          ) : (
            "-"
          )}
        </span>
      </HeaderItem>
    </MainInfoRow>
  );
};

export default ProfileMainInfo;
