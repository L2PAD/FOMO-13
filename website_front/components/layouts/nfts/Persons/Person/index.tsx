import React from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import BreadCrumbs from "../../../../global/BreadCrumbs";
import RatingCircle from "../../../../global/RatingCircle";
import { NFTsProjectsProjects } from "../../../../../staticContent/nfts/projects";
import { PersonsData } from "../../../../../staticContent/projects/persons";
import Typography from "../../../../global/common/Typography";
import {
  CheckIcon,
  CloseIcon,
  EditIcon,
  FacebookIcon,
  InstagramIcon,
  LikeIcon,
  LinkedinIcon,
  LinkIcon,
  NotificationIcon,
  TwitterIcon,
} from "../../../../global/Icons";
import UserAvatar from "../../../../global/common/UserAvatar";
import { authState } from "../../../../../store/slices/authSlice";
import CommentBlock from "../../../../global/CommentBlock";
import {
  ActionButton,
  ActionsWrapper,
  CurrentRoiDescription,
  CurrentRoiValue,
  FlagsList,
  FlagsListItem,
  FlagsListsWrapper,
  FlagsListTitle,
  FlagsTitle,
  FlagsWrapper,
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
  NFTProject,
  NFTsWrapper,
  PageWrapper,
  ParticipatedAction,
  ParticipatedActionsWrapper,
  ParticipatedHeaderWrapper,
  ParticipatedTitle,
  ParticipatedWrapper,
  PersonCardWrapper,
  RatingCircleWrapper,
  SocialsWrapper,
  UserAvatarWrapper,
} from "./styles";

const crumbs = [
  { title: "Projects", link: "/nfts" },
  { title: "Persons", link: "/nfts/persons" },
  { title: "Dr. Laurent El Ghaul", link: "/nfts/persons/234" },
];

const Person = () => {
  const { isLogin } = useSelector(authState);

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
              variant="success"
              rating={94}
            />
            <div>
              <HeaderUserName>
                <Typography variant="p">Dr. Laurent El Ghaul</Typography>
                <RatingCircleWrapper>
                  <RatingCircle rating={75} variant="success" />
                </RatingCircleWrapper>
              </HeaderUserName>
              <HeaderUserDescriptionWrapper>
                <span>Business manager</span>
                <SocialsWrapper>
                  <LinkIcon fill="#00C099" />
                  <LinkedinIcon fill="#00C099" />
                  <FacebookIcon fill="#00C099" />
                  <InstagramIcon fill="#00C099" />
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
                <CurrentRoiValue variant="p">+1066% x11</CurrentRoiValue>
                <CurrentRoiDescription variant="p">
                  Current ROI
                </CurrentRoiDescription>
              </div>
              <div>
                <CurrentRoiValue variant="p">+9569%</CurrentRoiValue>
                <CurrentRoiDescription variant="p">
                  ATH ROI
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
      <ParticipatedWrapper>
        <ParticipatedHeaderWrapper>
          <ParticipatedTitle variant="p">Participated ICO</ParticipatedTitle>
          <ParticipatedActionsWrapper>
            {isLogin && (
              <ParticipatedAction rotate>
                <CloseIcon fill="#00C099" />
              </ParticipatedAction>
            )}
            {isLogin && (
              <ParticipatedAction rotate={false}>
                <EditIcon fill="#00C099" />
              </ParticipatedAction>
            )}
          </ParticipatedActionsWrapper>
        </ParticipatedHeaderWrapper>
        <NFTsWrapper>
          {NFTsProjectsProjects.map((item, i) => {
            if (i < 4) {
              return (
                <Link href="/" key={i}>
                  {/*//@ts-ignore*/}
                  <NFTProject {...item} />
                </Link>
              );
            }
            return null;
          })}
        </NFTsWrapper>
      </ParticipatedWrapper>
      <ParticipatedWrapper>
        <ParticipatedHeaderWrapper>
          <ParticipatedTitle variant="p">Colleagues in ICO</ParticipatedTitle>
        </ParticipatedHeaderWrapper>
        <NFTsWrapper>
          {PersonsData.map((item, i) => {
            if (i < 5) {
              return (
                <Link href="/" key={i}>
                  {/*//@ts-ignore*/}
                  <PersonCardWrapper {...item} />
                </Link>
              );
            }
            return null;
          })}
        </NFTsWrapper>
      </ParticipatedWrapper>
      <FlagsWrapper>
        <FlagsTitle variant="p">Flags</FlagsTitle>
        <FlagsListsWrapper>
          <FlagsList>
            <FlagsListTitle variant="p">Green</FlagsListTitle>
            <ul>
              <FlagsListItem>
                <CheckIcon fill="#04A584" />
                Support Mulyiple Blockchains with Different Protocols
              </FlagsListItem>
              <FlagsListItem>
                <CheckIcon fill="#04A584" />
                Strong Partnership
              </FlagsListItem>
              <FlagsListItem>
                <CheckIcon fill="#04A584" />
                Solid Team
              </FlagsListItem>
              <FlagsListItem>
                <CheckIcon fill="#04A584" />
                Detailed Roadmap
              </FlagsListItem>
            </ul>
          </FlagsList>
          <FlagsList>
            <FlagsListTitle variant="p">Red</FlagsListTitle>
            <ul>
              <FlagsListItem>
                <CloseIcon fill="#E42736" />
                Support Mulyiple Blockchains with Different Protocols
              </FlagsListItem>
              <FlagsListItem>
                <CloseIcon fill="#E42736" />
                Strong Partnership
              </FlagsListItem>
              <FlagsListItem>
                <CloseIcon fill="#E42736" />
                Solid Team
              </FlagsListItem>
              <FlagsListItem>
                <CloseIcon fill="#E42736" />
                Detailed Roadmap
              </FlagsListItem>
              <FlagsListItem>
                <CloseIcon fill="#E42736" />
                Support Mulyiple Blockchains with Different Protocols
              </FlagsListItem>
              <FlagsListItem>
                <CloseIcon fill="#E42736" />
                Strong Partnership
              </FlagsListItem>
              <FlagsListItem>
                <CloseIcon fill="#E42736" />
                Solid Team
              </FlagsListItem>
              <FlagsListItem>
                <CloseIcon fill="#E42736" />
                Detailed Roadmap
              </FlagsListItem>
            </ul>
          </FlagsList>
        </FlagsListsWrapper>
      </FlagsWrapper>
      <CommentBlock />
    </PageWrapper>
  );
};

export default Person;
