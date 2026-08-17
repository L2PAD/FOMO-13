import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export interface ITokenUnlockUserActionState {
  inCalendar: boolean;
  reminderEnabled: boolean;
  notifyAt?: string;
}

export interface ITokenUnlockEvent {
  id?: string;
  actionId?: string;
  userActionSourceId?: string;
  source?: string;
  sourceKey?: string;
  sourceUrl?: string;
  detailUrl?: string;
  coinSlug?: string;
  projectKey?: string;
  name?: string;
  symbol?: string;
  logo?: string;
  icon?: string;
  image?: string;
  unlockDate?: string;
  daysUntilUnlock?: number;
  isUpcoming?: boolean;
  isPast?: boolean;
  allocation?: string;
  unlockType?: string;
  cliffEnd?: boolean;
  tokenAmount?: number;
  tokensAmount?: number;
  unlockValueUsd?: number;
  valueUsd?: number;
  percentOfSupply?: number;
  tokensPercent?: number;
  priceUsd?: number;
  marketCapUsd?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  maxSupply?: number;
  fullyDilutedMarketCapUsd?: number;
  updatedAt?: string;
  rawUnlockData?: unknown;
}

export interface IProjectEntityLink {
  projectId?: string;
  projectType?: "market" | "project";
  confidence?: string;
  matchedBy?: string;
  reason?: string;
}

export interface ITokenUnlockItem {
  _id?: string;
  actionId?: string;
  userActionSourceId?: string;
  projectId?: string;
  projectLinks?: IProjectEntityLink[];
  source?: string;
  sourceKey?: string;
  sourceUrl?: string;
  detailUrl?: string;
  sources?: string[];
  coinId?: number;
  coinSlug?: string;
  coinSymbol?: string;
  image?: string;
  logo?: string;
  icon?: string;
  priceUsd?: number;
  marketCap?: number;
  fdv?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  maxSupply?: number;
  circulationSupplyPercent?: number;
  totalTokensUnlockedPercent?: number;
  totalTokensLockedPercent?: number;
  tgeDate?: string;
  detailed?: any;
  publicVestingPercent?: number;
  nextUnlockPercent?: number;
  nextUnlockValueUsd?: number;
  nextUnlockTokensAmount?: number;
  totalTokensUnlockedAmount?: number;
  totalTokensLockedAmount?: number;
  lastTokenUnlockDate?: string;
  nextTokenUnlockDate?: string;
  allocations?: any[];
  vesting?: any[];
  chart?: any[];
  unlockEvents?: ITokenUnlockEvent[];
  nextUnlockEvent?: ITokenUnlockEvent | null;
  largestUnlockEvent?: ITokenUnlockEvent | null;
  rawUnlockData?: unknown[];
  userActions?: ITokenUnlockUserActionState;
}

export interface IUnlockReturnData {
  isSuccess: boolean;
  unlocks: Array<ITokenUnlockItem>;
  allocations: any[];
  total: number;
  vesting: Array<any>
}

export interface ITokenUnlockCategory {
  key: string;
  label: string;
  count: number;
}

export interface IUnlockCategoriesReturnData {
  isSuccess: boolean;
  categories: ITokenUnlockCategory[];
}

export interface ITokenUnlockActionResponse {
  isSuccess: boolean;
  event?: any;
  alreadyExists?: boolean;
  message?: string;
}

export type TokenUnlockUserActionsMap = Record<
  string,
  ITokenUnlockUserActionState
>;

const getErrorMessage = (data: any, fallback: string): string => {
  if (typeof data?.message === "string") {
    return data.message;
  }

  if (Array.isArray(data?.message) && data.message[0]) {
    return String(data.message[0]);
  }

  return fallback;
};

const getAuthHeaders = (): HeadersInit | null => {
  const accessToken: string | null = getAuthToken();

  if (!accessToken) {
    return null;
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
};

const normalizeQuery = (query?: string): string => {
  const rawQuery = String(query || "").replace(/^\?/, "");
  const params = new URLSearchParams(rawQuery);
  params.delete("readModel");

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

export default async (
  query?: string
): Promise<IUnlockReturnData> => {
  try {
    const path = `/fomo-v2/unlocks${normalizeQuery(query)}`;

    const res = await fetch(`${API}${path}`, {
      method: "GET",
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      unlocks: data?.unlocks || [],
      vesting: data?.vesting || [],
      allocations: data?.allocations || [],
      total: data?.total ?? data?.totalCount ?? 0,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, unlocks: [], allocations: [], vesting: [], total: 0 };
  }
};

export const fetchTokenUnlockCategories = async (
  query?: string
): Promise<IUnlockCategoriesReturnData> => {
  try {
    const path = `/fomo-v2/unlocks/categories${normalizeQuery(query)}`;

    const res = await fetch(`${API}${path}`, {
      method: "GET",
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      categories: data?.categories || [],
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, categories: [] };
  }
};

export const fetchTokenUnlockUserActions = async (
  ids: string[]
): Promise<{ isSuccess: boolean; actions: TokenUnlockUserActionsMap }> => {
  try {
    const headers = getAuthHeaders();

    if (!headers || !ids.length) {
      return { isSuccess: false, actions: {} };
    }

    const query = new URLSearchParams({ ids: ids.join(",") });
    const res = await fetch(`${API}/fomo-v2/unlocks/user-actions?${query}`, {
      headers,
      method: "GET",
    });
    const data = await res.json();

    return {
      actions: res.status < 300 ? data || {} : {},
      isSuccess: res.status < 300,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, actions: {} };
  }
};

const tokenUnlockAction = async (
  unlockId: string,
  action: "calendar" | "reminder",
  method: "POST" | "DELETE",
  body?: Record<string, unknown>
): Promise<ITokenUnlockActionResponse> => {
  try {
    const headers = getAuthHeaders();

    if (!headers) {
      return {
        isSuccess: false,
        message: "Connect wallet to continue",
      };
    }

    const res = await fetch(
      `${API}/fomo-v2/unlocks/${encodeURIComponent(unlockId)}/${action}`,
      {
        body: body ? JSON.stringify(body) : undefined,
        headers,
        method,
      }
    );
    const data = await res.json();

    return {
      alreadyExists: Boolean(data?.alreadyExists),
      event: data?.event,
      isSuccess: res.status < 300 && data?.success !== false,
      message: getErrorMessage(data, "Unlock action failed"),
    };
  } catch (error) {
    console.log(error);

    return {
      isSuccess: false,
      message: "Network error. Please try again",
    };
  }
};

export const addTokenUnlockToCalendar = (
  unlockId: string
): Promise<ITokenUnlockActionResponse> => {
  return tokenUnlockAction(unlockId, "calendar", "POST");
};

export const enableTokenUnlockReminder = (
  unlockId: string,
  notifyBeforeMinutes = 24 * 60
): Promise<ITokenUnlockActionResponse> => {
  return tokenUnlockAction(unlockId, "reminder", "POST", {
    notifyBeforeMinutes,
  });
};

export const removeTokenUnlockFromCalendar = (
  unlockId: string
): Promise<ITokenUnlockActionResponse> => {
  return tokenUnlockAction(unlockId, "calendar", "DELETE");
};

export const disableTokenUnlockReminder = (
  unlockId: string
): Promise<ITokenUnlockActionResponse> => {
  return tokenUnlockAction(unlockId, "reminder", "DELETE");
};
