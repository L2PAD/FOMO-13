import { API } from "../../config/api";

export interface PublicUserBadge {
  code: string;
  name: string;
  icon?: string;
  rarity?: string;
  category?: string;
  earned?: boolean;
  earnedAt?: string | null;
  featured?: boolean;
}

/** Public endpoint — returns a user's earned platform badges (Badge Engine). */
export default async (userId: string): Promise<PublicUserBadge[]> => {
  try {
    if (!userId) return [];
    const res = await fetch(`${API}/users/${encodeURIComponent(userId)}/badges`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.badges) ? data.badges : [];
  } catch (error) {
    console.log(error);
    return [];
  }
};
