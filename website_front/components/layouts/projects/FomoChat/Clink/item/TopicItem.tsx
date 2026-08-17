import React, { FC, useContext } from "react";
import { AuthContext } from "../../../../../global/Layout";
import imageLoader from "../../../../../../helpers/imageLoader";
import sliceAddress from "../../../../../../helpers/sliceAddress";
import { IMessage } from "../../../../../../types/global_types";
import {
  FingerDownIcon,
  FingerTopIcon,
  LikeIcon,
  StarIcon,
} from "../../../../../global/Icons";
import {
  DateText,
  HeaderWrapper,
  Title,
} from "../../../../../global/common/Comment/styles";
import { Item } from "../styles";
import UserAvatar from "../../../../../global/common/UserAvatar";
import moment from "moment";
import PinIcon from "../../../../../global/Icons/PinIcon";
import RedFlag from "../../../../../global/RedFlag";

interface IProps {
  item: IMessage;
}

const MessageItem: FC<IProps> = ({ item }) => {
  return (
    <Item tabIndex={0} className="">
      <div className="header">
        <HeaderWrapper>
          <UserAvatar
            size="small"
            variant="default"
            avatar={
              item?.sender?.avatar || item?.sender?.photo
                ? imageLoader(item?.sender.avatar || item?.sender.photo || "")
                : item.sender?.twitterData.photo
            }
            name={item.sender?.username || ""}
          />
          <div>
            <div className="flex">
              <Title variant="p"> {item.sender?.username || ""} </Title>
              <DateText variant="p">
                {sliceAddress(item.sender?.wallet || "0xf5gd....75h0")}
              </DateText>
            </div>
            <DateText variant="p">
              {moment(String(item.date)).format("DD.MM.YYYY HH:mm")}
            </DateText>
          </div>
          <PinIcon className="pin1" fill="#fff" />
        </HeaderWrapper>
        <div className="items">
          {item.title ? (
            <div className="item">
              <p>Title:</p>
              <b>{item.title}</b>
            </div>
          ) : (
            <></>
          )}
          <div className="item">
            <p>Rating:</p>
            <div className="icons">
              <div className="icon-item">
                <RedFlag />
                <b>{item.sender?.redFlags || 0}</b>
              </div>
              <div className="icon-item">
                <StarIcon fill="#FFC702" className="left" />
                <b>{item.sender?.rating || 0}/100</b>
              </div>
            </div>
          </div>
          <div className="item">
            <p>Followers:</p>
            <b>{item.sender?.followers || 0}</b>
          </div>
        </div>
      </div>
      <p>{item.message}</p>
    </Item>
  );
};

export default MessageItem;
