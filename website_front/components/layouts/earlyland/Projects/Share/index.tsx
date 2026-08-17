import React from "react";
import moment from "moment/moment";
import Link from "next/link";
import Image from "next/image";
import {
  HeaderDataText,
  HeaderDataTextWrapper,
  HeaderDescription,
  HeaderDescriptionItemsTitle,
  HeaderDescriptionItemsWrapper,
  HeaderDescriptionItemsWrapperMobile,
  HeaderPersonDescription,
  HeaderPersonTitle,
  HeaderUsersRow,
  HeaderUserWrapper,
  HeaderWrapper,
  LeftHeaderPersonInfoWrapper,
  LeftHeaderWrapper,
  PageWrapper,
  PrimaryLink,
  ProjectActionsButtonsWrapper,
  ProjectDescriptionDataWrapper,
  ProjectDescriptionItem,
  ProjectDescriptionWrapper,
  RightHeaderHead,
  RightHeaderWrapper,
  SecondaryLink,
} from "../Project/styles";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  LinkIcon,
  TwitterIcon,
} from "../../../../global/Icons";
import UserAvatar from "../../../../global/common/UserAvatar";
import Typography from "../../../../global/common/Typography";
import StatusTag from "../../../../global/StatusTag";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { clarifyDate } from "../../../../../helpers/clarifyDate";
import projectDescriptionImage from "../../../../../public/static/main/where_next.png";

const ShareProject = () => {
  return (
    <PageWrapper>
      <HeaderWrapper>
        <LeftHeaderWrapper>
          <LeftHeaderPersonInfoWrapper>
            <UserAvatar
              avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
              variant="default"
              size="medium"
              name="SharkRace Club"
            />
            <div>
              <HeaderPersonTitle variant="p">SharkRace Club</HeaderPersonTitle>
              <HeaderPersonDescription>
                <Typography variant="p">NFT & Collectibles</Typography>
                <StatusTag variant="active" />
                <LinkIcon fill="#00C099" />
                <LinkedinIcon fill="#00C099" />
                <FacebookIcon fill="#00C099" />
                <InstagramIcon fill="#00C099" />
                <TwitterIcon fill="#00C099" />
              </HeaderPersonDescription>
            </div>
          </LeftHeaderPersonInfoWrapper>
        </LeftHeaderWrapper>
        <RightHeaderWrapper>
          <RightHeaderHead>
            <div style={{ display: "flex", gap: 10 }}>
              <HeaderDataTextWrapper>
                <HeaderDataText variant="p">
                  ${clarifyAmount(1800000)}
                  <span>Total Raised</span>
                </HeaderDataText>
                <HeaderDataText variant="p">
                  {clarifyDate(String(moment()))}
                  <span>Ending</span>
                </HeaderDataText>
                <HeaderDataText variant="p">
                  Seed
                  <span>Type</span>
                </HeaderDataText>
              </HeaderDataTextWrapper>
            </div>
            <HeaderDescriptionItemsWrapperMobile>
              <div>
                <HeaderDescriptionItemsTitle>
                  <TwitterIcon fill="#738094" />
                  Top Followers
                </HeaderDescriptionItemsTitle>
                <HeaderUsersRow>
                  <HeaderUserWrapper>
                    <UserAvatar
                      size="xSmall"
                      avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                      name="name"
                      variant="default"
                    />
                    <Typography variant="p">John Doe</Typography>
                  </HeaderUserWrapper>
                  <HeaderUserWrapper>
                    <UserAvatar
                      size="xSmall"
                      avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                      name="name"
                      variant="default"
                    />
                    <Typography variant="p">John Doe</Typography>
                  </HeaderUserWrapper>
                </HeaderUsersRow>
              </div>
              <div>
                <HeaderDescriptionItemsTitle>Guide</HeaderDescriptionItemsTitle>
                <HeaderUsersRow>
                  <Link href="/">Link to guideline</Link>
                </HeaderUsersRow>
              </div>
            </HeaderDescriptionItemsWrapperMobile>
          </RightHeaderHead>
        </RightHeaderWrapper>
      </HeaderWrapper>
      <div>
        <HeaderDescription variant="p">
          Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet
          sint. Velit officia consequat duis enim velit mollit. Amet minim
          mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit
          officia consequat duis enim velit mollit.
        </HeaderDescription>
        <HeaderDescriptionItemsWrapper>
          <div>
            <HeaderDescriptionItemsTitle>
              <TwitterIcon fill="#738094" />
              Top Followers
            </HeaderDescriptionItemsTitle>
            <HeaderUsersRow>
              <HeaderUserWrapper>
                <UserAvatar
                  size="xSmall"
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  variant="default"
                />
                <Typography variant="p">John Doe</Typography>
              </HeaderUserWrapper>
              <HeaderUserWrapper>
                <UserAvatar
                  size="xSmall"
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  variant="default"
                />
                <Typography variant="p">John Doe</Typography>
              </HeaderUserWrapper>
            </HeaderUsersRow>
          </div>
          <div>
            <HeaderDescriptionItemsTitle>Guide</HeaderDescriptionItemsTitle>
            <HeaderUsersRow>
              <Link href="/">Link to guideline</Link>
            </HeaderUsersRow>
          </div>
        </HeaderDescriptionItemsWrapper>
      </div>
      <ProjectDescriptionDataWrapper>
        <ProjectDescriptionItem variant="p">
          <span>Type</span>
          Node
        </ProjectDescriptionItem>
        <ProjectDescriptionItem percentage={58.17} variant="p">
          <span>Reward Pool</span>-
        </ProjectDescriptionItem>
        <ProjectDescriptionItem percentage={7.01} variant="p">
          <span>Max Participants</span>
          8.01 M GFI
        </ProjectDescriptionItem>
        <ProjectDescriptionItem variant="p">
          <span>Date of Start</span>
          {clarifyDate(moment().format("DD.MM.YYYY HH:mm"))}
        </ProjectDescriptionItem>
        <ProjectDescriptionItem variant="p">
          <span>Date of End</span>
          {clarifyDate(moment().format("DD.MM.YYYY HH:mm"))}
        </ProjectDescriptionItem>
        <ProjectDescriptionItem variant="p">
          <span>Expected Profit</span>
          50.00%
        </ProjectDescriptionItem>
      </ProjectDescriptionDataWrapper>

      <ProjectDescriptionWrapper>
        <Image
          width={100}
          height={100}
          src={projectDescriptionImage.src}
          alt="Where next"
        />
        <Typography variant="p">
          The Contributor Program is a community incentive program designed to
          encourage community members of different backgrounds and skillsets to
          steward and take ownership of key aspects of the ecosystem.
          Participants of the program will be given points based on the quality
          of their contributions to the ecosystem using evaluation criteria
          developed by existing leaders in the community.
          <br />
          <br />
          When the NEXT token goes live, the project plans to submit a proposal
          to the Connext DAO to retroactively reward participants proportional
          to points received.
          <br />
          <br />
          The program starts on the 20th of April 2022. Phase One of the program
          will run until the NEXT token launches. After the token and DAO are
          live, the taem expects to continue with further phases of the program.
          <br />
          <br />
          Program Structure <br />
          The program consists of 5 Tracks that are operated by Track Operators;
          experienced leaders within the community that are not part of the core
          team:
          <br />
          <br />
          Community Leadership <br />
          Builders <br />
          Content & Education <br />
          Routers <br />
          Grants <br />
          Community Leaders <br />
          Community Leaders steward the ecosystem. They are responsible for
          running localized Connext communities around the world, supporting new
          users of the network, educating their regions about the network,
          managing social spaces for the ecosystem, and stewarding the community
          by upholding the project`s values and policies.
        </Typography>
        <ProjectActionsButtonsWrapper>
          <PrimaryLink href="/">Go to event Page</PrimaryLink>
          <SecondaryLink href="/">Go to project page</SecondaryLink>
        </ProjectActionsButtonsWrapper>
      </ProjectDescriptionWrapper>
    </PageWrapper>
  );
};

export default ShareProject;
