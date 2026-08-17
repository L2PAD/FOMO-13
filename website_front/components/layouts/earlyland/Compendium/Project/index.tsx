import React, { useContext, useState } from "react";
import moment from "moment";
import Link from "next/link";
import { useSelector } from "react-redux";
import BreadCrumbs from "../../../../global/BreadCrumbs";
import { HeaderActionsWrapperMobile } from "../../../projects/Projects/Project/styles";
import {
  AskIcon,
  CalendarIcon,
  EditIcon,
  FacebookIcon,
  InstagramIcon,
  LikeIcon,
  LinkedinIcon,
  LinkIcon,
  NotificationIcon,
  SendTimeIcon,
  ShareIcon,
  TwitterIcon,
} from "../../../../global/Icons";
import UserAvatar from "../../../../global/common/UserAvatar";
import Typography from "../../../../global/common/Typography";
import StatusTag from "../../../../global/StatusTag";
import { clarifyDate } from "../../../../../helpers/clarifyDate";
import NewsTab from "../../../projects/Projects/Project/NewsTab";
import Rollup from "../../../../global/common/Rollup";
// import { ProgressBar } from "../../../../global/CryptoMarketTable/table_row/styles";
import { ProgressBar } from "../../../../global/common/UniversalTableRow/styles";
import ShareModal from "../../../../global/modals/ShareModal";
import { authState } from "../../../../../store/slices/authSlice";
import { ProjectDataContext } from "../../../../../pages/earlyland/compendium/[id]";
import { IProject } from "../../../../../types/global_types";
import {
  ContentWrapper,
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
  ProgressHeaderWrapper,
  ProgressWrapper,
  ProjectDescriptionDataWrapper,
  ProjectDescriptionItem,
  ReviewWrapper,
  RightHeaderHead,
  RightHeaderWrapper,
  RollupContentWrapper,
  RollupHelpButton,
  RollupNextButton,
  ShareButton,
  ShareTagWrapper,
  TimelineContentWrapper,
  TimelineFooterWrapper,
  TimelineItemHeader,
  TimelineItemsWrapper,
  TimelineItemWrapper,
} from "./styles";
import imageLoader from "../../../../../helpers/imageLoader";

const Project = () => {
  const project: IProject = useContext(ProjectDataContext);
  const [isShareModal, setIsShareModal] = useState(false);
  const [doneStages, setDoneStages] = useState(0);
  const { isLogin } = useSelector(authState);

  return (
    <>
      <PageWrapper>
        <ShareTagWrapper>
          <BreadCrumbs
            items={[
              { title: "Projects", link: "/earlyland/compendium" },
              {
                title: project.name,
                link: `/earlyland/compendium/${project._id}`,
              },
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
                name={project.name}
              />
              <div>
                <HeaderPersonTitle variant="p">
                  {project.name}
                </HeaderPersonTitle>
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
                    0$
                    <span>Requirements</span>
                  </HeaderDataText>
                  <HeaderDataText variant="p">
                    0 min
                    <span>Time</span>
                  </HeaderDataText>
                  <HeaderDataText variant="p">
                    -<span>Rewards</span>
                  </HeaderDataText>
                  <HeaderDataText variant="p">
                    0%
                    <span>Risk</span>
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
                  </HeaderUsersRow>
                </div>
                <div>
                  <HeaderDescriptionItemsTitle>
                    Guide
                  </HeaderDescriptionItemsTitle>
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
        <ProjectDescriptionDataWrapper>
          <ProjectDescriptionItem variant="p">
            <span>Type</span>
            {project.type || "-"}
          </ProjectDescriptionItem>
          <br />
          <br />
          <br />
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
            <span>Expected Profit</span>
            0%
          </ProjectDescriptionItem>
        </ProjectDescriptionDataWrapper>
        <ContentWrapper>
          <p>Timeline</p>
          <TimelineItemsWrapper>
            <TimelineItemWrapper variant="default">
              <TimelineItemHeader>
                <p>Permint</p>
                <button>
                  <CalendarIcon fill="#FFFFFF" />
                </button>
              </TimelineItemHeader>
              <TimelineContentWrapper>
                <div>
                  <CalendarIcon fill="#738094" /> {moment().format("DD MMM")}
                </div>
                <div>
                  <SendTimeIcon fill="#738094" /> {moment().format("HH:mm")}
                </div>
              </TimelineContentWrapper>
              <TimelineFooterWrapper>
                Sign up period for a Premint
              </TimelineFooterWrapper>
            </TimelineItemWrapper>
            <TimelineItemWrapper variant="default">
              <TimelineItemHeader>
                <p>Mint</p>
                <button>
                  <CalendarIcon fill="#FFFFFF" />
                </button>
              </TimelineItemHeader>
              <TimelineContentWrapper>
                <div>
                  <CalendarIcon fill="#738094" /> {moment().format("DD MMM")}
                </div>
                <div>
                  <SendTimeIcon fill="#738094" /> {moment().format("HH:mm")}
                </div>
              </TimelineContentWrapper>
              <TimelineFooterWrapper>
                WL gets to mint first, then it goes public
              </TimelineFooterWrapper>
            </TimelineItemWrapper>
          </TimelineItemsWrapper>
        </ContentWrapper>
        <ContentWrapper>
          <p>Update</p>
        </ContentWrapper>
      </PageWrapper>
      <NewsTab />
      <PageWrapper>
        <ContentWrapper>
          <p>Fomo review:</p>
          <ReviewWrapper>
            <p>
              The Contributor Program is a community incentive program designed
              to encourage community members of different backgrounds and
              skillsets to steward and take ownership of key aspects of the
              ecosystem. Participants of the program will be given points based
              on the quality of their contributions to the ecosystem using
              evaluation criteria developed by existing leaders in the
              community.
              <br />
              <br />
              When the NEXT token goes live, the project plans to submit a
              proposal to the Connext DAO to retroactively reward participants
              proportional to points received.
              <br />
              <br />
              The program starts on the 20th of April 2022. Phase One of the
              program will run until the NEXT token launches. After the token
              and DAO are live, the taem expects to continue with further phases
              of the program.
              <br />
              <br />
              Program Structure <br />
              The program consists of 5 Tracks that are operated by Track
              Operators; experienced leaders within the community that are not
              part of the core team:
            </p>
          </ReviewWrapper>
        </ContentWrapper>
        <ContentWrapper>
          <p>What to do:</p>
          <Rollup
            title="Community Leadership"
            progress={doneStages >= 1 ? 1 : 0}
            isDone={doneStages >= 1}
            maxProgress={1}
            onChange={() => setDoneStages(1)}
          >
            <RollupContentWrapper>
              <p>
                The Contributor Program is a community incentive program
                designed to encourage community members of different backgrounds
                and skillsets to steward and take ownership of key aspects of
                the ecosystem. Participants of the program will be given points
                based on the quality of their contributions to the ecosystem
                using evaluation criteria developed by existing leaders in the
                community.
              </p>
              <div>
                <RollupHelpButton>
                  <AskIcon fill="#00C099" />
                  Need some help?
                </RollupHelpButton>
                <RollupNextButton
                  isDone={doneStages >= 1}
                  disabled={doneStages >= 1}
                  onClick={() => setDoneStages(1)}
                >
                  Next step
                </RollupNextButton>
              </div>
            </RollupContentWrapper>
          </Rollup>
          <Rollup
            title="Community Leadership"
            progress={doneStages >= 2 ? 1 : 0}
            isDone={doneStages >= 2}
            maxProgress={1}
            onChange={() => setDoneStages(2)}
          >
            <RollupContentWrapper>
              <p>
                The Contributor Program is a community incentive program
                designed to encourage community members of different backgrounds
                and skillsets to steward and take ownership of key aspects of
                the ecosystem. Participants of the program will be given points
                based on the quality of their contributions to the ecosystem
                using evaluation criteria developed by existing leaders in the
                community.
              </p>
              <div>
                <RollupHelpButton>
                  <AskIcon fill="#00C099" />
                  Need some help?
                </RollupHelpButton>
                <RollupNextButton
                  isDone={doneStages >= 2}
                  disabled={doneStages >= 2}
                  onClick={() => setDoneStages(2)}
                >
                  Next step
                </RollupNextButton>
              </div>
            </RollupContentWrapper>
          </Rollup>
          <Rollup
            title="Community Leadership"
            progress={doneStages >= 3 ? 1 : 0}
            isDone={doneStages >= 3}
            maxProgress={1}
            onChange={() => setDoneStages(3)}
          >
            <RollupContentWrapper>
              <p>
                The Contributor Program is a community incentive program
                designed to encourage community members of different backgrounds
                and skillsets to steward and take ownership of key aspects of
                the ecosystem. Participants of the program will be given points
                based on the quality of their contributions to the ecosystem
                using evaluation criteria developed by existing leaders in the
                community.
              </p>
              <div>
                <RollupHelpButton>
                  <AskIcon fill="#00C099" />
                  Need some help?
                </RollupHelpButton>
                <RollupNextButton
                  isDone={doneStages >= 3}
                  disabled={doneStages >= 3}
                  onClick={() => setDoneStages(3)}
                >
                  Next step
                </RollupNextButton>
              </div>
            </RollupContentWrapper>
          </Rollup>
          <ProgressWrapper>
            <ProgressHeaderWrapper>
              <p>Progress</p>
              <div>
                <p>
                  Current: <span>30%</span>
                </p>
                <p>
                  Total (5p reward):: <span>100%</span>
                </p>
              </div>
            </ProgressHeaderWrapper>
            <ProgressBar progress={30}>
              <div />
            </ProgressBar>
          </ProgressWrapper>
        </ContentWrapper>
        {isShareModal && (
          <ShareModal
            onClose={() => setIsShareModal(false)}
            link="/earlyland/compendium/share/123"
          />
        )}
      </PageWrapper>
    </>
  );
};

export default Project;
