import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BreadCrumbs from "../../../global/BreadCrumbs";
import Typography from "../../../global/common/Typography";
import {
  DiscordIcon,
  LikeIcon,
  LinkIcon,
  NotificationIcon,
  TelegramIcon,
  TwitterIcon,
} from "../../../global/Icons";
import UserAvatar from "../../../global/common/UserAvatar";
import {
  RatingMediaList,
  RatingMediaListItem,
  RatingMediaWrapper,
} from "../Projects/Project/styles";
import PodcastsTable from "../../../global/Tables/PodcastTable";
import { PodcastWrapper } from "../PodcastsList/styles";
import image from "../../../../public/static/nextjs.jpg";
import { RewardCardsWrapper } from "../../Cave/styles";
import CommentBlock from "../../../global/CommentBlock";
import Pagination from "../../../global/Pagintaion";
import {
  ActionButton,
  ActionsWrapper,
  CommentsTitle,
  CommentsWrapper,
  CurrentRoiDescription,
  CurrentRoiValue,
  HeaderDataFollowersItem,
  HeaderDataFollowersItemsWrapper,
  HeaderDataFollowersTitle,
  HeaderDataFollowersWrapper,
  HeaderDataRightWrapper,
  HeaderDataWrapper,
  HeaderDescription,
  HeaderInfoWrapper,
  HeaderUserDescriptionWrapper,
  HeaderUserInfoWrapper,
  HeaderUserName,
  HeaderWrapper,
  PageWrapper,
  SocialsWrapper,
  UserAvatarWrapper,
} from "./styles";

const crumbs = [
  { title: "Projects", link: "/crypto" },
  { title: "Persons", link: "/crypto/persons" },
  { title: "Dr. Laurent El Ghaul", link: "/crypto/persons/234" },
];

const Podcast = () => {
  const [page, setPage] = useState(1);

  return (
    <PageWrapper>
      <BreadCrumbs items={crumbs} />
      <HeaderWrapper>
        <HeaderInfoWrapper>
          <HeaderUserInfoWrapper>
            <UserAvatarWrapper
              size="giant"
              avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
              name="name"
              variant="default"
            />
            <div>
              <HeaderUserName>
                <Typography variant="p">Dr. Laurent El Ghaul</Typography>
              </HeaderUserName>
              <HeaderUserDescriptionWrapper>
                <Typography variant="p">
                  Podcast themes; podcast theme
                </Typography>
                <SocialsWrapper>
                  <LinkIcon fill="#00C099" />
                  <DiscordIcon fill="#00C099" />
                  <TelegramIcon fill="#00C099" />
                  <TwitterIcon fill="#00C099" />
                </SocialsWrapper>
              </HeaderUserDescriptionWrapper>
            </div>
          </HeaderUserInfoWrapper>
          <HeaderDataWrapper>
            <HeaderDataFollowersWrapper>
              <HeaderDataFollowersTitle variant="p">
                <TwitterIcon fill="#738094" />
                Top Followers
              </HeaderDataFollowersTitle>
              <HeaderDataFollowersItemsWrapper>
                <HeaderDataFollowersItem>
                  <UserAvatar
                    size="xSmall"
                    avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                    name="name"
                    variant="default"
                  />
                  <Typography variant="p">John Doe</Typography>
                </HeaderDataFollowersItem>
                <HeaderDataFollowersItem>
                  <UserAvatar
                    size="xSmall"
                    avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                    name="name"
                    variant="default"
                  />
                  <Typography variant="p">John Doe</Typography>
                </HeaderDataFollowersItem>
              </HeaderDataFollowersItemsWrapper>
            </HeaderDataFollowersWrapper>
            <HeaderDataRightWrapper>
              <div>
                <CurrentRoiValue variant="p">455k.</CurrentRoiValue>
                <CurrentRoiDescription variant="p">
                  Subscribers
                </CurrentRoiDescription>
              </div>
              <ActionsWrapper>
                <ActionButton>
                  <NotificationIcon fill="#738094" />
                </ActionButton>
                <ActionButton>
                  <LikeIcon fill="#738094" />
                </ActionButton>
              </ActionsWrapper>
            </HeaderDataRightWrapper>
          </HeaderDataWrapper>
        </HeaderInfoWrapper>
        <div>
          <HeaderDescription variant="p">
            Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet
            sint. Velit officia consequat duis enim velit mollit. Exercitation
            veniam consequat sunt nostrud amet. Amet minim mollit non deserunt
            ullamco est sit aliqua dolor do amet sint. Velit officia consequat
            duis enim velit mollit.
          </HeaderDescription>
        </div>
      </HeaderWrapper>
      <div>
        <PodcastsTable />
        <Pagination
          page={page}
          total={20}
          limit={20}
          totalPage={20}
          onChange={(value) => setPage(value)}
        />
      </div>
      <CommentsWrapper>
        <CommentsTitle variant="p">Recommended</CommentsTitle>
        <RewardCardsWrapper>
          {Array(10)
            .fill("")
            .map((item, i) => {
              return (
                <PodcastWrapper variant="default" key={i}>
                  <Image width={100} height={100} src={image.src} alt="item" />
                  <Link href="/utility/podcasts/123">Podcast name</Link>
                </PodcastWrapper>
              );
            })}
        </RewardCardsWrapper>
      </CommentsWrapper>
      <CommentBlock />
      <RatingMediaWrapper>
        <CommentsTitle variant="p">Ratings & Media</CommentsTitle>
        <RatingMediaList>
          <RatingMediaListItem>
            <a href="components/layouts/projects/Projects/Project#">
              ArcBlock Rating Review
              <LinkIcon fill="#04A584" />
            </a>
          </RatingMediaListItem>
          <RatingMediaListItem>
            <a href="components/layouts/projects/Projects/Project#">
              ArcBlock Coin Guide
              <LinkIcon fill="#04A584" />
            </a>
          </RatingMediaListItem>
        </RatingMediaList>
      </RatingMediaWrapper>
    </PageWrapper>
  );
};

export default Podcast;
