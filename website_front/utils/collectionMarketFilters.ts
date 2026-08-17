export type CollectionMarketSort =
  | "newest"
  | "oldest"
  | "price-asc"
  | "price-desc";

export const COLLECTION_MARKET_SORT_OPTIONS: Array<{
  value: CollectionMarketSort;
  label: string;
}> = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price-asc", label: "Price Low to High" },
  { value: "price-desc", label: "Price High to Low" },
];

export interface ICollectionMarketFilters {
  status: string[];
  rarityRank: [number, number];
  priceRange: [number, number];
  rarity: string[];
}

export const COLLECTION_MARKET_FILTER_DEFAULTS: ICollectionMarketFilters = {
  status: [],
  rarityRank: [0, 99],
  priceRange: [0, 999],
  rarity: [],
};

const normalizeStringArray = (value: unknown): string[] => {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return Array.from(
    new Set(
      values
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );
};

const normalizeNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeRange = (
  value: unknown,
  fallback: [number, number]
): [number, number] => {
  if (!Array.isArray(value) || value.length < 2) {
    return [...fallback] as [number, number];
  }

  const first = normalizeNumber(value[0], fallback[0]);
  const second = normalizeNumber(value[1], fallback[1]);

  return first <= second ? [first, second] : [second, first];
};

const isSameRange = (
  current: [number, number],
  target: [number, number]
): boolean => {
  return current[0] === target[0] && current[1] === target[1];
};

export const normalizeCollectionMarketFilters = (
  filters?: Partial<ICollectionMarketFilters> | null
): ICollectionMarketFilters => {
  return {
    status: normalizeStringArray(filters?.status),
    rarityRank: normalizeRange(
      filters?.rarityRank,
      COLLECTION_MARKET_FILTER_DEFAULTS.rarityRank
    ),
    priceRange: normalizeRange(
      filters?.priceRange,
      COLLECTION_MARKET_FILTER_DEFAULTS.priceRange
    ),
    rarity: normalizeStringArray(filters?.rarity),
  };
};

export const buildCollectionMarketFilterQuery = (
  filters?: Partial<ICollectionMarketFilters> | null
): Record<string, string> => {
  const normalized = normalizeCollectionMarketFilters(filters);
  const query: Record<string, string> = {};

  if (normalized.status.length) {
    query.status = normalized.status.join(",");
  }

  if (normalized.rarity.length) {
    query.rarity = normalized.rarity.join(",");
  }

  if (
    !isSameRange(
      normalized.rarityRank,
      COLLECTION_MARKET_FILTER_DEFAULTS.rarityRank
    )
  ) {
    query.rarityRankMin = String(normalized.rarityRank[0]);
    query.rarityRankMax = String(normalized.rarityRank[1]);
  }

  if (
    !isSameRange(
      normalized.priceRange,
      COLLECTION_MARKET_FILTER_DEFAULTS.priceRange
    )
  ) {
    query.priceRangeMin = String(normalized.priceRange[0]);
    query.priceRangeMax = String(normalized.priceRange[1]);
  }

  return query;
};

export const getCollectionMarketFiltersKey = (
  filters?: Partial<ICollectionMarketFilters> | null
): string => {
  return JSON.stringify(normalizeCollectionMarketFilters(filters));
};
