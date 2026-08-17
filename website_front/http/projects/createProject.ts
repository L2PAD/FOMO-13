import { API } from "../../config/api";
import { IProject } from "../../types/global_types";
import { configureFetchForm } from "../../helpers/fetchConfig";
import getAuthToken from "../getAuthToken";

export default async (
  projectData: IProject
): Promise<{ isSuccess: boolean; error: string }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const { body } = configureFetchForm("POST", projectData, {});

    const res = await fetch(`${API}/projects/user`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: body,
    });

    const data = await res.json();

    return { isSuccess: !data?.message, error: data?.message || "" };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, error: "" };
  }
};
