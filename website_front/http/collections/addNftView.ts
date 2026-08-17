import { API } from "../../config/api";
import { ICollectionNft } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  id: string
): Promise<{ isSuccess: boolean; nft: ICollectionNft | object }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/collectionNft/view/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, nft: data || {} };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, nft: {} };
  }
};
