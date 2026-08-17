import React, { FC, useState, useContext } from "react";
import * as S from "../styles";
import Button from "../../../../../global/common/Button";
import Checkbox from "../../../../../global/common/Checkbox";
import { IDeal } from "../../../../../../types/global_types";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { formatPaymentMethod } from "./SellStep";
import { getDealSeller, getPaymentDetails, formatTicker, formatCurrency } from "../helpers";
import Image from "next/image";
import { toast } from "react-toastify";
import { LoadingContext } from "../../../../../global/Layout";
import { blockDeal } from "../../../../../../http/p2p/blockDeal";
import { createDealWithApproval } from "../../../../../../smart/smartOTCP2P";

interface BuyStepProps {
  deal: IDeal | null;
  onProceed: () => void;
  onClose: () => void;
  refetchDeals?: () => void;
}

const BuyStep: FC<BuyStepProps> = ({ deal, onProceed, onClose, refetchDeals }) => {
  const seller = getDealSeller(deal);
  const paymentDetails = getPaymentDetails(deal);
  const [selectedPaymentMethodIndex, setSelectedPaymentMethodIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { loadingStateHandler } = useContext(LoadingContext);

  const handleProceed = async () => {
    if (!deal?._id) {
      toast.error("Deal not found");
      return;
    }

    loadingStateHandler(true);
    let dealIdSmart: number | null = null;

    if (deal.type === "sell") {
      const { id, success } = await createDealWithApproval({
        endTime: new Date(deal.date).getTime() / 1000,
        price: deal.amount,
        currency: deal.ticker.toLowerCase() === "eth" ? 0 : 1,
        mode: 1,
        tokenAmount: 0,
        tokenForSale: "",
      });

      if (!success || !id) {
        toast.error("Smart contract error!");
        loadingStateHandler(false);
        return;
      }

      dealIdSmart = id;
    }

    const { success, message } = await blockDeal(deal._id, dealIdSmart);

    if (success) {
      toast.success("Deal blocked successfully. Waiting for seller confirmation.");
      if (refetchDeals) {
        await refetchDeals();
      }
      onClose();
    } else {
      toast.error(message || "Failed to block deal. Please try again.");
    }

    loadingStateHandler(false);
  };

  const getCryptoIcon = (ticker: string | undefined) => {
    const tickerLower = ticker?.toLowerCase();
    if (tickerLower === 'eth') {
      return '/static/crypto-icons/eth.svg';
    } else if (tickerLower === 'usd') {
      return '/static/crypto-icons/usdc.svg';
    }
    return '/static/crypto-icons/eth.svg';
  };

  return (
    <S.StepContent>
      <S.Section>
        <S.SectionTitle>Terms from seller</S.SectionTitle>
        <S.TermsText>
          {!deal?.description
            ? "No terms provided"
            : showFullDescription || deal.description.length <= 100
              ? deal.description
              : `${deal.description.substring(0, 100)}...`
          }
          {deal?.description && deal.description.length > 100 && (
            <>
              {" "}
              <S.SeeMore onClick={() => setShowFullDescription(!showFullDescription)}>
                {showFullDescription ? "See less" : "See more"}
              </S.SeeMore>
            </>
          )}
        </S.TermsText>
      </S.Section>

      <S.Section>
        <S.SectionTitle>You Pay</S.SectionTitle>
        <S.AmountInput>
          <S.AmountValue>{clarifyAmount(deal?.price || 0)}</S.AmountValue>
          <S.CurrencyBadge>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
            >
              <rect
                width="20"
                height="20"
                rx="10"
                fill="url(#pattern0_557_8213)"
              />
              <defs>
                <pattern
                  id="pattern0_557_8213"
                  patternContentUnits="objectBoundingBox"
                  width="1"
                  height="1"
                >
                  <use
                    xlinkHref="#image0_557_8213"
                    transform="translate(-0.00520833) scale(0.0104167)"
                  />
                </pattern>
                <image
                  id="image0_557_8213"
                  width="97"
                  height="96"
                  preserveAspectRatio="none"
                  xlinkHref="data:image/png;base64,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"
                />
              </defs>
            </svg>
            <span>{formatCurrency(deal?.currency)}</span>
          </S.CurrencyBadge>
        </S.AmountInput>
        <S.InfoRow>
          <S.InfoLabel>
            Price: <strong>{clarifyAmount((deal?.price || 0) / (deal?.amount || 1))} {formatCurrency(deal?.currency)}</strong>
          </S.InfoLabel>
        </S.InfoRow>
      </S.Section>

      <S.Section>
        <S.SectionTitle>You Receive</S.SectionTitle>
        <S.AmountInput>
          <S.AmountValue>{clarifyAmount(deal?.amount || 0)}</S.AmountValue>
          <S.CurrencyBadge>
            <Image
              src={getCryptoIcon(deal?.ticker)}
              alt={formatTicker(deal?.ticker)}
              width={20}
              height={20}
              style={{ borderRadius: '50%' }}
            />
            <span>{formatTicker(deal?.ticker)}</span>
          </S.CurrencyBadge>
        </S.AmountInput>
      </S.Section>

      <S.Section>
        <S.SectionTitle>Payment Method</S.SectionTitle>
        <S.PaymentMethodsList>
          {deal?.paymentMethods?.map((method, idx) => {
            const pm = typeof method === 'object' ? method as any : null;
            const isSelected = idx === selectedPaymentMethodIndex;
            return (
              <S.PaymentMethodItem
                key={`${method}-${idx}`}
                selected={isSelected}
                onClick={() => setSelectedPaymentMethodIndex(idx)}
                style={{ cursor: 'pointer' }}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => setSelectedPaymentMethodIndex(idx)}
                />
                <span>
                  {formatPaymentMethod(method)}
                  {pm?.holderName && <span style={{ color: '#728094', fontSize: 12 }}> — {pm.holderName}</span>}
                  {pm?.cardLast4 && <span style={{ color: '#728094', fontSize: 12 }}> (*{pm.cardLast4})</span>}
                </span>
              </S.PaymentMethodItem>
            );
          })}
        </S.PaymentMethodsList>
      </S.Section>

      <S.ButtonWrapper>
        <Button
          variant="primary"
          onClick={handleProceed}
        >
          Send Request
        </Button>
      </S.ButtonWrapper>
    </S.StepContent>
  );
};

export default BuyStep;
