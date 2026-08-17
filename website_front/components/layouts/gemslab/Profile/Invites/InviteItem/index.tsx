import React, { FC } from "react";
import { IInvite } from "../../../../../../types/global_types";
import { ColValue } from "../../../../../global/Tables/ActionsTable/AssetTable/styles";
import sliceAddress from "../../../../../../helpers/sliceAddress";
import UserAvatar from "../../../../../global/common/UserAvatar";
import imageLoader from "../../../../../../helpers/imageLoader";
import {
  InviteInfoKey,
  InviteBoardName,
  InviteInfo,
  InviteUserName,
  InviteUserWrapper,
  InviteWrapper,
  InviteUserInfo,
  InviteUserBody,
  InviteActionsWrapper,
  InviteInfoBoard,
} from "./styles";
import Button from "../../../../../global/common/Button";
import Image from "next/image";

interface IProps {
  confirmInvite: (inviteId: string, boardId: string) => Promise<void>;
  rejectInvite: (inviteId: string, boardId: string) => Promise<void>;
  item: IInvite;
}

const InviteItem: FC<IProps> = ({ item, confirmInvite, rejectInvite }) => {
  return (
    <InviteWrapper>
      <InviteInfo>
        <InviteBoardName>
          <InviteInfoKey>Board</InviteInfoKey>
          <InviteInfoBoard>
            <img src={imageLoader(item.board.img)} alt={item?.board?.name} />
            <ColValue variant="h4">{item?.board?.name}</ColValue>
          </InviteInfoBoard>
        </InviteBoardName>
        <InviteUserWrapper>
          <InviteInfoKey>Creator</InviteInfoKey>
          <InviteUserBody>
            <img
              src={
                item?.sender.photo
                  ? imageLoader(item?.sender.photo)
                  : item?.sender?.twitterData?.photo
                    ? item?.sender.twitterData.photo
                    : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
              }
              alt={item?.sender?.username || ""}
            />
            <InviteUserInfo>
              <InviteUserName>
                {item?.sender?.username || item?.sender?.twitterData?.username}
              </InviteUserName>
              <span>{sliceAddress(item?.sender?.wallet)}</span>
            </InviteUserInfo>
          </InviteUserBody>
        </InviteUserWrapper>
      </InviteInfo>
      <InviteActionsWrapper>
        <Button
          onClick={() => confirmInvite(item._id || "", item.board._id)}
          variant="primary"
        >
          Accept
        </Button>
        <Button
          onClick={() => rejectInvite(item._id || "", item.board._id)}
          variant="primary"
          className="red-btn"
        >
          Decline
        </Button>
      </InviteActionsWrapper>
    </InviteWrapper>
  );
};

export default InviteItem;
