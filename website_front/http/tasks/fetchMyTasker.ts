import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export interface TaskerItem {
  taskId: string;
  name: string;
  activityId: string | null;
  accessTier: "public" | "prime" | string;
  completionMode: string;
  taskerState: string;
  state: string;
  addedToTasker: boolean;
  addedAt: string | null;
  xp: number;
  progressPercent: number;
  date: string | null;
  deadline: string | null;
  completedAt: string | null;
}

export interface TaskerResponse {
  kpis: {
    total: number;
    added: number;
    inProgress: number;
    review: number;
    completed: number;
    xpEarned: number;
  };
  items: TaskerItem[];
  board: {
    added: TaskerItem[];
    in_progress: TaskerItem[];
    review: TaskerItem[];
    completed: TaskerItem[];
  };
  calendar: Array<{ taskId: string; name: string; date: string; taskerState: string; xp: number }>;
}

const EMPTY: TaskerResponse = {
  kpis: { total: 0, added: 0, inProgress: 0, review: 0, completed: 0, xpEarned: 0 },
  items: [],
  board: { added: [], in_progress: [], review: [], completed: [] },
  calendar: [],
};

export default async (): Promise<{ isSuccess: boolean; data: TaskerResponse }> => {
  try {
    const accessToken = getAuthToken();
    const res = await fetch(`${API}/tasks/my/tasker`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok || data?.message) return { isSuccess: false, data: EMPTY };
    return { isSuccess: true, data: { ...EMPTY, ...data } };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, data: EMPTY };
  }
};
