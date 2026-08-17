import { API } from "../../config/api";
import { IPerson } from "../../types/global_types";
import { configureFetchForm } from "../../helpers/fetchConfig";
import getAuthToken from "../getAuthToken";

export default async (
  actionType: "investedProjects" | "claimedProjects",
  projectId: string
): Promise<{ isSuccess: boolean; error: string }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/user/project/${actionType}/${projectId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return { isSuccess: !data?.message, error: data?.message || "" };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, error: "" };
  }
};
