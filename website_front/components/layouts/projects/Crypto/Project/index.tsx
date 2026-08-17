/* eslint-disable */
import React, { useState, useContext, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { ProjectDataContext } from "../../../../../contexts/projectDataContext";
import {
  AuthContext,
  LocationContext,
  WatchlistContext,
} from "../../../../global/Layout";
import BreadCrumbs from "../../../../global/BreadCrumbs";
import UserAvatar, {
  AvatarVariants,
} from "../../../../global/common/UserAvatar";
import Typography from "../../../../global/common/Typography";
import StatusTag from "../../../../global/StatusTag";
import ProgressBar from "../../../../global/common/ProgressBar";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { clarifyDate } from "../../../../../helpers/clarifyDate";
import Tabs from "../../../../global/Tabs";
import ShareModal from "../../../../global/modals/ShareModal";
import CommentBlock from "../../../../global/CommentBlock";
import { Link } from "lucide-react";
import Fundraising, { COLORS } from "./Fundraising";
import dislikeDefault from "../../../../../assets/icons/otc/dislike-default.svg";

import { useRouter } from "next/router";
import {
  IComment,
  IFlag,
  IFundingRound,
  IProject,
  IRoundItem,
  ISocialMediaItem,
  ITokenAllocationItem,
  IUploadImg,
} from "../../../../../types/global_types";
import imageLoader from "../../../../../helpers/imageLoader";
import addComment from "../../../../../http/comments/addComment";
import addProjectToWatchlist from "../../../../../http/watchlist/addProjectToWatchlist";
import deleteFromWatchlist from "../../../../../http/watchlist/deleteFromWatchlist";
import AddInvestorsModal from "../Modals/add_investors_modal";
import InvestorsModal from "../Modals/investors_modal";
import TeamListModal from "../Modals/team_list_modal";
import AddTeamListModal from "../Modals/add_tem_list_modal";
import GreenFlagsModal from "../Modals/green_flags_modal";
import YellowFlagsModal from "../Modals/yellow_flags_modal";
import RedFlagsModal from "../Modals/red_flags_modal";
import ExchangeSettings from "../Modals/exchange_settings";
import useProjectPath from "../../../../../hooks/useProjectPath";
import updateProject from "../../../../../http/projects/updateProject";
import Button from "../../../../global/common/Button";
import CustomDatePicker from "../../../../global/CustomDatePicker";
import ModalDatePicker from "../../../../global/common/components_for_modals/modal_date_picker";
import EditItemsButton from "../../../../global/common/EditItemsButton";
import notificationService from "../../../../../http/notifications/notificationService";
import CreateEventModal from "../../../../global/modals/create_event_modal";
import AddRoundModal from "../Modals/add_round_modal";
import RightIcon from "../../../../../assets/icons/left-arrow.svg";
import ScoreBar from "../../../../global/common/ScoreBar";
import EmptySection from "../../../../global/EmptySection";
import SelectedIcon from "../../../../global/Icons/SelectedIcon";
import HourGlassIcon from "../../../../global/Icons/HourGlassIcon";
import PrivateSellIcon from "../../../../global/Icons/PrivateSellIcon";
import {
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  EditIcon,
  FlagIcon,
  IdeaIcon,
  LikeIcon,
  NotificationIcon,
  ShareIcon,
  TwitterIcon,
} from "../../../../global/Icons";
import {
  HeaderActionsWrapper,
  HeaderDataText,
  HeaderDataTextWrapper,
  HeaderDescription,
  HeaderEditButton,
  HeaderPersonTitle,
  HeaderUsersRow,
  HeaderUserWrapper,
  HeaderWrapper,
  PageTabsWrapper,
  PersonMainPrice,
  PersonPriceCurrency,
  PersonPriceTitle,
  PersonPriceWrapper,
  ProgressMinWrapper,
  ProgressWrapper,
  ProjectDescriptionDataWrapper,
  ProjectDescriptionItem,
  ProjectHeaderBlockWrapper,
  RatingMediaList,
  RatingMediaListItem,
  RatingMediaWrapper,
  RightHeaderHead,
  ShareButton,
  ShareTagText,
  ShareTagWrapper,
  RangeDescription,
  RangeDescriptionWrapper,
  RangeTitle,
  RangeValue,
  RangeWrapper,
  FlagsListTitle,
  FlagsTitle,
  FlagsWrapper,
  HeaderActionsWrapperMobile,
  LeftHeaderPersonalWrapper,
  PersonCurrencyWrapper,
  EditWrapper,
  EditStateWrapper,
  ShareHeadWrapper,
  EditBtnsWrapper,
  ProjectDatePicketWrapper,
  PriceInfo,
  PageHeader,
  SponsoredWrapper,
  BottomActions,
} from "./styles";
import AddProjectsModal from "../../modals/AddProjectsModal";
import { PageWrapper } from "../../CryptoMarket/styles";
import {
  FlagsList,
  FlagsListsWrapper,
  LeftColumn,
  LeftHeaderRightWrapper,
  LeftHeaderWrapper,
  PriceInfoWrapper,
  ProjectActions,
  RightColumn,
  RightColumnTitle,
  RightHeaderWrapper,
  HeaderPersonDescription,
  SocialsWrapper,
  TabsContentWrapper,
  TabsWrapper,
  ActionsTriggerButton,
  ActionsPopoverOverlay,
  ActionsPopoverContent,
  PopoverActionsContainer,
  ActionsPopoverTrigger,
  PopoverOverlay,
  ActionsPopover,
  LeftHeaderPersonInfoWrapper,
  TabsScrollAnchor,
} from "./crypto-styles";
import DataQualityNotice from "./DataQualityNotice";
import { EchoProfileScope } from "./echo-styles";
import FavButton from "../../../../global/common/FavButton";
import SocialLinks from "../../../../global/common/SocialLinks";
import ProjectHeaderMetadata from "../../../../global/common/ProjectHeaderMetadata";
import moment from "moment";
import {
  PieContentWrapper,
  PieValuesPercentage,
  PieValuesPercentageWrapper,
  PieValuesWrapper,
  PieWrapper,
  Title,
} from "./Fundraising/styles";
import PieGraphic from "./Fundraising/pie";
import PieAllocationsGraphic, {
  TokenAllocationListSkeleton,
  TokenAllocationPieSkeleton,
} from "./Fundraising/tokenAllocations";
import {
  StatisticsCardHeader,
  StatisticsCardsWrapper,
} from "../../../../global/Tables/ViewTable/ExchangesTable/styles";
import {
  CardKey,
  CardRow,
  CardValue,
  PercentKey,
  PercentUpdateItem,
  StatisticsCard,
} from "./ProjectPriceStatistics/styles";
import { PercentText } from "../../../../global/PersonCard/styles";
import Converter from "../../../../global/common/Converter";
import Image from "next/image";
import InvestorsTab from "../../../../global/InvestorsTab";
import TopFollowersTab from "../../../../global/TopFollowersTab";
import TopModal, { TopModalVariants } from "../Modals/top_modal";
import TopInvestorsModal from "../Modals/top_investors_modal";
import ProjectHub from "./ProjectHub";
import TrendingAssets from "./Assets";
import FundingRounds from "./FundingRounds";
import IcoFundraising from "./Fundraising/IcoFundraising";
import IcoComparison from "./IcoComparison";
import UpdateEntityActions from "../../../../global/UpdateEntityActions";
import SponsoredIcon from "../../../../global/Icons/SponsoredIcon";
import FlagsListComponent from "../../../../global/common/FlagsList";
import { readFileAsBase64 } from "../../../../../helpers/readFileAsBase64";
import { getServiceByUrl } from "../../../../../helpers/getServiceKeyByUrl";
import { openAuthModal } from "../../../../../helpers/openAuthModal";
import { shouldHideTopEditPageAction } from "../../../../../helpers/isEditPageActionHidden";
import CreateButton from "../../../../global/common/CreateButton";
import { IProjectWithRefetch } from "../../../../../contexts/projectDataContext";
import EntityLikes from "../../../../global/common/EntityLikes";
import addReaction, {
  addFomoV2Reaction,
} from "../../../../../http/likes/addReaction";
import { useTranslation } from "i18n";
import { useQuery } from "react-query";
import fetchProjectUnlocks from "../../../../../http/projects/fetchProjectUnlocks";
import fetchProjectTopInvestors from "../../../../../http/investors/fetchProjectTopInvestors";
import { sortInvestorsByRating } from "../../../../../helpers/investorRating";
import {
  buildDropstabTokenAllocation,
  formatAllocationPercent,
  normalizeTokenAllocationItems,
} from "../../../../../helpers/dropstabTokenAllocation";
import { resolveProjectTokenDisplaySymbol } from "../../../../../helpers/projectTokenSymbol";

const ProjectPageContentScope: React.FC<{
  isEcho: boolean;
  children: React.ReactNode;
}> = ({ isEcho, children }) =>
  isEcho ? (
    <EchoProfileScope className="echo-profile">{children}</EchoProfileScope>
  ) : (
    <>{children}</>
  );

const items = [
  { title: "Projects", link: "projects/projects" },
  { title: "SharkRace Club", link: "projects/project/123" },
];

export const dataAllocation = [
  { name: "Seed Round", allocated: 18.5, value: 10 },
  { name: "Private Sale", allocated: 29.5, value: 15 },
  { name: "Public Sale", allocated: 23, value: 5 },
  { name: "Team & Advisors", allocated: 13.8, value: 20 },
  { name: "Ecosystem & Rewards", value: 30 },
  { name: "Liquidity & Market Making", value: 10 },
  { name: "Staking & Yield Farming", value: 10 },
];

export const participantsItems = ["Team", "Advisors", "Partners"];

const tabs = ["Overview", "Exchanges", "Fundraising", "News"];

const tabsUpcoming = ["About", "Fundraising", "Tokenomics", "Comparison"];

const PROJECT_TOP_INVESTORS_PREVIEW_LIMIT = 10;

export type ParticipantsKeys = "investors" | "team" | "advisors" | "partners";

const firstText = (...values: Array<any>): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value))
      return String(value);
  }

  return "";
};

const getProjectCategoryLabel = (category: any): string => {
  if (!category) return "";
  if (typeof category === "string") return category.trim();

  return firstText(
    category?.name,
    category?.title,
    category?.label,
    category?.slug
  );
};

const normalizeProjectCategories = (categories: Array<any>): string[] => {
  const seen = new Set<string>();

  return categories
    .map(getProjectCategoryLabel)
    .filter(Boolean)
    .filter((category) => {
      const key = category.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const parseScoreValue = (value: any): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(1000, Math.round(value)));
  }

  if (typeof value !== "string") return null;

  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!match) return null;

  const parsed = Number(match[0]);
  if (!Number.isFinite(parsed)) return null;

  const normalized =
    value.includes("%") && parsed <= 100 ? parsed * 10 : parsed;
  return Math.max(0, Math.min(1000, Math.round(normalized)));
};

const getRatingVariant = (rating: number): AvatarVariants => {
  if (rating < 50) return "error";
  if (rating < 70) return "warn";

  return "success";
};

const formatPercentOrPlaceholder = (value: any, fractionDigits = 2): string => {
  const percent = Number(value || 0);
  if (!Number.isFinite(percent) || percent === 0) return "--";

  return `${percent.toFixed(fractionDigits)}%`;
};

const parseRoundNumber = (value: any): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const normalizedValue = Number(value.replace(/[$,\s]/g, ""));
    return Number.isFinite(normalizedValue) ? normalizedValue : 0;
  }

  return 0;
};

const getRoundDateTimestamp = (round: any): number | null => {
  const dateCandidates = [
    round?.endDate,
    round?.startDate,
    round?.date,
    round?.unlockDate,
  ];

  for (const value of dateCandidates) {
    if (!value) continue;

    const timestamp = new Date(value).getTime();
    if (Number.isFinite(timestamp)) return timestamp;
  }

  return null;
};

const getLatestFundingRound = (
  rounds?: Array<IFundingRound>
): IFundingRound | null => {
  if (!rounds?.length) return null;

  return rounds.reduce((latestRound, currentRound) => {
    const latestTimestamp = getRoundDateTimestamp(latestRound);
    const currentTimestamp = getRoundDateTimestamp(currentRound);

    if (
      currentTimestamp !== null &&
      (latestTimestamp === null || currentTimestamp >= latestTimestamp)
    ) {
      return currentRound;
    }

    if (currentTimestamp === null && latestTimestamp === null) {
      return currentRound;
    }

    return latestRound;
  }, rounds[0]);
};

const getFundingRoundRaised = (round?: IFundingRound | null): number =>
  parseRoundNumber(
    (round as any)?.raised ??
      (round as any)?.amount ??
      (round as any)?.fundsRaised
  );

const getFundingRoundGoal = (round?: IFundingRound | null): number =>
  parseRoundNumber(
    (round as any)?.goal ??
      (round as any)?.preValuation ??
      (round as any)?.valuation ??
      (round as any)?.fdv
  );

const getFundingRoundProgress = (round?: IFundingRound | null): number => {
  const raised = getFundingRoundRaised(round);
  const goal = getFundingRoundGoal(round);

  if (!goal || !Number.isFinite(raised) || !Number.isFinite(goal)) return 0;

  return Math.min(Math.max((raised / goal) * 100, 0), 100);
};

const getFundingRoundTitle = (round?: IFundingRound | null): string =>
  firstText(
    (round as any)?.roundName,
    (round as any)?.stage,
    round?.type,
    round?.distributionType
  ) || "--";

const getFundingRoundIcon = (round?: IFundingRound | null) => {
  const distributionType = round?.distributionType?.trim().toLowerCase();

  if (distributionType === "ended") return <SelectedIcon />;
  if (distributionType === "launched") return <PrivateSellIcon />;

  return <HourGlassIcon />;
};

const formatFundingRoundPrice = (
  round: IFundingRound | null,
  symbol?: string,
  fallbackPrice?: number
): string => {
  const tokenPrice = parseRoundNumber(
    (round as any)?.tokenPrice ?? (round as any)?.price ?? fallbackPrice
  );

  if (!tokenPrice) return "--";

  return `1 ${symbol || ""} = $${clarifyAmount(tokenPrice, false, "", 6)}`;
};

const getContractValue = (contract: any): string => {
  if (typeof contract === "string") return contract.trim();

  return firstText(
    contract?.contract,
    contract?.address,
    contract?.contractAddress,
    contract?.tokenAddress,
    contract?.value
  );
};

const getSmartContractLogo = (item: any): string => {
  const logo =
    typeof item?.networkImage === "string"
      ? item.networkImage.trim()
      : typeof item?.chainLogo === "string"
        ? item.chainLogo.trim()
        : typeof item?.logo === "string"
          ? item.logo.trim()
          : "";

  if (!logo || logo === "null" || logo === "undefined") return "";
  return logo;
};

const normalizeSmartContracts = (
  items: Array<any>,
  fallbackAddress?: string
): Array<any> => {
  const seen = new Set<string>();
  const contracts: Array<any> = [];

  for (const item of items) {
    const contract = getContractValue(item);
    const key = contract.toLowerCase();

    if (!contract || seen.has(key)) continue;
    seen.add(key);
    contracts.push({
      ...(typeof item === "object" && item ? item : {}),
      contract,
      networkName:
        item?.networkName || item?.network || item?.chain || "Contract",
      networkImage: getSmartContractLogo(item),
    });
  }

  if (fallbackAddress) {
    const key = fallbackAddress.toLowerCase();
    if (!seen.has(key)) {
      contracts.unshift({
        contract: fallbackAddress,
        networkName: "Contract",
        networkImage: "",
      });
    }
  }

  return contracts;
};

const IcoProject = () => {
  const { translateText } = useTranslation();
  const router = useRouter();
  const isEchoProjectRoute = router.pathname === "/echo/[slug]";
  const isTopEditPageActionHidden = shouldHideTopEditPageAction(
    router.pathname,
    router.query
  );
  const location: string = useProjectPath() || "projects";
  const { status } = router.query;
  const [investorsModal, setInvestorsModal] = useState(false);
  const [addInvestorsModal, setAddInvestorsModal] = useState(false);
  const [teamModal, setTeamModal] = useState(false);
  const [addTeamModal, setAddTeamModal] = useState(false);
  const [greenFlagsModal, setGreenFlagsModal] = useState(false);
  const [yellowFlagsModal, setYellowFlagsModal] = useState(false);
  const [redFlagsModal, setRedFlagsModal] = useState(false);
  const [isEventModal, setIsEventModal] = useState(false);
  const [topInvestorsModal, setTopInvestorsModal] = useState(false);
  const [topModal, setTopModal] = useState<boolean>(false);
  const [initialTab, setInitialTab] =
    useState<TopModalVariants>("Top Followers");
  const [participantActiveTab, setParticipantActiveTab] = useState(
    participantsItems[0]
  );
  const [isMobile, setIsMobile] = useState(false);

  const { path } = useContext(LocationContext);
  const { userData, isAuth } = useContext(AuthContext);
  const { watchlist } = useContext(WatchlistContext);
  const project: IProjectWithRefetch = useContext(ProjectDataContext);
  const projectRating = Number(project?.rating) || 1;
  const projectRatingVariant = getRatingVariant(projectRating);
  const latestFundingRound = getLatestFundingRound(project?.fundraising);
  const latestFundingRoundRaised = getFundingRoundRaised(latestFundingRound);
  const latestFundingRoundGoal = getFundingRoundGoal(latestFundingRound);
  const latestFundingRoundProgress =
    getFundingRoundProgress(latestFundingRound);
  const latestFundingRoundTitle = getFundingRoundTitle(latestFundingRound);
  const latestFundingRoundPrice = formatFundingRoundPrice(
    latestFundingRound,
    resolveProjectTokenDisplaySymbol(project),
    project?.price
  );

  const routeProjectActive = String(status).toLowerCase() === "active";
  const isIcoProject =
    project?.source === "icodrops" || project?.projectType === "project";
  const projectActive = routeProjectActive || isIcoProject;
  const projectTabs = projectActive ? tabsUpcoming : tabs;
  const projectInvestors =
    project?.investors?.length || !project?.rawIcoData?.uiInvestors?.length
      ? project?.investors || []
      : project.rawIcoData.uiInvestors;
  const projectTopFollowers = project?.topFollowers?.length
    ? project.topFollowers
    : project?.topfollowers?.length
      ? project.topfollowers
      : project?.rawIcoData?.uiTopFollowers || [];
  const projectAny = project as any;
  const isVestingReviewed = Boolean(project?.isVestingReview);
  const projectTopInvestorsCoingeckoId = String(
    project?.coingeckoId || projectAny?.providerIds?.coingeckoId || ""
  ).trim();
  const projectTopInvestorsCanonicalId = String(
    projectAny?.canonicalProjectId || ""
  ).trim();
  const projectFlagEntityId = String(
    projectAny?.canonicalProjectId ||
      projectAny?.readModelId ||
      projectAny?._id ||
      ""
  );
  const isV2IcoFlagEntity = Boolean(projectAny?.canonicalProjectId);
  const openProjectAuthModal = (): void => {
    openAuthModal(router);
  };
  const openProjectFlagModal = (flagType: "green" | "yellow" | "red"): void => {
    if (!userData?.isFullAuth) {
      openProjectAuthModal();
      return;
    }

    if (flagType === "green") {
      setGreenFlagsModal(true);
      return;
    }

    if (flagType === "yellow") {
      setYellowFlagsModal(true);
      return;
    }

    setRedFlagsModal(true);
  };
  const useV2ProjectTopInvestors = Boolean(
    projectTopInvestorsCoingeckoId || projectTopInvestorsCanonicalId
  );
  const projectTopInvestorsV2Key =
    projectTopInvestorsCoingeckoId || projectTopInvestorsCanonicalId;
  const projectTopInvestorsV2Lookup = projectTopInvestorsCoingeckoId
    ? "coingeckoId"
    : "canonicalProjectId";
  const legacyProjectTopInvestorsKey = String(
    project?._id || project?.slug || project?.sourceId || ""
  ).trim();
  const projectTopInvestorsKey = useV2ProjectTopInvestors
    ? projectTopInvestorsV2Key
    : legacyProjectTopInvestorsKey;
  const projectTopInvestorsSource = useV2ProjectTopInvestors
    ? "fomo-v2"
    : "legacy";
  const {
    data: projectTopInvestorsResponse,
    isLoading: isProjectTopInvestorsLoading,
  } = useQuery(
    [
      "project-top-investors",
      projectTopInvestorsSource,
      projectTopInvestorsKey,
      useV2ProjectTopInvestors ? projectTopInvestorsV2Lookup : "",
      PROJECT_TOP_INVESTORS_PREVIEW_LIMIT,
    ],
    () =>
      fetchProjectTopInvestors(
        projectTopInvestorsKey,
        PROJECT_TOP_INVESTORS_PREVIEW_LIMIT,
        useV2ProjectTopInvestors
          ? { source: "fomo-v2", lookup: projectTopInvestorsV2Lookup }
          : { source: "legacy" }
      ),
    {
      enabled: Boolean(projectTopInvestorsKey),
      staleTime: 5 * 60 * 1000,
    }
  );
  const { data: projectTopInvestorsFullResponse } = useQuery(
    [
      "project-top-investors",
      projectTopInvestorsSource,
      projectTopInvestorsKey,
      useV2ProjectTopInvestors ? projectTopInvestorsV2Lookup : "",
      "all",
    ],
    () =>
      fetchProjectTopInvestors(
        projectTopInvestorsKey,
        "all",
        useV2ProjectTopInvestors
          ? { source: "fomo-v2", lookup: projectTopInvestorsV2Lookup }
          : { source: "legacy" }
      ),
    {
      enabled: Boolean(projectTopInvestorsKey) && topInvestorsModal,
      staleTime: 5 * 60 * 1000,
    }
  );
  const projectTopInvestors = sortInvestorsByRating(
    projectTopInvestorsResponse?.isSuccess &&
      projectTopInvestorsResponse.investors?.length
      ? projectTopInvestorsResponse.investors
      : projectInvestors
  ).slice(0, PROJECT_TOP_INVESTORS_PREVIEW_LIMIT);
  const projectTopInvestorsModal = sortInvestorsByRating(
    projectTopInvestorsFullResponse?.isSuccess &&
      projectTopInvestorsFullResponse.investors?.length
      ? projectTopInvestorsFullResponse.investors
      : projectTopInvestors
  );
  const rawIcoData = project?.rawIcoData || {};
  const projectEcosystems = project?.ecosystems?.length
    ? project.ecosystems
    : rawIcoData.ecosystems || [];
  const projectLaunchpads = project?.launchpads?.length
    ? project.launchpads
    : rawIcoData.launchpads || [];
  const firstProjectContract = project?.contracts
    ?.map(getContractValue)
    .find(Boolean);
  const firstSmartContract = project?.smartContracts
    ?.map(getContractValue)
    .find(Boolean);
  const firstRawContract = rawIcoData?.contracts
    ?.map(getContractValue)
    .find(Boolean);
  const firstRawSmartContract = rawIcoData?.smartContracts
    ?.map(getContractValue)
    .find(Boolean);
  const projectSmartContract = firstText(
    project?.tokenAddress,
    firstSmartContract,
    firstProjectContract,
    rawIcoData?.tokenAddress,
    rawIcoData?.contractAddress,
    firstRawSmartContract,
    firstRawContract
  );

  const projectSmartContractDisplay = projectSmartContract;
  const projectSmartContracts = normalizeSmartContracts(
    [
      ...(Array.isArray(project?.contracts) ? project.contracts : []),
      ...(Array.isArray(project?.smartContracts) ? project.smartContracts : []),
      ...(Array.isArray(rawIcoData?.contracts) ? rawIcoData.contracts : []),
      ...(Array.isArray(rawIcoData?.smartContracts)
        ? rawIcoData.smartContracts
        : []),
    ],
    projectSmartContract
  );
  const projectCategories = normalizeProjectCategories([
    ...(Array.isArray(project?.categories) ? project.categories : []),
    project?.mainCategory?.name,
    project?.mainCategory,
    project?.type,
    ...(Array.isArray(projectEcosystems) ? projectEcosystems : []),
    ...(Array.isArray(projectLaunchpads) ? projectLaunchpads : []),
  ]);
  const xPerformanceScore = parseScoreValue(
    project?.twitterPerformance || rawIcoData?.social?.raw?.twitterPerformance
  );
  const circulatingSupplyValue = Number(project?.circulatingSupply || 0);
  const totalSupplyValue = Number(project?.totalSupply || 0);
  const circulatingSupplyPercent =
    totalSupplyValue > 0 && Number.isFinite(circulatingSupplyValue)
      ? (circulatingSupplyValue / totalSupplyValue) * 100
      : 0;

  const [isEditState, setIsEditState] = useState<boolean>(false);
  const isLimitedEditState: boolean = isEditState;
  const isFullProjectEditState: boolean = false;
  const [projectDataToUpdate, setProjectDataToUpdate] =
    useState<IProject | null>(project);
  const marketUnlockLookupId = String(project?.coingeckoId || "").trim();
  const dropstabProjectKey = String(
    marketUnlockLookupId ||
      project?.slug ||
      project?.sourceId ||
      project?._id ||
      ""
  ).trim();
  const dropstabProjectQuery = marketUnlockLookupId
    ? "?projectType=market&lookup=coingeckoId"
    : "?projectType=project&lookup=slug";
  const {
    data: dropstabUnlocksResponse,
    isLoading: isDropstabUnlocksLoading,
    isFetching: isDropstabUnlocksFetching,
  } = useQuery(
    [
      "project-dropstab-token-allocation",
      dropstabProjectKey,
      dropstabProjectQuery,
    ],
    () => fetchProjectUnlocks(dropstabProjectKey, dropstabProjectQuery),
    {
      enabled: Boolean(dropstabProjectKey) && !isFullProjectEditState,
      staleTime: 5 * 60 * 1000,
    }
  );
  const dropstabUnlocks = dropstabUnlocksResponse?.isSuccess
    ? dropstabUnlocksResponse.data
    : null;
  const dropstabTokenAllocation = buildDropstabTokenAllocation(
    dropstabUnlocks,
    project
  );
  const isDropstabTokenAllocationLoading =
    !isFullProjectEditState &&
    Boolean(dropstabProjectKey) &&
    (isDropstabUnlocksLoading || isDropstabUnlocksFetching) &&
    !dropstabUnlocksResponse;
  const hasDropstabTokenAllocation =
    !isFullProjectEditState && dropstabTokenAllocation.length > 0;
  const projectTokenAllocation = normalizeTokenAllocationItems(
    project?.totalAllocation || [],
    project
  );
  const tokenAllocationItems = hasDropstabTokenAllocation
    ? dropstabTokenAllocation
    : projectTokenAllocation;
  const tokenAllocationSymbol = resolveProjectTokenDisplaySymbol(
    project,
    dropstabUnlocks
  );

  const [isWatchListProject, setIsWatchListProject] = useState<boolean>(false);
  const [isNotificationProject, setIsNotificationProject] = useState<boolean>(
    userData?.notifications?.includes(project._id)
  );
  const [isUserEvent, setIsUserEvent] = useState<boolean>(
    userData?.privateEvents?.includes(project._id)
  );
  const [newComments, setNewComments] = useState<Array<IComment>>([]);
  const [isHideDesc, setIsHideDesc] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState(projectTabs[0]);
  const projectTabsAnchorRef = useRef<HTMLDivElement | null>(null);
  const isInitialTabRenderRef = useRef(true);
  const [isShareModal, setIsShareModal] = useState(false);
  const [isActionsPopoverOpen, setIsActionsPopoverOpen] = useState(false);
  const [isSocialsPopoverOpen, setIsSocialsPopoverOpen] = useState(false);

  const copySmartContract = (smart?: string) => {
    const contract = smart || projectSmartContract;
    if (!contract) return;

    navigator.clipboard.writeText(contract);
    toast.success(translateText("Smart contract was copied"));
  };

  // Detect mobile on mount and window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!projectTabs.includes(activeTab)) {
      setActiveTab(projectTabs[0]);
    }
  }, [activeTab, projectActive]);

  useEffect(() => {
    if (isInitialTabRenderRef.current) {
      isInitialTabRenderRef.current = false;
      return;
    }

    const scrollFrame = window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        projectTabsAnchorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
    });

    return () => window.cancelAnimationFrame(scrollFrame);
  }, [activeTab]);

  const participantsHandler = (key: string, items: Array<any>): void => {
    const currentKey = key === "key members" ? "team" : key;

    setProjectDataToUpdate((prev: any) => {
      return {
        ...prev,
        [currentKey]: items,
      };
    });
  };

  const confirmProjectUpdates = async (): Promise<void> => {
    if (!projectDataToUpdate) return;

    const mapToIds = (items: Array<any> = []): Array<string> => {
      return items
        .map((item: any) => {
          if (typeof item === "string") return item;
          return item?._id;
        })
        .filter(Boolean);
    };

    const comparison = mapToIds(
      projectDataToUpdate.comparison || project.comparison || []
    );

    const updatedProject: any = {
      investors: mapToIds(
        projectDataToUpdate.investors || project.investors || []
      ),
      partners: mapToIds(
        projectDataToUpdate.partners || project.partners || []
      ),
      team: mapToIds(projectDataToUpdate.team || project.team || []),
      advisors: mapToIds(
        projectDataToUpdate.advisors || project.advisors || []
      ),
      greenFlagsList:
        projectDataToUpdate.greenFlagsList || project.greenFlagsList || [],
      yellowFlagsList:
        projectDataToUpdate.yellowFlagsList || project.yellowFlagsList || [],
      redFlagsList:
        projectDataToUpdate.redFlagsList || project.redFlagsList || [],
      achievements:
        projectDataToUpdate.achievements || project.achievements || [],
      collaborators:
        projectDataToUpdate.collaborators || project.collaborators || [],
    };

    if (comparison.length) {
      updatedProject.comparison = comparison;
    }

    const { success } = await updateProject(
      `projects/user/${project._id}`,
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
          <p>
            {translateText(
              "Your limit on updating projects for today has been reached"
            )}
          </p>
        </div>
      );
    }

    setIsEditState(false);
  };

  const confirmNotificationAction = async (): Promise<void> => {
    const action: "POST" | "DELETE" = isNotificationProject ? "DELETE" : "POST";

    const { isSuccess } = await notificationService(
      `notifications/${project._id}`,
      action
    );

    if (!isNotificationProject && isSuccess) {
      toast.success(
        <div>
          <h3>{translateText("Success!")}</h3>
          <p>{translateText("Project added to notifications")}</p>
        </div>
      );
    } else {
      toast.success(
        <div>
          <h3>{translateText("Success!")}</h3>
          <p>{translateText("Project deleted from notifications")}</p>
        </div>
      );
    }

    setIsNotificationProject(action === "POST");
  };

  const confirmAction = async (type: "like" | "dislike"): Promise<void> => {
    const projectReactionId = String(
      project?.canonicalProjectId || projectAny?.id || project?._id || ""
    );
    const isFomoV2ProjectReaction = Boolean(
      project?.source === "fomo-v2" && project?.canonicalProjectId
    );
    const { isSuccess } = isFomoV2ProjectReaction
      ? await addFomoV2Reaction("canonicalProject", type, projectReactionId)
      : await addReaction("projects", type, project._id || "");

    if (!isSuccess) {
      toast.error(
        <div>
          <h3>{translateText("Error!")}</h3>
          <p>{translateText("Reaction was not saved")}</p>
        </div>
      );
      return;
    }

    await project.refetch();
  };

  const inputsHandler = (name: string, value: any): void => {
    setProjectDataToUpdate((prev: any) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const updateProjectFlagData = (values: any): void => {
    Object.entries(values || {}).forEach(([key, value]) => {
      inputsHandler(key, value);
    });
    setGreenFlagsModal(false);
    setYellowFlagsModal(false);
    setRedFlagsModal(false);
  };

  const handleActiveTab = () => {
    switch (activeTab) {
      case "Overview":
      case "About":
        return (
          <ProjectHub
            inputsHandler={inputsHandler}
            isEditState={isLimitedEditState}
            project={project}
            projectDataToUpdate={projectDataToUpdate}
            openKeyMembersModal={() => {
              setParticipantActiveTab(participantsItems[0]);
              setTeamModal(true);
            }}
            openAdvisorsModal={() => {
              setParticipantActiveTab(participantsItems[1]);
              setTeamModal(true);
            }}
            dropstabDescription={dropstabUnlocks?.description || null}
          />
        );
      case "Fundraising":
        return (
          <div>
            <FundingRounds
              inputsHandler={inputsHandler}
              isEditState={isFullProjectEditState}
              project={project}
              projectDataToUpdate={projectDataToUpdate}
              hideAthRoi={isEchoProjectRoute}
              dataReviewBanner={
                <DataQualityNotice
                  status="warning"
                  className="fundraising-data-review-banner"
                  project={project}
                />
              }
            />
          </div>
        );
      case "Tokenomics":
        return (
          <IcoFundraising
            project={project}
            projectDataToUpdate={projectDataToUpdate}
            inputsHandler={inputsHandler}
            isEdit={isFullProjectEditState}
            dataReviewBanner={
              <DataQualityNotice
                status={isVestingReviewed ? "verified" : "warning"}
                className="unlocks-data-review-banner"
                project={project}
              />
            }
          />
        );
      case "Comparison":
        return <IcoComparison project={project} />;
      default:
        return null;
    }
  };

  const closeAllModals = (): void => {
    setRedFlagsModal(false);
    setYellowFlagsModal(false);
    setGreenFlagsModal(false);
    setTeamModal(false);
    setAddTeamModal(false);
    setInvestorsModal(false);
  };

  const confirmAddComment = async (text: string): Promise<void> => {
    if (!userData.isFullAuth) {
      toast.error(
        <div>
          <h3>{translateText("Error!")}</h3>
          <p>
            {translateText("You need to be fully logged in to add comments")}
          </p>
        </div>
      );
      return;
    }

    const newComment: IComment = {
      text,
      author: [userData],
      date: new Date(),
      likes: [],
      dislikes: [],
    };

    const { isSuccess } = await addComment(
      `projects/comment/${project._id}`,
      newComment
    );

    if (isSuccess) {
      project.refetch();
    }
  };

  const updateWatchList = async (): Promise<void> => {
    if (!userData.isFullAuth) {
      toast.error(
        <div>
          <h3>{translateText("Error!")}</h3>
          <p>
            {translateText(
              "You need to be fully logged in to add project to watchlist"
            )}
          </p>
        </div>
      );
      return;
    }

    if (isWatchListProject) {
      const { success } = await deleteFromWatchlist(path, String(project._id));

      if (success) {
        toast.success(
          <div>
            <h3>{translateText("Success!")}</h3>
            <p>{translateText("Project deleted from favorites")}</p>
          </div>
        );
      }

      setIsWatchListProject(false);

      return;
    }

    const { success } = await addProjectToWatchlist(path, String(project._id));

    setIsWatchListProject(true);

    if (success) {
      toast.success(
        <div>
          <h3>{translateText("Success!")}</h3>
          <p>{translateText("Project added to favorites")}</p>
        </div>
      );
    }
  };

  const addTokenAllocationItem = (): void => {
    if (!projectDataToUpdate) return;

    const updatedItems: Array<ITokenAllocationItem> =
      projectDataToUpdate.totalAllocation
        ? [
            ...projectDataToUpdate.totalAllocation,
            { name: "", value: 0, allocated: 0 },
          ]
        : [{ name: "", value: 0, allocated: 0 }];

    inputsHandler("totalAllocation", updatedItems);
  };

  const removeTokenAllocationItem = (id: number): void => {
    if (!projectDataToUpdate?.totalAllocation?.length) return;

    const updatedItems: Array<ITokenAllocationItem> =
      projectDataToUpdate.totalAllocation.filter(
        (item: ITokenAllocationItem, i: number) => {
          return i !== id;
        }
      );

    inputsHandler("totalAllocation", updatedItems);
  };

  const tokenaAllocationInputHandler = (
    id: number,
    key: string,
    value: any
  ): void => {
    if (!projectDataToUpdate?.totalAllocation?.length) return;

    const updatedItems: Array<ITokenAllocationItem> =
      projectDataToUpdate.totalAllocation.map(
        (item: ITokenAllocationItem, i: number) => {
          if (i === id) {
            return { ...item, [key]: value };
          }

          return item;
        }
      );

    inputsHandler("totalAllocation", updatedItems);
  };

  useEffect(() => {
    if (watchlist?.projects)
      setIsWatchListProject(
        watchlist?.projects?.find((item: any) => item?._id === project._id)
      );
  }, [watchlist]);

  // Close the compact header menus when focus moves away from the header.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-popover-trigger]")) {
        setIsActionsPopoverOpen(false);
        setIsSocialsPopoverOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setIsActionsPopoverOpen(false);
      setIsSocialsPopoverOpen(false);
    };

    if (isActionsPopoverOpen || isSocialsPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isActionsPopoverOpen, isSocialsPopoverOpen]);

  // Close popover on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsActionsPopoverOpen(false);
      setIsSocialsPopoverOpen(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderLeftHeader: React.FC = ({
    forMobile,
  }: {
    forMobile?: boolean;
  }) => {
    const handleActionsClick = () => {
      setIsActionsPopoverOpen((isOpen) => !isOpen);
      setIsSocialsPopoverOpen(false);
    };

    const closeActionsPopover = () => {
      setIsActionsPopoverOpen(false);
    };

    const handleSocialsClick = () => {
      setIsSocialsPopoverOpen((isOpen) => !isOpen);
      setIsActionsPopoverOpen(false);
    };

    const closeSocialsPopover = () => {
      setIsSocialsPopoverOpen(false);
    };

    return (
      <LeftHeaderRightWrapper
        className={forMobile ? "left-header-bottom" : "left-header-right"}
      >
        {isMobile && forMobile ? (
          // Mobile: Show trigger buttons with popovers
          <>
            <div>
              <ActionsPopoverTrigger
                data-popover-trigger
                onClick={handleActionsClick}
                className="echo-popover-trigger"
                type="button"
                aria-label={translateText("Open project actions")}
                aria-expanded={isActionsPopoverOpen}
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
                  <ActionsPopover
                    data-popover-trigger
                    className="echo-actions-popover"
                    role="group"
                    aria-label={translateText("Project actions")}
                  >
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
                          openProjectFlagModal("green");
                        }}
                      >
                        <FlagIcon stroke="#04A584" />
                        <span>{translateText("Green Flag")}</span>
                      </button>
                      <button
                        onClick={() => {
                          closeActionsPopover();
                          openProjectFlagModal("yellow");
                        }}
                      >
                        <FlagIcon stroke="#FFC702" />
                        <span>{translateText("Yellow Flag")}</span>
                      </button>
                      <button
                        onClick={() => {
                          closeActionsPopover();
                          openProjectFlagModal("red");
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
                className="socials-trigger echo-popover-trigger"
                type="button"
                aria-label={translateText("Open social links")}
                aria-expanded={isSocialsPopoverOpen}
              >
                <Link width={20} height={20} color="#738094" />
              </ActionsPopoverTrigger>
              {isSocialsPopoverOpen && (
                <>
                  <PopoverOverlay onClick={closeSocialsPopover} />
                  <ActionsPopover
                    data-popover-trigger
                    className="echo-actions-popover"
                    role="group"
                    aria-label={translateText("Social links")}
                  >
                    <PopoverActionsContainer>
                      <SocialLinks
                        className="projects"
                        links={
                          project?.socialmedia?.map(
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
          </>
        ) : (
          // Desktop: Show full actions
          <>
            <ProjectActions>
              <FavButton
                onClick={updateWatchList}
                isFavorite={isWatchListProject}
              />
              <button onClick={confirmNotificationAction}>
                <NotificationIcon isActive={isNotificationProject} />
              </button>
              <EntityLikes
                likes={project.likes || []}
                dislikes={project.dislikes || []}
                likesCount={project.likesCount}
                dislikesCount={project.dislikesCount}
                userReaction={project.userReaction}
                onLikeClick={() => confirmAction("like")}
                onDislikeClick={() => confirmAction("dislike")}
              />
              <button
                onClick={() => openProjectFlagModal("green")}
                className={
                  Number(project.greenFlagsList?.length) > 0 ? "fill-green" : ""
                }
              >
                {project?.greenFlagsList?.length ? (
                  <div className="flag-icon">
                    {project.greenFlagsList.length}
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
                onClick={() => openProjectFlagModal("yellow")}
                className={
                  Number(project.yellowFlagsList?.length) > 0
                    ? "fill-yellow"
                    : ""
                }
              >
                {project?.yellowFlagsList?.length ? (
                  <div className="flag-icon">
                    {project.yellowFlagsList.length}
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
                onClick={() => openProjectFlagModal("red")}
                className={
                  Number(project.redFlagsList?.length) > 0 ? "fill-red" : ""
                }
              >
                {project?.redFlagsList?.length ? (
                  <div className="flag-icon">{project.redFlagsList.length}</div>
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
                  project?.socialmedia?.map((item: ISocialMediaItem) => {
                    return {
                      key: getServiceByUrl(item.href),
                      href: item.href,
                    };
                  }) || []
                }
              />
            </SocialsWrapper>
          </>
        )}
      </LeftHeaderRightWrapper>
    );
  };

  return (
    <>
      <PageWrapper>
        <ProjectPageContentScope isEcho={isEchoProjectRoute}>
          {(!isEchoProjectRoute ||
            (userData?.isFullAuth && !isTopEditPageActionHidden)) && (
            <PageHeader
              className={
                isEchoProjectRoute
                  ? "echo-page-header entity-actions-header"
                  : undefined
              }
            >
              {!isEchoProjectRoute && !isMobile && (
                <BreadCrumbs
                  items={[
                    { title: "Crypto", link: "/" },
                    { title: "Projects", link: "/crypto/projects" },
                    {
                      title: project.name,
                      link: `/crypto/project/${project._id}`,
                    },
                  ]}
                />
              )}
              {userData?.isFullAuth && !isTopEditPageActionHidden && (
                <UpdateEntityActions
                  updateEditState={(value: boolean) => setIsEditState(value)}
                  isActiveEdit={isEditState}
                  onSave={confirmProjectUpdates}
                  onCancel={() => setIsEditState(false)}
                  onReset={() => setProjectDataToUpdate(project)}
                />
              )}
            </PageHeader>
          )}
        <HeaderWrapper className="echo-hero">
          <LeftHeaderWrapper className="echo-identity-panel">
            <LeftHeaderPersonInfoWrapper className="echo-identity-row">
              <LeftHeaderPersonalWrapper>
                <UserAvatar
                  isSponsored={project.isSponsored}
                  rating={projectRating}
                  avatar={
                    project.logo || project.metadataLogo
                      ? project.logo
                        ? imageLoader(String(project.logo))
                        : String(project.metadataLogo)
                      : ""
                  }
                  variant={projectRatingVariant}
                  size={"project-page"}
                  name={project.name}
                  className={
                    isEchoProjectRoute ? "echo-project-avatar" : undefined
                  }
                  fallbackType="project"
                />
                <div
                  className={`project-info ${isFullProjectEditState ? "edit-state" : ""}`}
                >
                  {isFullProjectEditState ? (
                    <EditStateWrapper className="edit-state">
                      <input
                        style={{ width: "240px", height: "48px" }}
                        placeholder={translateText("Enter the project’s name")}
                        onChange={(e: any) =>
                          inputsHandler("name", e.target.value)
                        }
                        value={projectDataToUpdate?.name || ""}
                      />
                    </EditStateWrapper>
                  ) : (
                    <HeaderPersonTitle
                      className="echo-project-title"
                      variant="p"
                    >
                      {project.name}
                    </HeaderPersonTitle>
                  )}
                  <HeaderPersonDescription>
                    <div
                      className="echo-project-subtitle"
                      style={{ display: "flex", gap: 10 }}
                    >
                      {isFullProjectEditState ? (
                        <EditStateWrapper>
                          <input
                            style={{ width: "190px", height: "30px" }}
                            placeholder={translateText(
                              "Enter the project’s category"
                            )}
                            onChange={(e: any) =>
                              inputsHandler("niche", e.target.value)
                            }
                            value={projectDataToUpdate?.niche || ""}
                          />
                        </EditStateWrapper>
                      ) : (
                        <Typography variant="p">{project.niche}</Typography>
                      )}
                      {(!isMobile || isEchoProjectRoute) && (
                        <>
                          <StatusTag variant={project?.status?.toLowerCase()} />
                          {project.isSponsored && (
                            <SponsoredWrapper>
                              <SponsoredIcon />
                              <span>{translateText("Sponsored")}</span>
                            </SponsoredWrapper>
                          )}
                        </>
                      )}
                    </div>
                  </HeaderPersonDescription>
                  {renderLeftHeader({ forMobile: true })}
                </div>
              </LeftHeaderPersonalWrapper>
              {renderLeftHeader({ forMobile: false })}
            </LeftHeaderPersonInfoWrapper>
            <PersonPriceWrapper className="echo-funding-highlight">
              <PriceInfoWrapper className="echo-funding-card">
                <EditWrapper>
                  <PersonCurrencyWrapper>
                    <PersonMainPrice
                      className="echo-funding-title"
                      variant="p"
                    >
                      {getFundingRoundIcon(latestFundingRound)}
                      {translateText(latestFundingRoundTitle)}
                    </PersonMainPrice>
                    <span>-</span>
                    <PriceInfo className="echo-funding-value">
                      {latestFundingRoundPrice}
                    </PriceInfo>
                  </PersonCurrencyWrapper>
                </EditWrapper>
                <ProgressWrapper>
                  <ProgressBar
                    className="echo-funding-progress"
                    middleKey="Completed"
                    middle={latestFundingRoundProgress}
                    leftKey={"Collected"}
                    rightKey={"Goal"}
                    low={latestFundingRoundRaised}
                    high={latestFundingRoundGoal}
                    progress={latestFundingRoundProgress}
                    keyColor="#ffffff"
                    showZeroValuesAsPlaceholder
                  />
                </ProgressWrapper>
              </PriceInfoWrapper>
            </PersonPriceWrapper>
          </LeftHeaderWrapper>
          <RightHeaderWrapper className="ico echo-meta-panel">
            <RightHeaderHead
              className={`echo-metric-grid ${
                isFullProjectEditState ? "edit-state" : ""
              }`}
            >
              <HeaderDataText variant="div">
                {isFullProjectEditState ? (
                  <EditStateWrapper>
                    <input
                      type={"number"}
                      style={{ width: "125px", height: "33px" }}
                      placeholder={translateText("Amount")}
                      onChange={(e: any) =>
                        inputsHandler("totalRaised", e.target.value)
                      }
                      value={projectDataToUpdate?.totalRaised || ""}
                    />
                  </EditStateWrapper>
                ) : (
                  `$${clarifyAmount(Number(project.totalRaised || 0))}`
                )}
                <span>{translateText("Total Raised")}</span>
              </HeaderDataText>

              <HeaderDataText variant="div">
                {isFullProjectEditState ? (
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
                        projectDataToUpdate?.lastFunding || new Date()
                      )}
                    />
                  </EditStateWrapper>
                ) : (
                  `${
                    project.lastFunding
                      ? moment(project.lastFunding).format("ll")
                      : "-"
                  }`
                )}
                <span>{translateText("Last Funding")}</span>
              </HeaderDataText>

              <HeaderDataText variant="div">
                {isFullProjectEditState ? (
                  <EditStateWrapper>
                    <input
                      style={{ width: "125px", height: "33px" }}
                      placeholder={translateText("Round")}
                      onChange={(e: any) =>
                        inputsHandler("round", e.target.value)
                      }
                      value={projectDataToUpdate?.round || ""}
                    />
                  </EditStateWrapper>
                ) : (
                  project?.round || "-"
                )}
                <span>{translateText("Completed Round")}</span>
              </HeaderDataText>
            </RightHeaderHead>
            <div>
              <ProjectHeaderMetadata
                className="echo-project-meta-fields"
                categories={projectCategories}
                contracts={projectSmartContracts}
                onCopyContract={copySmartContract}
                categoryEditor={
                  isFullProjectEditState ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "33px" }}
                        placeholder={translateText("Enter category")}
                        onChange={(e: any) =>
                          inputsHandler("categories", [e.target.value])
                        }
                        value={projectDataToUpdate?.categories?.[0] || ""}
                      />
                    </EditStateWrapper>
                  ) : undefined
                }
              />
            </div>
          </RightHeaderWrapper>
        </HeaderWrapper>
        {routeProjectActive ? (
          <></>
        ) : (
          <ProjectDescriptionDataWrapper className="echo-market-statistics">
            <ProjectDescriptionItem variant="p">
              <span>{translateText("Market Cap")}</span>$
              {clarifyAmount(project.marketCap || 0)}
            </ProjectDescriptionItem>
            <ProjectDescriptionItem percentage={58.17} variant="p">
              <span>{translateText("Volume 24H")}</span>$
              {clarifyAmount(project.volume24h || 0)}
              <br />
              <i>
                {project.volume24hChange
                  ? project.volume24hChange.toFixed(2)
                  : "0"}
                %
              </i>
            </ProjectDescriptionItem>
            <ProjectDescriptionItem
              percentage={circulatingSupplyPercent}
              variant="p"
            >
              <span>{translateText("Circulating Supply")}</span>
              {project.circulatingSupply
                ? clarifyAmount(project.circulatingSupply)
                : 0}
              {/* M GFI */}
              <br />
              <i>{circulatingSupplyPercent.toFixed(2)}%</i>
            </ProjectDescriptionItem>
            <ProjectDescriptionItem variant="p">
              <span>{translateText("Total Supply")}</span>
              {clarifyAmount(project.totalSupply || 0)}
            </ProjectDescriptionItem>
            <ProjectDescriptionItem variant="p">
              <span>{translateText("Fully Dil. Val")}</span>
              {clarifyAmount(project.fullyDilutedMarketCap || 0)}
            </ProjectDescriptionItem>
            <ProjectDescriptionItem variant="p">
              <span>{translateText("Dominance")}</span>
              {formatPercentOrPlaceholder(project.dominance)}
            </ProjectDescriptionItem>
            <ProjectDescriptionItem variant="p">
              <span>{translateText("Volume/Market cap")}</span>
              {project?.volumeAndMarketCap
                ? project.volumeAndMarketCap.toFixed(3)
                : "0.00"}
            </ProjectDescriptionItem>
          </ProjectDescriptionDataWrapper>
        )}
        <TabsScrollAnchor ref={projectTabsAnchorRef} />
        <TabsWrapper
          className={
            isEchoProjectRoute
              ? "market-project-tabs"
              : undefined
          }
        >
          <Tabs
            className="project-page"
            onClick={(value) => setActiveTab(value)}
            activeItem={activeTab}
            items={projectTabs}
          />
        </TabsWrapper>
        <TabsContentWrapper className="echo-profile-content">
          <LeftColumn className="echo-left-column">
            {handleActiveTab()}
          </LeftColumn>
          <RightColumn className="echo-right-column">
            {activeTab === "Tokenomics" ? (
              <>
                <h2>{translateText("Token Distribution (Allocation)")}</h2>
                <PieContentWrapper variant={"main"}>
                  <PieWrapper>
                    {isDropstabTokenAllocationLoading ? (
                      <TokenAllocationPieSkeleton width={280} height={280} />
                    ) : isFullProjectEditState ? (
                      <PieGraphic
                        innerRadius={80}
                        outerRadius={140}
                        width={280}
                        height={280}
                        items={projectDataToUpdate?.totalAllocation || []}
                      />
                    ) : (
                      <PieAllocationsGraphic
                        innerRadius={80}
                        outerRadius={140}
                        width={280}
                        height={280}
                        items={tokenAllocationItems}
                        symbol={tokenAllocationSymbol}
                      />
                    )}
                  </PieWrapper>
                  <PieValuesWrapper>
                    {isFullProjectEditState ? (
                      <PieValuesPercentageWrapper>
                        {projectDataToUpdate?.totalAllocation?.length ? (
                          projectDataToUpdate?.totalAllocation.map(
                            (item: any, index: number) => {
                              return (
                                <PieValuesPercentage
                                  className="edit-item"
                                  key={index}
                                  color={COLORS[index]}
                                  variant="p"
                                >
                                  <i />
                                  <input
                                    onChange={(e: any) =>
                                      tokenaAllocationInputHandler(
                                        index,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    placeholder={translateText("Seed Round")}
                                    value={item.name}
                                  />
                                  <div className="input-wrapper">
                                    <span>{project.niche}</span>
                                    <input
                                      type="number"
                                      style={{ width: "65px" }}
                                      onChange={(e: any) =>
                                        tokenaAllocationInputHandler(
                                          index,
                                          "allocated",
                                          Number(e.target.value)
                                        )
                                      }
                                      placeholder="100M"
                                      value={String(item.allocated)}
                                    />
                                  </div>
                                  <div className="input-wrapper">
                                    <input
                                      style={{ width: "45px" }}
                                      onChange={(e: any) =>
                                        tokenaAllocationInputHandler(
                                          index,
                                          "value",
                                          Number(e.target.value)
                                        )
                                      }
                                      placeholder="10$"
                                      value={item.value}
                                      type="number"
                                    />
                                    <span>%</span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      removeTokenAllocationItem(index)
                                    }
                                    className="remove-btn"
                                  >
                                    <CloseIcon fill="var(--main-gray)" />
                                  </button>
                                </PieValuesPercentage>
                              );
                            }
                          )
                        ) : (
                          <></>
                        )}
                        {isFullProjectEditState ? (
                          <CreateButton
                            type={"add"}
                            onClick={addTokenAllocationItem}
                          >
                            {translateText("Add Type")}
                          </CreateButton>
                        ) : (
                          <></>
                        )}
                      </PieValuesPercentageWrapper>
                    ) : (
                      <PieValuesPercentageWrapper>
                        {isDropstabTokenAllocationLoading ? (
                          <TokenAllocationListSkeleton />
                        ) : tokenAllocationItems?.length ? (
                          tokenAllocationItems.map(
                            (item: any, index: number) => {
                              const amount =
                                item.tokensAllocatedAmount ?? item.allocated;
                              const percent =
                                item.tokensAllocatedPercent ?? item.value;

                              return (
                                <PieValuesPercentage
                                  key={index}
                                  color={COLORS[index % COLORS.length]}
                                  variant="p"
                                >
                                  <i />
                                  <div>{item.name}</div>
                                  <div className="right-column">
                                    <span>
                                      {tokenAllocationSymbol}{" "}
                                      {clarifyAmount(amount)}
                                    </span>
                                    <span>
                                      {formatAllocationPercent(percent)}%
                                    </span>
                                  </div>
                                </PieValuesPercentage>
                              );
                            }
                          )
                        ) : (
                          <></>
                        )}
                      </PieValuesPercentageWrapper>
                    )}
                  </PieValuesWrapper>
                </PieContentWrapper>
              </>
            ) : (
              <></>
            )}
            <StatisticsCardsWrapper className="echo-sidebar-stack">
              <RightColumnTitle className="echo-sidebar-section-header">
                <h2 style={{ marginTop: "0px" }}>
                  {translateText("Top Investors")}
                </h2>
                <button onClick={() => setTopInvestorsModal(true)}>
                  <Image src={RightIcon} alt="investors" />
                </button>
              </RightColumnTitle>
              <InvestorsTab
                investors={projectTopInvestors}
                isLoading={isProjectTopInvestorsLoading}
              />
              <RightColumnTitle className="echo-sidebar-section-header">
                <h2>{translateText("Top X Followers")}</h2>
                <button
                  onClick={() => {
                    setTopModal(true);
                    setInitialTab("Top Followers");
                  }}
                >
                  <Image src={RightIcon} alt="investors" />
                </button>
              </RightColumnTitle>
              <TopFollowersTab followers={projectTopFollowers} />

              <h2>{translateText("X Performance")}</h2>
              {xPerformanceScore !== null ? (
                <ScoreBar
                  score={xPerformanceScore}
                  maxScore={1000}
                  change={0}
                />
              ) : (
                <EmptySection />
              )}

              {project.greenFlagsList?.length ||
              project.yellowFlagsList?.length ||
              project.redFlagsList?.length ||
              isLimitedEditState ? (
                <>
                  <h2>
                    {project.niche} {translateText("Green, Yellow & Red Flags")}
                  </h2>
                  <FlagsListsWrapper>
                    <FlagsListComponent
                      isEditState={isLimitedEditState}
                      onChange={(items: Array<IFlag>) =>
                        inputsHandler("greenFlagsList", items)
                      }
                      flags={
                        isLimitedEditState
                          ? projectDataToUpdate?.greenFlagsList || []
                          : project.greenFlagsList || []
                      }
                      type={"green"}
                    />

                    <FlagsListComponent
                      isEditState={isLimitedEditState}
                      onChange={(items: Array<IFlag>) =>
                        inputsHandler("yellowFlagsList", items)
                      }
                      flags={
                        isLimitedEditState
                          ? projectDataToUpdate?.yellowFlagsList || []
                          : project.yellowFlagsList || []
                      }
                      type={"yellow"}
                    />

                    <FlagsListComponent
                      isEditState={isLimitedEditState}
                      onChange={(items: Array<IFlag>) =>
                        inputsHandler("redFlagsList", items)
                      }
                      flags={
                        isLimitedEditState
                          ? projectDataToUpdate?.redFlagsList || []
                          : project.redFlagsList || []
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
        <BottomActions>
          {userData?.isFullAuth && isEditState ? (
            <UpdateEntityActions
              updateEditState={(value: boolean) => setIsEditState(value)}
              isActiveEdit={isEditState}
              onSave={confirmProjectUpdates}
              onCancel={() => setIsEditState(false)}
              onReset={() => setProjectDataToUpdate(project)}
            />
          ) : (
            <></>
          )}
        </BottomActions>
        <TrendingAssets project={project} />
        <CommentBlock
          refetch={project.refetch}
          addComment={confirmAddComment}
          items={project.comments}
        />
        </ProjectPageContentScope>

        {isShareModal && (
          <ShareModal
            onClose={() => setIsShareModal(false)}
            link="/crypto/project/share/123"
          />
        )}
        {greenFlagsModal ? (
          <GreenFlagsModal
            updateProjectData={updateProjectFlagData}
            project={
              isEditState && projectDataToUpdate ? projectDataToUpdate : project
            }
            v2EntityType={isV2IcoFlagEntity ? "ico_project" : undefined}
            v2EntityId={isV2IcoFlagEntity ? projectFlagEntityId : undefined}
            onSubmitted={() => project.refetch?.()}
            onAuthRequired={openProjectAuthModal}
            onClose={() => setGreenFlagsModal(false)}
          />
        ) : (
          <></>
        )}
        {yellowFlagsModal ? (
          <YellowFlagsModal
            updateProjectData={updateProjectFlagData}
            project={
              isEditState && projectDataToUpdate ? projectDataToUpdate : project
            }
            v2EntityType={isV2IcoFlagEntity ? "ico_project" : undefined}
            v2EntityId={isV2IcoFlagEntity ? projectFlagEntityId : undefined}
            onSubmitted={() => project.refetch?.()}
            onAuthRequired={openProjectAuthModal}
            onClose={() => setYellowFlagsModal(false)}
          />
        ) : (
          <></>
        )}
        {redFlagsModal ? (
          <RedFlagsModal
            updateProjectData={updateProjectFlagData}
            project={
              isEditState && projectDataToUpdate ? projectDataToUpdate : project
            }
            v2EntityType={isV2IcoFlagEntity ? "ico_project" : undefined}
            v2EntityId={isV2IcoFlagEntity ? projectFlagEntityId : undefined}
            onSubmitted={() => project.refetch?.()}
            onAuthRequired={openProjectAuthModal}
            onClose={() => setRedFlagsModal(false)}
          />
        ) : (
          <></>
        )}
        {investorsModal && (
          <InvestorsModal
            investors={projectDataToUpdate?.investors || []}
            data={project}
            inputsHandler={participantsHandler}
            hideModal={() => {
              setInvestorsModal(false);
              setAddInvestorsModal(true);
            }}
            onClose={() => setInvestorsModal(false)}
            confirmUpdates={closeAllModals}
          />
        )}
        {addInvestorsModal && project ? (
          <AddInvestorsModal
            addInvestors={participantsHandler}
            onClose={() => {
              (setAddInvestorsModal(false), setInvestorsModal(true));
            }}
            data={project}
          />
        ) : (
          <></>
        )}
        <TopInvestorsModal
          isVisible={topInvestorsModal}
          onClose={() => setTopInvestorsModal(false)}
          investors={projectTopInvestorsModal}
        />
        <TopModal
          isVisible={topModal}
          onClose={() => setTopModal(false)}
          initialTab={initialTab}
          followers={projectTopFollowers}
        />
        {teamModal ? (
          <TeamListModal
            items={
              // @ts-ignore
              projectDataToUpdate[participantActiveTab.toLowerCase()] || []
            }
            participantsHandler={participantsHandler}
            label={participantActiveTab}
            data={project}
            hideModal={() => {
              setTeamModal(false);
              setAddTeamModal(true);
            }}
            onConfirm={closeAllModals}
            onClose={() => setTeamModal(false)}
          />
        ) : (
          <></>
        )}
        {addTeamModal ? (
          <AddTeamListModal
            participantsHandler={participantsHandler}
            label={participantActiveTab.toLowerCase()}
            onClose={() => {
              setTeamModal(true);
              setAddTeamModal(false);
            }}
          />
        ) : (
          <></>
        )}

        {isEventModal ? (
          <CreateEventModal
            initialProject={project}
            date={new Date()}
            onClose={() => setIsEventModal(false)}
            onSuccessCreate={() => {
              setIsEventModal(false);
              setIsUserEvent(true);
            }}
          />
        ) : (
          <></>
        )}

        {/* {exchangeSettings && <ExchangeSettings onClose={() => setExchangeSettings(false)} />} */}
      </PageWrapper>
    </>
  );
};

export default IcoProject;
