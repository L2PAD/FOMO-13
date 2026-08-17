/* eslint-disable */
import React, { useState, useContext, useEffect, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import {
  IProjectWithRefetch,
  ProjectDataContext,
} from "../../../../../contexts/projectDataContext";
import {
  AuthContext,
} from "../../../../global/Layout";
import BreadCrumbs from "../../../../global/BreadCrumbs";
import UserAvatar from "../../../../global/common/UserAvatar";
import Typography from "../../../../global/common/Typography";
import ProgressBar from "../../../../global/common/ProgressBar";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import Tabs from "../../../../global/Tabs";
import ShareModal from "../../../../global/modals/ShareModal";
import CommentBlock from "../../../../global/CommentBlock";
import CustomSelect from "../../../../global/common/CustomSelect";
import NewsTab from "./NewsTab";
import Exchanges from "./Exchanges";
import Fundraising from "./Fundraising";
import { useRouter } from "next/router";
import {
  IComment,
  IFlag,
  IGlobalAsset,
  IProject,
  ISocialMediaItem,
} from "../../../../../types/global_types";
import imageLoader from "../../../../../helpers/imageLoader";
import addComment from "../../../../../http/comments/addComment";
import AddInvestorsModal from "../Modals/add_investors_modal";
import InvestorsModal from "../Modals/investors_modal";
import TeamListModal from "../Modals/team_list_modal";
import AddTeamListModal from "../Modals/add_tem_list_modal";
import GreenFlagsModal from "../Modals/green_flags_modal";
import YellowFlagsModal from "../Modals/yellow_flags_modal";
import RedFlagsModal from "../Modals/red_flags_modal";
import useProjectPath from "../../../../../hooks/useProjectPath";
import notificationService from "../../../../../http/notifications/notificationService";
import CreateEventModal from "../../../../global/modals/create_event_modal";
import RightIcon from "../../../../../assets/icons/left-arrow.svg";
import { COLORS } from "./Fundraising";
import AddProjectsModal from "../../modals/AddProjectsModal";
import { PageWrapper } from "../../CryptoMarket/styles";
import SocialLinks from "../../../../global/common/SocialLinks";
import ProjectHeaderMetadata from "../../../../global/common/ProjectHeaderMetadata";
import FavButton from "../../../../global/common/FavButton";
import ProjectPriceStatistics from "./ProjectPriceStatistics";
import dislikeDefault from "../../../../../assets/icons/otc/dislike-default.svg";
import {
  StatisticsCardHeader,
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
import ScoreBar from "../../../../global/common/ScoreBar";
import AboutProject from "./About";
import TrendingAssets from "./Assets";
import {
  PieContentWrapper,
  PieValuesPercentage,
  PieValuesPercentageWrapper,
  PieValuesWrapper,
  PieWrapper,
} from "./Fundraising/styles";
import Comparison from "./Comparison";
import {
  CalendarIcon,
  FlagIcon,
} from "../../../../global/Icons";
import {
  HeaderDescription,
  HeaderDescriptionSeeMoreLink,
  HeaderPersonDescription,
  HeaderPersonTitle,
  HeaderWrapper,
  LeftHeaderPersonInfoWrapper,
  LeftHeaderWrapper,
  PersonCurrencyWrapper,
  EditWrapper,
  PersonMainPrice,
  PersonPriceWrapper,
  ProgressWrapper,
  RightHeaderWrapper,
  TabsContentWrapper,
  TabsWrapper,
  FlagsList,
  FlagsListItem,
  FlagsListsWrapper,
  LeftHeaderPersonalWrapper,
  SocialsWrapper,
  EditStateWrapper,
  LeftHeaderRightWrapper,
  ProjectActions,
  PriceInfoWrapper,
  RightColumn,
  LeftColumn,
  RightColumnTitle,
  StatisticsCardsWrapper,
  ActionsPopoverTrigger,
  PopoverOverlay,
  ActionsPopover,
  PopoverActionsContainer,
  SeeMoreButton,
  TabsScrollAnchor,
  FundraisingWrapper,
  UnlocksFullWidthSection,
  UnlocksNarrowSection,
  ProjectRankBadge,
  ProjectSymbolLine,
  XPerformanceNotice,
  MobileRoiSection,
} from "./crypto-styles";
import Unlocks from "./Unlocks";
import TeamTab from "./Team";
import TopModal, { TopModalVariants } from "../Modals/top_modal";
import CreateOwnAsset from "../../modals/CreateOwnAsset";
import { getServiceByUrl } from "../../../../../helpers/getServiceKeyByUrl";
import { openAuthModal } from "../../../../../helpers/openAuthModal";
import { useQuery } from "react-query";
import fetchProjectUnlocks from "../../../../../http/projects/fetchProjectUnlocks";
import fetchMarketProjectChart from "../../../../../http/projects/fetchMarketProjectChart";
import PieAllocationsGraphic, {
  TokenAllocationListSkeleton,
  TokenAllocationPieSkeleton,
} from "./Fundraising/tokenAllocations";
import MarketInvestorsTab from "../../../../global/MarketCapInvestorsTab";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import {
  ExternalLink,
  Facebook,
  Github,
  Globe,
  Instagram,
  Link,
  Linkedin,
  MessageCircle,
  Send,
  Twitter,
  Youtube,
} from "lucide-react";
import DataQualityNotice from "./DataQualityNotice";
import { SearchWrapper } from "./About/styles";
import sliceAddress from "../../../../../helpers/sliceAddress";
import clipboardCopy from "clipboard-copy";
import { useTranslation } from "i18n";
import {
  buildDropstabTokenAllocation,
  formatAllocationPercent,
  normalizeTokenAllocationItems,
} from "../../../../../helpers/dropstabTokenAllocation";
import { resolveProjectTokenDisplaySymbol } from "../../../../../helpers/projectTokenSymbol";

const SHOW_PROJECT_BREADCRUMBS = false;

export const participantsItems = ["Team", "Advisors", "Partners"];

const tabs = ["Exchanges", "Fundraising", "Comparison", "Unlocks", "Team"];
const projectsWithoutTeamTab = new Set(["686d5ca30a980894b786e43f", "bitcoin"]);

const keyString = "0x70asdfhalsflasjdf34ggff02";

type HeaderPriceRange = "24H" | "7D" | "30D" | "90D" | "1Y";

const HEADER_PRICE_RANGE_OPTIONS: Array<{
  label: HeaderPriceRange;
  value: HeaderPriceRange;
}> = ["24H", "7D", "30D", "90D", "1Y"].map((range) => ({
  label: range as HeaderPriceRange,
  value: range as HeaderPriceRange,
}));

export type ParticipantsKeys = "investors" | "team" | "advisors" | "partners";

export const dataAllocation = [
  { name: "Team", allocated: 18.5, value: 20 },
  { name: "Investors", allocated: 29.5, value: 30 },
  { name: "Development Fund", allocated: 23, value: 25 },
  { name: "Public Sales", allocated: 13.8, value: 15 },
  { name: "Reserve", value: 10 },
];

const calculateProgress = (
  price: number,
  low: number,
  high: number
): number => {
  if (![price, low, high].every((value) => Number.isFinite(Number(value)))) {
    return 0;
  }
  if (high <= low) {
    return 0;
  }
  if (price < low) {
    return 0;
  }
  if (price > high) {
    return 100;
  }
  return ((price - low) / (high - low)) * 100;
};

export const parseSocialMedia = (
  socialMedia?: Record<string, string[]> | ISocialMediaItem[] | null
): ISocialMediaItem[] => {
  const result: ISocialMediaItem[] = [];

  if (!socialMedia) return [];

  if (Array.isArray(socialMedia)) return socialMedia;

  Object.entries(socialMedia).forEach(([key, links]) => {
    links.forEach((href) => {
      let name = key.charAt(0).toUpperCase() + key.slice(1);

      if (name === "Explorer") return { href: "", name: "", icon: "" };

      let icon = undefined;

      result.push({
        href,
        name,
        icon,
      });
    });
  });

  return result;
};

const MARKET_SOCIAL_ICONS: Record<string, React.ElementType> = {
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

const MARKET_SOCIAL_LABELS: Record<string, string> = {
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

const getProjectRankTier = (rank?: number | null): "elite" | "strong" | "solid" | "base" => {
  if (!Number.isFinite(Number(rank)) || Number(rank) <= 0) return "base";
  if (Number(rank) <= 10) return "elite";
  if (Number(rank) <= 50) return "strong";
  if (Number(rank) <= 100) return "solid";
  return "base";
};

const getProjectRankTooltip = (rank?: number | null): string => {
  const numericRank = Number(rank);

  if (!Number.isFinite(numericRank) || numericRank <= 0) {
    return "Market rank is not available yet.";
  }

  if (numericRank <= 10) return "Top 10 market project by rank.";
  if (numericRank <= 50) return "Top 50 market project by rank.";
  if (numericRank <= 100) return "Top 100 market project by rank.";
  return "Market project rank.";
};

const hasNonZeroMetricValue = (value?: number | string | null): boolean => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue !== 0;
};

const formatRoiMetric = (value?: number | string | null): string => {
  if (!hasNonZeroMetricValue(value)) return "--";

  return `${Number(value).toFixed(2)}X`;
};

const formatUsdMetric = (
  value?: number | string | null,
  shouldClarify = false
): string => {
  if (!hasNonZeroMetricValue(value)) return "--";

  return `$${shouldClarify ? clarifyAmount(Number(value)) : value}`;
};

const formatProjectHeaderPrice = (
  value?: number | string | null
): string => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return "";

  const absoluteValue = Math.abs(numericValue);

  if (absoluteValue > 0 && absoluteValue < 0.01) {
    const exponent = Number(absoluteValue.toExponential().split("e")[1]);
    const leadingFractionZeros = exponent < 0 ? Math.abs(exponent) - 1 : 0;
    const fractionDigits = Math.min(
      Math.max(leadingFractionZeros + 3, 4),
      8
    );
    const formattedValue = numericValue
      .toFixed(fractionDigits)
      .replace(/(\.\d*?)0+$/, "$1")
      .replace(/\.$/, "");

    if (formattedValue !== "0" && formattedValue !== "-0") {
      return formattedValue;
    }

    return numericValue < 0 ? "-<0.00000001" : "<0.00000001";
  }

  return numericValue.toFixed(2);
};

const getHeaderChartPointPrice = (point: any): number | null => {
  const value =
    point?.price?.USD ??
    point?.priceUsd ??
    point?.usd ??
    (typeof point?.price === "number" ? point.price : undefined);
  const numericValue = Number(value);

  return Number.isFinite(numericValue) && numericValue > 0
    ? numericValue
    : null;
};

const getFirstFiniteNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  return null;
};

const getHeaderPriceChangeFallback = (
  project: any,
  range: HeaderPriceRange
): number => {
  const rangeFallbacks: Record<HeaderPriceRange, unknown[]> = {
    "24H": [
      project?.price24hChange,
      project?.priceChange24h,
      project?.usdQuote?.percent_change_24h,
      project?.usdQuote?.percentChange24h,
      project?.usdQuote?.price_change_percentage_24h,
      project?.percent_change_24h,
      project?.percentChange24h,
      project?.price_change_percentage_24h,
      project?.priceChangePercentage24h,
      project?.priceChangePercent24h,
      project?.changePercent24h,
      project?.change24h,
      project?.performance?.usd?.change24h,
      project?.priceChange,
    ],
    "7D": [
      project?.performance?.usd?.change7d,
      project?.usdQuote?.percent_change_7d,
      project?.usdQuote?.percentChange7d,
      project?.priceChange7d,
      project?.change7d,
    ],
    "30D": [
      project?.performance?.usd?.change30d,
      project?.priceChange30d,
      project?.priceChange1m,
      project?.change30d,
    ],
    "90D": [
      project?.performance?.usd?.change90d,
      project?.priceChange90d,
      project?.priceChange3m,
      project?.change90d,
    ],
    "1Y": [
      project?.performance?.usd?.change1y,
      project?.priceChange1y,
      project?.change1y,
    ],
  };

  return getFirstFiniteNumber(...rangeFallbacks[range]) ?? 0;
};

const getProjectRangePrice = (
  values: any,
  range: HeaderPriceRange,
  fallback?: number | string | null
): number => {
  const rangeValue =
    values?.[range]?.USD ??
    values?.[range]?.usd ??
    values?.[range] ??
    values?.ALL?.USD ??
    values?.ALL?.usd ??
    values?.ALL ??
    fallback;
  const numericValue = Number(rangeValue);

  return Number.isFinite(numericValue) ? numericValue : 0;
};

const buildHeaderPriceStats = (
  points: Array<any>,
  project: any,
  range: HeaderPriceRange
) => {
  const priceValues = points
    .map(getHeaderChartPointPrice)
    .filter((value): value is number => value !== null);
  const latestPrice = priceValues[priceValues.length - 1];
  const firstPrice = priceValues[0];
  const projectPrice = Number(project?.price || 0);
  const currentPrice =
    Number.isFinite(latestPrice) && latestPrice > 0 ? latestPrice : projectPrice;
  const lowPrice = priceValues.length
    ? Math.min(...priceValues)
    : getProjectRangePrice(project?.lows, range, project?.atlUsd);
  const highPrice = priceValues.length
    ? Math.max(...priceValues)
    : getProjectRangePrice(project?.highs, range, project?.athUsd);
  const calculatedChange =
    priceValues.length > 1 && Number.isFinite(firstPrice) && firstPrice > 0
      ? ((currentPrice - firstPrice) / Math.abs(firstPrice)) * 100
      : getHeaderPriceChangeFallback(project, range);

  return {
    currentPrice: Number.isFinite(currentPrice) ? currentPrice : 0,
    lowPrice: Number.isFinite(lowPrice) ? lowPrice : 0,
    highPrice: Number.isFinite(highPrice) ? highPrice : 0,
    priceChange: Number.isFinite(calculatedChange) ? calculatedChange : 0,
  };
};

const getHeaderCategoryLabel = (category: any): string => {
  if (!category) return "";
  if (typeof category === "string") return category.trim();

  return String(
    category.name || category.title || category.label || category.slug || ""
  ).trim();
};

const getHeaderCategories = (project: any): string[] => {
  const rawCategories = [
    ...(Array.isArray(project?.categories) ? project.categories : []),
    project?.mainCategory?.name,
    project?.mainCategory,
    project?.type,
  ];
  const seen = new Set<string>();

  return rawCategories
    .map(getHeaderCategoryLabel)
    .filter(Boolean)
    .filter((category) => {
      const key = category.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const CryptoMarketProject = () => {
  const { translateText } = useTranslation();
  const router = useRouter();
  const isMarketProjectRoute = router.pathname === "/market/[coingeckoId]";
  const marketProjectTabsAnchorRef = useRef<HTMLDivElement | null>(null);
  const marketProjectAboutRef = useRef<HTMLDivElement | null>(null);
  const headerDescriptionRef = useRef<HTMLSpanElement | null>(null);
  const [investorsModal, setInvestorsModal] = useState(false);
  const [addInvestorsModal, setAddInvestorsModal] = useState(false);
  const [teamModal, setTeamModal] = useState(false);
  const [addTeamModal, setAddTeamModal] = useState(false);
  const [greenFlagsModal, setGreenFlagsModal] = useState(false);
  const [yellowFlagsModal, setYellowFlagsModal] = useState(false);
  const [redFlagsModal, setRedFlagsModal] = useState(false);
  const [isEventModal, setIsEventModal] = useState(false);
  const [topModal, setTopModal] = useState<boolean>(false);
  const [initialTab, setInitialTab] =
    useState<TopModalVariants>("Top Followers");
  const [participantActiveTab, setParticipantActiveTab] = useState(
    participantsItems[0]
  );

  const [isEditState, setIsEditState] = useState<boolean>(false);
  const [projectDataToUpdate, setProjectDataToUpdate] =
    useState<IProject | null>(null);

  const { userData } = useContext(AuthContext);
  const project: IProjectWithRefetch = useContext(ProjectDataContext);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const isUnlocksTabActive = activeTab === "Unlocks";
  const projectAny = project as any;
  const isVestingReviewed = Boolean(project?.isVestingReview);
  const marketCoinGeckoId = String(
    projectAny?.coingeckoId || projectAny?.providerIds?.coingeckoId || ""
  ).trim();
  const isV2MarketProject =
    project?.projectType === "market" && Boolean(marketCoinGeckoId);
  const hideTeamTab = [project?._id, project?.slug, project?.sourceId].some(
    (value) => projectsWithoutTeamTab.has(String(value || "").toLowerCase())
  );
  const visibleTabs = useMemo(
    () => (hideTeamTab ? tabs.filter((tab) => tab !== "Team") : tabs),
    [hideTeamTab]
  );
  const dropstabProjectKey = String(
    isV2MarketProject ? marketCoinGeckoId : ""
  ).trim();
  const [headerPriceRange, setHeaderPriceRange] =
    useState<HeaderPriceRange>("30D");
  const {
    data: headerPriceChartData,
    isLoading: isHeaderPriceChartLoading,
    isFetching: isHeaderPriceChartFetching,
  } = useQuery(
    ["market-project-header-price", marketCoinGeckoId, headerPriceRange],
    () =>
      fetchMarketProjectChart({
        id: marketCoinGeckoId,
        range: headerPriceRange,
      }),
    {
      enabled: isMarketProjectRoute && Boolean(marketCoinGeckoId),
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      staleTime: 60 * 1000,
    }
  );
  const {
    data: dropstabUnlocksResponse,
    isLoading: isDropstabUnlocksLoading,
    isFetching: isDropstabUnlocksFetching,
  } = useQuery(
    ["project-dropstab-market-token-allocation", dropstabProjectKey],
    () =>
      fetchProjectUnlocks(
        dropstabProjectKey,
        "?projectType=market&lookup=coingeckoId"
      ),
    {
      enabled:
        Boolean(dropstabProjectKey) && isUnlocksTabActive && isV2MarketProject,
      staleTime: 5 * 60 * 1000,
    }
  );
  const dropstabUnlocks = dropstabUnlocksResponse?.isSuccess
    ? dropstabUnlocksResponse.data
    : null;
  const dropstabAllocation = buildDropstabTokenAllocation(
    dropstabUnlocks,
    project
  );
  const isDropstabTokenAllocationLoading =
    Boolean(dropstabProjectKey) &&
    (isDropstabUnlocksLoading || isDropstabUnlocksFetching) &&
    !dropstabUnlocksResponse;
  const tokenDistributionItems = dropstabAllocation.length
    ? dropstabAllocation
    : normalizeTokenAllocationItems(
      projectAny?.allocations ||
        projectAny?.tokenDistribution ||
        projectAny?.totalAllocation ||
        [],
      project
    );
  const tokenDistributionSymbol = resolveProjectTokenDisplaySymbol(
    project,
    dropstabUnlocks
  );
  const projectSymbolLabel = resolveProjectTokenDisplaySymbol(project);
  const projectRank = Number(project?.rank || 0);
  const hasProjectRank = Number.isFinite(projectRank) && projectRank > 0;
  const projectRankLabel = Math.trunc(projectRank);
  const projectRankTier = getProjectRankTier(projectRank);
  const headerPriceStats = useMemo(
    () =>
      buildHeaderPriceStats(
        headerPriceChartData?.data || [],
        project,
        headerPriceRange
      ),
    [
      headerPriceChartData?.data,
      headerPriceRange,
      project,
    ]
  );
  const projectHeaderPrice = formatProjectHeaderPrice(
    project.price || headerPriceStats.currentPrice
  );
  const isHeaderPriceLoading =
    isMarketProjectRoute &&
    (isHeaderPriceChartLoading || isHeaderPriceChartFetching);
  const headerCategories = useMemo(
    () => getHeaderCategories(project),
    [project]
  );
  const portfolioInitialAsset = useMemo<Partial<IGlobalAsset>>(() => {
    const projectId = String(
      projectAny?.marketAssetId ||
        projectAny?._id ||
        projectAny?.sourceId ||
        marketCoinGeckoId ||
        ""
    );
    const logo =
      typeof project.logo === "string"
        ? project.logo
        : typeof project.metadataLogo === "string"
          ? project.metadataLogo
          : null;
    const price = Number(project.price || 0);

    return {
      _id: projectId,
      projectId,
      marketAssetId: projectId,
      canonicalProjectId: String(projectAny?.canonicalProjectId || projectAny?._id || ""),
      name: project.name,
      symbol: projectSymbolLabel,
      ticker: projectSymbolLabel,
      logo,
      price: Number.isFinite(price) ? price : 0,
    };
  }, [
    marketCoinGeckoId,
    project.logo,
    project.metadataLogo,
    project.name,
    project.price,
    projectAny,
    projectSymbolLabel,
  ]);
  const projectFlagEntityId = String(
    projectAny?.canonicalProjectId ||
      projectAny?.marketAssetId ||
      projectAny?.readModelId ||
      projectAny?._id ||
      ""
  );
  const [isNotificationProject, setIsNotificationProject] = useState<boolean>(
    userData?.notifications?.includes(project._id)
  );
  const [isUserEvent, setIsUserEvent] = useState<boolean>(
    userData?.privateEvents?.includes(project._id)
  );
  const [newComments, setNewComments] = useState<Array<IComment>>([]);
  const [isHideDesc, setIsHideDesc] = useState<boolean>(true);
  const [isShareModal, setIsShareModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isActionsPopoverOpen, setIsActionsPopoverOpen] = useState(false);
  const [isSocialsPopoverOpen, setIsSocialsPopoverOpen] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isDescOverflowing, setIsDescOverflowing] = useState(false);
  const [isMarketChartCompactMode, setIsMarketChartCompactMode] =
    useState(false);
  const [isAddPortfolioAssetModal, setIsAddPortfolioAssetModal] =
    useState(false);

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    if (!isMarketProjectRoute) return undefined;

    const scrollToPageTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    };

    scrollToPageTop();

    const animationFrame = window.requestAnimationFrame(scrollToPageTop);
    const timeoutIds = [0, 120, 360].map((delay) =>
      window.setTimeout(scrollToPageTop, delay)
    );

    return () => {
      window.cancelAnimationFrame(animationFrame);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [isMarketProjectRoute, router.asPath]);

  // Detect mobile on mount and window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const copySmartContract = (smart: string) => {
    clipboardCopy(smart);
    toast.success(translateText("Smart contract was copied"));
  };

  const participantsHandler = (key: string, items: Array<any>): void => {
    setProjectDataToUpdate((prev: any) => {
      return {
        ...prev,
        [key]: items,
      };
    });
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

  const inputsHandler = (name: string, value: any): void => {
    setProjectDataToUpdate((prev: any) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const scrollToMarketTabs = (): void => {
    const scrollFrame = window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        marketProjectTabsAnchorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
    });

    window.setTimeout(() => window.cancelAnimationFrame(scrollFrame), 250);
  };

  const handleTabClick = (value: string): void => {
    setActiveTab(value);
    scrollToMarketTabs();
  };

  const handleMarketChartCompactModeChange = (value: boolean): void => {
    setIsMarketChartCompactMode(value);
  };

  const scrollToMarketAbout = (): void => {
    const scrollFrame = window.requestAnimationFrame(() => {
      marketProjectAboutRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    window.setTimeout(() => window.cancelAnimationFrame(scrollFrame), 250);
  };

  useEffect(() => {
    setIsDescExpanded(false);
  }, [project.bio]);

  useEffect(() => {
    let isMounted = true;

    const measureDescription = () => {
      if (!isMounted) return;
      if (!isMarketProjectRoute && isDescExpanded) return;

      const descriptionElement = headerDescriptionRef.current;

      if (!descriptionElement || !project.bio) {
        setIsDescOverflowing(false);
        return;
      }

      const previewTextElement = descriptionElement.querySelector<HTMLElement>(
        ".description-preview-text"
      );
      const previewViewportElement = descriptionElement.querySelector<HTMLElement>(
        ".description-preview-viewport"
      );
      const measuredElement =
        previewViewportElement || previewTextElement || descriptionElement;
      const previewTextPaddingRight = previewTextElement
        ? Number.parseFloat(
            window.getComputedStyle(previewTextElement).paddingRight
          ) || 0
        : 0;
      const previewTextWidth = previewTextElement
        ? previewTextElement.scrollWidth - previewTextPaddingRight
        : 0;
      const hasVerticalOverflow =
        descriptionElement.scrollHeight > descriptionElement.clientHeight + 1;
      const hasHorizontalOverflow =
        previewTextElement && previewViewportElement
          ? previewTextWidth > previewViewportElement.clientWidth + 1
          : measuredElement.scrollWidth > measuredElement.clientWidth + 1;
      const marqueeDistance =
        previewTextElement && previewViewportElement
          ? Math.max(
              0,
              previewTextWidth - previewViewportElement.clientWidth + 32
            )
          : 0;

      descriptionElement.style.setProperty(
        "--description-marquee-distance",
        `${marqueeDistance}px`
      );
      descriptionElement.style.setProperty(
        "--description-marquee-duration",
        `${Math.min(60, Math.max(24, marqueeDistance / 16 + 18))}s`
      );

      setIsDescOverflowing(
        hasVerticalOverflow || hasHorizontalOverflow
      );
    };

    measureDescription();

    const animationFrame = window.requestAnimationFrame(measureDescription);
    const timeoutIds = [120, 450, 1000].map((delay) =>
      window.setTimeout(measureDescription, delay)
    );
    const documentFonts = (document as Document & {
      fonts?: { ready?: Promise<FontFaceSet> };
    }).fonts;
    documentFonts?.ready?.then(measureDescription).catch(() => undefined);

    const resizeObserver =
      typeof ResizeObserver !== "undefined" && headerDescriptionRef.current
        ? new ResizeObserver(measureDescription)
        : null;

    if (headerDescriptionRef.current) {
      resizeObserver?.observe(headerDescriptionRef.current);
    }

    window.addEventListener("resize", measureDescription);

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(animationFrame);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measureDescription);
    };
  }, [isDescExpanded, isMarketProjectRoute, project.bio]);

  const handleActiveTab = () => {
    switch (activeTab) {
      case "Exchanges":
        return <Exchanges project={project} />;
      case "Fundraising":
        return (
          <Fundraising
            project={project}
            projectDataToUpdate={projectDataToUpdate}
            inputsHandler={inputsHandler}
            isEdit={isEditState}
            dataReviewBanner={
              <DataQualityNotice status="warning" project={project} />
            }
          />
        );
      case "Comparison":
        return <Comparison project={project} />;
      case "Unlocks":
        return (
          <Unlocks
            dropstabUnlocks={dropstabUnlocks}
            isDropstabUnlocksLoading={isDropstabTokenAllocationLoading}
            project={project}
            dataReviewBanner={
              <DataQualityNotice
                status={isVestingReviewed ? "verified" : "warning"}
                className="unlocks-data-review-banner"
                project={project}
              />
            }
            sections={["progress", "metrics", "distribution"]}
          />
        );
      case "Team":
        if (hideTeamTab) return null;
        return <TeamTab project={project} />;
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

  const updateProjectData = async (values: any): Promise<void> => {
    const editedProject: IProject = projectDataToUpdate
      ? {
        ...projectDataToUpdate,
      }
      : {
        ...project,
      };

    for (const key in values) {
      // @ts-ignore
      editedProject[key] = values[key];
    }

    setProjectDataToUpdate(editedProject);
    setGreenFlagsModal(false);
    setYellowFlagsModal(false);
    setRedFlagsModal(false);
    setInvestorsModal(false);
    setTeamModal(false);
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

  const openProjectAuthModal = (): void => {
    openAuthModal(router);
  };

  const isUserFullyAuthorized = (): boolean => {
    if (userData?.isFullAuth) return true;

    openProjectAuthModal();
    return false;
  };

  const openProjectFlagModal = (flagType: "green" | "yellow" | "red"): void => {
    if (!isUserFullyAuthorized()) return;

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

  const openAddPortfolioAssetModal = (): void => {
    if (!isUserFullyAuthorized()) return;

    setIsAddPortfolioAssetModal(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isActionsPopoverOpen) {
        const target = event.target as Element;
        if (!target.closest("[data-popover-trigger]")) {
          setIsActionsPopoverOpen(false);
        }
      }
    };

    if (isActionsPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isActionsPopoverOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (isActionsPopoverOpen) {
        setIsActionsPopoverOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isActionsPopoverOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSocialsPopoverOpen) {
        const target = event.target as Element;
        if (!target.closest("[data-popover-trigger]")) {
          setIsSocialsPopoverOpen(false);
        }
      }
    };

    if (isSocialsPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSocialsPopoverOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (isSocialsPopoverOpen) {
        setIsSocialsPopoverOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSocialsPopoverOpen]);

  const rightColumnContent = [
    <React.Fragment key="roi">
      <h2>{translateText("ROI")}</h2>
      <StatisticsCard variant={"main"}>
        <StatisticsCardHeader>
          <PercentUpdateItem>
            <PercentText>{formatRoiMetric(project?.xfromIco?.USD)}</PercentText>
            <PercentKey>{translateText("USD ROI")}</PercentKey>
          </PercentUpdateItem>
          <PercentUpdateItem>
            <PercentText>{formatRoiMetric(project?.xfromIco?.BTC)}</PercentText>
            <PercentKey>{translateText("BTC ROI")}</PercentKey>
          </PercentUpdateItem>
          <PercentUpdateItem>
            <PercentText>{formatRoiMetric(project?.xfromIco?.ETH)}</PercentText>
            <PercentKey>{translateText("ETH ROI")}</PercentKey>
          </PercentUpdateItem>
        </StatisticsCardHeader>
        <CardRow>
          <CardKey>{translateText("ICO Price")}</CardKey>
          <CardValue>
            <div>{formatUsdMetric(project?.icoPrice?.USD)}</div>
          </CardValue>
        </CardRow>
        <CardRow>
          <CardKey>{translateText("Total Funds Raised")}</CardKey>
          <CardValue>
            <div>{formatUsdMetric(project?.totalRaised, true)}</div>
          </CardValue>
        </CardRow>
      </StatisticsCard>
    </React.Fragment>,

    // Converter Card
    <React.Fragment key="converter">
      <h2>{translateText("Converter")}</h2>
      <Converter
        logo={String(project.logo)}
        name={projectSymbolLabel}
        priceUsd={project.price}
        priceBtc={project.priceBTC}
      />
    </React.Fragment>,

    // Market Investors Tab
    <React.Fragment key="investors">
      <MarketInvestorsTab project={project} />
    </React.Fragment>,

    // Top X Followers
    <React.Fragment key="followers">
      <RightColumnTitle style={{ marginTop: "20px" }}>
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
      <TopFollowersTab
        followers={project?.projectTwitterData?.followers || []}
      />
    </React.Fragment>,

    // X Performance
    <React.Fragment key="x-performance">
      <h2>{translateText("X Performance")}</h2>
      {hasNonZeroMetricValue(project?.twitterScore) ? (
        <ScoreBar
          score={project?.twitterScore || 0}
          maxScore={1000}
          change={
            project?.twitterScore && project?.previousTwitterScore
              ? project?.twitterScore - project?.previousTwitterScore
              : 0
          }
        />
      ) : (
        <XPerformanceNotice>
          {translateText("X performance data is not available yet")}
        </XPerformanceNotice>
      )}
    </React.Fragment>,

    // Flags (conditionally rendered)
    ...(project.greenFlagsList?.length ||
    project.yellowFlagsList?.length ||
    project.redFlagsList?.length
      ? [
        <React.Fragment key="flags">
          <h2>{projectSymbolLabel} {translateText("Green, Yellow & Red Flags")}</h2>
          <FlagsListsWrapper>
            <FlagsList variant={"main"} className="shadow-card">
              <ul>
                {project.greenFlagsList?.map((flag: IFlag, index: number) => {
                  return (
                    <FlagsListItem key={index}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M11.3332 0.667969H2.12105V6.23319H11.3332L9.87862 3.45058L11.3332 0.667969Z"
                          fill="#04A584"
                        />
                        <path
                          d="M0.666504 11.3346H3.57559M2.12105 6.23319V0.667969H11.3332L9.87862 3.45058L11.3332 6.23319H2.12105ZM2.12105 6.23319V10.8709"
                          stroke="#04A584"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      <span>{flag.text}</span>
                    </FlagsListItem>
                  );
                })}
              </ul>
            </FlagsList>
            <FlagsList variant={"main"} className="shadow-card">
              <ul>
                {project.yellowFlagsList?.map((flag: IFlag, index: number) => {
                  return (
                    <FlagsListItem key={index}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M11.3332 0.667969H2.12105V6.23319H11.3332L9.87862 3.45058L11.3332 0.667969Z"
                          fill="#FFC702"
                        />
                        <path
                          d="M0.666504 11.3346H3.57559M2.12105 6.23319V0.667969H11.3332L9.87862 3.45058L11.3332 6.23319H2.12105ZM2.12105 6.23319V10.8709"
                          stroke="#FFC702"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{flag.text}</span>
                    </FlagsListItem>
                  );
                })}
              </ul>
            </FlagsList>
            <FlagsList variant={"main"} className="shadow-card">
              <ul>
                {project.redFlagsList?.map((flag: IFlag, index: number) => {
                  return (
                    <FlagsListItem key={index}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M11.3332 0.667969H2.12105V6.23319H11.3332L9.87862 3.45058L11.3332 0.667969Z"
                          fill="#FF5858"
                        />
                        <path
                          d="M0.666504 11.3346H3.57559M2.12105 6.23319V0.667969H11.3332L9.87862 3.45058L11.3332 6.23319H2.12105ZM2.12105 6.23319V10.8709"
                          stroke="#FF5858"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      <span>{flag.text}</span>
                    </FlagsListItem>
                  );
                })}
              </ul>
            </FlagsList>
          </FlagsListsWrapper>
        </React.Fragment>,
      ]
      : []),
  ];

  const renderMarketSocialLinks = (limit = 4, showLabel = false) => {
    const socialLinks =
      parseSocialMedia(project?.socialmedia)?.map((item: any) => {
        return {
          key: getServiceByUrl(item.href),
          href: item.href,
        };
      }) || [];
    const displayedLinks = socialLinks.slice(0, limit);
    const hiddenLinks = socialLinks.slice(limit);
    const hiddenCount = Math.max(socialLinks.length - limit, 0);

    const renderSocialLink = (
      item: { key: string; href: string },
      index: number,
      withLabel = showLabel
    ) => {
      const Icon = MARKET_SOCIAL_ICONS[item.key] || MARKET_SOCIAL_ICONS.web;
      const label = MARKET_SOCIAL_LABELS[item.key] || "Website";

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
          ? displayedLinks.map((item, index) => renderSocialLink(item, index))
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

  const renderLeftHeader: React.FC = ({
    forMobile,
  }: {
    forMobile?: boolean;
  }) => {
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

    return (
      <LeftHeaderRightWrapper
        className={forMobile ? "left-header-bottom" : "left-header-right"}
      >
        {isMobile && forMobile ? (
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
                          openAddPortfolioAssetModal();
                          closeActionsPopover();
                        }}
                        isFavorite={false}
                        label="Add To Portfolio"
                      />
                      <button onClick={closeActionsPopover}>
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
                      <button onClick={closeActionsPopover}>
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
                className="socials-trigger"
              >
                <Link width={20} height={20} color="#738094" />
              </ActionsPopoverTrigger>
              {isSocialsPopoverOpen && (
                <>
                  <PopoverOverlay onClick={closeSocialsPopover} />
                  <ActionsPopover data-popover-trigger>
                    <PopoverActionsContainer>
                      {isMarketProjectRoute ? (
                        renderMarketSocialLinks(50, true)
                      ) : (
                        <SocialLinks
                          limit={50}
                          className="projects"
                          showLabel
                          links={
                            // @ts-ignore
                            parseSocialMedia(project?.socialmedia)?.map(
                              (item: any) => {
                                return {
                                  key: getServiceByUrl(item.href),
                                  href: item.href,
                                };
                              }
                            ) || []
                          }
                        />
                      )}
                    </PopoverActionsContainer>
                  </ActionsPopover>
                </>
              )}
            </div>
          </>
        ) : (
          // Desktop: Show full actions and socials
          <>
            <ProjectActions>
              <FavButton
                onClick={openAddPortfolioAssetModal}
                isFavorite={false}
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
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </ProjectActions>
            <SocialsWrapper>
              {isMarketProjectRoute ? (
                renderMarketSocialLinks(4)
              ) : (
                <SocialLinks
                  limit={4}
                  className="projects"
                  links={
                    // @ts-ignore
                    parseSocialMedia(project?.socialmedia)?.map((item: any) => {
                      return {
                        key: getServiceByUrl(item.href),
                        href: item.href,
                      };
                    }) || []
                  }
                />
              )}
            </SocialsWrapper>
          </>
        )}
      </LeftHeaderRightWrapper>
    );
  };

  const renderHeaderPrice = (className: "desktop" | "mobile") => {
    const priceChange = Number(headerPriceStats.priceChange || 0);
    const priceLow = headerPriceStats.lowPrice || 0;
    const priceHigh = headerPriceStats.highPrice || 0;
    const priceCurrent = headerPriceStats.currentPrice || project?.price || 0;

    return (
      <PersonPriceWrapper className={className}>
        <PriceInfoWrapper
          className={`market-header-price-card${
            isHeaderPriceLoading ? " is-loading" : ""
          }`}
          aria-busy={isHeaderPriceLoading}
        >
          <div className="market-header-price-body">
            <EditWrapper>
              <PersonCurrencyWrapper>
                <div className="market-header-price-head">
                  <div className="market-header-price-main">
                    <PersonMainPrice variant="p">
                      ${projectHeaderPrice}
                      <span
                        className={priceChange >= 0 ? "positive" : "negative"}
                      >
                        {priceChange.toFixed(2)}%
                      </span>
                    </PersonMainPrice>
                  </div>
                  {isMarketProjectRoute ? (
                    <CustomSelect
                      placeholder={headerPriceRange}
                      className="small-select market-project-select market-project-select-dark market-header-price-select"
                      onChange={(value: string) =>
                        setHeaderPriceRange(value as HeaderPriceRange)
                      }
                      options={HEADER_PRICE_RANGE_OPTIONS}
                    />
                  ) : null}
                </div>
              </PersonCurrencyWrapper>
            </EditWrapper>
            <ProgressWrapper>
              <ProgressBar
                className="market-header-price-range"
                low={priceLow}
                high={priceHigh}
                progress={calculateProgress(
                  Number(priceCurrent),
                  priceLow,
                  priceHigh
                )}
              />
            </ProgressWrapper>
          </div>
        </PriceInfoWrapper>
      </PersonPriceWrapper>
    );
  };

  return (
    <PageWrapper>
      <>
        {SHOW_PROJECT_BREADCRUMBS && !isMobile && (
          <BreadCrumbs
            items={[
              { title: "Crypto", link: "/" },
              { title: "Crypto Market", link: "/" },
              { title: project.name, link: `/crypto/project/${project._id}` },
            ]}
          />
        )}
        <HeaderWrapper
          className={
            isMarketProjectRoute
              ? `market-project-header ${
                  isMarketChartCompactMode
                    ? "market-project-header-compact"
                    : "market-project-header-full"
                }`
              : undefined
          }
        >
          <LeftHeaderWrapper
            className={
              isMarketProjectRoute ? "market-project-header-left" : undefined
            }
          >
            <LeftHeaderPersonInfoWrapper
              className={
                isMarketProjectRoute ? "market-project-primary-panel" : undefined
              }
            >
              <LeftHeaderPersonalWrapper>
                <UserAvatar
                  rating={Number(project.rating || 0)}
                  avatar={
                    project.logo || project.metadataLogo
                      ? project.logo
                        ? imageLoader(String(project.logo))
                        : String(project.metadataLogo)
                      : ""
                  }
                  variant={"success"}
                  size={"project-page"}
                  name={project.name}
                  className="project-avatar"
                  fallbackType="project"
                />
                <div className="project-info">
                  {isEditState ? (
                    <EditStateWrapper>
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
                    <HeaderPersonTitle variant="p">
                      {project.name}
                    </HeaderPersonTitle>
                  )}
                  <HeaderPersonDescription>
                    <div style={{ display: "flex", gap: 10 }}>
                      {isEditState ? (
                        <EditStateWrapper>
                          <input
                            style={{ width: "190px", height: "30px" }}
                            placeholder={translateText("Enter the project’s category")}
                            onChange={(e: any) =>
                              inputsHandler("niche", e.target.value)
                            }
                            value={projectDataToUpdate?.niche || ""}
                          />
                        </EditStateWrapper>
                      ) : (
                        <ProjectSymbolLine>
                          <Typography variant="p">{projectSymbolLabel}</Typography>
                          {hasProjectRank ? (
                            <ProjectRankBadge
                              $tier={projectRankTier}
                              data-tooltip={getProjectRankTooltip(projectRank)}
                              title={getProjectRankTooltip(projectRank)}
                              tabIndex={0}
                            >
                              #{projectRankLabel}
                            </ProjectRankBadge>
                          ) : null}
                        </ProjectSymbolLine>
                      )}
                    </div>
                  </HeaderPersonDescription>
                  {renderLeftHeader({ forMobile: true })}
                </div>
              </LeftHeaderPersonalWrapper>
              {renderLeftHeader({ forMobile: false })}
              {renderHeaderPrice("desktop")}
            </LeftHeaderPersonInfoWrapper>
          </LeftHeaderWrapper>
          <RightHeaderWrapper
            className={
              isMarketProjectRoute ? "market-project-meta-panel" : undefined
            }
          >
            <div className="header-meta-content">
              {project.bio ? (
                isMarketProjectRoute ? (
                  <HeaderDescription
                    ref={headerDescriptionRef}
                    className={
                      isDescOverflowing
                        ? "truncated with-see-more is-marquee"
                        : "truncated is-marquee"
                    }
                  >
                    <span className="description-preview-viewport">
                      <span className="description-preview-text">
                        {project.bio}
                      </span>
                    </span>
                    {isDescOverflowing ? (
                      <HeaderDescriptionSeeMoreLink
                        href="#market-project-about"
                        onClick={(event) => {
                          event.preventDefault();
                          scrollToMarketAbout();
                        }}
                      >
                        {translateText("See more")}
                      </HeaderDescriptionSeeMoreLink>
                    ) : null}
                  </HeaderDescription>
                ) : (
                  <HeaderDescription
                    ref={headerDescriptionRef}
                    className={isDescExpanded ? "" : "truncated"}
                  >
                    {project.bio}
                  </HeaderDescription>
                )
              ) : null}
              {!isMarketProjectRoute && project.bio && isDescOverflowing ? (
                <SeeMoreButton
                  className="after-description"
                  type="button"
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                >
                  {isDescExpanded
                    ? translateText("See less")
                    : translateText("See more")}
                </SeeMoreButton>
              ) : null}
              <ProjectHeaderMetadata
                categories={headerCategories}
                contracts={project.contracts || []}
                onCopyContract={copySmartContract}
              />
            </div>
            {renderHeaderPrice("mobile")}
          </RightHeaderWrapper>
        </HeaderWrapper>
      </>
      <ProjectPriceStatistics
        compactMode={isMarketChartCompactMode}
        onCompactModeChange={handleMarketChartCompactModeChange}
      />
      {isMobile ? (
        <MobileRoiSection className="mobile-roi-section">
          {rightColumnContent[0]}
        </MobileRoiSection>
      ) : null}
      <>
        <TabsScrollAnchor ref={marketProjectTabsAnchorRef} />
        <TabsWrapper
          className={isMarketProjectRoute ? "market-project-tabs" : undefined}
        >
          <Tabs
            className="project-page"
            onClick={handleTabClick}
            activeItem={activeTab}
            items={visibleTabs}
          />
        </TabsWrapper>
        <TabsContentWrapper style={{ gap: "0" }}>
          <LeftColumn>
            {handleActiveTab()}
            {activeTab !== "Unlocks" ? (
              <>
                <div
                  id={isMarketProjectRoute ? "market-project-about" : undefined}
                  ref={marketProjectAboutRef}
                  style={{ scrollMarginTop: 72 }}
                >
                  <AboutProject
                    text={project?.descriptionText || ""}
                    project={project}
                    className={
                      isMarketProjectRoute ? "market-project-about" : undefined
                    }
                  />
                </div>
                <NewsTab project={project} />
              </>
            ) : null}
          </LeftColumn>
          <RightColumn>
            {activeTab === "Fundraising" ? (
              <>
                <h2>{translateText("Token Distribution (Allocation)")}</h2>
                <PieContentWrapper variant={"main"} className="shadow-card">
                  <PieWrapper>
                    {isDropstabTokenAllocationLoading ? (
                      <TokenAllocationPieSkeleton width={280} height={280} />
                    ) : (
                      <PieAllocationsGraphic
                        innerRadius={80}
                        outerRadius={140}
                        width={280}
                        height={280}
                        // @ts-ignore
                        // items={project?.totalAllocation || []}
                        items={tokenDistributionItems}
                        symbol={tokenDistributionSymbol}
                      />
                    )}
                  </PieWrapper>
                  <PieValuesWrapper>
                    <PieValuesPercentageWrapper>
                      {isDropstabTokenAllocationLoading ? (
                        <TokenAllocationListSkeleton />
                      ) : tokenDistributionItems?.length ? (
                        tokenDistributionItems.map((item: any, index: number) => {
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
                              <div>{item?.name}</div>
                              <div className="right-column">
                                <span>
                                  {tokenDistributionSymbol}{" "}
                                  {clarifyAmount(amount)}
                                </span>
                                <span>
                                  {formatAllocationPercent(percent)}%
                                </span>
                              </div>
                            </PieValuesPercentage>
                          );
                        })
                      ) : (
                        <></>
                      )}
                    </PieValuesPercentageWrapper>
                  </PieValuesWrapper>
                </PieContentWrapper>
              </>
            ) : (
              <></>
            )}
            {isMobile ? (
              // Mobile view with slider
              <StatisticsCardsWrapper className="slider-active">
                <Swiper
                  modules={[Pagination]}
                  pagination={{ clickable: true }}
                  spaceBetween={16}
                  slidesPerView={1}
                >
                  {rightColumnContent.slice(1).map((content, index) => (
                    <SwiperSlide key={`slide-${index}`}>{content}</SwiperSlide>
                  ))}
                </Swiper>
              </StatisticsCardsWrapper>
            ) : (
              // Desktop view with regular layout
              <StatisticsCardsWrapper>
                {rightColumnContent}
              </StatisticsCardsWrapper>
            )}
          </RightColumn>
        </TabsContentWrapper>
        {activeTab === "Unlocks" ? (
          <>
            <UnlocksFullWidthSection>
              <Unlocks
                dropstabUnlocks={dropstabUnlocks}
                isDropstabUnlocksLoading={isDropstabTokenAllocationLoading}
                project={project}
                sections={["schedule", "timeline"]}
              />
            </UnlocksFullWidthSection>
            <UnlocksNarrowSection>
              <Unlocks
                dropstabUnlocks={dropstabUnlocks}
                isDropstabUnlocksLoading={isDropstabTokenAllocationLoading}
                project={project}
                sections={["upcoming"]}
              />
              <div
                id={isMarketProjectRoute ? "market-project-about" : undefined}
                ref={marketProjectAboutRef}
                style={{ scrollMarginTop: 72 }}
              >
                <AboutProject
                  text={project?.descriptionText || ""}
                  project={project}
                  className={
                    isMarketProjectRoute ? "market-project-about" : undefined
                  }
                />
              </div>
              <NewsTab project={project} />
            </UnlocksNarrowSection>
          </>
        ) : null}
      </>
      <TrendingAssets project={project} />
      <>
        <CommentBlock
          refetch={project.refetch}
          addComment={confirmAddComment}
          items={project.comments}
        />

        {isShareModal && (
          <ShareModal
            onClose={() => setIsShareModal(false)}
            link="/crypto/project/share/123"
          />
        )}
      </>
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
      {teamModal ? (
        <TeamListModal
          // @ts-ignore
          items={projectDataToUpdate[participantActiveTab.toLowerCase()] || []}
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
      {greenFlagsModal ? (
        <GreenFlagsModal
          updateProjectData={updateProjectData}
          project={
            isEditState && projectDataToUpdate ? projectDataToUpdate : project
          }
          v2EntityType={isMarketProjectRoute ? "market_project" : undefined}
          v2EntityId={isMarketProjectRoute ? projectFlagEntityId : undefined}
          onSubmitted={() => project.refetch?.()}
          onAuthRequired={openProjectAuthModal}
          onClose={() => setGreenFlagsModal(false)}
        />
      ) : (
        <></>
      )}
      {yellowFlagsModal ? (
        <YellowFlagsModal
          updateProjectData={updateProjectData}
          project={
            isEditState && projectDataToUpdate ? projectDataToUpdate : project
          }
          v2EntityType={isMarketProjectRoute ? "market_project" : undefined}
          v2EntityId={isMarketProjectRoute ? projectFlagEntityId : undefined}
          onSubmitted={() => project.refetch?.()}
          onAuthRequired={openProjectAuthModal}
          onClose={() => setYellowFlagsModal(false)}
        />
      ) : (
        <></>
      )}
      {redFlagsModal ? (
        <RedFlagsModal
          updateProjectData={updateProjectData}
          project={
            isEditState && projectDataToUpdate ? projectDataToUpdate : project
          }
          v2EntityType={isMarketProjectRoute ? "market_project" : undefined}
          v2EntityId={isMarketProjectRoute ? projectFlagEntityId : undefined}
          onSubmitted={() => project.refetch?.()}
          onAuthRequired={openProjectAuthModal}
          onClose={() => setRedFlagsModal(false)}
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
      <CreateOwnAsset
        isVisible={isAddPortfolioAssetModal}
        initialAsset={portfolioInitialAsset}
        onClose={() => setIsAddPortfolioAssetModal(false)}
      />

      {
        <TopModal
          isVisible={topModal}
          onClose={() => setTopModal(false)}
          initialTab={initialTab}
          followers={project?.projectTwitterData?.followers || []}
        />
      }
      {/* {exchangeSettings && <ExchangeSettings onClose={() => setExchangeSettings(false)} />} */}
    </PageWrapper>
  );
};

export default CryptoMarketProject;
