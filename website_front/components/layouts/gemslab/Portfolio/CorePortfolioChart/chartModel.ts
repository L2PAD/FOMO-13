export type PortfolioAxisMetric = "balance" | "profit" | "roi";

type SensitiveDomainOptions = {
  clampMinimumAtZero?: boolean;
  flatPadding: number;
  paddingRatio: number;
};

export const createPortfolioAxisFormatter = (
  values: number[],
  metric: PortfolioAxisMetric
): ((value: number) => string) => {
  const finiteValues = Array.from(
    new Set(values.filter(Number.isFinite).map((value) => Number(value)))
  );
  const minimum = finiteValues.length ? Math.min(...finiteValues) : 0;
  const maximum = finiteValues.length ? Math.max(...finiteValues) : 0;
  const absoluteMaximum = Math.max(Math.abs(minimum), Math.abs(maximum), 1);
  const relativeSpan = (maximum - minimum) / absoluteMaximum;
  const useCompactCurrency =
    metric !== "roi" && absoluteMaximum >= 1_000_000 && relativeSpan >= 0.01;
  const formatWithDigits = (value: number, fractionDigits: number): string => {
    const normalizedValue = Object.is(value, -0) ? 0 : value;

    if (metric === "roi") {
      return `${new Intl.NumberFormat("en-US", {
        maximumFractionDigits: fractionDigits,
      }).format(normalizedValue)}%`;
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: useCompactCurrency ? "compact" : "standard",
      maximumFractionDigits: fractionDigits,
    }).format(normalizedValue);
  };

  for (let fractionDigits = 2; fractionDigits <= 10; fractionDigits += 1) {
    const labels = finiteValues.map((value) =>
      formatWithDigits(value, fractionDigits)
    );

    if (new Set(labels).size === finiteValues.length) {
      return (value: number) => formatWithDigits(value, fractionDigits);
    }
  }

  return (value: number) => {
    const normalizedValue = Object.is(value, -0) ? 0 : value;

    if (metric === "roi") return `${normalizedValue.toExponential(8)}%`;
    return `${normalizedValue < 0 ? "-$" : "$"}${Math.abs(
      normalizedValue
    ).toExponential(8)}`;
  };
};

export const getReadableAuxiliaryValues = (
  primaryValues: number[],
  auxiliaryValues: number[],
  maximumSpanMultiplier = 4
): number[] => {
  const finitePrimaryValues = primaryValues.filter(Number.isFinite);
  const finiteAuxiliaryValues = auxiliaryValues.filter(Number.isFinite);

  if (!finitePrimaryValues.length || !finiteAuxiliaryValues.length) return [];

  const primaryMinimum = Math.min(...finitePrimaryValues);
  const primaryMaximum = Math.max(...finitePrimaryValues);
  const primarySpan = primaryMaximum - primaryMinimum;
  const combinedMinimum = Math.min(primaryMinimum, ...finiteAuxiliaryValues);
  const combinedMaximum = Math.max(primaryMaximum, ...finiteAuxiliaryValues);
  const combinedSpan = combinedMaximum - combinedMinimum;
  const reference = Math.max(
    Math.abs(primaryMinimum),
    Math.abs(primaryMaximum),
    1
  );
  const numericalFloor = reference * Number.EPSILON * 32;

  if (primarySpan > numericalFloor) {
    return combinedSpan <= primarySpan * Math.max(1, maximumSpanMultiplier)
      ? finiteAuxiliaryValues
      : [];
  }

  const flatSeriesAllowance = Math.max(reference * 0.01, 1);
  return combinedSpan <= flatSeriesAllowance ? finiteAuxiliaryValues : [];
};

export const buildSensitiveDomain = (
  values: number[],
  {
    clampMinimumAtZero = false,
    flatPadding,
    paddingRatio,
  }: SensitiveDomainOptions
): [number, number] => {
  const finiteValues = values.filter(Number.isFinite);

  if (!finiteValues.length) return [0, 1];

  const minimum = Math.min(...finiteValues);
  const maximum = Math.max(...finiteValues);
  const observedSpan = maximum - minimum;
  const reference = Math.max(Math.abs(minimum), Math.abs(maximum), 1);
  const numericalFloor = reference * Number.EPSILON * 32;
  const padding =
    observedSpan > 0
      ? Math.max(observedSpan * Math.max(0, paddingRatio), numericalFloor)
      : Math.max(flatPadding, numericalFloor);
  const domainMinimum = clampMinimumAtZero
    ? Math.max(0, minimum - padding)
    : minimum - padding;
  const domainMaximum = maximum + padding;

  if (
    Number.isFinite(domainMinimum) &&
    Number.isFinite(domainMaximum) &&
    domainMaximum > domainMinimum
  ) {
    return [domainMinimum, domainMaximum];
  }

  if (minimum > 0) return [0, minimum];
  if (maximum < 0) return [maximum, 0];
  return [0, 1];
};
