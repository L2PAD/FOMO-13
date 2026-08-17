import React, { FC, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as S from "../styles";
import Button from "../../../../../global/common/Button";
import { IDeal } from "../../../../../../types/global_types";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { formatTicker } from "../helpers";
import { AuthContext, BalanceContext } from "../../../../../global/Layout";
import { checkReviewAccess } from "../../../../../../hooks/useDealActions";
import LikeDefaultIcon from "../../../../../../assets/images/like-default.png";
import LikeFullIcon from "../../../../../../assets/images/like-full.png";
import DislikeDefaultIcon from "../../../../../../assets/images/dis-default.png";
import DislikeFullIcon from "../../../../../../assets/images/dis-full.png";
import { Check, Copy, CreditCard } from "lucide-react";
import SaleCompleteIcon from "../../../../../global/Icons/Deals/SaleCompleteIcon";

interface CompletedStepProps {
  deal: IDeal | null;
  isChatExpanded: boolean;
  setIsChatExpanded: (expanded: boolean) => void;
  onClose: () => void;
  onCompleteClose?: () => void;
  onSubmitFeedback?: (action: "like" | "dislike", text: string) => Promise<void>;
}

const CompletedStep: FC<CompletedStepProps> = ({
  deal,
  isChatExpanded,
  setIsChatExpanded,
  onClose,
  onCompleteClose,
  onSubmitFeedback,
}) => {
  const [feedbackAction, setFeedbackAction] = useState<"like" | "dislike">("like");
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFeedbackSentLocal, setIsFeedbackSentLocal] = useState(false);
  const hasRefetchedBalance = useRef(false);
  const { userData } = useContext(AuthContext);
  const balance = useContext(BalanceContext);
  const userBalance = deal?.ticker?.toLowerCase() === "eth" ? balance.eth : balance.usdc;
  const canLeaveFeedback =
    !!deal && !!userData?._id ? checkReviewAccess(deal, userData._id) : false;
  const isFeedbackSent = isFeedbackSentLocal || !canLeaveFeedback;

  useEffect(() => {
    if (!hasRefetchedBalance.current && typeof balance?.refetchBalance === "function") {
      hasRefetchedBalance.current = true;
      balance.refetchBalance();
    }
  }, [balance?.refetchBalance]);

  const handleSubmit = async () => {
    if (!canLeaveFeedback) {
      setIsFeedbackSentLocal(true);
      return;
    }

    if (onSubmitFeedback) {
      setIsSubmitting(true);
      await onSubmitFeedback(feedbackAction, feedbackText);
      setIsSubmitting(false);
    }
    setIsFeedbackSentLocal(true);
  };

  if (isFeedbackSent) {
    return (
      <S.StepContent>
        <S.StatusStateWrapper>
          <S.StatusStateIcon variant="completed">
            <div className="icon-inner">
              <Check />
            </div>
          </S.StatusStateIcon>

          <S.StatusStateTitle variant="completed">Completed</S.StatusStateTitle>

          <S.StatusStateImage>
            <SaleCompleteIcon />
          </S.StatusStateImage>

          <S.StatusStateDescription>
            <strong>{clarifyAmount(deal?.amount || 0)} {formatTicker(deal?.ticker)}</strong> have been sold and released from escrow.
          </S.StatusStateDescription>

          <S.StatusStateBalance>
            <div className="balance-left">
              <div className="balance-label">Your Balance</div>
            </div>
            <div className="balance-icon">
              <div className="balance-amount">{clarifyAmount(userBalance)} {formatTicker(deal?.ticker)}</div>
              <Button
                variant="outlined"
                onClick={() => window.open('https://www.fomo.cx/utility?action=withdraw', '_blank', 'noopener,noreferrer')}
              >
                <CreditCard />
              </Button>
            </div>
          </S.StatusStateBalance>

          <S.DetailsList className="details-list">
            <S.DetailRow>
              <S.DetailLabel>Listing ID</S.DetailLabel>
              <S.DetailValue>
                #{deal?.dealId || deal?._id}
                <Copy size={16} />
              </S.DetailValue>
            </S.DetailRow>
            <S.DetailRow>
              <S.DetailLabel>Amount Sold</S.DetailLabel>
              <S.DetailValue>{clarifyAmount(deal?.amount || 0)} {formatTicker(deal?.ticker)}</S.DetailValue>
            </S.DetailRow>
            <S.DetailRow>
              <S.DetailLabel>Status</S.DetailLabel>
              <S.DetailValue>Completed</S.DetailValue>
            </S.DetailRow>
          </S.DetailsList>

          <S.StatusStateInfo>
            The sale is complete. All funds have been released from FOMO Escrow.
          </S.StatusStateInfo>

          <S.ButtonsRow>
            <S.CancelButton onClick={onCompleteClose || onClose}>Close</S.CancelButton>
            <Button variant="primary" onClick={onCompleteClose || onClose}>
              New Deal
            </Button>
          </S.ButtonsRow>
        </S.StatusStateWrapper>
      </S.StepContent>
    );
  }

  return (
    <S.StepContent>
      <S.CompletedWrapper>
        <S.SuccessIconWrapper>
          <svg
            width="115"
            height="115"
            viewBox="0 0 115 115"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="10"
              y="10"
              width="95"
              height="95"
              rx="47.5"
              fill="#04A584"
              stroke="#E9F8F8"
              strokeWidth="20"
            />
            <path
              d="M41.875 60.625L51.25 70L76.25 45"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </S.SuccessIconWrapper>
        <S.CompletedAmount>{clarifyAmount(deal?.amount || 0)} {formatTicker(deal?.ticker)}</S.CompletedAmount>
        <S.CompletedText>
          Has been deposited into your account
        </S.CompletedText>

        <S.ChatButton
          onClick={() => setIsChatExpanded(!isChatExpanded)}
        >
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
      </S.CompletedWrapper>

      <S.Section>
        <S.SectionTitle>Rate your service</S.SectionTitle>
        <S.RatingButtons>
          <S.ThumbButton
            positive={feedbackAction === "like"}
            onClick={() => setFeedbackAction("like")}
          >
            <Image
              src={feedbackAction === "like" ? LikeFullIcon : LikeDefaultIcon}
              alt="LIKE"
            />
          </S.ThumbButton>
          <S.ThumbButton
            positive={feedbackAction === "dislike"}
            onClick={() => setFeedbackAction("dislike")}
          >
            <Image
              src={feedbackAction === "dislike" ? DislikeFullIcon : DislikeDefaultIcon}
              alt="DISLIKE"
            />
          </S.ThumbButton>
        </S.RatingButtons>
      </S.Section>

      <S.Section>
        <S.SectionTitle>Additional feedback (Optional)</S.SectionTitle>
        <S.Textarea
          placeholder="Tell us more about your experience..."
          rows={4}
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
        />
      </S.Section>

      <S.ButtonsRow>
        <S.CancelButton onClick={onClose}>Cancel</S.CancelButton>
        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
          Submit
        </Button>
      </S.ButtonsRow>
    </S.StepContent>
  );
};

export default CompletedStep;
