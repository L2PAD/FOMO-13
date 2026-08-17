import { API } from "../../config/api";
import { IBoard } from "../../types/global_types";
import { configureFetchForm } from "../../helpers/fetchConfig";
import getAuthToken from "../getAuthToken";

export default async (
  type?: string
): Promise<{ isSuccess: boolean; boards: Array<IBoard> }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const path = type ? `/boards/${type}` : `/boards`;

    const res = await fetch(`${API}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, boards: data || [] };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, boards: [] };
  }
};
