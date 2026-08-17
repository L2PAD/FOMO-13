import { API } from "../../config/api";
import { IUpdateBoard } from "../../types/global_types";
import { configureFetchForm } from "../../helpers/fetchConfig";
import getAuthToken from "../getAuthToken";

export default async (
  boardData: IUpdateBoard,
  id: string
): Promise<{ isSuccess: boolean; error: string }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/boards/columns/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(boardData),
    });

    const data = await res.json();

    return { isSuccess: !data?.message, error: data?.message || "" };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, error: "" };
  }
};
