import { API } from "../../config/api";
import { IComment } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  path: string,
  commentData: Partial<IComment> & Record<string, any>
): Promise<{
  isSuccess: boolean;
  error: string;
  comment: IComment | undefined;
}> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commentData),
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
