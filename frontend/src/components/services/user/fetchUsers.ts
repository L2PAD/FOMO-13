import { configureUrl } from "../config";
import getAccessToken from "../../utils/getAccessToken";
import { IUser } from "../../types/global_types";

const fetchUsers = async (
  limit: number | string,
  itemId: string,
  search?: string
): Promise<{ isSuccess: boolean; users: Array<IUser>; total: number }> => {
  try {
    const accessToken: string | null = getAccessToken();
    const url = new URL(configureUrl(`user/board/active/${limit}/${itemId}`));

    if (search && search.trim()) {
      url.searchParams.append("search", search.trim());
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return {
      isSuccess: !data?.message,
      users: data.users || data,
      total: data.total || 0,
    };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, users: [], total: 0 };
  }
};

export default fetchUsers;
