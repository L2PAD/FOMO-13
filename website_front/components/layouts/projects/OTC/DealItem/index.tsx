import React, { FC, useState, useMemo, memo } from "react";
import { IDeal, IUser } from "../../../../../types/global_types";
import { ActionHandlerVariants, P2PActionHandlerVariants } from "../DealsList";
import { DealHighlightWrapper } from "./styles";
import { useDealActions } from "../../../../../hooks/useDealActions";
import MyDealDetails from "./MyDealDetails";
import DealCard from "./DealCard";

interface IProps {
  isVisiblePromote?: boolean;
  item: IDeal;
  isOffer?: boolean;
  isFirstOffer?: boolean;
  hideMainActionButton?: boolean;
  userData?: IUser;
  type: "buy" | "sell";
  isMyDealProps?: boolean;
  isP2p?: boolean;
  searchValue: string;
  setIsVisiblePromote?: (visible: boolean) => void;
  confirmCompleteDeal?: (deal: IDeal) => Promise<void>;
  dealActionsHandler: (actionType: ActionHandlerVariants, item: IDeal) => Promise<void>;
  dealP2PActionsHandler: (actionType: P2PActionHandlerVariants, item: IDeal) => Promise<void>;
  onChatOpen?: (userId: string) => void;
}

const useDealState = (props: IProps) => {
  const [showDetailsCard, setShowDetailsCard] = useState<boolean>(false);

  const handleOpenChat = (userId: string) => {
    if (props.onChatOpen) {
      props.onChatOpen(userId);
    } else {
      props.dealActionsHandler('chat', props.item);
    }
  };

  const dealActions = useDealActions({
    item: props.item,
    userData: props.userData,
    type: props.type,
    isOffer: props.isOffer,
    isMyDealProps: props.isMyDealProps,
    isP2p: props.isP2p || false,
    confirmCompleteDeal: props.confirmCompleteDeal,
    dealActionsHandler: props.dealActionsHandler,
    dealP2PActionsHandler: props.dealP2PActionsHandler,
    onOpenChat: handleOpenChat,
  });

  const isRealAsset = Boolean(props.item.isRealAsset && props.item.smartContract);

  return {
    showDetailsCard,
    setShowDetailsCard,
    dealActions,
    isRealAsset,
  };
};

const useMemoizedProps = (props: IProps, state: ReturnType<typeof useDealState>) => {
  const {
    item,
    isOffer,
    isFirstOffer,
    userData,
    dealActionsHandler,
    isP2p = false,
    hideMainActionButton = false
  } = props;

  const {
    dealActions: { isEnded, isTimeEnded, isReviewAccess, mainDealButton },
    isRealAsset
  } = state;

  const dealCardProps = useMemo(() => ({
    item,
    isOffer,
    isFirstOffer,
    userData,
    dealActionsHandler,
    isP2p,
    isRealAsset,
    isEnded,
    isTimeEnded,
    isReviewAccess,
    mainDealButton,
    hideMainActionButton,
  }), [
    item,
    isOffer,
    isFirstOffer,
    userData,
    dealActionsHandler,
    isP2p,
    isRealAsset,
    isEnded,
    isTimeEnded,
    isReviewAccess,
    mainDealButton,
    hideMainActionButton
  ]);

  const myDealDetailsProps = useMemo(() => ({
    item,
    userData,
    dealActionsHandler,
    mainDealButton,
  }), [
    item,
    userData,
    dealActionsHandler,
    mainDealButton
  ]);

  return { dealCardProps, myDealDetailsProps };
};

const DealItem: FC<IProps> = memo((props) => {
  const { isMyDealProps } = props;
  const state = useDealState(props);
  const { dealCardProps, myDealDetailsProps } = useMemoizedProps(props, state);
  const { showDetailsCard, setShowDetailsCard } = state;

  return (
    props.isVisiblePromote
      ?
      <>
        <DealHighlightWrapper id={`item-${props.item._id}`}>
          <DealCard {...dealCardProps} searchValue={props.searchValue} setIsVisiblePromote={props.setIsVisiblePromote} />
        </DealHighlightWrapper>
        {isMyDealProps && (
          <MyDealDetails
            {...myDealDetailsProps}
            showDetailsCard={showDetailsCard}
            setShowDetailsCard={setShowDetailsCard}
          />
        )}
      </>
      :
      <></>
  );
});

DealItem.displayName = 'DealItem';

export default DealItem;