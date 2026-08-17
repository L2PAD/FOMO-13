import React from "react";
import styled from "styled-components";
import {
  getServiceByUrl,
  HighlightedText,
  Image,
  imageLoader,
  ISocialMediaItem,
  LikeWrapper,
  OtcLike,
  ProjectData,
  RedFlag,
  SocialLinks,
  StarIcon,
  type UniversalTableCaseProps,
  UserAvatar,
  clarifyAmount,
} from "./shared";

const RatingValue = styled(LikeWrapper)<{ value?: number | null }>`
  span {
    color: ${({ value }) => {
      if (!value) return "#738094";
      if (value >= 70) return "#04a584";
      if (value >= 40) return "#ffc702";
      return "#ff5858";
    }};
    font-weight: var(--font-weight-semibold);
  }
`;

const PersonsRowContent = ({ item, searchValue = "" }: UniversalTableCaseProps) => {
  const toFiniteNumber = (value: any): number | null => {
    const normalized =
      typeof value === "string"
        ? value.replace(/[$,%\sx]/g, "").replace(/,/g, "")
        : value;
    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
  };
  const normalizeString = (value: any): string => {
    if (typeof value === "string") {
      const normalized = value.trim();
      return normalized && normalized !== "[object Object]" ? normalized : "";
    }
    if (typeof value === "number" && Number.isFinite(value)) return String(value);

    return "";
  };
  const highlight = (value?: string | number | null) => (
    <HighlightedText
      text={value === undefined || value === null || value === "" ? "-" : String(value)}
      searchValue={searchValue}
      highlightAll
    />
  );
  const getRatingVariant = (value: number) => {
    if (value < 40) return "error";
    if (value < 70) return "warn";

    return "success";
  };
  const formatScore = (value: number | null): string => {
    if (!value || value <= 0) return "-";

    return String(Math.round(value));
  };
  const formatRoiX = (value: number | null): string => {
    if (value === null || value === 0) return "-";

    return `${value.toFixed(2).replace(/\.00$/, "")}x`;
  };
  const specialization =
    normalizeString(item?.specialization) ||
    (Array.isArray(item?.specializations)
      ? normalizeString(item.specializations[0])
      : "") ||
    normalizeString(item?.niche) ||
    normalizeString(item?.type);
  const roi = toFiniteNumber(item?.roi ?? item?.athRoi ?? item?.roiDisplay);
  const roiDisplay = formatRoiX(roi);
  const investedAmount = toFiniteNumber(item?.totalInvested);
  const projectsCount = toFiniteNumber(
    item?.supportedProjectsCount ?? item?.projectsCount ?? item?.totalInvestments
  );
  const investmentsDisplay =
    investedAmount && investedAmount > 0
      ? `$${clarifyAmount(investedAmount, true)}`
      : projectsCount && projectsCount > 0
        ? String(Math.round(projectsCount))
        : "-";
  const location =
    normalizeString(item?.country) ||
    normalizeString(item?.location) ||
    normalizeString(item?.regionData?.properties?.name) ||
    normalizeString(item?.regionData?.region) ||
    normalizeString(item?.regionData?.id);
  const rating = toFiniteNumber(item?.rating ?? item?.fomoScore);
  const sourceLinks = Array.isArray(item?.socialmedia)
    ? item.socialmedia.map((socialItem: ISocialMediaItem) => ({
        key: getServiceByUrl(socialItem.href),
        href: socialItem.href,
      }))
    : Object.entries(item?.socialLinks || {})
        .filter(([, href]) => Boolean(href))
        .map(([key, href]) => ({
          key,
          href: String(href),
        }));

  return (
    <>
      <ProjectData>
        <UserAvatar
          rating={Math.round(rating || 0)}
          size="otc"
          variant={getRatingVariant(rating || 0)}
          avatar={imageLoader(String(item.logo || item.avatar || "") || "")}
          name={item.name}
        />
        <div>
          <p>{highlight(item.name)}</p>
          <span>{highlight(specialization)}</span>
        </div>
      </ProjectData>
      <div className="row-default-value">{highlight(specialization)}</div>
      <div className={roi && roi < 0 ? "row-bold-value red-color" : "row-bold-value green"}>
        {roiDisplay}
      </div>
      <div className="row-bold-value">{investmentsDisplay}</div>
      <div className="row-default-value">{highlight(location)}</div>
      <div>
        <RedFlag count={item.redFlagsList?.length} />
      </div>
      <div className="fomo-score-info">
        <RatingValue value={rating}>
          <span>{formatScore(rating)}</span>
          <StarIcon fill="#FFC702" />
        </RatingValue>
        <LikeWrapper>
          <span>{item.likes?.length || 0}</span>
          <Image src={OtcLike} alt="otc like" />
        </LikeWrapper>
      </div>
      <SocialLinks
        limit={3}
        className="table-row-links"
        links={sourceLinks}
      />
    </>
  );
};

export default PersonsRowContent;
