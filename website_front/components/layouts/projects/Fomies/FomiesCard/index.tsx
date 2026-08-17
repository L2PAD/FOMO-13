import React, { FC } from "react";
import EntityInfo from "../../../../global/common/EntityInfo";
import {
  IProject,
  IPerson,
  IFomonautTableData,
} from "../../../../../types/global_types";
import { AddedInfo, StatisticsRow, Wrapper } from "./styles";
import RedFlag from "../../../../global/RedFlag";
import RatingIcon from "../../../../global/Icons/RatingIcon";
import { LikeIcon, StarIcon } from "../../../../global/Icons";
import OtcLike from "../../../../global/Icons/OtcLike";
import imageLoader from "../../../../../helpers/imageLoader";

interface IProps {
  item: IFomonautTableData;
}

const FomiesCard: FC<IProps> = ({ item }) => {
  return (
    <Wrapper>
      <EntityInfo
        img={
          item?.photo
            ? item.photo
            : item?.twitterData?.photo || item?.discordData?.photo
        }
        name={item?.name || item?.twitterData?.name || "-"}
        username={
          item?.username ||
          item?.twitterData?.username ||
          item?.discordData?.username
        }
        rating={Number(item.rating || 0)}
        variant="success"
      />
      <StatisticsRow>
        <div className="statistics-item">
          {item?.redFlags || 0}
          <RedFlag />
        </div>
        <div className="statistics-item">
          {item.rating || 0}
          <StarIcon fill="#FFC702" />
        </div>
        <div className="statistics-item">
          {item?.likes?.length || 0}
          <OtcLike status="active" />
        </div>
      </StatisticsRow>
      <AddedInfo>
        <div className="rank">{item?.rank || "Stellar Awakening"}</div>
        <div className="row-info">
          <div>XP</div>
          <span>{item.activityXP || 0}</span>
        </div>
        <div className="row-info">
          <div>Followers</div>
          <span>0</span>
        </div>
      </AddedInfo>
    </Wrapper>
  );
};

export default FomiesCard;
