import React, { FC, useMemo } from "react";
import {
  PieWrapper,
  Table,
  TableHeader,
  TokenDistribution,
  Wrapper,
} from "./styles";
import {
  MetricsCol,
  MetricsContentWrapper,
  MetricsRow,
  PieValuesPercentage,
  Title,
} from "../Fundraising/styles";
import { IProject } from "../../../../../../types/global_types";
import ProgressBar, { IUnlockProgressData } from "./ProgressBar";
import { COLORS } from "../Fundraising";
import Schedule from "../Schedule";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import DropstabVestingTimeline from "../DropstabVestingTimeline";
import UpcomingEvent from "../UpcomingEvent";
import PieAllocationsGraphic, {
  TokenAllocationListSkeleton,
  TokenAllocationPieSkeleton,
} from "../Fundraising/tokenAllocations";
import UnlocksTable from "../UnlocksTable";
import { UnlockTableRow } from "../../../../../../helpers/analyzeVestingSchedule";
import { Overflow } from "../../../../../global/common/BarDoubleChart/styles";
import { useTranslation } from "i18n";
import {
  buildDropstabTokenAllocation,
  formatAllocationPercent,
} from "../../../../../../helpers/dropstabTokenAllocation";
import { resolveProjectTokenDisplaySymbol } from "../../../../../../helpers/projectTokenSymbol";
import TableTitleInfo from "../TableTitleInfo";

const formatTokenSupplyValue = (
  symbol?: string,
  value?: number | string | null
): string => {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue) || numericValue === 0) return "--";

  const formattedValue = clarifyAmount(numericValue);
  return symbol ? `${symbol} ${formattedValue}` : String(formattedValue);
};

interface IUnlocksProps {
  project: IProject;
  dropstabUnlocks?: any;
  isDropstabUnlocksLoading?: boolean;
  dataReviewBanner?: React.ReactNode;
  sections?: UnlocksSection[];
}

type UnlocksSection =
  | "progress"
  | "metrics"
  | "distribution"
  | "schedule"
  | "timeline"
  | "upcoming";

const toNumber = (value: any, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDate = (value: any): Date | null => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

const monthDiff = (start: Date | null, end: Date | null): number => {
  if (!start || !end) return 0;

  return Math.max(
    0,
    Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)
    )
  );
};

const formatMonths = (months: number): string | null => {
  if (!months) return null;

  return `${months} ${months === 1 ? "month" : "months"}`;
};

const formatPercent = (value: any): string => {
  const percent = toNumber(value, 0);
  if (!percent) return "0";
  if (Math.abs(percent - Math.round(percent)) < 0.01)
    return String(Math.round(percent));

  return percent.toFixed(2).replace(/\.?0+$/, "");
};

const firstText = (...values: Array<any>): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
};

const resolveTokenType = (project: IProject): string => {
  const projectAny = project as any;

  return firstText(
    project?.tokenMetrics?.tokenType,
    projectAny?.tokenMetrics?.token_type,
    projectAny?.tokenDetails?.tokenType,
    projectAny?.tokenDetails?.token_type,
    projectAny?.tokenDetails?.mining_algorithm,
    projectAny?.tokenomics?.tokenType,
    projectAny?.tokenomics?.token_type,
    projectAny?.rawIcoData?.tokenomics?.tokenType,
    projectAny?.rawIcoData?.tokenomics?.token_type
  );
};

const isInstantUnlock = (round: any): boolean => {
  return (
    toNumber(round?.tgeUnlockPercent, 0) >= 99.5 ||
    String(round?.vestingType || "").toLowerCase() === "tge"
  );
};

const resolveDropstabTgeDate = (dropstabUnlocks: any): Date | null => {
  const timeline = Array.isArray(dropstabUnlocks?.vestingTimeline)
    ? dropstabUnlocks.vestingTimeline
    : [];
  const tgeRound = timeline.find((round: any) => isInstantUnlock(round));
  const firstRound = timeline.find((round: any) => parseDate(round?.startDate));

  return parseDate(tgeRound?.startDate) || parseDate(firstRound?.startDate);
};

const buildDropstabUnlockDetails = (dropstabUnlocks: any): any => {
  const summary = dropstabUnlocks?.vestingSummary || {};
  const nextUnlockDate =
    dropstabUnlocks?.nextUnlockingEvent?.unlockDate || null;

  return {
    totalTokensLockedAmount: toNumber(summary.lockedAmount, 0),
    totalTokensLockedPercent: toNumber(summary.lockedPercent, 0),
    totalTokensUnlockedAmount: toNumber(summary.unlockedAmount, 0),
    totalTokensUnlockedPercent: toNumber(summary.unlockedPercent, 0),
    totalTokensUntrackedAmount: toNumber(summary.untrackedAmount, 0),
    totalTokensUntrackedPercent: toNumber(summary.untrackedPercent, 0),
    nextTokenUnlockDate: nextUnlockDate,
    lastTokenUnlockDate: summary.lastUnlockDate || null,
  };
};

const findDropstabTimelineRound = (dropstabUnlocks: any, round: any): any => {
  const timeline = Array.isArray(dropstabUnlocks?.vestingTimeline)
    ? dropstabUnlocks.vestingTimeline
    : [];
  const roundName = String(round?.roundName || "")
    .trim()
    .toLowerCase();

  return timeline.find((item: any) => {
    if (round?.saleId !== undefined && item?.saleId === round.saleId)
      return true;
    return (
      String(item?.roundName || "")
        .trim()
        .toLowerCase() === roundName
    );
  });
};

const buildDropstabScheduleRows = (dropstabUnlocks: any): UnlockTableRow[] => {
  const rounds = Array.isArray(dropstabUnlocks?.vestingRounds)
    ? dropstabUnlocks.vestingRounds
    : [];
  const details = buildDropstabUnlockDetails(dropstabUnlocks);
  const tgeDate = resolveDropstabTgeDate(dropstabUnlocks);

  return rounds
    .map((round: any, index: number) => {
      const timelineRound =
        findDropstabTimelineRound(dropstabUnlocks, round) || round;
      const startDate = parseDate(timelineRound?.startDate);
      const endDate =
        parseDate(timelineRound?.endDate) ||
        parseDate(round?.lastUnlockDate) ||
        startDate;
      const tgePercent = toNumber(timelineRound?.tgeUnlockPercent, 0);
      const durationMonths = toNumber(
        timelineRound?.vestingDurationMonths,
        monthDiff(startDate, endDate)
      );
      const instant = isInstantUnlock(timelineRound);
      const hasCliff =
        Boolean(timelineRound?.hasCliff) ||
        String(timelineRound?.vestingType || "")
          .toLowerCase()
          .includes("cliff");
      const cliffMonths = instant ? 0 : monthDiff(tgeDate, startDate);
      const monthlyUnlock =
        instant || !durationMonths ? null : (100 - tgePercent) / durationMonths;
      const nextUnlockDate =
        round?.nextUnlockingEvent?.unlockDate ||
        timelineRound?.nextUnlockingEvent?.unlockDate ||
        null;
      const timeline = instant
        ? "Vested at TGE"
        : durationMonths
          ? `${cliffMonths > 0 ? `${formatMonths(cliffMonths)}-cliff, then ` : ""}${formatPercent(monthlyUnlock)}% monthly for ${durationMonths} ${durationMonths === 1 ? "month" : "months"}`
          : "Variable unlock schedule";

      return {
        allocatedPercent: toNumber(round?.allocationPercent, 0),
        allocatedTokens: toNumber(
          round?.totalAmount ?? timelineRound?.totalAmount,
          0
        ),
        cliffPeriod: hasCliff ? formatMonths(cliffMonths) || "Cliff" : null,
        id: round?.saleId || timelineRound?.saleId || index,
        monthlyUnlockPercent: instant
          ? "Instant Unlock"
          : monthlyUnlock
            ? `${formatPercent(monthlyUnlock)}% per month`
            : "Varies per month",
        monthlyUnlockPercentSource: "estimate",
        progress: {
          lastTokenUnlockDate:
            round?.lastUnlockDate ||
            timelineRound?.endDate ||
            details.lastTokenUnlockDate,
          lockedTokensAmount: toNumber(
            round?.lockedAmount ?? timelineRound?.lockedAmount,
            0
          ),
          lockedTokensPercent: toNumber(
            round?.lockedPercent ?? timelineRound?.lockedPercent,
            0
          ),
          nextTokenUnlockDate: nextUnlockDate,
          totalTokensAmount: toNumber(
            round?.totalAmount ?? timelineRound?.totalAmount,
            0
          ),
          unlockedTokensAmount: toNumber(
            round?.unlockedAmount ?? timelineRound?.vestedAmount,
            0
          ),
          unlockedTokensPercent: toNumber(
            round?.unlockedPercent ?? timelineRound?.vestedPercent,
            0
          ),
        },
        round:
          round?.roundName || timelineRound?.roundName || `Round ${index + 1}`,
        tgePercent,
        timeline,
        unlockDetails: details,
        vestingPeriod: instant ? "100% at TGE" : formatMonths(durationMonths),
      };
    })
    .filter(
      (row: UnlockTableRow) =>
        row.allocatedTokens > 0 || row.allocatedPercent > 0
    );
};

const buildDropstabProgressData = (
  dropstabUnlocks: any
): IUnlockProgressData | undefined => {
  if (!dropstabUnlocks?.vestingSummary) return undefined;

  const details = buildDropstabUnlockDetails(dropstabUnlocks);
  const unlockItem = {
    ...details,
    allocations: Array.isArray(dropstabUnlocks?.vestingRounds)
      ? dropstabUnlocks.vestingRounds
      : [],
    chart: [],
    tgeDate: resolveDropstabTgeDate(dropstabUnlocks)?.toISOString() || null,
    vesting: Array.isArray(dropstabUnlocks?.vestingTimeline)
      ? dropstabUnlocks.vestingTimeline.map((round: any) => ({
          id: round?.saleId,
          tgePercent: toNumber(round?.tgeUnlockPercent, 0),
        }))
      : [],
  };

  return {
    allocations: [],
    isSuccess: true,
    total: 1,
    unlocks: [unlockItem as any],
    vesting: [],
  };
};

const getEventTime = (event: any): number | null => {
  const date = parseDate(event?.unlockDate);
  return date ? date.getTime() : null;
};

const isFutureUnlockEvent = (event: any): boolean => {
  const eventTime = getEventTime(event);
  return eventTime !== null && eventTime >= Date.now();
};

const resolveUpcomingUnlockEvent = (dropstabUnlocks: any): any => {
  const events = Array.isArray(dropstabUnlocks?.unlockingEvents)
    ? dropstabUnlocks.unlockingEvents
    : [];
  const upcomingEvent = events.find((event: any) => isFutureUnlockEvent(event));

  if (upcomingEvent) return upcomingEvent;

  return isFutureUnlockEvent(dropstabUnlocks?.nextUnlockingEvent)
    ? dropstabUnlocks.nextUnlockingEvent
    : null;
};

const hasFutureScheduleUnlockDate = (unlocks: UnlockTableRow[]): boolean => {
  return unlocks.some((unlock) => {
    const nextUnlockDate =
      unlock?.progress?.nextTokenUnlockDate ||
      unlock?.unlockDetails?.nextTokenUnlockDate;
    const date = parseDate(nextUnlockDate);

    return Boolean(date && date.getTime() >= Date.now());
  });
};

const Unlocks: FC<IUnlocksProps> = ({
  project,
  dropstabUnlocks,
  isDropstabUnlocksLoading = false,
  dataReviewBanner,
  sections,
}) => {
  const { translateText } = useTranslation();
  const dropstabUnlockRows = useMemo(
    () => buildDropstabScheduleRows(dropstabUnlocks),
    [dropstabUnlocks]
  );
  const unlockslist = dropstabUnlockRows;
  const progressUnlocksData = buildDropstabProgressData(dropstabUnlocks);
  const upcomingUnlockEvent = resolveUpcomingUnlockEvent(dropstabUnlocks);
  const dropstabAllocation = buildDropstabTokenAllocation(
    dropstabUnlocks,
    project
  );
  const isDropstabTokenAllocationLoading =
    isDropstabUnlocksLoading && !dropstabUnlocks;
  const tokenDistributionItems = dropstabAllocation;
  const tokenDistributionSymbol = resolveProjectTokenDisplaySymbol(
    project,
    dropstabUnlocks
  );
  const tokenType = resolveTokenType(project);
  const hasUpcomingTokenDistributionEvent =
    Boolean(upcomingUnlockEvent) || hasFutureScheduleUnlockDate(unlockslist);
  const hasVestingTimeline = Array.isArray(dropstabUnlocks?.vestingTimeline)
    ? dropstabUnlocks.vestingTimeline.length > 0
    : false;
  const hasTokenDistribution =
    isDropstabTokenAllocationLoading || tokenDistributionItems.length > 0;
  const shouldRenderSection = (section: UnlocksSection): boolean =>
    !sections || sections.includes(section);
  const hasRenderedContent =
    shouldRenderSection("progress") ||
    shouldRenderSection("metrics") ||
    (shouldRenderSection("distribution") && hasTokenDistribution) ||
    (shouldRenderSection("schedule") && unlockslist.length > 0) ||
    (shouldRenderSection("timeline") && hasVestingTimeline) ||
    (shouldRenderSection("upcoming") && hasUpcomingTokenDistributionEvent);

  if (!hasRenderedContent) return null;

  return (
    <Wrapper>
      {shouldRenderSection("progress") ? (
        <>
          <TableTitleInfo
            className="unlocks-section-title"
            tooltip={translateText(
              "Unlocked, locked, and pending token supply shown against total allocation."
            )}
          >
            <Title>
              {tokenDistributionSymbol} {translateText("Unlock Progress")}
            </Title>
          </TableTitleInfo>
          {dataReviewBanner}
          <ProgressBar
            unlocks={progressUnlocksData}
            project={project}
            tokenSymbol={tokenDistributionSymbol}
          />
        </>
      ) : null}
      {shouldRenderSection("metrics") ? (
        <>
          <TableTitleInfo
            className="unlocks-section-title"
            style={{ marginTop: "20px" }}
            tooltip={translateText(
              "Token identity, chain, supply, and distribution values used by unlocks."
            )}
          >
            <Title>{translateText("Token Metrics Table")}</Title>
          </TableTitleInfo>
          <MetricsContentWrapper
            className="unlocks-metrics-content"
            variant="main"
          >
            <MetricsCol>
              <MetricsRow>
                <span>{translateText("Ticker")}</span>
                <span>{tokenDistributionSymbol || "-"}</span>
              </MetricsRow>
              <MetricsRow>
                <span>{translateText("Token Type")}</span>
                <span>{tokenType || "-"}</span>
              </MetricsRow>
              <MetricsRow>
                <span>{translateText("Blockchain")}</span>
                <span>{project?.blockchain || "-"}</span>
              </MetricsRow>
            </MetricsCol>
            <MetricsCol>
              <MetricsRow>
                <span>{translateText("Max Supply")}</span>
                <span>-</span>
              </MetricsRow>

              <MetricsRow>
                <span>{translateText("Total Supply")}</span>
                <span>
                  {formatTokenSupplyValue(tokenDistributionSymbol, project?.totalSupply)}
                </span>
              </MetricsRow>

              <MetricsRow>
                <span>{translateText("Circulating Supply")}</span>
                <span>
                  {formatTokenSupplyValue(
                    tokenDistributionSymbol,
                    project?.circulatingSupply
                  )}
                </span>
              </MetricsRow>
            </MetricsCol>
          </MetricsContentWrapper>
          {unlockslist.length ? <UnlocksTable vestingData={unlockslist} /> : null}
        </>
      ) : null}
      {shouldRenderSection("distribution") && hasTokenDistribution ? (
        <>
          <TableTitleInfo
            className="unlocks-section-title"
            style={{ marginTop: "20px" }}
            tooltip={translateText(
              "Allocation categories with token amounts and percentage of supply."
            )}
          >
            <Title>{translateText("Token Distribution (Allocation)")}</Title>
          </TableTitleInfo>
          <TokenDistribution variant="main">
            <PieWrapper>
              {isDropstabTokenAllocationLoading ? (
                <TokenAllocationPieSkeleton width={260} height={260} />
              ) : (
                <PieAllocationsGraphic
                  innerRadius={80}
                  outerRadius={130}
                  width={260}
                  height={260}
                  items={tokenDistributionItems}
                  symbol={tokenDistributionSymbol}
                />
              )}
            </PieWrapper>
            <Overflow className="table">
              <Table>
                <TableHeader>
                  <div className="sticky">{translateText("Category")}</div>
                  <div>{translateText("Total")}</div>
                  <div>{translateText("Allocated %")}</div>
                </TableHeader>
                {isDropstabTokenAllocationLoading ? (
                  <TokenAllocationListSkeleton rows={5} />
                ) : (
                  tokenDistributionItems.map((item: any, index: number) => {
                    const amount = item.tokensAllocatedAmount ?? item.allocated;
                    const percent = item.tokensAllocatedPercent ?? item.value;

                    return (
                      <PieValuesPercentage
                        className="token-distribution"
                        key={index}
                        color={COLORS[index % COLORS.length]}
                        variant="div"
                      >
                        <div className="name sticky">
                          <i />
                          {item.name}
                        </div>
                        <div>{clarifyAmount(amount, false, "")}</div>
                        <div>
                          {percent || percent === 0
                            ? `${formatAllocationPercent(percent)}%`
                            : "-"}
                        </div>
                      </PieValuesPercentage>
                    );
                  })
                )}
              </Table>
            </Overflow>
          </TokenDistribution>
        </>
      ) : (
        null
      )}
      {shouldRenderSection("schedule") && unlockslist.length ? (
        <>
          <TableTitleInfo
            className="unlocks-section-title"
            style={{ marginTop: "20px" }}
            tooltip={translateText(
              "Vesting rounds with cliff, allocation, pending tokens, and next unlock date."
            )}
          >
            <Title>{translateText("Unlock Schedule")}</Title>
          </TableTitleInfo>
          <Schedule
            unlocks={unlockslist}
            project={project}
            tokenSymbol={tokenDistributionSymbol}
          />
        </>
      ) : (
        null
      )}
      {shouldRenderSection("timeline") && hasVestingTimeline ? (
        <>
          <TableTitleInfo
            className="unlocks-section-title"
            style={{ marginTop: "20px" }}
            tooltip={translateText(
              "Timeline view of unlock events and vesting periods over time."
            )}
          >
            <Title>{translateText("Vesting Timeline")}</Title>
          </TableTitleInfo>
          <DropstabVestingTimeline
            dropstabUnlocks={dropstabUnlocks}
            project={project}
          />
        </>
      ) : (
        null
      )}
      {shouldRenderSection("upcoming") && hasUpcomingTokenDistributionEvent ? (
        <>
          <TableTitleInfo
            className="unlocks-section-title"
            style={{ marginTop: "20px" }}
            tooltip={translateText(
              "Next scheduled token unlock with date, amount, and affected supply."
            )}
          >
            <Title>{translateText("Upcoming Token Distribution Event")}</Title>
          </TableTitleInfo>
          <UpcomingEvent
            nextUnlockingEvent={upcomingUnlockEvent}
            unlocks={unlockslist}
            project={project}
            tokenSymbol={tokenDistributionSymbol}
          />
        </>
      ) : (
        null
      )}
      {/* <Title style={{ marginTop: "20px" }}>Upcoming Unlocks</Title>
      <UpcomingUnlocks unlocks={unlockslist} /> */}
    </Wrapper>
  );
};

export default Unlocks;
