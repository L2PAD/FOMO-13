import React, { FC, useContext, useEffect, useState } from "react";
import { useQuery } from "react-query";
import { P2PDealsContext } from "..";
import fetchDeals from "../../../../../http/otc/fetchDeals";
import ContactWithPerson from "../../modals/ContactWithPersonModal";
import { IDeal, IUser } from "../../../../../types/global_types";
import P2PDealItem from "../DealItem";
import { AuthContext, LoadingContext } from "../../../../global/Layout";
// import {
//   purchaseItem,
//   purchaseItemUsd,
//   setAllowanceForMint,
//   setAllowanceForToken,
// } from "../../../../../smart/smartP2P";
import dealAction from "../../../../../http/otc/dealAction";
import { toast } from "react-toastify";
import { ActionHandlerVariants } from "../../OTC/DealsList";
import ListingNewTokens from "../../modals/ListingNewTokens";
import Loader from "../../../../global/loader";
import EmptyList from "../../../../global/EmptyList";
import ShareModal from "../../../../global/modals/ShareModal";
import ConfirmDealModal from "../../modals/ConfirmDealModal";
import LeaveFeedback from "../../../../global/modals/LeaveFeedback";
import { Swiper, SwiperSlide } from "swiper/react";
import { MobileSwapsSlider } from "../styles";
import { statusesReverse } from "../../../../../utils/otcConstants";

export const buildQueryString = (
  filters: any,
  sortField: string,
  limit: number,
  offset: number,
  isMyDeals?: boolean
) => {
  const params: any = {
    limit,
    offset,
  };

  if (filters.serviceType) {
    params.serviceType = filters.serviceType;
  }
  if (filters.userStatus) {
    params.userStatus = filters.userStatus;
  }
  if (filters.movingTokens) {
    params.movingTokens = filters.movingTokens;
  }
  if (filters.risk) {
    params.risk = filters.risk;
  }
  if (filters.searchValue) {
    params.searchValue = filters.searchValue;
  }
  if (filters.startDate) {
    params.startDate = filters.startDate.toISOString();
  }
  if (filters.endDate) {
    params.endDate = filters.endDate.toISOString();
  }
  if (filters.priceEth) {
    params.minPriceEth = filters.priceEth[0];
    params.maxPriceEth = filters.priceEth[1];
  }
  if (filters.priceUsdc) {
    params.minPriceUsdc = filters.priceUsdc[0];
    params.maxPriceUsdc = filters.priceUsdc[1];
  }
  if (filters.amount) {
    params.minAmount = filters.amount[0];
    params.maxAmount = filters.amount[1];
  }
  if (filters.rating) {
    params.minRating = filters.rating[0];
    params.maxRating = filters.rating[1];
  }
  if (filters.tickers) {
    params.tickers = filters.tickers;
  }
  if (sortField) {
    params.sortField = sortField;
  }
  if (isMyDeals) {
    params.userDeals = "true";
  }

  if (filters.dealStatus?.length) {
    params.dealStatus = filters.dealStatus.map(
      (
        item:
          | "Available"
          | "Wait for confirm"
          | "Started"
          | "Funds reserved"
          | "Ended"
      ) => {
        return statusesReverse[item];
      }
    );
  }

  if (filters.activeTab && filters.activeTab !== "All Swaps") {
    filters.subsection = filters.activeTab;
  }

  const queryString = new URLSearchParams(params).toString();
  return `?${queryString}`;
};

interface IProps {
  type?: "buy" | "sell" | "all";
  limit: number;
  setIsCreateDeal: any;
  isCreateDeal: boolean;
  searchValue: string;
  sortValue: string;
  filters: any;
  isMobile?: boolean; // Add this prop
}

const P2PDeals: FC<IProps> = ({
  limit,
  setIsCreateDeal,
  isCreateDeal,
  searchValue,
  sortValue,
  filters,
  type,
  isMobile = false, // Default to false
}) => {
  const { userData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const { activeTab } = useContext(P2PDealsContext);
  const [queryString, setQueryString] = useState<string>("");
  const { data, refetch, isLoading } = useQuery(["p2p", queryString], () => {
    return fetchDeals("all", queryString, "p2p");
  });
  const deals: Array<IDeal> = data?.deals || [];
  const [shareModal, setShareModal] = useState(false);
  const [dealModal, setDealModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [dealData, setDealData] = useState<IDeal | null>(null);
  const [contactData, setContactData] = useState<IUser | null>(null);
  const [isApprove, setIsApprove] = useState<boolean>(false);
  const [isBlockModal, setIsBlockModal] = useState<boolean>(false);
  const [isFinishModal, setIsFinishModal] = useState<boolean>(false);
  const [isReviewModal, setIsReviewModal] = useState<boolean>(false);
  const [openOffers, setOpenOffers] = useState<Array<string>>([]);

  const approveUsd = async (): Promise<void> => {
    // loadingStateHandler(true);

    // await setAllowanceForMint(dealData?.price || 0);
    // setIsApprove(true);

    // loadingStateHandler(false);
  };

  const confirmBuy = async (): Promise<void> => {
    if (!dealData) return;

    loadingStateHandler(true);

    // const { success } =
    //   dealData?.ticker?.toLowerCase() === "eth"
    //     ? await purchaseItem(dealData.dealId, dealData.price)
    //     : await purchaseItemUsd(dealData.dealId);

    // if (success) {
    //   await dealAction("reserve", dealData._id);
    //   toast.success(
    //     <div>
    //       <h3>Fine!</h3>
    //       <p>
    //         An SMS was sent to the seller stating that you have deposited money
    //         in the safe and you can start providing services, you will be
    //         notified when the time comes to accept the services.
    //       </p>
    //     </div>
    //   );
    //   refetch();
    // } else {
    //   toast.error(
    //     <div>
    //       <h3>Error!</h3>
    //       <p>Not enough funds in your wallet or the deal is already closed</p>
    //     </div>
    //   );
    // }

    // setDealModal(false);
    // setDealData(null);

    loadingStateHandler(false);
  };

  const confirmBlock = async (): Promise<void> => {
    if (!dealData) return;

    loadingStateHandler(true);

    const { isSuccess } = await dealAction("block", dealData._id);

    if (isSuccess) {
      toast.success(
        <div>
          <h3>Your offer has been sent!!</h3>
          <p>Wait for confirmation from the seller</p>
        </div>
      );
      refetch();
    } else {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>Not enough funds in your wallet or the deal is already closed</p>
        </div>
      );
    }

    setIsBlockModal(false);
    setDealData(null);

    loadingStateHandler(false);
  };

  const confirmFinish = async (deal: IDeal) => {
    loadingStateHandler(true);

    await dealAction("close", deal._id);
    refetch();

    loadingStateHandler(false);
  };

  const blockActionHandler = async (
    action: "confirm" | "reject",
    item: IDeal
  ): Promise<void> => {
    loadingStateHandler(true);

    if (action === "confirm") {
      // await setAllowanceForToken(item?.amount || 0, item?.tokenAddress || "");
    }

    const { isSuccess } = await dealAction("block", `${action}/${item._id}`);

    if (isSuccess) {
      toast.success(
        <div>
          <h3>
            {action === "confirm" ? "Your offer has been sent!" : "Success!"}
          </h3>
          <p>You have cancelled the offer!</p>
        </div>
      );
      refetch();
    } else {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>Not enough funds in your wallet or the deal is already closed</p>
        </div>
      );
    }

    setDealData(null);

    loadingStateHandler(false);
  };

  const selectFeedbackAction = async (
    action: "like" | "dislike",
    text: string
  ): Promise<void> => {
    loadingStateHandler(true);

    const { isSuccess } = await dealAction(
      "feedback",
      `${action}/${dealData?._id}`,
      "PUT",
      { text }
    );

    if (isSuccess) {
      toast.success(
        <div>
          <h3>Thanks for leaving a comment!</h3>
        </div>
      );
      refetch();
    }

    setIsReviewModal(false);
    loadingStateHandler(false);
  };

  const updateOpenOffers = (offer: IDeal): void => {
    setOpenOffers((prev: Array<string>) => {
      if (prev.includes(offer._id)) {
        return prev.filter((id: string) => id !== offer._id);
      }

      return [...prev, offer._id];
    });
  };

  const updateDealReaction = async (
    item: IDeal,
    action: "like" | "dislike"
  ): Promise<void> => {
    await dealAction(`reaction`, `${action}/${item._id}`, "PATCH");
    refetch();
  };

  const dealActionsHandler = async (
    actionType: ActionHandlerVariants,
    item: IDeal
  ): Promise<void> => {

    type ActionMethods = Partial<Record<ActionHandlerVariants, () => void>>;

    const actionMethods: ActionMethods = {
      block: () => {
        setIsBlockModal(true);
        setDealData(item);
      },
      start: () => blockActionHandler("confirm", item),
      reject: () => blockActionHandler("reject", item),
      finish: () => {
        setIsFinishModal(true);
        setDealData(item);
      },
      contact: () => {
        setContactModal(true);
        setContactData(item.creator);
      },
      share: () => setShareModal(true),
      create: () => {
        setDealData(item);
        setIsCreateDeal(true);
      },
      reserve: () => {
        setDealModal(true);
        setDealData(item);
      },
      review: () => {
        setIsReviewModal(true);
        setDealData(item);
      },
      like: () => {
        updateDealReaction(item, "like");
      },
      dislike: () => {
        updateDealReaction(item, "dislike");
      },
      buy: () => {
        setDealModal(true);
        setDealData(item);
      },
      repeat: () => {
        setDealData(item);
        setIsCreateDeal(true);
      },
    };

    const method: any = actionMethods[actionType];

    method();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setQueryString(
        buildQueryString(
          { ...filters, searchValue, activeTab },
          sortValue,
          10,
          (limit - 1) * 10
        )
      );
    }, 600);

    return () => clearTimeout(timer);
  }, [filters, searchValue, sortValue, limit, activeTab]);

  if (isLoading) return <Loader isVisible />;

  // Render the deals list with conditional mobile view
  return (
    <>
      {isMobile ? (
        <MobileSwapsSlider>
          <Swiper
            spaceBetween={15}
            slidesPerView={"auto"}
            centeredSlides={false}
            className="swaps-swiper"
          >
            {deals.map((item) => (
              <SwiperSlide key={item._id}>
                <P2PDealItem
                  key={item._id}
                  item={item}
                  userData={userData}
                  dealActionsHandler={async (actionType: any) =>
                    dealActionsHandler(actionType, item)
                  }
                  confirmCompleteDeal={confirmFinish}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </MobileSwapsSlider>
      ) : (
        deals.map((item: IDeal) => {
          return (
            <P2PDealItem
              key={item._id}
              item={item}
              userData={userData}
              dealActionsHandler={async (actionType: any) =>
                dealActionsHandler(actionType, item)
              }
              confirmCompleteDeal={confirmFinish}
            />
          );
        })
      )}
      {isCreateDeal ? (
        <ListingNewTokens onClose={() => setIsCreateDeal(false)} />
      ) : (
        <></>
      )}
      {shareModal && (
        <ShareModal
          onClose={() => setShareModal(false)}
          link="/utility/otc"
        />
      )}
      {dealModal ? (
        <ConfirmDealModal
          type="reserve"
          isApprove={isApprove}
          isApproveNeed={dealData?.ticker === "usd" && !isApprove}
          onConfirm={
            !isApprove && dealData?.ticker === "usd" ? approveUsd : confirmBuy
          }
          onClose={() => setDealModal(false)}
        />
      ) : (
        <></>
      )}
      {isBlockModal ? (
        <ConfirmDealModal
          type="block"
          isApprove={isApprove}
          isApproveNeed={false}
          onConfirm={confirmBlock}
          onClose={() => setIsBlockModal(false)}
        />
      ) : (
        <></>
      )}
      {contactModal ? (
        <ContactWithPerson
          userData={contactData}
          onClose={() => setContactModal(false)}
          title={`Contact with ${type === "buy" ? "buyer" : "seller"}`}
        />
      ) : (
        <></>
      )}
      {isReviewModal ? (
        <LeaveFeedback
          confirmSendReview={selectFeedbackAction}
          onClose={() => setIsReviewModal(false)}
        />
      ) : (
        <></>
      )}
    </>
  );
};

export default P2PDeals;
