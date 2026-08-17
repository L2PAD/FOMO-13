import React, { useMemo } from "react";
import { IDeal, IReview, IUser } from "../types/global_types";
import { ActionHandlerVariants, P2PActionHandlerVariants } from "../components/layouts/projects/OTC/DealsList";
import Button from "../components/global/common/Button";
import OtcComment from "../components/global/common/OtcComment";
import {
  StartOrReject,
  StartDeal,
  RejectButton,
  DealActionsWrapper,
} from "../components/layouts/projects/OTC/DealItem/styles";
import { useTranslation } from "i18n";

// ============================================================================
// Helper Functions
// ============================================================================

const hasUserReviewed = (reviews: IReview[] = [], userId: string, dealId: string): boolean => {
  return reviews.some((item: IReview) => item.userId === userId && item.dealId === dealId);
};

export const checkReviewAccess = (deal: IDeal, userId: string): boolean => {
  if (deal.status !== "ended") return false;

  const reviewed =
    hasUserReviewed(deal.creator?.reviewLikes, userId, deal._id) ||
    hasUserReviewed(deal.creator?.reviewDislikes, userId, deal._id) ||
    hasUserReviewed(deal?.buyer?.reviewLikes, userId, deal._id) ||
    hasUserReviewed(deal?.buyer?.reviewDislikes, userId, deal._id);

  return !reviewed;
};

// ============================================================================
// Button Components
// ============================================================================

const P2PButtons: React.FC<{
  type: "buy" | "sell";
  onAction: (action: ActionHandlerVariants, item: IDeal) => void;
  item: IDeal;
}> = ({ type, onAction, item }) => {
  const { t } = useTranslation();

  return (
    <DealActionsWrapper>
      <Button
        variant="secondary"
        className={'buy'}
        onClick={() => onAction(type === 'buy' ? 'sell' : 'buy', item)}
      >
        {type === "buy" ? t("deals.actions.sell") : t("deals.actions.buy")}
      </Button>
    </DealActionsWrapper>
  );
};

const CreateOfferButton: React.FC<{
  item: IDeal,
  isOffer: boolean,
  onAction: (action: ActionHandlerVariants, item: IDeal) => void;
}> = ({ item, onAction, isOffer }) => {
  const { t } = useTranslation();

  return (
    <DealActionsWrapper>
      {item.type === 'sell' && !isOffer && (
        <Button
          className="offer"
          onClick={() => onAction("create", item)}
          variant={'secondary'}
        >
          {t("deals.actions.createOffer")}
        </Button>
      )}
      <Button
        onClick={() => onAction(item.type === "buy" ? 'create' : "block", item)}
        variant="primary"
        className="buy"
      >
        {item.type === "buy" ? t("deals.actions.createOffer") : t("deals.actions.buy")}
      </Button>
    </DealActionsWrapper>
  );
};

const CompleteDealButton: React.FC<{
  item: IDeal;
  onComplete?: (deal: IDeal) => void;
}> = ({ item, onComplete }) => {
  const { t } = useTranslation();

  return (
    <Button onClick={() => onComplete && onComplete(item)} variant="primary">
      {t("deals.actions.completeDeal")}
    </Button>
  );
};

const SellButton: React.FC<{
  item: IDeal;
  onAction: (action: ActionHandlerVariants, item: IDeal) => void;
}> = ({ item, onAction }) => {
  const { t } = useTranslation();

  return (
    <DealActionsWrapper>
      <Button className="buy" onClick={() => onAction('confirmSell', item)} variant="primary">
        {t("deals.actions.sell")}
      </Button>
    </DealActionsWrapper>
  );
};

const ConfirmRejectButtons: React.FC<{
  item: IDeal;
  onAction: (action: ActionHandlerVariants, item: IDeal) => void;
  onOpenChat?: (userId: string) => void;
}> = ({ item, onAction, onOpenChat }) => {
  const { t } = useTranslation();
  const userIdToChat = item.buyer?._id || item.seller?._id || '';
  const chatButton = onOpenChat && userIdToChat ? (
    <button
      onClick={() => onOpenChat(userIdToChat)}
      className='chat-btn'
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        minWidth: '0px',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.5 4.5H9.3M4.5 7.7H7.3M13.3 6.9C13.3 7.82002 13.1059 8.69469 12.7563 9.4853L13.3012 13.2994L10.0326 12.4822C9.10663 13.003 8.038 13.3 6.9 13.3C3.36538 13.3 0.5 10.4346 0.5 6.9C0.5 3.36538 3.36538 0.5 6.9 0.5C10.4346 0.5 13.3 3.36538 13.3 6.9Z" stroke="#05A584" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  ) : null;

  return (
    <StartOrReject className="start-or-reject">
      <StartDeal className="start-deal-desktop">
        <Button onClick={() => onAction("start", item)} variant="primary">
          {t("deals.actions.startDeal")}
        </Button>
        <span>{t("deals.actions.with")}</span>
        <OtcComment isBuyer deal={item} />
        {chatButton}
      </StartDeal>
      <div className="start-deal-mobile">
        <div className="mobile-actions">
          <Button onClick={() => onAction("start", item)} variant="primary">
            {t("deals.actions.startDeal")}
          </Button>
          <RejectButton onClick={() => onAction("reject", item)}>
            {t("deals.actions.reject")}
          </RejectButton>
        </div>
        <div className="deal-with">
          <span>{t("deals.actions.with")}</span>
          <OtcComment isBuyer deal={item} />
          <div className="chat-btn">
            {chatButton}
          </div>

        </div>

      </div>
      <RejectButton className="desktop-reject" onClick={() => onAction("reject", item)}>
        {t("deals.actions.reject")}
      </RejectButton>
    </StartOrReject>
  );
};

const ReserveFundsButton: React.FC<{
  onAction: (action: ActionHandlerVariants, item: IDeal) => void;
  item: IDeal;
}> = ({ onAction, item }) => {
  const { t } = useTranslation();

  return (
    <Button
      onClick={() => onAction("reserve", item)}
      variant="primary"
      className="buy"
    >
      {t("deals.actions.reserveFunds")}
    </Button>
  );
};

const RepeatDealButton: React.FC<{
  onAction: (action: ActionHandlerVariants, item: IDeal) => void;
  item: IDeal;
}> = ({ onAction, item }) => {
  const { t } = useTranslation();

  return (
    <DealActionsWrapper>
      <Button
        variant="secondary"
        className="buy"
        onClick={() => onAction("repeat", item)}
      >
        {t("deals.actions.repeatDeal")}
      </Button>
    </DealActionsWrapper>
  );
};

const AvailableActions: React.FC<{
  type: "buy" | "sell";
  isOffer?: boolean;
  onAction: (action: ActionHandlerVariants, item: IDeal) => void;
  item: IDeal;
}> = ({ type, isOffer, onAction, item }) => {
  const { t } = useTranslation();

  if (isOffer) {
    return (
      <DealActionsWrapper>
        <Button
          variant="secondary"
          className="buy"
          onClick={() => onAction("buy", item)}
        >
          {type === "buy" ? t("deals.actions.buy") : t("deals.actions.sell")}
        </Button>
      </DealActionsWrapper>
    );
  }

  return (
    <DealActionsWrapper>
      <Button
        variant="secondary"
        className="contact"
        onClick={() => onAction("create", item)}
      >
        {t("deals.actions.createOffer")}
      </Button>
    </DealActionsWrapper>
  );
};

const LeaveReviewButton: React.FC<{
  item: IDeal;
  onAction: (action: ActionHandlerVariants, item: IDeal) => void;
}> = ({ item, onAction }) => {
  const { t } = useTranslation();

  return (
    <DealActionsWrapper>
      <Button onClick={() => onAction("review", item)} variant="primary">
        {t("deals.actions.leaveReview")}
      </Button>
    </DealActionsWrapper>
  );
};

const DetailsP2PButton: React.FC<{
  onAction: (action: P2PActionHandlerVariants, item: IDeal) => void;
  item: IDeal;
}> = ({ onAction, item }) => {
  const { t } = useTranslation();

  return (
    <DealActionsWrapper>
      <Button
        onClick={() => onAction("details", item)}
        variant="primary"
        className="buy"
      >
        {t("deals.actions.details")}
      </Button>
    </DealActionsWrapper>
  );
};

const OpenChatWithSupportButton: React.FC<{
  onOpenChat: (chatRef: string) => void;
  chatId?: string;
}> = ({ onOpenChat, chatId }) => {
  const { t } = useTranslation();

  return (
    <DealActionsWrapper>
      <Button
        onClick={() => {
          if (chatId) {
            onOpenChat(`chat:${chatId}`);
          }
        }}
        variant="secondary"
        disabled={!chatId}
      >
        {t("deals.actions.chatWithSupport")}
      </Button>
    </DealActionsWrapper>
  );
};

// ============================================================================
// Hook Interface
// ============================================================================

interface UseDealActionsProps {
  item: IDeal;
  userData?: IUser;
  type: "buy" | "sell";
  isOffer?: boolean;
  isMyDealProps?: boolean;
  isP2p?: boolean;
  confirmCompleteDeal?: (deal: IDeal) => Promise<void>;
  dealActionsHandler: (actionType: ActionHandlerVariants, item: IDeal) => Promise<void>;
  dealP2PActionsHandler?: (actionType: P2PActionHandlerVariants, item: IDeal) => Promise<void>;
  onOpenChat?: (userId: string) => void;
}

interface DealStatusFlags {
  isEnded: boolean;
  isTimeEnded: boolean;
  isReserveAccess: boolean;
  isCompleteDealAccess: boolean;
  isMyDeal: boolean;
  isSellerDeal: boolean;
  isParticipant: boolean;
  isAlreadyBlocked: boolean;
  isNeedConfirm: boolean;
  isAvailable: boolean;
  isReviewAccess: boolean;
  isAppealSubmitted: boolean;
}

// ============================================================================
// Main Hook
// ============================================================================

export const useDealActions = ({
  item,
  userData,
  type,
  isOffer,
  isMyDealProps,
  isP2p = false,
  confirmCompleteDeal,
  dealActionsHandler,
  dealP2PActionsHandler,
  onOpenChat,
}: UseDealActionsProps) => {

  // Calculate deal status flags
  const dealStatus = useMemo((): DealStatusFlags => {
    const isEnded = item.status === "ended";
    const isClosedStatus =
      item.status === "forced-termination" ||
      String(item.status) === "closed" ||
      !!item.isCompleteByAdmin;
    const isTimeEnded = new Date(item.date).getTime() < new Date().getTime() && item.status === "waiting";
    const isMyDeal = item?.creator?.wallet === userData?.wallet;
    const isSellerDeal = item?.seller?.wallet === userData?.wallet;
    const isParticipant =
      isMyDeal ||
      isSellerDeal ||
      item?.buyer?.wallet === userData?.wallet;
    const isAlreadyBlocked = item.status === "blocked";

    return {
      isEnded,
      isTimeEnded,
      isReserveAccess: item?.buyer?.wallet === userData?.wallet && item.status === "started" && !isTimeEnded,
      isCompleteDealAccess:
        item?.buyer?.wallet === userData?.wallet &&
        !!item.isReservedFunds &&
        item.status === "started" &&
        !isTimeEnded &&
        !isEnded &&
        !isClosedStatus,
      isMyDeal,
      isSellerDeal,
      isParticipant,
      isAlreadyBlocked,
      isNeedConfirm: isAlreadyBlocked && !isTimeEnded && isMyDeal,
      isAvailable: item.status === 'waiting' && !isEnded && !isTimeEnded && !isMyDeal,
      isReviewAccess: checkReviewAccess(item, userData?._id || "") && isParticipant,
      isAppealSubmitted: !!item.isAppeal,
    };
  }, [item, userData]);

  const mainDealButton = useMemo(() => {
    // Early returns for simple cases
    if (isP2p && dealStatus.isTimeEnded) return null;
    const isEndedOrClosed =
      item.status === "ended" ||
      item.status === "forced-termination" ||
      String(item.status) === "closed" ||
      !!item.isCompleteByAdmin;

    // P2P specific logic
    if (isP2p) {
      // Show support chat button if appeal is submitted
      if (dealStatus.isAppealSubmitted && onOpenChat) {
        return (
          <OpenChatWithSupportButton
            onOpenChat={onOpenChat}
            chatId={item.appeal?.supportChatId || item.chatId}
          />
        );
      }

      if (isMyDealProps && isEndedOrClosed) {
        return <RepeatDealButton onAction={dealActionsHandler} item={item} />;
      }

      if (!dealStatus.isMyDeal && item.status === "waiting") {
        return <P2PButtons type={type} onAction={dealActionsHandler} item={item} />;
      }
      if (dealStatus.isSellerDeal && item.status === "started") {
        return <DetailsP2PButton onAction={dealP2PActionsHandler!} item={item} />;
      }
      if (dealStatus.isMyDeal && item.status === "started") {
        return <DetailsP2PButton onAction={dealP2PActionsHandler!} item={item} />;
      }

      if (dealStatus.isReserveAccess) {
        return <DetailsP2PButton onAction={dealP2PActionsHandler!} item={item} />;
      }

      if (dealStatus.isNeedConfirm) {
        return <ConfirmRejectButtons item={item} onAction={dealActionsHandler} onOpenChat={onOpenChat} />;
      }

      if (dealStatus.isReviewAccess) {
        return <DetailsP2PButton onAction={dealP2PActionsHandler!} item={item} />;
      }

      return
    }

    // OTC specific logic
    if (isOffer && dealStatus.isAvailable && !item.dealId) {
      return <SellButton item={item} onAction={dealActionsHandler} />;
    }

    if (item.status === "waiting" && !dealStatus.isTimeEnded && !dealStatus.isMyDeal && !(isOffer && item.type === "buy")) {
      return <CreateOfferButton isOffer={!!isOffer} item={item} onAction={dealActionsHandler} />;
    }

    if (dealStatus.isCompleteDealAccess) {
      return <CompleteDealButton item={item} onComplete={confirmCompleteDeal} />;
    }

    if (dealStatus.isNeedConfirm) {
      return <ConfirmRejectButtons item={item} onAction={dealActionsHandler} onOpenChat={onOpenChat} />;
    }

    if (dealStatus.isReserveAccess) {
      return <ReserveFundsButton onAction={dealActionsHandler} item={item} />;
    }

    if (isMyDealProps && isEndedOrClosed) {
      return <RepeatDealButton onAction={dealActionsHandler} item={item} />;
    }

    if (dealStatus.isReviewAccess) {
      return <LeaveReviewButton item={item} onAction={dealActionsHandler} />;
    }

    if ((type === "sell" || type === "buy") && !isOffer && dealStatus.isAvailable) {
      return <AvailableActions type={type} isOffer={isOffer} onAction={dealActionsHandler} item={item} />;
    }

    return null;
  }, [
    item,
    dealStatus,
    type,
    isOffer,
    isMyDealProps,
    isP2p,
    dealActionsHandler,
    confirmCompleteDeal,
    dealP2PActionsHandler
  ]);

  return {
    isEnded: dealStatus.isEnded,
    isTimeEnded: dealStatus.isTimeEnded,
    isReviewAccess: dealStatus.isReviewAccess,
    mainDealButton,
  };
};
