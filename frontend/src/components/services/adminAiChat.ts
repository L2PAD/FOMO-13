import getAccessToken from "../utils/getAccessToken";
import { configureUrl } from "./config";

export type AdminAiChatRole = "user" | "assistant" | "system";
export type AdminAiAccessMode = "read_only" | "write_with_approval" | "full_access";
export type AdminAiChatStatus = "done" | "error" | "blocked" | "pending";

export type AdminAiChatArtifactStatus = "queued" | "processing" | "ready" | "failed";

export interface AdminAiChatArtifact {
  id: string;
  kind: "collection" | "vesting_reviews" | string;
  collectionName: string;
  filename: string;
  format: "json" | "jsonl" | string;
  compression: "none" | "gzip" | string;
  status: AdminAiChatArtifactStatus;
  progress: number;
  documentCount: number;
  bytes: number;
  sha256?: string;
  contentType?: string;
  expiresAt?: string;
  errorCode?: string;
  errorMessage?: string;
  downloadUrl?: string;
}

export interface AdminAiChatMessage {
  _id: string;
  threadId: string;
  role: AdminAiChatRole;
  content: string;
  status?: AdminAiChatStatus;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAiChatThread {
  _id: string;
  title: string;
  createdBy: string;
  folderId?: string | null;
  isPinned?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastMessage?: AdminAiChatMessage;
}

export interface AdminAiChatFolder {
  _id: string;
  name: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAiChatDeleteThreadResponse {
  deleted: boolean;
  threadId: string;
}

export interface AdminAiChatDeleteFolderResponse {
  deleted: boolean;
  folderId: string;
  movedThreads: number;
}

export interface AdminAiChatToolRun {
  _id: string;
  name: string;
  status: AdminAiChatStatus;
  durationMs?: number;
  provider?: string;
  model?: string;
  trackingId?: string;
  errorCode?: string;
  resultSummary?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAiChatToolRunActionResponse {
  toolRunId: string;
  approvalStatus: "approved" | "rejected";
  status: AdminAiChatStatus;
  resultSummary?: Record<string, unknown>;
  createdCount?: number;
  updatedCount?: number;
  modifiedCount?: number;
  affectedIds?: string[];
  error?: string;
}

export type VestingReviewJson = {
  tokenAllocation: Array<Record<string, unknown>>;
  vestingRounds: Array<Record<string, unknown>>;
  vestingSummary: Record<string, unknown>;
  vestingSchedule: Array<Record<string, unknown>>;
  vestingTimeline: Array<Record<string, unknown>>;
};

export type VestingReviewComparePayload = {
  responseType: "vesting_review_compare";
  project?: Record<string, unknown>;
  recommendation?: string;
  confidence?: number;
  currentJson?: VestingReviewJson | null;
  proposedJson: VestingReviewJson;
  originalProposedJson?: VestingReviewJson;
  diffSummary?: Record<string, unknown>;
  issues?: Array<Record<string, unknown>>;
  saleIdMap?: Array<Record<string, unknown>>;
  nameChanges?: Array<Record<string, unknown>>;
  sourcesUsed?: Array<Record<string, unknown>>;
  plannedChanges?: Array<Record<string, unknown>>;
  requiresApproval?: boolean;
  validation?: Record<string, unknown>;
  warnings?: string[];
};

export type AdminAiChatToolRunApproveBody = {
  editedPayload?: VestingReviewJson;
  adminNote?: string;
};

export interface AdminAiChatResponse<T = unknown> {
  success: boolean;
  status: number;
  data: T;
  error?: string;
}

export interface AdminAiChatSendResponse {
  threadId: string;
  userMessage: AdminAiChatMessage;
  assistantMessage: AdminAiChatMessage;
}

export interface AdminAiModelPresetOption {
  key: string;
  label: string;
  model: string;
  reasoningEffort: "low" | "medium" | "high" | string;
  maxToolIterations: number;
  timeoutMs: number;
}

export interface AdminAiChatModelsResponse {
  models: string[];
  defaultModel: string;
  presets?: AdminAiModelPresetOption[];
  defaultPreset?: string;
}

const getErrorMessage = (data: unknown, fallback: string) => {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string" && message) return message;
  }

  return fallback;
};

const request = async <T = unknown>(
  path: string,
  options?: RequestInit
): Promise<AdminAiChatResponse<T>> => {
  const token = getAccessToken();

  if (!token) {
    return {
      success: false,
      status: 401,
      data: {} as T,
      error: "Not authorized",
    };
  }

  const response = await fetch(configureUrl(path), {
    ...options,
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const text = await response.text();
  let data: unknown = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = { message: text };
  }

  return {
    success: response.status < 300,
    status: response.status,
    data: data as T,
    error: response.status < 300 ? undefined : getErrorMessage(data, response.statusText),
  };
};

export const fetchAdminAiChatThreads = () =>
  request<AdminAiChatThread[]>("admin-ai-chat/threads", {
    method: "GET",
  });

export const fetchAdminAiChatModels = () =>
  request<AdminAiChatModelsResponse>("admin-ai-chat/models", {
    method: "GET",
  });

export const createAdminAiChatThread = (title?: string, folderId?: string | null) =>
  request<AdminAiChatThread>("admin-ai-chat/threads", {
    method: "POST",
    body: JSON.stringify({ title, folderId }),
  });

export const updateAdminAiChatThread = (
  threadId: string,
  body: { title?: string; folderId?: string | null; isPinned?: boolean }
) =>
  request<AdminAiChatThread>(`admin-ai-chat/threads/${encodeURIComponent(threadId)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const deleteAdminAiChatThread = (threadId: string) =>
  request<AdminAiChatDeleteThreadResponse>(
    `admin-ai-chat/threads/${encodeURIComponent(threadId)}`,
    {
      method: "DELETE",
    }
  );

export const fetchAdminAiChatFolders = () =>
  request<AdminAiChatFolder[]>("admin-ai-chat/folders", {
    method: "GET",
  });

export const createAdminAiChatFolder = (name: string) =>
  request<AdminAiChatFolder>("admin-ai-chat/folders", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const updateAdminAiChatFolder = (folderId: string, name: string) =>
  request<AdminAiChatFolder>(`admin-ai-chat/folders/${encodeURIComponent(folderId)}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });

export const deleteAdminAiChatFolder = (folderId: string) =>
  request<AdminAiChatDeleteFolderResponse>(
    `admin-ai-chat/folders/${encodeURIComponent(folderId)}`,
    {
      method: "DELETE",
    }
  );

export const fetchAdminAiChatMessages = (threadId: string) =>
  request<AdminAiChatMessage[]>(
    `admin-ai-chat/threads/${encodeURIComponent(threadId)}/messages`,
    {
      method: "GET",
    }
  );

export const sendAdminAiChatMessage = (
  threadId: string,
  message: string,
  model?: string,
  accessMode?: AdminAiAccessMode,
  modelPreset?: string
) =>
  request<AdminAiChatSendResponse>(
    `admin-ai-chat/threads/${encodeURIComponent(threadId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ message, model, accessMode, modelPreset }),
    }
  );

export const fetchAdminAiChatToolRuns = (threadId: string, messageId: string) =>
  request<AdminAiChatToolRun[]>(
    `admin-ai-chat/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(
      messageId
    )}/tool-runs`,
    {
      method: "GET",
    }
  );

export const fetchAdminAiChatArtifact = (artifactId: string) =>
  request<AdminAiChatArtifact>(
    `admin-ai-chat/artifacts/${encodeURIComponent(artifactId)}`,
    { method: "GET" }
  );

export const getAdminAiChatArtifactDownloadUrl = (artifact: AdminAiChatArtifact) =>
  artifact.downloadUrl
    ? configureUrl(artifact.downloadUrl.replace(/^\/+/, ""))
    : "";

export const approveAdminAiChatToolRun = (
  toolRunId: string,
  body: AdminAiChatToolRunApproveBody = {}
) =>
  request<AdminAiChatToolRunActionResponse>(
    `admin-ai-chat/tool-runs/${encodeURIComponent(toolRunId)}/approve`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

export const rejectAdminAiChatToolRun = (toolRunId: string) =>
  request<AdminAiChatToolRunActionResponse>(
    `admin-ai-chat/tool-runs/${encodeURIComponent(toolRunId)}/reject`,
    {
      method: "POST",
    }
  );
