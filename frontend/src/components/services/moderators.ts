import getAccessToken from "../utils/getAccessToken";
import { configureUrl } from "./config";

const authHeaders = () => ({
  Authorization: `Bearer ${getAccessToken()}`,
  "Content-Type": "application/json",
});

const req = async <T>(
  path: string,
  method = "GET",
  body?: any
): Promise<{ success: boolean; data: T | any; status: number }> => {
  try {
    const res = await fetch(configureUrl(path), {
      method,
      headers: authHeaders(),
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { success: res.ok && data?.success !== false, data: data?.data ?? data, status: res.status };
  } catch (e) {
    return { success: false, data: null, status: 0 };
  }
};

export interface ModeratorStats {
  confirmed: number;
  rejected: number;
  totalHandled: number;
  approvalRate: number;
}

export interface ModeratorRow {
  _id: string;
  email: string;
  name: string;
  username: string;
  avatar: string;
  wallet: string;
  role: "admin" | "moderator" | string;
  roles: string[];
  status: "active" | "blocked" | "inactive" | string;
  is2FAEnabled: boolean;
  lastLogin: string | null;
  createdAt: string | null;
  openTasks: number;
  stats: ModeratorStats;
}

export interface ModeratorTask {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "done";
  dueDate: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface ModeratorsOverview {
  totalModerators: number;
  totalAdmins: number;
  activeModerators: number;
  pendingQueue: number;
  totalHandled: number;
  totalConfirmed: number;
  totalRejected: number;
  approvalRate: number;
}

export const listModerators = () =>
  req<{ rows: ModeratorRow[]; moderators: ModeratorRow[]; admins: ModeratorRow[]; overview: ModeratorsOverview }>(
    "user/admin/moderators"
  );

export const getModeratorDetail = (id: string) =>
  req<ModeratorRow & { bio: string; tasks: ModeratorTask[]; recentActions: any[] }>(
    `user/admin/moderators/${id}`
  );

export const createModerator = (body: { email: string; password: string; name?: string; wallet?: string }) =>
  req<ModeratorRow>("user/admin/moderators", "POST", body);

export const updateModerator = (
  id: string,
  body: { status?: string; name?: string; wallet?: string; role?: string }
) => req<ModeratorRow>(`user/admin/moderators/${id}`, "PATCH", body);

export const deleteModerator = (id: string) =>
  req<{ _id: string }>(`user/admin/moderators/${id}`, "DELETE");

export const addModeratorTask = (
  id: string,
  body: { title: string; description?: string; priority?: string; dueDate?: string | null }
) => req<ModeratorTask>(`user/admin/moderators/${id}/tasks`, "POST", body);

export const updateModeratorTask = (id: string, taskId: string, body: Partial<ModeratorTask>) =>
  req<ModeratorTask>(`user/admin/moderators/${id}/tasks/${taskId}`, "PATCH", body);

export const deleteModeratorTask = (id: string, taskId: string) =>
  req<{ _id: string }>(`user/admin/moderators/${id}/tasks/${taskId}`, "DELETE");
