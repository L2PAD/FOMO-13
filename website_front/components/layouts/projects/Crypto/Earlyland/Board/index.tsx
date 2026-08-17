import React, { FC, useContext, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useQuery, useQueryClient } from "react-query";
import {
  BoardItem,
  BoardColumn,
  BoardStats,
  BoardTask,
  TaskCategoryVariant,
  TaskStatus,
  canDeleteBoardTask,
  canUpdateBoardTaskStatus,
  isBoardTaskLocked,
  isPrimeBoardTask,
  isSharedBoardTask,
} from "./types";
import { AddTaskModal } from "./AddTaskModal";
import { CreateBoardModal } from "./CreateBoardModal";
import {
  createCryptoActivityBoard,
  createCryptoActivityBoardTask,
  deleteCryptoActivityBoardTask,
  getCryptoActivityBoard,
  updateCryptoActivityBoardTask,
} from "../../../../../../http/cryptoActivities";
import {
  createOptimisticBoardTask,
  deleteOptimisticBoardTask,
  deleteOptimisticCalendarTask,
  findCachedBoardTask,
  mergeOptimisticBoardTask,
  replaceOptimisticBoardItem,
  replaceOptimisticBoardTask,
  replaceOptimisticCalendarTask,
  restoreQuerySnapshots,
  snapshotQueryRoots,
  upsertOptimisticBoardItem,
  upsertOptimisticBoardTask,
  upsertOptimisticCalendarTask,
} from "../../../../../../utils/cryptoActivitiesOptimistic";
import type {
  CryptoActivityBoardItemApi,
  CryptoActivityBoardResponse,
  CryptoActivityBoardTaskPayload,
} from "../../../../../../types/cryptoActivities";
import { AuthContext } from "../../../../../global/Layout";
import {
  TargetIcon,
  ClockIcon,
  CheckCircleIcon,
  MedalIcon,
  CalendarSmIcon,
  CheckSmIcon,
  TrashIcon,
  PlusIcon,
  PlusSmIcon,
  InfoIcon,
  CalendarSidebarIcon,
  AirdropIcon,
  TestnetIcon,
  QuestIcon,
  NodeIcon,
  FolderIcon,
  DotsIcon,
  LockSmIcon,
} from "../../../../../global/Icons/Earlyland/icons";
import CrownIcon from "../../../../../global/Icons/CrownIcon";
import {
  ProgressCard,
  ProgressHeader,
  ProgressTitle,
  ProgressCount,
  ProgressBarWrap,
  ProgressBarBg,
  ProgressBarFill,
  StatsRow,
  StatCard,
  StatIconWrap,
  StatInfo,
  StatValue,
  StatLabel,
  BoardLayout,
  SidebarPanel,
  SidebarTop,
  SidebarTitle,
  SidebarList,
  SidebarItem,
  SidebarItemLeft,
  SidebarItemLabel,
  SidebarItemCount,
  NewBoardButton,
  KanbanArea,
  KanbanHeader,
  KanbanTitle,
  KanbanSubtitle,
  KanbanColumns,
  KanbanColumn,
  ColumnHeader,
  ColumnHeaderLeft,
  ColumnDot,
  ColumnTitle,
  ColumnCount,
  AddColumnButton,
  ColumnCards,
  TaskCard,
  TaskCardTop,
  TaskProjectRow,
  TaskProjectLogo,
  TaskProjectLogoPlaceholder,
  TaskProjectInfo,
  TaskProjectName,
  TaskProjectPlatform,
  TaskBadgesRow,
  TaskBadge,
  PrimeTaskBadge,
  TaskStatusRow,
  TaskStatusText,
  TaskProgressSection,
  TaskProgressLabels,
  TaskProgressBarWrap,
  TaskProgressBarBg,
  TaskProgressBarFill,
  TaskDivider,
  TaskCardFooter,
  TaskFooterActions,
  TaskIconButton,
  TaskBlurOverlay,
  TaskLockedTitle,
  TaskLockedSubtitle,
  AddTaskButton,
} from "./styles";
import { useTranslation } from "i18n";

const EMPTY_STATS: BoardStats = {
  totalTasks: 0,
  inProgress: 0,
  completed: 0,
  xpEarned: 0,
  overallProgress: 0,
};

const EMPTY_COLUMNS: BoardColumn[] = [
  { id: "todo", label: "To Do", dotColor: "#2082ea", tasks: [] },
  { id: "in-progress", label: "In Progress", dotColor: "#ffc704", tasks: [] },
  { id: "completed", label: "Completed", dotColor: "#05a584", tasks: [] },
];

const EMPTY_BOARDS: BoardItem[] = [
  { id: "all", label: "All Tasks", icon: "all", count: 0 },
  { id: "airdrop", label: "Airdrop", icon: "airdrop", count: 0 },
  { id: "testnet", label: "Testnet", icon: "testnet", count: 0 },
  { id: "quest", label: "Quests", icon: "quest", count: 0 },
  { id: "node", label: "Nodes", icon: "node", count: 0 },
  { id: "other", label: "Others", icon: "other", count: 0 },
];

const DEFAULT_BOARD_IDS = new Set(EMPTY_BOARDS.map((board) => board.id));
const TASK_STATUSES = new Set<TaskStatus>(["todo", "in-progress", "completed"]);

const isTaskStatus = (value?: string): value is TaskStatus =>
  Boolean(value && TASK_STATUSES.has(value as TaskStatus));

const boardColumnBackendId = (column?: BoardColumn): string | undefined => {
  if (!column) return undefined;
  if (column.backendId) return column.backendId;
  return isTaskStatus(column.id) ? undefined : column.id;
};

const boardColumnStatus = (column?: BoardColumn): TaskStatus | undefined =>
  column && isTaskStatus(column.id) ? column.id : undefined;

const SidebarIconMap: FC<{ icon: BoardItem["icon"]; active?: boolean }> = ({ icon, active }) => {
  const color = active ? "#05a584" : "#728094";
  if (icon === "all") return <CalendarSidebarIcon />;
  if (icon === "airdrop") return <AirdropIcon color={color} />;
  if (icon === "testnet") return <TestnetIcon color={color} />;
  if (icon === "quest") return <QuestIcon color={color} />;
  if (icon === "node") return <NodeIcon color={color} />;
  if (icon === "folder") return <FolderIcon />;
  if (icon === "other") return <DotsIcon />;
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="14" height="14" rx="3" stroke={color} strokeWidth="1.25" />
    </svg>
  );
};

const difficultyLabel = (d: BoardTask["difficulty"]) => {
  if (d === "high") return "High";
  if (d === "medium") return "Medium";
  return "Low";
};

const TaskStatusSection: FC<{ task: BoardTask }> = ({ task }) => {
  const { translateText } = useTranslation();

  if (task.isExpired) {
    return (
      <TaskStatusRow>
        <InfoIcon />
        <TaskStatusText expired>{translateText("Expired")}</TaskStatusText>
      </TaskStatusRow>
    );
  }
  if (task.daysLeft !== undefined) {
    return (
      <TaskStatusRow>
        <CalendarSmIcon />
        <TaskStatusText>
          {task.daysLeft} {translateText("days left")}
        </TaskStatusText>
      </TaskStatusRow>
    );
  }
  return null;
};

const TaskCardItem: FC<{
  task: BoardTask;
  hasNft: boolean;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, task: BoardTask) => void;
  onDragEnd: () => void;
  onRemove: (id: string) => void;
  onComplete: (id: string) => void;
  onGoToCalendar: (task: BoardTask) => void;
  onOpenActivity: (task: BoardTask) => void;
}> = ({ task, hasNft, onDragStart, onDragEnd, onRemove, onComplete, onGoToCalendar, onOpenActivity }) => {
  const { translateText } = useTranslation();
  const isPrime = isPrimeBoardTask(task);
  const isLocked = isBoardTaskLocked(task, hasNft);
  const canChangeStatus = canUpdateBoardTaskStatus(task, hasNft);
  const canDelete = canDeleteBoardTask(task);
  const categoryLabel: Record<TaskCategoryVariant, string> = {
    testnet: "Testnet",
    airdrop: "Airdrop",
    quest: "Quest",
    node: "Node",
    other: "Other",
  };

  return (
    <TaskCard
      expired={task.isExpired}
      $prime={isPrime}
      $locked={!canChangeStatus}
      draggable={canChangeStatus}
      onDragStart={canChangeStatus ? (event) => onDragStart(event, task) : undefined}
      onDragEnd={canChangeStatus ? onDragEnd : undefined}
      aria-disabled={!canChangeStatus}
    >
      <TaskCardTop>
        <TaskProjectRow>
          {task.projectLogo ? (
            <TaskProjectLogo src={task.projectLogo} alt={task.projectName} draggable={false} />
          ) : (
            <TaskProjectLogoPlaceholder>
              {task.projectName.charAt(0).toUpperCase()}
            </TaskProjectLogoPlaceholder>
          )}
          <TaskProjectInfo>
            <TaskProjectName>{task.projectName}</TaskProjectName>
            <TaskProjectPlatform>{task.projectPlatform}</TaskProjectPlatform>
          </TaskProjectInfo>
        </TaskProjectRow>

        <TaskBadgesRow>
          {isPrime && (
            <PrimeTaskBadge>
              <CrownIcon />
              <span>{translateText("Prime")}</span>
            </PrimeTaskBadge>
          )}
          <TaskBadge variant={task.category}>{translateText(categoryLabel[task.category])}</TaskBadge>
          <TaskBadge variant={task.difficulty}>{translateText(difficultyLabel(task.difficulty))}</TaskBadge>
        </TaskBadgesRow>
      </TaskCardTop>

      <TaskStatusSection task={task} />

      {task.dayProgress && (
        <TaskProgressSection>
          <TaskProgressLabels>
            <span>
              {translateText("Day")} {task.dayProgress.current}/{task.dayProgress.total}
            </span>
            <span>{task.dayProgress.percent}%</span>
          </TaskProgressLabels>
          <TaskProgressBarWrap>
            <TaskProgressBarBg />
            <TaskProgressBarFill percent={task.dayProgress.percent} />
          </TaskProgressBarWrap>
        </TaskProgressSection>
      )}

      <TaskDivider />

      <TaskCardFooter>
        <TaskFooterActions>
          {(task.activityPath || task.v2ActivityId || task.activityId) && (
            <TaskIconButton
              title={translateText("Open linked activity")}
              disabled={isLocked}
              onClick={() => onOpenActivity(task)}
            >
              <InfoIcon />
            </TaskIconButton>
          )}
          <TaskIconButton
            title={translateText("Open in Calendar")}
            disabled={isLocked}
            onClick={() => onGoToCalendar(task)}
          >
            <CalendarSmIcon />
          </TaskIconButton>
          <TaskIconButton
            title={translateText("Mark complete")}
            disabled={task.status === "completed" || !canChangeStatus}
            onClick={() => onComplete(task.id)}
          >
            <CheckSmIcon />
          </TaskIconButton>
        </TaskFooterActions>
        {canDelete && (
          <TaskIconButton
            title={translateText("Delete")}
            disabled={isLocked}
            onClick={() => onRemove(task.id)}
          >
            <TrashIcon />
          </TaskIconButton>
        )}
      </TaskCardFooter>

      {isLocked && (
        <TaskBlurOverlay>
          <LockSmIcon />
          <TaskLockedTitle>{translateText("Prime access required")}</TaskLockedTitle>
          <TaskLockedSubtitle>
            {translateText("Unlock with a FOMO AI membership")}
          </TaskLockedSubtitle>
        </TaskBlurOverlay>
      )}
    </TaskCard>
  );
};

export const Board: FC<{ hasNft?: boolean }> = ({ hasNft = false }) => {
  const { translateText } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const authContext = useContext(AuthContext);
  const [activeBoardId, setActiveBoardId] = useState<string>("all");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [addingToColumnId, setAddingToColumnId] = useState<string>("todo");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const boardQueryParams = useMemo(
    () => ({
      boardId: activeBoardId === "all" ? undefined : activeBoardId,
    }),
    [activeBoardId]
  );

  const viewerAccessVersion = [
    authContext?.isAuth ? "authenticated" : "anonymous",
    String(authContext?.userData?._id || "no-user"),
    String(authContext?.userData?.wallet || "").trim().toLowerCase(),
    Boolean(authContext?.hasSpaceportNft),
    Boolean(authContext?.hasBoughtSpaceportNft),
    Number(authContext?.userData?.spaceportNftCount || 0),
    Number(authContext?.spaceportAccess?.nftBalance || 0),
  ].join(":");

  const { data } = useQuery(
    ["crypto-activity-board", boardQueryParams, viewerAccessVersion],
    () => getCryptoActivityBoard(boardQueryParams),
    {
      refetchOnWindowFocus: false,
    }
  );

  const columns: BoardColumn[] = data?.columns || EMPTY_COLUMNS;
  const boards = data?.boards || EMPTY_BOARDS;
  const stats = data?.stats || EMPTY_STATS;
  const canManagePersonalBoard = Boolean(
    data?.permissions?.canManagePersonalBoard ?? hasNft
  );

  const invalidateBoard = () => {
    queryClient.invalidateQueries("crypto-activity-board");
    queryClient.invalidateQueries("crypto-activity-calendar");
  };

  const columnIdByStatus = (status: TaskStatus) =>
    boardColumnBackendId(columns.find((col) => col.id === status));

  const applyTaskUpdate = async (
    taskId: string,
    payload: CryptoActivityBoardTaskPayload
  ) => {
    const currentTask = findCachedBoardTask(queryClient, taskId);
    if (!currentTask) {
      const result = await updateCryptoActivityBoardTask(taskId, payload);
      if (result) invalidateBoard();
      return result;
    }

    const snapshots = snapshotQueryRoots(queryClient, [
      "crypto-activity-board",
      "crypto-activity-calendar",
    ]);
    const optimisticTask = mergeOptimisticBoardTask(currentTask, payload);

    upsertOptimisticBoardTask(queryClient, optimisticTask, currentTask);
    upsertOptimisticCalendarTask(queryClient, optimisticTask);

    const result = await updateCryptoActivityBoardTask(taskId, payload);

    if (!result) {
      restoreQuerySnapshots(queryClient, snapshots);
      return null;
    }

    upsertOptimisticBoardTask(queryClient, result, optimisticTask);
    upsertOptimisticCalendarTask(queryClient, result);
    invalidateBoard();

    return result;
  };

  const applyTaskCreate = async (payload: CryptoActivityBoardTaskPayload) => {
    const tempId = `optimistic-task-${Date.now()}`;
    const snapshots = snapshotQueryRoots(queryClient, [
      "crypto-activity-board",
      "crypto-activity-calendar",
    ]);
    const optimisticTask = createOptimisticBoardTask(tempId, payload);

    upsertOptimisticBoardTask(queryClient, optimisticTask);
    upsertOptimisticCalendarTask(queryClient, optimisticTask);

    const result = await createCryptoActivityBoardTask(payload);

    if (!result) {
      restoreQuerySnapshots(queryClient, snapshots);
      return null;
    }

    replaceOptimisticBoardTask(queryClient, tempId, result);
    replaceOptimisticCalendarTask(queryClient, tempId, result);
    invalidateBoard();

    return result;
  };

  const applyTaskDelete = async (taskId: string) => {
    const currentTask = findCachedBoardTask(queryClient, taskId);
    if (
      taskId.startsWith("admin-task-") ||
      (currentTask && !canDeleteBoardTask(currentTask))
    ) {
      return { isSuccess: false };
    }

    if (!currentTask) {
      const result = await deleteCryptoActivityBoardTask(taskId);
      if (result.isSuccess) invalidateBoard();
      return result;
    }

    const snapshots = snapshotQueryRoots(queryClient, [
      "crypto-activity-board",
      "crypto-activity-calendar",
    ]);

    deleteOptimisticBoardTask(queryClient, currentTask);
    deleteOptimisticCalendarTask(queryClient, taskId);

    const result = await deleteCryptoActivityBoardTask(taskId);

    if (!result.isSuccess) {
      restoreQuerySnapshots(queryClient, snapshots);
      return result;
    }

    invalidateBoard();
    return result;
  };

  const handleTaskDragStart = (event: React.DragEvent<HTMLDivElement>, task: BoardTask) => {
    if (!canUpdateBoardTaskStatus(task, hasNft)) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", task.id);
    setDraggedTaskId(task.id);
  };

  const handleTaskDragEnd = () => {
    setDraggedTaskId(null);
  };

  const handleColumnDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleColumnDrop = async (
    event: React.DragEvent<HTMLDivElement>,
    targetColumn: BoardColumn
  ) => {
    event.preventDefault();

    const taskId = event.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;

    const currentTask = findCachedBoardTask(queryClient, taskId);
    if (!currentTask) return;
    if (!canUpdateBoardTaskStatus(currentTask, hasNft)) return;

    const targetColumnId = boardColumnBackendId(targetColumn);
    const targetStatus = boardColumnStatus(targetColumn);
    const isAlreadyInColumn = targetColumnId
      ? String(currentTask.columnId || "") === targetColumnId
      : Boolean(targetStatus && currentTask.status === targetStatus);
    if (isAlreadyInColumn) return;

    if (isSharedBoardTask(currentTask)) {
      if (!targetStatus) return;
      await applyTaskUpdate(taskId, { status: targetStatus });
      return;
    }

    await applyTaskUpdate(taskId, {
      columnId: targetColumnId,
      ...(targetStatus ? { status: targetStatus } : {}),
    });
  };

  const handleCompleteTask = async (taskId: string) => {
    const currentTask = findCachedBoardTask(queryClient, taskId);
    if (!currentTask || !canUpdateBoardTaskStatus(currentTask, hasNft)) return;

    await applyTaskUpdate(
      taskId,
      isSharedBoardTask(currentTask)
        ? { status: "completed" }
        : {
            status: "completed",
            columnId: columnIdByStatus("completed"),
          }
    );
  };

  const handleGoToCalendar = (task: BoardTask) => {
    const date = task.scheduledDate ?? new Date().toISOString().slice(0, 10);
    router.push(`/crypto/earlyland/calendar?date=${date}`);
  };

  const handleOpenActivity = (task: BoardTask) => {
    const activityId = task.v2ActivityId || task.activityId;
    const path = task.activityPath || (activityId ? `/crypto/earlyland/${activityId}` : "");
    if (path) router.push(path);
  };

  const openAddTask = (column: BoardColumn) => {
    if (!canManagePersonalBoard) return;
    setAddingToColumnId(column.id);
    setIsAddTaskOpen(true);
  };

  const handleAddTask = async (task: BoardTask) => {
    const customBoardId = DEFAULT_BOARD_IDS.has(activeBoardId) ? undefined : activeBoardId;
    const targetColumn =
      columns.find((column) => column.id === addingToColumnId) || columns[0];
    const targetStatus = boardColumnStatus(targetColumn);
    await applyTaskCreate({
      boardId: customBoardId,
      columnId: boardColumnBackendId(targetColumn),
      title: task.projectName,
      projectName: task.projectPlatform,
      projectPlatform: task.projectPlatform,
      projectLogo: task.projectLogo,
      category: task.category,
      difficulty: task.difficulty,
      description: task.description,
      notes: task.notes,
      tags: task.tags,
      rewards: task.rewards,
      requirements: task.requirements,
      dueDate: task.scheduledDate,
      ...(targetStatus ? { status: targetStatus } : {}),
    });
  };

  const handleRemoveTask = async (taskId: string) => {
    const currentTask = findCachedBoardTask(queryClient, taskId);
    if (!currentTask || !canDeleteBoardTask(currentTask)) return;

    await applyTaskDelete(taskId);
  };

  const handleCreateBoard = async (name: string) => {
    if (!canManagePersonalBoard) return;
    const tempId = `optimistic-board-${Date.now()}`;
    const tempQueryParams = { boardId: tempId };
    const tempQueryKey = [
      "crypto-activity-board",
      tempQueryParams,
      viewerAccessVersion,
    ];
    const previousActiveBoardId = activeBoardId;
    const snapshots = snapshotQueryRoots(queryClient, ["crypto-activity-board"]);
    const optimisticBoard: CryptoActivityBoardItemApi = {
      id: tempId,
      label: name,
      icon: "folder",
      count: 0,
    };

    upsertOptimisticBoardItem(queryClient, optimisticBoard);
    queryClient.setQueryData<CryptoActivityBoardResponse>(
      tempQueryKey,
      {
        boards: [...boards, optimisticBoard],
        columns: columns.map((column) => ({ ...column, tasks: [] })),
        stats: EMPTY_STATS,
      }
    );
    setActiveBoardId(tempId);

    const board = await createCryptoActivityBoard({ title: name });

    if (!board) {
      restoreQuerySnapshots(queryClient, snapshots);
      queryClient.removeQueries(tempQueryKey);
      setActiveBoardId(previousActiveBoardId);
      return;
    }

    setActiveBoardId(board.id);
    replaceOptimisticBoardItem(queryClient, tempId, board);
    queryClient.removeQueries(tempQueryKey);
    invalidateBoard();
  };

  const activeBoard = boards.find((b) => b.id === activeBoardId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%",marginTop:'20px' }}>
      <BoardLayout>
        <SidebarPanel>
          <SidebarTop>
            <SidebarTitle>{translateText("Boards")}</SidebarTitle>
            <SidebarList>
              {boards.map((board) => {
                const isActive = board.id === activeBoardId;
                return (
                  <SidebarItem
                    key={board.id}
                    active={isActive}
                    onClick={() => setActiveBoardId(board.id)}
                  >
                    <SidebarItemLeft>
                      <SidebarIconMap icon={board.icon} active={isActive} />
                      <SidebarItemLabel active={isActive}>{translateText(board.label)}</SidebarItemLabel>
                    </SidebarItemLeft>
                    <SidebarItemCount active={isActive}>{board.count}</SidebarItemCount>
                  </SidebarItem>
                );
              })}
            </SidebarList>
          </SidebarTop>

          {canManagePersonalBoard && (
            <NewBoardButton onClick={() => setIsCreateBoardOpen(true)}>
              <PlusSmIcon />
              <span>{translateText("New Board")}</span>
            </NewBoardButton>
          )}
        </SidebarPanel>

        <KanbanArea>
          <KanbanHeader>
            <KanbanTitle>{translateText(activeBoard?.label ?? "All Tasks")}</KanbanTitle>
            <KanbanSubtitle>
              {columns.reduce((sum, col) => sum + col.tasks.length, 0)} {translateText("tasks")}
            </KanbanSubtitle>
          </KanbanHeader>

          <KanbanColumns>
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                onDragOver={handleColumnDragOver}
                onDrop={(event) => handleColumnDrop(event, col)}
              >
                <ColumnHeader>
                  <ColumnHeaderLeft>
                    <ColumnDot color={col.dotColor} />
                    <ColumnTitle>{translateText(col.label)}</ColumnTitle>
                    <ColumnCount>{col.tasks.length}</ColumnCount>
                  </ColumnHeaderLeft>
                  {canManagePersonalBoard && (
                    <AddColumnButton title={translateText("Add task")} onClick={() => openAddTask(col)}>
                      <PlusIcon />
                    </AddColumnButton>
                  )}
                </ColumnHeader>

                <ColumnCards>
                  {col.tasks.map((task) => (
                    <TaskCardItem
                      key={task.id}
                      task={task}
                      hasNft={hasNft}
                      onDragStart={handleTaskDragStart}
                      onDragEnd={handleTaskDragEnd}
                      onRemove={handleRemoveTask}
                      onComplete={handleCompleteTask}
                      onGoToCalendar={handleGoToCalendar}
                      onOpenActivity={handleOpenActivity}
                    />
                  ))}
                </ColumnCards>

                {canManagePersonalBoard && (
                  <AddTaskButton onClick={() => openAddTask(col)}>
                    <PlusSmIcon />
                    {translateText("Add Task")}
                  </AddTaskButton>
                )}
              </KanbanColumn>
            ))}
          </KanbanColumns>
        </KanbanArea>
      </BoardLayout>

      <AddTaskModal
        isOpen={isAddTaskOpen}
        columnId={
          boardColumnStatus(
            columns.find((column) => column.id === addingToColumnId)
          ) || "todo"
        }
        onClose={() => setIsAddTaskOpen(false)}
        onAdd={handleAddTask}
      />

      <CreateBoardModal
        isOpen={isCreateBoardOpen}
        onClose={() => setIsCreateBoardOpen(false)}
        onCreate={handleCreateBoard}
      />
    </div>
  );
};
