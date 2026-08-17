import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export interface IUserRepost {
  _id: string;
  topicName?: string;
  text?: string;
  bodyHtml?: string;
  images?: string[];
  coverImage?: string;
  mediaUrls?: string[];
  tags?: string[];
  date?: string;
  author?: any;
  repostsCount?: number;
  replyCount?: number;
}

// Topics a user has reposted into their Follow Me feed.
export const fetchUserReposts = async (userId: string): Promise<IUserRepost[]> => {
  try {
    const token = getAuthToken();
    const res = await fetch(`${API}/comments/reposts/user/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
};
