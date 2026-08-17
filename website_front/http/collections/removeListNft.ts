import { API } from "../../config/api";
import { ICollection, ICreateCollectionNft } from "../../types/global_types";
import { configureFetchForm } from "../../helpers/fetchConfig";
import getAuthToken from "../getAuthToken";

export default async (
  id: string
): Promise<{ isSuccess: boolean; nftData: any }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/collectionNft/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, nftData: data || {} };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, nftData: {} };
  }
};
