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
  Line,
  ModalAction,
  ModalActionsWrapper,
  ModalCancelButton,
  ModalContent,
  ModalTitle,
  Reviews,
  ReviewText,
  ReviewWrapper,
  Title,
  UserReviews,
} from "./styles";
import { DealActions } from "../../../layouts/projects/OTC/DealItem/styles";
import OtcLike from "../../Icons/OtcLike";
import OtcDisike from "../../Icons/OtcDislike";
import { getVariantByRisk, Variants } from "../OtcComment";

export interface CommentInterface {
  deal?: IDeal;
  review?: { text: string; date: string };
}

const OtcReview: FC<CommentInterface> = ({ deal, review }) => {
  return (
    <ReviewWrapper>
      <Line></Line>
      <CommentWrapper>
        <HeaderWrapper>
          <UserAvatar
            size="otc"
            variant={getVariantByRisk(deal?.creator?.risk)}
            rating={Number(deal?.creator?.rating || 0)}
            avatar={
              deal?.creator?.photo
                ? imageLoader(String(deal?.creator.photo))
                : (deal?.creator && deal?.creator?.twitterData?.photo) || ""
            }
            name={deal?.creator?.username || ""}
          />
          {
            <div>
              <Title variant="p">
                {deal?.creator?.username || ""}{" "}
                <span>{sliceAddress(deal?.creator?.wallet) || ""}</span>
              </Title>
              <UserReviews>
                <DateText variant="p">
                  {moment(deal?.createDate).format("DD.MM.YYYY HH:mm")}
                </DateText>
              </UserReviews>
            </div>
          }
        </HeaderWrapper>
        <ReviewText>{review?.text || "-"}</ReviewText>
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
      </CommentWrapper>
    </ReviewWrapper>
  );
};

export default OtcReview;
