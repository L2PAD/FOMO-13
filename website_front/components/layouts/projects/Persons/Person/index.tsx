/* eslint-disable */
import React, { useState, useContext, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import { toast } from "react-toastify";
import addComment from "../../../../../http/comments/addComment";
import Typography from "../../../../global/common/Typography";
import UserAvatar from "../../../../global/common/UserAvatar";
import CommentBlock from "../../../../global/CommentBlock";
import {
  IPersonWithRefetch,
  PersonDataContext,
} from "../../../../../pages/crypto/persons/[id]";
import imageLoader from "../../../../../helpers/imageLoader";
import {
  AuthContext,
  LocationContext,
  WatchlistContext,
} from "../../../../global/Layout";
import {
  IFlag,
  IComment,
  IPerson,
  ISocialMediaItem,
  IProject,
} from "../../../../../types/global_types";
import addProjectToWatchlist from "../../../../../http/watchlist/addProjectToWatchlist";
import deleteFromWatchlist from "../../../../../http/watchlist/deleteFromWatchlist";
import updateProject from "../../../../../http/projects/updateProject";
import RightIcon from "../../../../../assets/icons/left-arrow.svg";
import {
  BottomActions,
  EditStateWrapper,
  EditWrapper,
  FlagsListsWrapper,
  PageHeader,
  SponsoredWrapper,
} from "../../Crypto/Project/styles";
import fetchProjects from "../../../../../http/projects/fetchProjects";
import fetchPersons from "../../../../../http/persons/fetchPersons";
import {
  ActionsPopover,
  ActionsPopoverTrigger,
  LeftHeaderRightWrapper,
  PopoverActionsContainer,
  PopoverOverlay,
  ProjectActions,
  TabsWrapper,
} from "../../Crypto/Project/crypto-styles";
import {
  ProfileContentGrid as TabsContentWrapper,
  ProfilePrimaryColumn as LeftColumn,
  ProfileSidebarColumn as RightColumn,
  ProfileSidebarTitle as RightColumnTitle,
  ProfileTabsSection,
} from "../../shared/ProfilePageShell";
import FavButton from "../../../../global/common/FavButton";
import SocialLinks from "../../../../global/common/SocialLinks";
import moment from "moment";
import Region from "../../../../global/common/Region";
import Tabs from "../../../../global/Tabs";
import { StatisticsCardsWrapper } from "../../../../global/Tables/ViewTable/ExchangesTable/styles";
import Image from "next/image";
import TopFollowersTab from "../../../../global/TopFollowersTab";
import ScoreBar from "../../../../global/common/ScoreBar";
import AboutPerson from "./AboutPerson";
import TopPersons from "./TopPersons";
import Portfolio from "./Portfolio";
import PersonComparison from "./Comparison";
import TopInvestments from "../../Funds/Fund/TopInvestments";
import GreenFlagsModal from "../../Crypto/Modals/green_flags_modal";
import YellowFlagsModal from "../../Crypto/Modals/yellow_flags_modal";
import RedFlagsModal from "../../Crypto/Modals/red_flags_modal";
import UpdateEntityActions from "../../../../global/UpdateEntityActions";
import { shouldHideTopEditPageAction } from "../../../../../helpers/isEditPageActionHidden";
import { openAuthModal } from "../../../../../helpers/openAuthModal";
import {
  EditItemWrapper,
  HeaderInfoWrapper,
  HeaderItems,
  HeaderUserDescriptionWrapper,
  HeaderUserInfoWrapper,
  HeaderUserName,
  HeaderWrapper,
  SocialsWrapper,
  HeaderDataWrapper,
  HeaderItem,
  PageWrapper,
} from "./styles";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { getServiceByUrl } from "../../../../../helpers/getServiceKeyByUrl";
import SearchCountry from "../../../../global/SearchCountry";
import FlagsListComponent from "../../../../global/common/FlagsList";
import addReaction, {
  addFomoV2Reaction,
} from "../../../../../http/likes/addReaction";
import EntityLikes from "../../../../global/common/EntityLikes";
import SponsoredIcon from "../../../../global/Icons/SponsoredIcon";
import { CalendarIcon, FlagIcon } from "../../../../global/Icons";
import dislikeDefault from "../../../../../assets/icons/otc/dislike-default.svg";
import { Link } from "lucide-react";
import { useTranslation } from "i18n";

const tabs = ["About", "Portfolio", "Comparison"];

export interface IPersonProps {
  person: IPerson;
  personDataToUpdate: IPerson | null;
  isEditState: boolean;
  projects?: Array<IProject>;
  onChange: (name: string, value: any) => void;
}

const toFiniteNumber = (value: any): number => {
  const parsed = Number(
    typeof value === "string"
      ? value.replace(/[$,%\sx]/g, "").replace(/,/g, "")
      : value
  );

  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNullableCount = (value: any): string => {
  const count = toFiniteNumber(value);

  return count > 0 ? String(Math.round(count)) : "-";
};

const getPersonProjects = (person: IPerson): any[] => {
  if (Array.isArray(person.supportedProjects) && person.supportedProjects.length) {
    return person.supportedProjects;
  }

  if (Array.isArray(person.portfolioCoins) && person.portfolioCoins.length) {
    return person.portfolioCoins;
  }

  return [];
};

const getPersonInvestmentsCount = (person: IPerson): number => {
  return Math.max(
    toFiniteNumber(person.projectSupported),
    toFiniteNumber(person.supportedProjectsCount),
    toFiniteNumber(person.projectsCount),
    toFiniteNumber(person.numberOfInvestments),
    toFiniteNumber(person.totalInvestments),
    getPersonProjects(person).length
  );
};

const formatPersonRoi = (value: any, display?: string): string => {
  if (display) return display;

  const roi = toFiniteNumber(value);
  if (!roi) return "-";
  if (Math.abs(roi) <= 20) {
    return `${roi > 0 ? "+" : ""}${roi.toFixed(2).replace(/\.00$/, "")}x`;
  }

  return `${roi > 0 ? "+" : ""}${roi.toFixed(2).replace(/\.00$/, "")}%`;
};

const formatProjectRoi = (value: any): string => {
  const roi = toFiniteNumber(value);
  if (!roi) return "";

  return `${roi > 0 ? "+" : ""}${roi.toFixed(2).replace(/\.00$/, "")}%`;
};

const getTopFundedProjectLabel = (person: IPerson): string => {
  const project =
    person.topFundedProjectData ||
    getPersonProjects(person)
      .slice()
      .sort((left, right) => toFiniteNumber(right?.amount) - toFiniteNumber(left?.amount))[0];

  if (project?.name) {
    const amount = toFiniteNumber(project.amount);
    return amount > 0 ? `${project.name} - $${clarifyAmount(amount)}` : project.name;
  }

  return person.topFundedProject || "-";
};

const getHighestRoiProjectLabel = (person: IPerson): string => {
  const project =
    person.highestRoiProject ||
    getPersonProjects(person)
      .slice()
      .filter((item) => toFiniteNumber(item?.roi) !== 0)
      .sort((left, right) => toFiniteNumber(right?.roi) - toFiniteNumber(left?.roi))[0];

  if (project?.name) {
    const roiLabel = formatProjectRoi(project.roi);
    return roiLabel ? `${project.name} - ${roiLabel}` : project.name;
  }

  const highestRoi = formatProjectRoi(person.highestRoi);
  return highestRoi || "-";
};

const Person = () => {
  const router = useRouter();
  const { translateText } = useTranslation();
  const { userData } = useContext(AuthContext);
  const personData: IPersonWithRefetch = useContext(PersonDataContext);
  const { path } = useContext(LocationContext);
  const { watchlist } = useContext(WatchlistContext);
  const { data } = useQuery("projects", () => fetchProjects(`all/active`));
  const allPersons = useQuery("persons", fetchPersons);
  const [activeTab, setActiveTab] = useState(tabs[0]);

  const [updatedParticipated, setUpdatedParticipated] = useState<
    Array<IProject>
  >([]);
  const [updatedColleagues, setUpdatedColleagues] = useState<Array<IPerson>>(
    []
  );
  const [isEditState, setIsEditState] = useState<boolean>(false);
  const [personDataToUpdate, setPersonDataToUpdate] = useState<IPerson | null>(
    null
  );
  const [isMobile, setIsMobile] = useState(false);

  const [isParticipatedProjects, setIsParticipatedProjects] =
    useState<boolean>(false);
  const [isColleaguesProjects, setIsColleaguesProjects] =
    useState<boolean>(false);
  const [isRedFlagsModal, setIsRedFlagsModal] = useState<boolean>(false);
  const [isGreenFlagsModal, setIsGreenFlagsModal] = useState<boolean>(false);
  const [isYellowFlagsModal, setIsYellowFlagsModal] = useState<boolean>(false);
  const [isInvestorsModal, setIsInvestorsModal] = useState<boolean>(false);

  const [newComments, setNewComments] = useState<Array<IComment>>([]);
  const [isWatchListProject, setIsWatchListProject] = useState<boolean>(
    watchlist?.persons?.find((item: any) => item?._id === personData._id)
  );
  const [isActionsPopoverOpen, setIsActionsPopoverOpen] = useState(false);
  const [isSocialsPopoverOpen, setIsSocialsPopoverOpen] = useState(false);
  const isTopEditPageActionHidden = shouldHideTopEditPageAction(
    router.pathname,
    router.query
  );
  const totalInvestmentsCount = getPersonInvestmentsCount(personData);
  const topFundedProjectLabel = getTopFundedProjectLabel(personData);
  const highestRoiProjectLabel = getHighestRoiProjectLabel(personData);
  const athRoiValue = toFiniteNumber(personData.athRoi ?? personData.roi);
  const athRoiDisplay = formatPersonRoi(
    personData.athRoi ?? personData.roi,
    personData.roiDisplay
  );
  const personAny = personData as any;
  const personFlagEntityId = String(
    personAny?.backerId || personAny?.canonicalBackerId || personAny?._id || ""
  );
  const isV2PersonFlagEntity = Boolean(
    personAny?.backerId || personAny?.canonicalBackerId
  );
  const openPersonAuthModal = (): void => {
    openAuthModal(router);
  };
  const openPersonFlagModal = (flagType: "green" | "yellow" | "red"): void => {
    if (!userData?.isFullAuth) {
      openPersonAuthModal();
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      `persons/comment/${personData._id}`,
      newComment
    );

    if (isSuccess) {
      personData.refetch();
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
      const { success } = await deleteFromWatchlist(
        path,
        String(personData._id)
      );
      if (success) {
        toast.success(
          <div>
            <h3>{translateText("Success!")}</h3>
            <p>{translateText("Person deleted from favorites")}</p>
          </div>
        );
      }
      setIsWatchListProject(false);
      return;
    }

    const { success } = await addProjectToWatchlist(
      path,
      String(personData._id)
    );
    setIsWatchListProject(success);
    if (success) {
      toast.success(
        <div>
          <h3>{translateText("Success!")}</h3>
          <p>{translateText("Person added to favorites")}</p>
        </div>
      );
    }
  };
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
  const updatePersonData = async (values: any): Promise<void> => {
    const editedProject: IPerson = personDataToUpdate
      ? {
          ...personDataToUpdate,
        }
      : {
          ...personData,
        };

    for (const key in values) {
      // @ts-ignore
      editedProject[key] = values[key];
    }

    setPersonDataToUpdate(editedProject);
    setIsGreenFlagsModal(false);
    setIsYellowFlagsModal(false);
    setIsRedFlagsModal(false);
  };

  const confirmUpdateProjects = async (
    projectsIds: Array<string>,
    key: "participated" | "colleagues"
  ): Promise<void> => {
    const oldProjectIds: Array<string> =
      personData?.participated?.map((item: IProject | string) =>
        typeof item !== "string" ? item._id || "" : item
      ) || [];
    const oldFunds: Array<string> = [personData._id || ""];

    if (key === "participated") {
      const projects: Array<IProject> =
        data?.projects.filter((item: IProject) => {
          return projectsIds.includes(String(item._id));
        }) || [];

      data?.projects && setUpdatedParticipated(projects);
      setPersonDataToUpdate((prev: any) => {
        return {
          ...prev,
          participated: projects,
        };
      });
    } else {
      const persons: Array<IPerson> =
        allPersons?.data?.persons.filter((item: IPerson) => {
          return projectsIds.includes(String(item._id));
        }) || [];

      allPersons.data?.persons && setUpdatedColleagues(persons);
      setPersonDataToUpdate((prev: any) => {
        return {
          ...prev,
          colleagues: persons,
        };
      });
    }

    setIsColleaguesProjects(false);
    setIsParticipatedProjects(false);
  };

  const confirmUpdatePerson = async (): Promise<void> => {
    if (!personDataToUpdate) return;

    const updatedProject: any = {
      name: personDataToUpdate.name,
      bio: personDataToUpdate.bio,
      banner: personDataToUpdate.banner,
      niche: personDataToUpdate.niche,
      greenFlagsList: personDataToUpdate.greenFlagsList,
      yellowFlagsList: personDataToUpdate.yellowFlagsList,
      redFlagsList: personDataToUpdate.redFlagsList,
      lastFunding: personDataToUpdate.lastFunding,
      totalInvested: personDataToUpdate.totalInvested,
      categories: personDataToUpdate.categories,
      athRoi: personDataToUpdate.athRoi,
      highestRoi: personDataToUpdate.highestRoi,
      educationBlock: personDataToUpdate.educationBlock,
      experienceBlock: personDataToUpdate.experienceBlock,
      contributionsBlock: personDataToUpdate.contributionsBlock,
      achievementsBlock: personDataToUpdate.achievementsBlock,
      networkBlock: personDataToUpdate.networkBlock,
      influenceBlock: personDataToUpdate.influenceBlock,
      topFundedProject: personDataToUpdate.topFundedProject,
      projectSupported: personDataToUpdate.projectSupported,
      regionData: personDataToUpdate.regionData,
      descriptionText: personDataToUpdate.descriptionText,
      socialmedia: personDataToUpdate.socialmedia,
      investmentPorfolio: personDataToUpdate.investmentPorfolio,
      investmentDistribution: personDataToUpdate.investmentDistribution,
    };

    const { success } = await updateProject(
      `persons/user/${personData._id}`,
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
          <p>{translateText("Your limit on updating persons for today has been reached")}</p>
        </div>
      );
    }

    setIsEditState(false);
  };

  const confirmAction = async (type: "like" | "dislike"): Promise<void> => {
    const personAny = personData as any;
    const backerReactionId = String(
      personAny?.canonicalBackerId || personAny?.backerId || ""
    );
    const isFomoV2BackerReaction = Boolean(
      backerReactionId &&
        (personAny?.dataQuality?.source === "fomo-v2" ||
          personAny?.source?.matchedBy === "v2-backer-id" ||
          personAny?.source?.sourceName)
    );
    const { isSuccess } = isFomoV2BackerReaction
      ? await addFomoV2Reaction("backer", type, backerReactionId)
      : await addReaction("persons", type, personData._id || "");

    if (!isSuccess) {
      toast.error(
        <div>
          <h3>{translateText("Error!")}</h3>
          <p>{translateText("Reaction was not saved")}</p>
        </div>
      );
      return;
    }

    await personData.refetch();
  };

  const inputsHandler = (name: string, value: any): void => {
    setPersonDataToUpdate((prev: any) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleActiveTab = (): React.ReactNode => {
    switch (activeTab) {
      case "About":
        return (
          <AboutPerson
            setIsEditState={() => setIsEditState(true)}
            inputsHandler={inputsHandler}
            isFullAuth={!!userData?.isFullAuth}
            isEditState={isEditState}
            person={personData}
            projectDataToUpdate={personDataToUpdate}
          />
        );
      case "Portfolio":
        return (
          <Portfolio
            isEditState={isEditState}
            person={personData}
            personDataToUpdate={personDataToUpdate}
            onChange={inputsHandler}
          />
        );
      case "Comparison":
        return <PersonComparison project={personData} />;
      default:
        return <></>;
    }
  };

  useEffect(() => {
    if (personData) setPersonDataToUpdate(personData);
  }, [personData]);

  return (
    <>
      <PageWrapper>
        {!isTopEditPageActionHidden && (
          <PageHeader className="entity-actions-header">
            <UpdateEntityActions
              updateEditState={(value: boolean) => setIsEditState(value)}
              isActiveEdit={isEditState}
              onSave={confirmUpdatePerson}
              onCancel={() => setIsEditState(false)}
              onReset={() => setPersonDataToUpdate(personData)}
            />
          </PageHeader>
        )}
        <HeaderWrapper>
          <HeaderInfoWrapper>
            <HeaderUserInfoWrapper>
              <UserAvatar
                isSponsored={personData.isSponsored}
                size="project-page"
                avatar={imageLoader(String(personData.logo))}
                name="name"
                variant="success"
                rating={Number(personData.rating)}
              />
              <div>
                <HeaderUserName>
                  <EditWrapper>
                    <EditItemWrapper>
                      {isEditState ? (
                        <EditStateWrapper>
                          <input
                            style={{ width: "240px", height: "48px" }}
                            placeholder={translateText("Enter the person’s name")}
                            onChange={(e: any) =>
                              inputsHandler("name", e.target.value)
                            }
                            value={personDataToUpdate?.name || ""}
                          />
                        </EditStateWrapper>
                      ) : (
                        <Typography variant="p">{personData.name}</Typography>
                      )}
                    </EditItemWrapper>
                  </EditWrapper>
                  {personData.isSponsored ? (
                    <SponsoredWrapper>
                      <SponsoredIcon />
                      <span>{translateText("Sponsored")}</span>
                    </SponsoredWrapper>
                  ) : (
                    <></>
                  )}
                </HeaderUserName>
                {!isMobile && (
                  <HeaderUserDescriptionWrapper>
                    {isEditState ? (
                      <EditStateWrapper>
                        <input
                          style={{ width: "240px", height: "48px" }}
                          placeholder={translateText("Enter the person’s banner")}
                          onChange={(e: any) =>
                            inputsHandler("banner", e.target.value)
                          }
                          value={personDataToUpdate?.banner || ""}
                        />
                      </EditStateWrapper>
                    ) : (
                      <span>{personData.banner}</span>
                    )}
                  </HeaderUserDescriptionWrapper>
                )}
              </div>
            </HeaderUserInfoWrapper>
            <LeftHeaderRightWrapper>
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
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
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
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
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
                                openPersonFlagModal("green");
                              }}
                            >
                              <FlagIcon stroke="#04A584" />
                              <span>{translateText("Green Flag")}</span>
                            </button>
                            <button
                              onClick={() => {
                                closeActionsPopover();
                                openPersonFlagModal("yellow");
                              }}
                            >
                              <FlagIcon stroke="#FFC702" />
                              <span>{translateText("Yellow Flag")}</span>
                            </button>
                            <button
                              className={
                                Number(personData.redFlagsList?.length) > 0
                                  ? "fill-red"
                                  : ""
                              }
                              onClick={() => {
                                closeActionsPopover();
                                openPersonFlagModal("red");
                              }}
                            >
                              <FlagIcon stroke="#FF5858" />
                              <span>{translateText("Red Flag")}</span>
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
                            <SocialLinks
                              className="projects"
                              links={
                                personData?.socialmedia?.map(
                                  (item: ISocialMediaItem) => {
                                    return {
                                      key: getServiceByUrl(item.href),
                                      href: item.href,
                                    };
                                  }
                                ) || []
                              }
                              showLabel
                            />
                          </PopoverActionsContainer>
                        </ActionsPopover>
                      </>
                    )}
                  </div>
                  <HeaderUserDescriptionWrapper>
                    {isEditState ? (
                      <EditStateWrapper>
                        <input
                          style={{ width: "240px", height: "48px" }}
                          placeholder={translateText("Enter the person’s banner")}
                          onChange={(e: any) =>
                            inputsHandler("banner", e.target.value)
                          }
                          value={personDataToUpdate?.banner || ""}
                        />
                      </EditStateWrapper>
                    ) : (
                      <span>{personData.banner}</span>
                    )}
                  </HeaderUserDescriptionWrapper>
                </>
              ) : (
                <>
                  <ProjectActions>
                    <FavButton
                      onClick={updateWatchList}
                      isFavorite={isWatchListProject}
                    />
                    <EntityLikes
                      likes={personData.likes || []}
                      dislikes={personData.dislikes || []}
                      likesCount={(personData as any).likesCount}
                      dislikesCount={(personData as any).dislikesCount}
                      userReaction={(personData as any).userReaction}
                      onLikeClick={() => confirmAction("like")}
                      onDislikeClick={() => confirmAction("dislike")}
                    />
                    <button
                      onClick={() => openPersonFlagModal("green")}
                      className={
                        Number(personData.greenFlagsList?.length) > 0
                          ? "fill-green"
                          : ""
                      }
                    >
                      {personData?.greenFlagsList?.length ? (
                        <div className="flag-icon">
                          {personData.greenFlagsList.length}
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
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => openPersonFlagModal("yellow")}
                      className={
                        Number(personData.yellowFlagsList?.length) > 0
                          ? "fill-yellow"
                          : ""
                      }
                    >
                      {personData?.yellowFlagsList?.length ? (
                        <div className="flag-icon">
                          {personData.yellowFlagsList.length}
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
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => openPersonFlagModal("red")}
                      className={
                        Number(personData.redFlagsList?.length) > 0
                          ? "fill-red"
                          : ""
                      }
                    >
                      {personData?.redFlagsList?.length ? (
                        <div className="flag-icon">
                          {personData.redFlagsList.length}
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
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                  </ProjectActions>
                  <SocialsWrapper>
                    <SocialLinks
                      className="projects"
                      links={
                        personData?.socialmedia?.map(
                          (item: ISocialMediaItem) => {
                            return {
                              key: getServiceByUrl(item.href),
                              href: item.href,
                            };
                          }
                        ) || []
                      }
                    />
                  </SocialsWrapper>
                </>
              )}
            </LeftHeaderRightWrapper>
          </HeaderInfoWrapper>
          <HeaderDataWrapper>
            <HeaderItem>
              {isEditState ? (
                <EditStateWrapper>
                  <input
                    type={"number"}
                    style={{ width: "125px", height: "33px" }}
                    placeholder="15"
                    onChange={(e: any) =>
                      inputsHandler("projectSupported", e.target.value)
                    }
                    value={String(
                      personDataToUpdate?.projectSupported ||
                        personDataToUpdate?.supportedProjectsCount ||
                        ""
                    )}
                  />
                </EditStateWrapper>
              ) : (
                <div className="value">
                  {formatNullableCount(totalInvestmentsCount)}
                </div>
              )}
              <div className="key">{translateText("Total Investments")}</div>
            </HeaderItem>
            <HeaderItem>
              {isEditState ? (
                <EditStateWrapper>
                  <input
                    className="date-input"
                    type={"date"}
                    style={{ width: "125px", height: "33px" }}
                    placeholder="mm.dd.yy"
                    onChange={(e: any) =>
                      inputsHandler("lastFunding", e.target.value)
                    }
                    value={String(
                      personDataToUpdate?.lastFunding || new Date()
                    )}
                  />
                </EditStateWrapper>
              ) : (
                <div className="value">
                  {personData.lastFunding
                    ? moment(personData.lastFunding).format("ll")
                    : "-"}
                </div>
              )}
              <div className="key">{translateText("Last Funding")}</div>
            </HeaderItem>
            <HeaderItem>
              {isEditState ? (
                <EditStateWrapper>
                  <input
                    className={
                      Number(personDataToUpdate?.athRoi) > 0 ? "green" : "red"
                    }
                    type={"number"}
                    style={{ width: "125px", height: "33px" }}
                    placeholder="0%"
                    onChange={(e: any) =>
                      inputsHandler("athRoi", e.target.value)
                    }
                    value={String(`${personDataToUpdate?.athRoi}`)}
                  />
                  {personDataToUpdate?.athRoi ? (
                    <div
                      className={
                        Number(personDataToUpdate?.athRoi) > 0
                          ? "right-icon green"
                          : "right-icon red"
                      }
                    >
                      %
                    </div>
                  ) : (
                    <></>
                  )}
                </EditStateWrapper>
              ) : (
                <div className="value">
                  {athRoiDisplay !== "-" ? (
                    <span className={athRoiValue >= 0 ? "green" : "red"}>
                      {athRoiDisplay}
                    </span>
                  ) : (
                    <span>-</span>
                  )}
                </div>
              )}
              <div className="key">{translateText("ATH ROI")}</div>
            </HeaderItem>
            {isMobile && (
              <>
                <HeaderItem className="small-item">
                  {isEditState ? (
                    <EditStateWrapper style={{ marginBottom: "4px" }}>
                      <input
                        style={{ width: "125px" }}
                        placeholder="DeFi"
                        value={personDataToUpdate?.niche || ""}
                        onChange={(e: any) =>
                          inputsHandler("niche", e.target.value)
                        }
                      />
                    </EditStateWrapper>
                  ) : (
                    <div className="value">{personData.niche || "-"}</div>
                  )}
                  <div className="key">{translateText("Specialization")}</div>
                </HeaderItem>
                <HeaderItem className="small-item">
                  {isEditState ? (
                    <EditStateWrapper style={{ marginBottom: "4px" }}>
                      <input
                        style={{ width: "125px" }}
                        placeholder="Solana - $20M"
                        value={personDataToUpdate?.topFundedProject || ""}
                        onChange={(e: any) =>
                          inputsHandler("topFundedProject", e.target.value)
                        }
                      />
                    </EditStateWrapper>
                  ) : (
                    <div className="value">
                      {topFundedProjectLabel}
                    </div>
                  )}

                  <div className="key">{translateText("Top Funded Project")}</div>
                </HeaderItem>
                <HeaderItem className="small-item">
                  {isEditState ? (
                    <EditStateWrapper style={{ marginBottom: "4px" }}>
                      <input
                        style={{ width: "125px" }}
                        type={"number"}
                        placeholder="15"
                        value={personDataToUpdate?.projectSupported || ""}
                        onChange={(e: any) =>
                          inputsHandler("projectSupported", e.target.value)
                        }
                      />
                    </EditStateWrapper>
                  ) : (
                    <div className="value">
                      {formatNullableCount(totalInvestmentsCount)}
                    </div>
                  )}
                  <div className="key">{translateText("Projects Supported")}</div>
                </HeaderItem>
                <HeaderItem className="small-item">
                  {isEditState ? (
                    <EditStateWrapper style={{ marginBottom: "4px" }}>
                      <input
                        style={{ width: "125px" }}
                        className={`${
                          Number(personDataToUpdate?.highestRoi) > 0
                            ? "green"
                            : "red"
                        }`}
                        type={"number"}
                        placeholder="0%"
                        value={personDataToUpdate?.highestRoi || ""}
                        onChange={(e: any) =>
                          inputsHandler("highestRoi", e.target.value)
                        }
                      />
                      {personDataToUpdate?.highestRoi ? (
                        <div
                          className={
                            Number(personDataToUpdate?.highestRoi) > 0
                              ? "right-icon green"
                              : "right-icon red"
                          }
                        >
                          %
                        </div>
                      ) : (
                        <></>
                      )}
                    </EditStateWrapper>
                  ) : (
                    <div className="value">
                      {highestRoiProjectLabel}
                    </div>
                  )}
                  <div className="key">{translateText("Highest ROI Project")}</div>
                </HeaderItem>
                <HeaderItem className="small-item">
                  <div className="value">-</div>
                  <div className="key">{translateText("Member since")}</div>
                </HeaderItem>

                <HeaderItem className="small-item">
                  {isEditState ? (
                    <SearchCountry
                      className="small-search"
                      selectedCountry={personDataToUpdate?.regionData || null}
                      onChange={(value: any) =>
                        inputsHandler("regionData", value)
                      }
                    />
                  ) : (
                    <div className="value">
                      {personData?.regionData?.id ? (
                        <Region>
                          {personData?.regionData?.id || ""},{" "}
                          {personData?.regionData?.region}
                        </Region>
                      ) : (
                        "-"
                      )}
                    </div>
                  )}
                  <div className="key">{translateText("Location")}</div>
                </HeaderItem>
              </>
            )}
          </HeaderDataWrapper>
        </HeaderWrapper>

        {!isMobile && (
          <HeaderItems>
            <HeaderItem className="small-item">
              {isEditState ? (
                <EditStateWrapper style={{ marginBottom: "4px" }}>
                  <input
                    style={{ width: "125px" }}
                    placeholder="DeFi"
                    value={personDataToUpdate?.niche || ""}
                    onChange={(e: any) =>
                      inputsHandler("niche", e.target.value)
                    }
                  />
                </EditStateWrapper>
              ) : (
                <div className="value">{personData.niche || "-"}</div>
              )}
              <div className="key">{translateText("Specialization")}</div>
            </HeaderItem>
            <HeaderItem className="small-item">
              {isEditState ? (
                <EditStateWrapper style={{ marginBottom: "4px" }}>
                  <input
                    style={{ width: "125px" }}
                    placeholder="Solana - $20M"
                    value={personDataToUpdate?.topFundedProject || ""}
                    onChange={(e: any) =>
                      inputsHandler("topFundedProject", e.target.value)
                    }
                  />
                </EditStateWrapper>
              ) : (
                <div className="value">
                  {topFundedProjectLabel}
                </div>
              )}

              <div className="key">{translateText("Top Funded Project")}</div>
            </HeaderItem>
            <HeaderItem className="small-item">
              {isEditState ? (
                <EditStateWrapper style={{ marginBottom: "4px" }}>
                  <input
                    style={{ width: "125px" }}
                    type={"number"}
                    placeholder="15"
                    value={personDataToUpdate?.projectSupported || ""}
                    onChange={(e: any) =>
                      inputsHandler("projectSupported", e.target.value)
                    }
                  />
                </EditStateWrapper>
              ) : (
                <div className="value">
                  {formatNullableCount(totalInvestmentsCount)}
                </div>
              )}
              <div className="key">{translateText("Projects Supported")}</div>
            </HeaderItem>
            <HeaderItem className="small-item">
              {isEditState ? (
                <EditStateWrapper style={{ marginBottom: "4px" }}>
                  <input
                    style={{ width: "125px" }}
                    className={`${
                      Number(personDataToUpdate?.highestRoi) > 0
                        ? "green"
                        : "red"
                    }`}
                    type={"number"}
                    placeholder="0%"
                    value={personDataToUpdate?.highestRoi || ""}
                    onChange={(e: any) =>
                      inputsHandler("highestRoi", e.target.value)
                    }
                  />
                  {personDataToUpdate?.highestRoi ? (
                    <div
                      className={
                        Number(personDataToUpdate?.highestRoi) > 0
                          ? "right-icon green"
                          : "right-icon red"
                      }
                    >
                      %
                    </div>
                  ) : (
                    <></>
                  )}
                </EditStateWrapper>
              ) : (
                <div className="value">
                  {highestRoiProjectLabel}
                </div>
              )}
              <div className="key">{translateText("Highest ROI Project")}</div>
            </HeaderItem>
            <HeaderItem className="small-item">
              <div className="value">-</div>
              <div className="key">{translateText("Member since")}</div>
            </HeaderItem>

            <HeaderItem className="small-item">
              {isEditState ? (
                <SearchCountry
                  className="small-search"
                  selectedCountry={personDataToUpdate?.regionData || null}
                  onChange={(value: any) => inputsHandler("regionData", value)}
                />
              ) : (
                <div className="value">
                  {personData?.regionData?.id ? (
                    <Region>
                      {personData?.regionData?.id || ""},{" "}
                      {personData?.regionData?.region}
                    </Region>
                  ) : (
                    "-"
                  )}
                </div>
              )}
              <div className="key">{translateText("Location")}</div>
            </HeaderItem>
          </HeaderItems>
        )}

        <ProfileTabsSection>
          <TabsWrapper className="market-project-tabs">
            <Tabs
              className="project-page"
              onClick={(value) => setActiveTab(value)}
              activeItem={activeTab}
              items={tabs}
            />
          </TabsWrapper>
          <TabsContentWrapper>
            <LeftColumn>{handleActiveTab()}</LeftColumn>
            <RightColumn>
              <StatisticsCardsWrapper>
                <TopInvestments fund={personData} />
                <RightColumnTitle>
                  <h2>{translateText("Top X Followers")}</h2>
                  <button
                    onClick={() => {
                      // setTopModal(true)
                      // setInitialTab('Top Followers')
                    }}
                  >
                    <Image src={RightIcon} alt="investors" />
                  </button>
                </RightColumnTitle>
                <TopFollowersTab
                  followers={personData?.projectTwitterData?.followers || []}
                />

                <h2>{translateText("X Performance")}</h2>
                <ScoreBar
                  score={personData?.twitterScore || 0}
                  maxScore={1000}
                  change={
                    personData?.twitterScore && personData?.previousTwitterScore
                      ? personData?.twitterScore -
                        personData?.previousTwitterScore
                      : 0
                  }
                />

                {personData.greenFlagsList?.length ||
                personData.yellowFlagsList?.length ||
                personData.redFlagsList?.length ||
                isEditState ? (
                  <>
                    <h2>{personData.niche} {translateText("Green, Yellow & Red Flags")}</h2>
                    <FlagsListsWrapper>
                      <FlagsListComponent
                        isEditState={isEditState}
                        onChange={(items: Array<IFlag>) =>
                          inputsHandler("greenFlagsList", items)
                        }
                        flags={
                          isEditState
                            ? personDataToUpdate?.greenFlagsList || []
                            : personData.greenFlagsList || []
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
                            ? personDataToUpdate?.yellowFlagsList || []
                            : personData.yellowFlagsList || []
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
                            ? personDataToUpdate?.redFlagsList || []
                            : personData.redFlagsList || []
                        }
                        type={"red"}
                      />
                    </FlagsListsWrapper>
                  </>
                ) : (
                  <></>
                )}
              </StatisticsCardsWrapper>
            </RightColumn>
          </TabsContentWrapper>
        </ProfileTabsSection>
        <BottomActions>
          {userData?.isFullAuth && isEditState ? (
            <UpdateEntityActions
              updateEditState={(value: boolean) => setIsEditState(value)}
              isActiveEdit={isEditState}
              onSave={confirmUpdatePerson}
              onCancel={() => setIsEditState(false)}
              onReset={() => setPersonDataToUpdate(personData)}
            />
          ) : (
            <></>
          )}
        </BottomActions>
        <TopPersons person={personData} />
        <CommentBlock
          refetch={personData.refetch}
          addComment={confirmAddComment}
          items={
            personData.comments
              ? [...newComments, ...personData.comments]
              : newComments
          }
        />
      </PageWrapper>
      {/* {
        isParticipatedProjects
          ?
          <AddProjectsModal
            data={data}
            onClose={() => setIsParticipatedProjects(false)}
            onSubmit={(projects: Array<any>) => confirmUpdateProjects(projects, 'participated')}
            projects={updatedParticipated.length ? updatedParticipated : personData.participated || []}
          />
          :
          <></>
      }
      {
        isColleaguesProjects
          ?
          <AddProjectsModal
            modalType={'persons'}
            data={allPersons.data}
            onClose={() => setIsColleaguesProjects(false)}
            onSubmit={(projects: Array<any>) => confirmUpdateProjects(projects, 'colleagues')}
            projects={updatedColleagues.length ? updatedColleagues : personData.colleagues || []}
          />
          :
          <></>
      } */}
      {isRedFlagsModal ? (
        <RedFlagsModal
          onClose={() => setIsRedFlagsModal(false)}
          updateProjectData={updatePersonData}
          project={
            isEditState && personDataToUpdate ? personDataToUpdate : personData
          }
          v2EntityType={isV2PersonFlagEntity ? "person" : undefined}
          v2EntityId={isV2PersonFlagEntity ? personFlagEntityId : undefined}
          onSubmitted={() => personData.refetch?.()}
          onAuthRequired={openPersonAuthModal}
        />
      ) : (
        <></>
      )}
      {isGreenFlagsModal ? (
        <GreenFlagsModal
          onClose={() => setIsGreenFlagsModal(false)}
          updateProjectData={updatePersonData}
          project={
            isEditState && personDataToUpdate ? personDataToUpdate : personData
          }
          v2EntityType={isV2PersonFlagEntity ? "person" : undefined}
          v2EntityId={isV2PersonFlagEntity ? personFlagEntityId : undefined}
          onSubmitted={() => personData.refetch?.()}
          onAuthRequired={openPersonAuthModal}
        />
      ) : (
        <></>
      )}
      {isYellowFlagsModal ? (
        <YellowFlagsModal
          onClose={() => setIsYellowFlagsModal(false)}
          updateProjectData={updatePersonData}
          project={
            isEditState && personDataToUpdate ? personDataToUpdate : personData
          }
          v2EntityType={isV2PersonFlagEntity ? "person" : undefined}
          v2EntityId={isV2PersonFlagEntity ? personFlagEntityId : undefined}
          onSubmitted={() => personData.refetch?.()}
          onAuthRequired={openPersonAuthModal}
        />
      ) : (
        <></>
      )}
      {/* {
        isRedFlagsModal
          ?
          <RedFlagsModal
            onClose={() => setIsRedFlagsModal(false)}
            updateProjectData={updatePersonData}
            project={isEditState && personDataToUpdate ? personDataToUpdate : personData}
          />
          :
          <></>
      }
      {
        isGreenFlagsModal
          ?
          <GreenFlagsModal
            onClose={() => setIsGreenFlagsModal(false)}
            updateProjectData={updatePersonData}
            project={isEditState && personDataToUpdate ? personDataToUpdate : personData}
          />
          :
          <></>
      } */}
    </>
  );
};

export default Person;

// <ParticipatedWrapper>
// <ParticipatedHeaderWrapper>
//   <ParticipatedTitle variant="p">Participated ICO</ParticipatedTitle>
//   <ParticipatedActionsWrapper>
//   </ParticipatedActionsWrapper>
// </ParticipatedHeaderWrapper>
// {
//   isEditState
//     ?
//     <EditItemsButton
//       type="projects"
//       onClick={() => setIsParticipatedProjects(true)}
//     />
//     :
//     <></>
// }
// <NFTsWrapper>
//   {
//     isEditState && personDataToUpdate
//       ?
//       personDataToUpdate.participated?.map((item: IPerson) => {
//         return (
//           <Link href={`/${item.projectType}/project/${item._id}?status=${item.status}`} key={item._id}>
//             {/*//@ts-ignore*/}
//             <NFTProject
//               type="default"
//               cardData={item}
//             />
//           </Link>
//         );
//       })
//       :
//       personData.participated?.map((item: IPerson) => {
//         return (
//           <Link href={`/${item.projectType}/project/${item._id}?status=${item.status}`} key={item._id}>
//             {/*//@ts-ignore*/}
//             <NFTProject
//               type="default"
//               cardData={item}
//             />
//           </Link>
//         );
//       })
//   }
// </NFTsWrapper>
// </ParticipatedWrapper>
// <ParticipatedWrapper>
// <ParticipatedHeaderWrapper>
//   <ParticipatedTitle variant="p">Colleagues in ICO</ParticipatedTitle>
// </ParticipatedHeaderWrapper>
// {
//   isEditState
//     ?
//     <EditItemsButton
//       type="persons"
//       onClick={() => setIsColleaguesProjects(true)}
//     />
//     :
//     <></>
// }
// <NFTsWrapper>
//   {
//     isEditState && personDataToUpdate
//       ?
//       personDataToUpdate.colleagues?.map((item: IPerson) => {
//         return (
//           <Link href={`/crypto/person/${item._id}`} key={item._id}>
//             {/*//@ts-ignore*/}
//             <PersonCardWrapper {...item} />
//           </Link>
//         );
//       })
//       :
//       personData.colleagues?.map((item: IPerson) => {
//         return (
//           <Link href={`/crypto/person/${item._id}`} key={item._id}>
//             {/*//@ts-ignore*/}
//             <PersonCardWrapper {...item} />
//           </Link>
//         );
//       })
//   }
// </NFTsWrapper>
// </ParticipatedWrapper>
// <FlagsWrapper>
// <FlagsTitle variant="p">Flags</FlagsTitle>
// <FlagsListsWrapper>
//   <EditWrapper>
//     {
//       isEditState
//         ?
//         <EditItemsButton
//           type="red flags"
//           onClick={() => setIsGreenFlagsModal(true)}
//         />
//         :
//         <></>
//     }
//     <FlagsList>
//       <FlagsListTitle variant="p">Green</FlagsListTitle>
//       <ul>
//         {
//           isEditState && personDataToUpdate?.greenFlagsList
//             ?
//             personDataToUpdate.greenFlagsList.map((item: IFlag, i: number) => {
//               return (
//                 <FlagsListItem key={i}>
//                   <CheckIcon fill="#04A584" />
//                   <span>{item.text}</span>
//                 </FlagsListItem>
//               )
//             })
//             :
//             personData.greenFlagsList?.length
//               ?
//               personData.greenFlagsList.map((item: IFlag, i: number) => {
//                 return (
//                   <FlagsListItem key={i}>
//                     <CheckIcon fill="#04A584" />
//                     <span>{item.text}</span>
//                   </FlagsListItem>
//                 )
//               })
//               :
//               <>-</>
//         }
//       </ul>
//     </FlagsList>
//   </EditWrapper>

//   <EditWrapper>
//     {
//       isEditState
//         ?
//         <EditItemsButton
//           type="red flags"
//           onClick={() => setIsRedFlagsModal(true)}
//         />
//         :
//         <></>
//     }
//     <FlagsList>
//       <FlagsListTitle variant="p">Red</FlagsListTitle>
//       <ul>
//         {
//           isEditState && personDataToUpdate?.redFlagsList
//             ?
//             personDataToUpdate.redFlagsList.map((item: IFlag, i: number) => {
//               return (
//                 <FlagsListItem key={i}>
//                   <CheckIcon fill="#E42736" />
//                   <span>{item.text}</span>
//                 </FlagsListItem>
//               )
//             })
//             :
//             personData.redFlagsList?.length
//               ?
//               personData.redFlagsList.map((item: IFlag, i: number) => {
//                 return (
//                   <FlagsListItem key={i}>
//                     <CheckIcon fill="#E42736" />
//                     <span>{item.text}</span>
//                   </FlagsListItem>
//                 )
//               })
//               :
//               <>-</>
//         }
//       </ul>
//     </FlagsList>
//   </EditWrapper>

// </FlagsListsWrapper>
// </FlagsWrapper>
