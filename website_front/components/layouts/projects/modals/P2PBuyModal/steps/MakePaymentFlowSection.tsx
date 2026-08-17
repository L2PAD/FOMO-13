import React from "react";
import * as S from "../styles";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { Button } from "../../../../../global/common/Button";
import { getDealTicker } from "./SellStep";
import { formatCurrency } from "../helpers";
import { formatTime } from "../helpers";
import MakePaymentCopyIcon from "./MakePaymentCopyIcon";
import { MakePaymentFlowProps } from "./MakePayment.types";

const MakePaymentFlowSection: React.FC<MakePaymentFlowProps> = ({
  deal,
  isMakePayment,
  isSeller,
  isBuyer,
  isChatExpanded,
  setIsChatExpanded,
  timeLeft,
  sellerName,
  paymentDetails,
  onCopy,
  onMarkPayment,
  onAppeal,
  onCompleteDeal,
  isCompleting,
  onCloseCompletely,
}) => {
  const isReturnRequested = Boolean(deal.isReturnFunds);
  const isTimerExpired = Boolean(deal.p2pSaleTimeEnd) && timeLeft <= 0;

  const buyerDeadlineLabel = (() => {
    if (!isBuyer) return null;
    if (isReturnRequested) return "Return requested";
    if (isTimerExpired) return "Payment window expired";
    return null;
  })();

  const buyerDeadlineDetails = (() => {
    if (!isBuyer) return null;
    if (isReturnRequested && isTimerExpired) {
      return "Payment window expired and a return has been requested.";
    }
    if (isReturnRequested) {
      return "A return has been requested for this deal.";
    }
    if (isTimerExpired) {
      return "Payment window expired. The seller can request a return.";
    }
    return null;
  })();

  return (
    <S.StepContent>
      <S.PaymentHeader>
        <S.PaymentAmount>
          {clarifyAmount(deal.price)} {formatCurrency(deal.currency)}
        </S.PaymentAmount>
        {!isMakePayment && (
          <S.PaymentTimer>
            {buyerDeadlineLabel ? (
              <span>{buyerDeadlineLabel}</span>
            ) : (
              <>
                Make Payment in
                <S.TimerValue>{formatTime(timeLeft)}</S.TimerValue>
              </>
            )}
          </S.PaymentTimer>
        )}
        {isMakePayment && isSeller && <S.PaymentTimer>Awaiting Payment Confirmation</S.PaymentTimer>}
        {isMakePayment && isBuyer && <S.PaymentTimer>Payment Marked - Awaiting Seller Confirmation</S.PaymentTimer>}
        <S.SellerInfo>
          <span>Seller name:</span>
          <strong>@{sellerName}</strong>
        </S.SellerInfo>
        <S.ChatButton onClick={() => setIsChatExpanded(!isChatExpanded)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M4.5 4.5H9.3M4.5 7.7H7.3M13.3 6.9C13.3 7.82002 13.1059 8.69469 12.7563 9.4853L13.3012 13.2994L10.0326 12.4822C9.10663 13.003 8.038 13.3 6.9 13.3C3.36538 13.3 0.5 10.4346 0.5 6.9C0.5 3.36538 3.36538 0.5 6.9 0.5C10.4346 0.5 13.3 3.36538 13.3 6.9Z"
              stroke="#05A584"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          {isChatExpanded ? "Hide" : "Open"} chat
        </S.ChatButton>
      </S.PaymentHeader>

      {isSeller && isMakePayment ? (
        <>
          <S.WarningBox>
            The buyer has notified that the payment was sent. Please check your payment account and confirm the
            receipt of funds.
          </S.WarningBox>

          <S.Section className="blue">
            <S.SectionTitle>Deal Information</S.SectionTitle>
            <S.DetailsList>
              <S.DetailRow>
                <S.DetailLabel>Amount</S.DetailLabel>
                <S.DetailValue>
                  {clarifyAmount(deal.amount)} {getDealTicker(deal.ticker)}
                </S.DetailValue>
              </S.DetailRow>
              <S.DetailRow>
                <S.DetailLabel>Expected payment</S.DetailLabel>
                <S.DetailValue>
                  {clarifyAmount(deal.price)} {formatCurrency(deal.currency)}
                </S.DetailValue>
              </S.DetailRow>
            </S.DetailsList>
          </S.Section>

          <S.ButtonsRow>
            <Button variant="secondary" onClick={onAppeal}>
              Appeal
            </Button>
            <Button variant="primary" onClick={onCompleteDeal} disabled={isCompleting}>
              Payment Received
            </Button>
          </S.ButtonsRow>
        </>
      ) : (
        <>
          <S.WarningBox>
            Transfer the funds using the payment details provided above. Make sure the money is sent to the seller's
            account.
          </S.WarningBox>

          {buyerDeadlineDetails && (
            <S.WarningBox className="info">{buyerDeadlineDetails}</S.WarningBox>
          )}

          <S.Section className="blue">
            <S.SectionTitle>Payment Details</S.SectionTitle>
            <S.DetailsList>
              <S.DetailRow>
                <S.DetailLabel>Account name</S.DetailLabel>
                <S.DetailValue>
                  {paymentDetails.holderName}
                  <MakePaymentCopyIcon onClick={() => onCopy(paymentDetails.holderName, "Account name")} />
                </S.DetailValue>
              </S.DetailRow>
              <S.DetailRow>
                <S.DetailLabel>Card number</S.DetailLabel>
                <S.DetailValue>
                  {paymentDetails.cardNumber}
                  <MakePaymentCopyIcon
                    onClick={() => onCopy(paymentDetails.cardNumber.replace(/\s+/g, ""), "Card number")}
                  />
                </S.DetailValue>
              </S.DetailRow>
              <S.DetailRow>
                <S.DetailLabel>IBAN</S.DetailLabel>
                <S.DetailValue>
                  {paymentDetails.iban}
                  <MakePaymentCopyIcon onClick={() => onCopy(paymentDetails.iban, "IBAN")} />
                </S.DetailValue>
              </S.DetailRow>
              <S.DetailRow>
                <S.DetailLabel>Bank</S.DetailLabel>
                <S.DetailValue>{paymentDetails.bankName}</S.DetailValue>
              </S.DetailRow>
            </S.DetailsList>
          </S.Section>
          {
            isReturnRequested
              ?
              <S.ButtonWrapper>
                <Button
                  className="red-btn"
                  variant="outlined"
                  onClick={() => {
                    if (onCloseCompletely) {
                      onCloseCompletely();
                      return;
                    }

                    onMarkPayment && onMarkPayment();
                  }}
                >
                  Close
                </Button>
              </S.ButtonWrapper>
              :
              <></>
          }
          {isBuyer && !isMakePayment && !isReturnRequested && (
            <S.ButtonWrapper>
              <Button
                variant="primary"
                onClick={() => {
                  onMarkPayment && onMarkPayment();
                }}
              >
                Transferred, Notify Seller
              </Button>
            </S.ButtonWrapper>
          )}
        </>
      )}
    </S.StepContent>
  );
};

export default MakePaymentFlowSection;
