import { API } from "../config/api";
import getAuthToken from "./getAuthToken";
import {
  CryptoActivityBoardItemApi,
  CryptoActivityBoardParams,
  CryptoActivityBoardResponse,
  CryptoActivityBoardTaskApi,
  CryptoActivityBoardTaskPayload,
  CryptoActivityCalendarParams,
  CryptoActivityCalendarResponse,
  CryptoActivityFiltersResponse,
  CryptoActivityApiDetail,
  CryptoActivityListParams,
  CryptoActivityListResponse,
} from "../types/cryptoActivities";

const V2_ACTIVITIES_PATH = `${API}/fomo-v2/activities`;

export class CryptoActivityRequestError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "CryptoActivityRequestError";
    this.status = status;
  }
}

export const getCryptoActivityErrorStatus = (error: unknown): number | undefined =>
  error instanceof CryptoActivityRequestError ? error.status : undefined;

const buildQueryString = (params: CryptoActivityListParams = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

const authHeaders = (withJson = false): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {};

  if (token) headers.Authorization = `Bearer ${token}`;
  if (withJson) headers["Content-Type"] = "application/json";

  return headers;
};

const readResponseJson = async (response: Response): Promise<any> => {
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new CryptoActivityRequestError("The activities API returned invalid JSON", response.status);
  }
};

const requestJson = async (url: string): Promise<any> => {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: authHeaders(),
    });
  } catch (error) {
    throw new CryptoActivityRequestError("Unable to reach the activities API");
  }

  const data = await readResponseJson(response);
  if (!response.ok) {
    const message =
      (typeof data?.message === "string" && data.message) ||
      (typeof data?.error === "string" && data.error) ||
      `Activities request failed with status ${response.status}`;
    throw new CryptoActivityRequestError(message, response.status);
  }

  return data;
};

const unwrapResponse = (data: any): any => {
  if (data?.data && typeof data.data === "object") return data.data;
  return data;
};

export async function getCryptoActivities(
  params: CryptoActivityListParams = {}
): Promise<CryptoActivityListResponse> {
  const rawData = await requestJson(`${V2_ACTIVITIES_PATH}${buildQueryString(params)}`);
  const data = unwrapResponse(rawData);

  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      limit: data.length,
      offset: 0,
      hasMore: false,
    };
  }

  const items = Array.isArray(data?.items) ? data.items : [];
  const total = Number(data?.total ?? items.length);
  const limit = Number(data?.limit ?? params.limit ?? 20);
  const offset = Number(data?.offset ?? params.offset ?? 0);

  return {
    items,
    total,
    limit,
    offset,
    hasMore: data?.hasMore === undefined ? offset + items.length < total : Boolean(data.hasMore),
  };
}

export async function getPromotedCryptoActivities(
  limit = 10
): Promise<CryptoActivityListResponse> {
  const rawData = await requestJson(
    `${V2_ACTIVITIES_PATH}/promoted${buildQueryString({ limit })}`
  );
  const data = unwrapResponse(rawData);
  const items = Array.isArray(data?.items) ? data.items : [];

  return {
    items,
    total: Number(data?.total ?? items.length),
    limit: Number(data?.limit ?? limit),
    offset: 0,
    hasMore: false,
  };
}

export async function getCryptoActivity(id: string): Promise<CryptoActivityApiDetail> {
  const data = unwrapResponse(
    await requestJson(`${V2_ACTIVITIES_PATH}/${encodeURIComponent(id)}`)
  );

  if (!data || typeof data !== "object") {
    throw new CryptoActivityRequestError("Activity not found", 404);
  }

  return data;
}

export async function getCryptoActivityFilters(
  limit = 9,
  params: Pick<CryptoActivityListParams, "accessTier"> = {}
): Promise<CryptoActivityFiltersResponse> {
  const data = unwrapResponse(
    await requestJson(
      `${V2_ACTIVITIES_PATH}/filters${buildQueryString({ ...params, limit })}`
    )
  );

  return {
    total: Number(data?.total || 0),
    otherActivityCount: Number(data?.otherActivityCount || 0),
    activityTypes: Array.isArray(data?.activityTypes) ? data.activityTypes : [],
    categories: Array.isArray(data?.categories) ? data.categories : [],
  };
}

const EMPTY_BOARD_RESPONSE: CryptoActivityBoardResponse = {
  boards: [
    { id: "all", label: "All Tasks", icon: "all", count: 0 },
    { id: "airdrop", label: "Airdrop", icon: "airdrop", count: 0 },
    { id: "testnet", label: "Testnet", icon: "testnet", count: 0 },
    { id: "quest", label: "Quests", icon: "quest", count: 0 },
    { id: "node", label: "Nodes", icon: "node", count: 0 },
    { id: "other", label: "Others", icon: "other", count: 0 },
  ],
  columns: [
    { id: "todo", label: "To Do", dotColor: "#2082ea", tasks: [] },
    { id: "in-progress", label: "In Progress", dotColor: "#ffc704", tasks: [] },
    { id: "completed", label: "Completed", dotColor: "#05a584", tasks: [] },
  ],
  stats: {
    totalTasks: 0,
    inProgress: 0,
    completed: 0,
    xpEarned: 0,
    overallProgress: 0,
  },
};

export async function getCryptoActivityBoard(
  params: CryptoActivityBoardParams = {}
): Promise<CryptoActivityBoardResponse> {
  try {
    const response = await fetch(`${API}/crypto-activities/board${buildQueryString(params)}`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (!response.ok) return EMPTY_BOARD_RESPONSE;

    const data = await response.json();

    return {
      boards: Array.isArray(data?.boards) ? data.boards : EMPTY_BOARD_RESPONSE.boards,
      columns: Array.isArray(data?.columns) ? data.columns : EMPTY_BOARD_RESPONSE.columns,
      stats: data?.stats || EMPTY_BOARD_RESPONSE.stats,
      permissions: data?.permissions,
    };
  } catch (error) {
    console.log(error);

    return EMPTY_BOARD_RESPONSE;
  }
}

export async function createCryptoActivityBoard(
  payload: { title: string; icon?: string }
): Promise<CryptoActivityBoardItemApi | null> {
  try {
    const response = await fetch(`${API}/crypto-activities/board/boards`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });

    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.log(error);

    return null;
  }
}

export async function createCryptoActivityBoardTask(
  payload: CryptoActivityBoardTaskPayload
): Promise<CryptoActivityBoardTaskApi | null> {
  try {
    const response = await fetch(`${API}/crypto-activities/board/tasks`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });

    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.log(error);

    return null;
  }
}

export async function updateCryptoActivityBoardTask(
  id: string,
  payload: CryptoActivityBoardTaskPayload
): Promise<CryptoActivityBoardTaskApi | null> {
  try {
    const response = await fetch(`${API}/crypto-activities/board/tasks/${id}`, {
      method: "PATCH",
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });

    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.log(error);

    return null;
  }
}

export async function deleteCryptoActivityBoardTask(
  id: string
): Promise<{ isSuccess: boolean }> {
  try {
    const response = await fetch(`${API}/crypto-activities/board/tasks/${id}`, {
      method: "DELETE",
      headers: authHeaders(true),
    });

    return { isSuccess: response.ok };
  } catch (error) {
    console.log(error);

    return { isSuccess: false };
  }
}

export async function getCryptoActivityCalendar(
  params: CryptoActivityCalendarParams = {}
): Promise<CryptoActivityCalendarResponse> {
  try {
    const response = await fetch(`${API}/crypto-activities/calendar${buildQueryString(params)}`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (!response.ok) {
      return {
        items: [],
        total: 0,
        limit: Number(params.limit || 500),
        offset: Number(params.offset || 0),
        hasMore: false,
      };
    }

    const data = await response.json();

    return {
      items: Array.isArray(data?.items) ? data.items : [],
      total: Number(data?.total || 0),
      limit: Number(data?.limit || params.limit || 500),
      offset: Number(data?.offset || params.offset || 0),
      hasMore: Boolean(data?.hasMore),
      startDate: data?.startDate,
      endDate: data?.endDate,
    };
  } catch (error) {
    console.log(error);

    return {
      items: [],
      total: 0,
      limit: Number(params.limit || 500),
      offset: Number(params.offset || 0),
      hasMore: false,
    };
  }
}

export async function favoriteCryptoActivity(id: string): Promise<{ isSuccess: boolean }> {
  try {
    const response = await fetch(`${API}/crypto-activities/${id}/favorite`, {
      method: "POST",
      headers: authHeaders(true),
    });

    return { isSuccess: response.ok };
  } catch (error) {
    console.log(error);

    return { isSuccess: false };
  }
}

export async function unfavoriteCryptoActivity(id: string): Promise<{ isSuccess: boolean }> {
  try {
    const response = await fetch(`${API}/crypto-activities/${id}/favorite`, {
      method: "DELETE",
      headers: authHeaders(true),
    });

    return { isSuccess: response.ok };
  } catch (error) {
    console.log(error);

    return { isSuccess: false };
  }
}

export async function reactToCryptoActivity(
  id: string,
  reaction: "like" | "dislike" | "hot" | "interested"
): Promise<{ isSuccess: boolean }> {
  try {
    const response = await fetch(`${API}/crypto-activities/${id}/reaction`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ reaction }),
    });

    return { isSuccess: response.ok };
  } catch (error) {
    console.log(error);

    return { isSuccess: false };
  }
}

export async function removeCryptoActivityReaction(id: string): Promise<{ isSuccess: boolean }> {
  try {
    const response = await fetch(`${API}/crypto-activities/${id}/reaction`, {
      method: "DELETE",
      headers: authHeaders(true),
    });

    return { isSuccess: response.ok };
  } catch (error) {
    console.log(error);

    return { isSuccess: false };
  }
}

export async function reportCryptoActivity(
  id: string,
  payload: { reason: string; message?: string }
): Promise<{ isSuccess: boolean }> {
  try {
    const response = await fetch(`${API}/crypto-activities/${id}/report`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });

    return { isSuccess: response.ok };
  } catch (error) {
    console.log(error);

    return { isSuccess: false };
  }
}

export async function removeCryptoActivityFromCalendar(
  id: string
): Promise<{ isSuccess: boolean }> {
  try {
    const response = await fetch(`${API}/crypto-activities/${id}/calendar`, {
      method: "DELETE",
      headers: authHeaders(true),
    });

    return { isSuccess: response.ok };
  } catch (error) {
    console.log(error);

    return { isSuccess: false };
  }
}

export async function addCryptoActivityToCalendar(
  id: string,
  payload: { date?: string | Date; note?: string } = {}
): Promise<{ isSuccess: boolean }> {
  try {
    const response = await fetch(`${API}/crypto-activities/${id}/calendar`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });

    return { isSuccess: response.ok };
  } catch (error) {
    console.log(error);

    return { isSuccess: false };
  }
}

export async function updateCryptoActivityStepProgress(
  id: string,
  payload: { completedStepIds?: string[]; stepId?: string; completed?: boolean }
): Promise<{ isSuccess: boolean; userState?: CryptoActivityApiDetail["userState"] }> {
  try {
    const response = await fetch(`${API}/crypto-activities/${id}/steps`, {
      method: "PATCH",
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });

    if (!response.ok) return { isSuccess: false };

    const data = await response.json();
    return { isSuccess: true, userState: data?.userState };
  } catch (error) {
    console.log(error);

    return { isSuccess: false };
  }
}
