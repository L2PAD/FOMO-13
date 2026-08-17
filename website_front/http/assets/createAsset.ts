import { API } from "../../config/api";
import { IGlobalAsset } from "../../types/global_types";
import { configureFetchForm } from "../../helpers/fetchConfig";
import getAuthToken from "../getAuthToken";

export default async (
  portfolioId: string | undefined,
  assetData: IGlobalAsset
): Promise<{ isSuccess: boolean; error: string }> => {
  try {
    const accessToken: string | null = getAuthToken();

    let path = `${API}/portfolio/assets`

    if (portfolioId) path = path + `?id=${portfolioId}`

    const res = await fetch(path, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(assetData),
    });

    const data = await res.json();

    return {
      isSuccess: res.ok && !data?.message,
      error: data?.message || "",
    };
  } catch (error) {
    return { isSuccess: false, error: "" };
  }
};
