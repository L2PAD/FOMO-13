import { QueryClient, QueryKey } from "react-query";
import {
  CryptoActivityApiDetail,
  CryptoActivityApiItem,
  CryptoActivityBoardItemApi,
  CryptoActivityBoardParams,
  CryptoActivityBoardResponse,
  CryptoActivityBoardTaskApi,
  CryptoActivityBoardTaskPayload,
  CryptoActivityCalendarItem,
  CryptoActivityCalendarParams,
  CryptoActivityCalendarResponse,
  CryptoActivityUserState,
} from "../types/cryptoActivities";
import { activityHtmlToPlainText } from "../helpers/activityRichText";

type QuerySnapshot = {
  queryKey: QueryKey;
  data: unknown;
};

const DEFAULT_BOARD_IDS = ["all", "airdrop", "testnet", "quest", "node", "other"];

const toText = (value?: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text ? text : undefined;
};

const toDateOnly = (value?: string | Date | null): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value.slice(0, 10);

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const normalizeCategory = (value?: unknown): CryptoActivityBoardTaskApi["category"] => {
  const normalized = String(value || "").replace(/[\s_-]/g, "").toLowerCase();
  if (normalized.includes("airdrop")) return "airdrop";
  if (normalized.includes("testnet")) return "testnet";
  if (normalized.includes("quest")) return "quest";
  if (normalized.includes("node")) return "node";
  return "other";
};

const normalizeDifficulty = (value?: unknown): CryptoActivityBoardTaskApi["difficulty"] => {
  const normalized = String(value || "").replace(/[\s_-]/g, "").toLowerCase();
  if (normalized === "high" || normalized === "hard") return "high";
  if (normalized === "low" || normalized === "easy") return "low";
  return "medium";
};

const normalizeStatus = (value?: unknown): CryptoActivityBoardTaskApi["status"] => {
  const normalized = String(value || "").replace(/[\s_]/g, "-").toLowerCase();
  if (normalized === "completed") return "completed";
  if (normalized === "in-progress" || normalized === "progress") return "in-progress";
  return "todo";
};

const isRootQuery = (queryKey: QueryKey, root: string) =>
  Array.isArray(queryKey) ? queryKey[0] === root : queryKey === root;

const getQueryParams = <T extends object>(queryKey: QueryKey): T =>
  (Array.isArray(queryKey) && typeof queryKey[1] === "object" && queryKey[1]
    ? queryKey[1]
    : {}) as T;

const updateRootQueries = <T>(
  queryClient: QueryClient,
  root: string,
  updater: (data: T | undefined, queryKey: QueryKey) => T | undefined
) => {
  queryClient
    .getQueryCache()
    .getAll()
    .filter((query) => isRootQuery(query.queryKey, root))
    .forEach((query) => {
      queryClient.setQueryData<T | undefined>(query.queryKey, (previous) =>
        updater(previous, query.queryKey)
      );
    });
};

export const snapshotQueryRoots = (
  queryClient: QueryClient,
  roots: string[]
): QuerySnapshot[] =>
  queryClient
    .getQueryCache()
    .getAll()
    .filter((query) => roots.some((root) => isRootQuery(query.queryKey, root)))
    .map((query) => ({
      queryKey: query.queryKey,
      data: queryClient.getQueryData(query.queryKey),
    }));

export const restoreQuerySnapshots = (
  queryClient: QueryClient,
  snapshots: QuerySnapshot[]
) => {
  snapshots.forEach((snapshot) => {
    queryClient.setQueryData(snapshot.queryKey, snapshot.data);
  });
};

export const createOptimisticBoardTask = (
  id: string,
  payload: CryptoActivityBoardTaskPayload
): CryptoActivityBoardTaskApi => {
  const scheduledDate = toDateOnly(payload.dueDate || payload.scheduledDate);
  const title = toText(payload.title) || toText(payload.projectName) || "Untitled task";

  return {
    id,
    backendId: id,
    activityId: toText(payload.activityId),
    columnId: toText(payload.columnId),
    boardId: toText(payload.boardId),
    title,
    projectName: title,
    projectPlatform:
      toText(payload.projectPlatform) ||
      toText(payload.projectName) ||
      "Earlyland",
    projectLogo: toText(payload.projectLogo),
    category: normalizeCategory(payload.category),
    difficulty: normalizeDifficulty(payload.difficulty),
    status: normalizeStatus(payload.status),
    scheduledDate,
    description: toText(payload.description),
    notes: toText(payload.notes),
    sourceUrl: toText(payload.sourceUrl),
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    rewards: Array.isArray(payload.rewards) ? payload.rewards : [],
    requirements: Array.isArray(payload.requirements) ? payload.requirements : [],
  };
};

export const mergeOptimisticBoardTask = (
  task: CryptoActivityBoardTaskApi,
  payload: CryptoActivityBoardTaskPayload
): CryptoActivityBoardTaskApi => {
  const title = payload.title !== undefined ? toText(payload.title) || task.projectName : task.projectName;
  const nextScheduledDate =
    payload.dueDate !== undefined || payload.scheduledDate !== undefined
      ? toDateOnly(payload.dueDate || payload.scheduledDate)
      : task.scheduledDate;
  const sharedStatusMove = Boolean(
    payload.status !== undefined &&
      payload.columnId === undefined &&
      (task.sourceType === "admin-task" || task.isGlobal || task.isSystem)
  );

  return {
    ...task,
    activityId: payload.activityId !== undefined ? toText(payload.activityId) : task.activityId,
    columnId: sharedStatusMove
      ? undefined
      : payload.columnId !== undefined
      ? toText(payload.columnId)
      : task.columnId,
    boardId: payload.boardId !== undefined ? toText(payload.boardId) : task.boardId,
    title: payload.title !== undefined ? toText(payload.title) || title : task.title,
    projectName: title,
    projectPlatform:
      payload.projectPlatform !== undefined
        ? toText(payload.projectPlatform) || task.projectPlatform
        : task.projectPlatform,
    projectLogo: payload.projectLogo !== undefined ? toText(payload.projectLogo) : task.projectLogo,
    description: payload.description !== undefined ? toText(payload.description) : task.description,
    category: payload.category !== undefined ? normalizeCategory(payload.category) : task.category,
    difficulty: payload.difficulty !== undefined ? normalizeDifficulty(payload.difficulty) : task.difficulty,
    notes: payload.notes !== undefined ? toText(payload.notes) : task.notes,
    sourceUrl: payload.sourceUrl !== undefined ? toText(payload.sourceUrl) : task.sourceUrl,
    tags: payload.tags !== undefined ? (Array.isArray(payload.tags) ? payload.tags : []) : task.tags,
    rewards:
      payload.rewards !== undefined
        ? Array.isArray(payload.rewards)
          ? payload.rewards
          : []
        : task.rewards,
    requirements:
      payload.requirements !== undefined
        ? Array.isArray(payload.requirements)
          ? payload.requirements
          : []
        : task.requirements,
    scheduledDate: nextScheduledDate,
    status: payload.status !== undefined ? normalizeStatus(payload.status) : task.status,
  };
};

const boardStats = (columns: CryptoActivityBoardResponse["columns"]) => {
  const tasks = columns.flatMap((column) => column.tasks);
  const totalTasks = tasks.length;
  const completed = tasks.filter((task) => task.status === "completed").length;
  const inProgress = tasks.filter((task) => task.status === "in-progress").length;

  return {
    totalTasks,
    inProgress,
    completed,
    xpEarned: completed * 25,
    overallProgress: totalTasks ? Math.round((completed / totalTasks) * 100) : 0,
  };
};

const taskMatchesBoardId = (
  task: CryptoActivityBoardTaskApi,
  boardId?: string
): boolean => {
  const id = boardId || "all";
  if (id === "all") return true;
  if (DEFAULT_BOARD_IDS.includes(id)) return task.category === id;
  return String(task.boardId || "") === id;
};

const taskMatchesBoardQuery = (
  task: CryptoActivityBoardTaskApi,
  query: CryptoActivityBoardParams
): boolean => {
  if (!taskMatchesBoardId(task, query.boardId)) return false;

  if (query.status) {
    const statuses = String(query.status).split(",").map(normalizeStatus);
    if (!statuses.includes(task.status)) return false;
  }

  if (query.type) {
    const types = String(query.type).split(",").map(normalizeCategory);
    if (!types.includes(task.category)) return false;
  }

  const search = String(query.search || "").trim().toLowerCase();
  if (search) {
    const haystack = [
      task.title,
      task.projectName,
      task.projectPlatform,
      task.description,
      task.notes,
      task.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(search)) return false;
  }

  return true;
};

const updateBoardCounts = (
  boards: CryptoActivityBoardItemApi[],
  oldTask?: CryptoActivityBoardTaskApi,
  nextTask?: CryptoActivityBoardTaskApi
) =>
  boards.map((board) => {
    const before = oldTask ? taskMatchesBoardId(oldTask, board.id) : false;
    const after = nextTask ? taskMatchesBoardId(nextTask, board.id) : false;
    const delta = Number(after) - Number(before);

    return delta ? { ...board, count: Math.max(0, board.count + delta) } : board;
  });

const upsertTaskInBoardResponse = (
  data: CryptoActivityBoardResponse,
  query: CryptoActivityBoardParams,
  task: CryptoActivityBoardTaskApi,
  oldTask?: CryptoActivityBoardTaskApi
): CryptoActivityBoardResponse => {
  const columnsWithoutTask = data.columns.map((column) => ({
    ...column,
    tasks: column.tasks.filter((item) => item.id !== task.id),
  }));
  const targetColumnId = String(task.columnId || "");
  const nextColumns = taskMatchesBoardQuery(task, query)
    ? columnsWithoutTask.map((column) =>
        (targetColumnId &&
          [column.backendId, column.id].some(
            (value) => String(value || "") === targetColumnId
          )) ||
        (!targetColumnId && column.id === task.status)
          ? { ...column, tasks: [...column.tasks, task] }
          : column
      )
    : columnsWithoutTask;

  return {
    ...data,
    boards: updateBoardCounts(data.boards, oldTask, task),
    columns: nextColumns,
    stats: boardStats(nextColumns),
  };
};

export const upsertOptimisticBoardTask = (
  queryClient: QueryClient,
  task: CryptoActivityBoardTaskApi,
  oldTask?: CryptoActivityBoardTaskApi
) => {
  updateRootQueries<CryptoActivityBoardResponse>(
    queryClient,
    "crypto-activity-board",
    (data, queryKey) => {
      if (!data) return data;
      return upsertTaskInBoardResponse(data, getQueryParams<CryptoActivityBoardParams>(queryKey), task, oldTask);
    }
  );
};

export const deleteOptimisticBoardTask = (
  queryClient: QueryClient,
  task: CryptoActivityBoardTaskApi
) => {
  updateRootQueries<CryptoActivityBoardResponse>(
    queryClient,
    "crypto-activity-board",
    (data) => {
      if (!data) return data;
      const columns = data.columns.map((column) => ({
        ...column,
        tasks: column.tasks.filter((item) => item.id !== task.id),
      }));

      return {
        ...data,
        boards: updateBoardCounts(data.boards, task),
        columns,
        stats: boardStats(columns),
      };
    }
  );
};

export const replaceOptimisticBoardTask = (
  queryClient: QueryClient,
  tempId: string,
  task: CryptoActivityBoardTaskApi
) => {
  updateRootQueries<CryptoActivityBoardResponse>(
    queryClient,
    "crypto-activity-board",
    (data) => {
      if (!data) return data;
      return {
        ...data,
        columns: data.columns.map((column) => ({
          ...column,
          tasks: column.tasks.map((item) => (item.id === tempId ? task : item)),
        })),
      };
    }
  );
};

export const upsertOptimisticBoardItem = (
  queryClient: QueryClient,
  board: CryptoActivityBoardItemApi
) => {
  updateRootQueries<CryptoActivityBoardResponse>(
    queryClient,
    "crypto-activity-board",
    (data) => {
      if (!data) return data;
      const exists = data.boards.some((item) => item.id === board.id);

      return {
        ...data,
        boards: exists
          ? data.boards.map((item) => (item.id === board.id ? board : item))
          : [...data.boards, board],
      };
    }
  );
};

export const replaceOptimisticBoardItem = (
  queryClient: QueryClient,
  tempId: string,
  board: CryptoActivityBoardItemApi
) => {
  updateRootQueries<CryptoActivityBoardResponse>(
    queryClient,
    "crypto-activity-board",
    (data) => {
      if (!data) return data;

      return {
        ...data,
        boards: data.boards.map((item) => (item.id === tempId ? board : item)),
      };
    }
  );
};

export const findCachedBoardTask = (
  queryClient: QueryClient,
  taskId: string
): CryptoActivityBoardTaskApi | undefined => {
  for (const query of queryClient.getQueryCache().getAll()) {
    if (!isRootQuery(query.queryKey, "crypto-activity-board")) continue;
    const data = queryClient.getQueryData<CryptoActivityBoardResponse>(query.queryKey);
    const task = data?.columns.flatMap((column) => column.tasks).find((item) => item.id === taskId);
    if (task) return task;
  }

  for (const query of queryClient.getQueryCache().getAll()) {
    if (!isRootQuery(query.queryKey, "crypto-activity-calendar")) continue;
    const data = queryClient.getQueryData<CryptoActivityCalendarResponse>(query.queryKey);
    const task = data?.items.find((item) => item.boardTaskId === taskId)?.boardTask;
    if (task) return task;
  }

  return undefined;
};

const normalizeType = (value?: unknown) =>
  String(value || "").replace(/[\s_-]/g, "").toLowerCase();

const taskToCalendarItem = (task: CryptoActivityBoardTaskApi): CryptoActivityCalendarItem => ({
  id: `board-task-${task.id}`,
  boardTaskId: task.id,
  activityId: task.activityId,
  title: task.title || task.projectName,
  description: task.description,
  descriptionHtml: task.descriptionHtml,
  type: task.category,
  status: task.status,
  project: {
    id: task.activityId || task.id,
    name: task.projectName,
    symbol: task.projectPlatform,
    logo: task.projectLogo,
  },
  date: task.scheduledDate,
  startDate: task.scheduledDate,
  endDate: task.scheduledDate,
  sourceUrl: task.sourceUrl,
  source: "board",
  priority: task.difficulty,
  tags: Array.isArray(task.tags) && task.tags.length ? task.tags : [task.category],
  rewards: Array.isArray(task.rewards) ? task.rewards : [],
  requirements: Array.isArray(task.requirements) ? task.requirements : [],
  sourceType: "board-task",
  boardTask: task,
});

const calendarDateInRange = (
  date?: string,
  startDate?: string,
  endDate?: string
): boolean => {
  if (!date) return false;
  const day = date.slice(0, 10);
  if (startDate && day < startDate.slice(0, 10)) return false;
  if (endDate && day > endDate.slice(0, 10)) return false;
  return true;
};

const calendarItemMatchesQuery = (
  item: CryptoActivityCalendarItem,
  query: CryptoActivityCalendarParams
) => {
  if (!calendarDateInRange(item.date || item.startDate, query.startDate, query.endDate)) return false;

  if (query.type && normalizeType(query.type) !== "alltypes") {
    if (normalizeType(item.type) !== normalizeType(query.type)) return false;
  }

  const search = String(query.search || query.project || "").trim().toLowerCase();
  if (search) {
    const haystack = [
      item.title,
      item.description,
      activityHtmlToPlainText(item.descriptionHtml),
      item.type,
      item.project?.name,
      item.project?.symbol,
      item.source,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(search)) return false;
  }

  return true;
};

export const upsertOptimisticCalendarTask = (
  queryClient: QueryClient,
  task: CryptoActivityBoardTaskApi
) => {
  const item = taskToCalendarItem(task);

  updateRootQueries<CryptoActivityCalendarResponse>(
    queryClient,
    "crypto-activity-calendar",
    (data, queryKey) => {
      if (!data) return data;
      const withoutTask = data.items.filter((current) => current.boardTaskId !== task.id);
      const query = getQueryParams<CryptoActivityCalendarParams>(queryKey);
      const items = item.date && calendarItemMatchesQuery(item, query)
        ? [...withoutTask, item]
        : withoutTask;

      return {
        ...data,
        items,
        total: items.length,
      };
    }
  );
};

export const deleteOptimisticCalendarTask = (
  queryClient: QueryClient,
  taskId: string
) => {
  updateRootQueries<CryptoActivityCalendarResponse>(
    queryClient,
    "crypto-activity-calendar",
    (data) => {
      if (!data) return data;
      const items = data.items.filter((item) => item.boardTaskId !== taskId);

      return {
        ...data,
        items,
        total: items.length,
      };
    }
  );
};

export const replaceOptimisticCalendarTask = (
  queryClient: QueryClient,
  tempId: string,
  task: CryptoActivityBoardTaskApi
) => {
  deleteOptimisticCalendarTask(queryClient, tempId);
  upsertOptimisticCalendarTask(queryClient, task);
};

const getActivityIdentity = (activity: CryptoActivityApiItem): string =>
  String(activity._id || activity.id || activity.slug || activity.coinSlug || "");

const activityMatchesId = (activity: CryptoActivityApiItem, id: string) =>
  [
    activity.slug,
    activity.coinSlug,
    activity._id,
    activity.id,
    activity.legacyActivityId,
    activity.legacyNumericId,
    activity.parserActivityId,
  ].some((value) => String(value || "") === id);

const patchActivityUserState = <T extends CryptoActivityApiItem>(
  activity: T,
  activityId: string,
  patch: Partial<CryptoActivityUserState>
): T => {
  if (!activityMatchesId(activity, activityId)) return activity;

  return {
    ...activity,
    userState: {
      isFavourite: false,
      isAddedToCalendar: false,
      ...activity.userState,
      ...patch,
    },
  };
};

export const patchOptimisticActivityUserState = (
  queryClient: QueryClient,
  activityId: string,
  patch: Partial<CryptoActivityUserState>
) => {
  updateRootQueries<CryptoActivityApiDetail | null>(
    queryClient,
    "crypto-earlyland-activity",
    (data) => {
      if (!data) return data;
      const nextData = patchActivityUserState(data, activityId, patch);
      const nextSimilarProjects = data.similarProjects?.map((item) =>
        patchActivityUserState(item, activityId, patch)
      );
      const similarChanged = nextSimilarProjects?.some(
        (item, index) => item !== data.similarProjects?.[index]
      );

      if (nextData === data && !similarChanged) return data;

      return {
        ...nextData,
        similarProjects: nextSimilarProjects,
      };
    }
  );

  updateRootQueries<{ items: CryptoActivityApiItem[] }>(
    queryClient,
    "crypto-earlyland-activities",
    (data) => {
      if (!data?.items) return data;
      return {
        ...data,
        items: data.items.map((item) =>
          patchActivityUserState(item, activityId, patch)
        ),
      };
    }
  );
};

export const activityToSavedCalendarItem = (
  activity: CryptoActivityApiDetail
): CryptoActivityCalendarItem | undefined => {
  const activityId = getActivityIdentity(activity);
  const date = toDateOnly(activity.endDate || activity.startDate || activity.approxEndDate || activity.approxStartDate);
  if (!activityId || !date) return undefined;

  return {
    id: `saved-activity-${activityId}`,
    activityId,
    title:
      toText(activity.projectName) ||
      toText(activity.canonicalProject?.name) ||
      toText(activity.name) ||
      toText(activity.coinName) ||
      toText(activity.symbol) ||
      "Activity",
    description:
      typeof activity.description === "string"
        ? activity.description
        : activity.description?.about || activity.description?.howToParticipate,
    type: toText(activity.activityType || activity.category),
    status: toText(activity.lifecycleStatus || activity.status),
    project: {
      id: activityId,
      name: toText(
        activity.projectName ||
        activity.canonicalProject?.name ||
        activity.name ||
        activity.coinName ||
        activity.symbol
      ),
      symbol: toText(
        activity.canonicalProject?.symbol ||
        activity.symbol ||
        activity.coinSymbol
      ),
      logo: toText(
        activity.projectLogo ||
        activity.logo ||
        activity.canonicalProject?.logo ||
        activity.relatedAssets?.[0]?.logo ||
        activity.relatedAssets?.[0]?.image
      ),
    },
    date,
    startDate: toDateOnly(activity.startDate || activity.approxStartDate) || date,
    endDate: toDateOnly(activity.endDate || activity.approxEndDate) || date,
    sourceUrl: toText(activity.sourceUrl),
    originalUrl: toText(activity.originalUrl),
    source: "saved",
    priority: toText(activity.difficulty),
    tags: Array.isArray(activity.tags) ? activity.tags : [],
    rewards: Array.isArray(activity.rewards) ? activity.rewards : [],
    requirements: Array.isArray(activity.requirements) ? activity.requirements : [],
    links: activity.links,
    socialLinks: activity.socialLinks,
    sourceType: "saved-activity",
  };
};

export const upsertOptimisticSavedCalendarActivity = (
  queryClient: QueryClient,
  activity: CryptoActivityApiDetail
) => {
  const item = activityToSavedCalendarItem(activity);
  if (!item) return;

  updateRootQueries<CryptoActivityCalendarResponse>(
    queryClient,
    "crypto-activity-calendar",
    (data, queryKey) => {
      if (!data) return data;
      const withoutActivity = data.items.filter(
        (current) => !(current.sourceType === "saved-activity" && current.activityId === item.activityId)
      );
      const query = getQueryParams<CryptoActivityCalendarParams>(queryKey);
      const items = calendarItemMatchesQuery(item, query) ? [...withoutActivity, item] : withoutActivity;

      return {
        ...data,
        items,
        total: items.length,
      };
    }
  );
};

export const deleteOptimisticSavedCalendarActivity = (
  queryClient: QueryClient,
  activityId: string
) => {
  updateRootQueries<CryptoActivityCalendarResponse>(
    queryClient,
    "crypto-activity-calendar",
    (data) => {
      if (!data) return data;
      const items = data.items.filter(
        (item) => !(item.sourceType === "saved-activity" && item.activityId === activityId)
      );

      return {
        ...data,
        items,
        total: items.length,
      };
    }
  );
};
