import React from "react";
import {
  clarifyAmount,
  HighlightedText,
  Image,
  imageLoader,
  LikeWrapper,
  OtcLike,
  ProjectData,
  RedFlag,
  StarIcon,
  StatusTag,
  moment,
  type UniversalTableCaseProps,
  UserAvatar,
  UsersRow,
} from "./shared";

const isEmptyValue = (value: any): boolean => {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "number") return !Number.isFinite(value);
  return false;
};

const firstText = (...values: any[]): string => {
  for (const value of values) {
    if (isEmptyValue(value)) continue;

    if (Array.isArray(value)) {
      const nested = firstText(...value);
      if (nested) return nested;
      continue;
    }

    if (typeof value === "object") {
      const nested = firstText(
        value.name,
        value.title,
        value.label,
        value.platformName,
        value.platform,
        value.network,
        value.chain,
        value.value
      );
      if (nested) return nested;
      continue;
    }

    return String(value).trim();
  }

  return "";
};

const firstNumber = (...values: any[]): number | undefined => {
  for (const value of values) {
    if (isEmptyValue(value)) continue;

    if (typeof value === "object" && !Array.isArray(value)) {
      const nested = firstNumber(
        value.value,
        value.score,
        value.total,
        value.rating,
        value.fomoScore
      );
      if (nested !== undefined) return nested;
      continue;
    }

    const parsed =
      typeof value === "number"
        ? value
        : Number(String(value).replace(/[$,\s]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }

  return undefined;
};

const formatMoney = (...values: any[]): string => {
  const numberValue = firstNumber(...values);
  return numberValue !== undefined && numberValue > 0
    ? `$${clarifyAmount(numberValue)}`
    : "--";
};

const formatDate = (...values: any[]): string => {
  const value = firstText(...values);
  return value && moment(value).isValid() ? moment(value).format("MMM D, YYYY") : "-";
};

const normalizeText = (value: any): string => String(value || "").trim().toLowerCase();

const getProjectTickerValues = (item: any): Set<string> => {
  return new Set(
    [
      item?.symbol,
      item?.ticker,
      item?.coinSymbol,
      item?.coingeckoId,
      item?.providerIds?.coingeckoId,
    ]
      .map(normalizeText)
      .filter(Boolean)
  );
};

const getProjectCategory = (item: any): string => {
  const tickerValues = getProjectTickerValues(item);
  const candidates = [
    item?.category,
    item?.mainCategory,
    item?.categories?.[0],
    item?.topCategories?.[0],
    item?.niche,
    item?.type,
  ];

  for (const candidate of candidates) {
    const value = firstText(candidate);
    if (!value || tickerValues.has(normalizeText(value))) continue;

    return value;
  }

  return "";
};

const getProjectPlatform = (item: any): string => {
  return firstText(
    item?.platform,
    item?.platformName,
    item?.launchpad,
    item?.launchpads?.[0],
    item?.blockchain,
    item?.tokenMetrics?.blockchain,
    item?.contracts?.[0]?.platform,
    item?.contracts?.[0]?.network,
    item?.contracts?.[0]?.chain
  );
};

const getProjectType = (item: any): string => {
  return firstText(
    item?.type,
    item?.round,
    item?.rawIcoData?.fundraising?.rounds?.[0]?.type,
    item?.rawIcoData?.saleRounds?.[0]?.type,
    item?.fundraising?.[0]?.type,
    item?.fundraising?.[0]?.roundName,
    item?.fundraising?.[0]?.stage
  );
};

const ProjectsIcoRowContent = ({ item, searchValue = "" }: UniversalTableCaseProps) => {
  const highlight = (value?: string | number | null) => (
    <HighlightedText
      text={value === undefined || value === null || value === "" ? "-" : String(value)}
      searchValue={searchValue}
      highlightAll
    />
  );
  const investors = Array.isArray(item.investors) ? item.investors : [];
  const category = getProjectCategory(item);
  const status = firstText(item?.status, item?.projectStatus, "active");
  const platform = getProjectPlatform(item);
  const totalRaisedValue = formatMoney(
    item?.totalRaised,
    item?.fundsRaised,
    item?.fundraisingTotal,
    item?.rawIcoData?.fundraising?.totalRaised,
    item?.fundraising?.[0]?.raised,
    item?.fundraising?.[0]?.raisedAmount
  );
  const type = getProjectType(item);
  const lastFundingDate = formatDate(
    item?.lastFunding,
    item?.lastRoundDate,
    item?.rawIcoData?.fundraising?.rounds?.[0]?.startDate,
    item?.rawIcoData?.fundraising?.rounds?.[0]?.date,
    item?.fundraising?.[0]?.startDate,
    item?.fundraising?.[0]?.date
  );
  const fomoScore =
    firstNumber(item?.fomoScore, item?.rating, item?.rawIcoData?.scoring?.fomoScore) || 0;

  return (
    <>
      <ProjectData>
        <UserAvatar
          size="otc"
          variant="default"
          avatar={imageLoader(String(item.logo) || "")}
          name={item.name}
          fallbackType="project"
        />
        <div>
          <p>{highlight(item.name)}</p>
          <span>{highlight(item.niche)}</span>
        </div>
      </ProjectData>
      <div>{highlight(category)}</div>
      <StatusTag type="project-table" variant={status.toLowerCase()} />
      <div className="row-bold-value">{highlight(platform)}</div>
      <div className="row-default-value">{totalRaisedValue}</div>
      <div className="row-default-value">{highlight(type)}</div>
      <div className="row-default-value">{highlight(lastFundingDate)}</div>
      <div className="row-default-value">
        {investors.length ? <UsersRow users={investors} /> : "--"}
      </div>
      <div>
        <RedFlag count={item.redFlagsList?.length} />
      </div>
      <LikeWrapper>
        <span>{fomoScore}</span>
        <StarIcon fill="#FFC702" />
      </LikeWrapper>
      <LikeWrapper>
        <span>{item?.likes?.length || 0}</span>
        <Image src={OtcLike} alt="otc like" />
      </LikeWrapper>
    </>
  );
};

export default ProjectsIcoRowContent;
