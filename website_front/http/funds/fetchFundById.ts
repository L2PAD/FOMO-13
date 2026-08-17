import { API } from "../../config/api";
import { IFund } from "../../types/global_types";
import { fetchFomoV2Funds, isFomoV2FundsDetailEnabled } from "./fundsV2Api";

const fetchLegacyFundById = async (
  id: string
): Promise<{ isSuccess: boolean; fund: IFund | null; status?: number }> => {
  if (!id) {
    return { isSuccess: false, fund: null };
  }

  try {
    const res = await fetch(`${API}/funds/${encodeURIComponent(id)}`, {
      method: "GET",
    });

    const data = await res.json();
    const fund = data?.fund || data;

    return {
      isSuccess: res.status < 300 && !data?.message,
      fund: res.status < 300 ? fund : null,
      status: res.status,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, fund: null };
  }
};

export default async (
  id: string
): Promise<{ isSuccess: boolean; fund: IFund | null; status?: number }> => {
  if (!id) {
    return { isSuccess: false, fund: null };
  }

  if (!isFomoV2FundsDetailEnabled()) {
    return fetchLegacyFundById(id);
  }

  try {
    const { data, res } = await fetchFomoV2Funds(encodeURIComponent(id));
    const fund = data?.fund || data;

    if (res.ok && data?.ok !== false && fund && !data?.message) {
      return {
        isSuccess: true,
        fund,
        status: res.status,
      };
    }
  } catch (error) {
    console.log(error);
  }

  return fetchLegacyFundById(id);
};
