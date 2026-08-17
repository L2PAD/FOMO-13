import React, { FC } from "react";
import Modal from "../../../../global/common/Modal";
import { Check, Copy, CreditCard } from "lucide-react";
import {
  StatusModalWrapper,
  StatusIcon,
  StatusTitle,
  AstronautImage,
  StatusDescription,
  StatusBalanceWrapper,
  DetailsList,
  InfoBox,
  StatusModalButtons,
} from "./styles";
import { Button } from "../../../../global/common/Button";
import SaleCompleteIcon from "../../../../global/Icons/Deals/SaleCompleteIcon";

interface Props {
  onClose: () => void;
  onNewDeal: () => void;
  amount: string;
  price: string;
  listingId?: string;
}

const SaleCompletedModal: FC<Props> = ({
  onClose,
  onNewDeal,
  amount,
  price,
  listingId = "S-48723",
}) => {
  const userBalance = 140.45;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Modal
      onClose={onClose}
      title="Sale Completed"
      variant="deal"
      className="deal-modal status-modal"
    >
      <StatusModalWrapper>
        <StatusIcon variant="completed">
          <div className="icon-inner">
            <Check />
          </div>
        </StatusIcon>

        <StatusTitle variant="completed">Completed</StatusTitle>

        <AstronautImage>
          <SaleCompleteIcon />
        </AstronautImage>

        <StatusDescription>
          <strong>{amount} USDT</strong> have been sold and released from
          escrow.
        </StatusDescription>

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

        <DetailsList>
          <div className="detail-row">
            <span className="detail-label">Listing ID</span>
            <span className="detail-value">
              #{listingId}
              <Copy size={16} onClick={() => handleCopy(listingId)} />
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Amount Sold</span>
            <span className="detail-value">{amount} USDT</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Listing Price</span>
            <span className="detail-value">{price} UAH / USDT</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className="detail-value status-completed">Completed</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Completed</span>
            <span className="detail-value">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })}{" "}
              —{" "}
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          </div>
        </DetailsList>

        <InfoBox>
          The sale is complete — all funds have been sold and released from FOMO
          Escrow.
          <br />
          <br />
          You can now create a new deal or explore other active listings.
        </InfoBox>

        <StatusModalButtons>
          <button className="close-btn" onClick={onClose}>
            Close
          </button>
          <button className="new-deal-btn" onClick={onNewDeal}>
            New Deal
          </button>
        </StatusModalButtons>
      </StatusModalWrapper>
    </Modal>
  );
};

export default SaleCompletedModal;
