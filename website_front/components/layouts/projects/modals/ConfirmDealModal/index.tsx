import React, { FC } from "react";
import {
  ActionButton,
  ActionName,
  ActionsWrapper,
  ModalWrapper,
  Wrapper,
} from "./styles";
import { Button } from "../../../../global/common/Button";
import MainModal from "../../../../global/common/MainModal";

interface Props {
  isVisible?: boolean
  isApprove?: boolean;
  isApproveNeed?: boolean;
  onConfirm?: () => Promise<void>;
  onClose: () => void;
  type?: "buy" | "block" | "reserve";
}

const ConfirmDealModal: FC<Props> = ({
  onClose,
  onConfirm,
  isApproveNeed,
  isApprove,
  isVisible,
  type,
}) => {
  const getTextByType = (): string => {
    if (!type)
      return "Are you a confirmation that you want to participate in this deal?";

    const texts = {
      buy: "Are you a confirmation that you want to participate in this deal?",
      block:
        "Are you a confirmation that you want to participate in this deal?",
      reserve:
        "Are you a confirmation that you want to reserve funds in this deal?",
    };

    return texts[type];
  };

  return (
    <MainModal
      isTitle={false}
      isVisible={!!isVisible}
      onClose={onClose} variant="small-medium" title="">
      <Wrapper>
        <ActionName>{getTextByType()}</ActionName>
        <ActionsWrapper>
          <ActionButton
            onClick={() => {
              onClose();
            }}
          >
            Cancel
          </ActionButton>
          <Button
            className="confirm-btn"
            variant="primary"
            onClick={onConfirm}>
            {isApproveNeed && !isApprove ? "Approve" : "Confirm"}
          </Button>
        </ActionsWrapper>
      </Wrapper>
    </MainModal>
  );
};

export default ConfirmDealModal;
