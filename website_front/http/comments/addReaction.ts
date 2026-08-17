import { API } from "../../config/api";
import { IComment } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  id: string,
  action: "like" | "dislike"
): Promise<{
  isSuccess: boolean;
  error: string;
  comment: IComment | undefined;
}> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/comments/${action}/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      error: data?.message || "",
      comment: data,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, error: "", comment: undefined };
  }
};
