import { API } from "../../config/api";
import { IPerson } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (): Promise<{
  isSuccess: boolean;
  persons: Array<IPerson>;
  total: number;
}> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/persons`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();
    return {
      isSuccess: !data?.message,
      persons: data?.items || [],
      total: data?.totalCount || 0,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, persons: [], total: 0 };
  }
};
