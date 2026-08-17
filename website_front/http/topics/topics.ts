import { API } from "../../config/api";

export interface IPublicTopic {
  _id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  colorKey?: string;
  status: string;
  sortOrder: number;
  postsCount?: number;
  followersCount?: number;
}

export const fetchPublicTopics = async (): Promise<IPublicTopic[]> => {
  try {
    const res = await fetch(`${API}/topics`, { method: "GET" });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("fetchPublicTopics", error);
    return [];
  }
};

export interface IPublicCategory {
  _id: string;
  name: string;
  type: string;
}

// Admin-editable Buzz post categories (categories registry, type=buzz_topic_category).
export const fetchPublicCategories = async (): Promise<IPublicCategory[]> => {
  try {
    const res = await fetch(`${API}/categories?type=buzz_topic_category`, {
      method: "GET",
    });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("fetchPublicCategories", error);
    return [];
  }
};
