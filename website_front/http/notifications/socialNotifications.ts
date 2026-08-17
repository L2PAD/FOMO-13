import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export interface ISocialNotification {
  id: string;
  type: "REPOST" | "REPLY" | "LIKE" | "FOLLOW" | "QUOTE";
  actor: { id: string; name: string; userName: string | null; image: string | null };
  topicId: string | null;
  commentId: string | null;
  preview: string;
  read: boolean;
  createdAt: string;
}

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchSocialNotifications = async (
  limit = 30
): Promise<ISocialNotification[]> => {
  try {
    const res = await fetch(`${API}/notifications/social?limit=${limit}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const fetchUnreadCount = async (): Promise<number> => {
  try {
    const res = await fetch(`${API}/notifications/social/unread-count`, {
      headers: authHeaders(),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return Number(data?.unread || 0);
  } catch {
    return 0;
  }
};

export const markSocialRead = async (ids?: string[]): Promise<number> => {
  try {
    const res = await fetch(`${API}/notifications/social/read`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ids || [] }),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return Number(data?.unread || 0);
  } catch {
    return 0;
  }
};
