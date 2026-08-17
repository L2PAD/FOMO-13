import React, { FC, useState, useEffect } from "react";
import * as S from "../styles";
import Button from "../../../../../global/common/Button";
import { IDeal } from "../../../../../../types/global_types";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { formatPaymentMethod } from "./SellStep";
import { formatP2PSaleTimeLabel, getPaymentDetails, formatTicker, formatCurrency } from "../helpers";
import copy from 'clipboard-copy';
import { toast } from 'react-toastify';

interface ReleasingStepProps {
  deal: IDeal | null;
  releaseTimeLeft: number;
  formatTime: (seconds: number) => string;
  isChatExpanded: boolean;
  setIsChatExpanded: (expanded: boolean) => void;
  onAppeal: () => void;
  onCancel: () => void;
}

const ReleasingStep: FC<ReleasingStepProps> = ({
  deal,
  releaseTimeLeft,
  formatTime,
  isChatExpanded,
  setIsChatExpanded,
  onAppeal,
  onCancel,
}) => {
  const paymentDetails = getPaymentDetails(deal);

  const handleCopy = (text: string, label: string) => {
    copy(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <S.StepContent>
      <S.ReleasingHeader>
        <S.ReleasingText>
          You have marked this order as payed
        </S.ReleasingText>
        <S.ReleaseTimer>{formatTime(releaseTimeLeft)}</S.ReleaseTimer>
        <S.EstimatedTime>
          Estimated release time is{" "}
          <S.TimeHighlight>{formatP2PSaleTimeLabel(deal?.p2pSaleTime)}</S.TimeHighlight>
        </S.EstimatedTime>
      </S.ReleasingHeader>

      <S.WarningBox>
        Once payment is confirmed, your crypto lands in your account
        automatically 🚀
      </S.WarningBox>

      <S.ChatButton onClick={() => setIsChatExpanded(!isChatExpanded)}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.5 4.5H9.3M4.5 7.7H7.3M13.3 6.9C13.3 7.82002 13.1059 8.69469 12.7563 9.4853L13.3012 13.2994L10.0326 12.4822C9.10663 13.003 8.038 13.3 6.9 13.3C3.36538 13.3 0.5 10.4346 0.5 6.9C0.5 3.36538 3.36538 0.5 6.9 0.5C10.4346 0.5 13.3 3.36538 13.3 6.9Z"
            stroke="#05A584"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        {isChatExpanded ? "Hide" : "Open"} chat
      </S.ChatButton>

      <S.Section className="blue">
        <S.SummaryRow>
          <S.SummaryLabel>Currency</S.SummaryLabel>
          <S.SummaryValue>{formatTicker(deal?.ticker)}</S.SummaryValue>
        </S.SummaryRow>
        <S.SummaryRow>
          <S.SummaryLabel>You Receive</S.SummaryLabel>
          <S.SummaryValue>{clarifyAmount(deal?.amount || 0)} {formatTicker(deal?.ticker)}</S.SummaryValue>
        </S.SummaryRow>
        <S.SummaryRow>
          <S.SummaryLabel>You Pay</S.SummaryLabel>
          <S.SummaryValue>{clarifyAmount(deal?.price || 0)} {formatCurrency(deal?.currency)}</S.SummaryValue>
        </S.SummaryRow>
        <S.SummaryRow>
          <S.SummaryLabel>Price per unit</S.SummaryLabel>
          <S.SummaryValue>{clarifyAmount((deal?.price || 0) / (deal?.amount || 1))} {formatCurrency(deal?.currency)}</S.SummaryValue>
        </S.SummaryRow>
        {deal?.dealId && (
          <S.SummaryRow>
            <S.SummaryLabel>Order #</S.SummaryLabel>
            <S.SummaryValue>{deal.dealId}</S.SummaryValue>
          </S.SummaryRow>
        )}
        <S.SectionTitle
          style={{
            marginTop: "6px",
          }}
        >
          Payment Details
        </S.SectionTitle>
        <S.DetailsList>
          <S.DetailRow>
            <S.DetailLabel>Account name</S.DetailLabel>
            <S.DetailValue>
              {paymentDetails.holderName}
              <S.CopyIcon onClick={() => handleCopy(paymentDetails.holderName, 'Account name')}>
                <svg
                  width="10"
                  height="12"
                  viewBox="0 0 10 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.16797 6.50003L9.16797 3.50003C9.16797 1.84317 7.8248 0.500016 6.16793 0.500036L3.31797 0.500069M5.7013 11.1667L1.8013 11.1667C1.08333 11.1667 0.501303 10.5697 0.501303 9.83334L0.501302 4.0556C0.501302 3.31923 1.08333 2.72228 1.8013 2.72228L5.7013 2.72227C6.41927 2.72227 7.0013 3.31922 7.0013 4.0556L7.0013 9.83334C7.0013 10.5697 6.41927 11.1667 5.7013 11.1667Z"
                    stroke="#728094"
                    stroke-linecap="round"
                  />
                </svg>
              </S.CopyIcon>
            </S.DetailValue>
          </S.DetailRow>
          {paymentDetails.iban !== '-' && (
            <S.DetailRow>
              <S.DetailLabel>IBAN</S.DetailLabel>
              <S.DetailValue>
                {paymentDetails.iban}
                <S.CopyIcon onClick={() => handleCopy(paymentDetails.iban, 'IBAN')}>
                  <svg
                    width="10"
                    height="12"
                    viewBox="0 0 10 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9.16797 6.50003L9.16797 3.50003C9.16797 1.84317 7.8248 0.500016 6.16793 0.500036L3.31797 0.500069M5.7013 11.1667L1.8013 11.1667C1.08333 11.1667 0.501303 10.5697 0.501303 9.83334L0.501302 4.0556C0.501302 3.31923 1.08333 2.72228 1.8013 2.72228L5.7013 2.72227C6.41927 2.72227 7.0013 3.31922 7.0013 4.0556L7.0013 9.83334C7.0013 10.5697 6.41927 11.1667 5.7013 11.1667Z"
                      stroke="#728094"
                      stroke-linecap="round"
                    />
                  </svg>
                </S.CopyIcon>
              </S.DetailValue>
            </S.DetailRow>
          )}
          {paymentDetails.cardNumber !== '-' && (
            <S.DetailRow>
              <S.DetailLabel>Card number</S.DetailLabel>
              <S.DetailValue>
                {paymentDetails.cardNumber}
                <S.CopyIcon onClick={() => handleCopy(paymentDetails.cardNumber.replace(/\s+/g, ''), 'Card number')}>
                  <svg
                    width="10"
                    height="12"
                    viewBox="0 0 10 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9.16797 6.50003L9.16797 3.50003C9.16797 1.84317 7.8248 0.500016 6.16793 0.500036L3.31797 0.500069M5.7013 11.1667L1.8013 11.1667C1.08333 11.1667 0.501303 10.5697 0.501303 9.83334L0.501302 4.0556C0.501302 3.31923 1.08333 2.72228 1.8013 2.72228L5.7013 2.72227C6.41927 2.72227 7.0013 3.31922 7.0013 4.0556L7.0013 9.83334C7.0013 10.5697 6.41927 11.1667 5.7013 11.1667Z"
                      stroke="#728094"
                      stroke-linecap="round"
                    />
                  </svg>
                </S.CopyIcon>
              </S.DetailValue>
            </S.DetailRow>
          )}
          <S.DetailRow>
            <S.DetailLabel>Bank</S.DetailLabel>
            <S.DetailValue>{paymentDetails.bankName}</S.DetailValue>
          </S.DetailRow>
        </S.DetailsList>
      </S.Section>

      <S.ButtonsRow style={{ justifyContent: "center", marginTop: 20 }}>
        <Button variant="secondary" onClick={onAppeal}>
          Appeal
        </Button>
      </S.ButtonsRow>
    </S.StepContent>
  );
};

export default ReleasingStep;
