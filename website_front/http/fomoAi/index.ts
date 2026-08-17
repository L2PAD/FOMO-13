import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

const authHeaders = () => {
  const t = getAuthToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export interface AiOperation {
  operation: string;
  label: string;
  description: string;
  capability: string;
  allowed: boolean;
  estimatedCredits: number | null;
}
export interface AiContext {
  access: { allowed: boolean; capability: string; reason: string | null; source: string | null; expiresAt: string | null; requirements: any[] };
  credits: { available: number; monthly: number; topup: number; reserved: number; total: number };
  operations: AiOperation[];
}
export interface AiSource {
  sourceType?: "FOMO" | "EXTERNAL";
  entityType?: string;
  entityId?: string;
  id?: string;
  type?: string;
  title: string;
  updatedAt?: string | null;
  observedAt?: string | null;
  freshness?: string | null;
  dataMode?: string;
}
export interface AiSections {
  fomoData?: { text: string; available: boolean };
  analysis?: { text: string };
  risks?: { text: string };
}
export interface AiMessageDto {
  _id?: string;
  role: "user" | "assistant";
  content: string;
  sections?: AiSections | null;
  grounding?: { grounded: boolean; connectedSources: number; missingSources: string[] } | null;
  confidence?: string;
  provider?: { name: string; model: string; latencyMs: number } | null;
  sources?: AiSource[];
  coverage?: string;
  limitations?: string[];
  dataMode?: string;
  retrieval?: any;
  dataFreshness?: any;
  usage?: { creditsCharged?: number; creditsReserved?: number; costBreakdown?: any };
  createdAt?: string;
}
export interface AiConversationDto {
  _id: string;
  title: string;
  operation: string;
  lastMessageAt?: string;
}

export const getAiContext = async (): Promise<AiContext | null> => {
  try {
    const res = await fetch(`${API}/fomo-ai/context`, { headers: authHeaders() });
    if (!res.ok) return null;
    return (await res.json()) as AiContext;
  } catch {
    return null;
  }
};

export const getConversations = async (): Promise<AiConversationDto[]> => {
  try {
    const res = await fetch(`${API}/fomo-ai/conversations`, { headers: authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
};

export const getMessages = async (conversationId: string): Promise<AiMessageDto[]> => {
  try {
    const res = await fetch(`${API}/fomo-ai/conversations/${conversationId}/messages`, { headers: authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
};

export const askFomoAi = async (body: { conversationId?: string; operation: string; query: string; context?: any }) => {
  const res = await fetch(`${API}/fomo-ai/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return res.json();
};

export interface AiUsageRow {
  id: string;
  createdAt: string | null;
  operation: string;
  operationLabel: string;
  status: string;
  credits: number;
  creditsReserved: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  dataMode: string;
  latencyMs: number;
}
export interface AiUsageHistory {
  items: AiUsageRow[];
  total: number;
  totalCreditsSpent: number;
}

export const getAiUsageHistory = async (limit = 50): Promise<AiUsageHistory> => {
  try {
    const res = await fetch(`${API}/fomo-ai/usage?limit=${limit}`, { headers: authHeaders() });
    if (!res.ok) return { items: [], total: 0, totalCreditsSpent: 0 };
    return (await res.json()) as AiUsageHistory;
  } catch {
    return { items: [], total: 0, totalCreditsSpent: 0 };
  }
};
