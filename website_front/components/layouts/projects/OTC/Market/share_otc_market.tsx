import React from "react";
import moment from "moment";
import UserAvatar from "../../../../global/common/UserAvatar";
import {
  FingerDownIcon,
  FingerTopIcon,
  StarIcon,
} from "../../../../global/Icons";
import RedFlag from "../../../../global/RedFlag";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import {
  SharePageData,
  SharePageHeader,
  SharePageText,
  SharePageWrapper,
} from "../styles";
import { DefaultActionWrapper, RatingWrapper, StatusWrapper } from "./styles";

const ShareOtcMarket = () => {
  return (
    <SharePageWrapper>
      <SharePageHeader>
        <UserAvatar
          size="giant"
          variant="none"
          avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
          name="name"
        />
        <div>
          <p>Dr. Laurent El Ghaul</p>
          <div>
            <p>{moment().format("DD.MM.YYYY HH:mm")}</p>
            <div>
              <FingerTopIcon /> 2,5k
            </div>
            <div>
              <FingerDownIcon /> 2,5k
            </div>
          </div>
        </div>
      </SharePageHeader>
      <SharePageData>
        <DefaultActionWrapper>
          Type:
          <span>Buying</span>
        </DefaultActionWrapper>
        <DefaultActionWrapper>
          Price:
          <span>${clarifyAmount(1800000)}</span>
        </DefaultActionWrapper>
        <DefaultActionWrapper>
          Rating:
          <span>
            <RedFlag count={14} />
            <RatingWrapper>
              <StarIcon fill="#FFC702" />
              94/100
            </RatingWrapper>
          </span>
        </DefaultActionWrapper>
        <DefaultActionWrapper>
          Moving tokens:
          <span>Locked</span>
        </DefaultActionWrapper>
        <StatusWrapper>
          Status:
          <span>Pending</span>
        </StatusWrapper>
      </SharePageData>
      <SharePageText>
        Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet
        sint. Velit officia consequat duis enim velit mollit. Exercitation
        veniam consequat sunt nostrud amet. Amet minim mollit non deserunt
        ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis
        enim velit mollit. Amet minim mollit non deserunt ullamco est sit aliqua
        dolor do amet sint. Velit officia consequat duis enim velit mollit.
        Exercitation veniam consequat sunt nostrud amet. Amet minim mollit non
        deserunt ullamco est sit aliqua dolor do amet sint. Velit officia
        consequat duis enim velit mollit.
      </SharePageText>
    </SharePageWrapper>
  );
};

export default ShareOtcMarket;
