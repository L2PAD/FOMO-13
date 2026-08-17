import React, { useState, useMemo, FC, useEffect, useContext } from "react";
import moment from "moment";
import { useRouter } from "next/router";
import { API } from "../../../../../../config/api";
import { useQuery, useQueryClient } from "react-query";
import {
  createCryptoActivityBoardTask,
  deleteCryptoActivityBoardTask,
  getCryptoActivityCalendar,
  updateCryptoActivityBoardTask,
} from "../../../../../../http/cryptoActivities";
import {
  CryptoActivityBoardTaskApi,
  CryptoActivityCalendarItem,
  CryptoActivityBoardTaskPayload,
} from "../../../../../../types/cryptoActivities";
import {
  createOptimisticBoardTask,
  deleteOptimisticBoardTask,
  deleteOptimisticCalendarTask,
  findCachedBoardTask,
  mergeOptimisticBoardTask,
  replaceOptimisticBoardTask,
  replaceOptimisticCalendarTask,
  restoreQuerySnapshots,
  snapshotQueryRoots,
  upsertOptimisticBoardTask,
  upsertOptimisticCalendarTask,
} from "../../../../../../utils/cryptoActivitiesOptimistic";
import { AddTaskModal } from "../Board/AddTaskModal";
import { EditTaskModal } from "../Board/EditTaskModal";
import { AuthContext } from "../../../../../global/Layout";
import {
  BoardTask,
  TaskCategoryVariant,
  canDeleteBoardTask,
  canUpdateBoardTaskStatus,
  isBoardTaskLocked,
  isPrimeBoardTask,
  isSharedBoardTask,
} from "../Board/types";
import {
  CalendarPageWrapper,
  CalendarLeftPanel,
  CalendarRightPanel,
  CalendarHeader,
  MonthYearRow,
  MonthText,
  YearText,
  HeaderControls,
  ViewSwitcher,
  ViewButton,
  NavControls,
  NavBtn,
  TodayBtn,
  CalendarGrid,
  DayColumn,
  DayHeader,
  DayCell,
  DayNumber,
  DayNumberText,
  EventCard,
  EventBar,
  EventBody,
  EventTitle,
  EventTime,
  TaskEventTitleRow,
  CalendarPrimeIcon,
  CalendarPrimeBadge,
  TaskDetailBlock,
  CalendarTaskBlurOverlay,
  CalendarLockedTitle,
  CalendarLockedSubtitle,
  OverflowBadge,
  LegendRow,
  LegendText,
  LegendItem,
  LegendDot,
  LegendLabel,
  TipBox,
  TipText,
  RightCard,
  CardDateTitle,
  TaskRow,
  ProjectLogo,
  TaskInfo,
  TaskNameRow,
  TaskStatusGroup,
  TaskName,
  TaskCategory,
  StatusBadge,
  ActionButtonsRow,
  ActionBtn,
  CardDivider,
  DeadlineTitle,
  DeadlineItem,
  DeadlineItemHeader,
  DeadlineProjectLogo,
  DeadlineInfo,
  DeadlineName,
  DeadlineDate,
  DaysLeft,
  DeadlineBadgesRow,
  CategoryBadge,
  EmptyDayText,
  WeekDayHeadInner,
  DayViewWrapper,
  AllDaySection,
  AllDayLabel,
  AllDayContent,
  TimeGrid,
  TimeSlotRow,
  TimeLabel,
  TimeSlotContent,
} from "./styles";
import {
  ArrowLeft,
  ArrowRight,
  LockMiniIcon,
} from "../../../../../global/Icons/Earlyland/icons";
import CrownIcon from "../../../../../global/Icons/CrownIcon";
import CustomDropdown from "../../../../../UI/CustomDropdown";
import { activityHtmlToPlainText } from "../../../../../../helpers/activityRichText";

type ViewMode = "Day" | "Week" | "Month";
type EventType = "airdrop" | "testnet" | "whitelist" | "farming" | "others";
type DaysLeftUrgency = "critical" | "warn" | "normal";
type CalendarEvent = CryptoActivityCalendarItem;

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LEGEND_ITEMS: { label: string; color: string; type: EventType }[] = [
  { label: "Airdrop", color: "#2970ff", type: "airdrop" },
  { label: "Testnet", color: "#17b26a", type: "testnet" },
  { label: "Whitelist", color: "#7f56d9", type: "whitelist" },
  { label: "Farming", color: "#f79009", type: "farming" },
  { label: "Others", color: "#6c737f", type: "others" },
];

const TYPE_OPTIONS = ["All Types", "Airdrop", "Testnet", "Whitelist", "Farming", "Others"];

const MAX_VISIBLE_EVENTS = 3;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const dateKey = (date: Date) => moment(date).format("YYYY-MM-DD");

const isSameCalendarDate = (value: string | Date | undefined, date: Date) =>
  Boolean(value && moment(value).format("YYYY-MM-DD") === dateKey(date));

const isSavedCalendarActivity = (item: CalendarEvent) =>
  item.sourceType === "saved-activity";

const isGeneralCalendarActivity = (item: CalendarEvent) =>
  item.sourceType === "activity" ||
  (!item.sourceType && !item.boardTask && !item.isSystem && !item.isGlobal);

const mapApiTaskToBoardTask = (task: CryptoActivityBoardTaskApi): BoardTask => ({
  ...task,
  id: task.id,
  projectName: task.projectName || task.title || "Untitled task",
  projectPlatform: task.projectPlatform || task.projectName || "Earlyland",
  category: task.category || "other",
  difficulty: task.difficulty || "medium",
  status: task.status || "todo",
  description:
    activityHtmlToPlainText(task.description) ||
    activityHtmlToPlainText(task.descriptionHtml) ||
    undefined,
});

const mapCalendarItemToBoardTask = (item: CalendarEvent): BoardTask => {
  if (item.boardTask) {
    return mapApiTaskToBoardTask({
      ...item.boardTask,
      activityId: item.boardTask.activityId || item.activityId,
      v2ActivityId: item.boardTask.v2ActivityId || item.v2ActivityId,
      sourceType: item.boardTask.sourceType || item.sourceType,
      isSystem: item.boardTask.isSystem ?? item.isSystem,
      isGlobal: item.boardTask.isGlobal ?? item.isGlobal,
      canDelete: item.boardTask.canDelete ?? item.canDelete,
      canEdit: item.boardTask.canEdit ?? item.canEdit,
      accessTier: item.boardTask.accessTier || item.accessTier,
      isPrime: item.boardTask.isPrime ?? item.isPrime,
      nftRequired: item.boardTask.nftRequired ?? item.nftRequired,
      isLocked: item.boardTask.isLocked ?? item.isLocked,
      isRedacted: item.boardTask.isRedacted ?? item.isRedacted,
      viewerAccess: item.boardTask.viewerAccess || item.viewerAccess,
      activityPath: item.boardTask.activityPath || item.activityPath,
      description: item.boardTask.description || item.description,
      descriptionHtml: item.boardTask.descriptionHtml || item.descriptionHtml,
      scheduledDate:
        item.boardTask.scheduledDate || item.date || item.startDate,
    });
  }

  return mapApiTaskToBoardTask({
    ...item,
    id: item.boardTaskId || item.id,
    backendId: item.boardTaskId || item.id,
    activityId: item.activityId,
    v2ActivityId: item.v2ActivityId,
    title: item.title,
    projectName: item.project?.name || item.title,
    projectPlatform: item.project?.symbol || item.source || "Earlyland",
    projectLogo: item.project?.logo,
    category:
      getEventType(item) === "airdrop"
        ? "airdrop"
        : getEventType(item) === "testnet"
        ? "testnet"
        : "other",
    difficulty:
      item.priority === "high" || item.priority === "low" ? item.priority : "medium",
    status:
      item.status === "completed" || item.status === "in-progress"
        ? item.status
        : "todo",
    scheduledDate: item.date || item.startDate,
    description:
      activityHtmlToPlainText(item.description) ||
      activityHtmlToPlainText(item.descriptionHtml) ||
      undefined,
    descriptionHtml: item.descriptionHtml,
    sourceUrl: item.sourceUrl,
    tags: item.tags,
    rewards: item.rewards,
    requirements: item.requirements,
  });
};

function parseEventHour(timeStr: string | undefined): number {
  if (!timeStr) return -1;
  const match = /^(\d{1,2})(?::\d{2})?\s*(AM|PM)?$/i.exec(timeStr);
  if (!match) return -1;
  let h = Number.parseInt(match[1], 10);
  const period = (match[2] || "").toUpperCase();
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h;
}

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function getEventType(event: CalendarEvent): EventType {
  const raw = (event.type || event.title || event.project?.name || "").toLowerCase();
  if (raw.includes("airdrop")) return "airdrop";
  if (raw.includes("testnet")) return "testnet";
  if (raw.includes("whitelist")) return "whitelist";
  if (raw.includes("farming")) return "farming";
  return "others";
}

function matchesEventTypeFilter(event: CalendarEvent, filterType: string): boolean {
  if (filterType === "All Types") return true;
  return getEventType(event) === filterType.toLowerCase();
}

function getCategoryEventType(category: TaskCategoryVariant): EventType {
  if (category === "airdrop") return "airdrop";
  if (category === "testnet") return "testnet";
  return "others";
}

function matchesTaskTypeFilter(task: BoardTask, filterType: string): boolean {
  if (filterType === "All Types") return true;
  return getCategoryEventType(task.category) === filterType.toLowerCase();
}

const CalendarTaskEvent: FC<{
  task: BoardTask;
  hasNft: boolean;
}> = ({ task, hasNft }) => {
  const type = getCategoryEventType(task.category);
  const isPrime = isPrimeBoardTask(task);
  const isLocked = isBoardTaskLocked(task, hasNft);

  return (
    <EventCard $type={type} $prime={isPrime} $locked={isLocked}>
      <EventBar $type={type} $prime={isPrime} />
      <EventBody>
        <TaskEventTitleRow>
          {isPrime && (
            <CalendarPrimeIcon title="Prime">
              <CrownIcon />
            </CalendarPrimeIcon>
          )}
          <EventTitle $type={type}>{task.projectName}</EventTitle>
        </TaskEventTitleRow>
      </EventBody>
      {isLocked && (
        <CalendarTaskBlurOverlay $compact>
          <LockMiniIcon />
        </CalendarTaskBlurOverlay>
      )}
    </EventCard>
  );
};

function getStatusLabel(status: BoardTask["status"]): string {
  if (status === "in-progress") return "In Progress";
  if (status === "completed") return "Completed";
  return "To Do";
}

function getStatusBadgeVariant(task: BoardTask): "in-progress" | "completed" | "todo" | "expired" {
  if (task.isExpired) return "expired";
  if (task.status === "in-progress") return "in-progress";
  if (task.status === "completed") return "completed";
  return "todo";
}
function getDaysLeftUrgency(days: number): DaysLeftUrgency {
  if (days <= 7) return "critical";
  if (days <= 30) return "warn";
  return "normal";
}

function getProjectInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return name.slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getEventTitle(event: CalendarEvent): string {
  return event.project?.name || event.title || "Activity";
}

function getEventCategory(event: CalendarEvent): string {
  return event.type || event.project?.symbol || "";
}

function getEventLogo(event: CalendarEvent): string | undefined {
  return event.project?.logo;
}

function getEventTimeLabel(event: CalendarEvent): string {
  const time = (event as any).time;
  const endTime = (event as any).endTime;

  if (!time) return "All day";

  return `${time} - ${endTime || ""}`.trim();
}

function getViewUnit(mode: ViewMode): moment.DurationInputArg2 {
  if (mode === "Day") return "day";
  if (mode === "Week") return "week";
  return "month";
}



interface CalendarCell {
  date: Date;
  events: CalendarEvent[];
  boardTasks: BoardTask[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

interface CalendarHeaderBarProps {
  monthLabel: string;
  yearLabel: string;
  viewMode: ViewMode;
  filterType: string;
  onSwitchView: (mode: ViewMode) => void;
  onFilterChange: (v: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const CalendarHeaderBar: FC<CalendarHeaderBarProps> = ({
  monthLabel, yearLabel, viewMode, filterType, onSwitchView, onFilterChange, onPrev, onNext, onToday,
}) => (
  <CalendarHeader>
    <MonthYearRow>
      <MonthText>{monthLabel}</MonthText>
      <YearText>{yearLabel}</YearText>
    </MonthYearRow>
    <HeaderControls>
      <ViewSwitcher>
        {(["Day", "Week", "Month"] as ViewMode[]).map((mode) => (
          <ViewButton key={mode} $active={viewMode === mode} onClick={() => onSwitchView(mode)}>
            {mode}
          </ViewButton>
        ))}
      </ViewSwitcher>
      <CustomDropdown
        options={TYPE_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
        value={filterType}
        onChange={(v) => onFilterChange(v as string)}
        searchable={false}
        isShowSuccess={false}
      />
      <NavControls>
        <NavBtn onClick={onPrev} aria-label="Previous"><ArrowLeft /></NavBtn>
        <TodayBtn onClick={onToday}>Today</TodayBtn>
        <NavBtn onClick={onNext} aria-label="Next"><ArrowRight /></NavBtn>
      </NavControls>
    </HeaderControls>
  </CalendarHeader>
);

interface MonthGridViewProps {
  daysArray: CalendarCell[];
  hasNft: boolean;
  onSelectDay: (d: Date) => void;
}

const MonthGridView: FC<MonthGridViewProps> = ({ daysArray, hasNft, onSelectDay }) => (
  <CalendarGrid>
    {WEEK_DAYS.map((day, colIdx) => {
      const isSunday = colIdx === 0;
      const colCells = daysArray.filter((_, i) => i % 7 === colIdx);
      return (
        <DayColumn key={day} $isSunday={isSunday}>
          <DayHeader $isSunday={isSunday} $isFirst={colIdx === 0} $isLast={colIdx === 6}>
            {day}
          </DayHeader>
          {colCells.map((cell) => {
            const visibleEvents = cell.events.slice(0, MAX_VISIBLE_EVENTS);
            const remainingSlots = Math.max(0, MAX_VISIBLE_EVENTS - visibleEvents.length);
            const visibleTasks = cell.boardTasks.slice(0, remainingSlots);
            const overflow = Math.max(
              0,
              cell.events.length + cell.boardTasks.length - visibleEvents.length - visibleTasks.length
            );
            return (
              <DayCell
                key={moment(cell.date).format("YYYY-MM-DD")}
                $isSunday={isSunday}
                $isSelected={cell.isSelected}
                onClick={() => onSelectDay(cell.date)}
              >
                <DayNumber>
                  <DayNumberText $isToday={cell.isToday} $isDimmed={!cell.isCurrentMonth}>
                    {moment(cell.date).date()}
                  </DayNumberText>
                </DayNumber>
                {visibleEvents.map((ev) => {
                  const type = getEventType(ev);
                  return (
                    <EventCard key={ev.id} $type={type}>
                      <EventBar $type={type} />
                      <EventBody>
                        <EventTitle $type={type}>{getEventTitle(ev)}</EventTitle>
                        <EventTime>{getEventTimeLabel(ev)}</EventTime>
                      </EventBody>
                    </EventCard>
                  );
                })}
                {visibleTasks.map((task) => (
                  <CalendarTaskEvent key={task.id} task={task} hasNft={hasNft} />
                ))}
                {overflow > 0 && <OverflowBadge>+{overflow}</OverflowBadge>}
              </DayCell>
            );
          })}
        </DayColumn>
      );
    })}
  </CalendarGrid>
);

interface WeekGridViewProps {
  daysArray: CalendarCell[];
  hasNft: boolean;
  onSelectDay: (d: Date) => void;
}

const WeekGridView: FC<WeekGridViewProps> = ({ daysArray, hasNft, onSelectDay }) => (
  <CalendarGrid>
    {daysArray.map((cell, colIdx) => {
      const isSunday = colIdx === 0;
      return (
        <DayColumn key={moment(cell.date).format("YYYY-MM-DD")} $isSunday={isSunday}>
          <DayHeader $isSunday={isSunday} $isFirst={colIdx === 0} $isLast={colIdx === 6}>
            <WeekDayHeadInner>
              <span>{WEEK_DAYS[colIdx]}</span>
              <DayNumberText $isToday={cell.isToday} $isDimmed={false}>
                {moment(cell.date).date()}
              </DayNumberText>
            </WeekDayHeadInner>
          </DayHeader>
          <DayCell
            $isSunday={isSunday}
            $isSelected={cell.isSelected}
            onClick={() => onSelectDay(cell.date)}
          >
            {cell.events.map((ev) => {
              const type = getEventType(ev);
              return (
                <EventCard key={ev.id} $type={type}>
                  <EventBar $type={type} />
                  <EventBody>
                    <EventTitle $type={type}>{getEventTitle(ev)}</EventTitle>
                    <EventTime>{getEventTimeLabel(ev)}</EventTime>
                  </EventBody>
                </EventCard>
              );
            })}
            {cell.boardTasks.map((task) => (
              <CalendarTaskEvent key={task.id} task={task} hasNft={hasNft} />
            ))}
          </DayCell>
        </DayColumn>
      );
    })}
  </CalendarGrid>
);

interface DayGridViewProps {
  cell: CalendarCell;
  hasNft: boolean;
}

const DayGridView: FC<DayGridViewProps> = ({ cell, hasNft }) => {
  const allDayEvents = cell.events.filter((e) => !(e as any).time);
  const hasAllDay = cell.boardTasks.length > 0 || allDayEvents.length > 0;
  return (
    <DayViewWrapper>
      {hasAllDay && (
        <AllDaySection>
          <AllDayLabel>All Day</AllDayLabel>
          <AllDayContent>
            {cell.boardTasks.map((task) => (
              <CalendarTaskEvent key={task.id} task={task} hasNft={hasNft} />
            ))}
            {allDayEvents.map((ev) => {
              const type = getEventType(ev);
              return (
                <EventCard key={ev.id} $type={type}>
                  <EventBar $type={type} />
                  <EventBody>
                    <EventTitle $type={type}>{getEventTitle(ev)}</EventTitle>
                  </EventBody>
                </EventCard>
              );
            })}
          </AllDayContent>
        </AllDaySection>
      )}
      <TimeGrid>
        {HOURS.map((h) => {
          const hourEvents = cell.events.filter((e) => (e as any).time && parseEventHour((e as any).time) === h);
          return (
            <TimeSlotRow key={h}>
              <TimeLabel>{formatHour(h)}</TimeLabel>
              <TimeSlotContent>
                {hourEvents.map((ev) => {
                  const type = getEventType(ev);
                  return (
                    <EventCard key={ev.id} $type={type}>
                      <EventBar $type={type} />
                      <EventBody>
                        <EventTitle $type={type}>{getEventTitle(ev)}</EventTitle>
                        <EventTime>{getEventTimeLabel(ev)}</EventTime>
                      </EventBody>
                    </EventCard>
                  );
                })}
              </TimeSlotContent>
            </TimeSlotRow>
          );
        })}
      </TimeGrid>
    </DayViewWrapper>
  );
};

interface DayDetailCardProps {
  selectedDateLabel: string;
  scheduledBoardTasks: BoardTask[];
  selectedDayEvents: CalendarEvent[];
  hasNft: boolean;
  onMarkCompleted: (id: string) => void;
  onViewOnBoard: (task: BoardTask) => void;
  onEditTask: (task: BoardTask) => void;
  onClearDay: () => void;
  onScheduleTask: () => void;
  onEditActivity: (event: CalendarEvent) => void;
  onViewActivityOnBoard: (event: CalendarEvent) => void;
  onCompleteActivity: (event: CalendarEvent) => void;
}

const DayDetailCard: FC<DayDetailCardProps> = ({
  selectedDateLabel,
  scheduledBoardTasks,
  selectedDayEvents,
  hasNft,
  onMarkCompleted,
  onViewOnBoard,
  onEditTask,
  onClearDay,
  onScheduleTask,
  onEditActivity,
  onViewActivityOnBoard,
  onCompleteActivity,
}) => {
  const hasClearableTasks = scheduledBoardTasks.some(
    (task) => !isSharedBoardTask(task) && canUpdateBoardTaskStatus(task, hasNft)
  );

  return (
    <RightCard>
    <CardDateTitle>{selectedDateLabel}</CardDateTitle>
    {scheduledBoardTasks.length === 0 && selectedDayEvents.length === 0 ? (
      <EmptyDayText>No tasks scheduled for this day.</EmptyDayText>
    ) : (
      <>
        {scheduledBoardTasks.map((task, idx) => {
          const initials = getProjectInitials(task.projectName);
          const isPrime = isPrimeBoardTask(task);
          const isLocked = isBoardTaskLocked(task, hasNft);
          const isShared = isSharedBoardTask(task);
          const canChangeStatus = canUpdateBoardTaskStatus(task, hasNft);
          const canEditContent = !isShared && task.canEdit !== false && !isLocked;
          return (
            <React.Fragment key={task.id}>
              {idx > 0 && <CardDivider />}
              <TaskDetailBlock $prime={isPrime}>
                <TaskRow>
                  <ProjectLogo>{initials}</ProjectLogo>
                  <TaskInfo>
                    <TaskNameRow>
                      <TaskName>{task.projectName}</TaskName>
                      <TaskStatusGroup>
                        {isPrime && (
                          <CalendarPrimeBadge>
                            <CrownIcon />
                            <span>Prime</span>
                          </CalendarPrimeBadge>
                        )}
                        <StatusBadge $status={getStatusBadgeVariant(task)}>
                          {getStatusLabel(task.status)}
                        </StatusBadge>
                      </TaskStatusGroup>
                    </TaskNameRow>
                    <TaskCategory>{task.projectPlatform}</TaskCategory>
                  </TaskInfo>
                </TaskRow>
                <ActionButtonsRow>
                  {canEditContent && (
                    <ActionBtn $variant="small-outline" onClick={() => onEditTask(task)}>
                      Edit
                    </ActionBtn>
                  )}
                  <ActionBtn
                    $variant="outline"
                    disabled={isLocked}
                    onClick={() => onViewOnBoard(task)}
                  >
                    View on Board
                  </ActionBtn>
                  <ActionBtn
                    $variant="fill"
                    disabled={!canChangeStatus || task.status === "completed"}
                    onClick={() => onMarkCompleted(task.id)}
                  >
                    Completed
                  </ActionBtn>
                </ActionButtonsRow>
                {isLocked && (
                  <CalendarTaskBlurOverlay>
                    <LockMiniIcon />
                    <CalendarLockedTitle>Prime access required</CalendarLockedTitle>
                    <CalendarLockedSubtitle>
                      Unlock with a FOMO AI membership
                    </CalendarLockedSubtitle>
                  </CalendarTaskBlurOverlay>
                )}
              </TaskDetailBlock>
            </React.Fragment>
          );
        })}
        {selectedDayEvents.map((ev, idx) => {
          const projectName = getEventTitle(ev);
          const category = getEventCategory(ev);
          const initials = getProjectInitials(projectName);
          const logoSrc = getEventLogo(ev);
          return (
            <React.Fragment key={ev.id ?? idx}>
              {(idx > 0 || scheduledBoardTasks.length > 0) && <CardDivider />}
              <TaskRow>
                <ProjectLogo>
                  {logoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={typeof logoSrc === "string" ? logoSrc : undefined}
                      alt={projectName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    initials
                  )}
                </ProjectLogo>
                <TaskInfo>
                  <TaskNameRow>
                    <TaskName>{projectName}</TaskName>
                    <StatusBadge $status="todo">To Do</StatusBadge>
                  </TaskNameRow>
                  {category && <TaskCategory>{category}</TaskCategory>}
                </TaskInfo>
              </TaskRow>
              {hasNft && (
                <ActionButtonsRow>
                  <ActionBtn $variant="small-outline" onClick={() => onEditActivity(ev)}>Edit</ActionBtn>
                  <ActionBtn $variant="outline" onClick={() => onViewActivityOnBoard(ev)}>View on Board</ActionBtn>
                  <ActionBtn $variant="fill" onClick={() => onCompleteActivity(ev)}>Completed</ActionBtn>
                </ActionButtonsRow>
              )}
            </React.Fragment>
          );
        })}
      </>
    )}
    <CardDivider />
    <ActionButtonsRow>
      <ActionBtn $variant="outline" disabled={!hasClearableTasks} onClick={onClearDay}>
        Clear Personal Tasks
      </ActionBtn>
      {hasNft && (
        <ActionBtn $variant="fill" onClick={onScheduleTask}>Schedule Task</ActionBtn>
      )}
    </ActionButtonsRow>
    </RightCard>
  );
};

interface DeadlinesCardProps {
  upcomingDeadlines: CalendarEvent[];
}

const DeadlinesCard: FC<DeadlinesCardProps> = ({ upcomingDeadlines }) => (
  <RightCard>
    <DeadlineTitle>Upcoming Deadlines</DeadlineTitle>
    {upcomingDeadlines.length === 0 ? (
      <EmptyDayText>No upcoming deadlines.</EmptyDayText>
    ) : (
      upcomingDeadlines.map((ev, idx) => {
        const projectName = getEventTitle(ev);
        const category = getEventCategory(ev);
        const initials = getProjectInitials(projectName);
        const logoSrc = getEventLogo(ev);
        const daysLeft = moment(ev.endDate).diff(moment(), "days");
        const urgency = getDaysLeftUrgency(daysLeft);
        const endDateLabel = moment(ev.endDate).format("MMM DD, YYYY");
        return (
          <React.Fragment key={ev.id ?? idx}>
            {idx > 0 && <CardDivider />}
            <DeadlineItem>
              <DeadlineItemHeader>
                <DeadlineProjectLogo>
                  {logoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={typeof logoSrc === "string" ? logoSrc : undefined}
                      alt={projectName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    initials
                  )}
                </DeadlineProjectLogo>
                <DeadlineInfo>
                  <DeadlineName>{projectName}</DeadlineName>
                  <DeadlineDate>Ends {endDateLabel}</DeadlineDate>
                </DeadlineInfo>
                <DaysLeft $urgency={urgency}>{daysLeft}d</DaysLeft>
              </DeadlineItemHeader>
              <DeadlineBadgesRow>
                {category && <CategoryBadge>{category}</CategoryBadge>}
                <StatusBadge $status="todo">To Do</StatusBadge>
              </DeadlineBadgesRow>
            </DeadlineItem>
          </React.Fragment>
        );
      })
    )}
  </RightCard>
);

export const EarlylandCalendar: FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authContext = useContext(AuthContext);
  const [viewStart, setViewStart] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("Month");
  const [filterType, setFilterType] = useState<string>("All Types");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<BoardTask | null>(null);
  const userWallet = String(authContext?.userData?.wallet || "").trim().toLowerCase();
  const connectedWallet = String(authContext?.spaceportAccess?.wallet || "")
    .trim()
    .toLowerCase();
  const connectedWalletMatchesUser = Boolean(
    userWallet && connectedWallet && userWallet === connectedWallet
  );
  const hasNft = Boolean(
    authContext?.isAuth &&
      (Number(authContext?.userData?.spaceportNftCount || 0) > 0 ||
        (connectedWalletMatchesUser &&
          (authContext?.hasBoughtSpaceportNft ||
            authContext?.hasSpaceportNft ||
            Number(authContext?.spaceportAccess?.nftBalance || 0) > 0)))
  );

  useEffect(() => {
    const { date } = router.query;
    if (typeof date === "string") {
      const parsed = moment(date, "YYYY-MM-DD", true);
      if (parsed.isValid()) {
        const d = parsed.toDate();
        setSelectedDay(d);
        setViewStart(d);
      }
    }
  }, [router.query]);

  const calendarRange = useMemo(() => {
    if (viewMode === "Day") {
      return {
        startDate: moment(viewStart).format("YYYY-MM-DD"),
        endDate: moment(viewStart).format("YYYY-MM-DD"),
      };
    }

    if (viewMode === "Week") {
      return {
        startDate: moment(viewStart).startOf("week").format("YYYY-MM-DD"),
        endDate: moment(viewStart).endOf("week").format("YYYY-MM-DD"),
      };
    }

    const firstOfMonth = moment(viewStart).startOf("month");
    const gridStart = firstOfMonth.clone().startOf("week");
    const gridEnd = firstOfMonth.clone().endOf("month").endOf("week");

    return {
      startDate: gridStart.format("YYYY-MM-DD"),
      endDate: gridEnd.format("YYYY-MM-DD"),
    };
  }, [viewMode, viewStart]);

  const calendarQueryParams = useMemo(
    () => ({
      ...calendarRange,
      // "Others" is a derived bucket, not a literal backend activity type.
      // Fetch the range and apply that bucket consistently to every item below.
      type:
        filterType === "All Types" || filterType === "Others"
          ? undefined
          : filterType,
      limit: 500,
    }),
    [calendarRange, filterType]
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
    ["crypto-activity-calendar", calendarQueryParams, viewerAccessVersion],
    () => getCryptoActivityCalendar(calendarQueryParams),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    }
  );

  const calendarItems = useMemo(() => data?.items || [], [data?.items]);

  // EPIC CAL-1: pull unified platform events (FOMO updates, admin/market news,
  // unlocks, activities, funding, project updates) into the existing calendar by day.
  const { data: platformData } = useQuery(
    ["fomo-platform-calendar-events"],
    async () => {
      try {
        const res = await fetch(`${API}/calendar/events`, { credentials: "include" });
        if (!res.ok) return { items: [] };
        return await res.json();
      } catch (e) {
        return { items: [] };
      }
    },
    { refetchOnWindowFocus: false, staleTime: 60 * 1000 }
  );

  const platformEvents: any[] = useMemo(
    () =>
      (platformData?.items || [])
        .filter((e: any) => e.startAt)
        .map((e: any) => ({
          _id: e.id,
          id: e.id,
          date: e.startAt,
          title: e.title,
          type: (e.eventType || "others").toLowerCase(),
          time: e.allDay ? undefined : moment(e.startAt).format("h:mm A"),
          description: e.shortDescription || e.description,
          project: e.projectName
            ? { name: e.projectName, symbol: e.tokenSymbol, logo: e.image }
            : undefined,
          sourceType: "platform-event",
          eventType: e.eventType,
          platformSource: e.sourceType,
          ctaLabel: e.ctaLabel,
          ctaUrl: e.ctaUrl,
          isPlatformEvent: true,
        })),
    [platformData]
  );

  const events = useMemo(
    () => [
      ...calendarItems.filter(
        (item) =>
          isSavedCalendarActivity(item) &&
          item.date &&
          matchesEventTypeFilter(item, filterType)
      ),
      ...platformEvents.filter((item: any) => matchesEventTypeFilter(item, filterType)),
    ],
    [calendarItems, platformEvents, filterType]
  );

  const deadlineEvents = useMemo(
    () =>
      calendarItems.filter(
        (item) =>
          isGeneralCalendarActivity(item) &&
          item.date &&
          matchesEventTypeFilter(item, filterType)
      ),
    [calendarItems, filterType]
  );

  const allBoardTasks = useMemo(
    () =>
      calendarItems
        .filter(
          (item) =>
            item.sourceType === "board-task" || item.sourceType === "admin-task"
        )
        .map(mapCalendarItemToBoardTask)
        .filter((task) => matchesTaskTypeFilter(task, filterType)),
    [calendarItems, filterType]
  );

  const invalidateCalendar = () => {
    queryClient.invalidateQueries("crypto-activity-calendar");
    queryClient.invalidateQueries("crypto-activity-board");
  };

  const applyTaskUpdate = async (
    taskId: string,
    payload: CryptoActivityBoardTaskPayload
  ) => {
    const currentTask = findCachedBoardTask(queryClient, taskId);
    if (!currentTask) {
      const result = await updateCryptoActivityBoardTask(taskId, payload);
      if (result) invalidateCalendar();
      return result;
    }

    const snapshots = snapshotQueryRoots(queryClient, [
      "crypto-activity-calendar",
      "crypto-activity-board",
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
    invalidateCalendar();

    return result;
  };

  const applyTaskCreate = async (payload: CryptoActivityBoardTaskPayload) => {
    const tempId = `optimistic-task-${Date.now()}`;
    const snapshots = snapshotQueryRoots(queryClient, [
      "crypto-activity-calendar",
      "crypto-activity-board",
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
    invalidateCalendar();

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
      if (result.isSuccess) invalidateCalendar();
      return result;
    }

    const snapshots = snapshotQueryRoots(queryClient, [
      "crypto-activity-calendar",
      "crypto-activity-board",
    ]);

    deleteOptimisticBoardTask(queryClient, currentTask);
    deleteOptimisticCalendarTask(queryClient, taskId);

    const result = await deleteCryptoActivityBoardTask(taskId);

    if (!result.isSuccess) {
      restoreQuerySnapshots(queryClient, snapshots);
      return result;
    }

    invalidateCalendar();
    return result;
  };

  const markTaskCompleted = async (taskId: string) => {
    const task = allBoardTasks.find((item) => item.id === taskId);
    if (!task || !canUpdateBoardTaskStatus(task, hasNft)) return;

    await applyTaskUpdate(taskId, {
      status: "completed",
    });
  };

  const createTaskFromActivity = async (
    event: CalendarEvent,
    status: BoardTask["status"] = "todo"
  ) => {
    const targetDate = event.date || dateKey(selectedDay);
    const existingTask = allBoardTasks.find(
      (task) =>
        !isSharedBoardTask(task) &&
        task.activityId === event.activityId &&
        task.scheduledDate === targetDate
    );

    if (existingTask) {
      if (existingTask.status !== status) {
        const updated = await applyTaskUpdate(existingTask.id, { status });
        return updated || (existingTask as unknown as CryptoActivityBoardTaskApi);
      }

      return existingTask as unknown as CryptoActivityBoardTaskApi;
    }

    const result = await applyTaskCreate({
      activityId: event.activityId,
      title: event.title,
      projectName: event.project?.name,
      projectPlatform: event.project?.symbol || event.source || "Earlyland",
      projectLogo: event.project?.logo,
      category: getEventType(event),
      difficulty: event.priority || "medium",
      description:
        activityHtmlToPlainText(event.description) ||
        activityHtmlToPlainText(event.descriptionHtml) ||
        undefined,
      sourceUrl: event.sourceUrl,
      tags: event.tags,
      rewards: event.rewards,
      requirements: event.requirements,
      dueDate: targetDate,
      status,
    });

    return result;
  };

  const handleScheduleTask = async (task: BoardTask) => {
    await applyTaskCreate({
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
      dueDate: dateKey(selectedDay),
      status: task.status || "todo",
    });

    setIsAddTaskOpen(false);
  };

  const clearDay = async () => {
    const clearableTasks = scheduledBoardTasks.filter(
      (task) => !isSharedBoardTask(task) && canUpdateBoardTaskStatus(task, hasNft)
    );
    if (!clearableTasks.length) return;

    const snapshots = snapshotQueryRoots(queryClient, [
      "crypto-activity-calendar",
      "crypto-activity-board",
    ]);
    const updates = clearableTasks.map((task) => ({
      task,
      optimistic: mergeOptimisticBoardTask(task as CryptoActivityBoardTaskApi, {
        dueDate: null,
        scheduledDate: null,
      }),
    }));

    updates.forEach(({ task, optimistic }) => {
      upsertOptimisticBoardTask(queryClient, optimistic, task as CryptoActivityBoardTaskApi);
      upsertOptimisticCalendarTask(queryClient, optimistic);
    });

    const results = await Promise.all(
      clearableTasks.map((task) =>
        updateCryptoActivityBoardTask(task.id, {
          dueDate: null,
          scheduledDate: null,
        })
      )
    );

    if (results.some((result) => !result)) {
      restoreQuerySnapshots(queryClient, snapshots);
      return;
    }

    results.forEach((result, index) => {
      if (!result) return;
      upsertOptimisticBoardTask(queryClient, result, updates[index].optimistic);
      upsertOptimisticCalendarTask(queryClient, result);
    });

    invalidateCalendar();
  };

  const handleEditSave = async (updatedTask: BoardTask) => {
    if (
      isSharedBoardTask(updatedTask) ||
      !canUpdateBoardTaskStatus(updatedTask, hasNft)
    ) {
      setEditingTask(null);
      return;
    }

    await applyTaskUpdate(updatedTask.id, {
      title: updatedTask.projectName,
      projectName: updatedTask.projectPlatform,
      projectPlatform: updatedTask.projectPlatform,
      projectLogo: updatedTask.projectLogo,
      category: updatedTask.category,
      difficulty: updatedTask.difficulty,
      description: updatedTask.description,
      notes: updatedTask.notes,
      tags: updatedTask.tags,
      rewards: updatedTask.rewards,
      requirements: updatedTask.requirements,
      dueDate: updatedTask.scheduledDate,
      status: updatedTask.status,
    });

    setEditingTask(null);
  };

  const handleEditDelete = async (taskId: string) => {
    const task = allBoardTasks.find((item) => item.id === taskId);
    if (!task || !canDeleteBoardTask(task)) {
      setEditingTask(null);
      return;
    }

    await applyTaskDelete(taskId);
    setEditingTask(null);
  };

  const handleEditActivity = async (event: CalendarEvent) => {
    const task = await createTaskFromActivity(event);
    if (task) setEditingTask(mapApiTaskToBoardTask(task));
  };

  const handleViewActivityOnBoard = async (event: CalendarEvent) => {
    await createTaskFromActivity(event);
    router.push(`/crypto/earlyland?tab=board`);
  };

  const handleCompleteActivity = async (event: CalendarEvent) => {
    await createTaskFromActivity(event, "completed");
  };

  const filterEvents = (dayDate: Date) =>
    events.filter((e) => {
      if (!e.date) return false;
      if (filterType !== "All Types" && getEventType(e).toLowerCase() !== filterType.toLowerCase()) return false;
      return isSameCalendarDate(e.date, dayDate);
    });

  const filterBoardTasks = (dayDate: Date) =>
    allBoardTasks.filter((t) => isSameCalendarDate(t.scheduledDate, dayDate));

  const daysArray = useMemo(() => {
    if (viewMode === "Day") {
      const dayDate = moment(viewStart).startOf("day").toDate();
      return [{
        date: dayDate,
        events: filterEvents(dayDate),
        boardTasks: filterBoardTasks(dayDate),
        isCurrentMonth: true,
        isToday: isSameCalendarDate(new Date(), dayDate),
        isSelected: true,
      }];
    }

    if (viewMode === "Week") {
      const weekStart = moment(viewStart).startOf("week");
      return Array.from({ length: 7 }, (_, i) => {
        const day = weekStart.clone().add(i, "days");
        const dayDate = day.toDate();
        return {
          date: dayDate,
          events: filterEvents(dayDate),
          boardTasks: filterBoardTasks(dayDate),
          isCurrentMonth: true,
          isToday: isSameCalendarDate(new Date(), dayDate),
          isSelected: isSameCalendarDate(dayDate, selectedDay),
        };
      });
    }

    const firstOfMonth = moment(viewStart).startOf("month");
    const gridStart = firstOfMonth.clone().startOf("week");
    const viewMonth = moment(viewStart).month();
    const viewYear = moment(viewStart).year();
    return Array.from({ length: 42 }, (_, i) => {
      const day = gridStart.clone().add(i, "days");
      const dayDate = day.toDate();
      return {
        date: dayDate,
        events: filterEvents(dayDate),
        boardTasks: filterBoardTasks(dayDate),
        isCurrentMonth: day.month() === viewMonth && day.year() === viewYear,
        isToday: isSameCalendarDate(new Date(), dayDate),
        isSelected: isSameCalendarDate(dayDate, selectedDay),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewStart, viewMode, events, filterType, selectedDay, allBoardTasks]);

  const selectedDayEvents = useMemo(
    () => events.filter((e) => isSameCalendarDate(e.date, selectedDay)),
    [events, selectedDay]
  );

  const scheduledBoardTasks = useMemo(
    () => allBoardTasks.filter((t) => isSameCalendarDate(t.scheduledDate, selectedDay)),
    [allBoardTasks, selectedDay]
  );

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    return deadlineEvents
      .filter((e) => e.endDate && new Date(e.endDate) > now)
      .sort((a, b) => {
        const aTime = a.endDate ? new Date(a.endDate).getTime() : 0;
        const bTime = b.endDate ? new Date(b.endDate).getTime() : 0;
        return aTime - bTime;
      })
      .slice(0, 5);
  }, [deadlineEvents]);

  const navigatePrev = () => {
    const d = moment(viewStart).subtract(1, getViewUnit(viewMode)).toDate();
    setViewStart(d);
    if (viewMode === "Day") setSelectedDay(d);
  };

  const navigateNext = () => {
    const d = moment(viewStart).add(1, getViewUnit(viewMode)).toDate();
    setViewStart(d);
    if (viewMode === "Day") setSelectedDay(d);
  };

  const goToday = () => {
    setViewStart(new Date());
    setSelectedDay(new Date());
  };

  const switchViewMode = (mode: ViewMode) => {
    if (mode === "Day") setViewStart(selectedDay);
    setViewMode(mode);
  };

  const monthLabel = (() => {
    if (viewMode === "Day") return moment(viewStart).format("dddd, MMMM D");
    if (viewMode === "Week") {
      const s = moment(viewStart).startOf("week");
      const e = moment(viewStart).endOf("week");
      return s.month() === e.month()
        ? `${s.format("MMM D")} - ${e.format("D")}`
        : `${s.format("MMM D")} - ${e.format("MMM D")}`;
    }
    return moment(viewStart).format("MMMM");
  })();
  const yearLabel = moment(viewStart).format("YYYY");

  const selectedDateLabel = moment(selectedDay).format("MMMM DD, YYYY");



  return (
    <>
      <CalendarPageWrapper>
        <CalendarLeftPanel>
          <CalendarHeaderBar
            monthLabel={monthLabel}
            yearLabel={yearLabel}
            viewMode={viewMode}
            filterType={filterType}
            onSwitchView={switchViewMode}
            onFilterChange={setFilterType}
            onPrev={navigatePrev}
            onNext={navigateNext}
            onToday={goToday}
          />
          {viewMode === "Month" && (
            <MonthGridView daysArray={daysArray} hasNft={hasNft} onSelectDay={setSelectedDay} />
          )}
          {viewMode === "Week" && (
            <WeekGridView daysArray={daysArray} hasNft={hasNft} onSelectDay={setSelectedDay} />
          )}
          {viewMode === "Day" && <DayGridView cell={daysArray[0]} hasNft={hasNft} />}
          <LegendRow>
            <LegendText>Legend:</LegendText>
            {LEGEND_ITEMS.map(({ label, color }) => (
              <LegendItem key={label}>
                <LegendDot $color={color} />
                <LegendLabel>{label}</LegendLabel>
              </LegendItem>
            ))}
          </LegendRow>
          <TipBox>
            <TipText>
              Tip: If you move a task on the Board (To Do - In Progress - Completed), it will
              automatically update here on the calendar. Deadlines in the past become Expired
              unless marked Completed.
            </TipText>
          </TipBox>
        </CalendarLeftPanel>
        <CalendarRightPanel>
          <DayDetailCard
            selectedDateLabel={selectedDateLabel}
            scheduledBoardTasks={scheduledBoardTasks}
            selectedDayEvents={selectedDayEvents}
            hasNft={hasNft}
            onMarkCompleted={markTaskCompleted}
            onViewOnBoard={(task) => {
              router.push(`/crypto/earlyland?tab=board`);
            }}
            onEditTask={(task) => {
              if (!isSharedBoardTask(task) && canUpdateBoardTaskStatus(task, hasNft)) {
                setEditingTask(task);
              }
            }}
            onClearDay={clearDay}
            onScheduleTask={() => setIsAddTaskOpen(true)}
            onEditActivity={handleEditActivity}
            onViewActivityOnBoard={handleViewActivityOnBoard}
            onCompleteActivity={handleCompleteActivity}
          />
          <DeadlinesCard upcomingDeadlines={upcomingDeadlines} />
        </CalendarRightPanel>
      </CalendarPageWrapper>
      <AddTaskModal
        isOpen={isAddTaskOpen}
        columnId="todo"
        onClose={() => setIsAddTaskOpen(false)}
        onAdd={handleScheduleTask}
      />
      <EditTaskModal
        isOpen={editingTask !== null}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleEditSave}
        onDelete={handleEditDelete}
      />
    </>
  );
};

export default EarlylandCalendar;
