/* eslint-disable */
import React, { FC, useContext } from "react";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { AuthContext } from "../../../../../global/Layout";
import { ProjectDataContext } from "../../../../../../contexts/projectDataContext";
import { AssetTableData } from "../../../../../../staticContent/global";
import Typography from "../../../../../global/common/Typography";
import { EditIcon } from "../../../../../global/Icons";
import ViewTable from "../../../../../global/Tables/ViewTable";
import { authState } from "../../../../../../store/slices/authSlice";
import { IProject } from "../../../../../../types/global_types";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import EmptyList from "../../../../../global/EmptyList";
import InvestmentsOverview from "../InvestmentsOverview";
import FundingRounds from "../FundingRounds";
import { EditStateWrapper } from "../styles";
import {
  Content,
  ContentWrapper,
  LeftColumn,
  MetricsCol,
  MetricsContentWrapper,
  MetricsRow,
  MetricsWrapper,
  PieContentWrapper,
  PieTitleWrapper,
  PieValuesPercentage,
  PieValuesPercentageWrapper,
  PieValuesTitle,
  PieValuesWrapper,
  PieWrapper,
  RoundTitle,
  RoundValue,
  RoundValueWrapper,
  RoundWrapper,
  TableWrapper,
  Title,
  Wrapper,
} from "./styles";
import DropstabVestingTimeline from "../DropstabVestingTimeline";
import RoundVestingMetrics from "../RoundVestingMetrics";
import Placeholder from "../../../../../global/common/Placeholder";
import UpcomingEvent from "../UpcomingEvent";
import { useTranslation } from "i18n";
import { resolveProjectTokenDisplaySymbol } from "../../../../../../helpers/projectTokenSymbol";
import { useQuery } from "react-query";
import fetchProjectUnlocks from "../../../../../../http/projects/fetchProjectUnlocks";

export const icoTable = [
  {
    stage: "Seed Round",
    seedRound: "12 months",
    privateSaleRound: "24 months",
    publicSale: "4.2% per month",
  },
  {
    stage: "Private Sale",
    seedRound: "6 months",
    privateSaleRound: "18 months",
    publicSale: "5.6% per month",
  },
  {
    stage: "Public Sale",
    seedRound: "-",
    privateSaleRound: "100% TGE",
    publicSale: "Instant unlock",
  },
  {
    stage: "Team & Advisors",
    seedRound: "12 months",
    privateSaleRound: "36 months",
    publicSale: "2.7% per month",
  },
  {
    stage: "Ecosystem & Rewards",
    seedRound: "-",
    privateSaleRound: "48 months",
    publicSale: "2.1% per month",
  },
];

const scheduleData = [
  {
    round: "Seed Round",
    tge: 0,
    items: [
      {
        start: 5,
        end: 5,
        value: "Cliff",
        color: "#860D73",
      },
    ],
  },
  {
    round: "Private Sale",
    tge: 5,
    items: [
      {
        start: 2,
        end: 2,
        value: "Cliff",
        color: "#BC322E",
      },
      {
        start: 5,
        end: 7,
        header: "Liner Vesting 18 months 5.6% per month",
        bottom: "0% - SRC 0M / 150M",
        borderColor: "#BC322E",
        bgColor: "#F9E8E9",
        isTimeline: true,
      },
    ],
  },
  {
    round: "Public Sale",
    tge: 10,
    items: [
      {
        start: 1,
        end: 3,
        header: "Vested at TGE - Instant unlock",
        bottom: "60% - SRC 30M / 50M",
        borderColor: "#867C0D",
        bgColor: "#F3F5EA",
        isTimeline: true,
      },
    ],
  },
  {
    round: "Team & Advisors",
    tge: 0,
    items: [
      {
        start: 5,
        end: 5,
        value: "Cliff",
        color: "#008A4E",
      },
    ],
  },
  {
    round: "Ecosystem & Rewards",
    tge: 0,
    items: [
      {
        start: 1,
        end: 8,
        header: "Liner Vesting 48 months 2.1% per month",
        bottom: "5% - SRC 15M / 300M",
        borderColor: "#193081",
        bgColor: "#EBF3FF",
        isTimeline: true,
      },
    ],
  },
];

interface IProps {
  project: IProject;
  projectDataToUpdate: IProject | null;
  isEdit?: boolean;
  inputsHandler?: (name: string, value: any) => void;
  dataReviewBanner?: React.ReactNode;
}

const firstValue = (...values: Array<any>): any => {
  for (const value of values) {
    if (value === 0) return value;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
};

const isCompactAmountString = (value: string): boolean =>
  /^\$?\s*\d[\d,]*(?:\.\d+)?\s*[KMBT]\s*$/i.test(value.trim());

const parseMetricNumber = (value: any): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    return Number(value.replace(/[$,\s]/g, ""));
  }

  return NaN;
};

const formatMetricValue = (value: any, isMoney = false): string => {
  const current = firstValue(value);
  if (current === "") return "--";

  const numericValue = parseMetricNumber(current);
  if (Number.isFinite(numericValue) && numericValue === 0) return "--";

  if (isMoney) {
    if (typeof current === "string" && isCompactAmountString(current)) {
      return current.trim().startsWith("$") ? current : `$${current}`;
    }

    return Number.isFinite(numericValue)
      ? `$${clarifyAmount(numericValue)}`
      : String(current);
  }

  if (typeof current === "string" && isCompactAmountString(current)) {
    return current.replace(/^\$/, "").trim();
  }

  if (Number.isFinite(numericValue)) {
    return String(clarifyAmount(numericValue));
  }

  return String(current);
};

const getUnlockEventTime = (event: any): number | null => {
  const rawDate = event?.unlockDate || event?.date || event?.endDate;
  if (!rawDate) return null;

  const time = new Date(rawDate).getTime();
  return Number.isFinite(time) ? time : null;
};

const resolveNearestUnlockingEvent = (dropstabUnlocks: any): any | null => {
  const events = Array.isArray(dropstabUnlocks?.unlockingEvents)
    ? dropstabUnlocks.unlockingEvents
    : [];
  const validEvents = events
    .map((event: any) => ({ event, time: getUnlockEventTime(event) }))
    .filter((item: any) => item.time !== null);

  if (validEvents.length) {
    const now = Date.now();
    const futureEvents = validEvents
      .filter((item: any) => item.time >= now)
      .sort((left: any, right: any) => left.time - right.time);

    if (futureEvents.length) return futureEvents[0].event;

    return validEvents.sort(
      (left: any, right: any) =>
        Math.abs(left.time - now) - Math.abs(right.time - now)
    )[0].event;
  }

  return dropstabUnlocks?.nextUnlockingEvent || null;
};

const IcoFundraising: FC<IProps> = ({
  isEdit,
  inputsHandler,
  projectDataToUpdate,
  project,
  dataReviewBanner,
}) => {
  const { translateText } = useTranslation();
  const projectAny = project as any;
  const marketUnlockLookupId = String(project?.coingeckoId || "").trim();
  const dropstabProjectKey = String(
    marketUnlockLookupId || project?.slug || project?.sourceId || project?._id || ""
  ).trim();
  const dropstabProjectQuery = marketUnlockLookupId
    ? "?projectType=market&lookup=coingeckoId"
    : "?projectType=project&lookup=slug";
  const {
    data: dropstabUnlocksResponse,
    isLoading: isDropstabUnlocksLoading,
    isFetching: isDropstabUnlocksFetching,
  } = useQuery(
    ["project-dropstab-unlocks", dropstabProjectKey, dropstabProjectQuery],
    () => fetchProjectUnlocks(dropstabProjectKey, dropstabProjectQuery),
    {
      enabled: Boolean(dropstabProjectKey) && !isEdit,
      staleTime: 5 * 60 * 1000,
    }
  );
  const projectUnlocksFallback = {
    project: {
      name: project?.name,
      symbol: project?.symbol,
      logo: project?.logo,
      coingeckoId: project?.coingeckoId,
    },
    tokenAllocation: projectAny?.tokenDistribution || projectAny?.totalAllocation || [],
    vestingRounds: projectAny?.vestingRounds || [],
    vestingSchedule: projectAny?.vestingSchedule || [],
    vestingTimeline: projectAny?.vestingTimeline || [],
    vestingSummary: projectAny?.vestingSummary,
    events: projectAny?.events || [],
    unlockingEvents: projectAny?.unlockingEvents || [],
    nextUnlockingEvent: projectAny?.nextUnlockingEvent || null,
  };
  const hasProjectUnlocksFallback =
    projectUnlocksFallback.tokenAllocation.length ||
    projectUnlocksFallback.vestingRounds.length ||
    projectUnlocksFallback.vestingSchedule.length ||
    projectUnlocksFallback.vestingTimeline.length ||
    projectUnlocksFallback.vestingSummary;
  const dropstabUnlocks = dropstabUnlocksResponse?.isSuccess
    ? dropstabUnlocksResponse.data
    : hasProjectUnlocksFallback
      ? projectUnlocksFallback
      : null;
  const isDropstabDataLoading =
    !isEdit &&
    Boolean(dropstabProjectKey) &&
    (isDropstabUnlocksLoading || isDropstabUnlocksFetching) &&
    !dropstabUnlocksResponse;
  const activeTokenMetrics = isEdit
    ? projectDataToUpdate?.tokenMetrics || {}
    : project?.tokenMetrics || {};
  const tokenomics =
    project?.tokenomics || project?.tokenDetails || project?.rawIcoData?.tokenomics || {};
  const dropstabVestingRows = Array.isArray(dropstabUnlocks?.vestingTimeline)
    ? dropstabUnlocks.vestingTimeline
    : [];
  const upcomingUnlockingEvent = resolveNearestUnlockingEvent(dropstabUnlocks);

  return (
    <Wrapper>
      <ContentWrapper>
        <Content>
            <MetricsWrapper>
              <Title>{translateText("Token Metrics Table")}</Title>
              {dataReviewBanner}
              <MetricsContentWrapper variant={"main"}>
                <MetricsCol>
                <MetricsRow>
                  <span>{translateText("Ticker")}</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            ticker: e.target.value,
                          })
                        }
                        value={projectDataToUpdate?.tokenMetrics?.ticker || ""}
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>
                      {firstValue(
                        activeTokenMetrics.ticker,
                        activeTokenMetrics.ticket,
                        resolveProjectTokenDisplaySymbol(project)
                      ) || "-"}
                    </span>
                  )}
                </MetricsRow>
                <MetricsRow>
                  <span>{translateText("Token Type")}</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            tokenType: e.target.value,
                          })
                        }
                        value={
                          projectDataToUpdate?.tokenMetrics?.tokenType || ""
                        }
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>{firstValue(activeTokenMetrics.tokenType, project.type) || "-"}</span>
                  )}
                </MetricsRow>
                <MetricsRow>
                  <span>{translateText("Blockchain")}</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            blockchain: e.target.value,
                          })
                        }
                        value={
                          projectDataToUpdate?.tokenMetrics?.blockchain || ""
                        }
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>{firstValue(activeTokenMetrics.blockchain, project.blockchain, project.ecosystems?.[0]) || "-"}</span>
                  )}
                </MetricsRow>
                <MetricsRow>
                  <span>{translateText("Token Price")}</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            tokenPrice: e.target.value,
                          })
                        }
                        value={projectDataToUpdate?.tokenMetrics?.tokenPrice || ""}
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>{formatMetricValue(firstValue(activeTokenMetrics.tokenPrice, project.price), true)}</span>
                  )}
                </MetricsRow>
              </MetricsCol>
              <MetricsCol>
                <MetricsRow>
                  <span>{translateText("Max Supply")}</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            maxSupply: e.target.value,
                          })
                        }
                        value={
                          projectDataToUpdate?.tokenMetrics?.maxSupply || ""
                        }
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>{formatMetricValue(firstValue(activeTokenMetrics.maxSupply, project.maxSupply))}</span>
                  )}
                </MetricsRow>

                <MetricsRow>
                  <span>{translateText("Total Supply")}</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            totalSupply: e.target.value,
                          })
                        }
                        value={
                          projectDataToUpdate?.tokenMetrics?.totalSupply || ""
                        }
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>{formatMetricValue(firstValue(activeTokenMetrics.totalSupply, project.totalSupply))}</span>
                  )}
                </MetricsRow>

                <MetricsRow>
                  <span>{translateText("Circulating Supply")}</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            circulatingSupply: e.target.value,
                          })
                        }
                        value={projectDataToUpdate?.tokenMetrics?.circulatingSupply || ""}
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>{formatMetricValue(firstValue(activeTokenMetrics.circulatingSupply, project.circulatingSupply))}</span>
                  )}
                </MetricsRow>
                <MetricsRow>
                  <span>{translateText("FDV")}</span>
                  <span>{formatMetricValue(firstValue(tokenomics.fdv, project.fullyDilutedMarketCap), true)}</span>
                </MetricsRow>
              </MetricsCol>
            </MetricsContentWrapper>

            {isDropstabDataLoading ? (
              <MetricsContentWrapper variant={"main"}>
                <MetricsCol style={{ width: "100%" }}>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Placeholder
                      key={`dropstab-vesting-metrics-skeleton-${index}`}
                      width="100%"
                      height="28px"
                      borderRadius="8px"
                      marginBottom={index === 3 ? "0" : "12px"}
                    />
                  ))}
                </MetricsCol>
              </MetricsContentWrapper>
            ) : (
              <RoundVestingMetrics
                dropstabUnlocks={dropstabUnlocks}
                fallbackRows={[]}
              />
            )}
            {isDropstabDataLoading ? (
              <>
                <Title style={{ marginTop: "20px" }}>{translateText("Vesting Timeline")}</Title>
                <MetricsContentWrapper variant={"main"}>
                  <MetricsCol style={{ width: "100%" }}>
                    <Placeholder width="100%" height="220px" borderRadius="12px" marginBottom="0" />
                  </MetricsCol>
                </MetricsContentWrapper>
              </>
            ) : dropstabVestingRows.length ? (
              <>
                <Title style={{ marginTop: "20px" }}>{translateText("Vesting Timeline")}</Title>
                <DropstabVestingTimeline
                  dropstabUnlocks={dropstabUnlocks}
                  project={project}
                />
              </>
            ) : (
              <></>
            )}
            {isDropstabDataLoading ? (
              <>
                <Title style={{ marginTop: "20px" }}>
                  {translateText("Upcoming Token Distribution Event")}
                </Title>
                <MetricsContentWrapper variant={"main"}>
                  <MetricsCol style={{ width: "100%" }}>
                    <Placeholder width="100%" height="180px" borderRadius="12px" marginBottom="0" />
                  </MetricsCol>
                </MetricsContentWrapper>
              </>
            ) : upcomingUnlockingEvent ? (
              <>
                <Title style={{ marginTop: "20px" }}>
                  {translateText("Upcoming Token Distribution Event")}
                </Title>
                <UpcomingEvent
                  project={project}
                  nextUnlockingEvent={upcomingUnlockingEvent}
                />
              </>
            ) : (
              <></>
            )}
          </MetricsWrapper>
        </Content>
      </ContentWrapper>
    </Wrapper>
  );
};

export default IcoFundraising;
