import React, { FC } from "react";
import UserAvatar from "../common/UserAvatar";
import { IParcingTwitterAcc } from "../../../types/global_types";
import getFollowersCount from "../../../helpers/getFollowersCount";
import {
  AvatarWrapper,
  CardWrapper,
  Description,
  DetailsLink,
  Followers,
  HeaderWrapper,
  UserDescription,
  UserName,
} from "./styles";

interface IProps {
  item: IParcingTwitterAcc;
}

const ActionTwitterItem: FC<IProps> = ({ item }) => {
  return (
    <CardWrapper variant="default">
      <HeaderWrapper>
        <AvatarWrapper>
          <UserAvatar
            avatar={item.avatar}
            name={item.name}
            size="medium"
            variant="default"
          />
        </AvatarWrapper>
        <div>
          <Followers variant="p">
            Followers: <span>{getFollowersCount(item.followersCount)}</span>
          </Followers>
          <UserName variant="p">@{item.username}</UserName>
          <UserDescription variant="p">{item.description}</UserDescription>
        </div>
      </HeaderWrapper>
      <Description variant="p">
        Just subscribed to the following Twitter:
        <br />
        <span>@{item.username}</span>
      </Description>
      <DetailsLink href="#">
        Details
        <span>{">"}</span>
      </DetailsLink>
    </CardWrapper>
  );
};

export default ActionTwitterItem;
