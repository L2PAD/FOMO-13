import { API } from "../../config/api";
import { IOtcMember } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

const getMemberById = async (
  id: string
): Promise<{ isSuccess: boolean; member: IOtcMember | null }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/deals/member/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status >= 300) {
      return { isSuccess: false, member: null };
    }

    const data = await res.json();

    return { isSuccess: true, member: data || null };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, member: null };
  }
};

export default getMemberById;
