import React, {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import Layout from "../../components/layouts/main_layout/layout";
import { AdminSelect } from "../AdminRating/AdminControls";
import {
  AdminAiAccessMode,
  AdminAiChatArtifact,
  AdminAiChatFolder,
  AdminAiChatMessage,
  AdminAiChatToolRun,
  AdminAiChatThread,
  AdminAiModelPresetOption,
  VestingReviewComparePayload,
  VestingReviewJson,
  approveAdminAiChatToolRun,
  createAdminAiChatFolder,
  createAdminAiChatThread,
  deleteAdminAiChatFolder,
  deleteAdminAiChatThread,
  fetchAdminAiChatFolders,
  fetchAdminAiChatArtifact,
  fetchAdminAiChatMessages,
  fetchAdminAiChatModels,
  fetchAdminAiChatToolRuns,
  fetchAdminAiChatThreads,
  getAdminAiChatArtifactDownloadUrl,
  rejectAdminAiChatToolRun,
  sendAdminAiChatMessage,
  updateAdminAiChatFolder,
  updateAdminAiChatThread,
} from "../../components/services/adminAiChat";
import {
  ACCESS_MODE_OPTIONS,
  formatAssistantMetadata,
  formatDuration,
  formatToolRunSummary,
  formatToolRunStatus,
  getAccessModeOption,
  getRequestId,
  getToolCallsCount,
  getToolRunApprovalId,
  getToolRunCollections,
  isToolRunPendingApproval,
  normalizeModelOptions,
  normalizeModelPresetOptions,
} from "./helpers";
import { useStyles } from "./styles";

const STARTER_PROMPTS = [
  "Find crypto project by name, slug, symbol, or id",
  "Show full FOMO v2 context for a project",
  "Explain why project logo is missing",
  "Show funding/backer context for a project",
  "Show tokenomics, vesting, and unlock context",
  "Find possible duplicate canonical projects",
  "Show FOMO v2 collection stats",
  "Find unresolved backer/project mappings",
];

const PROCESSING_STEPS = [
  "Analyzing request...",
  "Checking available context...",
  "Preparing response...",
  "Generating answer...",
];

const UNSORTED_FOLDER_ID = "__unsorted__";
const MODEL_PRESET_STORAGE_KEY = "fomo.adminAiChat.modelPreset";

type IconName =
  | "chevron"
  | "copy"
  | "download"
  | "edit"
  | "expand"
  | "folder"
  | "menu"
  | "minimize"
  | "move"
  | "panel"
  | "pin"
  | "plus"
  | "retry"
  | "search"
  | "send"
  | "spark"
  | "tool"
  | "trash"
  | "x";

type ModalState =
  | { type: "renameThread"; thread: AdminAiChatThread; value: string }
  | { type: "deleteThread"; thread: AdminAiChatThread }
  | { type: "moveThread"; thread: AdminAiChatThread; folderId: string }
  | { type: "createFolder"; value: string }
  | { type: "renameFolder"; folder: AdminAiChatFolder; value: string }
  | { type: "deleteFolder"; folder: AdminAiChatFolder }
  | null;

type ToolRunsPanelState = {
  message: AdminAiChatMessage;
  runs: AdminAiChatToolRun[];
  loading: boolean;
  error: string;
} | null;

type VestingCompareModalState = {
  payload: VestingReviewComparePayload;
  toolRunId?: string;
  sourceRun?: AdminAiChatToolRun;
} | null;

type CompareTableColumn = {
  key: string;
  label: string;
};

const COMPARE_ALLOCATION_COLUMNS: CompareTableColumn[] = [
  { key: "name", label: "Name" },
  { key: "sourceName", label: "Source Name" },
  { key: "normalizedCategory", label: "Category" },
  { key: "percent", label: "Percent" },
  { key: "amount", label: "Amount" },
  { key: "saleId", label: "SaleId" },
];

const COMPARE_ROUND_COLUMNS: CompareTableColumn[] = [
  { key: "roundName", label: "Round Name" },
  { key: "sourceName", label: "Source Name" },
  { key: "normalizedCategory", label: "Category" },
  { key: "saleId", label: "SaleId" },
  { key: "totalAmount", label: "Total Amount" },
  { key: "tgeUnlockPercent", label: "TGE %" },
  { key: "vestingType", label: "Type" },
  { key: "vestingDurationMonths", label: "Duration" },
  { key: "startDate", label: "Start" },
  { key: "endDate", label: "End" },
  { key: "dateConfidence", label: "Confidence" },
];

const COMPARE_SUMMARY_FIELDS: CompareTableColumn[] = [
  { key: "unlockedPercent", label: "Unlocked %" },
  { key: "lockedPercent", label: "Locked %" },
  { key: "untrackedPercent", label: "Untracked %" },
  { key: "totalAmount", label: "Total Amount" },
  { key: "unlockedAmount", label: "Unlocked Amount" },
  { key: "lockedAmount", label: "Locked Amount" },
  { key: "lastUnlockDate", label: "Last Unlock Date" },
];

const EDITABLE_VESTING_FIELDS = new Set([
  "name",
  "sourceName",
  "roundName",
  "normalizedCategory",
  "percent",
  "amount",
  "saleId",
  "totalAmount",
  "tgeUnlockPercent",
  "vestingType",
  "vestingDurationMonths",
  "startDate",
  "endDate",
  "dateConfidence",
]);

const isVestingComparePayload = (value: unknown): value is VestingReviewComparePayload => {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { responseType?: unknown }).responseType === "vesting_review_compare" &&
      (value as { proposedJson?: unknown }).proposedJson
  );
};

const getVestingComparePayload = (value?: Record<string, unknown>) => {
  if (isVestingComparePayload(value)) return value;
  const summary = value?.summary;
  if (isVestingComparePayload(summary)) return summary;
  return null;
};

const cloneVestingJson = (value: VestingReviewJson): VestingReviewJson =>
  JSON.parse(JSON.stringify(value || {}));

const toDisplayValue = (value: unknown) => {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/\.?0+$/, "");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ") || "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const compareRowKey = (row: Record<string, unknown>, nameKey: string) =>
  row.saleId !== undefined && row.saleId !== null && row.saleId !== ""
    ? `sale:${row.saleId}`
    : `name:${String(row[nameKey] || row.name || row.sourceName || "").trim().toLowerCase()}`;

const rowDiffStatus = (
  row: Record<string, unknown>,
  currentRows: Array<Record<string, unknown>>,
  nameKey: string
) => {
  const key = compareRowKey(row, nameKey);
  const current = currentRows.find((item) => compareRowKey(item, nameKey) === key);
  if (!current) return "added";
  return JSON.stringify(current) === JSON.stringify(row) ? "unchanged" : "changed";
};

const recomputeLocalDiff = (
  currentJson: VestingReviewJson | null | undefined,
  proposedJson: VestingReviewJson
) => {
  const empty = { added: 0, changed: 0, removed: 0, unchanged: 0, criticalIssues: 0 };
  const applyRows = (
    currentRows: Array<Record<string, unknown>>,
    proposedRows: Array<Record<string, unknown>>,
    nameKey: string
  ) => {
    const current = new Map(currentRows.map((row) => [compareRowKey(row, nameKey), row]));
    const proposed = new Map(proposedRows.map((row) => [compareRowKey(row, nameKey), row]));
    proposed.forEach((row, key) => {
      if (!current.has(key)) {
        empty.added += 1;
      } else if (JSON.stringify(current.get(key)) === JSON.stringify(row)) {
        empty.unchanged += 1;
      } else {
        empty.changed += 1;
      }
    });
    current.forEach((_, key) => {
      if (!proposed.has(key)) empty.removed += 1;
    });
  };

  applyRows(currentJson?.tokenAllocation || [], proposedJson.tokenAllocation || [], "name");
  applyRows(currentJson?.vestingRounds || [], proposedJson.vestingRounds || [], "roundName");
  applyRows(currentJson?.vestingSchedule || [], proposedJson.vestingSchedule || [], "roundName");
  applyRows(currentJson?.vestingTimeline || [], proposedJson.vestingTimeline || [], "roundName");
  if (JSON.stringify(currentJson?.vestingSummary || {}) === JSON.stringify(proposedJson.vestingSummary || {})) {
    empty.unchanged += 1;
  } else {
    empty.changed += 1;
  }
  return empty;
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const previewText = (value?: string) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "No messages yet";
  return text.length > 96 ? `${text.slice(0, 93)}...` : text;
};

const titleFromMessage = (value: string) => {
  const title = value.replace(/\s+/g, " ").trim();
  if (!title) return "New chat";
  return title.length > 72 ? `${title.slice(0, 69)}...` : title;
};

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const getThreadFolderId = (thread: AdminAiChatThread) =>
  thread.folderId ? String(thread.folderId) : "";

const prettyJson = (value: string) => {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch (error) {
    return "";
  }
};

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

const getMessageArtifacts = (message: AdminAiChatMessage): AdminAiChatArtifact[] => {
  const artifacts = message.metadata?.artifacts;
  if (!Array.isArray(artifacts)) return [];

  return artifacts.filter(
    (artifact): artifact is AdminAiChatArtifact =>
      Boolean(artifact) &&
      typeof artifact === "object" &&
      typeof (artifact as AdminAiChatArtifact).id === "string"
  );
};

const formatBytes = (value: number) => {
  const bytes = Number(value || 0);
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const amount = bytes / 1024 ** index;
  return `${amount >= 10 || index === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[index]}`;
};

const Icon = ({ name, className = "" }: { name: IconName; className?: string }) => {
  const common = {
    className,
    fill: "none",
    height: 18,
    viewBox: "0 0 24 24",
    width: 18,
    xmlns: "http://www.w3.org/2000/svg",
  };

  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...common}>
        <path
          d="m20 20-4.2-4.2M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === "folder") {
    return (
      <svg {...common}>
        <path
          d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2h6a2.5 2.5 0 0 1 2.5 2.5V17A2.5 2.5 0 0 1 18 19.5H6A2.5 2.5 0 0 1 3.5 17V7.5Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (name === "chevron") {
    return (
      <svg {...common}>
        <path d="m9 6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "menu") {
    return (
      <svg {...common}>
        <path d="M12 6.5h.01M12 12h.01M12 17.5h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      </svg>
    );
  }

  if (name === "edit") {
    return (
      <svg {...common}>
        <path
          d="M4.5 16.8V20h3.2L18.3 9.4l-3.2-3.2L4.5 16.8Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path d="m13.9 7.4 3.2 3.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg {...common}>
        <path d="M4 7h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        <path
          d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7m3 0-.7 11A2.2 2.2 0 0 1 15.1 20H8.9a2.2 2.2 0 0 1-2.2-2L6 7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (name === "move") {
    return (
      <svg {...common}>
        <path d="M12 3v18M3 12h18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        <path d="m8 7 4-4 4 4M8 17l4 4 4-4M7 8l-4 4 4 4M17 8l4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "pin") {
    return (
      <svg {...common}>
        <path
          d="m14.5 4.5 5 5-3.2 1.2-3 3 1.2 3.8L12.8 19l-4.2-4.2L5 18.4 4 17.4l3.6-3.6L3.4 9.6 5 7.9l3.8 1.2 3-3 1.2-3.2Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  if (name === "copy") {
    return (
      <svg {...common}>
        <path d="M8 8h9v12H8z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "download") {
    return (
      <svg {...common}>
        <path d="M12 3v12m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M5 20h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "send") {
    return (
      <svg {...common}>
        <path d="M4 12 20 4l-4.5 16-3.1-6.4L4 12Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="m12.4 13.6 3.7-4.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "retry") {
    return (
      <svg {...common}>
        <path d="M20 12a8 8 0 1 1-2.3-5.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        <path d="M20 5v5h-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "panel") {
    return (
      <svg {...common}>
        <path d="M4 5.5h16v13H4z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M9 6v12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "expand") {
    return (
      <svg {...common}>
        <path d="M8.5 4H4v4.5M15.5 4H20v4.5M20 15.5V20h-4.5M4 15.5V20h4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M4.5 4.5 9 9M19.5 4.5 15 9M19.5 19.5 15 15M4.5 19.5 9 15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "minimize") {
    return (
      <svg {...common}>
        <path d="M9 4.5V9H4.5M15 4.5V9h4.5M19.5 15H15v4.5M4.5 15H9v4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M9 9 4.5 4.5M15 9l4.5-4.5M15 15l4.5 4.5M9 15l-4.5 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "spark") {
    return (
      <svg {...common}>
        <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
        <path d="m18 15 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" />
      </svg>
    );
  }

  if (name === "tool") {
    return (
      <svg {...common}>
        <path
          d="M14.7 6.3a4 4 0 0 0-5 5L4.6 16.4a2.1 2.1 0 0 0 3 3l5.1-5.1a4 4 0 0 0 5-5l-2.5 2.5-2-2 2.5-2.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }

  if (name === "x") {
    return (
      <svg {...common}>
        <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  return null;
};

const AdminAiChatPage = () => {
  const classes = useStyles();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesRequestRef = useRef(0);
  const selectedThreadIdRef = useRef("");

  const [folders, setFolders] = useState<AdminAiChatFolder[]>([]);
  const [threads, setThreads] = useState<AdminAiChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [messages, setMessages] = useState<AdminAiChatMessage[]>([]);
  const [artifactsById, setArtifactsById] = useState<Record<string, AdminAiChatArtifact>>({});
  const [draft, setDraft] = useState("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availablePresets, setAvailablePresets] = useState<AdminAiModelPresetOption[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [accessMode, setAccessMode] = useState<AdminAiAccessMode>("write_with_approval");
  const [searchValue, setSearchValue] = useState("");
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [failedPrompt, setFailedPrompt] = useState("");
  const [openThreadMenuId, setOpenThreadMenuId] = useState("");
  const [openFolderMenuId, setOpenFolderMenuId] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [toolRunsPanel, setToolRunsPanel] = useState<ToolRunsPanelState>(null);
  const [vestingCompareModal, setVestingCompareModal] = useState<VestingCompareModalState>(null);
  const [vestingCompareDraft, setVestingCompareDraft] = useState<VestingReviewJson | null>(null);
  const [vestingCompareEditing, setVestingCompareEditing] = useState(false);
  const [vestingCompareNote, setVestingCompareNote] = useState("");
  const [approvalActionRunId, setApprovalActionRunId] = useState("");
  const [processingStepIndex, setProcessingStepIndex] = useState(0);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread._id === selectedThreadId) || null,
    [selectedThreadId, threads]
  );

  const filteredThreads = useMemo(() => {
    const search = normalizeSearch(searchValue);
    if (!search) return threads;

    return threads.filter((thread) => {
      const title = normalizeSearch(thread.title);
      const preview = normalizeSearch(thread.lastMessage?.content || "");

      return title.includes(search) || preview.includes(search);
    });
  }, [searchValue, threads]);

  const folderGroups = useMemo(
    () =>
      folders.map((folder) => ({
        folder,
        threads: filteredThreads.filter(
          (thread) => getThreadFolderId(thread) === String(folder._id)
        ),
      })),
    [filteredThreads, folders]
  );

  const unsortedThreads = useMemo(
    () => filteredThreads.filter((thread) => !getThreadFolderId(thread)),
    [filteredThreads]
  );

  const threadStats = useMemo(() => {
    const pinnedCount = threads.filter((thread) => thread.isPinned).length;

    return `${threads.length} chats${pinnedCount ? `, ${pinnedCount} pinned` : ""}`;
  }, [threads]);

  const modelOptions = useMemo(
    () => normalizeModelOptions(availableModels, selectedModel),
    [availableModels, selectedModel]
  );
  const presetOptions = useMemo(
    () => normalizeModelPresetOptions(availablePresets, selectedPreset),
    [availablePresets, selectedPreset]
  );
  const selectedPresetOption = useMemo(
    () =>
      presetOptions.presets.find((preset) => preset.key === selectedPreset) ||
      presetOptions.presets.find((preset) => preset.key === presetOptions.defaultPreset) ||
      presetOptions.presets[0],
    [presetOptions.defaultPreset, presetOptions.presets, selectedPreset]
  );
  const accessModeOption = useMemo(() => getAccessModeOption(accessMode), [accessMode]);
  const artifactIds = useMemo(
    () =>
      Array.from(
        new Set(
          messages.flatMap((message) =>
            getMessageArtifacts(message).map((artifact) => artifact.id)
          )
        )
      ),
    [messages]
  );
  const artifactIdsKey = artifactIds.join("|");

  useEffect(() => {
    selectedThreadIdRef.current = selectedThreadId;
  }, [selectedThreadId]);

  useEffect(() => {
    if (selectedModel && modelOptions.models.includes(selectedModel)) return;
    setSelectedModel(modelOptions.defaultModel);
  }, [modelOptions.defaultModel, modelOptions.models, selectedModel]);

  useEffect(() => {
    if (selectedPreset && presetOptions.presets.some((preset) => preset.key === selectedPreset)) return;
    setSelectedPreset(presetOptions.defaultPreset);
  }, [presetOptions.defaultPreset, presetOptions.presets, selectedPreset]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 188)}px`;
  }, [draft]);

  useEffect(() => {
    if (!sending) {
      setProcessingStepIndex(0);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setProcessingStepIndex((current) => (current + 1) % PROCESSING_STEPS.length);
    }, 1400);

    return () => window.clearInterval(timer);
  }, [sending]);

  useEffect(() => {
    if (!stickToBottom && !sending) return;

    messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, messagesLoading, sending, requestError, stickToBottom]);

  useEffect(() => {
    if (!artifactIds.length) return undefined;

    let active = true;
    let timer: number | undefined;

    const pollArtifacts = async () => {
      const responses = await Promise.all(
        artifactIds.map((artifactId) => fetchAdminAiChatArtifact(artifactId))
      );
      if (!active) return;

      const artifacts = responses
        .filter((response) => response.success)
        .map((response) => response.data);
      if (artifacts.length) {
        setArtifactsById((current) => ({
          ...current,
          ...Object.fromEntries(artifacts.map((artifact) => [artifact.id, artifact])),
        }));
      }

      const shouldContinue =
        responses.some((response) => !response.success) ||
        artifacts.some(
          (artifact) => artifact.status === "queued" || artifact.status === "processing"
        );
      if (shouldContinue && active) {
        timer = window.setTimeout(pollArtifacts, 1800);
      }
    };

    void pollArtifacts();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [artifactIdsKey]);

  useEffect(() => {
    if (!isFullscreen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  const loadWorkspace = async (preferredThreadId?: string) => {
    setThreadsLoading(true);
    const [foldersResponse, threadsResponse] = await Promise.all([
      fetchAdminAiChatFolders(),
      fetchAdminAiChatThreads(),
    ]);
    setThreadsLoading(false);

    if (!foldersResponse.success) {
      toast.error(foldersResponse.error || "Failed to load folders");
    } else {
      setFolders(foldersResponse.data);
    }

    if (!threadsResponse.success) {
      toast.error(threadsResponse.error || "Failed to load chats");
      return;
    }

    setThreads(threadsResponse.data);
    setSelectedThreadId((current) => {
      if (preferredThreadId) return preferredThreadId;
      if (current && threadsResponse.data.some((thread) => thread._id === current)) {
        return current;
      }

      return threadsResponse.data[0]?._id || "";
    });
  };

  const loadModels = async () => {
    setModelsLoading(true);
    const response = await fetchAdminAiChatModels();
    setModelsLoading(false);

    if (!response.success) {
      const fallback = normalizeModelOptions();
      const fallbackPresets = normalizeModelPresetOptions();
      setAvailableModels(fallback.models);
      setAvailablePresets(fallbackPresets.presets);
      setSelectedModel((current) => current || fallback.defaultModel);
      setSelectedPreset((current) => current || fallbackPresets.defaultPreset);
      toast.error(response.error || "Failed to load AI models");
      return;
    }

    const normalized = normalizeModelOptions(response.data.models, response.data.defaultModel);
    const normalizedPresets = normalizeModelPresetOptions(
      response.data.presets,
      response.data.defaultPreset
    );
    const storedPreset = window.localStorage?.getItem(MODEL_PRESET_STORAGE_KEY) || "";
    const nextPreset = normalizedPresets.presets.some((preset) => preset.key === storedPreset)
      ? storedPreset
      : normalizedPresets.defaultPreset;
    const nextPresetModel = normalizedPresets.presets.find((preset) => preset.key === nextPreset)?.model;
    setAvailableModels(normalized.models);
    setAvailablePresets(normalizedPresets.presets);
    setSelectedPreset(nextPreset);
    setSelectedModel((current) =>
      current && normalized.models.includes(current)
        ? current
        : nextPresetModel && normalized.models.includes(nextPresetModel)
          ? nextPresetModel
          : normalized.defaultModel
    );
  };

  const loadMessages = async (threadId: string) => {
    const requestId = messagesRequestRef.current + 1;
    messagesRequestRef.current = requestId;
    setMessagesLoading(true);
    setRequestError("");

    const response = await fetchAdminAiChatMessages(threadId);

    if (messagesRequestRef.current !== requestId) return;

    setMessagesLoading(false);

    if (!response.success) {
      setMessages([]);
      setRequestError(response.error || "Failed to load messages");
      return;
    }

    setMessages(response.data);
  };

  useEffect(() => {
    loadModels();
    loadWorkspace();
  }, []);

  useEffect(() => {
    if (!selectedThreadId) {
      messagesRequestRef.current += 1;
      setMessages([]);
      setMessagesLoading(false);
      setRequestError("");
      return;
    }

    loadMessages(selectedThreadId);
  }, [selectedThreadId]);

  const closeMenus = () => {
    setOpenThreadMenuId("");
    setOpenFolderMenuId("");
  };

  const setSelectedThread = (threadId: string) => {
    closeMenus();
    setSelectedThreadId(threadId);
    selectedThreadIdRef.current = threadId;
  };

  const startThread = async (folderId?: string | null) => {
    if (creatingThread || sending) return "";

    closeMenus();
    setCreatingThread(true);
    const response = await createAdminAiChatThread(undefined, folderId || null);
    setCreatingThread(false);

    if (!response.success) {
      toast.error(response.error || "Failed to create chat");
      return "";
    }

    setThreads((current) => [response.data, ...current]);
    setSelectedThreadId(response.data._id);
    selectedThreadIdRef.current = response.data._id;
    setMessages([]);
    setRequestError("");
    setStickToBottom(true);

    return response.data._id;
  };

  const updateModelPreset = (presetKey: string) => {
    const preset = presetOptions.presets.find((item) => item.key === presetKey);
    const safePresetKey = preset?.key || presetOptions.defaultPreset;
    setSelectedPreset(safePresetKey);
    window.localStorage?.setItem(MODEL_PRESET_STORAGE_KEY, safePresetKey);

    if (preset?.model && modelOptions.models.includes(preset.model)) {
      setSelectedModel(preset.model);
    }
  };

  const sendPrompt = async (rawPrompt: string) => {
    const prompt = rawPrompt.trim();
    if (!prompt || sending) return;
    const model = selectedModel && modelOptions.models.includes(selectedModel)
      ? selectedModel
      : modelOptions.defaultModel;
    const modelPreset = selectedPresetOption?.key || presetOptions.defaultPreset;

    closeMenus();
    setRequestError("");
    setFailedPrompt("");
    setSending(true);

    let threadId = selectedThreadIdRef.current;
    if (!threadId) {
      const createResponse = await createAdminAiChatThread(titleFromMessage(prompt));
      if (!createResponse.success) {
        setSending(false);
        setRequestError(createResponse.error || "Failed to create chat");
        toast.error(createResponse.error || "Failed to create chat");
        return;
      }

      threadId = createResponse.data._id;
      setThreads((current) => [createResponse.data, ...current]);
      setSelectedThreadId(threadId);
      selectedThreadIdRef.current = threadId;
      setMessages([]);
    }

    const pendingId = `pending-${Date.now()}`;
    const optimisticUserMessage: AdminAiChatMessage = {
      _id: pendingId,
      threadId,
      role: "user",
      content: prompt,
      status: "done",
      createdAt: new Date().toISOString(),
    };

    setDraft("");
    setMessages((current) => [...current, optimisticUserMessage]);
    setStickToBottom(true);

    const response = await sendAdminAiChatMessage(
      threadId,
      prompt,
      model,
      accessMode,
      modelPreset
    );
    setSending(false);

    if (!response.success) {
      const message = response.error || "Failed to send message";
      setRequestError(message);
      setFailedPrompt(prompt);
      toast.error(message);
      return;
    }

    if (selectedThreadIdRef.current === threadId) {
      setMessages((current) => [
        ...current.filter((message) => message._id !== pendingId),
        response.data.userMessage,
        response.data.assistantMessage,
      ]);
    }

    await loadWorkspace(threadId);
  };

  const submitMessage = (event: FormEvent) => {
    event.preventDefault();
    sendPrompt(draft);
  };

  const handleComposerKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    sendPrompt(draft);
  };

  const handleMessagesScroll = () => {
    const element = messagesRef.current;
    if (!element) return;

    const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    setStickToBottom(distanceToBottom < 180);
  };

  const updateThreadLocally = (thread: AdminAiChatThread) => {
    setThreads((current) =>
      current.map((item) => (item._id === thread._id ? { ...item, ...thread } : item))
    );
  };

  const togglePinThread = async (thread: AdminAiChatThread) => {
    closeMenus();
    const nextPinned = !thread.isPinned;
    updateThreadLocally({ ...thread, isPinned: nextPinned });

    const response = await updateAdminAiChatThread(thread._id, {
      isPinned: nextPinned,
    });

    if (!response.success) {
      updateThreadLocally(thread);
      toast.error(response.error || "Failed to update pin");
      return;
    }

    updateThreadLocally(response.data);
  };

  const copyAssistantMessage = async (message: AdminAiChatMessage) => {
    try {
      await copyText(message.content);
      toast.success("Message copied");
    } catch (error) {
      toast.error("Could not copy message");
    }
  };

  const openToolRunsPanel = async (message: AdminAiChatMessage) => {
    const threadId = String(message.threadId || selectedThreadIdRef.current || "");
    if (!threadId || !message._id) {
      toast.error("Tool run context is missing");
      return;
    }

    setToolRunsPanel({
      message,
      runs: [],
      loading: true,
      error: "",
    });

    const response = await fetchAdminAiChatToolRuns(threadId, message._id);

    if (!response.success) {
      setToolRunsPanel({
        message,
        runs: [],
        loading: false,
        error: response.error || "Failed to load tool runs",
      });
      return;
    }

    setToolRunsPanel({
      message,
      runs: response.data,
      loading: false,
      error: "",
    });
  };

  const applyToolRunActionResult = (
    toolRunId: string,
    data: {
      approvalStatus?: string;
      status?: AdminAiChatToolRun["status"];
      resultSummary?: Record<string, unknown>;
      createdCount?: number;
      updatedCount?: number;
      modifiedCount?: number;
      affectedIds?: string[];
      error?: string;
    }
  ) => {
    setToolRunsPanel((current) => {
      if (!current) return current;

      return {
        ...current,
        runs: current.runs.map((run) => {
          if (getToolRunApprovalId(run) !== toolRunId) return run;

          return {
            ...run,
            status: data.status || run.status,
            resultSummary: {
              ...(run.resultSummary || {}),
              ...(data.resultSummary || {}),
              toolRunId,
              approvalStatus: data.approvalStatus,
              status: data.status,
              createdCount: data.createdCount,
              updatedCount: data.updatedCount,
              modifiedCount: data.modifiedCount,
              affectedIds: data.affectedIds,
              error: data.error,
            },
          };
        }),
      };
    });
  };

  const handleToolRunApproval = async (
    toolRunId: string,
    action: "approve" | "reject",
    approvalBody: { editedPayload?: VestingReviewJson; adminNote?: string } = {}
  ) => {
    if (!toolRunId || approvalActionRunId) return;

    setApprovalActionRunId(toolRunId);
    const response =
      action === "approve"
        ? await approveAdminAiChatToolRun(toolRunId, approvalBody)
        : await rejectAdminAiChatToolRun(toolRunId);
    setApprovalActionRunId("");

    if (!response.success) {
      toast.error(response.error || `Failed to ${action} tool run`);
      return;
    }

    applyToolRunActionResult(toolRunId, response.data);
    toast.success(action === "approve" ? "Tool run approved" : "Tool run rejected");
  };

  const openVestingCompare = (payload: VestingReviewComparePayload, sourceRun?: AdminAiChatToolRun) => {
    setVestingCompareModal({
      payload,
      toolRunId: sourceRun ? getToolRunApprovalId(sourceRun) : undefined,
      sourceRun,
    });
    setVestingCompareDraft(cloneVestingJson(payload.proposedJson));
    setVestingCompareEditing(false);
    setVestingCompareNote("");
  };

  const closeVestingCompare = () => {
    setVestingCompareModal(null);
    setVestingCompareDraft(null);
    setVestingCompareEditing(false);
    setVestingCompareNote("");
  };

  const openVestingCompareFromMessage = async (message: AdminAiChatMessage) => {
    if (!selectedThreadId) return;
    const response = await fetchAdminAiChatToolRuns(selectedThreadId, message._id);
    if (!response.success) {
      toast.error(response.error || "Failed to load compare payload");
      return;
    }
    const sourceRun = response.data.find((run) => getVestingComparePayload(run.resultSummary));
    const payload = sourceRun ? getVestingComparePayload(sourceRun.resultSummary) : null;
    if (!payload) {
      toast.error("No vesting compare payload found for this message");
      return;
    }
    openVestingCompare(payload, sourceRun);
  };

  const updateVestingCompareRow = (
    section: keyof VestingReviewJson,
    index: number,
    key: string,
    value: string
  ) => {
    setVestingCompareDraft((current) => {
      if (!current) return current;
      const next = cloneVestingJson(current);
      const rows = next[section];
      if (!Array.isArray(rows)) return current;
      const numericFields = new Set([
        "percent",
        "amount",
        "saleId",
        "totalAmount",
        "tgeUnlockPercent",
        "vestingDurationMonths",
      ]);
      rows[index] = {
        ...rows[index],
        [key]: numericFields.has(key) && value !== "" ? Number(value) : value,
      };
      return next;
    });
  };

  const approveVestingCompare = async () => {
    if (!vestingCompareModal?.toolRunId || !vestingCompareDraft) {
      toast.error("This compare payload is not linked to a pending approval run");
      return;
    }
    await handleToolRunApproval(vestingCompareModal.toolRunId, "approve", {
      editedPayload: vestingCompareDraft,
      adminNote: vestingCompareNote.trim() || undefined,
    });
    closeVestingCompare();
  };

  const rejectVestingCompare = async () => {
    if (!vestingCompareModal?.toolRunId) {
      toast.error("This compare payload is not linked to a pending approval run");
      return;
    }
    await handleToolRunApproval(vestingCompareModal.toolRunId, "reject");
    closeVestingCompare();
  };

  const openRenameThread = (thread: AdminAiChatThread) => {
    closeMenus();
    setModal({ type: "renameThread", thread, value: thread.title });
  };

  const openMoveThread = (thread: AdminAiChatThread) => {
    closeMenus();
    setModal({
      type: "moveThread",
      thread,
      folderId: getThreadFolderId(thread) || UNSORTED_FOLDER_ID,
    });
  };

  const openDeleteThread = (thread: AdminAiChatThread) => {
    closeMenus();
    setModal({ type: "deleteThread", thread });
  };

  const renameThread = async () => {
    if (!modal || modal.type !== "renameThread") return;

    const title = modal.value.trim();
    if (!title) {
      toast.error("Chat title is required");
      return;
    }

    const previous = modal.thread;
    updateThreadLocally({ ...previous, title });
    setModal(null);

    const response = await updateAdminAiChatThread(previous._id, { title });
    if (!response.success) {
      updateThreadLocally(previous);
      toast.error(response.error || "Failed to rename chat");
      return;
    }

    updateThreadLocally(response.data);
    toast.success("Chat renamed");
  };

  const deleteThread = async () => {
    if (!modal || modal.type !== "deleteThread") return;

    const previousThreads = threads;
    const deletedThread = modal.thread;
    const nextThreads = threads.filter((thread) => thread._id !== deletedThread._id);
    setModal(null);
    setThreads(nextThreads);

    if (selectedThreadIdRef.current === deletedThread._id) {
      const nextThreadId = nextThreads[0]?._id || "";
      setSelectedThreadId(nextThreadId);
      selectedThreadIdRef.current = nextThreadId;
      if (!nextThreadId) setMessages([]);
    }

    const response = await deleteAdminAiChatThread(deletedThread._id);
    if (!response.success) {
      setThreads(previousThreads);
      setSelectedThreadId(deletedThread._id);
      selectedThreadIdRef.current = deletedThread._id;
      toast.error(response.error || "Failed to delete chat");
      return;
    }

    toast.success("Chat deleted");
  };

  const moveThread = async () => {
    if (!modal || modal.type !== "moveThread") return;

    const folderId = modal.folderId === UNSORTED_FOLDER_ID ? null : modal.folderId;
    const previous = modal.thread;
    updateThreadLocally({ ...previous, folderId });
    setModal(null);

    const response = await updateAdminAiChatThread(previous._id, { folderId });
    if (!response.success) {
      updateThreadLocally(previous);
      toast.error(response.error || "Failed to move chat");
      return;
    }

    updateThreadLocally(response.data);
    toast.success("Chat moved");
  };

  const createFolder = async () => {
    if (!modal || modal.type !== "createFolder") return;

    const name = modal.value.trim();
    if (!name) {
      toast.error("Folder name is required");
      return;
    }

    const response = await createAdminAiChatFolder(name);
    if (!response.success) {
      toast.error(response.error || "Failed to create folder");
      return;
    }

    setFolders((current) => [response.data, ...current]);
    setCollapsedFolders((current) => ({ ...current, [response.data._id]: false }));
    setModal(null);
    toast.success("Folder created");
  };

  const renameFolder = async () => {
    if (!modal || modal.type !== "renameFolder") return;

    const name = modal.value.trim();
    if (!name) {
      toast.error("Folder name is required");
      return;
    }

    const previous = modal.folder;
    setFolders((current) =>
      current.map((folder) => (folder._id === previous._id ? { ...folder, name } : folder))
    );
    setModal(null);

    const response = await updateAdminAiChatFolder(previous._id, name);
    if (!response.success) {
      setFolders((current) =>
        current.map((folder) => (folder._id === previous._id ? previous : folder))
      );
      toast.error(response.error || "Failed to rename folder");
      return;
    }

    setFolders((current) =>
      current.map((folder) => (folder._id === previous._id ? response.data : folder))
    );
    toast.success("Folder renamed");
  };

  const deleteFolder = async () => {
    if (!modal || modal.type !== "deleteFolder") return;

    const deletedFolder = modal.folder;
    setModal(null);

    const response = await deleteAdminAiChatFolder(deletedFolder._id);
    if (!response.success) {
      toast.error(response.error || "Failed to delete folder");
      return;
    }

    setFolders((current) => current.filter((folder) => folder._id !== deletedFolder._id));
    setThreads((current) =>
      current.map((thread) =>
        getThreadFolderId(thread) === String(deletedFolder._id)
          ? { ...thread, folderId: null }
          : thread
      )
    );
    toast.success("Folder deleted. Chats moved to Unsorted");
  };

  const submitModal = (event: FormEvent) => {
    event.preventDefault();
    if (!modal) return;

    if (modal.type === "renameThread") renameThread();
    if (modal.type === "moveThread") moveThread();
    if (modal.type === "createFolder") createFolder();
    if (modal.type === "renameFolder") renameFolder();
  };

  const updateModalValue = (value: string) => {
    setModal((current) => {
      if (!current) return current;
      if (current.type === "renameThread") return { ...current, value };
      if (current.type === "createFolder") return { ...current, value };
      if (current.type === "renameFolder") return { ...current, value };
      return current;
    });
  };

  const updateMoveFolder = (folderId: string) => {
    setModal((current) => {
      if (!current || current.type !== "moveThread") return current;
      return { ...current, folderId };
    });
  };

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((current) => ({ ...current, [folderId]: !current[folderId] }));
  };

  const renderInlineContent = (value: string) => {
    const parts = value.split(/(`[^`]+`)/g);

    return parts.map((part, index) => {
      if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
        return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>;
      }

      return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
    });
  };

  const renderTextBlock = (block: string, key: string) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    const json = prettyJson(trimmed);
    if (json) {
      return (
        <pre className={classes.codeBlock} key={key}>
          <code>{json}</code>
        </pre>
      );
    }

    const lines = trimmed.split("\n");
    const isUnordered = lines.every((line) => /^\s*[-*]\s+/.test(line));
    const isOrdered = lines.every((line) => /^\s*\d+\.\s+/.test(line));

    if (isUnordered) {
      return (
        <ul className={classes.markdownList} key={key}>
          {lines.map((line, index) => (
            <li key={`${line}-${index}`}>{renderInlineContent(line.replace(/^\s*[-*]\s+/, ""))}</li>
          ))}
        </ul>
      );
    }

    if (isOrdered) {
      return (
        <ol className={classes.markdownList} key={key}>
          {lines.map((line, index) => (
            <li key={`${line}-${index}`}>{renderInlineContent(line.replace(/^\s*\d+\.\s+/, ""))}</li>
          ))}
        </ol>
      );
    }

    return (
      <p key={key}>
        {lines.map((line, index) => (
          <React.Fragment key={`${line}-${index}`}>
            {index > 0 ? <br /> : null}
            {renderInlineContent(line)}
          </React.Fragment>
        ))}
      </p>
    );
  };

  const renderMarkdown = (content: string) => {
    const nodes: ReactNode[] = [];
    const regex = /```(\w+)?\n?([\s\S]*?)```/g;
    let cursor = 0;
    let match = regex.exec(content);

    while (match) {
      const before = content.slice(cursor, match.index);
      before
        .split(/\n{2,}/)
        .forEach((block, index) => nodes.push(renderTextBlock(block, `${match?.index}-before-${index}`)));

      nodes.push(
        <pre className={classes.codeBlock} key={`code-${match.index}`}>
          <code>{match[2].trim()}</code>
        </pre>
      );

      cursor = match.index + match[0].length;
      match = regex.exec(content);
    }

    content
      .slice(cursor)
      .split(/\n{2,}/)
      .forEach((block, index) => nodes.push(renderTextBlock(block, `after-${index}`)));

    return nodes.filter(Boolean);
  };

  const downloadArtifact = async (artifactId: string) => {
    const response = await fetchAdminAiChatArtifact(artifactId);
    if (!response.success) {
      toast.error(response.error || "Failed to prepare the download");
      return;
    }

    setArtifactsById((current) => ({ ...current, [response.data.id]: response.data }));
    const downloadUrl = getAdminAiChatArtifactDownloadUrl(response.data);
    if (response.data.status !== "ready" || !downloadUrl) {
      toast.info("The JSON file is still being generated");
      return;
    }

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = response.data.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderArtifact = (artifact: AdminAiChatArtifact) => {
    const current = artifactsById[artifact.id] || artifact;
    const isPending = current.status === "queued" || current.status === "processing";
    const statusLabel =
      current.status === "ready"
        ? "Ready"
        : current.status === "failed"
          ? "Failed"
          : current.status === "processing"
            ? `Generating ${Math.max(0, Math.min(99, Number(current.progress || 0)))}%`
            : "Queued";

    return (
      <div
        className={`${classes.artifactCard} ${
          current.status === "failed" ? classes.artifactCardFailed : ""
        }`}
        key={current.id}
      >
        <div className={classes.artifactHeader}>
          <div>
            <strong>{current.filename || `${current.collectionName}.json`}</strong>
            <span>{current.collectionName}</span>
          </div>
          <span className={classes.artifactStatus}>{statusLabel}</span>
        </div>
        {isPending ? (
          <div className={classes.artifactProgress} aria-label={statusLabel}>
            <span style={{ width: `${Math.max(2, Math.min(99, Number(current.progress || 0)))}%` }} />
          </div>
        ) : null}
        <div className={classes.artifactFacts}>
          <span>{String(current.format || "json").toUpperCase()}</span>
          <span>{current.compression === "gzip" ? "GZIP" : "Uncompressed"}</span>
          {current.documentCount ? <span>{current.documentCount.toLocaleString()} documents</span> : null}
          {current.bytes ? <span>{formatBytes(current.bytes)}</span> : null}
        </div>
        {current.status === "failed" ? (
          <div className={classes.artifactError}>
            {current.errorMessage || current.errorCode || "JSON export failed"}
          </div>
        ) : null}
        {current.status === "ready" ? (
          <button
            className={classes.artifactDownload}
            onClick={() => downloadArtifact(current.id)}
            type="button"
          >
            <Icon name="download" />
            Download file
          </button>
        ) : null}
      </div>
    );
  };

  const renderMessage = (message: AdminAiChatMessage) => {
    const isUser = message.role === "user";
    const isSystem = message.role === "system";
    const isError = message.status === "error";
    const label = isUser ? "Admin" : isSystem ? "System" : "FOMO v2 AI";
    const toolCount = !isUser ? getToolCallsCount(message) : 0;
    const requestId = !isUser ? getRequestId(message) : "";
    const metadataLabel = !isUser ? formatAssistantMetadata(message) : "";
    const toolNames = Array.isArray((message.metadata?.toolCallsSummary as any)?.names)
      ? ((message.metadata?.toolCallsSummary as any).names as unknown[]).map((item) => String(item))
      : [];
    const canOpenVestingCompare = toolNames.includes("fomoV2BuildVestingReviewProposal");
    const messageArtifacts = getMessageArtifacts(message);
    const metadataTitle = !isUser
      ? [
          metadataLabel,
          requestId ? `Request ID: ${requestId}` : "",
          message.metadata?.trackingId
            ? `Tracking ID: ${String(message.metadata.trackingId)}`
            : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "";

    return (
      <div
        className={`${classes.messageRow} ${isUser ? classes.userRow : classes.assistantRow}`}
        key={message._id}
      >
        <div
          className={`${classes.messageAvatar} ${isUser ? classes.userAvatar : ""} ${
            isSystem ? classes.systemAvatar : ""
          }`}
        >
          {isUser ? "A" : isSystem ? "S" : <Icon name="spark" />}
        </div>
        <div
          className={`${classes.bubble} ${isUser ? classes.userBubble : ""} ${
            isSystem ? classes.systemBubble : ""
          } ${isError ? classes.errorBubble : ""}`}
        >
          <div className={`${classes.bubbleMeta} ${isUser ? classes.userMeta : ""}`}>
            <span>{label}</span>
            <span>{formatDate(message.createdAt)}</span>
          </div>
          {!isUser && metadataLabel ? (
            <div className={classes.assistantMetaLine} title={metadataTitle}>
              {metadataLabel}
            </div>
          ) : null}
          <div className={classes.messageContent}>{renderMarkdown(message.content)}</div>
          {messageArtifacts.length ? (
            <div className={classes.artifactList}>
              {messageArtifacts.map(renderArtifact)}
            </div>
          ) : null}
          {!isUser ? (
            <div className={classes.messageActions}>
              {toolCount ? (
                <button
                  className={classes.toolRunsButton}
                  onClick={() => openToolRunsPanel(message)}
                  title="View tool run details"
                  type="button"
                >
                  <Icon name="tool" />
                  Tools used: {toolCount}
                </button>
              ) : null}
              {canOpenVestingCompare ? (
                <button
                  className={classes.toolRunsButton}
                  onClick={() => openVestingCompareFromMessage(message)}
                  title="Open vesting compare"
                  type="button"
                >
                  <Icon name="panel" />
                  Compare
                </button>
              ) : null}
              <button
                className={classes.ghostIconButton}
                onClick={() => copyAssistantMessage(message)}
                title="Copy message"
                type="button"
              >
                <Icon name="copy" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderThreadMenu = (thread: AdminAiChatThread) => {
    if (openThreadMenuId !== thread._id) return null;

    return (
      <div className={classes.dropdownMenu} onClick={(event) => event.stopPropagation()}>
        <button onClick={() => openRenameThread(thread)} type="button">
          <Icon name="edit" />
          Rename
        </button>
        <button onClick={() => openMoveThread(thread)} type="button">
          <Icon name="move" />
          Move to folder
        </button>
        <button onClick={() => togglePinThread(thread)} type="button">
          <Icon name="pin" />
          {thread.isPinned ? "Unpin" : "Pin"}
        </button>
        <button className={classes.dangerMenuItem} onClick={() => openDeleteThread(thread)} type="button">
          <Icon name="trash" />
          Delete
        </button>
      </div>
    );
  };

  const renderThread = (thread: AdminAiChatThread) => (
    <div
      className={`${classes.threadButton} ${
        selectedThreadId === thread._id ? classes.activeThread : ""
      }`}
      key={thread._id}
      onClick={() => setSelectedThread(thread._id)}
      title={thread.title}
    >
      <div className={classes.threadMain}>
        <div className={classes.threadTitleRow}>
          <span className={classes.threadTitle}>{thread.title}</span>
          {thread.isPinned ? (
            <span className={classes.pinBadge} title="Pinned">
              <Icon name="pin" />
            </span>
          ) : null}
        </div>
        <span className={classes.threadMeta}>
          {formatDate(thread.updatedAt || thread.createdAt)} -{" "}
          {previewText(thread.lastMessage?.content)}
        </span>
      </div>
      <button
        className={classes.threadMenuButton}
        onClick={(event) => {
          event.stopPropagation();
          setOpenFolderMenuId("");
          setOpenThreadMenuId(openThreadMenuId === thread._id ? "" : thread._id);
        }}
        title="Chat actions"
        type="button"
      >
        <Icon name="menu" />
      </button>
      {renderThreadMenu(thread)}
    </div>
  );

  const renderFolderMenu = (folder: AdminAiChatFolder) => {
    if (openFolderMenuId !== folder._id) return null;

    return (
      <div className={classes.dropdownMenu} onClick={(event) => event.stopPropagation()}>
        <button
          onClick={() => {
            closeMenus();
            setModal({ type: "renameFolder", folder, value: folder.name });
          }}
          type="button"
        >
          <Icon name="edit" />
          Rename folder
        </button>
        <button
          onClick={() => {
            closeMenus();
            startThread(folder._id);
          }}
          type="button"
        >
          <Icon name="plus" />
          New chat here
        </button>
        <button
          className={classes.dangerMenuItem}
          onClick={() => {
            closeMenus();
            setModal({ type: "deleteFolder", folder });
          }}
          type="button"
        >
          <Icon name="trash" />
          Delete folder
        </button>
      </div>
    );
  };

  const renderFolderSection = (
    id: string,
    title: string,
    folderThreads: AdminAiChatThread[],
    folder?: AdminAiChatFolder
  ) => {
    const collapsed = Boolean(collapsedFolders[id]);
    const isEmptySearch = searchValue.trim() && !folderThreads.length;

    if (folder && isEmptySearch) return null;

    return (
      <div className={classes.folderSection} key={id}>
        <div className={classes.folderHeader}>
          <button
            className={`${classes.folderToggle} ${collapsed ? "" : classes.folderOpen}`}
            onClick={() => toggleFolder(id)}
            title={collapsed ? "Expand folder" : "Collapse folder"}
            type="button"
          >
            <Icon name="chevron" />
          </button>
          <Icon name="folder" />
          <span title={title}>{title}</span>
          <small>{folderThreads.length}</small>
          {folder ? (
            <button
              className={classes.folderMenuButton}
              onClick={(event) => {
                event.stopPropagation();
                setOpenThreadMenuId("");
                setOpenFolderMenuId(openFolderMenuId === folder._id ? "" : folder._id);
              }}
              title="Folder actions"
              type="button"
            >
              <Icon name="menu" />
            </button>
          ) : null}
          {folder ? renderFolderMenu(folder) : null}
        </div>
        {!collapsed ? (
          <div className={classes.folderBody}>
            {folderThreads.length ? (
              folderThreads.map(renderThread)
            ) : (
              <div className={classes.sidebarEmptySmall}>No chats here</div>
            )}
          </div>
        ) : null}
      </div>
    );
  };

  const renderSkeleton = () => (
    <div className={classes.skeletonList}>
      {[0, 1, 2, 3, 4].map((item) => (
        <div className={classes.skeletonItem} key={item}>
          <span />
          <strong />
        </div>
      ))}
    </div>
  );

  const renderEmptyMessages = () => (
    <div className={classes.welcomeState}>
      <div className={classes.welcomeIcon}>
        <Icon name="spark" />
      </div>
      <h2>{selectedThread ? "Start this admin research thread" : "Ask FOMO v2 AI"}</h2>
      <p>
        Query FOMO v2 crypto data, inspect imports, compare canonical projects, or
        review missing market context.
      </p>
      <div className={classes.starters}>
        {STARTER_PROMPTS.map((prompt) => (
          <button
            className={classes.starterButton}
            key={prompt}
            onClick={() => {
              setDraft(prompt);
              textareaRef.current?.focus();
            }}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );

  const renderPending = () => {
    if (!sending) return null;

    return (
      <div className={`${classes.messageRow} ${classes.assistantRow}`}>
        <div className={classes.messageAvatar}>
          <Icon name="spark" />
        </div>
        <div className={`${classes.bubble} ${classes.pendingBubble}`}>
          <div className={classes.bubbleMeta}>
            <span>FOMO v2 AI</span>
            <span>Processing</span>
          </div>
          <div className={classes.pendingLine}>
            <span>{PROCESSING_STEPS[processingStepIndex]}</span>
            <i />
            <i />
            <i />
          </div>
          <div className={classes.pendingShimmer} />
        </div>
      </div>
    );
  };

  const renderRequestError = () => {
    if (!requestError) return null;

    return (
      <div className={classes.requestError}>
        <div>
          <strong>Request failed</strong>
          <span>{requestError}</span>
        </div>
        {failedPrompt ? (
          <button onClick={() => sendPrompt(failedPrompt)} type="button">
            <Icon name="retry" />
            Retry
          </button>
        ) : null}
      </div>
    );
  };

  const renderToolRunsPanel = () => {
    if (!toolRunsPanel) return null;

    const { message, runs, loading, error } = toolRunsPanel;
    const metadata = message.metadata || {};
    const requestId = getRequestId(message);
    const metadataRows = ([
      ["Model", metadata.model],
      ["Provider", metadata.provider],
      ["Duration", formatDuration(metadata.durationMs)],
      ["Status", metadata.status || message.status],
      ["Tracking ID", metadata.trackingId],
      ["Request ID", requestId],
      ["Error code", metadata.errorCode],
    ] as Array<[string, unknown]>).filter(([, value]) => Boolean(value));

    return (
      <div className={classes.toolRunsLayer}>
        <button
          aria-label="Close tool runs"
          className={classes.toolRunsBackdrop}
          onClick={() => setToolRunsPanel(null)}
          type="button"
        />
        <aside className={classes.toolRunsDrawer}>
          <div className={classes.toolRunsHeader}>
            <div>
              <span>Observability</span>
              <h3>Tool runs</h3>
              <p>{formatAssistantMetadata(message)}</p>
            </div>
            <button onClick={() => setToolRunsPanel(null)} title="Close" type="button">
              <Icon name="x" />
            </button>
          </div>

          <div className={classes.toolRunsMetaGrid}>
            {metadataRows.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong title={String(value)}>{String(value)}</strong>
              </div>
            ))}
          </div>

          <div className={classes.toolRunsBody}>
            {loading ? (
              <div className={classes.toolRunsState}>
                <Icon name="tool" />
                <strong>Loading tool runs</strong>
                <span>Fetching safe saved summaries...</span>
              </div>
            ) : null}

            {!loading && error ? (
              <div className={`${classes.toolRunsState} ${classes.toolRunsError}`}>
                <Icon name="retry" />
                <strong>Could not load tool runs</strong>
                <span>{error}</span>
                <button onClick={() => openToolRunsPanel(message)} type="button">
                  Retry
                </button>
              </div>
            ) : null}

            {!loading && !error && !runs.length ? (
              <div className={classes.toolRunsState}>
                <Icon name="tool" />
                <strong>No saved tool runs</strong>
                <span>This assistant message did not save tool details.</span>
              </div>
            ) : null}

            {!loading && !error
              ? runs.map((run) => {
                  const collections = getToolRunCollections(run);
                  const summary = formatToolRunSummary(run);
                  const approvalId = getToolRunApprovalId(run);
                  const pendingApproval = Boolean(approvalId && isToolRunPendingApproval(run));
                  const runStatus = formatToolRunStatus(run);
                  const resultSummary = run.resultSummary || {};
                  const comparePayload = getVestingComparePayload(resultSummary);
                  const targetDb = String(resultSummary.targetDb || resultSummary.dbName || "");
                  const dbName = String(resultSummary.dbName || "");
                  const runAccessMode = String(resultSummary.accessMode || metadata.accessMode || "");
                  const collectionName = String(resultSummary.collectionName || "");
                  const operation = String(resultSummary.operation || "");
                  const requiresApproval = resultSummary.requiresApproval === true;
                  const warnings = Array.isArray(resultSummary.warnings)
                    ? resultSummary.warnings.map((item) => String(item || "")).filter(Boolean)
                    : [];
                  const toolSuggestions = Array.isArray(resultSummary.toolSuggestions)
                    ? resultSummary.toolSuggestions.map((item) => String(item || "")).filter(Boolean)
                    : [];
                  const plannedChanges = resultSummary.plannedChanges;
                  const plannedChangesText =
                    plannedChanges === undefined
                      ? ""
                      : JSON.stringify(plannedChanges, null, 2);

                  return (
                    <div className={classes.toolRunCard} key={run._id}>
                      <div className={classes.toolRunCardHeader}>
                        <div>
                          <strong>{run.name}</strong>
                          <span>{formatDate(run.createdAt)}</span>
                        </div>
                        <em
                          className={`${run.status === "error" ? classes.toolRunFailed : ""} ${
                            runStatus === "pending" ? classes.toolRunPending : ""
                          } ${
                            runStatus === "blocked" || runStatus === "rejected"
                              ? classes.toolRunBlocked
                              : ""
                          }`}
                        >
                          {runStatus}
                        </em>
                      </div>

                      <div className={classes.toolRunFacts}>
                        <span>duration {formatDuration(run.durationMs) || "0ms"}</span>
                        {run.model ? <span>model {run.model}</span> : null}
                        {run.provider ? <span>provider {run.provider}</span> : null}
                        {run.errorCode ? <span>error {run.errorCode}</span> : null}
                        {dbName ? <span>db {dbName}</span> : null}
                        {targetDb && targetDb !== dbName ? <span>target {targetDb}</span> : null}
                        {runAccessMode ? <span>mode {runAccessMode}</span> : null}
                        {requiresApproval ? <span>requires approval</span> : null}
                        {collectionName ? <span>collection {collectionName}</span> : null}
                        {operation ? <span>operation {operation}</span> : null}
                        {warnings.length ? <span>warnings {warnings.length}</span> : null}
                      </div>

                      {collections.length ? (
                        <div className={classes.toolRunCollections}>
                          {collections.map((collection) => (
                            <span key={collection}>{collection}</span>
                          ))}
                        </div>
                      ) : null}

                      {comparePayload ? (
                        <div className={classes.toolRunCompareAction}>
                          <button onClick={() => openVestingCompare(comparePayload, run)} type="button">
                            <Icon name="panel" />
                            Compare vesting review
                          </button>
                        </div>
                      ) : null}

                      {pendingApproval ? (
                        <div className={classes.toolRunApproval}>
                          <strong>AI wants to modify</strong>
                          <div>
                            {targetDb ? <span>DB: {targetDb}</span> : null}
                            {collectionName ? <span>Collection: {collectionName}</span> : null}
                            {operation ? <span>Operation: {operation}</span> : null}
                          </div>
                          {plannedChangesText ? (
                            <pre>
                              <code>{plannedChangesText}</code>
                            </pre>
                          ) : null}
                          <div className={classes.toolRunApprovalActions}>
                            <button
                              disabled={approvalActionRunId === approvalId}
                              onClick={() => handleToolRunApproval(approvalId, "approve")}
                              type="button"
                            >
                              Approve
                            </button>
                            <button
                              disabled={approvalActionRunId === approvalId}
                              onClick={() => handleToolRunApproval(approvalId, "reject")}
                              type="button"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {summary ? (
                        <div className={classes.toolRunSummaryBlock}>
                          <button
                            onClick={() => {
                              copyText(summary)
                                .then(() => toast.success("Tool summary copied"))
                                .catch(() => toast.error("Could not copy summary"));
                            }}
                            type="button"
                          >
                            <Icon name="copy" />
                            Copy safe result
                          </button>
                          <pre className={classes.toolRunSummary}>
                            <code>{summary}</code>
                          </pre>
                        </div>
                      ) : null}

                      {toolSuggestions.length ? (
                        <div className={classes.toolRunSuggestions}>
                          {toolSuggestions.slice(0, 5).map((suggestion) => (
                            <span key={suggestion}>{suggestion}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              : null}
          </div>
        </aside>
      </div>
    );
  };

  const renderCompareSummary = (summary?: Record<string, unknown>) => (
    <div className={classes.compareSummaryGrid}>
      {COMPARE_SUMMARY_FIELDS.map((field) => (
        <span key={field.key}>
          <small>{field.label}</small>
          <strong>{toDisplayValue(summary?.[field.key])}</strong>
        </span>
      ))}
    </div>
  );

  const renderCompareTable = (
    title: string,
    rows: Array<Record<string, unknown>>,
    columns: CompareTableColumn[],
    currentRows: Array<Record<string, unknown>>,
    nameKey: string,
    section?: keyof VestingReviewJson
  ) => (
    <section className={classes.compareSection}>
      <h4>{title}</h4>
      <div className={classes.compareTableWrap}>
        <table className={classes.compareTable}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              <th>Diff status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, rowIndex) => {
                const status = currentRows.length ? rowDiffStatus(row, currentRows, nameKey) : "current";
                const diffClass =
                  status === "added"
                    ? classes.compareDiffAdded
                    : status === "changed"
                      ? classes.compareDiffChanged
                      : status === "unchanged"
                        ? classes.compareDiffUnchanged
                        : "";
                return (
                  <tr key={`${title}-${rowIndex}`}>
                    {columns.map((column) => (
                      <td key={column.key}>
                        {vestingCompareEditing && section && EDITABLE_VESTING_FIELDS.has(column.key) ? (
                          <input
                            onChange={(event) =>
                              updateVestingCompareRow(section, rowIndex, column.key, event.target.value)
                            }
                            value={row[column.key] === undefined || row[column.key] === null ? "" : String(row[column.key])}
                          />
                        ) : (
                          toDisplayValue(row[column.key])
                        )}
                      </td>
                    ))}
                    <td>
                      <span className={`${classes.compareDiffBadge} ${diffClass}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length + 1}>No records</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderCompareColumn = (
    title: string,
    json: VestingReviewJson | null | undefined,
    currentJson: VestingReviewJson | null | undefined,
    editable: boolean
  ) => {
    const data = json || {
      tokenAllocation: [],
      vestingRounds: [],
      vestingSummary: {},
      vestingSchedule: [],
      vestingTimeline: [],
    };

    return (
      <div className={classes.compareColumn}>
        <div className={classes.compareColumnHeader}>
          <h3>{title}</h3>
          <span>
            {(data.tokenAllocation || []).length} allocations / {(data.vestingSchedule || []).length} schedules
          </span>
        </div>
        <section className={classes.compareSection}>
          <h4>Vesting Summary</h4>
          {renderCompareSummary(data.vestingSummary)}
        </section>
        {renderCompareTable(
          "Token Allocation",
          data.tokenAllocation || [],
          COMPARE_ALLOCATION_COLUMNS,
          currentJson?.tokenAllocation || [],
          "name",
          editable ? "tokenAllocation" : undefined
        )}
        {renderCompareTable(
          "Vesting Rounds",
          data.vestingRounds || [],
          COMPARE_ROUND_COLUMNS,
          currentJson?.vestingRounds || [],
          "roundName",
          editable ? "vestingRounds" : undefined
        )}
        {renderCompareTable(
          "Vesting Schedule",
          data.vestingSchedule || [],
          COMPARE_ROUND_COLUMNS,
          currentJson?.vestingSchedule || [],
          "roundName",
          editable ? "vestingSchedule" : undefined
        )}
        {renderCompareTable(
          "Vesting Timeline",
          data.vestingTimeline || [],
          COMPARE_ROUND_COLUMNS,
          currentJson?.vestingTimeline || [],
          "roundName",
          editable ? "vestingTimeline" : undefined
        )}
      </div>
    );
  };

  const renderVestingCompareModal = () => {
    if (!vestingCompareModal || !vestingCompareDraft) return null;

    const { payload, toolRunId } = vestingCompareModal;
    const currentJson = payload.currentJson || null;
    const proposedJson = vestingCompareDraft;
    const localDiff = recomputeLocalDiff(currentJson, proposedJson);
    const edited =
      JSON.stringify(proposedJson) !== JSON.stringify(payload.proposedJson || {});
    const projectName = String(payload.project?.name || "Vesting review");
    const projectSymbol = payload.project?.symbol ? ` / ${String(payload.project.symbol)}` : "";
    const confidence = Number(payload.confidence || 0);
    const issues = payload.issues || [];
    const sources = payload.sourcesUsed || [];
    const pending = toolRunId && approvalActionRunId === toolRunId;

    return (
      <div className={classes.compareModalLayer}>
        <button
          aria-label="Close vesting compare"
          className={classes.modalBackdrop}
          onClick={closeVestingCompare}
          type="button"
        />
        <div className={classes.compareModalCard}>
          <div className={classes.compareModalHeader}>
            <div>
              <span>Vesting Review Compare</span>
              <h2>{projectName}{projectSymbol}</h2>
            </div>
            <button onClick={closeVestingCompare} title="Close" type="button">
              <Icon name="x" />
            </button>
          </div>

          <div className={classes.compareBadges}>
            <span>Recommendation: {payload.recommendation || "manual_review"}</span>
            <span>Confidence: {confidence ? `${Math.round(confidence * 100)}%` : "-"}</span>
            <span>Sources: {sources.length}</span>
            <span>Issues: {issues.length}</span>
            {edited ? <strong>Unsaved edits</strong> : null}
          </div>

          <div className={classes.compareDiffSummary}>
            <span>Added {localDiff.added}</span>
            <span>Changed {localDiff.changed}</span>
            <span>Removed {localDiff.removed}</span>
            <span>Unchanged {localDiff.unchanged}</span>
          </div>

          <div className={classes.compareColumns}>
            {renderCompareColumn("Current data", currentJson, currentJson, false)}
            {renderCompareColumn("Proposed data", proposedJson, currentJson, true)}
          </div>

          <div className={classes.compareMetaGrid}>
            <section className={classes.compareSection}>
              <h4>SaleId Map</h4>
              <div className={classes.compareTableWrap}>
                <table className={classes.compareTable}>
                  <thead>
                    <tr>
                      <th>saleId</th>
                      <th>canonicalName</th>
                      <th>sourceNames</th>
                      <th>allocation</th>
                      <th>round</th>
                      <th>schedule</th>
                      <th>timeline</th>
                      <th>warnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(payload.saleIdMap || []).length ? (
                      (payload.saleIdMap || []).map((item, index) => (
                        <tr key={`sale-${index}`}>
                          <td>{toDisplayValue(item.saleId)}</td>
                          <td>{toDisplayValue(item.canonicalName)}</td>
                          <td>{toDisplayValue(item.sourceNames)}</td>
                          <td>{toDisplayValue(item.linkedTokenAllocation)}</td>
                          <td>{toDisplayValue(item.linkedVestingRound)}</td>
                          <td>{toDisplayValue(item.linkedVestingSchedule)}</td>
                          <td>{toDisplayValue(item.linkedTimeline)}</td>
                          <td>{toDisplayValue(item.warnings)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8}>No saleId map</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={classes.compareSection}>
              <h4>Issues</h4>
              <div className={classes.compareIssueList}>
                {issues.length ? (
                  issues.map((issue, index) => (
                    <span key={`issue-${index}`}>
                      <strong>{toDisplayValue(issue.severity)} / {toDisplayValue(issue.type)}</strong>
                      <small>{toDisplayValue(issue.path)}</small>
                      {toDisplayValue(issue.reason)}
                    </span>
                  ))
                ) : (
                  <p>No issues</p>
                )}
              </div>
            </section>

            <section className={classes.compareSection}>
              <h4>Sources</h4>
              <div className={classes.compareIssueList}>
                {sources.length ? (
                  sources.map((source, index) => (
                    <span key={`source-${index}`}>
                      <strong>{toDisplayValue(source.sourceType)} / {toDisplayValue(source.officialLikelihood)}</strong>
                      <small>{toDisplayValue(source.evidenceStrength)}</small>
                      {toDisplayValue(source.url)}
                    </span>
                  ))
                ) : (
                  <p>No sources</p>
                )}
              </div>
            </section>
          </div>

          <label className={classes.compareNote}>
            <span>Admin note</span>
            <textarea
              onChange={(event) => setVestingCompareNote(event.target.value)}
              placeholder="Optional approval note"
              value={vestingCompareNote}
            />
          </label>

          <div className={classes.compareModalFooter}>
            <button className={classes.secondaryButton} onClick={closeVestingCompare} type="button">
              Close
            </button>
            {vestingCompareEditing ? (
              <>
                <button
                  className={classes.secondaryButton}
                  onClick={() => {
                    setVestingCompareDraft(cloneVestingJson(payload.proposedJson));
                    setVestingCompareEditing(false);
                  }}
                  type="button"
                >
                  Cancel edits
                </button>
                <button className={classes.primaryButton} onClick={() => setVestingCompareEditing(false)} type="button">
                  Save edits
                </button>
              </>
            ) : (
              <button className={classes.secondaryButton} onClick={() => setVestingCompareEditing(true)} type="button">
                Edit
              </button>
            )}
            <button
              className={classes.dangerButton}
              disabled={!toolRunId || Boolean(pending)}
              onClick={rejectVestingCompare}
              type="button"
            >
              Reject
            </button>
            <button
              className={classes.primaryButton}
              disabled={!toolRunId || Boolean(pending)}
              onClick={approveVestingCompare}
              type="button"
            >
              {edited ? "Approve edited" : "Approve"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!modal) return null;

    const isDeleteThread = modal.type === "deleteThread";
    const isDeleteFolder = modal.type === "deleteFolder";
    const isDanger = isDeleteThread || isDeleteFolder;
    const title =
      modal.type === "renameThread"
        ? "Rename chat"
        : modal.type === "deleteThread"
        ? "Delete chat"
        : modal.type === "moveThread"
        ? "Move chat"
        : modal.type === "createFolder"
        ? "Create folder"
        : modal.type === "renameFolder"
        ? "Rename folder"
        : "Delete folder";

    return (
      <div className={classes.modalLayer}>
        <button
          aria-label="Close dialog"
          className={classes.modalBackdrop}
          onClick={() => setModal(null)}
          type="button"
        />
        <form className={classes.modalCard} onSubmit={submitModal}>
          <div className={classes.modalHeader}>
            <h3>{title}</h3>
            <button onClick={() => setModal(null)} title="Close" type="button">
              <Icon name="x" />
            </button>
          </div>

          {modal.type === "renameThread" ||
          modal.type === "createFolder" ||
          modal.type === "renameFolder" ? (
            <label className={classes.modalField}>
              <span>{modal.type === "createFolder" ? "Folder name" : "Name"}</span>
              <input
                autoFocus
                onChange={(event) => updateModalValue(event.target.value)}
                value={modal.value}
              />
            </label>
          ) : null}

          {modal.type === "moveThread" ? (
            <div className={classes.moveList}>
              <button
                className={
                  modal.folderId === UNSORTED_FOLDER_ID ? classes.activeMoveOption : ""
                }
                onClick={() => updateMoveFolder(UNSORTED_FOLDER_ID)}
                type="button"
              >
                <Icon name="folder" />
                Unsorted
              </button>
              {folders.map((folder) => (
                <button
                  className={modal.folderId === folder._id ? classes.activeMoveOption : ""}
                  key={folder._id}
                  onClick={() => updateMoveFolder(folder._id)}
                  type="button"
                >
                  <Icon name="folder" />
                  {folder.name}
                </button>
              ))}
            </div>
          ) : null}

          {isDeleteThread ? (
            <p className={classes.confirmText}>
              Delete &quot;{modal.thread.title}&quot; and its messages? This action cannot be undone.
            </p>
          ) : null}

          {isDeleteFolder ? (
            <p className={classes.confirmText}>
              Delete &quot;{modal.folder.name}&quot;? Chats inside this folder will move to Unsorted.
            </p>
          ) : null}

          <div className={classes.modalActions}>
            <button className={classes.secondaryButton} onClick={() => setModal(null)} type="button">
              Cancel
            </button>
            {isDeleteThread ? (
              <button className={classes.dangerButton} onClick={deleteThread} type="button">
                Delete chat
              </button>
            ) : isDeleteFolder ? (
              <button className={classes.dangerButton} onClick={deleteFolder} type="button">
                Delete folder
              </button>
            ) : (
              <button className={isDanger ? classes.dangerButton : classes.primaryButton} type="submit">
                Save
              </button>
            )}
          </div>
        </form>
      </div>
    );
  };

  return (
    <Layout>
      <div className={classes.page} onClick={closeMenus}>
        <div className={`${classes.shell} ${sidebarCollapsed ? classes.collapsedShell : ""}`}>
          <aside className={`${classes.sidebar} ${sidebarCollapsed ? classes.collapsedSidebar : ""}`}>
            <div className={classes.sidebarHeader}>
              <button
                className={classes.collapseButton}
                onClick={(event) => {
                  event.stopPropagation();
                  setSidebarCollapsed((current) => !current);
                }}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                type="button"
              >
                <Icon name="panel" />
              </button>
              {!sidebarCollapsed ? (
                <div>
                  <h1>AI Chat</h1>
                  <span>{threadStats}</span>
                </div>
              ) : null}
            </div>

            {!sidebarCollapsed ? (
              <>
                <div className={classes.sidebarActions}>
                  <button
                    className={classes.newButton}
                    disabled={threadsLoading || sending || creatingThread}
                    onClick={(event) => {
                      event.stopPropagation();
                      startThread();
                    }}
                    title="Create new chat"
                    type="button"
                  >
                    <Icon name="plus" />
                    New chat
                  </button>
                  <button
                    className={classes.iconOnlyButton}
                    onClick={(event) => {
                      event.stopPropagation();
                      closeMenus();
                      setModal({ type: "createFolder", value: "" });
                    }}
                    title="Create folder"
                    type="button"
                  >
                    <Icon name="folder" />
                  </button>
                </div>

                <label className={classes.searchBox}>
                  <Icon name="search" />
                  <input
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Search chats"
                    value={searchValue}
                  />
                  {searchValue ? (
                    <button
                      onClick={() => setSearchValue("")}
                      title="Clear search"
                      type="button"
                    >
                      <Icon name="x" />
                    </button>
                  ) : null}
                </label>

                <div className={classes.threadList}>
                  {threadsLoading ? renderSkeleton() : null}
                  {!threadsLoading ? (
                    <>
                      {folderGroups.map((group) =>
                        renderFolderSection(
                          group.folder._id,
                          group.folder.name,
                          group.threads,
                          group.folder
                        )
                      )}
                      {renderFolderSection(UNSORTED_FOLDER_ID, "Unsorted", unsortedThreads)}
                    </>
                  ) : null}

                  {!threadsLoading && !filteredThreads.length ? (
                    <div className={classes.sidebarEmpty}>
                      <Icon name="search" />
                      <strong>{searchValue ? "No matching chats" : "No chats yet"}</strong>
                      <span>
                        {searchValue
                          ? "Try another search query."
                          : "Create a thread and start asking about FOMO v2 data."}
                      </span>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className={classes.collapsedActions}>
                <button
                  disabled={threadsLoading || sending || creatingThread}
                  onClick={(event) => {
                    event.stopPropagation();
                    startThread();
                  }}
                  title="New chat"
                  type="button"
                >
                  <Icon name="plus" />
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setModal({ type: "createFolder", value: "" });
                  }}
                  title="Create folder"
                  type="button"
                >
                  <Icon name="folder" />
                </button>
              </div>
            )}
          </aside>

          <section className={`${classes.chatPanel} ${isFullscreen ? classes.fullscreenChatPanel : ""}`}>
            <div className={classes.chatHeader}>
              <div>
                <h2>{selectedThread?.title || "AI Chat"}</h2>
                <p>
                  {selectedThread
                    ? `${formatDate(selectedThread.updatedAt || selectedThread.createdAt)}${
                        selectedThread.isPinned ? " - pinned" : ""
                      }`
                    : "Create or select a chat to begin."}
                </p>
              </div>
              <div className={classes.chatHeaderActions}>
                <label className={classes.accessModeControl} title="Admin AI access mode">
                  <span>Access Mode</span>
                  <AdminSelect
                    disabled={sending}
                    value={accessMode}
                    options={ACCESS_MODE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                    onChange={(v) => setAccessMode(v as AdminAiAccessMode)}
                    ariaLabel="Access Mode"
                    testid="admin-ai-access-mode"
                  />
                  <em
                    className={`${classes.accessModeBadge} ${
                      accessMode === "full_access" ? classes.accessModeFullBadge : ""
                    }`}
                  >
                    {accessModeOption.badge}
                  </em>
                </label>
                <label
                  className={classes.modelSelect}
                  title={
                    selectedPresetOption
                      ? `${selectedPresetOption.label}: ${selectedPresetOption.model}, effort ${selectedPresetOption.reasoningEffort}, ${selectedPresetOption.maxToolIterations} tool iterations, ${selectedPresetOption.timeoutMs}ms timeout`
                      : "AI mode"
                  }
                >
                  <span>Mode</span>
                  <AdminSelect
                    disabled={modelsLoading || sending}
                    value={selectedPresetOption?.key || presetOptions.defaultPreset}
                    options={presetOptions.presets.map((p) => ({ value: p.key, label: p.label }))}
                    onChange={(v) => updateModelPreset(v)}
                    ariaLabel="Mode"
                    testid="admin-ai-mode"
                  />
                </label>
                <label className={classes.modelSelect} title="AI model">
                  <span>Model</span>
                  <AdminSelect
                    disabled={modelsLoading || sending}
                    value={selectedModel || modelOptions.defaultModel}
                    options={modelOptions.models.map((m) => ({ value: m, label: m }))}
                    onChange={(v) => setSelectedModel(v)}
                    ariaLabel="Model"
                    testid="admin-ai-model"
                  />
                </label>
                {selectedThread ? (
                  <>
                    <button
                      onClick={() => togglePinThread(selectedThread)}
                      title={selectedThread.isPinned ? "Unpin chat" : "Pin chat"}
                      type="button"
                    >
                      <Icon name="pin" />
                    </button>
                    <button
                      onClick={() => openMoveThread(selectedThread)}
                      title="Move chat"
                      type="button"
                    >
                      <Icon name="move" />
                    </button>
                    <button
                      onClick={() => openRenameThread(selectedThread)}
                      title="Rename chat"
                      type="button"
                    >
                      <Icon name="edit" />
                    </button>
                  </>
                ) : null}
                <button
                  aria-pressed={isFullscreen}
                  onClick={() => setIsFullscreen((current) => !current)}
                  title={isFullscreen ? "Exit fullscreen" : "Open chat fullscreen"}
                  type="button"
                >
                  <Icon name={isFullscreen ? "minimize" : "expand"} />
                </button>
              </div>
            </div>

            <div
              className={classes.messages}
              onScroll={handleMessagesScroll}
              ref={messagesRef}
            >
              {messagesLoading ? (
                <div className={classes.messagesSkeleton}>
                  <div />
                  <div />
                  <div />
                </div>
              ) : null}

              {!messagesLoading && messages.map(renderMessage)}
              {!messagesLoading && !messages.length && !sending ? renderEmptyMessages() : null}
              {renderPending()}
              {renderRequestError()}
              <div ref={messagesEndRef} />
            </div>

            <form className={classes.composer} onSubmit={submitMessage}>
              <div className={classes.composerBox}>
                <textarea
                  className={classes.textarea}
                  disabled={sending}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Ask about FOMO v2 crypto data..."
                  ref={textareaRef}
                  rows={2}
                  value={draft}
                />
                <div className={classes.composerFooter}>
                  <span>{sending ? "Response in progress" : "Enter to send, Shift+Enter for a new line"}</span>
                  <button
                    className={classes.sendButton}
                    disabled={sending || !draft.trim()}
                    title={sending ? "Waiting for response" : "Send message"}
                    type="submit"
                  >
                    <Icon name="send" />
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
        {renderModal()}
        {renderVestingCompareModal()}
        {renderToolRunsPanel()}
      </div>
    </Layout>
  );
};

export default AdminAiChatPage;
