import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import fetchActivityTasks, { ActivityTask } from "../../../../../../http/tasks/fetchActivityTasks";
import addToMyTasks from "../../../../../../http/tasks/addToMyTasks";
import addFomoTaskToBoard from "../../../../../../http/tasks/addFomoTaskToBoard";
import TaskDetailDrawer from "../../../../earlyland/TaskDetail";
import * as S from "./styles";

const STATE_LABEL: Record<string, string> = {
  available: "Add",
  added: "Added",
  in_progress: "In Progress",
  under_review: "Waiting Review",
  completed: "Completed",
};

// G1/G5: FOMO Tasks are NOT a large block inside the activity. They are a
// compact, actionable indicator that opens a drawer listing the team tasks of
// this project. The activity page stays about the project/guide/review.
const ActivityTasksBlock: React.FC<{ activityId?: string; isLogin?: boolean }> = ({
  activityId,
  isLogin,
}) => {
  const router = useRouter();
  const [tasks, setTasks] = useState<ActivityTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const load = async () => {
    if (!activityId || !isLogin) return;
    setLoading(true);
    const res = await fetchActivityTasks(activityId);
    setTasks(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, isLogin]);

  const totalXp = useMemo(
    () => tasks.reduce((sum, t) => sum + Number(t.xpReward || 0), 0),
    [tasks]
  );

  const addBoard = async (t: ActivityTask) => {
    setBusyId(`board:${t.id}`);
    const res = await addFomoTaskToBoard(t.id);
    setBusyId("");
    if (!res.isSuccess && res.message && typeof window !== "undefined") window.alert(res.message);
    else if (res.isSuccess) load();
  };

  const addCalendar = async (t: ActivityTask) => {
    setBusyId(`cal:${t.id}`);
    const res = await addToMyTasks(t.id);
    setBusyId("");
    if (!res.isSuccess && res.message && typeof window !== "undefined") window.alert(res.message);
    else if (res.isSuccess) load();
  };

  if (!isLogin || (!loading && !tasks.length)) return null;

  return (
    <>
      <S.Indicator
        data-testid="fomo-tasks-indicator"
        onClick={() => setOpen(true)}
        title="FOMO Tasks available — complete platform tasks and earn XP."
      >
        <S.IndicatorIcon aria-hidden>✓</S.IndicatorIcon>
        <S.IndicatorText>
          <strong data-testid="fomo-tasks-count">{tasks.length} FOMO Tasks</strong>
          {totalXp > 0 ? <span> · up to {totalXp} XP</span> : null}
        </S.IndicatorText>
        <S.IndicatorCta>View Tasks</S.IndicatorCta>
      </S.Indicator>

      {open ? (
        <S.Overlay onClick={(e) => e.target === e.currentTarget && setOpen(false)} data-testid="fomo-tasks-drawer">
          <S.Panel>
            <S.PanelHead>
              <div>
                <S.PanelTitle>FOMO Tasks</S.PanelTitle>
                <S.PanelSub>Team tasks for this project. Complete them to earn XP.</S.PanelSub>
              </div>
              <S.CloseBtn onClick={() => setOpen(false)} aria-label="Close">×</S.CloseBtn>
            </S.PanelHead>

            <S.List>
              {tasks.map((t) => (
                <S.Row key={t.id} data-testid="fomo-task-row">
                  <S.RowMain onClick={() => setOpenTaskId(t.id)} data-testid="fomo-task-open">
                    <S.RowTitle>{t.title}</S.RowTitle>
                    <S.RowMeta>
                      <S.Xp>+{t.xpReward} XP</S.Xp>
                      {t.access === "prime" ? <S.Tag $prime>Prime</S.Tag> : <S.Tag>Public</S.Tag>}
                      {t.difficulty ? <S.Tag>{t.difficulty}</S.Tag> : null}
                      {t.stepsTotal ? <S.Tag>{t.stepsDone}/{t.stepsTotal} steps</S.Tag> : null}
                      <S.Tag>{STATE_LABEL[t.taskerState] || t.taskerState}</S.Tag>
                    </S.RowMeta>
                  </S.RowMain>
                  <S.RowActions>
                    <S.PrimaryBtn onClick={() => setOpenTaskId(t.id)} data-testid="fomo-task-view">
                      View Task
                    </S.PrimaryBtn>
                    <S.GhostBtn
                      disabled={busyId === `board:${t.id}`}
                      onClick={() => addBoard(t)}
                      data-testid="fomo-task-add-board"
                    >
                      {busyId === `board:${t.id}` ? "…" : "Add to Board"}
                    </S.GhostBtn>
                    <S.GhostBtn
                      disabled={busyId === `cal:${t.id}`}
                      onClick={() => addCalendar(t)}
                      data-testid="fomo-task-add-calendar"
                    >
                      {busyId === `cal:${t.id}` ? "…" : "Add to Calendar"}
                    </S.GhostBtn>
                  </S.RowActions>
                </S.Row>
              ))}
            </S.List>
          </S.Panel>
        </S.Overlay>
      ) : null}

      <TaskDetailDrawer
        taskId={openTaskId}
        onClose={() => setOpenTaskId(null)}
        onChanged={load}
        onOpenActivity={(id) => {
          setOpenTaskId(null);
          router.push(`/crypto/earlyland/${id}`);
        }}
      />
    </>
  );
};

export default ActivityTasksBlock;
