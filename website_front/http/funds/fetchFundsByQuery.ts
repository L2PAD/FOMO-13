import { API } from "../../config/api";
import { IProject } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  query: string
): Promise<{
  isSuccess: boolean;
  funds: Array<IProject>;
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}> => {
  try {
    const accessToken: string | null = getAuthToken();

    let path: string = `${API}/funds/${query}`;

    const res = await fetch(path, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return {
      isSuccess: !data?.message,
      funds: data?.items || [],
      total: data?.total ?? data?.totalCount ?? 0,
      page: data?.page,
      limit: data?.limit,
      totalPages: data?.totalPages,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, funds: [], total: 0 };
  }
};
