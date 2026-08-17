import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export default async (
  slug: string
): Promise<{
  isSuccess: boolean;
  investor: any | null;
}> => {
  if (!slug) {
    return { isSuccess: false, investor: null };
  }

  try {
    const accessToken: string | null = getAuthToken();
    const res = await fetch(`${API}/investors/${encodeURIComponent(slug)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();

    return {
      isSuccess: res.status < 300 && Boolean(data?.ok),
      investor: data?.investor || null,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, investor: null };
  }
};
