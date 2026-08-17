import getAccessToken from "../utils/getAccessToken";
import { configureUrl } from "./config";

const authHeaders = () => ({ Authorization: `Bearer ${getAccessToken()}`, "Content-Type": "application/json" });

const req = async <T = any>(path: string, method = "GET", body?: any): Promise<{ success: boolean; data: T | any; status: number }> => {
  try {
    const res = await fetch(configureUrl(path), {
      method, headers: authHeaders(), credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    return { success: res.ok && json?.success !== false, data: json?.data ?? json, status: res.status };
  } catch {
    return { success: false, data: null, status: 0 };
  }
};

/* ── Messages (public Support Request Form submissions) ── */
export interface SupportMessage {
  _id: string; date: string; theme: string; message: string; category?: string; file?: string;
  userData?: { _id: string; username?: string; wallet?: string; photo?: string };
  projectData?: { _id: string; name?: string };
}
export const getSupportMessages = () => req<SupportMessage[]>("support");

/* ── Reports (complaints about users) ── */
export interface UserReport {
  _id: string; type: string; subType?: string; body?: string; attachment?: string; createdAt?: string;
  user?: { _id: string; username?: string; wallet?: string; photo?: string };
  creator?: { _id: string; username?: string; wallet?: string; photo?: string };
}
export const getReports = (q: Record<string, string> = {}) => {
  const s = new URLSearchParams(q).toString();
  return req("reports" + (s ? "?" + s : ""));
};

/* ── Reported comments ── */
export const getReportedComments = () => req("comments/admin/reported");
export const deleteComment = (id: string) => req(`comments/admin/delete/${id}`, "DELETE");

/* ── OTC / P2P Appeals (disputes) — backend is fixed, do NOT change it ── */
export type AppealStatusFilter = "all" | "open" | "in_review" | "resolved";
export interface AppealUser { _id: string; username?: string; wallet?: string; photo?: string; role?: string[] }
export interface AppealDeal {
  _id: string; dealId: number; type: string; section: string; status: string; isAppeal?: boolean;
  isReservedFunds?: boolean; isMakePayment?: boolean; ticker?: string; price?: number; amount?: number; date?: string;
  creator?: AppealUser; buyer?: AppealUser; seller?: AppealUser; chatId?: string;
}
export interface Appeal {
  _id: string; appealId?: string; status: "open" | "in_review" | "resolved"; role?: string;
  reason?: string; description?: string; email?: string; attachments?: string[];
  supportChatId?: string | null; resolution?: string; txHash?: string;
  resolvedBy?: string | null; resolvedAt?: string | null; createdAt?: string; updatedAt?: string;
  creator?: AppealUser; assignedTo?: AppealUser | null; deal?: AppealDeal;
}
export const listAppeals = (status: AppealStatusFilter = "all", limit = 30, offset = 0) =>
  req<{ appeals: Appeal[]; total: number }>(`deals/appeals?status=${status}&limit=${limit}&offset=${offset}`);
export const getDealForStaff = (dealId: string) => req(`deals/admin/item/${dealId}`);
export const createAppealSupportChat = (appealId: string) => req(`deals/appeal/support-chat/${appealId}`, "POST", {});
export const resolveAppeal = (appealId: string, body: {
  resolution?: string; forceCloseDeal?: boolean; recipient?: "escrow_funder" | "buyer"; feeMode?: "with_fee" | "without_fee"; txHash?: string;
}) => req(`deals/appeal/resolve/${appealId}`, "POST", body);
export const forceCompleteDeal = (dealId: string) => req(`deals/complete/forcedly/${dealId}`, "POST", {});

/* ── Chat (staff can read any chat + its messages) ── */
export interface ChatMessage {
  _id: string; from: string; to?: string; message: string; date?: string; createdAt?: string;
  isSystem?: boolean; systemType?: string; attachments?: string[];
}
export interface ChatData {
  _id: string; participants?: string[]; participantsData?: AppealUser[]; messages?: ChatMessage[];
}
export const getChat = (chatId: string) => req<ChatData>(`chats/${chatId}`);
export const sendMessage = (body: { to: string; message: string; chatId: string }) => req("messages", "POST", body);

/* ── Support & Trust Center (canonical /api/trust) ── */
const qs = (o: Record<string, any> = {}) => {
  const s = new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== "" ).map(([k, v]) => [k, String(v)])).toString();
  return s ? "?" + s : "";
};
export const trust = {
  analytics: (includeDemo = false) => req(`trust/analytics/overview${qs({ includeDemo })}`),
  // categories
  categoriesTree: () => req(`trust/categories`),
  createCategory: (b: any) => req(`trust/categories`, "POST", b),
  updateCategory: (code: string, b: any) => req(`trust/categories/${code}`, "PATCH", b),
  deleteCategory: (code: string) => req(`trust/categories/${code}`, "DELETE"),
  // reasons
  reasons: (targetType?: string) => req(`trust/reasons${qs({ targetType })}`),
  createReason: (b: any) => req(`trust/reasons`, "POST", b),
  updateReason: (code: string, b: any) => req(`trust/reasons/${code}`, "PATCH", b),
  deleteReason: (code: string) => req(`trust/reasons/${code}`, "DELETE"),
  // tickets
  tickets: (f: any = {}) => req(`trust/tickets${qs({ ...f, includeDemo: true })}`),
  ticket: (id: string) => req(`trust/tickets/${id}`),
  updateTicket: (id: string, b: any) => req(`trust/tickets/${id}`, "PATCH", b),
  ticketMessage: (id: string, b: any) => req(`trust/tickets/${id}/messages`, "POST", b),
  // reports
  reports: (f: any = {}) => req(`trust/reports${qs({ ...f, includeDemo: true })}`),
  report: (id: string) => req(`trust/reports/${id}`),
  updateReport: (id: string, b: any) => req(`trust/reports/${id}`, "PATCH", b),
  // moderation
  cases: (f: any = {}) => req(`trust/moderation${qs({ ...f, includeDemo: true })}`),
  createCase: (b: any) => req(`trust/moderation`, "POST", b),
  updateCase: (id: string, b: any) => req(`trust/moderation/${id}`, "PATCH", b),
  // customer 360
  userSummary: (id: string) => req(`trust/user/${id}/summary`),
  // seed
  seedDemo: () => req(`trust/seed-demo`, "POST", {}),
  resetDemo: () => req(`trust/reset-demo`, "POST", {}),
};

/* ── Demo trade disputes (deals module) ── */
export const seedDemoDisputes = () => req(`deals/admin/seed-demo`, "POST", {});
export const resetDemoDisputes = () => req(`deals/admin/reset-demo`, "POST", {});

