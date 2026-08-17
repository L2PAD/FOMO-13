import React, { FC } from "react";
import { RejectButton } from "../../../layouts/projects/OTC/DealItem/styles";
import MainModal from "../../common/MainModal";
import Button from "../../common/Button";
import { Body, Buttons, SmallButtons, Wrapper } from "./styles";
import { sanitizedHtml } from "../../../../helpers/sanitizeHtml";

interface IProps {
  isVisible: boolean;
  text: string;
  variant?: "default" | "small";
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteModal: FC<IProps> = ({
  isVisible,
  text,
  onClose,
  onConfirm,
  variant = "default",
}) => {
  const getContent = (): React.ReactNode => {
    if (variant === "small") {
      return (
        <Wrapper>
          <Body
            className="small-delete-modal"
            dangerouslySetInnerHTML={sanitizedHtml(text)}
          />
          <SmallButtons>
            <RejectButton onClick={onConfirm}>Delete</RejectButton>
            <button onClick={onClose}>Cancel</button>
          </SmallButtons>
        </Wrapper>
      );
    }

    return (
      <Wrapper>
        <Body dangerouslySetInnerHTML={sanitizedHtml(text)} />
        <Buttons>
          <RejectButton onClick={onClose}>Cancel</RejectButton>
          <Button variant="main" onClick={onConfirm}>
            Delete Tab
          </Button>
        </Buttons>
      </Wrapper>
    );
  };

  return (
    <MainModal
      variant={variant === "small" ? "cart" : "820"}
      title={variant === "small" ? "" : "Delete Tab?"}
      isTitle={variant === "default"}
      className="share-modal"
      isVisible={isVisible}
      onClose={onClose}
    >
      {getContent()}
    </MainModal>
  );
};

export default DeleteModal;
