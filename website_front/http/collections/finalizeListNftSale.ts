import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

interface IFinalizePayload {
  tokenAddress: string;
  nftId: number;
}

export default async (
  payload: IFinalizePayload
): Promise<{ isSuccess: boolean; removedCount: number }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/collectionNft/finalize`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      removedCount: Number(data?.removedCount || 0),
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, removedCount: 0 };
  }
};
