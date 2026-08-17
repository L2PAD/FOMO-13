import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export interface ActivityTask {
  id: string;
  title: string;
  description: string;
  activity: string;
  xpReward: number;
  difficulty: string;
  access: string;
  completionMode: string;
  deadline: string | null;
  status: string;
  taskerState: string;
  addedToTasker: boolean;
  canRemove: boolean;
  claimable: boolean;
  progress: { value: number; goal: number; percent: number };
  stepsTotal: number;
  stepsDone: number;
}

export default async (
  activityId: string
): Promise<{ isSuccess: boolean; data: ActivityTask[] }> => {
  try {
    const accessToken = getAuthToken();
    if (!accessToken) return { isSuccess: false, data: [] };
    const res = await fetch(`${API}/tasks/my/activity/${activityId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok || !Array.isArray(data)) return { isSuccess: false, data: [] };
    return { isSuccess: true, data };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, data: [] };
  }
};
