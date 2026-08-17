import { API } from "../../config/api";

export interface PublicBadge {
  code: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  rarity?: string;
  awardMode?: string;
  hiddenProgress?: boolean;
  displayPriority?: number;
}

/** Public Badge Engine catalog (all active + public badges). No auth required. */
export const fetchAllBadges = async (): Promise<PublicBadge[]> => {
  try {
    const res = await fetch(`${API}/badges`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
};

export default fetchAllBadges;
