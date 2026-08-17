import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import SwiperCore from "swiper";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { activityHtmlToPlainText } from "../../../../../helpers/activityRichText";
import imageLoader from "../../../../../helpers/imageLoader";
import useMediaQuery from "../../../../../hooks/useMediaQuery";
import { IProject } from "../../../../../types/global_types";
import { CryptoActivityApiItem } from "../../../../../types/cryptoActivities";
import Placeholder from "../../../../global/common/Placeholder";
import usePromotedActivities from "../usePromotedActivities";
import useSponsoredProjects from "../useSponsoredProjects";
import "swiper/css";
import "swiper/css/autoplay";
import {
  AdLabel,
  Card,
  CardContent,
  HoverCard,
  Items,
  Wrapper,
} from "./styles";
import { useTranslation } from "i18n";
import { fetchFomoV2Launchpads } from "../../../../../http/fomoV2Launchpad";
import type { FomoV2LaunchpadSummary } from "../../../../../types/fomoV2Launchpad";
import {
  isLaunchpadAd,
  mapLaunchpadSummaryToCard,
  resolveMediaUrl,
} from "../../../../../utils/fomoV2Launchpad";

type ProjectHoverMetric = {
  label: string;
  value: string;
};

const MAX_HOVER_METRICS = 6;
const MAX_HOVER_TAGS = 8;
const HOVER_CARD_HIDE_DELAY_MS = 180;

type PromotedItem = IProject & {
  _promotionKind?: "activity" | "launchpad";
  _activityId?: string;
  _activityReward?: string | number | null;
  _activityEndDate?: string | Date | null;
  _activityParticipants?: number | null;
  _launchpadSlug?: string;
  _launchpadHref?: string;
  _launchpadParticipants?: number | null;
};

const isActivityPromotion = (project?: IProject | null): boolean =>
  (project as PromotedItem | undefined)?._promotionKind === "activity";

const isLaunchpadPromotion = (project?: IProject | null): boolean =>
  (project as PromotedItem | undefined)?._promotionKind === "launchpad";

const getActivityDescription = (activity: CryptoActivityApiItem): string => {
  if (typeof activity.description === "string") return activity.description;
  return (
    activityHtmlToPlainText(activity.description?.aboutHtml) ||
    activity.description?.about ||
    ""
  );
};

const toPromotedActivity = (activity: CryptoActivityApiItem): PromotedItem => {
  const activityId = String(activity.slug || activity.id || activity._id || "");
  const projectName = activity.projectName || activity.name || "Activity";

  return {
    _id: `activity:${activityId}`,
    name: projectName,
    symbol: activity.symbol,
    logo: activity.projectLogo || activity.logo,
    image: activity.projectLogo || activity.logo,
    status: activity.lifecycleStatus || activity.status,
    type: activity.activityType || "Activity",
    projectType: "activity",
    categories: [activity.category || activity.activityType || "Activity"].filter(Boolean),
    description: getActivityDescription(activity),
    totalRaised: activity.fundsRaised,
    investors: activity.investors,
    tags: (activity.tags || []).map((value) => ({ value })),
    dateAdded: activity.startDate || undefined,
    _promotionKind: "activity",
    _activityId: activityId,
    _activityReward: activity.rewardLabel || activity.rewardAmount,
    _activityEndDate: activity.endDate,
    _activityParticipants: activity.participants,
  } as PromotedItem;
};

const toPromotedLaunchpad = (launchpad: FomoV2LaunchpadSummary): PromotedItem => {
  const card = mapLaunchpadSummaryToCard(launchpad);
  const placementImage = resolveMediaUrl(
    launchpad.placement?.banner?.desktopUrl
      || launchpad.placement?.banner?.mobileUrl
      || card.logo
  );
  return {
    _id: `launchpad:${launchpad.id}`,
    name: card.name,
    symbol: launchpad.project.symbol,
    logo: placementImage,
    image: placementImage,
    status: card.status,
    type: launchpad.launch.saleType || "Launch",
    projectType: "launchpad",
    categories: [card.category].filter(Boolean),
    description: launchpad.launch.shortDescription || launchpad.launch.description || launchpad.project.description,
    totalRaised: card.raise,
    investors: launchpad.launch.investors as IProject["investors"],
    _promotionKind: "launchpad",
    _launchpadSlug: launchpad.slug || launchpad.id,
    _launchpadHref: launchpad.placement?.banner?.linkUrl,
    _launchpadParticipants: launchpad.pool.onchainState?.participantCount
      || launchpad.pool.onchainState?.participants
      || 0,
  } as PromotedItem;
};

const getProjectLogo = (project?: IProject | null): string => {
  const logo = project?.metadataLogo || project?.logo || project?.image || "";

  return logo ? imageLoader(String(logo)) : "";
};

const getProjectInitial = (project: IProject): string => {
  return String(project?.name || project?.symbol || "?")
    .slice(0, 1)
    .toUpperCase();
};

const getProjectCategory = (project: IProject): string => {
  const mainCategory = (project as any)?.mainCategory;

  if (typeof mainCategory === "string") return mainCategory;
  if (mainCategory?.name) return mainCategory.name;

  return (
    project?.categories?.[0] ||
    project?.sector ||
    project?.niche ||
    project?.type ||
    ""
  );
};

const getProjectDescription = (project: IProject): string => {
  return (
    project?.description ||
    project?.descriptionText ||
    project?.overviewText ||
    project?.bio ||
    "Sponsored project on Echo."
  );
};

const getProjectHref = (project: IProject): string => {
  if (isActivityPromotion(project)) {
    const activityId = (project as PromotedItem)._activityId || project._id;
    return `/crypto/earlyland/${encodeURIComponent(String(activityId))}`;
  }

  if (isLaunchpadPromotion(project)) {
    const placementHref = (project as PromotedItem)._launchpadHref;
    if (placementHref) return placementHref;
    const slug = (project as PromotedItem)._launchpadSlug || project._id;
    return `/utility/launchpad/${encodeURIComponent(String(slug))}`;
  }

  const coingeckoId =
    (project as any)?.coingeckoId ||
    (project as any)?.providerIds?.coingeckoId ||
    "";
  const isMarketProject =
    project?.projectType === "market" ||
    (project as any)?.projectKind === "market" ||
    Boolean(coingeckoId);

  if (isMarketProject && coingeckoId) {
    return `/market/${encodeURIComponent(String(coingeckoId))}`;
  }

  const routeId =
    (project as any)?.sourceId ||
    (project as any)?.slug ||
    project._id;

  return `/crypto/projects/${encodeURIComponent(String(routeId))}?status=${encodeURIComponent(
    String(project.status || "Active")
  )}`;
};

const hasValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value) && value !== 0;

  return true;
};

const formatMoneyValue = (
  value: number | string | null | undefined
): string => {
  if (!hasValue(value)) return "";

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (/[a-zA-Z$]/.test(trimmedValue)) return trimmedValue;
  }

  const formattedValue = clarifyAmount(value);

  return formattedValue ? `$${formattedValue}` : "";
};

const formatNumberValue = (
  value: number | string | null | undefined,
  suffix = ""
): string => {
  if (!hasValue(value)) return "";

  const formattedValue = clarifyAmount(value);

  return formattedValue ? `${formattedValue}${suffix}` : "";
};

const formatScoreValue = (value: number | null | undefined): string => {
  if (!hasValue(value)) return "";

  return Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 1);
};

const formatDateValue = (value: Date | string | null | undefined): string => {
  if (!hasValue(value)) return "";

  const date = new Date(value as Date | string);

  if (Number.isNaN(date.getTime())) return "";

  return date.getFullYear().toString();
};

const formatFullDateValue = (
  value: Date | string | null | undefined
): string => {
  if (!hasValue(value)) return "-";

  const date = new Date(value as Date | string);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getProjectMetricValue = (
  value: string | number | null | undefined
): string => {
  return hasValue(value) ? String(value) : "";
};

const getProjectMetrics = (project: IProject): ProjectHoverMetric[] => {
  const metrics: ProjectHoverMetric[] = [
    {
      label: "Raised",
      value:
        formatMoneyValue(project.totalRaised) ||
        formatMoneyValue(project.fundsRaised),
    },
    {
      label: "Market cap",
      value: formatMoneyValue(project.marketCap),
    },
    {
      label: "Volume 24H",
      value: formatMoneyValue(project.volume24h),
    },
    {
      label: "TVL",
      value: formatMoneyValue(project.tvl),
    },
    {
      label: "Price",
      value: formatMoneyValue(project.price),
    },
    {
      label: "Fomo score",
      value: formatScoreValue(project.fomoScore),
    },
    {
      label: "Twitter score",
      value: formatScoreValue(project.twitterScore),
    },
    {
      label: "Rank",
      value: project.rank ? `#${project.rank}` : "",
    },
    {
      label: "Investors",
      value: project.investors?.length
        ? formatNumberValue(project.investors.length)
        : "",
    },
    {
      label: "Followers",
      value: project.projectTwitterData?.followers?.length
        ? formatNumberValue(project.projectTwitterData.followers.length)
        : "",
    },
    {
      label: "Stage",
      value: getProjectMetricValue(project.stage || project.round),
    },
    {
      label: "Founded",
      value: formatDateValue(project.foundedDate),
    },
  ];

  return metrics
    .filter((metric) => hasValue(metric.value))
    .slice(0, MAX_HOVER_METRICS);
};

const getProjectTags = (project: IProject): string[] => {
  const projectTags = [
    project.status,
    project.projectStatus,
    project.type,
    project.projectType,
    project.blockchain,
    project.platformRaise,
    getProjectCategory(project),
    ...(project.categories || []),
    ...(project.tags || []).map((tag) => tag.value),
  ]
    .filter((tag): tag is string => hasValue(tag))
    .map((tag) => tag.trim());

  return Array.from(new Set(projectTags)).slice(0, MAX_HOVER_TAGS);
};

const getPrimaryFundraisingRound = (project: IProject): any => {
  return Array.isArray(project?.fundraising) ? project.fundraising[0] : null;
};

const getProjectFundingType = (project: IProject): string => {
  const primaryRound = getPrimaryFundraisingRound(project);

  return (
    primaryRound?.type ||
    primaryRound?.name ||
    (project as any)?.saleType ||
    project.round ||
    project.type ||
    "Sponsored"
  );
};

const getProjectCategories = (project: IProject): string[] => {
  const rawCategories = Array.isArray((project as any)?.rawIcoData?.categories)
    ? (project as any).rawIcoData.categories
    : [];
  const mainCategory = (project as any)?.mainCategory;
  const categoryValues = [
    ...rawCategories,
    ...(project.categories || []),
    typeof mainCategory === "string" ? mainCategory : mainCategory?.name,
    project.sector,
    project.niche,
  ].filter((item): item is string => hasValue(item));

  return Array.from(new Set(categoryValues.map((item) => item.trim()))).slice(
    0,
    2
  );
};

const getProjectCategoryLabel = (project: IProject): string => {
  const categories = getProjectCategories(project);

  return categories.length ? categories.join(" • ") : getProjectCategory(project) || "-";
};

const getProjectTotalRaised = (project: IProject): string => {
  if (isActivityPromotion(project)) {
    const reward = (project as PromotedItem)._activityReward;
    return hasValue(reward) ? String(reward) : "-";
  }

  const primaryRound = getPrimaryFundraisingRound(project);

  return (
    formatMoneyValue(project.totalRaised) ||
    formatMoneyValue(project.fundsRaised) ||
    formatMoneyValue(primaryRound?.raised) ||
    "-"
  );
};

const getProjectLastFunding = (project: IProject): string => {
  if (isActivityPromotion(project)) {
    return formatFullDateValue((project as PromotedItem)._activityEndDate);
  }

  const primaryRound = getPrimaryFundraisingRound(project);

  return formatFullDateValue(
    project.lastFunding ||
    primaryRound?.startDate ||
    primaryRound?.endDate ||
    project.dateAdded
  );
};

const getProjectInvestors = (project: IProject): any[] => {
  const primaryRound = getPrimaryFundraisingRound(project);
  const investors = project.investors?.length
    ? project.investors
    : primaryRound?.investors?.length
      ? primaryRound.investors
      : (project as any)?.rawIcoData?.uiInvestors || [];

  return Array.isArray(investors) ? investors : [];
};

const getInvestorName = (investor: any): string => {
  return String(investor?.name || investor?.title || investor?.slug || "").trim();
};

const getProjectInvestorsLabel = (project: IProject): string => {
  const investors = getProjectInvestors(project)
    .map(getInvestorName)
    .filter(Boolean);

  if (!investors.length) return "-";

  const visibleInvestors = investors.slice(0, 3).join(", ");
  const hiddenCount = investors.length - 3;

  return hiddenCount > 0 ? `${visibleInvestors} +${hiddenCount}` : visibleInvestors;
};

const getPromotedBadge = (project: IProject): string => {
  if (isActivityPromotion(project)) {
    return String(project.type || project.status || "Activity");
  }

  if (isLaunchpadPromotion(project)) return String(project.status || "Launch");

  if (project?.projectType === "market" || (project as any)?.projectKind === "market") {
    return "Market";
  }

  const status = String(project.status || "").toLowerCase();

  if (status.includes("upcoming")) return "ICO Upcoming";
  if (status.includes("ended")) return "ICO Ended";

  return "ICO Live";
};

const getProjectDescriptionText = (project: IProject): string => {
  const description = getProjectDescription(project);
  const cleanDescription = activityHtmlToPlainText(description);

  return cleanDescription || "Sponsored Echo opportunity with fresh market data.";
};

const getPromotionHeading = (project: IProject): string =>
  isActivityPromotion(project)
    ? "Promoted activity"
    : isLaunchpadPromotion(project)
      ? "Promoted launch"
      : "Promoted ICO";

const getPromotionPrimaryMetricLabel = (project: IProject): string =>
  isActivityPromotion(project) ? "Reward" : "Total Raised";

const getPromotionSecondaryMetricLabel = (project: IProject): string =>
  isActivityPromotion(project) ? "Deadline" : "Last Funding";

const getPromotionAudienceLabel = (project: IProject): string =>
  isActivityPromotion(project) || isLaunchpadPromotion(project) ? "Participants" : "Investors";

const getPromotionAudienceValue = (project: IProject): string => {
  if (isLaunchpadPromotion(project)) {
    return formatNumberValue((project as PromotedItem)._launchpadParticipants) || "-";
  }
  if (!isActivityPromotion(project)) return getProjectInvestorsLabel(project);
  return formatNumberValue((project as PromotedItem)._activityParticipants) || "-";
};

const getPromotionProjectSubtitle = (project: IProject): string =>
  isActivityPromotion(project)
    ? String(project.type || "Earlyland activity")
    : isLaunchpadPromotion(project)
      ? `${getProjectCategoryLabel(project)} launch`
    : `${getProjectCategoryLabel(project)} ecosystem`;

type PromotedProjectsProps = {
  isSearch?: boolean;
  setIsSearch?: (value: boolean) => void;
  onVisibilityChange?: (isVisible: boolean) => void;
  isOpen?: boolean;
  includeActivities?: boolean;
  placementSurface?: "launchpad" | "crypto_projects";
};

const PromotedProjects = ({
  isSearch = false,
  setIsSearch,
  onVisibilityChange,
  isOpen,
  includeActivities = false,
  placementSurface = "crypto_projects",
}: PromotedProjectsProps = {}) => {
  const { translateText } = useTranslation();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const sponsoredProjectsQuery = useSponsoredProjects({
    enabled: isDesktop,
  });
  const promotedActivitiesQuery = usePromotedActivities({
    enabled: isDesktop && includeActivities,
  });
  const [launchpadPromotions, setLaunchpadPromotions] = useState<PromotedItem[]>([]);
  const [launchpadLoading, setLaunchpadLoading] = useState(false);
  const [launchpadError, setLaunchpadError] = useState(false);
  const [hoveredProject, setHoveredProject] = useState<IProject | null>(null);
  const [displayedHoverProject, setDisplayedHoverProject] =
    useState<IProject | null>(null);
  const [internalVisible, setInternalVisible] = useState(true);
  const swiperRef = useRef<SwiperCore>();
  const hideHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    if (!isDesktop) return;
    const controller = new AbortController();
    setLaunchpadLoading(true);
    setLaunchpadError(false);
    void fetchFomoV2Launchpads({ limit: 100, offset: 0, surface: placementSurface }, controller.signal)
      .then((response) => setLaunchpadPromotions(
        response.items
          .filter(isLaunchpadAd)
          .map(toPromotedLaunchpad)
      ))
      .catch(() => {
        if (!controller.signal.aborted) setLaunchpadError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLaunchpadLoading(false);
      });
    return () => controller.abort();
  }, [isDesktop, placementSurface]);

  const projects = useMemo(() => {
    const activities = includeActivities
      ? (promotedActivitiesQuery.data?.items || [])
          .filter((activity) => activity?.id || activity?._id || activity?.slug)
          .map(toPromotedActivity)
      : [];
    const sponsoredProjects = (sponsoredProjectsQuery.data?.projects || [])
      .filter((project: IProject) => project?._id);

    return [...launchpadPromotions, ...activities, ...sponsoredProjects];
  }, [
    includeActivities,
    launchpadPromotions,
    promotedActivitiesQuery.data?.items,
    sponsoredProjectsQuery.data?.projects,
  ]);
  const isLoading = launchpadLoading || sponsoredProjectsQuery.isLoading ||
    (includeActivities && promotedActivitiesQuery.isLoading);
  const allSourcesFailed = launchpadError && sponsoredProjectsQuery.isError &&
    (!includeActivities || promotedActivitiesQuery.isError);
  const isControlled = typeof isOpen === "boolean";
  const visible = isControlled ? Boolean(isOpen) : internalVisible;
  const activeHoverProject = hoveredProject || displayedHoverProject;

  const setVisibility = useCallback(
    (next: boolean) => {
      if (visible === next) return;

      if (isControlled) {
        onVisibilityChange?.(next);
      } else {
        setInternalVisible(next);
      }
    },
    [isControlled, onVisibilityChange, visible]
  );

  useEffect(() => {
    return () => {
      if (hideHoverTimeoutRef.current) {
        clearTimeout(hideHoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isSearch && visible) {
      setVisibility(false);
      swiperRef.current?.autoplay?.stop();
    }
  }, [isSearch, setVisibility, visible]);

  useEffect(() => {
    if (!isControlled) {
      onVisibilityChange?.(internalVisible);
    }
  }, [internalVisible, isControlled, onVisibilityChange]);

  useEffect(() => {
    if (visible) {
      swiperRef.current?.autoplay?.start();
    } else {
      swiperRef.current?.autoplay?.stop();
      hideProjectHover();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleToggle = () => {
    const nextState = !visible;

    if (!visible) {
      setIsSearch?.(false);
    }

    setVisibility(nextState);
  };

  const showProjectHover = (project: IProject) => {
    if (hideHoverTimeoutRef.current) {
      clearTimeout(hideHoverTimeoutRef.current);
      hideHoverTimeoutRef.current = null;
    }

    setDisplayedHoverProject(project);
    setHoveredProject(project);
  };

  const hideProjectHover = () => {
    setHoveredProject(null);

    if (hideHoverTimeoutRef.current) {
      clearTimeout(hideHoverTimeoutRef.current);
    }

    hideHoverTimeoutRef.current = setTimeout(() => {
      setDisplayedHoverProject(null);
      hideHoverTimeoutRef.current = null;
    }, HOVER_CARD_HIDE_DELAY_MS);
  };

  if (!isDesktop || allSourcesFailed) return null;

  if (isLoading) {
    return (
      <Wrapper>
        <Placeholder width="250px" height="38px" marginBottom="0" />
      </Wrapper>
    );
  }

  if (!projects.length) return null;

  return (
    <Wrapper
      onMouseEnter={() => swiperRef.current?.autoplay?.stop()}
      onMouseLeave={() => {
        hideProjectHover();
        if (visible) swiperRef.current?.autoplay?.start();
      }}
    >
      <AdLabel type="button" isVisible={visible} onClick={handleToggle}>
        <span className="ad-text">{translateText("Ad")}</span>
      </AdLabel>
      <Items isVisible={visible}>
        <Swiper
          modules={[Autoplay]}
          autoplay={{
            delay: 3200,
            disableOnInteraction: false,
          }}
          loop={projects.length > 1}
          slidesPerView={1}
          spaceBetween={12}
          watchOverflow
          onSwiper={(swiper: SwiperCore) => {
            swiperRef.current = swiper;
          }}
        >
          {projects.map((project: IProject) => {
            const logo = getProjectLogo(project);
            const category = getProjectCategory(project);

            return (
              <SwiperSlide key={project._id}>
                <Card
                  href={getProjectHref(project)}
                  onMouseEnter={() => showProjectHover(project)}
                >
                  <CardContent>
                    {logo ? (
                      <img
                        className="project-logo"
                        src={logo}
                        alt={project.name}
                      />
                    ) : (
                      <span className="project-logo-fallback">
                        {getProjectInitial(project)}
                      </span>
                    )}
                    <div className="project-main">
                      <div className="project-name">
                        {project.name || translateText("Unnamed project")}
                      </div>
                      <div className="project-meta">
                        {[project.symbol, category]
                          .filter(Boolean)
                          .join(" · ") || translateText("Sponsored project")}
                      </div>
                    </div>
                    <span className="project-badge">
                      {translateText(getPromotedBadge(project))}
                    </span>
                  </CardContent>
                </Card>
              </SwiperSlide>
            );
          })}
        </Swiper>
        <HoverCard isVisible={Boolean(hoveredProject)}>
          {activeHoverProject ? (
            <div className="hover-content">
                <div className="deal-content">
                  <div className="deal-header">
                  <h4>{translateText(getPromotionHeading(activeHoverProject))}</h4>
                  <span>{translateText(getPromotedBadge(activeHoverProject))}</span>
                </div>
                <div className="deal-divider" />
                <div className="deal-details">
                  <div className="deal-row">
                    <span>{translateText("Type")}:</span>
                    <strong>{getProjectFundingType(activeHoverProject)}</strong>
                  </div>
                  <div className="deal-row">
                    <span>{translateText("Project")}:</span>
                    <strong>
                      {activeHoverProject.name || translateText("Unnamed project")}
                    </strong>
                  </div>
                  <div className="deal-row">
                    <span>{translateText("Category")}:</span>
                    <strong>{getProjectCategoryLabel(activeHoverProject)}</strong>
                  </div>
                  <div className="deal-row">
                    <span>{translateText(getPromotionPrimaryMetricLabel(activeHoverProject))}:</span>
                    <strong>{getProjectTotalRaised(activeHoverProject)}</strong>
                  </div>
                  <div className="deal-row">
                    <span>{translateText(getPromotionSecondaryMetricLabel(activeHoverProject))}:</span>
                    <strong>{getProjectLastFunding(activeHoverProject)}</strong>
                  </div>
                  <div className="deal-row">
                    <span>{translateText(getPromotionAudienceLabel(activeHoverProject))}:</span>
                    <strong className="investors">
                      {getPromotionAudienceValue(activeHoverProject)}
                    </strong>
                  </div>
                </div>
                <div className="deal-divider" />
                <p className="deal-description">
                  <strong>{translateText("Description")}:</strong>{" "}
                  {getProjectDescriptionText(activeHoverProject)}
                </p>
                <div className="deal-divider" />
                <div className="deal-project">
                  {getProjectLogo(activeHoverProject) ? (
                    <img
                      className="deal-logo"
                      src={getProjectLogo(activeHoverProject)}
                      alt={activeHoverProject.name}
                    />
                  ) : (
                    <span className="deal-logo-fallback">
                      {getProjectInitial(activeHoverProject)}
                    </span>
                  )}
                  <div className="deal-project-info">
                    <h5>
                      {activeHoverProject.name || translateText("Unnamed project")}
                    </h5>
                    <p>
                      {translateText(getPromotionProjectSubtitle(activeHoverProject))}
                    </p>
                  </div>
                </div>
                <a
                  className="deal-action"
                  href={getProjectHref(activeHoverProject)}
                >
                  {translateText("Open")} <span>→</span>
                </a>
              </div>
              <div className="hover-header">
                {getProjectLogo(activeHoverProject) ? (
                  <img
                    className="hover-logo"
                    src={getProjectLogo(activeHoverProject)}
                    alt={activeHoverProject.name}
                  />
                ) : (
                  <span className="hover-logo-fallback">
                    {getProjectInitial(activeHoverProject)}
                  </span>
                )}
                <div className="hover-title">
                  <h4>
                    {activeHoverProject.name || translateText("Unnamed project")}
                  </h4>
                  <div className="hover-subtitle">
                    {[activeHoverProject.symbol, getProjectCategory(activeHoverProject)]
                      .filter(Boolean)
                      .join(" · ") || translateText("Sponsored Echo project")}
                  </div>
                </div>
              </div>
              <p className="hover-description">
                {getProjectDescriptionText(activeHoverProject)}
              </p>
              {getProjectMetrics(activeHoverProject).length ? (
                <div className="hover-metrics">
                  {getProjectMetrics(activeHoverProject).map((metric) => (
                    <div className="hover-metric" key={metric.label}>
                      <span>{translateText(metric.label)}</span>
                      <strong>{metric.value}</strong>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </HoverCard>
      </Items>
    </Wrapper>
  );
};

export default PromotedProjects;
