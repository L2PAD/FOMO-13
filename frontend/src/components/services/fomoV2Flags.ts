import getAccessToken from "../utils/getAccessToken";
import { configureUrl } from "./config";

export type FomoV2FlagEntityType =
  | "market_project"
  | "ico_project"
  | "backer"
  | "person";
export type FomoV2FlagType = "green" | "yellow" | "red";
export type FomoV2FlagStatus = "pending" | "confirmed" | "rejected";

export interface FomoV2EntityFlag {
  id: string;
  _id?: string;
  entityType: FomoV2FlagEntityType;
  entityId: string;
  flagType: FomoV2FlagType;
  title?: string;
  description: string;
  sourceUrl?: string;
  status: FomoV2FlagStatus;
  submittedByUserId?: string;
  reviewedByAdminId?: string;
  reviewedAt?: string;
  adminComment?: string;
  xpDelta?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FomoV2FlagFilters {
  status?: string;
  entityType?: string;
  flagType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FomoV2FlagListResponse {
  items: FomoV2EntityFlag[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  counts?: {
    byStatus?: Record<string, number>;
    byType?: Record<string, number>;
  };
}

const request = async <T = unknown>(
  path: string,
  options?: RequestInit
): Promise<{ success: boolean; data: T; status: number; error?: string }> => {
  const token = getAccessToken();
  const response = await fetch(configureUrl(path), {
    ...options,
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  const text = await response.text();
  let data: any = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = { message: text };
  }

  return {
    success: response.status < 300,
    data,
    status: response.status,
    error: response.status < 300 ? undefined : data?.message || response.statusText,
  };
};

const toQuery = (filters: FomoV2FlagFilters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const text = params.toString();
  return text ? `?${text}` : "";
};

export const fetchFomoV2Flags = (filters: FomoV2FlagFilters) =>
  request<FomoV2FlagListResponse>(`admin/fomo-v2/flags${toQuery(filters)}`, {
    method: "GET",
  });

export const confirmFomoV2Flag = (id: string, adminComment?: string) =>
  request(`admin/fomo-v2/flags/${encodeURIComponent(id)}/confirm`, {
    method: "POST",
    body: JSON.stringify({ adminComment }),
  });

export const rejectFomoV2Flag = (id: string, adminComment?: string) =>
  request(`admin/fomo-v2/flags/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: JSON.stringify({ adminComment }),
  });
