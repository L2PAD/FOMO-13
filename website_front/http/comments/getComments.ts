import { API } from "../../config/api";
import { IComment } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  path: string
): Promise<{
  isSuccess: boolean;
  comments: Array<IComment>;
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
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
    const comments = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.comments)
          ? data.comments
          : [];

    return {
      isSuccess: res.status < 300,
      comments,
      total: typeof data?.total === "number" ? data.total : comments.length,
      page: typeof data?.page === "number" ? data.page : undefined,
      limit: typeof data?.limit === "number" ? data.limit : undefined,
      hasMore:
        typeof data?.hasMore === "boolean" ? data.hasMore : undefined,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, comments: [] };
  }
};
