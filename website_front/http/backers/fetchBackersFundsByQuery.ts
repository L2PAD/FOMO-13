import { IProject } from "../../types/global_types";
import fetchFundsByQuery from "../funds/fetchFundsByQuery";
import { fetchFomoV2Backers, isFomoV2BackersEnabled } from "./backersApi";

type FundsListResponse = {
  isSuccess: boolean;
  funds: Array<IProject>;
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

const emptyResponse: FundsListResponse = {
  isSuccess: false,
  funds: [],
  total: 0,
};

export default async function fetchBackersFundsByQuery(
  query = ""
): Promise<FundsListResponse> {
  if (!isFomoV2BackersEnabled()) {
    return fetchFundsByQuery(query);
  }

  try {
    const { data, res } = await fetchFomoV2Backers("funds", query);
    const funds = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.funds)
        ? data.funds
        : [];
    const total = Number(data?.total ?? data?.totalCount ?? 0);

    return {
      isSuccess: res.ok && !data?.message,
      funds,
      total,
      page: data?.page,
      limit: data?.limit,
      totalPages: data?.totalPages,
    };
  } catch {
    return emptyResponse;
  }
}
