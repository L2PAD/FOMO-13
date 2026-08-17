import { API } from "../../config/api";
import { IOrder } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export interface FetchUserOrdersQuery {
  page?: number;
  limit?: number;
  statuses?: string[];
  currencies?: string[];
  createdStartDate?: string;
  createdEndDate?: string;
  expirationStartDate?: string;
  expirationEndDate?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface FetchOrdersResponse {
  isSuccess: boolean;
  orders: Array<IOrder>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  maxPrice: number;
}

const buildUserOrdersQuery = (query?: FetchUserOrdersQuery): string => {
  if (!query) {
    return "";
  }

  const searchParams = new URLSearchParams();

  if (Number.isFinite(Number(query.page))) {
    searchParams.set("page", String(query.page));
  }

  if (Number.isFinite(Number(query.limit))) {
    searchParams.set("limit", String(query.limit));
  }

  if (query.statuses?.length) {
    searchParams.set("statuses", query.statuses.join(","));
  }

  if (query.currencies?.length) {
    searchParams.set("currencies", query.currencies.join(","));
  }

  if (query.createdStartDate) {
    searchParams.set("createdStartDate", query.createdStartDate);
  }

  if (query.createdEndDate) {
    searchParams.set("createdEndDate", query.createdEndDate);
  }

  if (query.expirationStartDate) {
    searchParams.set("expirationStartDate", query.expirationStartDate);
  }

  if (query.expirationEndDate) {
    searchParams.set("expirationEndDate", query.expirationEndDate);
  }

  if (Number.isFinite(Number(query.minPrice))) {
    searchParams.set("minPrice", String(query.minPrice));
  }

  if (Number.isFinite(Number(query.maxPrice))) {
    searchParams.set("maxPrice", String(query.maxPrice));
  }

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
};

export default async (
  type: "active" | "history" | "user",
  id?: string,
  query?: FetchUserOrdersQuery
): Promise<FetchOrdersResponse> => {
  try {
    const accessToken: string | null = getAuthToken();
    const path: string = type === "user" ? "" : `/${type}/${id}`;
    const queryString = type === "user" ? buildUserOrdersQuery(query) : "";
    const res = await fetch(`${API}/orders${path}${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (type === "user") {
      return {
        isSuccess: res.status < 300,
        orders: data?.orders || [],
        total: Number(data?.total || 0),
        page: Number(data?.page || query?.page || 1),
        limit: Number(data?.limit || query?.limit || 20),
        totalPages: Number(data?.totalPages || 1),
        maxPrice: Number(data?.maxPrice || 0),
      };
    }

    return {
      isSuccess: res.status < 300,
      orders: Array.isArray(data) ? data : [],
      total: Array.isArray(data) ? data.length : 0,
      page: 1,
      limit: Array.isArray(data) ? data.length : 0,
      totalPages: 1,
      maxPrice: 0,
    };
  } catch (error) {
    console.log(error);

    return {
      isSuccess: false,
      orders: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
      maxPrice: 0,
    };
  }
};
