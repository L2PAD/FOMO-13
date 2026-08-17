import React from "react";
import moment from "moment";
import {
  FlexContainer,
  DefaultCard,
  ProjectCardLink,
  ToDoCard,
} from "../styles";
import { LikeIcon, ShareIcon } from "../../../global/Icons";
import Typography from "../../../global/common/Typography";
import ViewCard from "../../../global/ViewCard";
import ToDoIcon from "../../../global/Icons/ToDoIcon";
import CheckEmailIcon from "../../../global/Icons/CheckEmailIcon";
import PassKYCIcon from "../../../global/Icons/PassKYCIcon";
import WaitAnnouncementsIcon from "../../../global/Icons/WaitAnnouncementsIcon";
import DepositUSDCIcon from "../../../global/Icons/DepositUSDCIcon";

const item = {
  variant: "default",
  userAvatar:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
  userName: "name",
  userRating: 94,
  userStatus: "warn",
  headerTag: "IDO on the Huob",
  status: "upcoming",
  title: "SharkRace Club sdaf sdf asdf asdf asdf ",
  percentage: 75,
  description: "NFT & Collectibles",
  investors: [
    {
      avatar:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
      name: "name",
    },
    {
      avatar:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
      name: "name",
    },
    {
      avatar:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
      name: "name",
    },
    {
      avatar:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
      name: "name",
    },
    {
      avatar:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
      name: "name",
    },
  ],
  redFlagsCount: 20,
  totalAmount: 12432524,
  lastFundingDate: String(moment()),
  type: "Seed",
};

export const ActivitiesUpdates = () => {
  return (
    <DefaultCard variant="default">
      <div className="header">
        <div>
          <ShareIcon />
          <b>Activities & Updates</b>
        </div>
        <div>
          <LikeIcon fill="#000" />
          <div className="circle" />
        </div>
      </div>
      <FlexContainer>
        <div>
          <Typography variant="h1">AIRDROP</Typography>
          <br />
          <ProjectCardLink href={`/crypto/project/123?status=${item.status}`}>
            <ViewCard
              type="default"
              //@ts-ignore
              cardData={item}
            />
          </ProjectCardLink>
        </div>
        <ToDoCard>
          <div className="header">
            <ToDoIcon />
            <Typography variant="h3">TO DO LIST:</Typography>
          </div>
          <div className="items">
            <div className="item">
              <CheckEmailIcon /> Check your e-mail
            </div>
            <div className="item">
              <PassKYCIcon /> Pass the KYC
            </div>
            <div className="item">
              <WaitAnnouncementsIcon /> Wait for announcements
            </div>
            <div className="item">
              <DepositUSDCIcon /> Deposit USDC
            </div>
          </div>
        </ToDoCard>
      </FlexContainer>
    </DefaultCard>
  );
};
