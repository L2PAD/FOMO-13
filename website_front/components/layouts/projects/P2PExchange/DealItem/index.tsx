import React, { FC, useState } from "react";
import Image from "next/image";
import OtcComment from "../../../../global/common/OtcComment";
import { IDeal, IReview, IUser } from "../../../../../types/global_types";
import OtcLike from "../../../../global/Icons/OtcLike";
import OtcDislike from "../../../../global/Icons/OtcDislike";
import Button from "../../../../global/common/Button";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { ShareWrapper } from "../../OTC/Market/styles";
import RedFlag from "../../../../global/RedFlag";
import BuyIcon from "../../../../../assets/icons/otc/buy-item.svg";
import SellIcon from "../../../../../assets/icons/otc/sell-item.svg";
import BlockedIcon from "../../../../../assets/icons/otc/blocked.svg";
import { ShareIcon } from "../../../../global/Icons";
import { DefaultActionWrapper } from "../../OTC/DealsList/styles";
import { ActionHandlerVariants } from "../../OTC/DealsList";
import DescriptionComponent from "../../../../global/common/DescriptionComponent";
import {
  CommentText,
  DealActions,
  DealColumn,
  DealDetails,
  DealDetailsItem,
  DealIconWrapper,
  DealInfo,
  DealName,
  DealStatusWrapper,
  Wrapper,
  DealButtons,
  DealRightColumn,
  DealRightHeader,
  StartDeal,
  StartOrReject,
  RejectButton,
  DescriptionStatus,
  DealReviewMessage,
  DealActionsWrapper,
  DealRisk,
  RiskValue,
} from "./styles";
import moment from "moment";
import sliceAddress from "../../../../../helpers/sliceAddress";
import {
  statuses,
  StatusesDescription,
  StatusesIcons,
} from "../../../../../utils/otcConstants";

interface IProps {
  item: IDeal;
  isOffer?: boolean;
  isFirstOffer?: boolean;
  userData?: IUser;
  dealActionsHandler: (
    actionType: ActionHandlerVariants,
    item: IDeal
  ) => Promise<void>;
  confirmCompleteDeal?: (deal: IDeal) => Promise<void>;
  closeOffers?: () => void;
}

const checkReviewAccess = (deal: IDeal, userId: string): boolean => {
  return (
    !deal.creator?.reviewLikes?.find((item: IReview) => {
      return item.userId === userId && item.dealId === deal._id;
    }) &&
    !deal.creator?.reviewDislikes?.find((item: IReview) => {
      return item.userId === userId && item.dealId === deal._id;
    }) &&
    !deal?.buyer?.reviewLikes?.find((item: IReview) => {
      return item.userId === userId && item.dealId === deal._id;
    }) &&
    !deal?.buyer?.reviewDislikes?.find((item: IReview) => {
      return item.userId === userId && item.dealId === deal._id;
    }) &&
    deal.status === "ended"
  );
};

const P2PDealItem: FC<IProps> = ({
  item,
  isOffer,
  isFirstOffer,
  userData,
  confirmCompleteDeal,
  dealActionsHandler,
  closeOffers,
}) => {
  const [isStatusHover, setIsStatusHover] = useState<boolean>(false);
  const isEnded: boolean = item.status === "ended";
  const isTimeEnded: boolean =
    new Date(item.date).getTime() < new Date().getTime() &&
    item.status === "waiting";
  const isReserveAccess: boolean =
    item?.buyer?.wallet === userData?.wallet &&
    item.status === "started" &&
    !isTimeEnded;
  const isCompleteDealAccess: boolean =
    item?.buyer?.wallet === userData?.wallet &&
    !!item.isReservedFunds &&
    !isTimeEnded &&
    !isEnded;
  const isMyDeal: boolean =
    item?.creator?.wallet?.toLowerCase() === userData?.wallet?.toLowerCase();
  const isAlreadyBlocked: boolean = item.status === "blocked";
  const isNeedConfrim: boolean = isAlreadyBlocked && !isTimeEnded && isMyDeal;
  const isReviewAccess: boolean = checkReviewAccess(item, userData?._id || "");
  const isCreateBuyOffer: boolean =
    item.status === "waiting" && !isMyDeal && item.type === "sell";

  const getCurrentStatusText = (): string => {
    return item.isCompleteByAdmin
      ? "Closed"
      : isReviewAccess
        ? "Feedback expected"
        : !!item.isReservedFunds && !isEnded
          ? "Funds reserved"
          : !isEnded && isTimeEnded
            ? `Time's up`
            : statuses[item.status];
  };

  const getStatusDescription = (): string => {
    if (item.isCompleteByAdmin)
      return StatusesDescription["forced-termination"];
    if (isReviewAccess) return StatusesDescription.review;
    if (isTimeEnded) return "Deal not available";

    return StatusesDescription[
      !!item.isReservedFunds && item.status !== "ended"
        ? "reserved"
        : item.status
    ];
  };

  return (
    <Wrapper
      type={item.type}
      className={isFirstOffer ? "first" : ""}
      isOffer={!!isOffer}
      isHaveOffers={!!item.offersList?.length}
    >
      {isFirstOffer ? (
        <div className="clickable" onClick={closeOffers} />
      ) : (
        <></>
      )}
      <DealColumn>
        <OtcComment deal={item} />
        <DealInfo>
          <DealName>{item.name}</DealName>
          <CommentText className="comment-text">{item.description}</CommentText>
          <DealActions>
            <button onClick={() => dealActionsHandler("like", item)}>
              <OtcLike
                status={
                  item.likes?.includes(String(userData?._id))
                    ? "active"
                    : "default"
                }
              />
              <span>{item.likes?.length || 0}</span>
            </button>
            <button onClick={() => dealActionsHandler("dislike", item)}>
              <OtcDislike
                status={
                  item.dislikes?.includes(String(userData?._id))
                    ? "active"
                    : "default"
                }
              />
              <span>{item.dislikes?.length || 0}</span>
            </button>
          </DealActions>
        </DealInfo>
      </DealColumn>

      <DealIconWrapper>
        {item.type === "buy" ? (
          <Image src={BuyIcon} alt="buy" />
        ) : (
          <Image src={SellIcon} alt="sell" />
        )}
      </DealIconWrapper>

      <DealDetails>
        <DealDetailsItem>
          <span>Type:</span>
          <div>{item.type === "buy" ? "Buying" : "Selling"}</div>
        </DealDetailsItem>
        <DealDetailsItem>
          <span>Price:</span>
          <div>
            {item.ticker.toLowerCase() === "eth"
              ? `${item.price} ETH`
              : `$${clarifyAmount(item.price)}`}
          </div>
        </DealDetailsItem>
        <DealDetailsItem>
          <span>Amount:</span>
          <div>{item.amount}</div>
        </DealDetailsItem>
        <DealDetailsItem>
          <span>Token Address:</span>
          <div>{sliceAddress(item.tokenAddress)}</div>
        </DealDetailsItem>
        <DealDetailsItem>
          <span>End date:</span>
          <div>{moment(item.date).format("DD.MM.YYYY HH:mm")}</div>
        </DealDetailsItem>
        <DealDetailsItem>
          <span>Status:</span>
          <DealStatusWrapper
            onMouseLeave={() => setIsStatusHover(false)}
            onMouseOver={() => setIsStatusHover(true)}
            status={!isEnded && isTimeEnded ? "blocked" : item.status}
          >
            <Image
              src={
                !isEnded && isTimeEnded
                  ? BlockedIcon
                  : StatusesIcons[item.status]
              }
              alt={item.status}
            />
            <span>{getCurrentStatusText()}</span>
          </DealStatusWrapper>
          <DescriptionStatus isVisible={isStatusHover}>
            <DescriptionComponent
              isVisible={isStatusHover}
              date={item.lastStatusUpdate}
              text={getStatusDescription()}
            />
          </DescriptionStatus>
        </DealDetailsItem>
      </DealDetails>
      <DealRightColumn>
        <DealRightHeader>
          <DealRisk>
            <DealDetailsItem>
              <span>Risk:</span>
              <RiskValue risk={item.creator?.risk || "Low"}>
                {item.creator?.risk || "Low"}
              </RiskValue>
            </DealDetailsItem>
          </DealRisk>
          <DefaultActionWrapper>
            <span>
              <RedFlag count={item.creator?.redFlags || 0} />
            </span>
          </DefaultActionWrapper>
          <ShareWrapper onClick={() => dealActionsHandler("share", item)}>
            <ShareIcon fill="#04A584" />
          </ShareWrapper>
        </DealRightHeader>
        <DealButtons>
          {item.isCompleteByAdmin ? (
            <></>
          ) : isReviewAccess ? (
            <Button
              onClick={() => dealActionsHandler("review", item)}
              variant="primary"
            >
              Leave review
            </Button>
          ) : item.status === "waiting" && !isTimeEnded ? (
            isMyDeal ? (
              <></>
            ) : isOffer && item.type === "buy" ? (
              <></>
            ) : (
              <Button
                onClick={
                  item.type === "buy"
                    ? () => dealActionsHandler("create", item)
                    : () => dealActionsHandler("block", item)
                }
                variant="primary"
              >
                {item.type === "buy" ? "Create offer" : "Buy"}
              </Button>
            )
          ) : isCompleteDealAccess ? (
            <Button
              onClick={() => confirmCompleteDeal && confirmCompleteDeal(item)}
              variant="primary"
            >
              Complete deal
            </Button>
          ) : isNeedConfrim ? (
            <StartOrReject>
              <StartDeal>
                <Button
                  onClick={() => dealActionsHandler("start", item)}
                  variant="primary"
                >
                  Start deal
                </Button>
                <span>with</span>
                <OtcComment isBuyer deal={item} />
              </StartDeal>
              <RejectButton onClick={() => dealActionsHandler("reject", item)}>
                Reject
              </RejectButton>
            </StartOrReject>
          ) : isReserveAccess ? (
            <Button
              onClick={() => dealActionsHandler("reserve", item)}
              variant="primary"
            >
              Reserve Funds
            </Button>
          ) : (
            <></>
          )}
          <DealActionsWrapper>
            {!isTimeEnded && !isMyDeal ? (
              <Button
                variant="secondary"
                onClick={() => dealActionsHandler("contact", item)}
              >
                Contact with {item.type === "buy" ? "buyer" : "seller"}
              </Button>
            ) : (
              <></>
            )}
            {isCreateBuyOffer && !isOffer ? (
              <Button
                variant="secondary"
                onClick={() => dealActionsHandler("create", item)}
              >
                Create offer
              </Button>
            ) : (
              <></>
            )}
          </DealActionsWrapper>
        </DealButtons>
      </DealRightColumn>
      {isReviewAccess ? (
        <DealReviewMessage>
          As long as users does not leave feedback, the project does not change
          its status to completed
        </DealReviewMessage>
      ) : (
        <></>
      )}
    </Wrapper>
  );
};

export default P2PDealItem;
