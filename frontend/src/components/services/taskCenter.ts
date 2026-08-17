import getAccessToken from '../utils/getAccessToken';
import { localApi } from './config';

const authHeaders = (): Record<string, string> => ({
  Authorization: `Bearer ${getAccessToken()}`,
});

const getJson = async (path: string): Promise<any> => {
  const res = await fetch(`${localApi}/${path}`, {
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
};

export const fetchTaskOverview = (days = 30) =>
  getJson(`tasks/admin/overview?days=${days}`);

export const fetchTaskAnalytics = (days = 30) =>
  getJson(`tasks/admin/analytics?days=${days}`);

export const fetchTaskReviewQueue = () => getJson('tasks/admin/review-queue');

export const fetchTaskMetricsCatalog = () => getJson('tasks/admin/metrics-catalog');

export const fetchAdminTasks = (group: 'global' | 'earlyland', activityId?: string) =>
  getJson(`tasks/admin/list?group=${group}${activityId ? `&activityId=${activityId}` : ''}`);

export const fetchUserTasks = (userId: string) =>
  getJson(`tasks/admin/user/${userId}`);

export const fetchDiagnostics = () => getJson('tasks/admin/diagnostics');

export const fetchEarlyLandFunnel = (days = 30) =>
  getJson(`tasks/admin/earlyland-funnel?days=${days}`);

export const archiveTask = async (id: string): Promise<{ success: boolean }> => {
  try {
    const res = await fetch(`${localApi}/tasks/${id}/archive`, {
      method: 'PUT', headers: authHeaders(), credentials: 'include',
    });
    return { success: res.ok };
  } catch { return { success: false }; }
};

export const unarchiveTask = async (id: string): Promise<{ success: boolean }> => {
  try {
    const res = await fetch(`${localApi}/tasks/${id}/unarchive`, {
      method: 'PUT', headers: authHeaders(), credentials: 'include',
    });
    return { success: res.ok };
  } catch { return { success: false }; }
};

export interface CreateGlobalTaskInput {
  name: string;
  points: number;
  metric: string;
  operator: string;
  targetValue: number;
  completionMode: string;
}

export const createGlobalTask = async (
  input: CreateGlobalTaskInput,
): Promise<{ success: boolean }> => {
  const form = new FormData();
  form.append('type', 'special');
  form.append('name', input.name);
  form.append('points', String(input.points));
  form.append('goal', String(input.targetValue));
  form.append('targetValue', String(input.targetValue));
  form.append('metric', input.metric);
  form.append('operator', input.operator);
  form.append('completionMode', input.completionMode);
  const res = await fetch(`${localApi}/tasks`, {
    method: 'POST',
    headers: authHeaders(),
    credentials: 'include',
    body: form,
  });
  return { success: res.status < 300 };
};

export const confirmTaskReview = async (
  userId: string,
  taskId: string,
  points: number,
): Promise<{ success: boolean }> => {
  const res = await fetch(
    `${localApi}/tasks/request/confirm/${userId}/${taskId}/${points}`,
    { method: 'PUT', headers: authHeaders(), credentials: 'include' },
  );
  return { success: res.status < 300 };
};

export const rejectTaskReview = async (
  userId: string,
  taskId: string,
  points: number,
  reason = '',
): Promise<{ success: boolean }> => {
  const res = await fetch(
    `${localApi}/tasks/request/reject/${userId}/${taskId}/${points}`,
    {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    },
  );
  return { success: res.status < 300 };
};

export const deleteTaskById = async (id: string): Promise<{ success: boolean }> => {
  const res = await fetch(`${localApi}/tasks/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
    credentials: 'include',
  });
  return { success: res.status < 300 };
};
