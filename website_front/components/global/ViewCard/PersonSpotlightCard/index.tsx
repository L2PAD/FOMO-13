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

const PersonSpotlightCard: FC<IProject> = ({
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
}) => {
  return (
    <Wrapper className="small">
      <EntityInfo
        img={String(logo)}
        name={name}
        rating={0}
        niche={niche}
        variant={"spotlight"}
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
          {0}
          <OtcLike status="active" />
        </div>
      </StatisticsRow>
      <AddedInfo>
        <div className="row-info">
          <div>Investments:</div>
          <span>$20k</span>
        </div>
        <div className="row-info">
          <div>ATH ROI:</div>
          <span style={{ color: "var(--main-green)" }}>956%</span>
        </div>
        <div className="row-info">
          <div>Top Followers:</div>
          <UsersRow
            users={[
              {
                logo: "/65451.157411882035_60943.47384833696_p_L5tH2y_400x400.jpg",
                name: "",
              },
              {
                logo: "/8487.158489296753_pd5rDfQK_400x400.jpg",
                name: "",
              },
              {
                logo: "/65451.157411882035_60943.47384833696_p_L5tH2y_400x400.jpg",
                name: "",
              },
              {
                logo: "/8487.158489296753_pd5rDfQK_400x400.jpg",
                name: "",
              },
              {
                logo: "/65451.157411882035_60943.47384833696_p_L5tH2y_400x400.jpg",
                name: "",
              },
            ]}
          />
        </div>
      </AddedInfo>
    </Wrapper>
  );
};

export default PersonSpotlightCard;
