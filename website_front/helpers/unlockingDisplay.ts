type UnlockEventCandidate = {
  allocation: string;
  dateValue: string | Date | null;
  detailCount: number | null;
  isUpcoming: boolean;
  logo: string;
  marketCap: number | null;
  name: string;
  priceChange24h: number | null;
  priceUsd: number | null;
  raw: any;
  score: number;
  symbol: string;
  timestamp: number | null;
  tokensPercent: number | null;
  unlockType: string;
};

const GENERIC_STAGE_VALUES = new Set([
  "",
  "-",
  "mixed",
  "multiple",
  "multiple allocations",
  "token unlock",
  "unknown",
  "various",
]);

const PUBLIC_VESTING_STAGE_VALUES = new Set([
  "public",
  "public sale",
  "ido",
  "ieo",
  "launchpad",
]);

const normalizeLabel = (value: unknown): string => {
  return typeof value === "string" ? value.trim() : "";
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalizedValue = Number(value.replace(/[^0-9.-]/g, ""));

    return Number.isFinite(normalizedValue) ? normalizedValue : null;
  }

  return null;
};

const toPositiveNumber = (value: unknown): number | null => {
  const parsedValue = toNumber(value);

  return parsedValue !== null && parsedValue > 0 ? parsedValue : null;
};

const toDateValue = (value: unknown): string | Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const timestamp = value > 1_000_000_000_000 ? value : value * 1000;
    const parsedDate = new Date(timestamp);

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (!trimmedValue) return null;

    const numericValue = Number(trimmedValue);

    if (Number.isFinite(numericValue)) {
      const timestamp = numericValue > 1_000_000_000_000 ? numericValue : numericValue * 1000;
      const parsedDate = new Date(timestamp);

      return Number.isNaN(parsedDate.getTime()) ? trimmedValue : parsedDate;
    }

    return trimmedValue;
  }

  return null;
};

const toTimestamp = (value: unknown): number | null => {
  const dateValue = toDateValue(value);

  if (!dateValue) return null;

  if (dateValue instanceof Date) {
    return Number.isNaN(dateValue.getTime()) ? null : dateValue.getTime();
  }

  const parsedDate = new Date(dateValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.getTime();
};

const formatLabel = (value: string): string => {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const getStageString = (value: unknown): string | null => {
  if (Array.isArray(value)) return null;
  if (typeof value !== "string") return null;

  const normalizedValue = value.trim();

  if (!normalizedValue) return null;
  if (normalizedValue.includes(",")) return null;
  if (GENERIC_STAGE_VALUES.has(normalizedValue.toLowerCase())) return null;

  return normalizedValue;
};

const getProjectIdentityValues = (item: any): Set<string> => {
  const values = [
    item?.name,
    item?.project_name,
    item?.detailed?.name,
    item?.coinSlug,
    item?.coin_slug,
    item?.project_slug,
    item?.coinSymbol,
    item?.coinSymbol,
    item?.symbol,
    item?.project_name,
  ]
    .map((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
    .filter(Boolean);

  return new Set(values);
};

const getStageFromUnlock = (
  unlock: any,
  projectIdentityValues?: Set<string>
): string | null => {
  if (!unlock || Array.isArray(unlock)) return null;

  const nameValue = getStageString(unlock?.name);

  if (nameValue && projectIdentityValues?.has(nameValue.toLowerCase())) {
    return (
      getStageString(unlock?.roundName) ||
      getStageString(unlock?.round_name) ||
      getStageString(unlock?.allocationName) ||
      getStageString(unlock?.allocation_name) ||
      getStageString(unlock?.category) ||
      getStageString(unlock?.investorType) ||
      getStageString(unlock?.investor_type) ||
      null
    );
  }

  return (
    getStageString(unlock?.roundName) ||
    getStageString(unlock?.round_name) ||
    getStageString(unlock?.allocationName) ||
    getStageString(unlock?.allocation_name) ||
    getStageString(unlock?.category) ||
    getStageString(unlock?.investorType) ||
    getStageString(unlock?.investor_type) ||
    getStageString(unlock?.name) ||
    null
  );
};

const getDisplayString = (value: unknown): string | null => {
  if (Array.isArray(value) || value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) return null;
  if (normalizedValue.includes(",")) return null;
  if (GENERIC_STAGE_VALUES.has(normalizedValue.toLowerCase())) return null;

  return normalizedValue;
};

const isPublicVestingStage = (item: any): boolean => {
  const stageValue = String(
    item?.stage || item?.round || item?.category || item?.name || ""
  )
    .toLowerCase()
    .trim();

  return PUBLIC_VESTING_STAGE_VALUES.has(stageValue);
};

const getUsdQuote = (event: any): any => {
  if (event?.quote_usd) return event.quote_usd;

  if (Array.isArray(event?.quotes)) {
    return event.quotes.find(
      (quote: any) => normalizeLabel(quote?.name).toUpperCase() === "USD"
    );
  }

  return null;
};

const getEventDetailCount = (event: any): number | null => {
  return (
    toPositiveNumber(event?.detailCount) ||
    toPositiveNumber(event?.detail_count) ||
    (Array.isArray(event?.next_unlocked_detail) && event.next_unlocked_detail.length
      ? event.next_unlocked_detail.length
      : null) ||
    (Array.isArray(event?.nextUnlockedDetail) && event.nextUnlockedDetail.length
      ? event.nextUnlockedDetail.length
      : null)
  );
};

const getEventScore = (event: UnlockEventCandidate): number => {
  let score = 0;

  if (event.priceUsd !== null) score += 2;
  if (event.priceChange24h !== null) score += 2;
  if (event.marketCap !== null) score += 1;
  if (event.detailCount !== null) score += 1;
  if (event.tokensPercent !== null) score += 1;
  if (event.unlockType) score += 1;
  if (event.allocation && !GENERIC_STAGE_VALUES.has(event.allocation.toLowerCase())) {
    score += 2;
  } else if (event.allocation) {
    score += 1;
  }

  return score;
};

const createUnlockEventCandidate = (event: any): UnlockEventCandidate | null => {
  if (!event) return null;

  const quoteUsd = getUsdQuote(event);
  const allocation = normalizeLabel(event?.allocation || event?.allocation_type);
  const unlockType = normalizeLabel(event?.unlockType || event?.unlock_type);
  const timestamp =
    toTimestamp(event?.unlockDate) ||
    toTimestamp(event?.unlock_date) ||
    toTimestamp(event?.date) ||
    toTimestamp(event?.next_unlocked?.date) ||
    toTimestamp(event?.nextUnlocked?.date);
  const dateValue =
    toDateValue(event?.unlockDate) ||
    toDateValue(event?.unlock_date) ||
    toDateValue(event?.date) ||
    toDateValue(event?.next_unlocked?.date) ||
    toDateValue(event?.nextUnlocked?.date);
  const candidate: UnlockEventCandidate = {
    allocation,
    dateValue,
    detailCount: getEventDetailCount(event),
    isUpcoming:
      typeof event?.isUpcoming === "boolean"
        ? event.isUpcoming
        : timestamp !== null
          ? timestamp >= Date.now()
          : false,
    logo: normalizeLabel(event?.logo || event?.image || event?.icon),
    marketCap:
      toPositiveNumber(event?.marketCapUsd) ||
      toPositiveNumber(event?.marketCap) ||
      toPositiveNumber(event?.market_cap) ||
      toPositiveNumber(quoteUsd?.marketCap) ||
      toPositiveNumber(quoteUsd?.selfReportedMarketCap),
    name: normalizeLabel(event?.name || event?.project_name),
    priceChange24h:
      toNumber(event?.priceChange24h) ||
      toNumber(event?.percentChange24h) ||
      toNumber(event?.percent_change_24h) ||
      toNumber(quoteUsd?.percentChange24h) ||
      toNumber(quoteUsd?.percent_change_24h),
    priceUsd:
      toPositiveNumber(event?.priceUsd) ||
      toPositiveNumber(event?.price) ||
      toPositiveNumber(event?.currentPrice) ||
      toPositiveNumber(quoteUsd?.price),
    raw: event,
    score: 0,
    symbol: normalizeLabel(event?.symbol || event?.coinSymbol),
    timestamp,
    tokensPercent:
      toPositiveNumber(event?.tokensPercent) ||
      toPositiveNumber(event?.percentOfSupply) ||
      toPositiveNumber(event?.tokens_percent) ||
      toPositiveNumber(event?.unlock_percent) ||
      toPositiveNumber(event?.unlock_pct),
    unlockType,
  };

  candidate.score = getEventScore(candidate);

  return candidate;
};

const dedupeUnlockEvents = (events: UnlockEventCandidate[]): UnlockEventCandidate[] => {
  const dedupedEvents = new Map<string, UnlockEventCandidate>();

  events.forEach((event) => {
    const key = String(event.timestamp ?? `${event.name}|${event.allocation}|${event.unlockType}`);
    const existingEvent = dedupedEvents.get(key);

    if (!existingEvent || event.score > existingEvent.score) {
      dedupedEvents.set(key, event);
    }
  });

  return Array.from(dedupedEvents.values()).sort((left, right) => {
    if (left.timestamp === null && right.timestamp === null) return right.score - left.score;
    if (left.timestamp === null) return 1;
    if (right.timestamp === null) return -1;

    return left.timestamp - right.timestamp;
  });
};

export const getUnlockEvents = (item: any): UnlockEventCandidate[] => {
  const candidateEvents = [
    item?.nextUnlockEvent,
    ...(Array.isArray(item?.unlockEvents) ? item.unlockEvents : []),
    ...(Array.isArray(item?.intelSourceEvents) ? item.intelSourceEvents : []),
    ...(Array.isArray(item?.rawUnlockData) ? item.rawUnlockData : []),
  ]
    .map(createUnlockEventCandidate)
    .filter((event): event is UnlockEventCandidate => Boolean(event));

  return dedupeUnlockEvents(candidateEvents);
};

export const getUnlockPrimaryEvent = (item: any): UnlockEventCandidate | null => {
  const events = getUnlockEvents(item);
  const nextUnlockTimestamp = toTimestamp(item?.nextTokenUnlockDate);

  if (nextUnlockTimestamp !== null) {
    const matchedEvent = events.find(
      (event) =>
        event.timestamp !== null &&
        Math.abs(event.timestamp - nextUnlockTimestamp) <= 5 * 60 * 1000
    );

    if (matchedEvent) return matchedEvent;
  }

  return events.find((event) => event.isUpcoming) || events[0] || null;
};

export const getUnlockEventDate = (item: any): string | Date | null => {
  return getUnlockPrimaryEvent(item)?.dateValue || toDateValue(item?.nextTokenUnlockDate);
};

export const getUnlockActionSourceId = (item: any): string => {
  const primaryEvent = getUnlockPrimaryEvent(item);
  const rawEvent = primaryEvent?.raw || {};
  const explicitId =
    normalizeLabel(item?.actionId) ||
    normalizeLabel(item?.userActionSourceId) ||
    normalizeLabel(rawEvent?.actionId) ||
    normalizeLabel(rawEvent?.userActionSourceId) ||
    normalizeLabel(rawEvent?.id) ||
    normalizeLabel(rawEvent?.sourceKey) ||
    normalizeLabel(rawEvent?.sourceId) ||
    normalizeLabel(item?.nextUnlockEvent?.actionId) ||
    normalizeLabel(item?.nextUnlockEvent?.userActionSourceId) ||
    normalizeLabel(item?.nextUnlockEvent?.id) ||
    normalizeLabel(item?.nextUnlockEvent?.sourceKey) ||
    normalizeLabel(item?.nextUnlockEvent?.sourceId);

  if (explicitId) {
    return explicitId;
  }

  const dateTimestamp =
    primaryEvent?.timestamp ||
    toTimestamp(primaryEvent?.dateValue) ||
    toTimestamp(item?.nextTokenUnlockDate);
  const slug =
    normalizeLabel(primaryEvent?.raw?.coinSlug) ||
    normalizeLabel(item?.coinSlug) ||
    normalizeLabel(item?.sourceKey) ||
    normalizeLabel(item?._id);

  if (slug && dateTimestamp !== null) {
    const allocation = normalizeLabel(
      rawEvent?.allocation || rawEvent?.allocation_type || "token-unlock"
    )
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return [
      "token_unlock",
      slug,
      new Date(dateTimestamp).toISOString(),
      allocation || "token-unlock",
    ].join(":");
  }

  return normalizeLabel(item?._id) || normalizeLabel(item?.coinSlug);
};

export const getUnlockPriceData = (
  item: any
): { priceChange24h: number | null; priceUsd: number | null } => {
  const primaryEvent = getUnlockPrimaryEvent(item);

  return {
    priceChange24h:
      primaryEvent?.priceChange24h ??
      toNumber(item?.priceChange24h) ??
      toNumber(item?.detailed?.priceChange24h),
    priceUsd:
      toPositiveNumber(item?.priceUsd) ||
      toPositiveNumber(item?.detailed?.price?.USD) ||
      toPositiveNumber(item?.detailed?.priceUsd) ||
      toPositiveNumber(item?.detailed?.currentPrice) ||
      primaryEvent?.priceUsd ||
      null,
  };
};

export const getUnlockPublicVestingLabel = (item: any): string => {
  const publicVesting =
    getDisplayString(item?.tokenomics?.publicSale?.vesting) ||
    getDisplayString(item?.rawIcoData?.publicRound?.vesting) ||
    getDisplayString(item?.rawIcoData?.publicSale?.vesting) ||
    getDisplayString(
      Array.isArray(item?.vesting)
        ? item.vesting.find((vestingItem: any) => isPublicVestingStage(vestingItem))
            ?.schedule
        : null
    ) ||
    null;

  return publicVesting || "--";
};

export const getUnlockStageLabel = (item: any): string => {
  const primaryEvent = getUnlockPrimaryEvent(item);
  const projectIdentityValues = getProjectIdentityValues(item);
  const stage =
    getStageFromUnlock(primaryEvent?.raw, projectIdentityValues) ||
    getStageFromUnlock(primaryEvent, projectIdentityValues) ||
    getStageFromUnlock(item?.nextUnlockEvent, projectIdentityValues) ||
    getStageFromUnlock(item, projectIdentityValues) ||
    null;

  return stage || "--";
};
