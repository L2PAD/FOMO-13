import React, { FC, useState } from "react";
import moment from "moment";
import UserAvatar from "../UserAvatar";
import Modal from "../Modal";
import {
  ModalAction,
  ModalActionsWrapper,
  ModalCancelButton,
  ModalContent,
  ModalTitle,
} from "../Comment/styles";
import { ceilNumber } from "../../../../helpers/ceilNumber";
import {
  CommentText,
  CommentWrapper,
  DateText,
  DealName,
  GrayLine,
  HeaderWrapper,
  ReactionButton,
  ReactionsWrapper,
  Title,
} from "./styles";

export interface DealInterface {
  userAvatar: string;
  userName: string;
  date: string;
  comment: string;
  flags?: number;
  toTop?: number;
  name: string;
  className?: string;
  onFlag?: () => void;
  onTop?: () => void;
}

const Deal: FC<DealInterface> = ({
  userAvatar,
  userName,
  date,
  comment,
  flags,
  toTop,
  className,
  name,
  onFlag,
  onTop,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CommentWrapper className={className}>
        <HeaderWrapper>
          <UserAvatar
            size="small"
            variant="default"
            avatar={userAvatar}
            name={userName}
          />
          <div>
            <Title variant="p">{userName}</Title>
            <DateText variant="p">
              {moment(date).format("DD.MM.YYYY HH:mm")}
            </DateText>
          </div>
        </HeaderWrapper>
        <DealName>
          Deal: <span>{name}</span>
        </DealName>
        <CommentText variant="p">{comment}</CommentText>
        <ReactionsWrapper>
          <ReactionButton>🚩 {ceilNumber(flags || 0)}</ReactionButton>
          <ReactionButton>🔝 {ceilNumber(toTop || 0)}</ReactionButton>
        </ReactionsWrapper>
        <GrayLine />
      </CommentWrapper>
      {open && (
        <Modal
          title=""
          onClose={() => setOpen(false)}
          variant="small-medium"
          isTitle={false}
        >
          <ModalContent>
            <ModalTitle>Live your opinion</ModalTitle>
            <ModalActionsWrapper>
              <ModalAction
                onClick={() => {
                  if (onFlag) {
                    onFlag();
                  }
                }}
              >
                🚩
              </ModalAction>
              <ModalAction
                onClick={() => {
                  if (onTop) {
                    onTop();
                  }
                }}
              >
                🔝
              </ModalAction>
            </ModalActionsWrapper>
            <ModalCancelButton onClick={() => setOpen(false)}>
              Cancel
            </ModalCancelButton>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default Deal;
