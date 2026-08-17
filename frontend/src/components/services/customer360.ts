import getAccessToken from "../utils/getAccessToken";
import { configureUrl } from "./config";

const authHeaders = () => ({
  Authorization: `Bearer ${getAccessToken()}`,
  "Content-Type": "application/json",
});

const req = async <T>(path: string, method = "GET", body?: any): Promise<{ success: boolean; data: T | any }> => {
  try {
    const res = await fetch(configureUrl(path), {
      method,
      headers: authHeaders(),
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { success: res.ok, data };
  } catch (e) {
    return { success: false, data: null };
  }
};

export const fetchDossierSummary = (id: string) => req<any>(`user/${id}/admin-dossier?section=summary`, "GET");
export const fetchUserById = (id: string) => req<any>(`user/${id}`, "GET");
export const fetchUserBadgesAdmin = (id: string) => req<any>(`users/${id}/badges`, "GET");

/**
 * Canonical Content Influence read-model for a user (explainability).
 * Powers the Customer 360 "Content & Influence" block: summary, 7d/30d/all
 * rollups, top-performing topics, XP milestone timeline (from the XP Ledger)
 * and anti-farming exclusion counters.
 */
export const fetchUserInfluence = (id: string) =>
  req<any>(`admin/comments/users/${id}/influence`, "GET");

export const muteUser = (id: string, reason: string, days: number) =>
  req<any>(`admin/users/${id}/mute`, "POST", { reason, days });
export const unmuteUser = (id: string) => req<any>(`admin/users/${id}/unmute`, "POST");
export const suspendUser = (id: string, reason: string, days: number) =>
  req<any>(`admin/users/${id}/suspend`, "POST", { reason, days });
export const unsuspendUser = (id: string) => req<any>(`admin/users/${id}/unsuspend`, "POST");
export const softDeleteUser = (id: string, reason: string) =>
  req<any>(`admin/users/${id}/soft-delete`, "POST", { reason });
export const restoreUser = (id: string) => req<any>(`admin/users/${id}/restore`, "POST");
export const deleteUserHard = (id: string) => req<any>(`user/${id}`, "DELETE");
export const createUserInvite = (email: string, userId?: string, reason?: string) =>
  req<any>(`admin/invites`, "POST", { email, userId, reason });
export const fetchInvites = () => req<any>(`admin/invites`, "GET");
export const fetchTimeline = (id: string, type = "all") => req<any>(`user/${id}/timeline?type=${type}`, "GET");
export const fetchMasterList = (params: Record<string, any>) => {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return req<any>(`admin/users/master-list${qs ? `?${qs}` : ""}`, "GET");
};

/**
 * Paged per-tab dossier section for Customer 360.
 * sections: portfolios | otc | p2p | withdraws | deposits | comments | support | appeals | logs
 * Returns { items, total, offset, limit, hasMore }.
 */
export type DossierSection =
  | "portfolios" | "otc" | "p2p" | "withdraws" | "deposits"
  | "comments" | "support" | "appeals" | "logs";

export const fetchDossierSection = (
  id: string,
  section: DossierSection,
  offset = 0,
  limit = 10
) => req<any>(`user/${id}/admin-dossier?section=${section}&offset=${offset}&limit=${limit}`, "GET");
