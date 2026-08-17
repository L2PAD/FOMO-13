import { API } from "../../config/api";
import { ICollection } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  collectionId: string
): Promise<{ isSuccess: boolean; collection: ICollection | null }> => {
  try {
    const accessToken: string | null = getAuthToken();
    if (!accessToken) {
      return { isSuccess: false, collection: null };
    }

    const res = await fetch(`${API}/collections/${collectionId}/view`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, collection: data || null };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, collection: null };
  }
};
