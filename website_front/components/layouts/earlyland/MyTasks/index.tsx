import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import fetchMyTasker, { TaskerItem, TaskerResponse } from "../../../../http/tasks/fetchMyTasker";
import removeFromMyTasks from "../../../../http/tasks/removeFromMyTasks";
import TaskDetailDrawer from "../TaskDetail";
import BreadCrumbs from "../../../global/BreadCrumbs";
import * as S from "./styles";

const EMPTY: TaskerResponse = {
  kpis: { total: 0, added: 0, inProgress: 0, review: 0, completed: 0, xpEarned: 0 },
  items: [],
  board: { added: [], in_progress: [], review: [], completed: [] },
  calendar: [],
};

const VIEWS = ["List", "Board", "Calendar"] as const;
type View = (typeof VIEWS)[number];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "added", label: "Added" },
  { key: "in_progress", label: "In Progress" },
  { key: "review", label: "Waiting Review" },
  { key: "completed", label: "Completed" },
  { key: "earlyland", label: "EarlyLand" },
  { key: "prime", label: "Prime" },
];

const STATE_LABEL: Record<string, string> = {
  available: "Available",
  added: "Added",
  in_progress: "In Progress",
  submitted: "Submitted",
  under_review: "Waiting Review",
  completed: "Completed",
  rejected: "Rejected",
};

const STATE_TONE: Record<string, string> = {
  added: "blue",
  in_progress: "yellow",
  submitted: "yellow",
  under_review: "yellow",
  completed: "green",
  rejected: "red",
};

const stateLabel = (s: string) => STATE_LABEL[s] || s;

const fmtDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—";

const MyTasks: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const router = useRouter();
  const [data, setData] = useState<TaskerResponse>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("List");
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState("");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const load = async () => {
    setLoading(true);
    const res = await fetchMyTasker();
    setData(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openTask = (item: TaskerItem) => setOpenTaskId(item.taskId);

  const remove = async (item: TaskerItem) => {
    setBusyId(item.taskId);
    const res = await removeFromMyTasks(item.taskId);
    setBusyId("");
    if (res.isSuccess) load();
    else if (typeof window !== "undefined" && res.message) window.alert(res.message);
  };

  const filtered = useMemo(() => {
    return data.items.filter((i) => {
      switch (filter) {
        case "added":
          return i.taskerState === "added";
        case "in_progress":
          return i.taskerState === "in_progress";
        case "review":
          return ["submitted", "under_review"].includes(i.taskerState);
        case "completed":
          return i.taskerState === "completed";
        case "prime":
          return i.accessTier === "prime";
        case "earlyland":
          return !!i.activityId;
        default:
          return true;
      }
    });
  }, [data.items, filter]);

  const renderCard = (item: TaskerItem) => (
    <S.TaskCard key={item.taskId} data-testid="tasker-card">
      <S.CardTop>
        <S.CardName>{item.name}</S.CardName>
        <S.XpTag>+{item.xp} XP</S.XpTag>
      </S.CardTop>
      <S.CardMeta>
        <S.Badge $tone={STATE_TONE[item.taskerState] || "default"}>{stateLabel(item.taskerState)}</S.Badge>
        {item.accessTier === "prime" ? <S.Badge $tone="prime">Prime</S.Badge> : <S.Badge>Public</S.Badge>}
        {item.deadline ? <S.Badge>Deadline {fmtDate(item.deadline)}</S.Badge> : null}
      </S.CardMeta>
      {item.taskerState === "in_progress" || item.progressPercent > 0 ? (
        <S.ProgressBar>
          <S.ProgressFill $pct={item.progressPercent} />
        </S.ProgressBar>
      ) : null}
      <S.CardActions>
        <S.PrimaryButton data-testid="tasker-open" onClick={() => openTask(item)}>
          Open
        </S.PrimaryButton>
        {item.taskerState === "added" ? (
          <S.GhostButton data-testid="tasker-remove" disabled={busyId === item.taskId} onClick={() => remove(item)}>
            {busyId === item.taskId ? "Removing…" : "Remove"}
          </S.GhostButton>
        ) : null}
      </S.CardActions>
    </S.TaskCard>
  );

  const boardColumns: { key: keyof TaskerResponse["board"]; title: string }[] = [
    { key: "added", title: "Added" },
    { key: "in_progress", title: "In Progress" },
    { key: "review", title: "Waiting Review" },
    { key: "completed", title: "Completed" },
  ];

  // Calendar month grid
  const calendarCells = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const byDay = new Map<string, typeof data.calendar>();
    data.calendar.forEach((ev) => {
      const d = new Date(ev.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = String(d.getDate());
        if (!byDay.has(key)) byDay.set(key, []);
        byDay.get(key)!.push(ev);
      }
    });
    const cells: { day: number | null; events: typeof data.calendar }[] = [];
    for (let i = 0; i < startDow; i++) cells.push({ day: null, events: [] });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, events: byDay.get(String(d)) || [] });
    return cells;
  }, [calMonth, data.calendar]);

  return (
    <S.Wrapper data-testid="my-tasks-page">
      {embedded ? null : (
        <BreadCrumbs
          items={[
            { title: "EarlyLand", link: "/crypto/earlyland" },
            { title: "My Tasks", link: "/earlyland/tasks" },
          ]}
        />
      )}
      <S.Header>
        <S.Title>My Tasks</S.Title>
        <S.Subtitle>
          Everything you added from EarlyLand activities. Track progress across List, Board and Calendar — all powered by the same
          task state.
        </S.Subtitle>
      </S.Header>

      <S.KpiRow>
        <S.KpiCard><S.KpiLabel>Total</S.KpiLabel><S.KpiValue data-testid="kpi-total">{data.kpis.total}</S.KpiValue></S.KpiCard>
        <S.KpiCard><S.KpiLabel>Added</S.KpiLabel><S.KpiValue>{data.kpis.added}</S.KpiValue></S.KpiCard>
        <S.KpiCard><S.KpiLabel>In Progress</S.KpiLabel><S.KpiValue>{data.kpis.inProgress}</S.KpiValue></S.KpiCard>
        <S.KpiCard><S.KpiLabel>Review</S.KpiLabel><S.KpiValue>{data.kpis.review}</S.KpiValue></S.KpiCard>
        <S.KpiCard><S.KpiLabel>Completed</S.KpiLabel><S.KpiValue>{data.kpis.completed}</S.KpiValue></S.KpiCard>
        <S.KpiCard><S.KpiLabel>XP Earned</S.KpiLabel><S.KpiValue>{data.kpis.xpEarned}</S.KpiValue></S.KpiCard>
      </S.KpiRow>

      {embedded ? null : (
        <S.TabsRow>
          {VIEWS.map((v) => (
            <S.TabButton key={v} $active={view === v} onClick={() => setView(v)} data-testid={`tasker-view-${v.toLowerCase()}`}>
              {v}
            </S.TabButton>
          ))}
        </S.TabsRow>
      )}

      {loading ? (
        <S.EmptyState>Loading your tasks…</S.EmptyState>
      ) : data.items.length === 0 ? (
        <S.EmptyState>
          You have no tasks yet. Open an EarlyLand activity and tap <b>Add to my tasks</b> to start tracking it here.
        </S.EmptyState>
      ) : view === "List" ? (
        <>
          <S.FilterRow>
            {FILTERS.map((f) => (
              <S.FilterChip key={f.key} $active={filter === f.key} onClick={() => setFilter(f.key)} data-testid={`tasker-filter-${f.key}`}>
                {f.label}
              </S.FilterChip>
            ))}
          </S.FilterRow>
          {filtered.length ? <S.CardGrid>{filtered.map(renderCard)}</S.CardGrid> : <S.EmptyState>No tasks match this filter.</S.EmptyState>}
        </>
      ) : view === "Board" ? (
        <S.BoardGrid>
          {boardColumns.map((col) => (
            <S.BoardColumn key={col.key} data-testid={`board-col-${col.key}`}>
              <S.BoardColTitle>
                <span>{col.title}</span>
                <S.Badge>{data.board[col.key].length}</S.Badge>
              </S.BoardColTitle>
              {data.board[col.key].map((item) => (
                <S.BoardCard key={item.taskId} onClick={() => openTask(item)} data-testid="board-card">
                  <S.CardName style={{ fontSize: 14 }}>{item.name}</S.CardName>
                  <S.CardMeta style={{ marginTop: 8 }}>
                    <S.XpTag>+{item.xp} XP</S.XpTag>
                    {item.accessTier === "prime" ? <S.Badge $tone="prime">Prime</S.Badge> : null}
                    {item.deadline ? <S.Badge>{fmtDate(item.deadline)}</S.Badge> : null}
                  </S.CardMeta>
                </S.BoardCard>
              ))}
            </S.BoardColumn>
          ))}
        </S.BoardGrid>
      ) : (
        <>
          <S.CalendarNav>
            <S.GhostButton onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>←</S.GhostButton>
            <S.CalendarMonth>{calMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</S.CalendarMonth>
            <S.GhostButton onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>→</S.GhostButton>
          </S.CalendarNav>
          <S.CalendarGrid>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <S.CalendarHead key={d}>{d}</S.CalendarHead>
            ))}
            {calendarCells.map((cell, i) => (
              <S.CalendarCell key={i} $muted={cell.day === null}>
                {cell.day !== null ? (
                  <>
                    <S.CalendarDate>{cell.day}</S.CalendarDate>
                    {cell.events.map((ev) => (
                      <S.CalendarEvent
                        key={ev.taskId}
                        title={ev.name}
                        onClick={() => {
                          const it = data.items.find((x) => x.taskId === ev.taskId);
                          if (it) openTask(it);
                        }}
                      >
                        {ev.name}
                      </S.CalendarEvent>
                    ))}
                  </>
                ) : null}
              </S.CalendarCell>
            ))}
          </S.CalendarGrid>
        </>
      )}
      <TaskDetailDrawer
        taskId={openTaskId}
        onClose={() => setOpenTaskId(null)}
        onChanged={load}
        onOpenActivity={(id) => {
          setOpenTaskId(null);
          router.push(`/crypto/earlyland/${id}`);
        }}
      />
    </S.Wrapper>
  );
};

export default MyTasks;
