import React from "react";
import * as S from "../styles";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { formatCurrency } from "../helpers";
import { Button } from "../../../../../global/common/Button";
import { getDealTicker } from "./SellStep";
import { MakePaymentPreReserveProps } from "./MakePayment.types";
import { approveUSDC } from "../../../../../../smart/smartOTCP2P";
import { toast } from "react-toastify";

const MakePaymentPreReserveSection: React.FC<MakePaymentPreReserveProps> = ({
  deal,
  isSeller,
  sellerName,
  isChatExpanded,
  setIsChatExpanded,
  onReserveFunds,
}) => {
  const [isReserving, setIsReserving] = React.useState(false);

  const handleReserveFunds = async () => {
    if (isReserving) return;

    setIsReserving(true);
    try {
      if (deal.ticker?.toLowerCase() === "usd") {
        const { ok } = await approveUSDC(Number(deal.amount || 0));
        if (!ok) {
          toast.error("Approve error!");
          return;
        }
      }

      await onReserveFunds?.();
    } finally {
      setIsReserving(false);
    }
  };

  if (isSeller) {
    return (
      <S.StepContent>
        <S.PaymentHeader>
          <S.PaymentAmount>
            {clarifyAmount(deal.price)} {formatCurrency(deal.currency)}
          </S.PaymentAmount>
                  <S.SellerInfo>
            <span>Deal with:</span>
            <strong>@{deal.buyer?.twitterData?.username || deal.buyer?.username || "-"}</strong>
          </S.SellerInfo>
          <S.ChatButton onClick={() => setIsChatExpanded(!isChatExpanded)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4.5 4.5H9.3M4.5 7.7H7.3M13.3 6.9C13.3 7.82002 13.1059 8.69469 12.7563 9.4853L13.3012 13.2994L10.0326 12.4822C9.10663 13.003 8.038 13.3 6.9 13.3C3.36538 13.3 0.5 10.4346 0.5 6.9C0.5 3.36538 3.36538 0.5 6.9 0.5C10.4346 0.5 13.3 3.36538 13.3 6.9Z"
                stroke="#05A584"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {isChatExpanded ? "Hide" : "Open"} chat
          </S.ChatButton>
        </S.PaymentHeader>

        <S.WarningBox>
          To start this deal, you need to reserve the crypto funds in the smart contract safe. The buyer will be
          notified once the funds are secured.
        </S.WarningBox>

        <S.Section className="blue">
          <S.SectionTitle>Deal Information</S.SectionTitle>
          <S.DetailsList>
            <S.DetailRow>
              <S.DetailLabel>Amount to reserve</S.DetailLabel>
              <S.DetailValue>
                {clarifyAmount(deal.amount)} {getDealTicker(deal.ticker)}
              </S.DetailValue>
            </S.DetailRow>
            <S.DetailRow>
              <S.DetailLabel>Price</S.DetailLabel>
              <S.DetailValue>
                {clarifyAmount(deal.price)} {formatCurrency(deal.currency)}
              </S.DetailValue>
            </S.DetailRow>
          </S.DetailsList>
        </S.Section>

        <S.ButtonWrapper>
          <Button
            variant="primary"
            onClick={handleReserveFunds}
            disabled={isReserving}
          >
            Reserve Funds
          </Button>
        </S.ButtonWrapper>
      </S.StepContent>
    );
  }

  return (
    <S.StepContent>
      <S.PaymentHeader>
        <S.PaymentAmount>
          {clarifyAmount(deal.price)} {formatCurrency(deal.currency)}
        </S.PaymentAmount>
        <S.SellerInfo>
          <span>Seller name:</span>
          <strong>@{sellerName}</strong>
        </S.SellerInfo>
        <S.ChatButton onClick={() => setIsChatExpanded(!isChatExpanded)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M4.5 4.5H9.3M4.5 7.7H7.3M13.3 6.9C13.3 7.82002 13.1059 8.69469 12.7563 9.4853L13.3012 13.2994L10.0326 12.4822C9.10663 13.003 8.038 13.3 6.9 13.3C3.36538 13.3 0.5 10.4346 0.5 6.9C0.5 3.36538 3.36538 0.5 6.9 0.5C10.4346 0.5 13.3 3.36538 13.3 6.9Z"
              stroke="#05A584"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {isChatExpanded ? "Hide" : "Open"} chat
        </S.ChatButton>
      </S.PaymentHeader>

      <S.WarningBox>
        Please wait while the seller reserves the crypto funds in the smart contract safe. You will be notified once
        the funds are secured and you can proceed with the payment.
      </S.WarningBox>

      <S.Section className="blue">
        <S.SectionTitle>Deal Status</S.SectionTitle>
        <S.DetailsList>
          <S.DetailRow>
            <S.DetailLabel>Status</S.DetailLabel>
            <S.DetailValue>Waiting for seller to reserve funds...</S.DetailValue>
          </S.DetailRow>
          <S.DetailRow>
            <S.DetailLabel>Amount</S.DetailLabel>
            <S.DetailValue>
              {clarifyAmount(deal.amount)} {getDealTicker(deal.ticker)}
            </S.DetailValue>
          </S.DetailRow>
        </S.DetailsList>
      </S.Section>
    </S.StepContent>
  );
};

export default MakePaymentPreReserveSection;
