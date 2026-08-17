import { IProject } from "../types/global_types";

export interface IDisplayTokenAllocation {
  name: string;
  allocated: number;
  value: number;
  tokensAllocatedAmount: number;
  tokensAllocatedPercent: number;
  normalizedCategory?: string;
  saleId?: string | number;
  source?: string;
}

const TOKEN_ALLOCATION_VISIBLE_ITEMS = 8;

const toFiniteNumber = (value: any, fallback = 0): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const firstText = (...values: Array<any>): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return "";
};

const normalizePercent = (value: any): number => {
  const percent = Math.max(0, toFiniteNumber(value, 0));

  // Some sources store human percents as basis points: 2694 means 26.94%.
  if (percent > 100 && percent <= 10000) return percent / 100;

  return percent;
};

const resolveTotalSupply = (
  dropstabUnlocks?: any,
  project?: Partial<IProject> | null
): number => {
  return toFiniteNumber(
    dropstabUnlocks?.vestingSummary?.totalAmount ??
      project?.totalSupply ??
      project?.maxSupply,
    0
  );
};

const normalizeItem = (
  item: any,
  totalSupply: number,
  source: string
): IDisplayTokenAllocation | null => {
  const name = firstText(item?.name, item?.roundName, item?.stage);
  const percent = normalizePercent(
    item?.percent ?? item?.allocationPercent ?? item?.tokensAllocatedPercent ?? item?.value
  );
  const amount = toFiniteNumber(
    item?.amount ?? item?.totalAmount ?? item?.tokensAllocatedAmount ?? item?.allocated,
    percent && totalSupply ? (totalSupply * percent) / 100 : 0
  );

  if (!name || (!amount && !percent)) return null;

  return {
    ...item,
    name,
    allocated: amount,
    value: percent,
    tokensAllocatedAmount: amount,
    tokensAllocatedPercent: percent,
    normalizedCategory: item?.normalizedCategory,
    saleId: item?.saleId,
    source,
  };
};

const allocationPercentValue = (item: any): number =>
  normalizePercent(
    item?.tokensAllocatedPercent ??
      item?.allocationPercent ??
      item?.percent ??
      item?.value
  );

const allocationAmountValue = (item: any): number =>
  toFiniteNumber(
    item?.tokensAllocatedAmount ??
      item?.totalAmount ??
      item?.amount ??
      item?.allocated,
    0
  );

const allocationSortValue = (item: any): number => {
  const percent = allocationPercentValue(item);
  if (percent > 0) return percent;

  return allocationAmountValue(item);
};

export const summarizeTokenAllocationItems = (
  items: IDisplayTokenAllocation[],
  visibleItemsCount = TOKEN_ALLOCATION_VISIBLE_ITEMS
): IDisplayTokenAllocation[] => {
  const sortedItems = [...(items || [])].sort((left, right) => {
    const valueDiff = allocationSortValue(right) - allocationSortValue(left);
    if (valueDiff !== 0) return valueDiff;

    return String(left.name || "").localeCompare(String(right.name || ""));
  });

  if (sortedItems.length <= visibleItemsCount) return sortedItems;

  const visibleItems = sortedItems.slice(0, visibleItemsCount);
  const hiddenItems = sortedItems.slice(visibleItemsCount);
  const otherAmount = hiddenItems.reduce(
    (total, item) => total + allocationAmountValue(item),
    0
  );
  const otherPercent = hiddenItems.reduce(
    (total, item) => total + allocationPercentValue(item),
    0
  );

  if (!otherAmount && !otherPercent) return visibleItems;

  return [
    ...visibleItems,
    {
      name: "Other",
      allocated: otherAmount,
      value: otherPercent,
      tokensAllocatedAmount: otherAmount,
      tokensAllocatedPercent: otherPercent,
      normalizedCategory: "other",
      source: "aggregated",
    },
  ];
};

export const buildDropstabTokenAllocation = (
  dropstabUnlocks?: any,
  project?: Partial<IProject> | null
): IDisplayTokenAllocation[] => {
  const sourceItems = Array.isArray(dropstabUnlocks?.tokenAllocation)
    ? dropstabUnlocks.tokenAllocation
    : Array.isArray(dropstabUnlocks?.vestingRounds)
      ? dropstabUnlocks.vestingRounds
      : [];
  const totalSupply = resolveTotalSupply(dropstabUnlocks, project);

  const normalizedItems = sourceItems
    .map((item: any) => normalizeItem(item, totalSupply, "dropstab"))
    .filter(Boolean) as IDisplayTokenAllocation[];

  return summarizeTokenAllocationItems(normalizedItems);
};

export const normalizeTokenAllocationItems = (
  items?: Array<any>,
  project?: Partial<IProject> | null
): IDisplayTokenAllocation[] => {
  const totalSupply = resolveTotalSupply(null, project);

  const normalizedItems = (items || [])
    .map((item: any) => normalizeItem(item, totalSupply, item?.source || "project"))
    .filter(Boolean) as IDisplayTokenAllocation[];

  return summarizeTokenAllocationItems(normalizedItems);
};

export const formatAllocationPercent = (value: any): string => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";

  return number.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
};
