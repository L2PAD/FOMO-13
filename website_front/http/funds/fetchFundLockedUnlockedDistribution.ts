import { API } from "../../config/api";
import {
  FundLockedUnlockedDistributionItem,
} from "../../types/global_types";
import getAuthToken from "../getAuthToken";
import { fetchFomoV2Funds, isFomoV2FundsDetailEnabled } from "./fundsV2Api";

export interface FundLockedUnlockedDistributionResponse {
  ok: boolean;
  items: Array<FundLockedUnlockedDistributionItem>;
  total: number;
}

export default async function fetchFundLockedUnlockedDistribution(
  id: string
): Promise<FundLockedUnlockedDistributionResponse> {
  if (!id) {
    return { ok: false, items: [], total: 0 };
  }

  if (isFomoV2FundsDetailEnabled()) {
    try {
      const { data, res } = await fetchFomoV2Funds(
        `${encodeURIComponent(id)}/locked-unlocked-token-distribution`
      );

      if (res.ok && data?.ok !== false && !data?.message) {
        return {
          ok: Boolean(data?.ok ?? true),
          items: Array.isArray(data?.items) ? data.items : [],
          total: Number(data?.total || 0),
        };
      }
    } catch (error) {
      console.log(error);
    }
  }

  try {
    const accessToken: string | null = getAuthToken();
    const res = await fetch(
      `${API}/funds/${encodeURIComponent(id)}/locked-unlocked-token-distribution`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await res.json();

    return {
      ok: res.status < 300 && Boolean(data?.ok),
      items: Array.isArray(data?.items) ? data.items : [],
      total: Number(data?.total || 0),
    };
  } catch (error) {
    console.log(error);

    return { ok: false, items: [], total: 0 };
  }
}
