import React, { FC, useMemo } from "react";
import moment from "moment";
import {
  MetricsCard,
  MetricsCell,
  MetricsHeader,
  MetricsRow,
  MetricsTable,
} from "./styles";

interface IRoundVestingMetricsProps {
  dropstabUnlocks?: any;
  fallbackRows?: Array<any>;
}

interface IRoundVestingMetricRow {
  round: string;
  cliffPeriod: string;
  vestingPeriod: string;
  monthlyUnlock: string;
}

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
  return Math.max(0, Math.round(moment(end).diff(moment(start), "months", true)));
};

const formatMonths = (months: number): string => {
  if (!months) return "-";
  return `${months} ${months === 1 ? "month" : "months"}`;
};

const formatPercent = (value: number): string => {
  if (!Number.isFinite(value)) return "-";
  const fixed = value >= 10 ? value.toFixed(0) : value.toFixed(1);
  return fixed.replace(/\.0$/, "");
};

const isInstantUnlock = (round: any): boolean => {
  const tgeUnlockPercent = toNumber(round?.tgeUnlockPercent, 0);
  return (
    tgeUnlockPercent >= 99.5 ||
    String(round?.vestingType || "").toLowerCase() === "tge"
  );
};

const findTgeDate = (rounds: Array<any>): Date | null => {
  const tgeRound = rounds.find((round: any) => {
    return isInstantUnlock(round) || toNumber(round?.tgeUnlockPercent, 0) > 0;
  });
  const firstRound = rounds.find((round: any) => parseDate(round?.startDate));

  return parseDate(tgeRound?.startDate) || parseDate(firstRound?.startDate);
};

const buildDropstabRows = (dropstabUnlocks?: any): IRoundVestingMetricRow[] => {
  const sourceRounds = Array.isArray(dropstabUnlocks?.vestingTimeline)
    ? dropstabUnlocks.vestingTimeline
    : Array.isArray(dropstabUnlocks?.vestingSchedule)
      ? dropstabUnlocks.vestingSchedule
      : [];
  const tgeDate = findTgeDate(sourceRounds);

  return sourceRounds
    .map((round: any, index: number) => {
      const roundName = String(round?.roundName || `Round ${index + 1}`).trim();
      const startDate = parseDate(round?.startDate);
      const endDate = parseDate(round?.endDate);
      const tgeUnlockPercent = toNumber(round?.tgeUnlockPercent, 0);
      const instant = isInstantUnlock(round);
      const duration = toNumber(
        round?.vestingDurationMonths,
        monthDiff(startDate, endDate)
      );
      const hasCliff =
        Boolean(round?.hasCliff) ||
        String(round?.vestingType || "").toLowerCase().includes("cliff");
      const cliffMonths = instant
        ? 0
        : toNumber(round?.cliffDurationMonths, hasCliff ? monthDiff(tgeDate, startDate) : 0);
      const vestingPeriod = instant
        ? `${formatPercent(tgeUnlockPercent || 100)}% at TGE`
        : formatMonths(duration);
      const monthlyUnlock = instant
        ? "Instant unlock"
        : duration
          ? `${formatPercent((100 - tgeUnlockPercent) / duration)}% per month`
          : "-";

      return {
        round: roundName,
        cliffPeriod: formatMonths(cliffMonths),
        vestingPeriod,
        monthlyUnlock,
      };
    })
    .filter((row: IRoundVestingMetricRow) => Boolean(row.round));
};

const buildFallbackRows = (
  fallbackRows?: Array<any>
): IRoundVestingMetricRow[] => {
  return (fallbackRows || [])
    .map((row: any, index: number) => ({
      round: row?.stage || row?.round || row?.roundName || `Round ${index + 1}`,
      cliffPeriod: row?.seedRound || row?.cliffPeriod || "-",
      vestingPeriod: row?.privateSaleRound || row?.vestingPeriod || "-",
      monthlyUnlock: row?.publicSale || row?.monthlyUnlock || "-",
    }))
    .filter((row: IRoundVestingMetricRow) => Boolean(row.round));
};

const RoundVestingMetrics: FC<IRoundVestingMetricsProps> = ({
  dropstabUnlocks,
  fallbackRows,
}) => {
  const rows = useMemo(() => {
    const dropstabRows = buildDropstabRows(dropstabUnlocks);
    return dropstabRows.length ? dropstabRows : buildFallbackRows(fallbackRows);
  }, [dropstabUnlocks, fallbackRows]);

  if (!rows.length) return null;

  return (
    <MetricsCard variant="main">
      <MetricsTable>
        <MetricsHeader>
          <MetricsCell >Round</MetricsCell>
          <MetricsCell>Cliff Period</MetricsCell>
          <MetricsCell>Vesting Period</MetricsCell>
          <MetricsCell>Monthly Unlock %</MetricsCell>
        </MetricsHeader>
        {rows.map((row: IRoundVestingMetricRow, index: number) => (
          <MetricsRow key={`${row.round}-${index}`}>
            <MetricsCell $isRound>{row.round}</MetricsCell>
            <MetricsCell>{row.cliffPeriod}</MetricsCell>
            <MetricsCell>{row.vestingPeriod}</MetricsCell>
            <MetricsCell>{row.monthlyUnlock}</MetricsCell>
          </MetricsRow>
        ))}
      </MetricsTable>
    </MetricsCard>
  );
};

export default RoundVestingMetrics;
