import React, { FC, useMemo, useState } from "react";
import ConfirmDealModal from "../../modals/ConfirmDealModal";
import ContactWithPerson from "../../modals/ContactWithPersonModal";
import ShareModal from "../../../../global/modals/ShareModal";
import { IDeal } from "../../../../../types/global_types";
import DealItem from "../DealItem";
import EmptyList from "../../../../global/EmptyList";
import LeaveFeedback from "../../../../global/modals/LeaveFeedback";
import {
  ContentWrapper,
  OffersList,
  OffersButton,
  DealItemsList,
} from "./styles";
import { PaginationWrapper } from "../styles";
import Pagination from "../../../../global/Pagintaion";
import PlaceholderTable from "../../../../global/common/PlaceholderTable";
import { ChevronDown } from "lucide-react";
import P2PBuyModal from "../../modals/P2PBuyModal";
import { IBuyModalStep } from "../../modals/P2PBuyModal/types";
import CreateOfferModal from "../../modals/CreateOfferModal";
import { useDealsList } from "../../../../../hooks/useDealsList";
import CreateDealModal from "../../modals/CreateDealModal";
import CreateP2PDealModalWithStatus from "../../modals/CreateP2PDealModal";
import { SortP2PType } from "../../../../global/Filter/p2p_settings";
import ChatModal from "../../FomoChat/ChatModal";
import Placeholder from "../../../../global/common/Placeholder";

export type DealSortTypes = 'newest' | 'oldest' | 'reactions-desc' | 'all'

export type P2PActionHandlerVariants =
  | "block"
  | "start"
  | "details"

export type ActionHandlerVariants =
  | "block"
  | "start"
  | "reject"
  | "finish"
  | "contact"
  | "share"
  | "create"
  | "reserve"
  | "review"
  | "like"
  | "dislike"
  | "buy"
  | "repeat"
  | "sell"
  | "pin"
  | "confirmSell"
  | "unpin"
  | "chat";
;

export interface ISettingsP2P {
  transactionAmount: string
  selectedPaymentMethod: string[]
  selectedCurrency: string
  p2pFilterTabs: string[]
  filterValue: string
  sortBy: SortP2PType
}

interface IProps {
  settingsP2P: ISettingsP2P;
  searchValue: string;
  sortBy?: DealSortTypes
  type: "buy" | "sell" | "all";
  isMyDeals?: boolean;
  activeTab: any;
  limit: number;
  isCreateDeal: boolean;
  isP2p?: boolean;
  filters: any
  pageVariant: 'otc' | 'p2p'
  setIsCreateDeal: (value: boolean) => void;
  setLimit: (value: number) => void;
}

export const DEALS_PAGE_VALUE = 10

const DealsList: FC<IProps> = ({
  settingsP2P,
  sortBy,
  type,
  isMyDeals,
  activeTab,
  limit,
  filters,
  isCreateDeal,
  pageVariant,
  isP2p,
  searchValue,
  setLimit,
  setIsCreateDeal,
}) => {
  const {
    deals,
    isLoading,
    data,

    dealData,
    p2pDealData,
    contactData,
    isBlockModal,
    isFinishModal,
    isReviewModal,
    openOffers,
    buyModal,
    offerModal,
    contactModal,
    shareModal,
    dealModal,
    isApprove,
    isChatModal,
    isRepeatCreateDealModal,
    promotedLoading,
    promotedDeal,
    buyModalStep,
    chatUserId,
    chatId,

    refetchPromote,
    setDealData,
    setP2PDealData,
    setIsBlockModal,
    setIsFinishModal,
    setIsReviewModal,
    setBuyModal,
    setBuyModalStep,
    setOfferModal,
    setContactModal,
    setShareModal,
    setDealModal,
    setIsRepeatCreateDealModal,

    confirmBuy,
    confirmP2PReserveFunds,
    confirmP2PMarkPayment,
    confirmBlock,
    selectFeedbackAction,
    updateOpenOffers,
    approveUsd,

    getDealItemProps,
    refetch,
    setIsChatModal,
    setChatUserId,
    p2pDealActionsHandler,
  } = useDealsList({
    settingsP2P,
    searchValue,
    sortBy,
    type,
    isMyDeals,
    activeTab,
    limit,
    filters,
    isP2p,
    setLimit,
  });

  const pagination = () =>
    data?.deals?.length ? (
      <PaginationWrapper>
        <Pagination
          page={limit}
          total={data.total || 0}
          limit={(limit - 1) * 10 + data.deals.length}
          onePageLimit={10}
          totalPage={Math.ceil(data.total / 10)}
          onChange={(value: number) => {
            if (typeof window !== "undefined") {
              const navWrapper = document.getElementById("otc-nav-wrapper");
              if (navWrapper) {
                navWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }
            setLimit(value);
          }}
        />
      </PaginationWrapper>
    ) : (
      <></>
    );
  const [isVisiblePromoteP2P, setIsVisiblePromoteP2P] = useState<boolean>(true);
  const [isVisiblePromoteOTC, setIsVisiblePromoteOTC] = useState<boolean>(true);
  const isShareMode = !!filters?.dealId;
  const repeatDealInitial = isRepeatCreateDealModal ? dealData : null;
  const isOtcCreateModalVisible =
    pageVariant === "otc" && (isCreateDeal || isRepeatCreateDealModal);
  const isP2PCreateModalVisible =
    pageVariant === "p2p" && (isCreateDeal || isRepeatCreateDealModal);

  const handleCloseCreateModal = () => {
    setIsCreateDeal(false);
    setIsRepeatCreateDealModal(false);
    setDealData(null);
  };

  const dealItemProps = useMemo(() => getDealItemProps(!!isMyDeals), [getDealItemProps, isMyDeals]);

  return (
    <div id='otc-nav-wrapper'>
      <ContentWrapper>
        {!isMyDeals && !isShareMode ? (
          promotedLoading ? (
            <Placeholder height="241px" />
          ) : (promotedDeal ? (
            <DealItem
              dealP2PActionsHandler={p2pDealActionsHandler}
              hideMainActionButton
              isVisiblePromote={pageVariant === 'p2p' ? isVisiblePromoteP2P : isVisiblePromoteOTC}
              setIsVisiblePromote={pageVariant === 'p2p' ? setIsVisiblePromoteP2P : setIsVisiblePromoteOTC}
              {...dealItemProps} item={promotedDeal} type={promotedDeal.type} searchValue={searchValue} />
          ) : null)
        ) : null}
        {isLoading ? (
          <PlaceholderTable height="241px" />
        ) : deals.length ? (
          <DealItemsList>
            {deals.map((item: IDeal) => {
              return (
                <React.Fragment key={item._id}>
                  <DealItem
                    dealP2PActionsHandler={p2pDealActionsHandler}
                    {...dealItemProps} isVisiblePromote={true} item={{ ...item, isSponsored: false }} type={item.type} searchValue={searchValue} />
                  {!isMyDeals && item?.offersList?.length ? (
                    <>
                      {openOffers.includes(item._id) && (
                        <OffersList>
                          {item.offersList.map(
                            (dealItem: IDeal, index: number) => {
                              return (
                                <DealItem
                                  dealP2PActionsHandler={p2pDealActionsHandler}
                                  isVisiblePromote={true}
                                  key={dealItem._id}
                                  isOffer={true}
                                  isFirstOffer={index === 0}
                                  {...dealItemProps}
                                  item={dealItem}
                                  type={dealItem.type}
                                  searchValue={searchValue}
                                />
                              );
                            }
                          )}
                        </OffersList>
                      )}

                      <OffersButton
                        onClick={() => updateOpenOffers(item)}
                        offerType={item.type}
                        isOpen={openOffers.includes(item._id)}
                      >
                        {openOffers.includes(item._id)
                          ? "Hide Offers"
                          : "View Offers"}
                        <ChevronDown width={12} height={12} />
                      </OffersButton>
                    </>
                  ) : null}
                </React.Fragment>
              );
            })}
          </DealItemsList>
        ) : (
          <>
            <br />
            <EmptyList
              gap={20}
            />
            <br />
          </>
        )}
        {
          Number(data?.total) > DEALS_PAGE_VALUE
            ?
            pagination()
            :
            <></>
        }
      </ContentWrapper>
      <ShareModal
        activeTab={activeTab}
        data={dealData}
        section={isP2p ? "p2p" : "otc"}
        onClose={() => setShareModal(false)}
        link={``}
        isVisible={shareModal}
      />
      <ConfirmDealModal
        isVisible={dealModal}
        type="reserve"
        isApprove={isApprove}
        isApproveNeed={dealData?.ticker === "usd" && !isApprove}
        onConfirm={
          !isApprove && dealData?.ticker === "usd" ? approveUsd : confirmBuy
        }
        onClose={() => setDealModal(false)}
      />
      <ConfirmDealModal
        isVisible={isBlockModal}
        type="block"
        isApprove={isApprove}
        isApproveNeed={false}
        onConfirm={confirmBlock}
        onClose={() => setIsBlockModal(false)}
      />
      <ContactWithPerson
        isVisible={contactModal}
        userData={contactData}
        onClose={() => setContactModal(false)}
        title={`Contact the ${type === "sell" ? "Buyer" : "Seller"}`}
      />
      <LeaveFeedback
        isVisible={isReviewModal}
        confirmSendReview={selectFeedbackAction}
        onClose={() => setIsReviewModal(false)}
      />
      <P2PBuyModal
        deal={p2pDealData}
        initialStep={buyModalStep as IBuyModalStep}
        isVisible={buyModal}
        refetchDeals={refetch}
        onReserveFunds={confirmP2PReserveFunds}
        onMarkPayment={confirmP2PMarkPayment}
        onSubmitFeedback={(action, text) => selectFeedbackAction(action, text, p2pDealData?._id)}
        onClose={() => {
          setBuyModal(false);
          setBuyModalStep('');
          setP2PDealData(null);
        }}
      />
      <CreateOfferModal
        dealDataInitial={dealData}
        isVisible={offerModal}
        refetchDeals={refetch}
        onClose={() => {
          setOfferModal(false);
          setDealData(null)
        }}
      />
      <CreateDealModal
        isVisible={isOtcCreateModalVisible}
        repeatDealInitial={repeatDealInitial}
        refetchDeals={refetch}
        onClose={handleCloseCreateModal}
      />
      <CreateP2PDealModalWithStatus
        isVisible={isP2PCreateModalVisible}
        repeatDealInitial={repeatDealInitial}
        refetchDeals={refetch}
        onClose={handleCloseCreateModal}
      />
      <ChatModal
        initialUserId={chatUserId || dealData?.creator?._id}
        initialChatId={chatId}
        isVisible={isChatModal}
        setIsVisible={setIsChatModal}
      />
    </div>
  );
};

export default DealsList;
