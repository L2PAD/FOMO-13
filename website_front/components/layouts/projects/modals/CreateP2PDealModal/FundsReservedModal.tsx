import React, { FC, useEffect, useState } from "react";
import Modal from "../../../../global/common/Modal";
import { Check, Copy, CreditCard } from "lucide-react";
import {
  StatusModalWrapper,
  StatusIcon,
  StatusTitle,
  ExpiresWrapper,
  AstronautImage,
  StatusDescription,
  StatusBalanceWrapper,
  DetailsList,
  InfoBox,
  StatusModalButtons,
} from "./styles";
import { Button } from "../../../../global/common/Button";
import FundsReservedIcon from "../../../../global/Icons/Deals/FundsReservedIcon";

interface Props {
  onClose: () => void;
  onReturnFunds: () => void;
  onViewListing: () => void;
  amount: string;
  price: string;
  listingId?: string;
}

const FundsReservedModal: FC<Props> = ({
  onClose,
  onReturnFunds,
  onViewListing,
  amount,
  price,
  listingId = "S-48723",
}) => {
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60 - 1); // 23:59:59

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const userBalance = 140.45;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Modal
      onClose={onClose}
      title="Funds Reserved for Sale"
      variant="deal"
      className="deal-modal status-modal"
    >
      <StatusModalWrapper>
        <StatusIcon variant="reserved">
          <div className="icon-inner">
            <Check />
          </div>
        </StatusIcon>

        <StatusTitle variant="reserved">Reserved</StatusTitle>

        <ExpiresWrapper>
          <div className="expires-label">Expires in:</div>
          <div className="expires-time">{formatTime(timeLeft)}</div>
        </ExpiresWrapper>

        <AstronautImage>
          <FundsReservedIcon/>
        </AstronautImage>

        <StatusDescription>
          <strong>{amount} USDT</strong> has been temporarily moved from your
          balance to FOMO Escrow.
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
            <span className="detail-label">Amount Locked</span>
            <span className="detail-value">{amount} USDT</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Listing Price</span>
            <span className="detail-value">{price} UAH / USDT</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className="detail-value">Active — waiting for a buyer</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Created</span>
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
          Funds are securely held in FOMO Escrow and can't be withdrawn or used
          until the transaction is completed or canceled.
        </InfoBox>

        <StatusModalButtons>
          <button className="return-btn" onClick={onReturnFunds}>
            Return Funds
          </button>
          <button className="view-btn" onClick={onViewListing}>
            View Listing
          </button>
        </StatusModalButtons>
      </StatusModalWrapper>
    </Modal>
  );
};

export default FundsReservedModal;
