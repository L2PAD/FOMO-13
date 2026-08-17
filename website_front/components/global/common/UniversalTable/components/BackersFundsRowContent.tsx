import React from "react";
import styled from "styled-components";
import {
  getServiceByUrl,
  HighlightedText,
  imageLoader,
  ISocialMediaItem,
  LikeWrapper,
  ProjectData,
  SocialLinks,
  StarIcon,
  type UniversalTableCaseProps,
  UserAvatar,
} from "./shared";

export type SupportedProject = {
  id?: string;
  name?: string;
  slug?: string;
  logo?: string;
  image?: string;
};

type TableSocialLink = {
  href: string;
  key: string;
};

const SupportedProjectsWrapper = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`;

const SupportedProjectItem = styled.div`
  &:not(:first-child) {
    margin-left: -11px;
  }
`;

const SupportedProjectsMore = styled.button<{
  $hasProjects?: boolean;
  $isClickable?: boolean;
}>`
  background: #e9f8f8;
  border: 2px solid #ffffff;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  padding: 0;
  font-size: 11px;
  color: #04a584;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateX(${({ $hasProjects }) => ($hasProjects ? "-10px" : "0")});
  z-index: 10;
  cursor: ${({ $isClickable }) => ($isClickable ? "pointer" : "default")};
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;

  ${({ $isClickable }) =>
    $isClickable
      ? `
        &:hover {
          background: #04a584;
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(4, 165, 132, 0.22);
          border-color: #d9f4ee;
        }
      `
      : ""}

  &:focus-visible {
    outline: 2px solid #04a584;
    outline-offset: 2px;
  }
`;

const ScoreValue = styled.div<{ value?: number }>`
  color: ${({ value }) => {
    if (!value) return "#738094";
    if (value >= 70) return "#04a584";
    if (value >= 40) return "#ffc702";
    return "#ff5858";
  }};
  justify-self: end;
  padding-right: 8px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
`;

const RatingValue = styled(LikeWrapper)`
  justify-self: end;
  gap: 3px;
  padding-right: 8px;

  span {
    font-size: 14px;
  }

  svg {
    width: 14px;
    height: 14px;
  }

  svg,
  path {
    pointer-events: none;
  }
`;

const getProjectsCount = (item: any): number => {
  const value = Number(
    item?.projectsCount ??
      item?.supportedProjectsCount ??
      item?.portfolioCoinsCount ??
      item?.binanceListing?.totalProjects ??
      0
  );

  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
};

const formatProjectsCount = (value: number): string => {
  return String(value || 0);
};

const getRoiClassName = (value: number): string => {
  if (value > 0) return "row-bold-value green-color";
  if (value < 0) return "row-bold-value red-color";
  return "row-bold-value gray-color";
};

const normalizeString = (value: any): string => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized && normalized !== "[object Object]" ? normalized : "";
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);

  return "";
};

const getDisplayStringFromValue = (value: any): string => {
  const normalized = normalizeString(value);
  if (normalized) return normalized;

  if (!value || typeof value !== "object") return "";

  const preferredKeys = [
    "name",
    "label",
    "title",
    "value",
    "region",
    "country",
    "countryName",
    "location",
    "id",
    "code",
  ];

  for (const key of preferredKeys) {
    const candidate = getDisplayStringFromValue(value[key]);
    if (candidate) return candidate;
  }

  for (const candidateValue of Object.values(value)) {
    const candidate = getDisplayStringFromValue(candidateValue);
    if (candidate) return candidate;
  }

  return "";
};

const getDisplayString = (...values: any[]): string => {
  for (const value of values) {
    const normalized = getDisplayStringFromValue(value);
    if (normalized) return normalized;
  }

  return "";
};

const toFiniteNumber = (value: any): number | null => {
  const normalized =
    typeof value === "string"
      ? value.replace(/[$,%\s]/g, "").replace(/,/g, "")
      : value;
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
};

const getPortfolioRoi = (portfolio: any): number | null => {
  if (!Array.isArray(portfolio)) return null;

  const roiValues = portfolio
    .map((project: any) => toFiniteNumber(project?.roi))
    .filter((value): value is number => value !== null && value !== 0);

  if (!roiValues.length) return null;

  return roiValues.reduce((sum, value) => sum + value, 0) / roiValues.length;
};

const getRoiValue = (item: any): number | null => {
  const values = [
    item?.roi,
    item?.averageRoi,
    item?.avgPublicRoi,
    item?.stats?.avgPublicRoi,
    item?.retailRoiPercent,
    item?.avgPrivateRoi,
    item?.stats?.avgPrivateRoi,
    item?.privateRoiPercent,
    getPortfolioRoi(item?.portfolio),
  ];

  for (const value of values) {
    const parsed = toFiniteNumber(value);

    if (parsed !== null && parsed !== 0) return parsed;
  }

  return null;
};

const formatRoiDisplay = (value: number | null): string => {
  if (value === null) return "-";
  if (Math.abs(value) > 9999) return ">9999x";

  return `${value.toFixed(2).replace(/\.00$/, "")}x`;
};

const formatScore = (value: any, suffix = "") => {
  const score = toFiniteNumber(value);
  if (score === null || score <= 0) return "-";

  return `${Math.round(score)}${suffix}`;
};

const getRatingValue = (item: any): number | null => {
  const values = [
    item?.rating,
    item?.fomoScore,
    item?.ratingBreakdown?.score,
    item?.stats?.rating,
  ];

  for (const value of values) {
    const parsed = toFiniteNumber(value);

    if (parsed !== null && parsed > 0) return parsed;
  }

  return null;
};

const getFullnessValue = (item: any): number | null => {
  const values = [item?.fullness, item?.fullnessBreakdown?.score];

  for (const value of values) {
    const parsed = toFiniteNumber(value);

    if (parsed !== null && parsed > 0) return parsed;
  }

  return null;
};

const getRegionLabel = (item: any): string => {
  return (
    getDisplayString(
      item?.regionData?.region,
      item?.regionData?.region?.name,
      item?.regionData?.region?.label,
      item?.regionData?.properties?.name,
      item?.regionData?.id,
      item?.country?.name,
      item?.country?.label,
      item?.country?.region,
      item?.country?.properties?.name,
      item?.country?.id,
      item?.country,
      item?.location,
    ) || "-"
  );
};

const socialKeyAliases: Record<string, string> = {
  twitter: "x",
  x: "x",
  telegram: "tg",
  tg: "tg",
  discord: "ds",
  ds: "ds",
  linkedin: "link",
  linkedIn: "link",
  link: "link",
  facebook: "fs",
  fs: "fs",
  instagram: "inst",
  inst: "inst",
  youtube: "youTube",
  youTube: "youTube",
  reddit: "reddit",
  tiktok: "tiktok",
  threads: "threads",
  website: "web",
  web: "web",
};

const socialPriority: Record<string, number> = {
  x: 1,
  tg: 2,
  ds: 3,
  link: 4,
  reddit: 5,
  youTube: 6,
  inst: 7,
  fs: 8,
  tiktok: 9,
  threads: 10,
  be: 11,
  web: 100,
};

const normalizeSocialKey = (key: any, href: string): string => {
  const normalizedKey = normalizeString(key).toLowerCase();

  return socialKeyAliases[normalizedKey] || getServiceByUrl(href);
};

const getSocialLinks = (item: any): TableSocialLink[] => {
  const sourceLinks: Array<{ href?: string; key?: string }> = Array.isArray(
    item?.socialmedia
  )
    ? item.socialmedia.map((socialItem: ISocialMediaItem) => ({
        key: socialItem.name,
        href: socialItem.href,
      }))
    : Object.entries(item?.socialLinks || {})
        .filter(([, href]) => Boolean(href))
        .map(([key, href]) => ({
          key,
          href: String(href),
        }));

  const seen = new Set<string>();

  return sourceLinks
    .map((socialItem: { key?: string; href?: string }) => {
      const href = normalizeString(socialItem.href);
      if (!href) return null;

      return {
        href,
        key: normalizeSocialKey(socialItem.key, href),
      };
    })
    .filter((socialItem): socialItem is TableSocialLink => {
      if (!socialItem || seen.has(socialItem.href)) return false;
      seen.add(socialItem.href);
      return true;
    })
    .sort((a: TableSocialLink, b: TableSocialLink) => {
      const firstPriority = socialPriority[a.key] ?? 50;
      const secondPriority = socialPriority[b.key] ?? 50;

      if (firstPriority !== secondPriority) return firstPriority - secondPriority;
      return a.href.localeCompare(b.href);
    });
};

export const SupportedProjects = ({
  className,
  count,
  projects,
  onMoreClick,
  showCountWhenEmpty = false,
}: {
  className?: string;
  count: number;
  projects: SupportedProject[];
  onMoreClick?: () => void;
  showCountWhenEmpty?: boolean;
}) => {
  const normalizedCount = Number.isFinite(Number(count))
    ? Math.max(0, Math.round(Number(count)))
    : 0;
  const totalCount = Math.max(normalizedCount, projects.length);
  const visibleProjects = projects.slice(0, 5);
  const extraCount = Math.max(0, totalCount - visibleProjects.length);

  if (!visibleProjects.length) {
    if (showCountWhenEmpty && totalCount > 0) {
      return (
        <SupportedProjectsWrapper className={className}>
          <SupportedProjectsMore
            type="button"
            $hasProjects={false}
            $isClickable={Boolean(onMoreClick)}
            disabled={!onMoreClick}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onMoreClick?.();
            }}
          >
            +{totalCount}
          </SupportedProjectsMore>
        </SupportedProjectsWrapper>
      );
    }

    return <div className="row-bold-value">-</div>;
  }

  return (
    <SupportedProjectsWrapper className={className}>
      {visibleProjects.map((project, index) => (
        <SupportedProjectItem
          key={project.id || project.slug || `${project.name}-${index}`}
          style={{ zIndex: index + 1 }}
          title={project.name || ""}
        >
          <UserAvatar
            size="xSmall"
            variant="default"
            avatar={imageLoader(project.logo || project.image)}
            name={String(project.name || "")}
            fallbackType="project"
          />
        </SupportedProjectItem>
      ))}
      {extraCount ? (
        <SupportedProjectsMore
          type="button"
          $hasProjects={visibleProjects.length > 0}
          $isClickable={Boolean(onMoreClick)}
          disabled={!onMoreClick}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onMoreClick?.();
          }}
        >
          +{extraCount}
        </SupportedProjectsMore>
      ) : null}
    </SupportedProjectsWrapper>
  );
};

const BackersFundsRowContent = ({
  item,
  searchValue = "",
  onBackerProjectsClick,
}: UniversalTableCaseProps) => {
  const projectsCount = getProjectsCount(item);
  const supportedProjectsCount = Number(
    item?.supportedProjectsCount || projectsCount || 0
  );
  const roi = getRoiValue(item);
  const rating = getRatingValue(item);
  const fullness = getFullnessValue(item);
  const socialLinks = getSocialLinks(item);
  const supportedProjects = Array.isArray(item?.supportedProjectsPreview)
    ? item.supportedProjectsPreview
    : [];

  return (
    <>
      <ProjectData>
        <UserAvatar
          size="otc"
          variant="default"
          avatar={imageLoader(item.logo ? String(item.logo) : "")}
          name={item.name}
          fallbackType="project"
        />
        <div>
          <p>
            <HighlightedText
              text={item.name || "-"}
              searchValue={searchValue}
              highlightAll
            />
          </p>
          <span>{item.type || item.niche || "-"}</span>
        </div>
      </ProjectData>
      <div className="row-bold-value">{formatProjectsCount(projectsCount)}</div>
      <div className={getRoiClassName(roi || 0)}>
        {formatRoiDisplay(roi)}
      </div>
      <SupportedProjects
        count={supportedProjectsCount}
        projects={supportedProjects}
        onMoreClick={
          Math.max(supportedProjectsCount, supportedProjects.length) > 5
            ? () => onBackerProjectsClick?.(item)
            : undefined
        }
      />
      <div className="row-bold-value">
        {getRegionLabel(item)}
      </div>
      <RatingValue>
        <span>{formatScore(rating)}</span>
        <StarIcon fill="#FFC702" />
      </RatingValue>
      <ScoreValue value={fullness || 0}>
        {formatScore(fullness, "%")}
      </ScoreValue>
      <SocialLinks
        className="table-row-links"
        limit={4}
        links={socialLinks}
      />
    </>
  );
};

export default BackersFundsRowContent;
