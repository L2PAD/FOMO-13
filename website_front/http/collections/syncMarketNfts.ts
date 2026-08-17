import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";
import {
  CollectionMarketSort,
  ICollectionMarketFilters,
  buildCollectionMarketFilterQuery,
} from "../../utils/collectionMarketFilters";

type SortType = CollectionMarketSort;
type CurrencyType = "ETH" | "USDC";

interface IParams {
  page?: number;
  limit?: number;
  sort?: SortType;
  currency?: CurrencyType;
  search?: string;
  filters?: Partial<ICollectionMarketFilters> | null;
  currentTotal?: number;
  ids?: Array<string>;
}

interface IMarketStatus {
  _id: string;
  isActive: boolean;
}

export default async (
  params: IParams
): Promise<{
  isSuccess: boolean;
  mode: "full" | "statuses";
  nfts: Array<any>;
  total: number;
  page: number;
  limit: number;
  statuses: Array<IMarketStatus>;
  missingIds: Array<string>;
  inactiveIds: Array<string>;
}> => {
  try {
    const accessToken: string | null = getAuthToken();
    const query = new URLSearchParams();

    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.sort) query.set("sort", String(params.sort));
    if (params.search) query.set("search", String(params.search));
    if (params.currency) query.set("currency", params.currency.toLowerCase());
    Object.entries(buildCollectionMarketFilterQuery(params.filters)).forEach(
      ([key, value]) => query.set(key, value)
    );
    if (params.currentTotal !== undefined) {
      query.set("currentTotal", String(params.currentTotal));
    }
    if (params.ids?.length) {
      query.set("ids", params.ids.join(","));
    }

    const queryString = query.toString();
    const url = `${API}/collectionNft/market/sync${
      queryString ? `?${queryString}` : ""
    }`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      mode: data?.mode === "statuses" ? "statuses" : "full",
      nfts: data?.nfts || [],
      total: Number(data?.total || 0),
      page: Number(data?.page || params?.page || 1),
      limit: Number(data?.limit || params?.limit || 12),
      statuses: Array.isArray(data?.statuses) ? data.statuses : [],
      missingIds: Array.isArray(data?.missingIds) ? data.missingIds : [],
      inactiveIds: Array.isArray(data?.inactiveIds) ? data.inactiveIds : [],
    };
  } catch (error) {
    console.log(error);

    return {
      isSuccess: false,
      mode: "full",
      nfts: [],
      total: Number(params?.currentTotal || 0),
      page: Number(params?.page || 1),
      limit: Number(params?.limit || 12),
      statuses: [],
      missingIds: [],
      inactiveIds: [],
    };
  }
};
