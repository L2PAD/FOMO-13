import React, { FC } from "react";
import Modal from "../../../../global/common/Modal";
import { CreditCard } from "lucide-react";
import {
  ReturnModalWrapper,
  ReturnModalDescription,
  StatusBalanceWrapper,
  InfoBox,
  ReturnModalButtons,
} from "./styles";
import { Button } from "../../../../global/common/Button";

interface Props {
  onClose: () => void;
  onConfirm: () => void;
}

const ReturnFundsModal: FC<Props> = ({ onClose, onConfirm }) => {
  const userBalance = 140.45;

  return (
    <Modal
      onClose={onClose}
      title="Return Reserved Funds"
      variant="deal"
      className="deal-modal return-funds-modal"
    >
      <ReturnModalWrapper>
        <ReturnModalDescription>
          <p>
            The reserved funds will be released from FOMO Escrow and returned to
            your balance.
          </p>
          <p>This listing will be closed and removed from the marketplace.</p>
        </ReturnModalDescription>

        <StatusBalanceWrapper>
          <div className="balance-left">
            <div className="balance-label">Your Balance</div>
          </div>

          <div className="balance-icon">
            <div className="balance-amount">{userBalance.toFixed(2)} USDT</div>

            <Button variant="outlined">
              <CreditCard />
            </Button>
          </div>
        </StatusBalanceWrapper>

        <InfoBox variant="warning">
          Once confirmed, the listing cannot be reactivated. You can always
          create a new one later.
        </InfoBox>

        <ReturnModalButtons>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="confirm-btn" onClick={onConfirm}>
            Confirm Return
          </button>
        </ReturnModalButtons>
      </ReturnModalWrapper>
    </Modal>
  );
};

export default ReturnFundsModal;
