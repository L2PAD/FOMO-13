import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export interface TaskDetailStep {
  id: string;
  order: number;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  estimatedMinutes: number;
  optional: boolean;
  done: boolean;
}

export interface TaskDetail {
  id: string;
  title: string;
  description: string;
  activity: { id: string; title: string; slug: string; accessTier: string } | null;
  scope: string;
  xpReward: number;
  difficulty: string;
  estimatedMinutes: number;
  access: string;
  completionMode: string;
  repeat: string;
  deadline: string | null;
  link: string;
  metric: string;
  progress: { value: number; goal: number; percent: number; connected: boolean };
  status: string;
  taskerState: string;
  addedToTasker: boolean;
  claimable: boolean;
  canRemove: boolean;
  steps: TaskDetailStep[];
  stepsTotal: number;
  stepsDone: number;
  actions: string[];
  rejectionReason: string;
  clarificationRequest: string;
  completedAt: string | null;
}

export default async (
  taskId: string
): Promise<{ isSuccess: boolean; data: TaskDetail | null }> => {
  try {
    const accessToken = getAuthToken();
    if (!accessToken) return { isSuccess: false, data: null };
    const res = await fetch(`${API}/tasks/detail/${taskId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok || !data?.id) return { isSuccess: false, data: null };
    return { isSuccess: true, data };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, data: null };
  }
};
