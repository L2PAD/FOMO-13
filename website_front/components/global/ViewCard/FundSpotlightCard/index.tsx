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
import { IFund, IProject } from "../../../../types/global_types";
import imageLoader from "../../../../helpers/imageLoader";
import EntityInfo from "../../common/EntityInfo";
import {
  AddedInfo,
  StatisticsRow,
  Wrapper,
} from "../../../layouts/projects/Eralash/EralashCard/styles";
import { StarIcon } from "../../Icons";
import OtcLike from "../../Icons/OtcLike";

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

const FundSpotlightCard: FC<IFund> = ({
  logo,
  status,
  name,
  rating,
  banner,
  fullness,
  bio,
  investors,
  lastFunding,
  niche,
  totalRaised,
  redStatus,
  redFlagsList,
  type,
  isSponsored,
  regionData,
  portfolioCoins,
  likes
}) => {

  return (
    <Wrapper className="small">
      <EntityInfo
        img={String(logo)}
        name={name}
        rating={Number(rating)}
        niche={niche}
        variant={"spotlight"}
        isSponsored={isSponsored}
      />
      <StatisticsRow>
        <div className="statistics-item">
          {redFlagsList?.length || 0}
          <RedFlag />
        </div>
        <div className="statistics-item">
          {rating || 0}
          <StarIcon fill="#FFC702" />
        </div>
        <div className="statistics-item">
          {likes?.length || 0}
          <OtcLike status="active" />
        </div>
      </StatisticsRow>
      <AddedInfo>
        <div className="row-info">
          <div>Investments:</div>
          <span>-</span>
        </div>
        <div className="row-info">
          <div>Funded in:</div>
          {
            portfolioCoins?.length
              ?
              <UsersRow
                users={portfolioCoins.slice(0,5).map((item) => {
                  return ({
                    name:item.symbol,
                    logo:item.image
                  })
                 })}
              />
              :
              <></>
          }

        </div>
        <div className="row-info">
          <div>Region:</div>
          <span>{regionData?.region}</span>
        </div>
      </AddedInfo>
    </Wrapper>
  );
};

export default FundSpotlightCard;
