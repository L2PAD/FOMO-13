import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export interface IFeedAccess {
  capability: string;
  allowed: boolean;
  membership: { active: boolean; expiresAt: string | null };
  sources: Array<{ type: string; expiresAt?: string | null }>;
  reason: string | null;
}

export const fetchFeedAccess = async (): Promise<IFeedAccess> => {
  try {
    const token = getAuthToken();
    const res = await fetch(`${API}/comments/feed/access`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return (await res.json()) as IFeedAccess;
  } catch (error) {
    console.error("fetchFeedAccess", error);
    return {
      capability: "BUZZ_FEED_ACCESS",
      allowed: false,
      membership: { active: false, expiresAt: null },
      sources: [],
      reason: "error",
    };
  }
};
