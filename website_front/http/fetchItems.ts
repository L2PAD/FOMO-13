import { API } from "../config/api";
import { IProject } from "../types/global_types";
import { configureFetchForm } from "../helpers/fetchConfig";
import getAuthToken from "./getAuthToken";

export default async (
  path: string
): Promise<{
  isSuccess: boolean;
  data: any;
}> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      data,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, data: {} };
  }
};
