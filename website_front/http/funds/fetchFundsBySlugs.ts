import { API } from "../../config/api";
import { IFund } from "../../types/global_types";
import { fetchFomoV2Funds, isFomoV2FundsDetailEnabled } from "./fundsV2Api";

export default async function fetchFundsBySlugs(
  slugs: string[]
): Promise<{ isSuccess: boolean; funds: IFund[] }> {
  const uniqueSlugs = Array.from(new Set(slugs.filter(Boolean)));

  if (!uniqueSlugs.length) {
    return { isSuccess: true, funds: [] };
  }

  if (isFomoV2FundsDetailEnabled()) {
    try {
      const params = new URLSearchParams({
        slugs: uniqueSlugs.join(","),
        limit: String(uniqueSlugs.length),
      });
      const { data, res } = await fetchFomoV2Funds(
        "project/public",
        `?${params.toString()}`
      );

      if (res.ok && data?.ok !== false && !data?.message) {
        return {
          isSuccess: true,
          funds: Array.isArray(data?.items) ? data.items : [],
        };
      }
    } catch (error) {
      console.log(error);
    }
  }

  try {
    const params = new URLSearchParams({
      slugs: uniqueSlugs.join(","),
      limit: String(uniqueSlugs.length),
    });
    const res = await fetch(
      `${API}/funds/project/public?${params.toString()}`,
      {
        method: "GET",
      }
    );
    const data = await res.json();

    return {
      isSuccess: res.status < 300 && !data?.message,
      funds: res.status < 300 ? data?.items || [] : [],
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, funds: [] };
  }
}
