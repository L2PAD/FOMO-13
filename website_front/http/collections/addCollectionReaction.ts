import { API } from "../../config/api";
import { ICollection } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

type ActionType = "like" | "dislike";

export default async (
  collectionId: string,
  action: ActionType
): Promise<{ isSuccess: boolean; collection: ICollection | null }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/collections/action/${action}/${collectionId}`, {
      method: "PATCH",
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
