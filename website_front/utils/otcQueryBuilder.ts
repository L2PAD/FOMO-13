import { DealSortTypes, ISettingsP2P } from "../components/layouts/projects/OTC/DealsList";
import { statusesReverse } from "./otcConstants";

const OTC_DEFAULTS = {
  priceEth: [0, 10],
  priceUsdc: [0, 10000],
  amount: [0, 1000],
  rating: [0, 100],
  tickers: ["ETH", "USDC"],
  isRealAsset: ["Real Assets", "Other"],
  userStatus: ["Red flag", "Verifed", "Not verified"],
  risk: ["Default", "Low", "Medium", "High"],
  serviceType: ["NFT", "KYC", "Project Account", "Services", "Projects", "Social network"],
  dealStatus: ["Available", "Wait for confirm", "Started", "Funds reserved", "Ended", "Closed"],
} as const;

const arraysEqualAsSet = (left?: any[], right?: readonly any[]) => {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  if (left.length !== right.length) return false;
  const l = [...left].sort();
  const r = [...right].sort();
  return l.every((item, index) => item === r[index]);
};

const isDefaultRange = (value: any, defaults: readonly number[]) => {
  if (!Array.isArray(value) || value.length < 2) return false;
  return Number(value[0]) === Number(defaults[0]) && Number(value[1]) === Number(defaults[1]);
};

const isDefaultOtcDateWindow = (startDate: any, endDate: any) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  const now = Date.now();
  const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
  const startDiff = Math.abs((now - oneMonthMs) - start.getTime());
  const endDiff = Math.abs((now + oneMonthMs) - end.getTime());

  // Tolerate render/network delays in default Date initialization.
  return startDiff < 5 * 60 * 1000 && endDiff < 5 * 60 * 1000;
};

export const buildQueryString = (
  filters: any,
  sortField: DealSortTypes | undefined,
  limit: number,
  offset: number,
  isMyDeals?: boolean
) => {
  const params: any = {
    limit,
    offset,
  };

  if (filters.dealId) {
    params.dealId = filters.dealId;
  }
  if (filters.serviceType && !arraysEqualAsSet(filters.serviceType, OTC_DEFAULTS.serviceType)) {
    params.serviceType = filters.serviceType;
  }
  if (filters.userStatus && !arraysEqualAsSet(filters.userStatus, OTC_DEFAULTS.userStatus)) {
    params.userStatus = filters.userStatus;
  }
  if (filters.isRealAsset && !arraysEqualAsSet(filters.isRealAsset, OTC_DEFAULTS.isRealAsset)) {
    params.isRealAsset = filters.isRealAsset;
  }
  if (filters.risk && !arraysEqualAsSet(filters.risk, OTC_DEFAULTS.risk)) {
    params.risk = filters.risk;
  }
  if (filters.searchValue) {
    params.searchValue = filters.searchValue;
  }
  if (filters.startDate && !isDefaultOtcDateWindow(filters.startDate, filters.endDate)) {
    params.startDate = filters.startDate.toISOString();
  }
  if (filters.endDate && !isDefaultOtcDateWindow(filters.startDate, filters.endDate)) {
    params.endDate = filters.endDate.toISOString();
  }
  if (filters.priceEth && !isDefaultRange(filters.priceEth, OTC_DEFAULTS.priceEth)) {
    params.minPriceEth = filters.priceEth[0];
    params.maxPriceEth = filters.priceEth[1];
  }
  if (filters.priceUsdc && !isDefaultRange(filters.priceUsdc, OTC_DEFAULTS.priceUsdc)) {
    params.minPriceUsdc = filters.priceUsdc[0];
    params.maxPriceUsdc = filters.priceUsdc[1];
  }
  if (filters.amount && !isDefaultRange(filters.amount, OTC_DEFAULTS.amount)) {
    params.minAmount = filters.amount[0];
    params.maxAmount = filters.amount[1];
  }
  if (filters.rating && !isDefaultRange(filters.rating, OTC_DEFAULTS.rating)) {
    params.minRating = filters.rating[0];
    params.maxRating = filters.rating[1];
  }
  if (filters.tickers && !arraysEqualAsSet(filters.tickers, OTC_DEFAULTS.tickers)) {
    params.tickers = filters.tickers;
  }
  if (sortField) {
    params.sortField = sortField;
  }
  if (isMyDeals) {
    params.userDeals = "true";
  }

  if (filters.dealStatus?.length && !arraysEqualAsSet(filters.dealStatus, OTC_DEFAULTS.dealStatus)) {
    params.dealStatus = Array.from(new Set(filters.dealStatus.map(
      (
        item:
          | "Available"
          | "Wait for confirm"
          | "Started"
          | "Funds reserved"
          | "Ended"
      ) => {
        return statusesReverse[item];
      }
    )));
  }

  const queryString = new URLSearchParams(params).toString();
  return `?${queryString}`;
};

export const buildMembersQueryString = (
  filters: any,
  sortField: string,
  limit: number,
  offset: number
): string => {
  const params: any = {
    limit,
    offset,
  };

  if (filters.memberId) {
    params.memberId = filters.memberId;
  }
  if (filters.completedDeals) {
    params.completedDealsMin = filters.completedDeals[0];
    params.completedDealsMax = filters.completedDeals[1];
  }
  if (filters.sales) {
    params.salesMin = filters.sales[0];
    params.salesMax = filters.sales[1];
  }
  if (filters.purchases) {
    params.purchasesMin = filters.purchases[0];
    params.purchasesMax = filters.purchases[1];
  }
  if (filters.risk) {
    params.risk = filters.risk;
  }
  if (filters.userStatus) {
    params.userStatus = filters.userStatus;
  }
  if (filters.searchValue) params.searchValue = filters.searchValue;
  if (sortField) params.sortField = sortField;

  const queryString = new URLSearchParams(params).toString();

  return `?${queryString}`;
};

export const buildP2PSettingsQueryString = (
  settingsP2P: ISettingsP2P,
  searchValue: string,
  limit: number,
  offset: number,
  isMyDeals?: boolean,
  filters?: any
): string => {
  const params: any = {
    limit,
    offset,
  };

  if (filters?.dealId) {
    params.dealId = filters.dealId;
  }
  if (settingsP2P.filterValue && settingsP2P.filterValue.toLowerCase() !== 'all') {
    params.tickers = settingsP2P.filterValue;
  }

  if (settingsP2P.selectedCurrency) {
    params.currency = settingsP2P.selectedCurrency;
  }

  if (settingsP2P.selectedPaymentMethod.length) {
    params.paymentMethods = settingsP2P.selectedPaymentMethod;
  }

  if (settingsP2P.transactionAmount) {
    params.transactionAmount = settingsP2P.transactionAmount;
  }

  if (settingsP2P.sortBy?.key) {
    params.sortField = settingsP2P.sortBy.key;
  }

  if (isMyDeals) {
    params.userDeals = "true";
  }

  if (searchValue) {
    params.searchValue = searchValue;
  }

  const queryString = new URLSearchParams(params).toString();

  return `?${queryString}`;
}
