import React, { FC } from "react";
import moment from "moment";
import Region from "../../../../../global/common/Region";
import InfoIcon from "../../../../../global/Icons/InfoIcon";
import DescriptionComponent from "../../../../../global/common/DescriptionComponent";
import sliceAddress from "../../../../../../helpers/sliceAddress";
import { CopyIcon } from "../../../../../global/Icons";
import {
  DescriptionWrapper,
  MainInfoRow,
} from "../../../../gemslab/Profile/styles";
import { HeaderItem } from "../styles";
import { IDescriptionModals } from "../../../../gemslab/Profile";
import { FomiesPersonData } from "./types";
import { useTranslation } from "i18n";

interface Props {
  descriptionModals: IDescriptionModals;
  onCopyWallet: () => void;
  onScopeMouseEnter: () => void;
  onScopeMouseLeave: () => void;
  personData: FomiesPersonData;
  scopeDescription: string;
}

const getDisplayNumber = (value?: number | string | null): string => {
  if (value === null || value === undefined || value === "") return "-";

  const numberValue =
    typeof value === "number" ? value : Number(String(value).replace("%", ""));

  if (!Number.isFinite(numberValue)) return "-";

  return numberValue.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
};

const getDisplayPercent = (value?: number | string | null): string => {
  const formattedValue = getDisplayNumber(value);

  return formattedValue === "-" ? "-" : `${formattedValue}%`;
};

const getSpaceportNftCount = (personData: FomiesPersonData): string => {
  if (!personData.wallet) return "-";
  if (personData.spaceportNftCountStatus !== "ready") return "-";

  return getDisplayNumber(personData.spaceportNftCount);
};

const getRedFlagsCount = (personData: FomiesPersonData): string => {
  const redFlags = (personData as { redFlags?: number | string }).redFlags;

  if (redFlags !== null && redFlags !== undefined && redFlags !== "") {
    return getDisplayNumber(redFlags);
  }

  if (Array.isArray(personData.redFlagsList)) {
    return getDisplayNumber(personData.redFlagsList.length);
  }

  return "-";
};

const getMemberSince = (personData: FomiesPersonData): string => {
  const date = personData.createDate || personData.createdAt;

  return date ? moment(date).format("ll") : "-";
};

const FomiesProfileStats: FC<Props> = ({
  descriptionModals,
  onCopyWallet,
  onScopeMouseEnter,
  onScopeMouseLeave,
  personData,
  scopeDescription,
}) => {
  const { translateText } = useTranslation();
  const wallet = personData.wallet || "";
  const activityScore = personData.activityXP ?? personData.points;
  const predictionAccuracy =
    personData.predictionAccuracyPercent ?? personData.predictionAccuracy;
  const athRoi = personData.athRoi ?? personData.highestRoi ?? personData.averageRoi;

  return (
    <MainInfoRow className="main-info-row">
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
        <span className="value">{personData.specialization || personData.niche || "-"}</span>
      </HeaderItem>
      <HeaderItem className="profile-item">
        <span className="key">{translateText("NFTs Owned")}:</span>
        <span className="value">{getSpaceportNftCount(personData)}</span>
      </HeaderItem>
      <HeaderItem className="profile-item">
        <div className="key">
          {translateText("Activity Score (XP)")}
          <button onMouseEnter={onScopeMouseEnter} onMouseLeave={onScopeMouseLeave}>
            <InfoIcon />
          </button>
        </div>
        <span className="value">{getDisplayNumber(activityScore)}</span>
        <DescriptionWrapper>
          <DescriptionComponent
            className="description-component"
            isVisible={descriptionModals.isScope}
            date={new Date()}
            text={scopeDescription}
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
        <span className="value">{getRedFlagsCount(personData)}</span>
      </HeaderItem>
      <HeaderItem className="profile-item">
        <span className="key">{translateText("ATH ROI")}</span>
        <span className="value">{getDisplayPercent(athRoi)}</span>
      </HeaderItem>
      <HeaderItem className="profile-item">
        <span className="key">{translateText("Member since")}</span>
        <span className="value">{getMemberSince(personData)}</span>
      </HeaderItem>
      <HeaderItem className="profile-item">
        <span className="key">{translateText("Location")}</span>
        <span className="value">
          {personData?.regionData?.id ? (
            <Region>
              {personData?.regionData?.id || ""}, {personData?.regionData?.region}
            </Region>
          ) : (
            "-"
          )}
        </span>
      </HeaderItem>
    </MainInfoRow>
  );
};

export default FomiesProfileStats;
