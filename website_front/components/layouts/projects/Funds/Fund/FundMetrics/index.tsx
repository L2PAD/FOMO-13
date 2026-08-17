import React, { FC } from "react";
import {
  FundCoInvestor,
  FundraisingRound,
} from "../../../../../../types/global_types";
import { LastInvestmentContent, Row, Wrapper } from "./styles";
import type { IFundProps } from "..";
import { EditStateWrapper } from "../../../Crypto/Project/styles";
import { useTranslation } from "i18n";
import moment from "moment";
import { StarIcon } from "../../../../../global/Icons";
import UserAvatar from "../../../../../global/common/UserAvatar";
import imageLoader from "../../../../../../helpers/imageLoader";
import {
  SupportedProjects,
  SupportedProject,
} from "../../../../../global/common/UniversalTable/components/BackersFundsRowContent";

const toFiniteNumber = (value: any): number | null => {
  const parsed = Number(
    typeof value === "string"
      ? value.replace(/[$,%\s]/g, "").replace(/,/g, "")
      : value
  );

  return Number.isFinite(parsed) ? parsed : null;
};

const formatCount = (value: any): string => {
  const parsed = toFiniteNumber(value);
  if (!parsed || parsed <= 0) return "-";

  return String(Math.round(parsed));
};

const getRoiValue = (fund: any): number | null => {
  return toFiniteNumber(fund?.averageRoi || fund?.roi);
};

const formatRoi = (fund: any): string => {
  if (fund?.roiDisplay) return fund.roiDisplay;

  const parsed = getRoiValue(fund);
  if (!parsed) return "-";
  if (Math.abs(parsed) <= 20) return `${parsed.toFixed(2).replace(/\.00$/, "")}x`;

  return `${parsed > 0 ? "+" : ""}${Math.round(parsed)}%`;
};

const getFullnessClassName = (value: any): string => {
  const parsed = toFiniteNumber(value);
  if (!parsed) return "";
  if (parsed >= 70) return "green-value";
  if (parsed >= 40) return "yellow-value";
  return "red-value";
};

const getRoiClassName = (fund: any): string => {
  const parsed = getRoiValue(fund);
  if (!parsed) return "";
  return parsed > 0 ? "green-value" : "red-value";
};

const normalizeMetricProject = (project: any): SupportedProject | null => {
  const name = String(project?.name || project?.projectName || "").trim();
  if (!name) return null;
  const mongoIdKey = "_id";

  return {
    id: String(project?.id || project?.[mongoIdKey] || project?.slug || project?.projectSlug || name),
    name,
    slug: project?.slug || project?.projectSlug,
    logo: project?.logo || project?.image || project?.projectLogo,
    image: project?.image || project?.logo || project?.projectLogo,
  };
};

const uniqueProjects = (projects: Array<SupportedProject | null>): SupportedProject[] => {
  const seen = new Set<string>();
  const result: SupportedProject[] = [];

  projects.forEach((project) => {
    if (!project?.name) return;
    const key = String(project.slug || project.id || project.name).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(project);
  });

  return result;
};

const getLeadProjects = (fund: any): SupportedProject[] => {
  const rounds = Array.isArray(fund?.fundraisingRounds)
    ? fund.fundraisingRounds
    : [];

  return uniqueProjects(
    rounds
      .filter((round: FundraisingRound & { isLead?: boolean }) => {
        return round?.isLead || Boolean(round?.leadInvestors?.length);
      })
      .map((round: FundraisingRound) => normalizeMetricProject(round))
  );
};

const getCoInvestors = (items?: FundCoInvestor[]): SupportedProject[] => {
  return uniqueProjects(
    (items || []).map((item: FundCoInvestor & { image?: string }) =>
      normalizeMetricProject({
        id: item.id,
        name: item.name,
        slug: item.slug,
        logo: item.logo || item.image,
      })
    )
  );
};

const getDateTime = (value: any): number => {
  const date = moment(value);

  return date.isValid() ? date.valueOf() : 0;
};

const getLastInvestment = (
  fund: any
): { project: SupportedProject | null; date: any } | null => {
  const supportedProjects = [
    ...(Array.isArray(fund?.supportedProjectsPreview) ? fund.supportedProjectsPreview : []),
    ...(Array.isArray(fund?.supportedProjects) ? fund.supportedProjects : []),
  ];
  const rounds = Array.isArray(fund?.fundraisingRounds)
    ? fund.fundraisingRounds
    : [];
  const projectDates = [
    ...supportedProjects.map((project: any) => ({
      project: normalizeMetricProject(project),
      date: project?.roundDate || project?.date || project?.lastRoundDate || project?.lastFunding,
    })),
    ...rounds.map((round: any) => ({
      project: normalizeMetricProject(round),
      date: round?.date || round?.roundDate || round?.lastRoundDate,
    })),
  ]
    .filter((item) => item.project && getDateTime(item.date) > 0)
    .sort((a, b) => getDateTime(b.date) - getDateTime(a.date));

  if (projectDates.length) return projectDates[0];

  const fallbackDate = fund?.stats?.lastInvestmentDate || fund?.lastRoundDate || fund?.lastFunding;
  if (!fallbackDate) return null;

  return {
    project: null,
    date: fallbackDate,
  };
};

const FundMetrics: FC<IFundProps> = ({
  fund,
  fundDataToUpdate,
  isEditState,
  inputsHandler,
}) => {
  const { translateText } = useTranslation();
  const leadProjects = getLeadProjects(fund);
  const coInvestors = getCoInvestors(fund.coInvestors);
  const leadInvestmentsCount =
    toFiniteNumber(fund.stats?.leadInvestments || fund.leadInvestments) ||
    leadProjects.length;
  const coInvestorsCount =
    toFiniteNumber(fund.stats?.coInvestments || fund.coInvestors?.length) ||
    coInvestors.length;
  const lastInvestment = getLastInvestment(fund);

  return (
    <Wrapper variant="main">
      <Row>
        <div className="key">{translateText("Lead Investments")}</div>
        <div className="value projects-value">
          <SupportedProjects
            count={leadInvestmentsCount}
            projects={leadProjects}
            showCountWhenEmpty
          />
        </div>
      </Row>
      <Row>
        <div className="key">{translateText("Co-investors")}</div>
        <div className="value projects-value">
          <SupportedProjects
            count={coInvestorsCount}
            projects={coInvestors}
            showCountWhenEmpty
          />
        </div>
      </Row>
      <Row>
        <div className="key">{translateText("Average ROI")}</div>
        {isEditState ? (
          <EditStateWrapper style={{ width: "100px" }}>
            <input
              type="number"
              style={{ width: "100%", height: "35px" }}
              placeholder={translateText("Enter the fund's category")}
              onChange={(e: any) =>
                inputsHandler("averageRoi", Number(e.target.value))
              }
              value={String(fundDataToUpdate?.averageRoi || 0)}
            />
          </EditStateWrapper>
        ) : (
          <div className={`value ${getRoiClassName(fund)}`}>{formatRoi(fund)}</div>
        )}
      </Row>
      <Row>
        <div className="key">{translateText("Rating")}</div>
        <div className="value rating-value">
          <span>{formatCount(fund.rating)}</span>
          {formatCount(fund.rating) !== "-" ? <StarIcon fill="#FFC702" /> : null}
        </div>
      </Row>
      <Row>
        <div className="key">{translateText("Fullness")}</div>
        <div className={`value ${getFullnessClassName(fund.fullness)}`}>
          {formatCount(fund.fullness) === "-" ? "-" : `${formatCount(fund.fullness)}%`}
        </div>
      </Row>
      <Row>
        <div className="key">{translateText("Last Investment")}</div>
        <div className="value">
          {lastInvestment?.date ? (
            <LastInvestmentContent>
              {lastInvestment.project ? (
                <UserAvatar
                  size="xSmall"
                  variant="default"
                  avatar={imageLoader(lastInvestment.project.logo || lastInvestment.project.image)}
                  name={lastInvestment.project.name || ""}
                  fallbackType="project"
                />
              ) : null}
              <span>{moment(lastInvestment.date).format("ll")}</span>
            </LastInvestmentContent>
          ) : (
            "-"
          )}
        </div>
      </Row>
    </Wrapper>
  );
};

export default FundMetrics;
