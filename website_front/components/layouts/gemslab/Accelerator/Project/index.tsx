import React, { useState, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { ProjectDataContext } from "../../../../../pages/gemslab/launch/[id]";
import Link from "next/link";
import Image from "next/image";
import { useSelector } from "react-redux";
import BreadCrumbs from "../../../../global/BreadCrumbs";
import RatingCircle from "../../../../global/RatingCircle";
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
import ShareModal from "../../../../global/modals/ShareModal";
import useTimer from "../../../../../hooks/useTimerWithTime";
import { authState } from "../../../../../store/slices/authSlice";
import FullMoon from "../../../../../assets/icons/full-moon.svg";
import Moon from "../../../../../assets/icons/moon.svg";
import IDODetails from "./idoDetails";
import ProjectDetailsInfo from "./projectDetailsInfo";
import NewsItem from "../../../../global/NewsItem";
import imageLoader from "../../../../../helpers/imageLoader";
import { sanitizedHtml } from "../../../../../helpers/sanitizeHtml";
import { INews } from "../../../../../types/global_types";
import {
  AuthContext,
  LoadingContext,
  LocationContext,
  WatchlistContext,
} from "../../../../global/Layout";
import deleteFromWatchlist from "../../../../../http/watchlist/deleteFromWatchlist";
import addProjectToWatchlist from "../../../../../http/watchlist/addProjectToWatchlist";
import {
  ContentWrapper,
  DatesWrapper,
  FactRow,
  FactsTitle,
  FactsWrapper,
  HeaderActionsWrapper,
  HeaderDataText,
  HeaderDataTextWrapper,
  HeaderDescription,
  HeaderEditButton,
  HeaderPersonDescription,
  HeaderPersonNameWrapper,
  HeaderPersonTitle,
  HeaderWrapper,
  LeftHeaderPersonInfoWrapper,
  LeftHeaderWrapper,
  PageWrapper,
  PersonPriceWrapper,
  PrimaryButton,
  ProgressWrapper,
  ProjectContentDescription,
  ProjectContentWrapper,
  ProjectDescriptionActionsWrapper,
  PublicWrapper,
  RangeDescription,
  RangeDescriptionWrapper,
  RangeTitle,
  RangeValue,
  RangeWrapper,
  RatingCircleWrapper,
  RightHeaderHead,
  RightHeaderWrapper,
  RoundDescription,
  RoundsWrapper,
  RoundTimerTitle,
  RoundTimerValue,
  RoundTimerWrapper,
  RoundTitle,
  SecondaryButton,
  ShareButton,
  ShareTagWrapper,
  StagesWrapper,
  StrongWrapper,
  StepsWrapper,
  StepItemWrapper,
  StepValue,
  StepKey,
  HeaderProjectList,
  ProjectStatusTag,
  ProjectHeaderWrapper,
  ProjectBodyWrapper,
  ProjectDetails,
  ProjectDetailsItem,
  ProjectDetailsTitle,
  ProjectDetailsDescription,
  SectionsBtns,
  SectionBtn,
  Recommended,
  RecommendedList,
  RecommendedTitle,
} from "./styles";
import {
  getAllPartnersFromPool,
  getMeInPool,
  getPoolInfo,
} from "../../../../../smart/initialSmartMain";
import addDateAndTime from "../../../../../helpers/addDateAndTime";

const items = [
  { title: "Projects", link: "nfts/projects" },
  { title: "SharkRace Club", link: "nfts/project/123" },
];

const stepsItems = [
  {
    isActive: true,
    title: "Staking",
    description: "Preparing for whitelist",
  },
  {
    isActive: false,
    title: "Purchase",
    description: "You can fill your allocations",
  },
  {
    isActive: false,
    title: "Distribution",
    description: "Claim allocations",
  },
];

const sections = [
  {
    name: "Project Details",
  },
  {
    name: "IDO Details",
  },
];

const AcceleratorProject = () => {
  const { path } = useContext(LocationContext);
  const { userData } = useContext(AuthContext);
  const project = useContext(ProjectDataContext);
  const { watchlist } = useContext(WatchlistContext);
  const { loadingStateHandler } = useContext(LoadingContext);

  const [isWatchListProject, setIsWatchListProject] = useState<boolean>(
    watchlist?.projects?.find((item: any) => item?._id === project._id)
  );
  const [isClaim, setIsClaim] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [myInvest, setMyInvest] = useState(0);
  const [selectedSection, setSelectedSection] = useState<any>(sections[0]);
  const [isShareModal, setIsShareModal] = useState(false);
  const [funded, setFunded] = useState<number>(0);
  const [steps, setSteps] = useState(stepsItems);
  const { days, hours, minutes, seconds } = useTimer(
    project.purchaseDateEnd ? project.purchaseDateEnd : new Date(),
    project.purchaseTimeEnd
  );

  const updateWatchList = async (): Promise<void> => {
    if (!userData.isFullAuth) {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>You need to be fully logged in to add project to watchlist</p>
        </div>
      );
      return;
    }

    if (isWatchListProject) {
      const { success } = await deleteFromWatchlist(path, String(project._id));

      if (success) {
        toast.success(
          <div>
            <h3>Success!</h3>
            <p>Project deleted from favorites</p>
          </div>
        );
      }

      setIsWatchListProject(false);

      return;
    }

    const { success } = await addProjectToWatchlist(path, String(project._id));

    setIsWatchListProject(success);

    if (success) {
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>Project added to favorites</p>
        </div>
      );
    }
  };

  useEffect(() => {
    const initialProjectPage = async () => {
      loadingStateHandler(true);

      setIsClaimed(
        userData?.claimedProjects &&
          userData?.claimedProjects?.includes(project._id)
      );
      const isPurchaseStart =
        new Date().getTime() >
        addDateAndTime(
          new Date(project.purchaseDateStart || ""),
          project.purchaseTimeStart || "00:00"
        );

      const { sumInvest } = await getAllPartnersFromPool(project.poolId || 0);

      setFunded(sumInvest || 0);

      if (window?.ethereum?.selectedAddress) {
        const { data } = await getMeInPool(
          project?.poolId || 0,
          window.ethereum.selectedAddress
        );
        setMyInvest(data.invest);
      }

      if (isPurchaseStart) {
        setSteps(
          stepsItems.map((step, i: number) => {
            if (i === 1) return { ...step, isActive: true };

            return step;
          })
        );
      }

      if (project?.isClaimStart) {
        setSteps(
          stepsItems.map((step) => {
            return { ...step, isActive: true };
          })
        );
        setIsClaim(project.isClaimStart);
        loadingStateHandler(false);

        return;
      }

      loadingStateHandler(false);
    };

    initialProjectPage();
  }, []);

  return (
    <PageWrapper>
      <StepsWrapper>
        {steps.map((item) => {
          return (
            <StepItemWrapper key={item.title}>
              <Image
                src={item.isActive && !project.isRefunded ? FullMoon : Moon}
                alt={item.title}
              />
              <div>
                <StepKey>{item.title}</StepKey>
                <StepValue>{item.description}</StepValue>
              </div>
            </StepItemWrapper>
          );
        })}
      </StepsWrapper>
      <HeaderWrapper>
        <LeftHeaderWrapper>
          <ProjectHeaderWrapper>
            <span>Important:</span>
            {project.banner}
          </ProjectHeaderWrapper>
          <LeftHeaderPersonInfoWrapper>
            <UserAvatar
              avatar={imageLoader(String(project.logo))}
              variant="default"
              size="project"
              name={project.name}
            />
            <div>
              <HeaderProjectList>
                <ProjectStatusTag>{project.status}</ProjectStatusTag>
                {/* <LinkIcon fill="#00C099" />
                <LinkedinIcon fill="#00C099" />
                <FacebookIcon fill="#00C099" />
                <InstagramIcon fill="#00C099" />
                <TwitterIcon fill="#00C099" /> */}
                <ShareButton onClick={() => setIsShareModal(true)}>
                  <ShareIcon fill="#2082EA" />
                  Share
                </ShareButton>
              </HeaderProjectList>
              <HeaderPersonNameWrapper>
                <HeaderPersonTitle variant="p">
                  {project.name}
                </HeaderPersonTitle>
              </HeaderPersonNameWrapper>
              <HeaderPersonDescription>
                <Typography variant="p">{project.niche}</Typography>
              </HeaderPersonDescription>
            </div>
            <HeaderActionsWrapperMobile>
              {/* <button>
                <CalendarIcon />
              </button>
              <button>
                <NotificationIcon />
              </button> */}
              <button onClick={updateWatchList}>
                <LikeIcon />
              </button>
            </HeaderActionsWrapperMobile>
          </LeftHeaderPersonInfoWrapper>
        </LeftHeaderWrapper>

        <RightHeaderWrapper>
          <RightHeaderHead>
            <div style={{ display: "flex", gap: 10 }} />
            <div>
              <HeaderActionsWrapper>
                <button onClick={updateWatchList}>
                  <LikeIcon active={isWatchListProject} />
                </button>
              </HeaderActionsWrapper>
            </div>
          </RightHeaderHead>
        </RightHeaderWrapper>
      </HeaderWrapper>
      <div>
        <HeaderDescription
          variant="div"
          // @ts-ignore
          dangerouslySetInnerHTML={sanitizedHtml(project.descriptionText)}
        />
      </div>
      <ProjectBodyWrapper>
        <RoundsWrapper>
          <PublicWrapper>
            <RoundTitle variant="p">FCFS</RoundTitle>
            <RoundDescription variant="p">
              Registrations are opened to anyone with more than $1000 worth of
              tokens in their wallet.
              <Link href="/">See Rules</Link>
            </RoundDescription>
            <RoundTimerWrapper>
              <RoundTimerTitle>Contribution Closes</RoundTimerTitle>
              {project.isRefunded ? (
                <></>
              ) : (
                <RoundTimerValue>
                  {days}d {hours}h {minutes}m {seconds}s
                </RoundTimerValue>
              )}
            </RoundTimerWrapper>
          </PublicWrapper>
          <StrongWrapper>
            <RoundTitle variant="p">Strong hold offer</RoundTitle>
            <RoundDescription variant="p">
              Premium round offerings for DAO holders only. Higher winning
              chances with lower fees.
              <Link href="/">See Rules</Link>
            </RoundDescription>
            <RoundTimerWrapper>
              <RoundTimerTitle>Registration closes</RoundTimerTitle>
              {project.isRefunded ? (
                <></>
              ) : (
                <RoundTimerValue>
                  {days}d {hours}h {minutes}m {seconds}s
                </RoundTimerValue>
              )}
            </RoundTimerWrapper>
          </StrongWrapper>
        </RoundsWrapper>
        <ProjectDetails>
          <ProjectDetailsItem>
            <ProjectDetailsTitle>
              {clarifyAmount(Number(project.totalRaised))}$
            </ProjectDetailsTitle>
            <ProjectDetailsDescription>Total Raised</ProjectDetailsDescription>
          </ProjectDetailsItem>
          <ProjectDetailsItem>
            <ProjectDetailsTitle>{project.niche}</ProjectDetailsTitle>
            <ProjectDetailsDescription>Type</ProjectDetailsDescription>
          </ProjectDetailsItem>
        </ProjectDetails>
      </ProjectBodyWrapper>
      <SectionsBtns>
        {sections.map((section: any) => {
          return (
            <SectionBtn
              onClick={() => setSelectedSection(section)}
              key={section?.name}
              selected={section?.name === String(selectedSection?.name)}
            >
              {section?.name}
            </SectionBtn>
          );
        })}
      </SectionsBtns>
      {String(selectedSection?.name) === sections[0].name ? (
        <ProjectDetailsInfo project={project} />
      ) : (
        <IDODetails
          funded={funded}
          myInvest={myInvest}
          favouriteHandler={updateWatchList}
          isFavourite={isWatchListProject}
          isClaim={isClaim}
          isClaimed={isClaimed}
          project={project}
        />
      )}
      <Recommended>
        <RecommendedTitle>Recommended for you</RecommendedTitle>
        <RecommendedList>
          {project?.recommendations ? (
            project.recommendations.map((item: INews) => {
              return <NewsItem key={item._id} newsItem={item} />;
            })
          ) : (
            <></>
          )}
        </RecommendedList>
      </Recommended>
      {isShareModal ? (
        <ShareModal
          onClose={() => setIsShareModal(false)}
          link={`/gemslab/launch/${project._id}`}
        />
      ) : (
        <></>
      )}
    </PageWrapper>
  );
};

export default AcceleratorProject;
