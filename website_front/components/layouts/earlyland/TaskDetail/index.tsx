import React, { useEffect, useState } from "react";
import fetchTaskDetail, { TaskDetail } from "../../../../http/tasks/fetchTaskDetail";
import addToMyTasks from "../../../../http/tasks/addToMyTasks";
import addFomoTaskToBoard from "../../../../http/tasks/addFomoTaskToBoard";
import removeFromMyTasks from "../../../../http/tasks/removeFromMyTasks";
import startTask from "../../../../http/tasks/startTask";
import sendTaskToReview from "../../../../http/tasks/sendTaskToReview";
import claimTask from "../../../../http/tasks/claimTask";
import toggleTaskStep from "../../../../http/tasks/toggleTaskStep";
import * as S from "./styles";

interface Props {
  taskId: string | null;
  onClose: () => void;
  onChanged?: () => void;
  onOpenActivity?: (activityId: string) => void;
}

const MODE_LABEL: Record<string, string> = {
  AUTO_METRIC: "Automatic",
  USER_CLAIM: "Claim",
  MODERATOR_REVIEW: "Moderator review",
  EXTERNAL_ACTION: "External action",
};

const REPEAT_LABEL: Record<string, string> = {
  once: "One-time",
  daily: "Daily",
  weekly: "Weekly",
  unlimited: "Unlimited",
};

const STATE_LABEL: Record<string, string> = {
  available: "Available",
  added: "Added",
  not_started: "Not started",
  in_progress: "In Progress",
  waiting_review: "Waiting for Review",
  under_review: "Waiting for Review",
  claimable: "Ready to Claim",
  completed: "Completed",
  rejected: "Rejected",
};

const STATE_TONE: Record<string, string> = {
  added: "blue",
  in_progress: "yellow",
  waiting_review: "yellow",
  under_review: "yellow",
  claimable: "green",
  completed: "green",
  rejected: "red",
};

const ACTION_LABEL: Record<string, string> = {
  add: "Add to My Tasks",
  start: "Start",
  submit: "Submit for Review",
  claim: "Claim XP",
  remove: "Remove",
};

const fmtDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const TaskDetailDrawer: React.FC<Props> = ({ taskId, onClose, onChanged, onOpenActivity }) => {
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [orgBusy, setOrgBusy] = useState("");
  const [orgMsg, setOrgMsg] = useState("");

  const organize = async (kind: "board" | "calendar") => {
    if (!detail) return;
    setOrgBusy(kind);
    setOrgMsg("");
    // Both are REFERENCES to the same canonical FOMO Task — no clone, no XP.
    const res =
      kind === "board"
        ? await addFomoTaskToBoard(detail.id)
        : await addToMyTasks(detail.id);
    setOrgBusy("");
    if (res.isSuccess) {
      setOrgMsg(kind === "board" ? "Added to My Board" : "Added to Calendar");
      onChanged && onChanged();
    } else if (res.message) {
      setOrgMsg(res.message);
    } else {
      setOrgMsg("Action unavailable");
    }
  };

  const load = async () => {
    if (!taskId) return;
    setLoading(true);
    const res = await fetchTaskDetail(taskId);
    setDetail(res.data);
    setLoading(false);
  };

  useEffect(() => {
    if (taskId) load();
    else setDetail(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  if (!taskId) return null;

  const runAction = async (action: string) => {
    if (!detail) return;
    setBusy(true);
    let res: { isSuccess: boolean; message?: string } = { isSuccess: false };
    switch (action) {
      case "add":
        res = await addToMyTasks(detail.id);
        break;
      case "remove":
        res = await removeFromMyTasks(detail.id);
        break;
      case "start":
        res = await startTask(detail.id);
        break;
      case "submit":
        res = await sendTaskToReview(detail.id) as any;
        break;
      case "claim":
        res = await claimTask(detail.id) as any;
        break;
      default:
        break;
    }
    setBusy(false);
    if (res.isSuccess) {
      await load();
      onChanged && onChanged();
    } else if (typeof window !== "undefined" && res.message) {
      window.alert(res.message);
    }
  };

  const onToggleStep = async (stepId: string, done: boolean) => {
    if (!detail || detail.status === "completed" || detail.status === "waiting_review") return;
    setBusy(true);
    const res = await toggleTaskStep(detail.id, stepId, done);
    setBusy(false);
    if (res.isSuccess) {
      await load();
      onChanged && onChanged();
    }
  };

  const overlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const stepsEditable = detail && ["not_started", "in_progress", "rejected"].includes(detail.status);

  return (
    <S.Overlay onClick={overlayClick} data-testid="task-detail-drawer">
      <S.Panel>
        {loading || !detail ? (
          <S.Loading>Loading task…</S.Loading>
        ) : (
          <>
            <S.TopBar>
              <div>
                {detail.activity ? (
                  <S.ActivityLink
                    data-testid="task-detail-activity-link"
                    onClick={() => onOpenActivity && detail.activity && onOpenActivity(detail.activity.id)}
                  >
                    {detail.activity.title}
                  </S.ActivityLink>
                ) : (
                  <S.ActivityLink as="span">{detail.scope === "earlyland" ? "EarlyLand" : "Task"}</S.ActivityLink>
                )}
                <S.Title data-testid="task-detail-title">{detail.title}</S.Title>
              </div>
              <S.CloseBtn onClick={onClose} data-testid="task-detail-close" aria-label="Close">
                ×
              </S.CloseBtn>
            </S.TopBar>

            <S.StatusRow>
              <S.XpTag>+{detail.xpReward} XP</S.XpTag>
              <S.Badge $tone={STATE_TONE[detail.status] || "default"} data-testid="task-detail-status">
                {STATE_LABEL[detail.status] || detail.status}
              </S.Badge>
              {detail.access === "prime" ? <S.Badge $tone="prime">Prime</S.Badge> : <S.Badge>Public</S.Badge>}
            </S.StatusRow>

            {detail.description ? <S.Description>{detail.description}</S.Description> : null}

            {detail.status === "rejected" && detail.rejectionReason ? (
              <S.Banner $tone="red" data-testid="task-detail-rejection">
                <S.BannerTitle>Submission rejected</S.BannerTitle>
                {detail.rejectionReason}
              </S.Banner>
            ) : null}

            {detail.clarificationRequest ? (
              <S.Banner $tone="yellow" data-testid="task-detail-clarification">
                <S.BannerTitle>Clarification required</S.BannerTitle>
                {detail.clarificationRequest}
              </S.Banner>
            ) : null}

            <S.MetaGrid>
              <S.MetaItem>
                <S.MetaLabel>Difficulty</S.MetaLabel>
                <S.MetaValue>{detail.difficulty || "—"}</S.MetaValue>
              </S.MetaItem>
              <S.MetaItem>
                <S.MetaLabel>Est. time</S.MetaLabel>
                <S.MetaValue>{detail.estimatedMinutes ? `${detail.estimatedMinutes} min` : "—"}</S.MetaValue>
              </S.MetaItem>
              <S.MetaItem>
                <S.MetaLabel>Deadline</S.MetaLabel>
                <S.MetaValue>{fmtDate(detail.deadline)}</S.MetaValue>
              </S.MetaItem>
              <S.MetaItem>
                <S.MetaLabel>Completion</S.MetaLabel>
                <S.MetaValue>{MODE_LABEL[detail.completionMode] || detail.completionMode}</S.MetaValue>
              </S.MetaItem>
              <S.MetaItem>
                <S.MetaLabel>Repeat</S.MetaLabel>
                <S.MetaValue>{REPEAT_LABEL[detail.repeat] || detail.repeat}</S.MetaValue>
              </S.MetaItem>
              <S.MetaItem>
                <S.MetaLabel>Access</S.MetaLabel>
                <S.MetaValue>{detail.access === "prime" ? "Prime" : "Public"}</S.MetaValue>
              </S.MetaItem>
            </S.MetaGrid>

            {detail.progress.goal > 0 ? (
              <S.Section>
                <S.SectionTitle>Progress · {detail.progress.value}/{detail.progress.goal} ({detail.progress.percent}%)</S.SectionTitle>
                <S.ProgressBar>
                  <S.ProgressFill $pct={detail.progress.percent} />
                </S.ProgressBar>
              </S.Section>
            ) : null}

            {detail.steps.length ? (
              <S.Section>
                <S.SectionTitle>
                  Steps · {detail.stepsDone}/{detail.stepsTotal}
                </S.SectionTitle>
                {detail.steps.map((step) => (
                  <S.StepRow
                    key={step.id}
                    $done={step.done}
                    $clickable={!!stepsEditable}
                    data-testid="task-detail-step"
                    onClick={() => stepsEditable && onToggleStep(step.id, !step.done)}
                  >
                    <S.StepCheck $done={step.done}>{step.done ? "✓" : ""}</S.StepCheck>
                    <S.StepBody>
                      <S.StepTitle>
                        {step.title}
                        {step.optional ? " (optional)" : ""}
                      </S.StepTitle>
                      {step.description ? <S.StepDesc>{step.description}</S.StepDesc> : null}
                      {step.actionUrl ? (
                        <S.StepAction href={step.actionUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                          {step.actionLabel || "Open link"} ↗
                        </S.StepAction>
                      ) : null}
                    </S.StepBody>
                  </S.StepRow>
                ))}
              </S.Section>
            ) : null}

            <S.Actions>
              {detail.actions.length ? (
                detail.actions.map((action) =>
                  action === "remove" ? (
                    <S.GhostButton
                      key={action}
                      disabled={busy}
                      onClick={() => runAction(action)}
                      data-testid={`task-detail-action-${action}`}
                    >
                      {ACTION_LABEL[action] || action}
                    </S.GhostButton>
                  ) : (
                    <S.PrimaryButton
                      key={action}
                      disabled={busy}
                      onClick={() => runAction(action)}
                      data-testid={`task-detail-action-${action}`}
                    >
                      {busy ? "…" : ACTION_LABEL[action] || action}
                    </S.PrimaryButton>
                  )
                )
              ) : (
                <S.StateChip $state={detail.status} data-testid="task-detail-state-chip">
                  {STATE_LABEL[detail.status] || detail.status}
                </S.StateChip>
              )}
            </S.Actions>

            <S.Section data-testid="task-detail-organize">
              <S.SectionTitle>Organize (reference · no XP)</S.SectionTitle>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <S.GhostButton
                  disabled={orgBusy === "board"}
                  onClick={() => organize("board")}
                  data-testid="task-detail-add-board"
                >
                  {orgBusy === "board" ? "Adding…" : "Add to My Board"}
                </S.GhostButton>
                <S.GhostButton
                  disabled={orgBusy === "calendar"}
                  onClick={() => organize("calendar")}
                  data-testid="task-detail-add-calendar"
                >
                  {orgBusy === "calendar" ? "Adding…" : "Add to Calendar"}
                </S.GhostButton>
              </div>
              {orgMsg ? (
                <div
                  data-testid="task-detail-organize-msg"
                  style={{ marginTop: 8, fontSize: 13, color: "#05A584" }}
                >
                  {orgMsg}
                </div>
              ) : null}
            </S.Section>
          </>
        )}
      </S.Panel>
    </S.Overlay>
  );
};

export default TaskDetailDrawer;
