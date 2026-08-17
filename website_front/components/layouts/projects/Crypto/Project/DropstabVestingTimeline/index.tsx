import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import moment from "moment";
import infoIcon from "../../../../../../assets/icons/info-icon.svg";
import { IProject } from "../../../../../../types/global_types";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { resolveProjectTokenDisplaySymbol } from "../../../../../../helpers/projectTokenSymbol";
import {
  Axis,
  AxisLabel,
  BandProgressFill,
  CliffMarker,
  CurrentLine,
  HeaderCell,
  RoundCell,
  TgeCell,
  TgeHeaderCell,
  TgeTooltip,
  TimelineCard,
  TimelineContent,
  TimelineHeader,
  TimelineRow,
  TimelineViewport,
  Track,
  VestingBand,
} from "./styles";

const DEFAULT_COLUMN_WIDTH = 132;
const FIXED_COLUMNS_WIDTH = 290;
const MOBILE_FIXED_COLUMNS_WIDTH = 194;
const MIN_GRID_WIDTH = 520;
const RIGHT_PADDING = 220;
const MAX_AXIS_LABELS = 10;
const AXIS_INTERVALS = [1, 2, 3, 6, 12, 18, 24, 36, 60];

const COLORS = [
  { bg: "#f3f5ea", border: "#867c0d", marker: "#867c0d" },
  { bg: "#f9e8e9", border: "#bc322e", marker: "#bc322e" },
  { bg: "#ebf3ff", border: "#193081", marker: "#193081" },
  { bg: "#eaf8f2", border: "#04a584", marker: "#04a584" },
  { bg: "#f3eafb", border: "#860d73", marker: "#860d73" },
  { bg: "#fff0e5", border: "#ff7a00", marker: "#ff7a00" },
];

const toNumber = (value: any, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDate = (value: any): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

const monthIndexFrom = (base: Date, date: Date): number => {
  return (
    (date.getFullYear() - base.getFullYear()) * 12 +
    (date.getMonth() - base.getMonth())
  );
};

const findBySaleOrName = (items: any[], round: any): any => {
  const roundName = String(round?.roundName || "").trim().toLowerCase();
  return items.find((item) => {
    if (round?.saleId !== undefined && item?.saleId === round.saleId) return true;
    return String(item?.roundName || item?.name || "").trim().toLowerCase() === roundName;
  });
};

const formatPercent = (value: any): string => {
  const percent = toNumber(value, 0);
  if (!percent) return "0%";
  if (Math.abs(percent - Math.round(percent)) < 0.01) return `${Math.round(percent)}%`;
  if (Math.abs(percent) < 0.01) return `${percent.toFixed(4).replace(/\.?0+$/, "")}%`;
  return `${percent.toFixed(2)}%`;
};

const compactAmount = (value: any): string => String(clarifyAmount(toNumber(value, 0), false, ""));

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

const firstFiniteNumber = (...values: any[]): number | null => {
  const finiteValue = values.find((value) => {
    if (value === undefined || value === null || value === "") return false;
    return Number.isFinite(Number(value));
  });

  return finiteValue !== undefined ? Number(finiteValue) : null;
};

const firstPositiveNumber = (...values: any[]): number | null => {
  const positiveValue = values.find((value) => toNumber(value, 0) > 0);

  return positiveValue !== undefined ? toNumber(positiveValue, 0) : null;
};

const resolveUnlockedPercent = (
  round: any,
  totalAmount: number,
  vestedAmount: number | null,
  endDate: Date | null
): number => {
  const explicitPercent = firstFiniteNumber(
    round?.unlockedPercent,
    round?.vestedPercent,
    round?.currentUnlockedPercentSource
  );
  const lockedPercent = firstFiniteNumber(
    round?.lockedPercent,
    round?.currentLockedPercentSource
  );

  if (explicitPercent !== null) return clampPercent(explicitPercent);
  if (lockedPercent !== null) return clampPercent(100 - lockedPercent);
  if (totalAmount > 0 && vestedAmount !== null)
    return clampPercent((vestedAmount / totalAmount) * 100);
  if (endDate && Date.now() >= endDate.getTime()) return 100;

  return 0;
};

const buildData = (
  dropstabUnlocks: any,
  project: IProject | null,
  availableGridWidth = 0
) => {
  const sourceRounds = Array.isArray(dropstabUnlocks?.vestingTimeline)
    ? dropstabUnlocks.vestingTimeline
    : [];
  const allocationPool = [
    ...(Array.isArray(dropstabUnlocks?.vestingRounds) ? dropstabUnlocks.vestingRounds : []),
    ...(Array.isArray(dropstabUnlocks?.tokenAllocation) ? dropstabUnlocks.tokenAllocation : []),
  ];
  const rounds = sourceRounds
    .map((round: any, index: number) => {
      const startDate = parseDate(round?.startDate);
      const endDate = parseDate(round?.endDate || round?.startDate);
      const allocation = findBySaleOrName(allocationPool, round);
      const totalAmount = firstPositiveNumber(
        round?.totalAmount,
        round?.amount,
        round?.tokensAllocatedAmount,
        allocation?.totalAmount,
        allocation?.amount,
        allocation?.tokensAllocatedAmount
      ) || 0;
      const vestedAmount = firstFiniteNumber(
        round?.vestedAmount,
        round?.unlockedAmount
      );
      const unlockedPercent = resolveUnlockedPercent(
        round,
        totalAmount,
        vestedAmount,
        endDate
      );

      return {
        ...round,
        id: `${round?.saleId || round?.roundName || "round"}-${index}`,
        startDate,
        endDate,
        totalAmount,
        unlockedPercent,
        vestedAmount: vestedAmount || 0,
      };
    })
    .filter((round: any) => round.startDate && round.endDate);
  const allDates = rounds.flatMap((round: any) => [round.startDate, round.endDate]);
  const baseMonth = allDates.length
    ? moment(new Date(Math.min(...allDates.map((date: Date) => date.getTime())))).startOf("month").toDate()
    : moment().startOf("month").toDate();
  const lastMonth = allDates.length
    ? moment(new Date(Math.max(...allDates.map((date: Date) => date.getTime())))).startOf("month").toDate()
    : moment(baseMonth).add(1, "month").toDate();
  const monthCount = Math.max(2, monthIndexFrom(baseMonth, lastMonth) + 1);
  const interval =
    AXIS_INTERVALS.find(
      (candidate) =>
        Math.ceil((monthCount - 1) / candidate) + 1 <= MAX_AXIS_LABELS
    ) || Math.max(1, Math.ceil((monthCount - 1) / (MAX_AXIS_LABELS - 1)));
  const axisSourceIndexes = Array.from(
    { length: Math.floor((monthCount - 1) / interval) + 1 },
    (_, index) => index * interval
  );

  if (axisSourceIndexes[axisSourceIndexes.length - 1] !== monthCount - 1) {
    axisSourceIndexes.push(monthCount - 1);
  }

  const sortedAxis = axisSourceIndexes.map((sourceIndex) => ({
    date: moment(baseMonth).add(sourceIndex, "month").toDate(),
    sourceIndex,
  }));
  const baseGridWidth = Math.max(
    MIN_GRID_WIDTH,
    Math.max(0, sortedAxis.length - 1) * DEFAULT_COLUMN_WIDTH + RIGHT_PADDING
  );
  const gridWidth = Math.max(baseGridWidth, availableGridWidth);
  const timelineStart = baseMonth.getTime();
  const timelineEnd = Math.max(
    timelineStart + 1,
    ...allDates.map((date: Date) => date.getTime())
  );
  const plotWidth = gridWidth - RIGHT_PADDING;

  const positionForDate = (date: Date): number => {
    const progress =
      (date.getTime() - timelineStart) / (timelineEnd - timelineStart);

    return Math.min(plotWidth, Math.max(0, progress * plotWidth));
  };
  const axis = sortedAxis
    .map((item, index) => ({
      ...item,
      index,
      left: positionForDate(item.date),
      label: `${item.sourceIndex + 1}. ${moment(item.date).format("MMM YYYY")}`,
    }));

  const now = new Date();
  const showCurrentLine =
    now.getTime() >= timelineStart && now.getTime() <= timelineEnd;
  const currentLeft = showCurrentLine ? positionForDate(now) : null;
  const tokenSymbol = resolveProjectTokenDisplaySymbol(project, dropstabUnlocks).toUpperCase();
  const mappedRows = rounds.map((round: any, index: number) => {
    const color = COLORS[index % COLORS.length];
    const vestingType = String(round?.vestingType || "").toLowerCase();
    const tgeUnlockPercent = toNumber(round?.tgeUnlockPercent, 0);
    const isTge = vestingType === "tge" || tgeUnlockPercent >= 99.5;
    const duration = Math.max(1, toNumber(round?.vestingDurationMonths, monthIndexFrom(round.startDate, round.endDate) + 1));
    const monthlyPercent = isTge ? 0 : (100 - tgeUnlockPercent) / duration;
    const startLeft = positionForDate(round.startDate);
    const barStartLeft = startLeft;
    const endLeft = positionForDate(round.endDate);
    const barLeft = isTge ? startLeft : barStartLeft + 2;
    const hasCliffPeriod =
      !isTge &&
      (Boolean(round?.hasCliff) ||
        vestingType.includes("cliff") ||
        (tgeUnlockPercent <= 0 && startLeft > 0));
    const cliffStartLeft = 0;
    const cliffWidth = hasCliffPeriod ? Math.max(0, barLeft - cliffStartLeft) : 0;
    const isComplete = now.getTime() >= (round.endDate as Date).getTime();
    const barWidth = isTge
      ? Math.min(280, Math.max(240, DEFAULT_COLUMN_WIDTH * 2.2))
      : Math.max(112, endLeft - barStartLeft);
    const header = isTge
      ? "Vested at TGE - Instant unlock"
      : `Linear Vesting ${duration} months ${monthlyPercent.toFixed(2)}% per month`;
    const amountLine = `${formatPercent(round.unlockedPercent)} - ${tokenSymbol} ${compactAmount(round.vestedAmount)} / ${compactAmount(round.totalAmount)}`;

    return {
      id: round.id,
      roundName: round?.roundName || `Round ${index + 1}`,
      tge: formatPercent(round?.tgeUnlockPercent),
      hasCliff: cliffWidth >= 48,
      cliffLeft: cliffStartLeft + cliffWidth / 2,
      barLeft,
      barWidth: Math.min(barWidth, gridWidth - barLeft),
      isComplete,
      header,
      amountLine,
      color,
    };
  });
  return {
    axis,
    gridWidth,
    currentLeft,
    tgeDate: baseMonth,
    rows: mappedRows,
  };
};

const DropstabVestingTimeline: FC<{ dropstabUnlocks: any; project: IProject | null }> = ({
  dropstabUnlocks,
  project,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [availableGridWidth, setAvailableGridWidth] = useState(0);
  const data = useMemo(
    () => buildData(dropstabUnlocks, project, availableGridWidth),
    [dropstabUnlocks, project, availableGridWidth]
  );

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;

    const updateAvailableWidth = () => {
      const fixedColumnsWidth =
        element.clientWidth <= 575
          ? MOBILE_FIXED_COLUMNS_WIDTH
          : FIXED_COLUMNS_WIDTH;

      setAvailableGridWidth(
        Math.max(0, Math.floor(element.clientWidth - fixedColumnsWidth))
      );
    };

    updateAvailableWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateAvailableWidth);
      return () => window.removeEventListener("resize", updateAvailableWidth);
    }

    const observer = new ResizeObserver(updateAvailableWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  if (!data.rows.length) return null;

  return (
    <TimelineCard variant="main">
      <TimelineViewport ref={viewportRef}>
        <TimelineContent>
        <TimelineHeader $gridWidth={data.gridWidth}>
          <HeaderCell>Round</HeaderCell>
          <TgeHeaderCell>
            <span>TGE Unlock</span>
            <button
              type="button"
              onMouseEnter={() => setIsTooltipVisible(true)}
              onMouseLeave={() => setIsTooltipVisible(false)}
            >
              <Image src={infoIcon} alt="info" />
            </button>
            {isTooltipVisible ? (
              <TgeTooltip>TGE Date - {moment(data.tgeDate).format("MMM DD, YYYY")}</TgeTooltip>
            ) : (
              null
            )}
          </TgeHeaderCell>
          <Axis>
            {data.axis.map((item) => (
              <AxisLabel
                key={item.label}
                $lane={item.index % 2}
                style={{ left: `${item.left}px` }}
              >
                {item.label}
              </AxisLabel>
            ))}
          </Axis>
        </TimelineHeader>

        {data.rows.map((row: any, index: number) => {
          const rawProgressWidth =
            data.currentLeft === null
              ? 0
              : Math.max(
                  0,
                  Math.min(row.barWidth, data.currentLeft - row.barLeft)
                );
          const progressWidth = row.isComplete ? row.barWidth : rawProgressWidth;
          return (
          <TimelineRow key={row.id} $gridWidth={data.gridWidth}>
            <RoundCell>{row.roundName}</RoundCell>
            <TgeCell>{row.tge}</TgeCell>
            <Track>
              {data.currentLeft !== null ? (
                <CurrentLine
                  $showDot={index === 0}
                  style={{ left: `${data.currentLeft}px` }}
                />
              ) : (
                null
              )}
              {row.hasCliff ? (
                <CliffMarker color={row.color.marker} style={{ left: `${row.cliffLeft}px` }}>
                  Cliff
                </CliffMarker>
              ) : (
                null
              )}
              <VestingBand
                bg={row.color.bg}
                border={row.color.border}
                $isComplete
                style={{
                  left: `${row.barLeft}px`,
                  width: `${row.barWidth}px`,
                }}
              >
                {progressWidth > 0 ? (
                  <BandProgressFill
                    color={row.color.border}
                    style={{ width: `${progressWidth}px` }}
                  />
                ) : (
                  null
                )}
                <strong>{row.header}</strong>
                <span>{row.amountLine}</span>
              </VestingBand>
            </Track>
          </TimelineRow>
          );
        })}
        </TimelineContent>
      </TimelineViewport>
    </TimelineCard>
  );
};

export default DropstabVestingTimeline;
