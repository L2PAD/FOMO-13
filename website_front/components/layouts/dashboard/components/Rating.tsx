/* eslint-disable */
import React, { useState } from "react";
import {
  DefaultCard,
  DropdownWrapper,
  FlexContainer,
  RatingBlock,
  UserBlock,
} from "../styles";
import { ArrowDownIcon, LikeIcon, ShareIcon } from "../../../global/Icons";
import RatingIcon from "../../../global/Icons/RatingIcon";
import UserAvatar from "../../../global/common/UserAvatar";
import Typography from "../../../global/common/Typography";

interface Data {
  userAvatar: string;
  userName: string;
  userRating: number;
  userStatus: string;
  name: string;
  price: string;
  topData: {
    value: string;
    valueVariant: string;
    fill: number;
    fillVariant: string;
  };
  bottomData: {
    value: string;
    valueVariant: string;
    fill: number;
    fillVariant: string;
  };
}

interface Props {
  header: string;
  data: Data[];
}

const options = ["24H", "7D", "1M", "3M", "1Y", "All Time"];

export const Rating = ({ header, data }: Props) => {
  const [isTop, setIsTop] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [active, setActive] = useState("All Time");

  return (
    <DefaultCard variant="default">
      <div className="header">
        <div>
          <ShareIcon />
          <b>{header}</b>
        </div>
        <div>
          <RatingIcon
            fill={isTop ? "#FF5858" : "#04A584"}
            onClick={() => setIsTop((prevTop) => !prevTop)}
          />
          <LikeIcon fill="#000" />
          <DropdownWrapper active={activeDropdown}>
            <div>
              <div
                className="button"
                onClick={() => setActiveDropdown((state) => !state)}
              >
                <ArrowDownIcon /> {active}
              </div>
              {activeDropdown && (
                <ul>
                  {options.map((option) => (
                    <li
                      onClick={() => setActive(option)}
                      className={active === option ? "active" : ""}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </DropdownWrapper>
        </div>
      </div>
      <br />
      <FlexContainer>
        {data.map((collection) => {
          const data = isTop ? collection.topData : collection.bottomData;
          return (
            <UserBlock>
              <RatingBlock>
                <p className={data.valueVariant}>{data.value}</p>
                <div className={`fill-container ${data.fillVariant}`}>
                  <div
                    className="fill"
                    style={{ height: `${140 * data.fill}px` }}
                  />
                  <div className="center" />
                </div>
              </RatingBlock>
              <UserAvatar
                size="medium"
                variant="success"
                avatar={collection.userAvatar}
                name={collection.userName}
                rating={collection.userRating}
              />
              <Typography variant="h3">{collection.name}</Typography>
              <b>{collection.price}</b>
            </UserBlock>
          );
        })}
      </FlexContainer>
    </DefaultCard>
  );
};
