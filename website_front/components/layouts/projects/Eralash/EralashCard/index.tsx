import React, { FC } from "react";
import EntityInfo from "../../../../global/common/EntityInfo";
import { IProject, IPerson } from "../../../../../types/global_types";
import { AddedInfo, StatisticsRow, Wrapper } from "./styles";
import RedFlag from "../../../../global/RedFlag";
import RatingIcon from "../../../../global/Icons/RatingIcon";
import { LikeIcon, StarIcon } from "../../../../global/Icons";
import OtcLike from "../../../../global/Icons/OtcLike";
import { useTranslation } from "i18n";

interface IProps {
  item: IProject | IPerson;
}

const EralashCard: FC<IProps> = ({ item }) => {
  const { translateText } = useTranslation();
  const eralashAdded = (item as any)?.eralashAdded;
  const addedDate = eralashAdded
    ? new Date(eralashAdded).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "-";

  return (
    <Wrapper>
      <EntityInfo
        img={String(item?.logo)}
        name={item.name}
        rating={Number(item.rating || 0)}
        niche={item.niche}
        variant="error"
      />
      <StatisticsRow>
        <div className="statistics-item">
          {item.redFlagsList?.length || 0}
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
        <div>{translateText("Added to Eralash")}:</div>
        <span>{addedDate}</span>
      </AddedInfo>
    </Wrapper>
  );
};

export default EralashCard;
