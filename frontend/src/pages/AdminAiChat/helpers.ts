import {
  AdminAiAccessMode,
  AdminAiChatMessage,
  AdminAiChatToolRun,
  AdminAiModelPresetOption,
} from "../../components/services/adminAiChat";

export const DEFAULT_ADMIN_AI_MODEL = "gpt-4.1-mini";
export const DEFAULT_ADMIN_AI_MODEL_PRESET = "review";

export const ACCESS_MODE_OPTIONS: Array<{
  value: AdminAiAccessMode;
  label: string;
  badge: string;
}> = [
  { value: "read_only", label: "Read-only", badge: "Read-only" },
  {
    value: "write_with_approval",
    label: "Write with approval",
    badge: "Approval required",
  },
  { value: "full_access", label: "Full access", badge: "Full access enabled" },
];

export const getAccessModeOption = (value: AdminAiAccessMode) =>
  ACCESS_MODE_OPTIONS.find((option) => option.value === value) || ACCESS_MODE_OPTIONS[1];

export const normalizeModelOptions = (
  models?: unknown,
  defaultModel?: unknown
) => {
  const normalizedModels = Array.isArray(models)
    ? models
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    : [];
  const uniqueModels = Array.from(new Set(normalizedModels));
  const fallbackModels = uniqueModels.length ? uniqueModels : [DEFAULT_ADMIN_AI_MODEL];
  const requestedDefault = String(defaultModel || "").trim();

  return {
    models: fallbackModels,
    defaultModel: fallbackModels.includes(requestedDefault)
      ? requestedDefault
      : fallbackModels[0],
  };
};

export const normalizeModelPresetOptions = (
  presets?: unknown,
  defaultPreset?: unknown
) => {
  const normalizedPresets = Array.isArray(presets)
    ? presets
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const preset = item as Record<string, unknown>;
          const key = String(preset.key || "").trim();
          const label = String(preset.label || key).trim();
          const model = String(preset.model || "").trim();
          if (!key || !label || !model) return null;
          return {
            key,
            label,
            model,
            reasoningEffort: String(preset.reasoningEffort || ""),
            maxToolIterations: Number(preset.maxToolIterations || 0),
            timeoutMs: Number(preset.timeoutMs || 0),
          } as AdminAiModelPresetOption;
        })
        .filter(Boolean) as AdminAiModelPresetOption[]
    : [];
  const fallbackPresets = normalizedPresets.length
    ? normalizedPresets
    : [
        {
          key: DEFAULT_ADMIN_AI_MODEL_PRESET,
          label: "Review High Quality",
          model: "gpt-5.5",
          reasoningEffort: "high",
          maxToolIterations: 10,
          timeoutMs: 90000,
        },
      ];
  const requestedDefault = String(defaultPreset || "").trim();
  const safeDefault = fallbackPresets.some((preset) => preset.key === requestedDefault)
    ? requestedDefault
    : fallbackPresets[0].key;

  return {
    presets: fallbackPresets,
    defaultPreset: safeDefault,
  };
};

export const formatDuration = (value?: unknown) => {
  const durationMs = Number(value || 0);
  if (!Number.isFinite(durationMs) || durationMs <= 0) return "";
  if (durationMs < 1000) return `${Math.round(durationMs)}ms`;
  return `${(durationMs / 1000).toFixed(durationMs < 10000 ? 1 : 0)}s`;
};

export const getToolCallsCount = (message: AdminAiChatMessage) => {
  const summary = message.metadata?.toolCallsSummary;
  if (summary && typeof summary === "object" && "count" in summary) {
    const count = Number((summary as { count?: unknown }).count || 0);
    return Number.isFinite(count) ? count : 0;
  }

  return 0;
};

export const getRequestId = (message: AdminAiChatMessage) => {
  const requestId = message.metadata?.requestId;
  if (typeof requestId === "string" && requestId) return requestId;

  const requestIds = message.metadata?.requestIds;
  if (Array.isArray(requestIds) && typeof requestIds[0] === "string") {
    return requestIds[0];
  }

  return "";
};

export const formatAssistantMetadata = (message: AdminAiChatMessage) => {
  const metadata = message.metadata || {};
  const errorCode = typeof metadata.errorCode === "string" ? metadata.errorCode : "";
  const provider = typeof metadata.provider === "string" ? metadata.provider : "";
  const model = typeof metadata.model === "string" ? metadata.model : "";
  const modelPresetLabel =
    typeof metadata.modelPresetLabel === "string" ? metadata.modelPresetLabel : "";
  const duration = formatDuration(metadata.durationMs);
  const status = typeof metadata.status === "string" ? metadata.status : message.status || "";
  const toolCount = getToolCallsCount(message);

  if (message.status === "error" || errorCode) {
    return [
      model || provider || "AI fallback",
      status || "error",
      errorCode,
    ].filter(Boolean).join(" · ");
  }

  return [
    [modelPresetLabel, model || provider || "AI"].filter(Boolean).join(" / "),
    duration,
    `${toolCount} ${toolCount === 1 ? "tool" : "tools"}`,
    status || "success",
  ].filter(Boolean).join(" · ");
};

export const getToolRunApprovalId = (toolRun: AdminAiChatToolRun) => {
  const value = toolRun.resultSummary?.toolRunId;
  return typeof value === "string" && value ? value : "";
};

export const isToolRunPendingApproval = (toolRun: AdminAiChatToolRun) => {
  const summary = toolRun.resultSummary || {};
  return (
    toolRun.status === "pending" ||
    summary.requiresApproval === true ||
    summary.approvalStatus === "pending"
  );
};

export const formatToolRunStatus = (toolRun: AdminAiChatToolRun) => {
  const approvalStatus = String(toolRun.resultSummary?.approvalStatus || "");
  if (approvalStatus === "approved") return "approved";
  if (approvalStatus === "rejected") return "rejected";
  if (isToolRunPendingApproval(toolRun)) return "pending";
  if (toolRun.status === "done") return "success";
  if (toolRun.status === "blocked") return "blocked";
  return "error";
};

export const getToolRunCollections = (toolRun: AdminAiChatToolRun) => {
  const summary = toolRun.resultSummary || {};
  const candidates = [
    summary.collectionsRead,
    summary.collections,
    summary.collectionNames,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 30);
    }
  }

  return [];
};

export const formatToolRunSummary = (toolRun: AdminAiChatToolRun) => {
  const summary = toolRun.resultSummary || {};
  const compact = {
    ...summary,
    collectionsRead: undefined,
    collections: undefined,
    collectionNames: undefined,
  };
  const entries = Object.entries(compact).filter(([, value]) => value !== undefined);

  if (!entries.length) return "";

  try {
    const safeSummary = entries.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, unknown>);

    return JSON.stringify(safeSummary, null, 2);
  } catch (error) {
    return "";
  }
};
