import React, { FC, useState } from "react";
import Image from "next/image";
import Modal from "../../common/Modal";
import LikeDefaultIcon from "../../../../assets/images/like-default.png";
import LikeFullIcon from "../../../../assets/images/like-full.png";
import DislikeDefaultIcon from "../../../../assets/images/dis-default.png";
import DislikeFullIcon from "../../../../assets/images/dis-full.png";
import { Action } from "../../LeftNav/styles";
import {
  ActionItem,
  Actions,
  ButtonWrapper,
  Label,
  Row,
  TitleModal,
} from "./styles";
import MainModal from "../../common/MainModal";

interface IProps {
  isVisible?: boolean
  confirmSendReview: (
    action: "like" | "dislike",
    text: string
  ) => Promise<void>;
  onClose: () => void;
}

const LeaveFeedback: FC<IProps> = ({ isVisible, onClose, confirmSendReview }) => {
  const [text, setText] = useState<string>("");
  const [action, setAction] = useState<"like" | "dislike">("like");

  return (
    <MainModal isVisible={!!isVisible} variant="cart" title="" isTitle={false} onClose={() => {
      onClose()
      setText('')
    }}>
      <TitleModal>Live your feedback</TitleModal>
      <Row>
        <Label>Rate your service</Label>
        <Actions>
          <ActionItem onClick={() => setAction("like")}>
            <Image
              src={action === "like" ? LikeFullIcon : LikeDefaultIcon}
              alt="LIKE"
            />
          </ActionItem>
          <ActionItem onClick={() => setAction("dislike")}>
            <Image
              src={action === "dislike" ? DislikeFullIcon : DislikeDefaultIcon}
              alt="DISLIKE"
            />
          </ActionItem>
        </Actions>
      </Row>
      <Row>
        <Label>Additional feedback (Optional)</Label>
        <textarea
          placeholder="Tell us more about your experience…"
          value={text}
          onChange={(e: any) => setText(e.target.value)}
        />
      </Row>
      <ButtonWrapper>
        <Action
          onClick={() => {
            confirmSendReview(action, text)
            setText('')
          }}
          actionType="green"
        >
          Accept
        </Action>
        <Action
          onClick={() => {
            setText("");
            onClose();
          }}
          actionType="red"
        >
          Cancel
        </Action>
      </ButtonWrapper>
    </MainModal>
  );
};

export default LeaveFeedback;
