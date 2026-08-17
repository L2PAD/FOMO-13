import { API } from "../../config/api";
import { IDeal } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

const getDealById = async (
  id: string
): Promise<{ isSuccess: boolean; deal: IDeal | null }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/deals/item/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status >= 300) {
      return { isSuccess: false, deal: null };
    }

    const data = await res.json();

    return { isSuccess: true, deal: data || null };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, deal: null };
  }
};

export default getDealById;
