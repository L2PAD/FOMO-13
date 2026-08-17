import { API } from "../../config/api";
import getWalletToken from "../getWalletToken";

/**
 * Canonical Support & Trust API client (public surface).
 * All report / ticket flows on the public website go through /api/trust/public/*.
 * Categories and reasons are ALWAYS fetched from the backend — never hardcoded.
 */

const authHeaders = (): Record<string, string> => {
  const token = getWalletToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const request = async <T = any>(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: any
): Promise<{ success: boolean; data: T | any; status: number }> => {
  try {
    const res = await fetch(`${API}/${path}`, {
      method,
      headers: authHeaders(),
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    return { success: res.ok, data: json, status: res.status };
  } catch (error) {
    console.error("Trust API error:", error);
    return { success: false, data: null, status: 0 };
  }
};

/* ── Types ── */
export type ReportTargetType =
  | "USER"
  | "COMMENT"
  | "MESSAGE"
  | "CONTENT"
  | "PORTFOLIO"
  | "PROJECT"
  | "OTC_LISTING"
  | "P2P_LISTING"
  | "OTHER";

export interface TrustReason {
  code: string;
  label: string;
  description?: string;
  allowedTargetTypes: string[];
}

export interface TrustCategory {
  _id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  parentCode?: string;
  allowedRequestTypes?: string[];
  requiredFields?: string[];
  slaPolicy?: Record<string, any>;
  children?: TrustCategory[];
}

export interface CreateReportPayload {
  targetType: ReportTargetType;
  targetId?: string;
  reasonCode: string;
  subReason?: string;
  description?: string;
  evidence?: string[];
  targetSnapshot?: Record<string, any>;
}

export interface CreateTicketPayload {
  categoryCode: string;
  subcategoryCode?: string;
  subject: string;
  message: string;
  priority?: string;
  context?: Record<string, any>;
  attachments?: string[];
}

export interface TicketMessage {
  authorType: string;
  body: string;
  attachments?: string[];
  createdAt: string;
}

export interface Ticket {
  _id: string;
  ticketNumber: string;
  categoryCode: string;
  subject: string;
  status: string;
  priority: string;
  messages: TicketMessage[];
  createdAt: string;
  lastReplyAt?: string | null;
}

/* ── Public endpoints ── */
export const getPublicCategories = () =>
  request<TrustCategory[]>("trust/public/categories");

export const getPublicReasons = (targetType: ReportTargetType) =>
  request<TrustReason[]>(`trust/public/reasons?targetType=${targetType}`);

export const createTrustReport = (payload: CreateReportPayload) =>
  request("trust/public/reports", "POST", payload);

export const createTicket = (payload: CreateTicketPayload) =>
  request("trust/public/tickets", "POST", payload);

export const getMyTickets = () =>
  request<Ticket[]>("trust/public/tickets/mine");

export const replyToTicket = (
  id: string,
  body: string,
  attachments: string[] = []
) => request(`trust/public/tickets/${id}/reply`, "POST", { body, attachments });
