import { clarifyAmount } from "./clarifyAmount";

export const EMPTY_VALUE = "\u2014";

export const toNullableNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const firstFiniteNumber = (...values: any[]): number | null => {
  for (const value of values) {
    const parsed = toNullableNumber(value);
    if (parsed !== null) return parsed;
  }

  return null;
};

export const roundMetric = (value: number, decimals = 10): number => {
  const factor = 10 ** decimals;
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;

  return Object.is(rounded, -0) ? 0 : rounded;
};

const formatCompactNumber = (value: number, maxDecimals = 2): string => {
  const rounded = roundMetric(value, maxDecimals);

  return rounded.toLocaleString("en-US", {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: 0,
  });
};

export const roiMultiplierToPercent = (
  multiplier: number | null | undefined
): number | null => {
  const value = toNullableNumber(multiplier);
  if (value === null) return null;

  return roundMetric((value - 1) * 100);
};

export const roiPercentToMultiplier = (
  percent: number | null | undefined
): number | null => {
  const value = toNullableNumber(percent);
  if (value === null) return null;

  return roundMetric(1 + value / 100);
};

export const formatRoiX = (value: number | null | undefined): string => {
  const parsed = toNullableNumber(value);
  if (parsed === null) return EMPTY_VALUE;

  return `${formatCompactNumber(parsed)}x`;
};

export const formatRoiPercent = (
  value: number | null | undefined,
  signed = true
): string => {
  const parsed = toNullableNumber(value);
  if (parsed === null) return EMPTY_VALUE;

  const prefix = signed && parsed > 0 ? "+" : "";

  return `${prefix}${formatCompactNumber(parsed)}%`;
};

export const formatMoney = (value: number | null | undefined): string => {
  const parsed = toNullableNumber(value);
  if (parsed === null) return EMPTY_VALUE;

  return `$${clarifyAmount(parsed)}`;
};

export const resolveProjectRoiX = (project: any): number | null => {
  const explicitMultiplier = firstFiniteNumber(
    project?.roiX,
    project?.currentRoiXFromIco,
    project?.roiData?.roiX,
    project?.roiData?.roiMultiplier,
    project?.xfromIco?.USD,
    project?.rawIcoData?.marketData?.xfromIco?.USD,
    project?.roiData?.roi,
    project?.rawIcoData?.marketData?.roi
  );

  if (explicitMultiplier !== null) return explicitMultiplier;

  return roiPercentToMultiplier(resolveProjectRoiPercent(project));
};

export const resolveProjectRoiPercent = (project: any): number | null => {
  const explicitPercent = firstFiniteNumber(
    project?.roiPercent,
    project?.currentRoiFromIco,
    project?.roiData?.roiPercent,
    project?.roiData?.percent,
    project?.roiData?.USD,
    project?.roiData?.usd,
    project?.rawIcoData?.marketData?.raw?.dropstabStats?.returns?.usd
  );

  if (explicitPercent !== null) return explicitPercent;

  const multiplier = firstFiniteNumber(
    project?.roiX,
    project?.currentRoiXFromIco,
    project?.roiData?.roiX,
    project?.roiData?.roiMultiplier,
    project?.xfromIco?.USD,
    project?.rawIcoData?.marketData?.xfromIco?.USD,
    project?.roiData?.roi,
    project?.rawIcoData?.marketData?.roi
  );

  return roiMultiplierToPercent(multiplier);
};
