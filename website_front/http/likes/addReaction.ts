import { API } from "../../config/api";
import { INews } from "../../types/global_types";
import getAccessToken from "../getAuthToken";

export type actionType = "like" | "dislike";

export type EntityTypes = "projects" | "persons" | "funds" | "user";
export type FomoV2ReactionEntity = "canonicalProject" | "backer";

export default async (
  entity: EntityTypes,
  action: actionType,
  id: string
): Promise<{ isSuccess: boolean; news: INews | null }> => {
  try {
    const accessToken: string | null = getAccessToken();

    const res = await fetch(`${API}/${entity}/action/${action}/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, news: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, news: null };
  }
};

export const addFomoV2Reaction = async (
  entity: FomoV2ReactionEntity,
  action: actionType,
  id: string
): Promise<{ isSuccess: boolean; data: any | null }> => {
  try {
    const accessToken: string | null = getAccessToken();

    const res = await fetch(`${API}/fomo-v2/reactions/${entity}/${id}/${action}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, data: null };
  }
};
