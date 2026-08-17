import { API } from "../../config/api";
import { ICollectionNft } from "../../types/global_types";

export default async (
  id: string
): Promise<{ isSuccess: boolean; nft: ICollectionNft }> => {
  try {
    const res = await fetch(`${API}/collectionNft/${id}`, {
      method: "GET",
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, nft: data || ({} as ICollectionNft) };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, nft: {} as ICollectionNft };
  }
};
