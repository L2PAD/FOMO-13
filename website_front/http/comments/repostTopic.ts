import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export interface IRepostResult {
  isSuccess: boolean;
  reposted: boolean;
  repostsCount: number;
  error: string;
}

// Toggle a repost on a topic (auth + feed-access required server-side).
export const repostTopic = async (id: string): Promise<IRepostResult> => {
  try {
    const accessToken = getAuthToken();
    const res = await fetch(`${API}/comments/repost/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    return {
      isSuccess: res.status < 300,
      reposted: Boolean(data?.reposted),
      repostsCount: Number(data?.repostsCount || 0),
      error: data?.message || "",
    };
  } catch (error) {
    console.error("repostTopic", error);
    return { isSuccess: false, reposted: false, repostsCount: 0, error: "" };
  }
};

// Topics a user has reposted — powers the Fomies FOMO block.
export const fetchUserReposts = async (userId: string): Promise<any[]> => {
  try {
    const accessToken = getAuthToken();
    const res = await fetch(`${API}/comments/reposts/user/${userId}`, {
      method: "GET",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("fetchUserReposts", error);
    return [];
  }
};

export default repostTopic;
