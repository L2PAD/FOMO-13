import React, { FC, useMemo, useEffect, useState } from "react";
import Image from "next/image";
import infoIcon from "../../../../../../assets/icons/info-icon.svg";
import DescriptionComponent from "../../../../../global/common/DescriptionComponent";
import { format } from "date-fns";
import {
  Body,
  DescriptionWrapper,
  DynamicLine,
  Header,
  LeftColumn,
  Round,
  Schedule,
  IcoTimelineWrapper,
  IcoTimelineHeader,
  IcoTimelineRow,
  IcoTimelineTrack,
  IcoTimelineBar,
  IcoTimelineMarker,
  IcoLegend,
  Wrapper,
} from "./styles";
import moment from "moment";
import { IProject } from "../../../../../../types/global_types";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { resolveProjectTokenDisplaySymbol } from "../../../../../../helpers/projectTokenSymbol";

interface VestingItem {
  round: string;
  tge: number;
  items: {
    start: number;
    end: number;
    isTimeline: boolean;
    header: string;
    bottom: string;
    bgColor: string;
    borderColor: string;
    color?: string;
    value?: string;
    date?: Date;
    isFirst?: boolean;
    isLast?: boolean;
    allocationAmount?: number;
    allocationPercent?: number;
    cliffStart?: any;
  }[];
}

const COLORS = [
  { bg: "#B9F4E5", border: "#04A584" },
  { bg: "#FDE2E1", border: "#E8504E" },
  { bg: "#FFF4CC", border: "#F2B600" },
  { bg: "#E0E9FD", border: "#3B6DD9" },
  { bg: "#F1E0FD", border: "#A046E8" },
  { bg: "#E1FDF5", border: "#1AB89F" },
  { bg: "#FFE6D5", border: "#FF7A00" },
  { bg: "#E2F0CB", border: "#6DA544" },
  { bg: "#D9F0FF", border: "#0096C7" },
  { bg: "#FFD6E0", border: "#E9407A" },
];

const getRoundColor = (index: number) => COLORS[index % COLORS.length];

const ICO_COLORS = [
  { bg: "#EBF3FF", border: "#193081" },
  { bg: "#F9E8E9", border: "#BC322E" },
  { bg: "#F3F5EA", border: "#867C0D" },
  { bg: "#EAF8F2", border: "#04A584" },
  { bg: "#F3EAFB", border: "#860D73" },
  { bg: "#FFF0E5", border: "#FF7A00" },
];

const ICO_MONTH_WIDTH = 64;
const ICO_MIN_TIMELINE_WIDTH = 520;
const DROPSTAB_COLUMN_WIDTH = 210;

const toFiniteNumber = (value: any, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDateOrNull = (value: any): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

const parsePercent = (value: any): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;

  const parsed = Number(value.replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));

const formatDate = (date: Date | null): string => {
  if (!date || Number.isNaN(date.getTime())) return "-";

  return moment(date).format("MMM D, YYYY");
};

const parseDaysFromUnlockText = (value: any): number | null => {
  if (typeof value !== "string") return null;

  const match = value.match(/in\s+(\d+)\s+days?/i);
  if (!match) return null;

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const getMonthDiff = (startDate: Date, endDate: Date): number => {
  return (
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth())
  );
};

const getDatePosition = (date: Date, timelineStart: Date): number => {
  const monthIndex = getMonthDiff(timelineStart, date);
  const daysInMonth = moment(date).daysInMonth();
  const monthProgress = (date.getDate() - 1) / Math.max(daysInMonth, 1);

  return Math.max(0, (monthIndex + monthProgress) * ICO_MONTH_WIDTH);
};

const buildMonthAxis = (startDate: Date, endDate: Date) => {
  const timelineStart = moment(startDate).startOf("month").toDate();
  const timelineEnd = moment(endDate).endOf("month").toDate();
  const totalMonths = Math.max(1, getMonthDiff(timelineStart, timelineEnd) + 1);
  const showStep =
    totalMonths <= 18 ? 1 : totalMonths <= 36 ? 2 : totalMonths <= 72 ? 3 : 6;

  return Array.from({ length: totalMonths }, (_, index) => {
    const date = moment(timelineStart).add(index, "months").toDate();

    return {
      index,
      label: moment(date).format("MMM YYYY"),
      left: index * ICO_MONTH_WIDTH,
      isVisible:
        index === 0 ||
        index === totalMonths - 1 ||
        index % showStep === 0,
    };
  });
};

const getCompressedAxisPosition = (
  date: Date,
  timelineStart: Date,
  axis: any[]
): number => {
  if (!axis.length) return 0;
  const monthIndex = getMonthDiff(timelineStart, date);
  const daysInMonth = moment(date).daysInMonth();
  const monthProgress = (date.getDate() - 1) / Math.max(daysInMonth, 1);
  const value = monthIndex + monthProgress;
  const first = axis[0];
  const last = axis[axis.length - 1];

  if (value <= first.sourceIndex) return first.left;
  if (value >= last.sourceIndex) return last.left;

  for (let index = 0; index < axis.length - 1; index += 1) {
    const current = axis[index];
    const next = axis[index + 1];
    if (value >= current.sourceIndex && value <= next.sourceIndex) {
      const span = Math.max(1, next.sourceIndex - current.sourceIndex);
      const progress = (value - current.sourceIndex) / span;
      return current.left + (next.left - current.left) * progress;
    }
  }

  return last.left;
};

const findDropstabAllocationPercent = (round: any, dropstabUnlocks: any): number => {
  const roundName = String(round?.roundName || "").trim().toLowerCase();
  const saleId = round?.saleId;
  const pools = [
    ...(Array.isArray(dropstabUnlocks?.vestingRounds) ? dropstabUnlocks.vestingRounds : []),
    ...(Array.isArray(dropstabUnlocks?.tokenAllocation) ? dropstabUnlocks.tokenAllocation : []),
  ];
  const match = pools.find((item: any) => {
    if (saleId !== undefined && item?.saleId === saleId) return true;
    return String(item?.roundName || item?.name || "").trim().toLowerCase() === roundName;
  });

  return toFiniteNumber(match?.allocationPercent ?? match?.percent, 0);
};

const buildDropstabIcoVestingData = (dropstabUnlocks: any) => {
  const sourceRounds = Array.isArray(dropstabUnlocks?.vestingTimeline)
    ? dropstabUnlocks.vestingTimeline
    : [];
  const validRounds = sourceRounds
    .map((round: any, index: number) => ({
      ...round,
      id: `${round?.saleId || round?.roundName || "round"}-${index}`,
      start: parseDateOrNull(round?.startDate),
      end: parseDateOrNull(round?.endDate || round?.startDate),
    }))
    .filter((round: any) => round.start && round.end);
  const now = new Date();
  const allDates = validRounds.flatMap((round: any) => [round.start, round.end]);
  const tgeDate = allDates.length
    ? new Date(Math.min(...allDates.map((date: Date) => date.getTime())))
    : moment(now).subtract(12, "months").toDate();
  const endDate = allDates.length
    ? new Date(Math.max(...allDates.map((date: Date) => date.getTime()), now.getTime()))
    : moment(now).add(12, "months").toDate();
  const axis = buildMonthAxis(tgeDate, endDate);
  const timelineStart = axis.length ? moment(tgeDate).startOf("month").toDate() : tgeDate;
  const importantAxisIndexes = new Set<number>([0, 1, axis.length - 1]);
  validRounds.forEach((round: any) => {
    const startIndex = getMonthDiff(timelineStart, round.start as Date);
    const endIndex = getMonthDiff(timelineStart, round.end as Date);
    if (startIndex > 0) {
      importantAxisIndexes.add(startIndex);
      importantAxisIndexes.add(startIndex + 1);
    }
    if (endIndex >= 0) importantAxisIndexes.add(endIndex);
  });
  const visibleAxis = axis.map((item) => ({
    ...item,
    isVisible: importantAxisIndexes.has(item.index),
  }));
  const timelineWidth = Math.max(ICO_MIN_TIMELINE_WIDTH, axis.length * ICO_MONTH_WIDTH);
  const currentPosition = Math.max(0, Math.min(timelineWidth, getDatePosition(now, timelineStart)));
  const totalUnlockedPercent = toFiniteNumber(dropstabUnlocks?.vestingSummary?.unlockedPercent, 0);

  return {
    rounds: validRounds.map((round: any, index: number) => {
      const color = ICO_COLORS[index % ICO_COLORS.length];
      const start = round.start as Date;
      const end = round.end as Date;
      const tge = clampPercent(toFiniteNumber(round?.tgeUnlockPercent, 0));
      const vestedPercent = clampPercent(toFiniteNumber(round?.vestedPercent, tge));
      const allocationPercent = findDropstabAllocationPercent(round, dropstabUnlocks);
      const durationMonths = Math.max(1, toFiniteNumber(round?.vestingDurationMonths, getMonthDiff(start, end) + 1));
      const monthlyPercent = round?.vestingType === "tge" ? null : (100 - tge) / durationMonths;
      const left = Math.min(timelineWidth - 8, getDatePosition(start, timelineStart));
      const endLeft = Math.max(left + 18, Math.min(timelineWidth, getDatePosition(end, timelineStart) + ICO_MONTH_WIDTH));
      const width = round?.vestingType === "tge" ? Math.max(120, ICO_MONTH_WIDTH * 1.4) : Math.max(150, endLeft - left);
      const totalAmount = toFiniteNumber(round?.totalAmount, 0);
      const vestedAmount = toFiniteNumber(round?.vestedAmount, tge >= 99.5 ? totalAmount : 0);
      const isTge = round?.vestingType === "tge" || tge >= 99.5;
      const header = isTge
        ? "Vested at TGE - Instant unlock"
        : `Linear Vesting ${durationMonths} months${monthlyPercent ? ` ${monthlyPercent.toFixed(2)}% per month` : ""}`;

      return {
        id: round.id,
        roundName: round?.roundName || `Round ${index + 1}`,
        tge,
        unlockedPercent: vestedPercent,
        nextPercent: vestedPercent,
        left,
        width,
        nextLeft: null,
        hasCliff: Boolean(round?.hasCliff && !isTge),
        cliffLeft: left,
        unlockedAmountRaw: clarifyAmount(vestedAmount),
        totalAmountRaw: clarifyAmount(totalAmount),
        tokenSymbol: dropstabUnlocks?.project?.symbol || dropstabUnlocks?.project?.ticker || "",
        nextUnlock: null,
        color,
        header,
        bottom: `${allocationPercent ? `${allocationPercent}% allocation - ` : ""}${clarifyAmount(vestedAmount)} / ${clarifyAmount(totalAmount)}`,
      };
    }),
    axis: visibleAxis,
    tgeDate,
    timelineWidth,
    currentPosition,
    progress: {
      percent: totalUnlockedPercent,
      daysText: dropstabUnlocks?.lastSyncedAt
        ? `Dropstab synced ${moment(dropstabUnlocks.lastSyncedAt).format("ll")}`
        : "Dropstab vesting",
    },
  };
};

const buildIcoVestingData = (vesting: any) => {
  if (Array.isArray(vesting?.vestingTimeline) && vesting.vestingTimeline.length) {
    return buildDropstabIcoVestingData(vesting);
  }

  const rounds = Array.isArray(vesting?.rounds) ? vesting.rounds : [];
  const daysLeft = Number(vesting?.progress?.daysLeft || 0);
  const overallPercent = clampPercent(Number(vesting?.progress?.percent || 0));
  const now = new Date();
  const estimatedEndDate = daysLeft > 0
    ? moment(now).add(daysLeft, "days").toDate()
    : null;
  const estimatedStartDate =
    daysLeft > 0 && overallPercent > 0 && overallPercent < 100
      ? moment(now)
          .subtract(Math.round((daysLeft * overallPercent) / (100 - overallPercent)), "days")
          .toDate()
      : null;
  const tgeDate = estimatedStartDate || moment(now).subtract(12, "months").toDate();
  const endDate = estimatedEndDate || moment(now).add(12, "months").toDate();
  const monthAxis = buildMonthAxis(tgeDate, endDate);
  const timelineStart = monthAxis.length
    ? moment(tgeDate).startOf("month").toDate()
    : tgeDate;
  const timelineWidth = Math.max(
    ICO_MIN_TIMELINE_WIDTH,
    monthAxis.length * ICO_MONTH_WIDTH
  );
  const currentPosition = Math.min(
    timelineWidth,
    getDatePosition(now, timelineStart)
  );
  const endPosition = Math.max(currentPosition + ICO_MONTH_WIDTH, timelineWidth);

  return {
    rounds: rounds.map((round: any, index: number) => {
      const unlockedPercent = clampPercent(Number(round?.unlockedPercent || 0));
      const nextPercent = clampPercent(
        parsePercent(round?.progressWidths?.[1]) || unlockedPercent
      );
      const nextUnlockDays = parseDaysFromUnlockText(round?.nextUnlock);
      const nextUnlockDate =
        nextUnlockDays !== null ? moment(now).add(nextUnlockDays, "days").toDate() : null;
      const startDate =
        unlockedPercent <= 0 && nextUnlockDate ? nextUnlockDate : tgeDate;
      const finishDate =
        unlockedPercent >= 99.5 ? now : endDate;
      const left = Math.min(
        timelineWidth - 8,
        getDatePosition(startDate, timelineStart)
      );
      const width = Math.max(
        120,
        Math.min(endPosition - left, getDatePosition(finishDate, timelineStart) - left)
      );
      const nextLeft = nextUnlockDate
        ? Math.min(timelineWidth - 8, getDatePosition(nextUnlockDate, timelineStart))
        : null;
      const color = ICO_COLORS[index % ICO_COLORS.length];

      return {
        id: `${round?.roundName || "round"}-${index}`,
        roundName: round?.roundName || round?.name || `Round ${index + 1}`,
        tge: unlockedPercent >= 99.5 ? 100 : 0,
        unlockedPercent,
        nextPercent,
        left,
        width,
        nextLeft,
        hasCliff: unlockedPercent <= 0 && !!nextUnlockDate,
        unlockedAmountRaw: round?.unlockedAmountRaw,
        totalAmountRaw: round?.totalAmountRaw,
        tokenSymbol: round?.tokenSymbol,
        nextUnlock: round?.nextUnlock,
        color,
      };
    }),
    axis: monthAxis,
    tgeDate,
    timelineWidth,
    currentPosition,
    progress: vesting?.progress,
  };
};

const getMonthSkipStep = (totalMonths: number): number => {
  if (totalMonths <= 6) return 0; 
  if (totalMonths <= 12) return 1; 
  if (totalMonths <= 24) return 2;
  return 3; 
};

const getVisibleMonths = (
  chart: any[],
  totalMonths: number
): { index: number; date: string; isVisible: boolean }[] => {
  const skipStep = getMonthSkipStep(totalMonths);
  const result: { index: number; date: string; isVisible: boolean }[] = [];

  if (chart.length > 0) {
    result.push({
      index: 0,
      date: new Date(chart[0].date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      isVisible: true,
    });
  }

  for (let i = 1; i < chart.length; i++) {
    const shouldShow = skipStep === 0 || (i - 1) % (skipStep + 1) === 0; // сдвиг на 1, потому что первый месяц уже показан
    result.push({
      index: i,
      date: new Date(chart[i].date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      isVisible: shouldShow,
    });
  }

  return result;
};

const buildTimelineAxis = (chart: any[], totalMonths: number): string[] => {
  const visibleMonths = getVisibleMonths(chart, totalMonths);
  return visibleMonths
    .filter((month) => month.isVisible)
    .map((month) => month.date);
};

const transformIndexToVisiblePosition = (
  originalIndex: number,
  visibleMonths: { index: number; date: string; isVisible: boolean }[]
): number => {
  return (
    visibleMonths.filter(
      (month) => month.index <= originalIndex && month.isVisible
    ).length - 1
  );
};

const calculateVisibleWidth = (
  startIndex: number,
  endIndex: number,
  visibleMonths: { index: number; date: string; isVisible: boolean }[]
): number => {
  let visibleCount = 0;

  for (let i = startIndex; i < endIndex; i++) {
    const monthInfo = visibleMonths.find((month) => month.index === i);
    if (monthInfo && monthInfo.isVisible) {
      visibleCount++;
    }
  }

  return visibleCount;
};

const buildTimelineData = (unlock: any) => {
  const chart = unlock.chart || [];
  const allocations = unlock.allocations || [];
  const vestings = unlock.vesting || [];

  const totalMonths = chart.length;
  const visibleMonths = getVisibleMonths(chart, totalMonths);

  const allRounds: VestingItem[] = allocations.map(
    (allocation: any, idx: number) => {
      const roundName: string = allocation.name;
      const vesting: any = vestings.find(
        (item: any) => item.id === allocation.id
      );
      const tge = vesting?.tgePercent || 0;

      let prev = 0;
      const unlockPoints: Array<{
        date: Date;
        percent: number;
        index: number;
      }> = [];

      chart.forEach((point: any, i: number) => {
        const snap = point.roundSnapshots?.find(
          (r: any) => r.name === roundName
        );
        if (!snap) return;
        const delta = snap.unlockedPercent - prev;
        if (delta > 0) {
          unlockPoints.push({
            date: new Date(point.date),
            percent: delta,
            index: i,
          });
        }
        prev = snap.unlockedPercent;
      });

      if (unlockPoints.length === 0) {
        return { round: roundName, tge, items: [] };
      }

      const startPoint = unlockPoints[0];
      const endPoint = unlockPoints[unlockPoints.length - 1];

      const durationMonths =
        (endPoint.date.getFullYear() - startPoint.date.getFullYear()) * 12 +
        (endPoint.date.getMonth() - startPoint.date.getMonth()) +
        1;

      const { bg, border } = getRoundColor(idx);

      const items: VestingItem["items"] = [];

      const visibleStart = transformIndexToVisiblePosition(
        startPoint.index,
        visibleMonths
      );
      const visibleEnd =
        transformIndexToVisiblePosition(endPoint.index, visibleMonths) + 1;
      const visibleWidth = calculateVisibleWidth(
        startPoint.index,
        endPoint.index + 1,
        visibleMonths
      );

      items.push({
        start: visibleStart,
        end: visibleEnd,
        isTimeline: true,
        header:
          tge > 0 ? "Vested at TGE" : `${roundName} · ${durationMonths} Months`,
        bottom:
          tge > 0
            ? `100% - ${clarifyAmount(allocation.tokensAllocatedAmount)} ${unlock?.coinSymbol || ""}`
            : `${allocation.tokensAllocatedPercent}% - ${clarifyAmount(allocation.tokensAllocatedAmount)} ${unlock?.coinSymbol || ""}`,
        bgColor: bg,
        borderColor: border,
        date: startPoint.date,
        isFirst: tge > 0,
        isLast: true,
        allocationAmount: allocation.tokensAllocatedAmount,
        allocationPercent: allocation.tokensAllocatedPercent,
        cliffStart: tge > 0 ? 0 : 1,
      });

      return {
        round: roundName,
        tge,
        items,
        originalStart: startPoint.index,
        originalEnd: endPoint.index,
      };
    }
  );

  return {
    allRounds,
    headerDates: buildTimelineAxis(chart, totalMonths),
    tgeDate: new Date(chart[0]?.date),
    totalMonths,
    visibleMonths,
  };
};

const IcoVestingTimeline: FC<{ vesting: any; project: IProject | null }> = ({
  vesting,
  project,
}) => {
  const [isTgeInfoVisible, setIsTgeInfoVisible] = useState(false);
  const effectiveVesting = useMemo(
    () => ({
      ...vesting,
      project: vesting?.project || project,
    }),
    [vesting, project]
  );
  const { rounds, axis, progress, tgeDate, timelineWidth, currentPosition } = useMemo(
    () => buildIcoVestingData(effectiveVesting),
    [effectiveVesting]
  );
  const displaySymbol = resolveProjectTokenDisplaySymbol(project, vesting);

  if (!rounds.length) return null;

  return (
    <IcoTimelineWrapper variant="main">
      <IcoTimelineHeader style={{ minWidth: `${325 + timelineWidth}px` }}>
        <div className="round-cell">Round</div>
        <div className="tge-cell">
          <span>TGE Unlock</span>
          <button
            type="button"
            onMouseEnter={() => setIsTgeInfoVisible(true)}
            onMouseLeave={() => setIsTgeInfoVisible(false)}
          >
            <Image src={infoIcon} alt="info" />
          </button>
          <DescriptionWrapper>
            <DescriptionComponent
              isDate={false}
              isVisible={isTgeInfoVisible}
              date={new Date()}
              className="metrics"
              text={`TGE Date - ${formatDate(tgeDate)}`}
            />
          </DescriptionWrapper>
        </div>
        <div className="axis" style={{ width: `${timelineWidth}px` }}>
          {axis.filter((item) => item.isVisible).map((item) => (
            <div
              className="axis-item"
              key={item.index}
              style={{ left: `${item.left}px` }}
            >
              <span>{item.index + 1}. {item.label}</span>
            </div>
          ))}
        </div>
      </IcoTimelineHeader>

      <div>
        {rounds.map((round: any) => (
          <IcoTimelineRow
            key={round.id}
            style={{ minWidth: `${325 + timelineWidth}px` }}
          >
            <div className="round-name">
              <strong>{round.roundName}</strong>
              <span>
                {round.totalAmountRaw || "-"} {String(round.tokenSymbol || displaySymbol).trim().toUpperCase()}
              </span>
            </div>
            <div className="tge-value">{round.tge}%</div>
            <IcoTimelineTrack style={{ width: `${timelineWidth}px` }}>
              <div
                className="current-line"
                style={{ left: `${currentPosition}px` }}
              />
              {round.hasCliff && round.nextLeft !== null ? (
                <IcoTimelineMarker
                  className="cliff-marker"
                  style={{
                    left: `${Math.min(round.nextLeft, timelineWidth - 120)}px`,
                    color: round.color.border,
                  }}
                >
                  Cliff
                </IcoTimelineMarker>
              ) : round.hasCliff ? (
                <IcoTimelineMarker
                  className="cliff-marker"
                  style={{
                    left: `${Math.min(round.cliffLeft || round.left, timelineWidth - 120)}px`,
                    color: round.color.border,
                  }}
                >
                  Cliff
                </IcoTimelineMarker>
              ) : (
                <></>
              )}
              <IcoTimelineBar
                className="unlocked"
                style={{
                  left: `${round.left}px`,
                  width: `${round.width}px`,
                  background: round.color.bg,
                  borderLeftColor: round.color.border,
                }}
              >
                <strong>
                  {round.header ||
                    (round.unlockedPercent >= 99.5
                      ? "Vested at TGE - Instant unlock"
                      : `${round.unlockedPercent.toFixed(2)}% unlocked`)}
                </strong>
                <span>
                  {round.bottom || `${round.unlockedAmountRaw || "-"} / ${round.totalAmountRaw || "-"}`}
                </span>
              </IcoTimelineBar>
              {round.nextLeft !== null && !round.hasCliff ? (
                <IcoTimelineBar
                  className="next"
                  style={{
                    left: `${Math.min(round.nextLeft, timelineWidth - 8)}px`,
                    width: `${Math.max(12, Math.min(ICO_MONTH_WIDTH, timelineWidth - round.nextLeft))}px`,
                    borderLeftColor: round.color.border,
                  }}
                />
              ) : (
                <></>
              )}
              {round.nextUnlock ? (
                <IcoTimelineMarker
                  style={{
                    left: `${Math.min(round.nextLeft || round.left + round.width, timelineWidth - 170)}px`,
                    color: round.color.border,
                  }}
                >
                  Next
                  <span>{round.nextUnlock.replace(/^Next Unlock\s*/i, "")}</span>
                </IcoTimelineMarker>
              ) : (
                <></>
              )}
            </IcoTimelineTrack>
          </IcoTimelineRow>
        ))}
      </div>

      <IcoLegend>
        <div>
          <i className="unlocked" />
          <span>Unlocked</span>
        </div>
        <div>
          <i className="next" />
          <span>Next unlock window</span>
        </div>
        <div>
          <i className="locked" />
          <span>Locked</span>
        </div>
        <strong>
          Overall unlocked: {Number(progress?.percent || 0).toFixed(2)}%
          {progress?.daysText ? ` · ${progress.daysText}` : ""}
        </strong>
      </IcoLegend>
    </IcoTimelineWrapper>
  );
};

const VestingTimeline: FC<{ unlocks?: any[]; project: IProject | null; vesting?: any; dropstabUnlocks?: any }> = ({
  unlocks,
  project,
  vesting,
  dropstabUnlocks,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [data, setData] = useState<any[]>([]);
  const [headerData, setHeaderData] = useState<{
    tgeDate: Date | null;
    dates: string[];
    totalMonths: number;
    visibleMonths: { index: number; date: string; isVisible: boolean }[];
  }>({
    tgeDate: null,
    dates: [],
    totalMonths: 0,
    visibleMonths: [],
  });

  useEffect(() => {
    if (unlocks && unlocks.length > 0) {
      const { allRounds, headerDates, tgeDate, totalMonths, visibleMonths } =
        buildTimelineData(unlocks[0]);
      setData(
        allRounds.filter((item: any) => item?.items[0]?.allocationAmount > 0)
      );
      setHeaderData({
        tgeDate,
        dates: headerDates,
        totalMonths,
        visibleMonths,
      });
    }
  }, [unlocks]);
  const displaySymbol = resolveProjectTokenDisplaySymbol(project, dropstabUnlocks);

  if (dropstabUnlocks?.vestingTimeline?.length || vesting?.rounds?.length) {
    return (
      <IcoVestingTimeline
        vesting={dropstabUnlocks?.vestingTimeline?.length ? dropstabUnlocks : vesting}
        project={project}
      />
    );
  }

  const calculateItemPosition = (
    originalStart: number,
    originalEnd: number
  ): { left: number; width: number } => {
    const visibleMonths = headerData.visibleMonths;

    const visibleStartMonths = visibleMonths.filter(
      (month) => month.index < originalStart && month.isVisible
    );
    const left = visibleStartMonths.length * 210;

    const visibleWidthMonths = visibleMonths.filter(
      (month) =>
        month.index >= originalStart &&
        month.index < originalEnd &&
        month.isVisible
    );
    const width = visibleWidthMonths.length * 210;

    return { left, width: width || 200 };
  };

  return (
    <Wrapper variant="main">
      <Body>
        <Header>
          <div className="left">Round</div>
          <div className="right">
            <div className="unlock">
              <button
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
              >
                <span>TGE Unlock</span>
                <Image src={infoIcon} alt="info" />
              </button>
              <DescriptionWrapper>
                <DescriptionComponent
                  isDate={false}
                  isVisible={isVisible}
                  date={new Date()}
                  className="metrics"
                  text={`TGE Date - ${moment(headerData?.tgeDate).format("ll")}`}
                />
              </DescriptionWrapper>
            </div>
            <div className="dates">
              {headerData.dates.map((item: string, index: number) => (
                <div key={index} className="date">
                  {index + 1}. <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Header>
        <Schedule>
          {data.map(
            (
              item: VestingItem & {
                originalStart?: number;
                originalEnd?: number;
              },
              i: number
            ) => (
              <Round key={i}>
                <div className="name">
                  <span>{item.round}</span>
                  <br />
                  <span style={{ color: "var(--main-gray)", fontWeight: "var(--font-weight-regular)" }}>
                    {displaySymbol}{" "}
                    {clarifyAmount(item.items[0]?.allocationAmount || 0)}
                  </span>
                </div>
                <div className="tge">{item.tge}%</div>
                {item.tge === 0 && item.originalStart !== undefined && (
                  <div
                    style={{
                      left: `${calculateItemPosition(0, item.originalStart).left + 200}px`,
                      width: `${200}px`,
                      color: item?.items[0]?.borderColor,
                      fontWeight: "var(--font-weight-regular)",
                    }}
                    className="cliff"
                  >
                    Cliff
                  </div>
                )}
                <div className="items">
                  {item.items.map((subItem: any, idx: number) =>
                    subItem.isTimeline &&
                    item.originalStart !== undefined &&
                    item.originalEnd !== undefined ? (
                      <div
                        key={idx}
                        style={{
                          left: `${calculateItemPosition(item.originalStart, item.originalEnd + 1).left}px`,
                          width: `${calculateItemPosition(item.originalStart, item.originalEnd + 1).width}px`,
                        }}
                        className="timeline-wrapper"
                      >
                        <div
                          style={{ background: subItem.borderColor }}
                          className="timeline-border"
                        />
                        <div
                          style={{ background: subItem.bgColor }}
                          className="timeline-info"
                        >
                          <div>{subItem.header}</div>
                          <span>{subItem.bottom}</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={idx}
                        style={{
                          left: `${calculateItemPosition(item.originalStart || 0, item.originalEnd || 0).left}px`,
                          width: `${calculateItemPosition(item.originalStart || 0, item.originalEnd || 0).width}px`,
                        }}
                        className="timeline-wrapper"
                      >
                        <div
                          style={{ color: subItem.borderColor }}
                          className="cliff"
                        >
                          {subItem.value}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </Round>
            )
          )}
        </Schedule>
      </Body>
    </Wrapper>
  );
};

export default VestingTimeline;
