import { API } from "../../config/api";
import { IProject } from "../../types/global_types";
import { configureFetchForm } from "../../helpers/fetchConfig";
import getAuthToken from "../getAuthToken";

export default async (): Promise<{
  isSuccess: boolean;
  projects: Array<IProject>;
}> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/projects/all/user`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, projects: data || [] };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, projects: [] };
  }
};
