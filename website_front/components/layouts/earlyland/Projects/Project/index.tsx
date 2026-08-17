import React, { useState, useContext } from "react";
import moment from "moment";
import Link from "next/link";
import Image from "next/image";
import { useSelector } from "react-redux";
import BreadCrumbs from "../../../../global/BreadCrumbs";
import projectDescriptionImage from "../../../../../public/static/main/where_next.png";
import { HeaderActionsWrapperMobile } from "../../../projects/Projects/Project/styles";
import {
  CalendarIcon,
  EditIcon,
  FacebookIcon,
  InstagramIcon,
  LikeIcon,
  LinkedinIcon,
  LinkIcon,
  NotificationIcon,
  ShareIcon,
  TwitterIcon,
} from "../../../../global/Icons";
import UserAvatar from "../../../../global/common/UserAvatar";
import Typography from "../../../../global/common/Typography";
import StatusTag from "../../../../global/StatusTag";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { clarifyDate } from "../../../../../helpers/clarifyDate";
import ShareModal from "../../../../global/modals/ShareModal";
import { authState } from "../../../../../store/slices/authSlice";
import {
  HeaderActionsWrapper,
  HeaderDataText,
  HeaderDataTextWrapper,
  HeaderDescription,
  HeaderDescriptionItemsTitle,
  HeaderDescriptionItemsWrapper,
  HeaderDescriptionItemsWrapperMobile,
  HeaderEditButton,
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
  ProjectDescriptionItem,
  ProjectDescriptionWrapper,
  RightHeaderHead,
  RightHeaderWrapper,
  SecondaryLink,
  ShareButton,
  ShareTagWrapper,
  TableDataContainer,
  TableDataWrapper,
} from "./styles";
import { IProject } from "../../../../../types/global_types";
import { ProjectDataContext } from "../../../../../pages/earlyland/project/[id]";
import imageLoader from "../../../../../helpers/imageLoader";

const Project = () => {
  const project: IProject = useContext(ProjectDataContext);
  const [isShareModal, setIsShareModal] = useState(false);
  const { isLogin } = useSelector(authState);

  return (
    <PageWrapper>
      <ShareTagWrapper>
        <BreadCrumbs
          items={[
            { title: "Projects", link: "/earlyland/crypto" },
            { title: project.name, link: `/earlyland/project/${project._id}` },
          ]}
        />
        <ShareButton onClick={() => setIsShareModal(true)}>
          <ShareIcon fill="#04A584" />
          Share
        </ShareButton>
      </ShareTagWrapper>
      <HeaderWrapper>
        <LeftHeaderWrapper>
          <LeftHeaderPersonInfoWrapper>
            <UserAvatar
              avatar={
                project.logo
                  ? imageLoader(String(project.logo))
                  : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
              }
              variant="default"
              size="medium"
              name="SharkRace Club"
            />
            <div>
              <HeaderPersonTitle variant="p">{project.name}</HeaderPersonTitle>
              <HeaderPersonDescription>
                <Typography variant="p">{project.niche}</Typography>
                <StatusTag variant={project.status.toLowerCase()} />
                {/* <LinkIcon fill="#00C099" />
                <LinkedinIcon fill="#00C099" />
                <FacebookIcon fill="#00C099" />
                <InstagramIcon fill="#00C099" />
                <TwitterIcon fill="#00C099" /> */}
              </HeaderPersonDescription>
            </div>
            <HeaderActionsWrapperMobile>
              <button>
                <CalendarIcon fill="#738094" />
              </button>
              <button>
                <NotificationIcon fill="#738094" />
              </button>
              <button>
                <LikeIcon fill="#738094" />
              </button>
            </HeaderActionsWrapperMobile>
          </LeftHeaderPersonInfoWrapper>
        </LeftHeaderWrapper>
        <RightHeaderWrapper>
          <RightHeaderHead>
            <div style={{ display: "flex", gap: 10 }}>
              {isLogin && (
                <HeaderEditButton>
                  <EditIcon fill="#00C099" />
                </HeaderEditButton>
              )}
              <HeaderDataTextWrapper>
                <HeaderDataText variant="p">
                  ${clarifyAmount(Number(project.totalRaised || 0))}
                  <span>Total Raised</span>
                </HeaderDataText>
                <HeaderDataText variant="p">
                  {clarifyDate(project.ending || String(moment()))}
                  <span>Ending</span>
                </HeaderDataText>
                <HeaderDataText variant="p">
                  {project.type || "-"}
                  <span>Type</span>
                </HeaderDataText>
              </HeaderDataTextWrapper>
            </div>
            <HeaderActionsWrapper>
              <button>
                <CalendarIcon fill="#738094" />
              </button>
              <button>
                <NotificationIcon fill="#738094" />
              </button>
              <button>
                <LikeIcon fill="#738094" />
              </button>
            </HeaderActionsWrapper>
            <HeaderDescriptionItemsWrapperMobile>
              <div>
                <HeaderDescriptionItemsTitle>
                  <TwitterIcon fill="#738094" />
                  Top Followers
                </HeaderDescriptionItemsTitle>
                <HeaderUsersRow>
                  {/* <HeaderUserWrapper>
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
                  </HeaderUserWrapper> */}
                  -
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
        <HeaderDescription variant="p">{project.bio}</HeaderDescription>
        <HeaderDescriptionItemsWrapper>
          <div>
            <HeaderDescriptionItemsTitle>
              <TwitterIcon fill="#738094" />
              Top Followers
            </HeaderDescriptionItemsTitle>
            <HeaderUsersRow>
              {/* <HeaderUserWrapper>
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
              </HeaderUserWrapper> */}
              -
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
      <TableDataContainer>
        <TableDataWrapper>
          <ProjectDescriptionItem variant="p">
            <span>Type</span>
            {project.type}
          </ProjectDescriptionItem>
          <ProjectDescriptionItem percentage={58.17} variant="p">
            <span>Reward Pool</span>-
          </ProjectDescriptionItem>
          <ProjectDescriptionItem percentage={7.01} variant="p">
            <span>Max Participants</span>-
          </ProjectDescriptionItem>
          <ProjectDescriptionItem variant="p">
            <span>Date of Start</span>-
          </ProjectDescriptionItem>
          <ProjectDescriptionItem variant="p">
            <span>Date of End</span>-
          </ProjectDescriptionItem>
          <ProjectDescriptionItem variant="p">
            <span>Expected Profit</span>-
          </ProjectDescriptionItem>
        </TableDataWrapper>
      </TableDataContainer>

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
      {isShareModal && (
        <ShareModal
          onClose={() => setIsShareModal(false)}
          link="/earlyland/project/share/123"
        />
      )}
    </PageWrapper>
  );
};

export default Project;
