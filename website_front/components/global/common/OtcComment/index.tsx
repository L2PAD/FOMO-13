/* eslint-disable */
import React, { FC, useState } from "react";
import moment from "moment";
import UserAvatar from "../UserAvatar";
import { FingerDownIcon, FingerTopIcon } from "../../Icons";
import Modal from "../Modal";
import {
  IComment,
  IDeal,
  IOtcMember,
  IUser,
  UserRiskStatus,
} from "../../../../types/global_types";
import imageLoader from "../../../../helpers/imageLoader";
import sliceAddress from "../../../../helpers/sliceAddress";
import {
  CommentText,
  CommentWrapper,
  DateText,
  GrayLine,
  HeaderWrapper,
  ModalAction,
  ModalActionsWrapper,
  ModalCancelButton,
  ModalContent,
  ModalTitle,
  Reviews,
  Title,
  UserReviews,
  UserVerifyWrapper,
} from "./styles";
import { DealActions } from "../../../layouts/projects/OTC/DealItem/styles";
import VerifyIcon from "../../Icons/VerifyIcon";
import OtcLike from "../../Icons/OtcLike";
import OtcDisike from "../../Icons/OtcDislike";
import HighlightedText from "../../HighlightedText";

export interface CommentInterface {
  type?: "member" | "deal" | 'top-member';
  deal?: IDeal;
  member?: IOtcMember;
  isBuyer?: boolean;
  searchValue?: string;
  data?: any
}

export const Variants: {
  Default: "default";
  Low: "success";
  Medium: "warn";
  High: "error";
} = {
  Default: "default",
  Low: "success",
  Medium: "warn",
  High: "error",
};

export const getVariantByRisk = (
  risk: UserRiskStatus | undefined
): "warn" | "success" | "error" | "default" => {
  if (!risk) return "default";

  return Variants[risk];
};

const OtcComment: FC<CommentInterface> = ({
  deal,
  isBuyer,
  type = "deal",
  member,
  searchValue,
  data
}) => {

  if (type === 'member') {
    return (
      <CommentWrapper>
        <HeaderWrapper>
          <UserAvatar
            size="otc"
            variant={getVariantByRisk(data?.risk)}
            rating={Number(data?.rating || 0)}
            avatar={
              !isBuyer
                ? data?.photo
                  ? imageLoader(String(data.photo))
                  : (data && data?.twitterData?.photo) || ""
                : data?.photo
                  ? imageLoader(String(data.photo))
                  : (data && data?.twitterData?.photo) || ""
            }
            name={data?.username || ""}
          />
          <div>
            <Title variant="p">
              {data?.username || ""}{" "}
              {
                searchValue
                  ?
                  <HighlightedText text={sliceAddress(data?.wallet) || ""} searchValue={searchValue} />
                  :
                  <span>{sliceAddress(data?.wallet) || ""}</span>
              }
            </Title>
          </div>
        </HeaderWrapper>
      </CommentWrapper>
    )
  }

  return (
    <>
      {type === "deal" ? (
        <CommentWrapper>
          <HeaderWrapper>
            <UserAvatar
              size="otc"
              variant={getVariantByRisk(
                isBuyer ? (deal?.buyer?.risk || deal?.seller?.risk) : deal?.creator?.risk
              )}
              rating={Number(
                isBuyer ? (deal?.buyer?.rating || deal?.seller?.rating || 0) : (deal?.creator?.rating || 0)
              )}
              avatar={
                !isBuyer
                  ? deal?.creator?.photo
                    ? imageLoader(String(deal?.creator.photo))
                    : (deal?.creator && deal?.creator?.twitterData?.photo) || ""
                  : deal?.buyer?.photo
                    ? imageLoader(String(deal?.buyer.photo))
                    : deal?.seller?.photo
                      ? imageLoader(String(deal?.seller.photo))
                      : (deal?.buyer && deal?.buyer?.twitterData?.photo) ||
                      (deal?.seller && deal?.seller?.twitterData?.photo) ||
                      ""
              }
              name={
                !isBuyer
                  ? deal?.creator?.username || ""
                  : deal?.buyer?.username || deal?.seller?.username || ""
              }
            />
            {!isBuyer ? (
              <div>
                <UserVerifyWrapper>
                  <Title variant="p">
                    {deal?.creator?.username || ""}{" "}
                    {
                      searchValue
                        ?
                        <HighlightedText text={sliceAddress(deal?.creator?.wallet) || ""} searchValue={searchValue} />
                        :
                        <span>{sliceAddress(deal?.creator?.wallet) || ""}</span>
                    }
                  </Title>
                  {deal?.creator?.verificationStatus ? <VerifyIcon /> : <></>}
                </UserVerifyWrapper>
                <UserReviews>
                  <DateText variant="p">
                    {moment(deal?.createDate).format("DD.MM.YYYY HH:mm")}
                  </DateText>
                  <Reviews>
                    <button>
                      <OtcLike
                        status={
                          Number(deal?.creator?.reviewLikes?.length) > 0
                            ? "active"
                            : "default"
                        }
                      />
                      <span>{deal?.creator?.reviewLikes?.length || 0}</span>
                    </button>
                    <button>
                      <OtcDisike
                        status={
                          Number(deal?.creator?.reviewDislikes?.length) > 0
                            ? "active"
                            : "default"
                        }
                      />
                      <span>{deal?.creator?.reviewDislikes?.length || 0}</span>
                    </button>
                  </Reviews>
                </UserReviews>
              </div>
            ) : (
              <div>
                <Title variant="p">
                  {deal?.buyer?.username || deal?.seller?.username || ""}{" "}
                  {
                    searchValue
                      ?
                      <HighlightedText
                        text={sliceAddress(deal?.buyer?.wallet || deal?.seller?.wallet) || ""}
                        searchValue={searchValue}
                      />
                      :
                      <span>{sliceAddress(deal?.buyer?.wallet || deal?.seller?.wallet) || ""}</span>
                  }
                </Title>
              </div>
            )}
          </HeaderWrapper>
        </CommentWrapper>
      ) : (
        <CommentWrapper>
          <HeaderWrapper>
            <UserAvatar
              size="otc"
              variant="default"
              avatar={
                member?.user?.photo
                  ? imageLoader(String(member?.user.photo))
                  : (member?.user && member?.user?.twitterData?.photo) || ""
              }
              name={member?.user?.username || ""}
            />
            <div>
              <Title variant="p">
                {member?.user?.username || ""}{" "}
                <span>{sliceAddress(member?.user?.wallet) || ""}</span>
              </Title>
              {/* <DateText variant="p">Test</DateText> */}
            </div>
          </HeaderWrapper>
        </CommentWrapper>
      )}
    </>
  );
};

export default OtcComment;
