import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export default async (): Promise<{
  isSuccess: boolean;
  keywords: string[];
}> => {
  try {
    const token: string | null = getAuthToken();

    const res = await fetch(`${API}/socialparcing/keywords/random`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, keywords: data };
  } catch (error) {
    console.error(error);
    return { isSuccess: false, keywords: [] };
  }
};
