import React, { FC, useContext } from "react";
import Image from "next/image";
import RedFlag from "../../../../global/RedFlag";
import EndedIcon from "../../../../../assets/icons/otc/complete.svg";
import { IOtcComment, IUser } from "../../../../../types/global_types";
import moment from "moment";
import OtcLike from "../../../../global/Icons/OtcLike";
import OtcDisike from "../../../../global/Icons/OtcDislike";
import { AuthContext } from "../../../../global/Layout";
import { RiskValue } from "../DealItem/styles";
import OtcReview from "../../../../global/common/OtcReview";
import {
  CommentWrapper,
  DealWrapper,
  DealInfo,
  Header,
  Name,
  Date,
  Description,
  HeaderLeft,
  HeaderRight,
  HeaderRightItem,
  Actions,
  OtcCommentItem,
  Reviews,
} from "./styles";

interface IProps {
  item: IOtcComment;
}

const CommentItemOtc: FC<IProps> = ({ item }) => {
  const { userData } = useContext(AuthContext);

  return (
    <CommentWrapper>
      <DealWrapper type={item?.deal?.type}>
        <DealInfo>
          <Header>
            <HeaderLeft>
              <Name>{item?.deal?.name}</Name>
              <Date>
                {moment(item?.deal?.createDate).format("DD.MM.YYYY HH:mm")}
              </Date>
            </HeaderLeft>
            <HeaderRight>
              <HeaderRightItem className="deal-status">
                <span>Status:</span>
                <div>
                  <Image src={EndedIcon} alt="Ended" />
                  Ended
                </div>
              </HeaderRightItem>
              <HeaderRightItem className="deal-risk">
                <span>Risk:</span>
                <RiskValue risk={item?.deal?.creatorDetails?.risk || "Low"}>
                  {item?.deal?.creatorDetails?.risk || "Low"}
                </RiskValue>
              </HeaderRightItem>
              <RedFlag count={item?.deal?.creatorDetails?.redFlags || 0} />
            </HeaderRight>
          </Header>
          <Description>{item?.deal?.description}</Description>
          <Actions>
            <div>
              <OtcLike
                status={
                  item.deal?.likes?.includes(userData._id)
                    ? "active"
                    : "default"
                }
              />
              <span>{item?.deal?.likes?.length || 0}</span>
            </div>
            <div>
              <OtcDisike
                status={
                  item.deal?.dislikes?.includes(userData._id)
                    ? "active"
                    : "default"
                }
              />
              <span>{item.deal?.dislikes?.length || 0}</span>
            </div>
          </Actions>
        </DealInfo>
      </DealWrapper>
      <Reviews>
        {item.reviews?.map((review: any) => {
          const user: IUser | undefined = item.users?.find(
            (user: IUser) => user._id === review.userId
          );
          return (
            <OtcCommentItem key={review._id}>
              {user ? (
                <OtcReview
                  review={review}
                  deal={{
                    ...item.deal,
                    creator: user,
                  }}
                />
              ) : (
                <></>
              )}
            </OtcCommentItem>
          );
        })}
      </Reviews>
    </CommentWrapper>
  );
};

export default CommentItemOtc;
