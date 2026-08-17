import { API } from "../../config/api";
import { ICollection, ICreateCollectionNft } from "../../types/global_types";
import { configureFetchForm } from "../../helpers/fetchConfig";
import getAuthToken from "../getAuthToken";

export default async (
  nftData: ICreateCollectionNft
): Promise<{ isSuccess: boolean; collections: Array<ICollection> }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/collectionNft`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nftData),
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, collections: data || [] };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, collections: [] };
  }
};
