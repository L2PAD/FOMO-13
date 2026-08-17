import React, { FC } from "react";
import {
  ModalOverlay,
  ModalContent,
  ModalTitle,
  ModalDescription,
  ButtonsWrapper,
  DeleteButton,
  CancelButton,
} from "./styles";

interface Props {
  onClose: () => void;
  onConfirm: () => void;
  recipientName?: string;
}

const DeleteChatModal: FC<Props> = ({
  onClose,
  onConfirm,
  recipientName = "User",
}) => {
  const handleDelete = () => {
    onConfirm();
    onClose();
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle style={{ marginTop: "8px" }}>
          Warning!
          <br />
          You&apos;re about to delete this conversation.
        </ModalTitle>
        <ModalDescription>
          All messages will be permanently removed <strong>on your side</strong>.
          The other user will still keep the chat history.
        </ModalDescription>
        <ButtonsWrapper>
          <DeleteButton onClick={handleDelete}>Delete</DeleteButton>
          <CancelButton onClick={onClose}>Cancel</CancelButton>
        </ButtonsWrapper>
      </ModalContent>
    </ModalOverlay>
  );
};

export default DeleteChatModal;
