export type ChartAxisMetric = "price" | "marketCap" | "totalBalance";

export type ChartAxisTick = {
  value: number;
  label: string;
  isCurrent: boolean;
};

export type ChartAxisModel = {
  domain: [number, number];
  ticks: ChartAxisTick[];
  gutterWidth: number;
};

type BuildChartAxisOptions = {
  values: number[];
  currentValue: number | null;
  metric: ChartAxisMetric;
  paddingRatio: number;
  chartWidth?: number;
  chartHeight?: number;
};

type TickCandidate = {
  value: number;
  isCurrent: boolean;
};

const DEFAULT_CHART_HEIGHT = 340;
const MIN_GUTTER_WIDTH = 78;
const MAX_GUTTER_WIDTH = 154;
const MOBILE_MIN_GUTTER_WIDTH = 46;
const MOBILE_MAX_GUTTER_WIDTH = 62;
const MOBILE_GUTTER_RATIO = 0.15;
const REGULAR_LABEL_HEIGHT = 16;
const CURRENT_LABEL_HEIGHT = 26;
const LABEL_GAP = 4;
const MAX_FIXED_FRACTION_DIGITS = 12;
const MAX_FIXED_LABEL_LENGTH = 18;

const formatMobilePrice = (value: number): string => {
  const normalized = Object.is(value, -0) ? 0 : value;
  const absolute = Math.abs(normalized);

  if (absolute === 0) return "$0";
  if (absolute >= 100000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(normalized);
  }
  if (absolute >= 1) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(normalized);
  }
  if (absolute >= 0.001) {
    return `${normalized < 0 ? "-$" : "$"}${absolute
      .toFixed(4)
      .replace(/0+$/, "")
      .replace(/\.$/, "")}`;
  }

  return formatScientificPrice(normalized, 3);
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isSameNumber = (left: number, right: number): boolean => {
  if (left === right) return true;

  const scale = Math.max(Math.abs(left), Math.abs(right));
  if (scale === 0) return false;

  return Math.abs(left - right) <= Number.EPSILON * scale * 8;
};

const clampFiniteResult = (value: number): number => {
  if (Number.isFinite(value)) return value;
  return value < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
};

const getFiniteSpan = (minValue: number, maxValue: number): number => {
  const span = maxValue - minValue;
  return Number.isFinite(span) ? Math.max(0, span) : Number.MAX_VALUE;
};

const multiplyWithClamp = (value: number, multiplier: number): number =>
  clampFiniteResult(value * multiplier);

const addWithClamp = (value: number, increment: number): number =>
  clampFiniteResult(value + increment);

const subtractWithClamp = (value: number, decrement: number): number =>
  clampFiniteResult(value - decrement);

const getResponsiveTickCount = (
  chartWidth: number,
  chartHeight: number
): number => {
  let tickCount = 5;

  if (chartHeight < 220) tickCount = 3;
  else if (chartHeight < 300) tickCount = 4;

  if (chartWidth > 0 && chartWidth < 280) tickCount = Math.min(tickCount, 3);
  else if (chartWidth > 0 && chartWidth < 420) {
    tickCount = Math.min(tickCount, 4);
  }

  return tickCount;
};

const getFlatSeriesPadding = (
  value: number,
  metric: ChartAxisMetric
): number => {
  const reference = Math.abs(value);

  if (reference === 0) return 1;
  if (metric === "price") return multiplyWithClamp(reference, 0.01);

  return Math.max(multiplyWithClamp(reference, 0.02), 1);
};

const buildDomain = (
  minValue: number,
  maxValue: number,
  metric: ChartAxisMetric,
  paddingRatio: number
): [number, number] => {
  const dataSpan = getFiniteSpan(minValue, maxValue);
  const reference = Math.max(Math.abs(minValue), Math.abs(maxValue));
  let padding: number;

  if (dataSpan > 0) {
    if (metric === "price") {
      // A varying price series is scaled from its observed spread. Using the
      // absolute price here makes low-volatility assets collapse into a small
      // strip around the middle of the chart.
      const numericFloor = multiplyWithClamp(reference, Number.EPSILON * 16);
      padding = Math.max(
        multiplyWithClamp(dataSpan, paddingRatio),
        numericFloor
      );
    } else {
      // Preserve the existing aggregate-metric behaviour. These values are
      // compact-formatted and can legitimately span millions or billions.
      padding = Math.max(
        multiplyWithClamp(dataSpan, paddingRatio),
        multiplyWithClamp(reference, 0.002),
        1
      );
    }
  } else {
    padding = getFlatSeriesPadding(minValue, metric);
  }

  const unclampedMin = subtractWithClamp(minValue, padding);
  const domainMin = minValue >= 0 ? Math.max(0, unclampedMin) : unclampedMin;
  const domainMax = addWithClamp(maxValue, padding);

  if (
    Number.isFinite(domainMin) &&
    Number.isFinite(domainMax) &&
    domainMax > domainMin
  ) {
    return [domainMin, domainMax];
  }

  if (minValue < maxValue) return [minValue, maxValue];
  if (minValue > 0) return [0, minValue];
  if (minValue < 0) return [minValue, 0];

  return [0, 1];
};

const buildNeutralTicks = (
  minValue: number,
  maxValue: number,
  tickCount: number
): number[] => {
  if (minValue === maxValue) return [minValue];

  const safeTickCount = Math.max(2, tickCount);

  return Array.from({ length: safeTickCount }, (_, index) => {
    if (index === 0) return minValue;
    if (index === safeTickCount - 1) return maxValue;

    const ratio = index / (safeTickCount - 1);
    const interpolatedValue = minValue * (1 - ratio) + maxValue * ratio;

    return Math.min(
      maxValue,
      Math.max(minValue, clampFiniteResult(interpolatedValue))
    );
  });
};

const mergeNumericDuplicates = (ticks: TickCandidate[]): TickCandidate[] => {
  const sortedTicks = [...ticks].sort(
    (left, right) => left.value - right.value
  );

  return sortedTicks.reduce<TickCandidate[]>((result, tick) => {
    const duplicateIndex = result.findIndex((item) =>
      isSameNumber(item.value, tick.value)
    );

    if (duplicateIndex < 0) {
      result.push(tick);
    } else if (tick.isCurrent) {
      result[duplicateIndex] = tick;
    }

    return result;
  }, []);
};

const removeCurrentLabelCollisions = (
  ticks: TickCandidate[],
  currentValue: number | null,
  domain: [number, number],
  chartHeight: number
): TickCandidate[] => {
  if (currentValue === null) return ticks;

  const domainSpan = domain[1] - domain[0];
  const normalizedScale = Math.max(Math.abs(domain[0]), Math.abs(domain[1]));
  const normalizedSpan =
    normalizedScale > 0
      ? domain[1] / normalizedScale - domain[0] / normalizedScale
      : 0;
  if (!(domainSpan > 0) && !(normalizedSpan > 0)) return ticks;

  const plotHeight = Math.max(1, chartHeight - 54);
  const minimumDistance =
    (REGULAR_LABEL_HEIGHT + CURRENT_LABEL_HEIGHT) / 2 + LABEL_GAP;

  return ticks.filter((tick) => {
    if (tick.isCurrent) return true;

    const directDistance = Math.abs(tick.value - currentValue);
    const distanceRatio =
      Number.isFinite(domainSpan) &&
      domainSpan > 0 &&
      Number.isFinite(directDistance)
        ? directDistance / domainSpan
        : Math.abs(
            tick.value / normalizedScale - currentValue / normalizedScale
          ) / normalizedSpan;
    const pixelDistance = distanceRatio * plotHeight;

    return pixelDistance >= minimumDistance;
  });
};

const getPriceFractionDigits = (step: number): number => {
  if (!(step > 0) || step >= 1) return 2;

  return Math.max(2, Math.ceil(-Math.log10(step) - 1e-10));
};

const formatFixedPrice = (value: number, fractionDigits: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Object.is(value, -0) ? 0 : value);

const formatScientificPrice = (
  value: number,
  significantDigits: number
): string => {
  const normalizedValue = Object.is(value, -0) ? 0 : value;
  const sign = normalizedValue < 0 ? "-$" : "$";

  return `${sign}${Math.abs(normalizedValue).toExponential(
    Math.max(1, significantDigits - 1)
  )}`;
};

const labelsAreUnique = (
  values: number[],
  formatter: (value: number) => string
): boolean => new Set(values.map(formatter)).size === values.length;

const labelsHaveReadableLength = (
  values: number[],
  formatter: (value: number) => string
): boolean =>
  values.every((value) => formatter(value).length <= MAX_FIXED_LABEL_LENGTH);

const getPriceFormatter = (
  values: number[],
  step: number
): ((value: number) => string) => {
  const initialFractionDigits = getPriceFractionDigits(step);

  if (initialFractionDigits <= MAX_FIXED_FRACTION_DIGITS) {
    for (
      let fractionDigits = initialFractionDigits;
      fractionDigits <= MAX_FIXED_FRACTION_DIGITS;
      fractionDigits += 1
    ) {
      const formatter = (value: number) =>
        formatFixedPrice(value, fractionDigits);

      if (
        labelsAreUnique(values, formatter) &&
        labelsHaveReadableLength(values, formatter)
      ) {
        return formatter;
      }
    }
  }

  const reference = Math.max(...values.map((value) => Math.abs(value)));
  const relativeStep = reference > 0 && step > 0 ? step / reference : 0;
  const initialSignificantDigits =
    relativeStep > 0
      ? Math.max(2, Math.ceil(-Math.log10(relativeStep)) + 1)
      : 2;

  for (
    let significantDigits = Math.min(initialSignificantDigits, 15);
    significantDigits <= 15;
    significantDigits += 1
  ) {
    const formatter = (value: number) =>
      formatScientificPrice(value, significantDigits);

    if (labelsAreUnique(values, formatter)) return formatter;
  }

  return (value: number) => formatScientificPrice(value, 15);
};

const getCompactFormatter = (values: number[]): ((value: number) => string) => {
  for (let fractionDigits = 2; fractionDigits <= 6; fractionDigits += 1) {
    const numberFormatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: fractionDigits,
    });
    const formatter = (value: number) => numberFormatter.format(value);

    if (
      labelsAreUnique(values, formatter) &&
      labelsHaveReadableLength(values, formatter)
    ) {
      return formatter;
    }
  }

  const fallbackFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 6,
  });

  const compactFallback = (value: number) => fallbackFormatter.format(value);

  if (
    labelsAreUnique(values, compactFallback) &&
    labelsHaveReadableLength(values, compactFallback)
  ) {
    return compactFallback;
  }

  for (
    let significantDigits = 3;
    significantDigits <= 15;
    significantDigits += 1
  ) {
    const scientificFormatter = (value: number) =>
      formatScientificPrice(value, significantDigits);

    if (
      labelsAreUnique(values, scientificFormatter) &&
      labelsHaveReadableLength(values, scientificFormatter)
    ) {
      return scientificFormatter;
    }
  }

  return (value: number) => formatScientificPrice(value, 15);
};

const removeFormattedDuplicates = (ticks: ChartAxisTick[]): ChartAxisTick[] => {
  const uniqueTicks = new Map<string, ChartAxisTick>();

  ticks.forEach((tick) => {
    const existingTick = uniqueTicks.get(tick.label);

    if (!existingTick || tick.isCurrent) uniqueTicks.set(tick.label, tick);
  });

  return Array.from(uniqueTicks.values()).sort(
    (left, right) => left.value - right.value
  );
};

const getGutterWidth = (labels: string[], chartWidth: number): number => {
  const isMobileChart = chartWidth > 0 && chartWidth < 520;
  const minimumWidth = isMobileChart
    ? MOBILE_MIN_GUTTER_WIDTH
    : MIN_GUTTER_WIDTH;
  const estimatedWidth = Math.max(
    minimumWidth,
    ...labels.map((label) => label.length * 7.2 + 32)
  );
  const responsiveMax =
    chartWidth > 0
      ? isMobileChart
        ? Math.max(
            MOBILE_MIN_GUTTER_WIDTH,
            Math.min(MOBILE_MAX_GUTTER_WIDTH, chartWidth * MOBILE_GUTTER_RATIO)
          )
        : Math.max(
            MIN_GUTTER_WIDTH,
            Math.min(MAX_GUTTER_WIDTH, chartWidth * 0.36)
          )
      : MAX_GUTTER_WIDTH;

  return Math.round(Math.min(estimatedWidth, responsiveMax));
};

export const buildChartAxis = ({
  values,
  currentValue,
  metric,
  paddingRatio,
  chartWidth = 0,
  chartHeight = DEFAULT_CHART_HEIGHT,
}: BuildChartAxisOptions): ChartAxisModel => {
  const finiteValues = values.filter(isFiniteNumber);

  if (finiteValues.length === 0) {
    return {
      domain: [0, 1],
      ticks: [],
      gutterWidth: MIN_GUTTER_WIDTH,
    };
  }

  const minValue = Math.min(...finiteValues);
  const maxValue = Math.max(...finiteValues);
  const safeCurrentValue = isFiniteNumber(currentValue) ? currentValue : null;
  const safeChartHeight =
    isFiniteNumber(chartHeight) && chartHeight > 0
      ? chartHeight
      : DEFAULT_CHART_HEIGHT;
  const safeChartWidth =
    isFiniteNumber(chartWidth) && chartWidth > 0 ? chartWidth : 0;
  const safePaddingRatio = isFiniteNumber(paddingRatio)
    ? Math.max(0, paddingRatio)
    : 0;
  const domain = buildDomain(minValue, maxValue, metric, safePaddingRatio);
  const neutralExtent: [number, number] =
    metric === "price" ? [minValue, maxValue] : domain;
  const neutralTicks = buildNeutralTicks(
    neutralExtent[0],
    neutralExtent[1],
    getResponsiveTickCount(safeChartWidth, safeChartHeight)
  );
  const candidates = mergeNumericDuplicates([
    ...neutralTicks.map((value) => ({ value, isCurrent: false })),
    ...(safeCurrentValue !== null &&
    safeCurrentValue >= minValue &&
    safeCurrentValue <= maxValue
      ? [{ value: safeCurrentValue, isCurrent: true }]
      : []),
  ]);
  const visibleCandidates = removeCurrentLabelCollisions(
    candidates,
    safeCurrentValue,
    domain,
    safeChartHeight
  );
  const tickValues = visibleCandidates.map((tick) => tick.value);
  const neutralStep =
    neutralTicks.length > 1
      ? getFiniteSpan(neutralTicks[0], neutralTicks[1])
      : getFiniteSpan(domain[0], domain[1]) / 4;
  const formatter =
    metric === "price"
      ? safeChartWidth > 0 && safeChartWidth < 520
        ? formatMobilePrice
        : getPriceFormatter(tickValues, neutralStep)
      : getCompactFormatter(tickValues);
  const ticks = removeFormattedDuplicates(
    visibleCandidates.map((tick) => ({
      ...tick,
      label: formatter(tick.value),
    }))
  );

  return {
    domain,
    ticks,
    gutterWidth: getGutterWidth(
      ticks.map((tick) => tick.label),
      safeChartWidth
    ),
  };
};
