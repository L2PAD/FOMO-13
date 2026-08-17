/* eslint-disable */
import React, { useState, useContext, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useSelector } from "react-redux";
import { useQuery } from "react-query";
import { toast } from "react-toastify";
import {
  IComment,
  IFund,
  IProject,
  ISocialMediaItem,
} from "../../../../../types/global_types";
import {
  FundDataContext,
  IFundWithRefetch,
} from "../../../../../pages/crypto/funds/[id]";
import useComments from "../../../../../hooks/useComments";
import RatingCircle from "../../../../global/RatingCircle";
import FilterSortHeader from "../../../../global/FilterSortHeader";
import imageLoader from "../../../../../helpers/imageLoader";
import {
  ProjectCardItem,
  ProjectCardLink,
  ProjectsWrapper,
} from "../../Projects/styles";
import { ProjectsProjectsCards } from "../../../../../staticContent/projects/projects";
import UserAvatar from "../../../../global/common/UserAvatar";
import Typography from "../../../../global/common/Typography";
import RightIcon from "../../../../../assets/icons/left-arrow.svg";
import dislikeDefault from "../../../../../assets/icons/otc/dislike-default.svg";
import AfterCreateFundModal from "../../modals/AfterCreateFundModal";
import {
  CalendarIcon,
  ExternalLink,
  Facebook,
  FlagIcon,
  Github,
  Globe,
  Instagram,
  Link,
  Linkedin,
  MessageCircle,
  Send,
  Tag,
  Twitter,
  Youtube,
} from "lucide-react";
import Tabs from "../../../../global/Tabs";
import CommentBlock from "../../../../global/CommentBlock";
import Pagination from "../../../../global/Pagintaion";
import addComment from "../../../../../http/comments/addComment";
import addProjectToWatchlist from "../../../../../http/watchlist/addProjectToWatchlist";
import deleteFromWatchlist from "../../../../../http/watchlist/deleteFromWatchlist";
import { IFlag } from "../../../../../types/global_types";
import {
  AuthContext,
  LocationContext,
  WatchlistContext,
} from "../../../../global/Layout";
import GreenFlagsModal from "../../Crypto/Modals/green_flags_modal";
import YellowFlagsModal from "../../Crypto/Modals/yellow_flags_modal";
import RedFlagsModal from "../../Crypto/Modals/red_flags_modal";
import DescriptionModal from "../../../../global/modals/description_modal";
import EditNameModal from "../../../../global/common/EditNameModal";
import updateProject from "../../../../../http/projects/updateProject";
import {
  EditBtnsWrapper,
  EditStateWrapper,
  EditWrapper,
  PageHeader,
  SponsoredWrapper,
} from "../../Crypto/Project/styles";
import AddProjectsModal from "../../modals/AddProjectsModal";
import updateFundProjects from "../../../../../http/projects/updateFundProjects";
import fetchProjects from "../../../../../http/projects/fetchProjects";
import { HeaderEditButton } from "../../Crypto/Project/styles";
import EditButton from "../../../../global/common/EditButton";
import EditItemsButton from "../../../../global/common/EditItemsButton";
import {
  ActionsPopover,
  ActionsPopoverTrigger,
  FlagsList,
  FlagsListsWrapper,
  LeftHeaderRightWrapper,
  PopoverActionsContainer,
  PopoverOverlay,
  ProjectActions,
  SocialsWrapper,
  TabsScrollAnchor,
  TabsWrapper,
  XPerformanceNotice,
} from "../../Crypto/Project/crypto-styles";
import {
  HiddenCategoryCount,
  HiddenCategoryItem,
  HiddenCategoryList,
  HiddenCategoryPopover,
} from "../../../../global/common/ProjectHeaderMetadata/styles";
import {
  ProfileContentGrid as TabsContentWrapper,
  ProfilePrimaryColumn as LeftColumn,
  ProfileSidebarColumn as RightColumn,
  ProfileSidebarTitle as RightColumnTitle,
} from "../../shared/ProfilePageShell";
import FavButton from "../../../../global/common/FavButton";
import Overview from "./Overview";
import { StatisticsCardsWrapper } from "../../../../global/Tables/ViewTable/ExchangesTable/styles";
import TopFollowersTab from "../../../../global/TopFollowersTab";
import ScoreProgress from "../../../../global/common/ScoreBar";
import FundMetrics from "./FundMetrics";
import TopInvestments from "./TopInvestments";
import TopFunds from "./TopFunds";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import moment from "moment";
import Portfolio from "./Portfolio";
import { TimeButton } from "../../../../global/common/PriceChart/styles";
import FundPerformance from "./Performance";
import Comparison from "./Comparison";
import {
  ActionButton,
  ActionsWrapper,
  CurrentRoiDescription,
  CurrentRoiValue,
  FlagsListItem,
  FlagsListTitle,
  FlagsTitle,
  FlagsWrapper,
  HeaderDataWrapper,
  HeaderDescription,
  HeaderInfoWrapper,
  HeaderUserDescriptionWrapper,
  HeaderUserInfoWrapper,
  HeaderUserName,
  HeaderWrapper,
  RatingCircleWrapper,
  ParticipatedAction,
  ProjectsContentWrapper,
  ProjectContentTabsWrapper,
  ProjectFiltersWrapper,
  HeaderInfo,
  HeaderBanner,
  HeaderLeftWrapper,
  HeaderItem,
  BottomPage,
  PageWrapper,
} from "./styles";
import { getServiceByUrl } from "../../../../../helpers/getServiceKeyByUrl";
import { openAuthModal } from "../../../../../helpers/openAuthModal";
import { shouldHideTopEditPageAction } from "../../../../../helpers/isEditPageActionHidden";
import UpdateEntityActions from "../../../../global/UpdateEntityActions";
import OtcLike from "../../../../global/Icons/OtcLike";
import OtcDisike from "../../../../global/Icons/OtcDislike";
import SearchCountry from "../../../../global/SearchCountry";
import FlagsListComponent from "../../../../global/common/FlagsList";
import EntityLikes from "../../../../global/common/EntityLikes";
import addReaction, {
  addFomoV2Reaction,
} from "../../../../../http/likes/addReaction";
import SponsoredIcon from "../../../../global/Icons/SponsoredIcon";
import fetchChartData from "../../../../../http/analytics/fetchChartData";
import { useTranslation } from "i18n";

const tabs = ["Overview", "Portfolio", "Performance", "Comparison"];

const FUND_SOCIAL_ICONS: Record<string, React.ElementType> = {
  x: Twitter,
  tg: Send,
  ds: MessageCircle,
  link: Linkedin,
  fs: Facebook,
  inst: Instagram,
  web: Globe,
  youTube: Youtube,
  reddit: MessageCircle,
  tiktok: ExternalLink,
  threads: MessageCircle,
  github: Github,
};

const FUND_SOCIAL_LABELS: Record<string, string> = {
  x: "X",
  tg: "Telegram",
  ds: "Discord",
  link: "LinkedIn",
  fs: "Facebook",
  inst: "Instagram",
  web: "Website",
  youTube: "YouTube",
  reddit: "Reddit",
  tiktok: "TikTok",
  threads: "Threads",
  github: "GitHub",
};

const toFiniteNumber = (value: any): number | null => {
  const parsed = Number(
    typeof value === "string"
      ? value.replace(/[$,%\s]/g, "").replace(/,/g, "")
      : value
  );

  return Number.isFinite(parsed) ? parsed : null;
};

const hasNonZeroMetricValue = (value?: number | string | null): boolean => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue !== 0;
};

const formatNullableAmount = (value: any): string => {
  const parsed = toFiniteNumber(value);
  if (!parsed || parsed <= 0) return "-";

  return `$${clarifyAmount(parsed, true)}`;
};

const formatNullableCount = (value: any): string => {
  const parsed = toFiniteNumber(value);
  if (!parsed || parsed <= 0) return "-";

  return String(Math.round(parsed));
};

const formatNullablePercent = (value: any): string => {
  const parsed = toFiniteNumber(value);
  if (!parsed || parsed <= 0) return "-";

  return `${Math.round(parsed)}%`;
};

const formatNullableRoi = (fund: IFund): string => {
  if (fund.roiDisplay) return fund.roiDisplay;

  const parsed = toFiniteNumber(fund.roi || fund.averageRoi);
  if (!parsed) return "-";
  if (Math.abs(parsed) <= 20) return `${parsed.toFixed(2).replace(/\.00$/, "")}x`;

  return `${parsed > 0 ? "+" : ""}${Math.round(parsed)}%`;
};

const normalizeSocialmedia = (fund: IFund): Array<ISocialMediaItem> => {
  const fromArray = Array.isArray(fund.socialmedia) ? fund.socialmedia : [];
  const fromLinks = Object.entries(fund.socialLinks || {})
    .filter(([, href]) => Boolean(href))
    .map(([name, href]) => ({
      name,
      href: String(href),
    }));
  const seen = new Set<string>();

  return [...fromArray, ...fromLinks].filter((item) => {
    if (!item?.href || seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
};

export interface IFundProps {
  fund: IFund;
  fundDataToUpdate: IFund | null;
  isEditState: boolean;
  projects?: Array<IProject>;
  inputsHandler: (name: string, value: any) => void;
  setIsEdit?: () => void;
}

const Fund = () => {
  const router = useRouter();
  const { translateText } = useTranslation();
  const fund: IFundWithRefetch = useContext(FundDataContext);
  const fundTabsAnchorRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [addFundModal, setAddFundModal] = useState(false);
  const { data } = useQuery(
    ["projects", activeTab],
    () => fetchProjects(`all/active?status=${activeTab}`),
    { enabled: addFundModal }
  );
  const { userData } = useContext(AuthContext);
  const { path } = useContext(LocationContext);
  const { watchlist } = useContext(WatchlistContext);
  const fundSocialmedia = useMemo(() => normalizeSocialmedia(fund), [fund]);
  const fundSocialLinks = useMemo(
    () =>
      fundSocialmedia.map((item) => ({
        href: item.href,
        key: getServiceByUrl(item.href),
      })),
    [fundSocialmedia]
  );
  const fundCategories = useMemo(
    () =>
      Array.from(
        new Set(
          (fund.categories || [])
            .map((category) => category.trim())
            .filter(Boolean)
        )
      ),
    [fund.categories]
  );
  const hiddenFundCategories = fundCategories.slice(1);
  const supportedProjectsCount =
    fund.supportedProjectsCount ||
    fund.projectsCount ||
    fund.stats?.portfolioProjects ||
    fund.supportedProjects?.length ||
    fund.portfolioCoinsCount ||
    0;
  const totalInvestments =
    fund.stats?.totalInvestments ||
    fund.totalInvestments ||
    fund.numberOfInvestments ||
    supportedProjectsCount;
  const fundAny = fund as any;
  const fundFlagEntityId = String(
    fundAny?.backerId || fundAny?.canonicalBackerId || fundAny?._id || ""
  );
  const isV2FundFlagEntity = Boolean(fundAny?.backerId || fundAny?.canonicalBackerId);
  const openFundAuthModal = (): void => {
    openAuthModal(router);
  };
  const openFundFlagModal = (flagType: "green" | "yellow" | "red"): void => {
    if (!userData?.isFullAuth) {
      openFundAuthModal();
      return;
    }

    if (flagType === "green") {
      setIsGreenFlagsModal(true);
      return;
    }

    if (flagType === "yellow") {
      setIsYellowFlagsModal(true);
      return;
    }

    setIsRedFlagsModal(true);
  };
  const locationLabel =
    fund.regionData?.id || fund.regionData?.region
      ? `${fund.regionData?.id || fund.country || ""}${
          fund.regionData?.region ? `, ${fund.regionData.region}` : ""
        }`
      : fund.location || fund.country || "-";

  const [isUpdatedProjects, setIsUpdatedProjects] = useState<boolean>(false);
  const [updatedProjects, setUpdatedProjects] = useState<Array<IProject>>([]);
  const [isEditState, setIsEditState] = useState<boolean>(false);
  const [fundDataToUpdate, setFundDataToUpdate] = useState<IFund | null>(null);

  const [isRedFlagsModal, setIsRedFlagsModal] = useState<boolean>(false);
  const [isGreenFlagsModal, setIsGreenFlagsModal] = useState<boolean>(false);
  const [isYellowFlagsModal, setIsYellowFlagsModal] = useState<boolean>(false);
  const [isBioModal, setIsBioModal] = useState<boolean>(false);
  const [isNameModal, setIsNameModal] = useState<boolean>(false);
  const [isActionsPopoverOpen, setIsActionsPopoverOpen] = useState(false);
  const [isSocialsPopoverOpen, setIsSocialsPopoverOpen] = useState(false);
  const isTopEditPageActionHidden = shouldHideTopEditPageAction(
    router.pathname,
    router.query
  );

  const [newComments, setNewComments] = useState<Array<IComment>>([]);
  const [page, setPage] = useState(1);
  const [thankFundModal, setThankFundModal] = useState(false);
  const [sortValue, setSorthValue] = useState("");
  const [isWatchListProject, setIsWatchListProject] = useState<boolean>(
    watchlist?.funds?.find((item: any) => item?._id === fund._id)
  );

  // Add a new responsive state to handle mobile view
  const [isMobile, setIsMobile] = useState(false);

  // Add effect to detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const updateFundData = async (values: any): Promise<void> => {
    const editedProject: IFund = fundDataToUpdate
      ? {
        ...fundDataToUpdate,
      }
      : {
        ...fund,
      };

    for (const key in values) {
      // @ts-ignore
      editedProject[key] = values[key];
    }

    setFundDataToUpdate(editedProject);
    setIsRedFlagsModal(false);
    setIsYellowFlagsModal(false);
    setIsGreenFlagsModal(false);
  };

  const confirmAddComment = async (text: string): Promise<void> => {
    if (!userData.isFullAuth) {
      toast.error(
        <div>
          <h3>{translateText("Error!")}</h3>
          <p>{translateText("You need to be fully logged in to add comments")}</p>
        </div>
      );
      return;
    }

    const newComment: IComment = {
      text,
      author: [userData],
      date: new Date(),
    };

    const { isSuccess } = await addComment(
      `funds/comment/${fund._id}`,
      newComment
    );

    if (isSuccess) {
      setNewComments((prev: Array<IComment>) => {
        return [newComment, ...prev];
      });
    }
  };

  const updateWatchList = async (): Promise<void> => {
    if (!userData.isFullAuth) {
      toast.error(
        <div>
          <h3>{translateText("Error!")}</h3>
          <p>{translateText("You need to be fully logged in to add project to watchlist")}</p>
        </div>
      );
      return;
    }

    if (isWatchListProject) {
      const { success } = await deleteFromWatchlist(path, String(fund._id));

      if (success) {
        toast.success(
          <div>
            <h3>{translateText("Success!")}</h3>
            <p>{translateText("Fund deleted from favorites")}</p>
          </div>
        );
      }

      setIsWatchListProject(false);

      return;
    }

    const { success } = await addProjectToWatchlist(path, String(fund._id));

    setIsWatchListProject(success);

    if (success) {
      toast.success(
        <div>
          <h3>{translateText("Success!")}</h3>
          <p>{translateText("Fund added to favorites")}</p>
        </div>
      );
    }
  };

  const confirmUpdateFund = async (): Promise<void> => {
    if (!fundDataToUpdate) return;

    // const oldProjectIds: Array<string> = fund?.projects?.map((item: IProject) => item._id || '') || []
    // const newProjectIds: Array<string> =
    //   isUpdatedProjects
    //     ?
    //     updatedProjects?.map((item: IProject) => item._id || '') || []
    //     :
    //     oldProjectIds

    const oldFunds: Array<string> = [fund._id || ""];

    const updatedProject: any = {
      name: fundDataToUpdate.name,
      banner: fundDataToUpdate.banner,
      descriptionText: fundDataToUpdate.descriptionText,
      greenFlagsList: fundDataToUpdate.greenFlagsList,
      yellowFlagsList: fundDataToUpdate.yellowFlagsList,
      redFlagsList: fundDataToUpdate.redFlagsList,
      categories: fundDataToUpdate.categories,
      socialmedia: fundDataToUpdate.socialmedia,
      georaphyInvestments: fundDataToUpdate.georaphyInvestments,
      numberOfInvestments: fundDataToUpdate.numberOfInvestments,
      averageRoi: fundDataToUpdate.averageRoi,
      currentAum: fundDataToUpdate.currentAum,
      activities: fundDataToUpdate.activities,
      recentExits: fundDataToUpdate.recentExits,
      foundedDate: fundDataToUpdate.foundedDate,
      investAmount: fundDataToUpdate.investAmount,
      regionData: fundDataToUpdate.regionData,
      industryFocus: fundDataToUpdate.industryFocus,
      oldFunds: [],
      newFunds: [],
      oldProjectIds: [],
      newProjectIds: [],
    };

    const { success } = await updateProject(
      `funds/user/${fund._id}`,
      updatedProject
    );

    if (success) {
      toast.success(
        <div>
          <h3>{translateText("Success!")}</h3>
          <p>{translateText("Updates have been sent for moderation")}</p>
        </div>
      );
    } else {
      toast.error(
        <div>
          <h3>{translateText("Error!")}</h3>
          <p>{translateText("Your limit on updating funds for today has been reached")}</p>
        </div>
      );
    }

    setIsEditState(false);
  };

  const confirmAction = async (type: "like" | "dislike"): Promise<void> => {
    const fundAny = fund as any;
    const backerReactionId = String(
      fundAny?.canonicalBackerId || fundAny?.backerId || ""
    );
    const isFomoV2BackerReaction = Boolean(
      backerReactionId &&
        (fundAny?.dataQuality?.source === "fomo-v2" ||
          fundAny?.source?.matchedBy === "v2-backer-id" ||
          fundAny?.source?.sourceName)
    );
    const { isSuccess } = isFomoV2BackerReaction
      ? await addFomoV2Reaction("backer", type, backerReactionId)
      : await addReaction("funds", type, fund._id || "");

    if (!isSuccess) {
      toast.error(
        <div>
          <h3>{translateText("Error!")}</h3>
          <p>{translateText("Reaction was not saved")}</p>
        </div>
      );
      return;
    }

    await fund.refetch();
  };

  const saveFundProjects = async (
    projectsIds: Array<string>
  ): Promise<void> => {
    data?.projects &&
      setUpdatedProjects(
        data.projects.filter((item: IProject) => {
          return projectsIds.includes(String(item._id));
        })
      );
    setIsUpdatedProjects(true);
    setAddFundModal(false);
  };

  const inputsHandler = (name: string, value: any): void => {
    setFundDataToUpdate((prev: any) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const getActiveTab = () => {
    switch (activeTab) {
      case "Overview":
        return (
          <Overview
            fundDataToUpdate={fundDataToUpdate}
            fund={fund}
            isEditState={isEditState}
            inputsHandler={inputsHandler}
          />
        );
      case "Portfolio":
        return (
          <Portfolio
            fundDataToUpdate={fundDataToUpdate}
            fund={fund}
            isEditState={isEditState}
            inputsHandler={inputsHandler}
          />
        );
      case "Performance":
        return <FundPerformance fund={fund} />;
      case "Comparison":
        return <Comparison fund={fund} />;
      default:
        break;
    }
  };

  useEffect(() => {
    if (fund) setFundDataToUpdate(fund);
  }, [fund]);

  const handleActionsClick = () => {
    setIsActionsPopoverOpen(!isActionsPopoverOpen);
  };

  const closeActionsPopover = () => {
    setIsActionsPopoverOpen(false);
  };

  const handleSocialsClick = () => {
    setIsSocialsPopoverOpen(!isSocialsPopoverOpen);
  };

  const closeSocialsPopover = () => {
    setIsSocialsPopoverOpen(false);
  };

  const scrollToFundTabs = (): void => {
    const scrollFrame = window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        fundTabsAnchorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
    });

    window.setTimeout(() => window.cancelAnimationFrame(scrollFrame), 250);
  };

  const handleTabClick = (value: string): void => {
    setActiveTab(value);
    scrollToFundTabs();
  };

  const renderFundSocialLinks = (limit = 4, showLabel = false) => {
    const displayedLinks = fundSocialLinks.slice(0, limit);
    const hiddenLinks = fundSocialLinks.slice(limit);
    const hiddenCount = Math.max(fundSocialLinks.length - limit, 0);

    const renderSocialLink = (
      item: { key: string; href: string },
      index: number,
      withLabel = showLabel
    ) => {
      const Icon = FUND_SOCIAL_ICONS[item.key] || FUND_SOCIAL_ICONS.web;
      const label = FUND_SOCIAL_LABELS[item.key] || "Website";

      return (
        <a
          key={`${item.href}-${index}`}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
        >
          <Icon size={17} strokeWidth={2.1} />
          {withLabel ? (
            <span className="market-social-label">{label}</span>
          ) : null}
        </a>
      );
    };

    return (
      <div className={`market-social-links${showLabel ? " with-labels" : ""}`}>
        {displayedLinks.length
          ? displayedLinks.map((item, index) =>
              renderSocialLink(item, index)
            )
          : "-"}
        {hiddenCount > 0 ? (
          <span className="market-social-more-popover">
            <span className="market-social-more" tabIndex={0}>
              +{hiddenCount}
            </span>
            <span className="market-social-more-dropdown">
              {hiddenLinks.map((item, index) =>
                renderSocialLink(item, index + limit, true)
              )}
            </span>
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <PageWrapper>
        {userData?.isFullAuth && !isTopEditPageActionHidden && (
          <PageHeader className="entity-actions-header">
            <UpdateEntityActions
              updateEditState={(value: boolean) => setIsEditState(value)}
              isActiveEdit={isEditState}
              onSave={confirmUpdateFund}
              onCancel={() => setIsEditState(false)}
              onReset={() => setFundDataToUpdate(fund)}
              className={isMobile ? "mobile-edit-btn" : ""}
            />
          </PageHeader>
        )}

        <HeaderWrapper>
          <HeaderInfoWrapper>
            <HeaderLeftWrapper>
              <HeaderUserInfoWrapper>
                <UserAvatar
                  isSponsored={fund.isSponsored}
                  size="project-page"
                  avatar={imageLoader(String(fund.logo))}
                  name="name"
                  variant="success"
                  rating={Number(fund.rating)}
                  className="project-avatar"
                  fallbackType="project"
                />
                <div>
                  <HeaderInfo>
                    <HeaderUserName>
                      {isEditState ? (
                        <EditStateWrapper>
                          <input
                            style={{
                              width: isMobile ? "100%" : "240px",
                              height: "48px",
                              maxWidth: "240px",
                            }}
                            placeholder={translateText("Enter the fund's name")}
                            onChange={(e: any) =>
                              inputsHandler("name", e.target.value)
                            }
                            value={fundDataToUpdate?.name || ""}
                          />
                        </EditStateWrapper>
                      ) : (
                        <Typography variant="p">{fund.name}</Typography>
                      )}
                      {fund.isSponsored ? (
                        <SponsoredWrapper>
                          <SponsoredIcon />
                          <span>{translateText("Sponsored")}</span>
                        </SponsoredWrapper>
                      ) : (
                        <></>
                      )}
                    </HeaderUserName>
                    <HeaderBanner>
                      {isEditState ? (
                        <EditStateWrapper
                          style={{
                            marginTop: "5px",
                            width: isMobile ? "100%" : "auto",
                          }}
                        >
                          <input
                            style={{
                              width: isMobile ? "100%" : "240px",
                              height: "48px",
                              maxWidth: "240px",
                            }}
                            placeholder={translateText("Enter the fund's banner")}
                            onChange={(e: any) =>
                              inputsHandler("banner", e.target.value)
                            }
                            value={fundDataToUpdate?.banner || ""}
                          />
                        </EditStateWrapper>
                      ) : (
                        fund.banner || fund.type || fund.niche || "-"
                      )}
                    </HeaderBanner>
                  </HeaderInfo>
                  <HeaderUserDescriptionWrapper>
                    {/* <LinkIcon fill="#00C099" />
                <LinkedinIcon fill="#00C099" />
                <FacebookIcon fill="#00C099" />
                <InstagramIcon fill="#00C099" />
                <TwitterIcon fill="#00C099" /> */}
                  </HeaderUserDescriptionWrapper>
                </div>
              </HeaderUserInfoWrapper>
              <LeftHeaderRightWrapper
                className={isMobile ? "left-header-bottom" : "left-header-right"}
              >
                {isMobile ? (
                  // Mobile: Show trigger buttons with popovers
                  <>
                    <div>
                      <ActionsPopoverTrigger
                        data-popover-trigger
                        onClick={handleActionsClick}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="17"
                          height="13"
                          viewBox="0 0 17 13"
                          fill="none"
                        >
                          <path
                            d="M5.08378 1H15.1016M5.08378 6.49457H15.1016M5.08378 11.9891H15.1016M1.10156 1V1.01085M1.10156 6.49457V6.50543M1.10156 11.9891V12"
                            stroke="#738094"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </ActionsPopoverTrigger>
                      {isActionsPopoverOpen && (
                        <>
                          <PopoverOverlay onClick={closeActionsPopover} />
                          <ActionsPopover data-popover-trigger>
                            <PopoverActionsContainer>
                              <FavButton
                                onClick={() => {
                                  updateWatchList();
                                  closeActionsPopover();
                                }}
                                isFavorite={isWatchListProject}
                                label="Add To Watchlist"
                              />
                              <EntityLikes
                                likes={fund.likes || []}
                                dislikes={fund.dislikes || []}
                                likesCount={(fund as any).likesCount}
                                dislikesCount={(fund as any).dislikesCount}
                                userReaction={(fund as any).userReaction}
                                onLikeClick={() => confirmAction("like")}
                                onDislikeClick={() => confirmAction("dislike")}
                              />
                              <button
                                onClick={() => {
                                  confirmAction("like");
                                  closeActionsPopover();
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 18 18"
                                  fill="none"
                                >
                                  <path
                                    d="M1 17H5.36364M3.18182 9.34783V1H17L14.8182 5.17391L17 9.34783H3.18182ZM3.18182 9.34783V16.3043"
                                    stroke="#04A584"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span>{translateText("Add to Favorites")}</span>
                              </button>
                              <button
                                onClick={() => {
                                  confirmAction("dislike");
                                  closeActionsPopover();
                                }}
                              >
                                <CalendarIcon width={20} height={20} />
                                <span>{translateText("Calendar")}</span>
                              </button>
                              <button onClick={closeActionsPopover}>
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M9.66667 6.33333H13.6367C13.9207 6.33334 14.2001 6.40595 14.4482 6.54427C14.6963 6.68259 14.9049 6.88202 15.0543 7.12364C15.2036 7.36525 15.2888 7.64104 15.3016 7.9248C15.3144 8.20857 15.2545 8.4909 15.1275 8.745L12.2108 14.5783C12.0724 14.8554 11.8595 15.0884 11.596 15.2512C11.3325 15.414 11.0289 15.5001 10.7192 15.5H7.37167C7.23583 15.5 7.1 15.4833 6.9675 15.45L3.83333 14.6667M9.66667 6.33333V2.16667C9.66667 1.72464 9.49107 1.30072 9.17851 0.988155C8.86595 0.675595 8.44203 0.5 8 0.5H7.92083C7.50417 0.5 7.16667 0.8375 7.16667 1.25417C7.16667 1.84917 6.99083 2.43083 6.66 2.92583L3.83333 7.16667V14.6667M9.66667 6.33333H8M3.83333 14.6667H2.16667C1.72464 14.6667 1.30072 14.4911 0.988155 14.1785C0.675595 13.866 0.5 13.442 0.5 13V8C0.5 7.55797 0.675595 7.13405 0.988155 6.82149C1.30072 6.50893 1.72464 6.33333 2.16667 6.33333H4.25"
                                    stroke="#04A584"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span>{translateText("Like")}</span>
                              </button>
                              <button onClick={closeActionsPopover}>
                                <Image
                                  src={dislikeDefault}
                                  alt="Dislike"
                                  width={20}
                                  height={20}
                                />
                                <span>{translateText("Dislike")}</span>
                              </button>
                              <button
                                onClick={() => {
                                  closeActionsPopover();
                                  openFundFlagModal("green");
                                }}
                              >
                                <FlagIcon stroke="#04A584" />
                                <span>{translateText("Green Flag")}</span>
                              </button>
                              <button
                                onClick={() => {
                                  closeActionsPopover();
                                  openFundFlagModal("yellow");
                                }}
                              >
                                <FlagIcon stroke="#FFC702" />
                                <span>{translateText("Yellow Flag")}</span>
                              </button>
                            </PopoverActionsContainer>
                          </ActionsPopover>
                        </>
                      )}
                    </div>
                    <div>
                      <ActionsPopoverTrigger
                        data-popover-trigger
                        onClick={handleSocialsClick}
                        className="socials-trigger"
                      >
                        <Link width={20} height={20} color="#738094" />
                      </ActionsPopoverTrigger>
                      {isSocialsPopoverOpen && (
                        <>
                          <PopoverOverlay onClick={closeSocialsPopover} />
                          <ActionsPopover data-popover-trigger>
                            <PopoverActionsContainer>
                              {renderFundSocialLinks(50, true)}
                            </PopoverActionsContainer>
                          </ActionsPopover>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <ProjectActions
                      className={`fund-page ${isMobile ? "mobile" : ""}`}
                    >
                      <FavButton
                        onClick={updateWatchList}
                        isFavorite={isWatchListProject}
                      />
                      <EntityLikes
                        likes={fund.likes || []}
                        dislikes={fund.dislikes || []}
                        likesCount={(fund as any).likesCount}
                        dislikesCount={(fund as any).dislikesCount}
                        userReaction={(fund as any).userReaction}
                        onLikeClick={() => confirmAction("like")}
                        onDislikeClick={() => confirmAction("dislike")}
                      />
                      <button
                        onClick={() => openFundFlagModal("green")}
                        className={
                          Number(fund.greenFlagsList?.length) > 0
                            ? "fill-green"
                            : ""
                        }
                      >
                        {fund?.greenFlagsList?.length ? (
                          <div className="flag-icon">
                            {fund.greenFlagsList.length}
                          </div>
                        ) : (
                          <></>
                        )}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                        >
                          <path
                            d="M1 17H5.36364M3.18182 9.34783V1H17L14.8182 5.17391L17 9.34783H3.18182ZM3.18182 9.34783V16.3043"
                            stroke="#04A584"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => openFundFlagModal("yellow")}
                        className={
                          Number(fund.yellowFlagsList?.length) > 0
                            ? "fill-yellow"
                            : ""
                        }
                      >
                        {fund?.yellowFlagsList?.length ? (
                          <div className="flag-icon">
                            {fund.yellowFlagsList.length}
                          </div>
                        ) : (
                          <></>
                        )}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                        >
                          <path
                            d="M1 17H5.36364M3.18182 9.34783V1H17L14.8182 5.17391L17 9.34783H3.18182ZM3.18182 9.34783V16.3043"
                            stroke="#FFC702"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => openFundFlagModal("red")}
                        className={
                          Number(fund.redFlagsList?.length) > 0
                            ? "fill-red"
                            : ""
                        }
                      >
                        {fund?.redFlagsList?.length ? (
                          <div className="flag-icon">
                            {fund.redFlagsList.length}
                          </div>
                        ) : (
                          <></>
                        )}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                        >
                          <path
                            d="M1 17H5.36364M3.18182 9.34783V1H17L14.8182 5.17391L17 9.34783H3.18182ZM3.18182 9.34783V16.3043"
                            stroke="#FF5858"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </ProjectActions>
                    <SocialsWrapper
                      className={isMobile ? "mobile-socials" : ""}
                    >
                      {renderFundSocialLinks(4)}
                    </SocialsWrapper>
                  </>
                )}
              </LeftHeaderRightWrapper>
            </HeaderLeftWrapper>
            <HeaderDataWrapper>
              <HeaderItem>
                {isEditState ? (
                  <EditStateWrapper style={{ width: "100%" }}>
                    <input
                      type={"number"}
                      style={{ width: "100%", height: "33px" }}
                      placeholder={translateText("Enter amount")}
                      onChange={(e: any) =>
                        inputsHandler("numberOfInvestments", Number(e.target.value))
                      }
                      value={String(fundDataToUpdate?.numberOfInvestments || 0)}
                    />
                  </EditStateWrapper>
                ) : (
                  <div className="value">
                    {formatNullableCount(totalInvestments)}
                  </div>
                )}
                <div className="key">{translateText("Total Investments")}</div>
              </HeaderItem>
              <HeaderItem>
                {isEditState ? (
                  <EditStateWrapper style={{ width: "100%" }}>
                    <input
                      className="date-input"
                      type={"date"}
                      style={{ width: "100%", height: "33px" }}
                      placeholder="mm.dd.yy"
                      onChange={(e: any) =>
                        inputsHandler("foundedDate", e.target.value)
                      }
                      value={String(
                        fundDataToUpdate?.foundedDate || new Date()
                      )}
                    />
                  </EditStateWrapper>
                ) : (
                  <div className="value">
                    {fund.foundedDate ? moment(fund.foundedDate).format("ll") : "-"}
                  </div>
                )}

                <div className="key">{translateText("Founded")}</div>
              </HeaderItem>
              <HeaderItem>
                {isEditState ? (
                  <EditStateWrapper style={{ width: "100%" }}>
                    <input
                      style={{ width: "100%", height: "35px" }}
                      placeholder={translateText("Enter the fund's category")}
                      onChange={(e: any) =>
                        inputsHandler("industryFocus", e.target.value)
                      }
                      value={fund.categories?.length ? fund.categories[0] : '-'}
                    />
                  </EditStateWrapper>
                ) : (
                  <div className="value" style={{ fontSize: "14px" }}>
                    <span>{fundCategories[0] || "-"}</span>
                    {hiddenFundCategories.length ? (
                      <HiddenCategoryPopover>
                        <HiddenCategoryCount
                          tabIndex={0}
                          aria-label={`${hiddenFundCategories.length} ${translateText("more categories")}`}
                        >
                          +{hiddenFundCategories.length}
                        </HiddenCategoryCount>
                        <HiddenCategoryList className="fund-category-list">
                          {hiddenFundCategories.map((category) => (
                            <HiddenCategoryItem key={category}>
                              <Tag aria-hidden="true" />
                              <span>{category}</span>
                            </HiddenCategoryItem>
                          ))}
                        </HiddenCategoryList>
                      </HiddenCategoryPopover>
                    ) : null}
                  </div>
                )}
                <div className="key">{translateText("Category")}</div>
              </HeaderItem>

              <HeaderItem>
                {isEditState ? (
                  <SearchCountry
                    className="small-search"
                    selectedCountry={fundDataToUpdate?.regionData || null}
                    onChange={(value: any) =>
                      inputsHandler("regionData", value)
                    }
                  />
                ) : (
                  <div className="value" style={{ fontSize: "14px" }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="18"
                      viewBox="0 0 14 18"
                      fill="none"
                    >
                      <path
                        d="M7.00013 17C7.00013 17 13.261 11.4348 13.261 7.26087C13.261 3.80309 10.4579 1 7.00013 1C3.54234 1 0.739258 3.80309 0.739258 7.26087C0.739258 11.4348 7.00013 17 7.00013 17Z"
                        stroke="#FF5858"
                      />
                      <path
                        d="M9.00038 7.00013C9.00038 8.1047 8.10495 9.00013 7.00038 9.00013C5.89581 9.00013 5.00038 8.1047 5.00038 7.00013C5.00038 5.89556 5.89581 5.00013 7.00038 5.00013C8.10495 5.00013 9.00038 5.89556 9.00038 7.00013Z"
                        stroke="#FF5858"
                      />
                    </svg>
                    {locationLabel}
                  </div>
                )}
                <div className="key">{translateText("Location")}</div>
              </HeaderItem>
            </HeaderDataWrapper>
          </HeaderInfoWrapper>
          {/* <div>
            <EditWrapper>
              {
                isEditState
                  ?
                  <EditStateWrapper>
                    <textarea
                      placeholder="Bio:"
                      onChange={(e: any) => inputsHandler('bio', e.target.value)}
                      value={fundDataToUpdate?.bio || ''}
                    />
                  </EditStateWrapper>
                  :
                  <HeaderDescription variant="p">
                    {fund.bio}
                  </HeaderDescription>
              }
            </EditWrapper>
          </div> */}
        </HeaderWrapper>

        <ProjectsContentWrapper>
          <TabsScrollAnchor ref={fundTabsAnchorRef} />
          <TabsWrapper className="market-project-tabs">
            <Tabs
              className="project-page"
              onClick={handleTabClick}
              activeItem={activeTab}
              items={tabs}
            />
          </TabsWrapper>
          <TabsContentWrapper>
            <LeftColumn className={isMobile ? "mobile-column" : ""}>
              {getActiveTab()}
            </LeftColumn>
            <RightColumn className={isMobile ? "mobile-column" : ""}>
              <RightColumnTitle>
                <h2>{translateText("General Fund Metrics")}</h2>
              </RightColumnTitle>
              <FundMetrics
                fund={fund}
                isEditState={isEditState}
                fundDataToUpdate={fundDataToUpdate}
                inputsHandler={inputsHandler}
              />
              <TopInvestments fund={fund} />
              <StatisticsCardsWrapper>
                <RightColumnTitle style={{ marginTop: "20px" }}>
                  <h2>{translateText("Top X Followers")}</h2>
                  <button>
                    <Image src={RightIcon} alt="investors" />
                  </button>
                </RightColumnTitle>
                <TopFollowersTab
                  followers={fund?.projectTwitterData?.followers || []}
                />

                <h2>{translateText("X Performance")}</h2>
                {hasNonZeroMetricValue(fund?.twitterScore) ? (
                  <ScoreProgress
                    score={fund?.twitterScore || 0}
                    maxScore={1000}
                    change={
                      fund?.twitterScore && fund?.previousTwitterScore
                        ? fund?.twitterScore - fund?.previousTwitterScore
                        : 0
                    }
                  />
                ) : (
                  <XPerformanceNotice>
                    {translateText("X performance data is not available yet")}
                  </XPerformanceNotice>
                )}

                <FlagsListsWrapper>
                  <FlagsListComponent
                    isEditState={isEditState}
                    onChange={(items: Array<IFlag>) =>
                      inputsHandler("greenFlagsList", items)
                    }
                    flags={
                      isEditState
                        ? fundDataToUpdate?.greenFlagsList || []
                        : fund.greenFlagsList || []
                    }
                    type={"green"}
                  />

                  <FlagsListComponent
                    isEditState={isEditState}
                    onChange={(items: Array<IFlag>) =>
                      inputsHandler("yellowFlagsList", items)
                    }
                    flags={
                      isEditState
                        ? fundDataToUpdate?.yellowFlagsList || []
                        : fund.yellowFlagsList || []
                    }
                    type={"yellow"}
                  />

                  <FlagsListComponent
                    isEditState={isEditState}
                    onChange={(items: Array<IFlag>) =>
                      inputsHandler("redFlagsList", items)
                    }
                    flags={
                      isEditState
                        ? fundDataToUpdate?.redFlagsList || []
                        : fund.redFlagsList || []
                    }
                    type={"red"}
                  />
                </FlagsListsWrapper>
              </StatisticsCardsWrapper>
            </RightColumn>
          </TabsContentWrapper>
          <BottomPage>
            {userData?.isFullAuth ? (
              <UpdateEntityActions
                updateEditState={(value: boolean) => setIsEditState(value)}
                isActiveEdit={isEditState}
                onSave={confirmUpdateFund}
                onCancel={() => setIsEditState(false)}
                onReset={() => setFundDataToUpdate(fund)}
              />
            ) : (
              <></>
            )}
          </BottomPage>
          {/* {
            isEditState
              ?
              <EditItemsButton
                type="projects"
                onClick={() => setAddFundModal(true)}
              />
              :
              <></>
          }
          <ProjectFiltersWrapper>
            <FilterSortHeader
              isFilter={false}
              isGrid={false}
              sort={{
                label: "Sort by",
                type: "total raised",
                options: [
                  {
                    label: "Total raised",
                    items: ["Low", "High"],
                    value: sortValue,
                    setValue: setSorthValue,
                  },
                ],
              }}
            />
          </ProjectFiltersWrapper>
          <ProjectsWrapper>
            {
              filteredProjects.map((item: IProject) => {
                return (
                  <ProjectCardLink href={`/crypto/project/${item._id}`} key={item._id}>
                    <ProjectCardItem
                      type="default"
                      //@ts-ignore
                      cardData={item}
                    />
                  </ProjectCardLink>
                );
              })
            }
            {
              Number(fund?.projects?.length) > 20
                ?
                <Pagination
                  page={page}
                  total={20}
                  limit={10}
                  totalPage={20}
                  onChange={(value) => setPage(value)}
                />
                :
                <></>
            }
          </ProjectsWrapper> */}
        </ProjectsContentWrapper>

        <TopFunds fund={fund} />

        <CommentBlock
          refetch={fund.refetch}
          addComment={confirmAddComment}
          items={
            fund.comments ? [...newComments, ...fund.comments] : newComments
          }
        />
        {/* {
          addFundModal
            ?
            <AddProjectsModal
              data={data}
              onClose={() => setAddFundModal(false)}
              onSubmit={saveFundProjects}
              projects={updatedProjects.length ? updatedProjects : fund.projects || []}
            />
            :
            <></>
        } */}
        {thankFundModal && (
          <AfterCreateFundModal onClose={() => setThankFundModal(false)} />
        )}
        {isGreenFlagsModal ? (
          <GreenFlagsModal
            onClose={() => setIsGreenFlagsModal(false)}
            updateProjectData={updateFundData}
            project={isEditState && fundDataToUpdate ? fundDataToUpdate : fund}
            v2EntityType={isV2FundFlagEntity ? "backer" : undefined}
            v2EntityId={isV2FundFlagEntity ? fundFlagEntityId : undefined}
            onSubmitted={() => fund.refetch?.()}
            onAuthRequired={openFundAuthModal}
          />
        ) : (
          <></>
        )}
        {isYellowFlagsModal ? (
          <YellowFlagsModal
            onClose={() => setIsYellowFlagsModal(false)}
            updateProjectData={updateFundData}
            project={isEditState && fundDataToUpdate ? fundDataToUpdate : fund}
            v2EntityType={isV2FundFlagEntity ? "backer" : undefined}
            v2EntityId={isV2FundFlagEntity ? fundFlagEntityId : undefined}
            onSubmitted={() => fund.refetch?.()}
            onAuthRequired={openFundAuthModal}
          />
        ) : (
          <></>
        )}
        {isRedFlagsModal ? (
          <RedFlagsModal
            onClose={() => setIsRedFlagsModal(false)}
            updateProjectData={updateFundData}
            project={isEditState && fundDataToUpdate ? fundDataToUpdate : fund}
            v2EntityType={isV2FundFlagEntity ? "backer" : undefined}
            v2EntityId={isV2FundFlagEntity ? fundFlagEntityId : undefined}
            onSubmitted={() => fund.refetch?.()}
            onAuthRequired={openFundAuthModal}
          />
        ) : (
          <></>
        )}
      </PageWrapper>
    </>
  );
};

export default Fund;
