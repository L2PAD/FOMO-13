export type TaskStatus = "todo" | "in-progress" | "completed";

export type TaskCategoryVariant =
  | "testnet"
  | "airdrop"
  | "quest"
  | "node"
  | "other";
export type TaskDifficultyVariant = "high" | "medium" | "low";

export interface BoardTaskViewerAccess {
  allowed?: boolean;
  canView?: boolean;
  hasAccess?: boolean;
  entitled?: boolean;
  isEntitled?: boolean;
  isRedacted?: boolean;
  contentRedacted?: boolean;
}

export interface BoardTask {
  id: string;
  backendId?: string;
  activityId?: string;
  v2ActivityId?: string;
  columnId?: string;
  boardId?: string;
  sourceType?: "user-task" | "admin-task" | string;
  isSystem?: boolean;
  isGlobal?: boolean;
  canDelete?: boolean;
  canEdit?: boolean;
  accessTier?: "public" | "prime" | string;
  isPrime?: boolean;
  nftRequired?: boolean;
  isLocked?: boolean;
  isRedacted?: boolean;
  viewerAccess?: BoardTaskViewerAccess;
  activityPath?: string;
  title?: string;
  projectLogo?: string;
  projectName: string;
  projectPlatform: string;
  category: TaskCategoryVariant;
  difficulty: TaskDifficultyVariant;
  status: TaskStatus;
  isExpired?: boolean;
  daysLeft?: number;
  /** ISO date string — ties the task to a calendar day */
  scheduledDate?: string;
  description?: string;
  descriptionHtml?: string;
  notes?: string;
  sourceUrl?: string;
  tags?: string[];
  rewards?: Array<string | { label?: string; value?: string }>;
  requirements?: string[];
  /** Day progress e.g. current=3, total=30 */
  dayProgress?: { current: number; total: number; percent: number };
}

export const isSharedBoardTask = (task: BoardTask): boolean =>
  task.id.startsWith("admin-task-") ||
  task.sourceType === "admin-task" ||
  Boolean(task.isSystem || task.isGlobal);

export const isPrimeBoardTask = (task: BoardTask): boolean =>
  Boolean(
    task.isPrime ||
      task.nftRequired ||
      String(task.accessTier || "").trim().toLowerCase() === "prime"
  );

const explicitTaskViewerAccess = (task: BoardTask): boolean | undefined =>
  [
    task.viewerAccess?.allowed,
    task.viewerAccess?.canView,
    task.viewerAccess?.hasAccess,
    task.viewerAccess?.entitled,
    task.viewerAccess?.isEntitled,
  ].find((value): value is boolean => typeof value === "boolean");

export const isBoardTaskLocked = (task: BoardTask, hasNft: boolean): boolean => {
  if (
    task.isLocked ||
    task.isRedacted ||
    task.viewerAccess?.isRedacted ||
    task.viewerAccess?.contentRedacted
  ) {
    return true;
  }

  const explicitAccess = explicitTaskViewerAccess(task);
  if (explicitAccess !== undefined) return !explicitAccess;

  return isPrimeBoardTask(task) && !hasNft;
};

export const canUpdateBoardTaskStatus = (task: BoardTask, hasNft: boolean): boolean =>
  !isBoardTaskLocked(task, hasNft) && task.canEdit !== false;

export const canDeleteBoardTask = (task: BoardTask): boolean =>
  !isSharedBoardTask(task) && task.canDelete !== false;

export interface BoardColumn {
  id: string;
  backendId?: string;
  label: string;
  dotColor: string;
  tasks: BoardTask[];
}

export interface BoardItem {
  id: string;
  label: string;
  count: number;
  icon: "all" | "airdrop" | "testnet" | "quest" | "node" | "other" | "folder";
  isActive?: boolean;
}

export interface BoardStats {
  totalTasks: number;
  inProgress: number;
  completed: number;
  xpEarned: number;
  overallProgress: number; // 0..100
}
