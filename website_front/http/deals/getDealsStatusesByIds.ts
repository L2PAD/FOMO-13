import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

type DealStatusSnapshot = {
  _id: string;
  status: string;
  isAppeal?: boolean;
  isReservedFunds?: boolean;
  isMakePayment?: boolean;
  isCompleteByAdmin?: boolean;
  lastStatusUpdate?: string | Date;
};

const getDealsStatusesByIds = async (
  ids: string[]
): Promise<{ isSuccess: boolean; deals: DealStatusSnapshot[] }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/deals/statuses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids }),
    });

    if (res.status >= 300) {
      return { isSuccess: false, deals: [] };
    }

    const data = await res.json();

    return {
      isSuccess: true,
      deals: data?.deals || [],
    };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, deals: [] };
  }
};

export default getDealsStatusesByIds;
