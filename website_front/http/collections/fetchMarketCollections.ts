import { API } from "../../config/api";
import { ICollection } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

type SortType = "all" | "favorite" | "trending" | "new" | "tier-1" | "tier-2";
type CurrencyType = "ETH" | "USDC";

interface IParams {
  page?: number;
  limit?: number;
  sort?: SortType;
  currency?: CurrencyType;
  search?: string;
}

export default async (
  params: IParams
): Promise<{
  isSuccess: boolean;
  collections: Array<ICollection | any>;
  total: number;
  page: number;
  limit: number;
}> => {
  try {
    const accessToken: string | null = getAuthToken();
    const query = new URLSearchParams();

    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.sort) query.set("sort", String(params.sort));
    if (params.search) query.set("search", String(params.search));
    if (params.currency) query.set("currency", params.currency.toLowerCase());

    const queryString = query.toString();
    const url = `${API}/collections/market${queryString ? `?${queryString}` : ""}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      collections: data?.collections || [],
      total: Number(data?.total || 0),
      page: Number(data?.page || params?.page || 1),
      limit: Number(data?.limit || params?.limit || 12),
    };
  } catch (error) {
    console.log(error);

    return {
      isSuccess: false,
      collections: [],
      total: 0,
      page: Number(params?.page || 1),
      limit: Number(params?.limit || 12),
    };
  }
};

