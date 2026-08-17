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
  item: any;
}

const TopGainerCard: FC<IProps> = ({ item }) => {
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
      <AddedInfo style={{ marginTop: "10px" }}>
        <div className="row-info">
          <div>Portfolio:</div>
          <span>-</span>
        </div>
        <div className="row-info">
          <div>Performance:</div>
          <span>-</span>
        </div>
        <div className="row-info">
          <div>Volume:</div>
          <span>$0</span>
        </div>
        <div className="row-info">
          <div>Amount:</div>
          <span>0</span>
        </div>
      </AddedInfo>
    </Wrapper>
  );
};

export default TopGainerCard;
