/* eslint-disable */
import React, { FC } from "react";
import {
  BodyWrapper,
  DescriptionText,
  DescriptionWrapper,
  Footer,
  FooterItem,
  HeaderCircle,
  HeaderInfoWrapper,
  HeaderTagWrapper,
  HeaderWrapper,
  InvestorsText,
  InvestorsWrapper,
  PercentText,
  RedFlagsWrapper,
  RefundWrapper,
  ResultItem,
  ResultWrapper,
  TitleText,
  TitleWrapper,
} from "../styles";
import RedFlag from "../../RedFlag";
import UserAvatar from "../../common/UserAvatar";
import Typography from "../../common/Typography";
import StatusTag from "../../StatusTag";
import UsersRow from "../../UsersRow";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";
import { clarifyDate } from "../../../../helpers/clarifyDate";
import {
  getUnlockEventDate,
  getUnlockPrimaryEvent,
  getUnlockStageLabel,
} from "../../../../helpers/unlockingDisplay";
import { IProject } from "../../../../types/global_types";
import imageLoader from "../../../../helpers/imageLoader";
import EntityInfo from "../../common/EntityInfo";
import {
  AddedInfo,
  StatisticsRow,
  Wrapper,
} from "../../../layouts/projects/Eralash/EralashCard/styles";
import { StarIcon } from "../../Icons";
import OtcLike from "../../Icons/OtcLike";

type UnlockingCardExtraFields = {
  circulationSupplyPercent?: number | string | null;
  totalTokensUnlockedPercent?: number | string | null;
  nextUnlockPercent?: number | string | null;
  publicVestingPercent?: number | string | null;
  detailed?: {
    name?: string | null;
  } | null;
};

export interface DefaultCardInterface {
  userAvatar: string;
  userStatus: "default" | "warn" | "success" | "none";
  userName: string;
  userRating: number;
  variant: "default" | "warn";
  headerTag: string;
  status: "Upcoming" | "Ended" | "Active";
  title: string;
  percentage: number;
  description: string;
  investors: { avatar: string; name: string }[];
  redFlagsCount?: number;
  totalAmount: number;
  lastFunding: string;
  type: string;
  className?: string;
  usd?: number;
  btc?: number;
  eth?: number;
}

const UnlockingCard: FC<IProject> = ({
  logo,
  status,
  name,
  rating,
  banner,
  fullness,
  bio,
  investors,
  redFlags,
  lastFunding,
  niche,
  totalRaised,
  redStatus,
  isRefunded,
  redFlagsList,
  type,
  ...item
}) => {
  const unlockItem = item as typeof item & UnlockingCardExtraFields;
  const primaryUnlockEvent = getUnlockPrimaryEvent(unlockItem);
  const nextUnlockDate = getUnlockEventDate(unlockItem);
  const stage = getUnlockStageLabel(unlockItem);
  const supplyPercent = Number(
    unlockItem?.circulationSupplyPercent ||
      unlockItem?.totalTokensUnlockedPercent ||
      primaryUnlockEvent?.tokensPercent ||
      0
  );
  const circulatingSupply = Number(
    unlockItem?.circulatingSupply ||
      primaryUnlockEvent?.raw?.circulatingSupply ||
      primaryUnlockEvent?.raw?.circulating_supply ||
      0
  );
  const nextUnlockPercent = Number(
    unlockItem?.nextUnlockPercent || unlockItem?.publicVestingPercent || primaryUnlockEvent?.tokensPercent || 0
  );

  return (
    <Wrapper className="small">
      <EntityInfo
        img={String(logo || unlockItem?.image || primaryUnlockEvent?.logo || "")}
        name={name || unlockItem?.detailed?.name || primaryUnlockEvent?.name || ""}
        rating={0}
        niche={niche}
        variant={"spotlight"}
      />
      <AddedInfo>
        <div className="row-info">
          <div>Token Supply:</div>
          <span>
            {supplyPercent.toFixed(2)}% (+{clarifyAmount(circulatingSupply, true)})
          </span>
        </div>
        <div className="row-info">
          <div>Next Unlock:</div>
          <span>{nextUnlockDate ? clarifyDate(nextUnlockDate) : "-"}</span>
        </div>
        <div className="row-info">
          <div>Stage:</div>
          <span style={{ color: "var(--main-green)" }}>{stage}</span>
        </div>
        <div className="row-info">
          <div>Vesting:</div>
          <span>{nextUnlockPercent ? `Next ${nextUnlockPercent.toFixed(2)}%` : "-"}</span>
        </div>
      </AddedInfo>
    </Wrapper>
  );
};

export default UnlockingCard;
