import { API } from "../../config/api";
import { IComment } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  id: string,
  reason?: string
): Promise<{ isSuccess: boolean; error: string }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/comments/report/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason: reason || "other" }),
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, error: data?.message || "" };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, error: "" };
  }
};
