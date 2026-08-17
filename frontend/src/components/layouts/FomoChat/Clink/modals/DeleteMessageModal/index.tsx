import React, { FC, useState } from "react";
import { UserCheckbox } from "../ForwardModal/styles";
import {
  ModalOverlay,
  ModalContent,
  ModalTitle,
  OptionRow,
  OptionText,
  ButtonsWrapper,
  DeleteButton,
  CancelButton,
} from "./styles";

interface Props {
  onClose: () => void;
  onConfirm: (deleteForBoth: boolean) => void;
  recipientName?: string;
}

const DeleteMessageModal: FC<Props> = ({
  onClose,
  onConfirm,
  recipientName = "User",
}) => {
  const [deleteForBoth, setDeleteForBoth] = useState(true);

  const handleDelete = () => {
    onConfirm(deleteForBoth);
    onClose();
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>Delete selected message?</ModalTitle>
        <OptionRow onClick={() => setDeleteForBoth(!deleteForBoth)}>
          <UserCheckbox isChecked={deleteForBoth}>
            {deleteForBoth && (
              <div className="inner-circle">
                <svg
                  width="12"
                  height="9"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 4L4.5 7.5L11 1"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </UserCheckbox>
          <OptionText>Delete for me and {recipientName}</OptionText>
        </OptionRow>

        <ButtonsWrapper>
          <DeleteButton onClick={handleDelete}>Delete</DeleteButton>
          <CancelButton onClick={onClose}>Cancel</CancelButton>
        </ButtonsWrapper>
      </ModalContent>
    </ModalOverlay>
  );
};

export default DeleteMessageModal;
