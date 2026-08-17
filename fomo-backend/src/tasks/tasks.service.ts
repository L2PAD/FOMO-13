import mongoose, { Model } from "mongoose";
import * as crypto from "crypto";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Task, TaskDocument, TaskTypes } from "./models/task.model";
import { Project, ProjectDocument } from "src/projects/project.model";
import { User, UserDocument } from "src/user/user.model";
import { TaskDto, TaskValidationKeys } from "./dto/task.dto";
import { Comment, CommentDocument } from "src/comments/models/comment.model";
import { Ref, RefDocument } from "src/ref/ref.model";
import {
  EarlylandTaskUserState,
  EarlylandTaskUserStateDocument,
} from "./models/earlyland-task-user-state.model";
import {
  TaskUserProgress,
  TaskUserProgressDocument,
} from "./models/task-user-progress.model";
import {
  FomoV2Activity,
  FomoV2ActivityDocument,
} from "src/fomo-v2/domains/activities/models";
import { FomoV2ActivityAccessPolicyService } from "src/fomo-v2/domains/activities";
import { EarlyLandAccessGrant } from "src/fomo-v2/domains/activities/models/earlyland-access.model";
import { XpLedgerService } from "src/xp/xp-ledger.service";
import { XpTransaction } from "src/xp/xp-transaction.model";
import { TaskMetricResolver } from "./metrics/task-metric-resolver";
import { BadgesService } from "src/badges/badges.service";

const oid = (id: string) => new mongoose.Types.ObjectId(id);

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Ref.name) private refModel: Model<RefDocument>,
    @InjectModel(EarlylandTaskUserState.name)
    private taskUserStateModel: Model<EarlylandTaskUserStateDocument>,
    @InjectModel(TaskUserProgress.name)
    private progressModel: Model<TaskUserProgressDocument>,
    @InjectModel(FomoV2Activity.name)
    private fomoV2ActivityModel: Model<FomoV2ActivityDocument>,
    @InjectModel(XpTransaction.name)
    private txModel: Model<XpTransaction>,
    private activityAccessPolicy: FomoV2ActivityAccessPolicyService,
    private readonly xpLedger: XpLedgerService,
    private readonly metricResolver: TaskMetricResolver,
    @Optional() private readonly badgesService?: BadgesService,
    @Optional()
    @InjectModel(EarlyLandAccessGrant.name)
    private readonly grantModel?: Model<any>,
  ) {}

  /** P10 — best-effort, non-blocking badge re-evaluation after a task award. */
  private async evaluateBadgesSafe(userId: string): Promise<void> {
    try {
      if (this.badgesService && typeof (this.badgesService as any).evaluateForUser === "function") {
        await (this.badgesService as any).evaluateForUser(userId, { reason: "task_completed" });
      }
    } catch {
      /* never block task completion on badge evaluation */
    }
  }

  private readonly TASK_EVENT_TYPES = ["task_completed", "earlyland_task"];

  private async requireLinkedActivity(
    activityId?: mongoose.Types.ObjectId,
  ): Promise<FomoV2ActivityDocument | null> {
    if (!activityId) return null;
    const activity = await this.fomoV2ActivityModel.findById(activityId);
    if (!activity) throw new BadRequestException("Earlyland activity not found");
    return activity;
  }

  private normalizeAccessTier(value?: string): "public" | "prime" {
    const normalized = String(value || "public").trim().toLowerCase();
    if (normalized !== "public" && normalized !== "prime") {
      throw new BadRequestException("Task accessTier must be public or prime");
    }
    return normalized;
  }

  private normalizeV2ActivityId(value?: any): mongoose.Types.ObjectId | undefined {
    const normalized = String(value || "").trim();
    if (!normalized) return undefined;
    if (!mongoose.Types.ObjectId.isValid(normalized)) {
      throw new BadRequestException("Invalid Earlyland activity");
    }
    return new mongoose.Types.ObjectId(normalized);
  }

  private normalizeCompletionMode(value?: string, type?: string, metric?: string): string {
    const v = String(value || "").trim().toUpperCase();
    const allowed = ["AUTO_METRIC", "USER_CLAIM", "MODERATOR_REVIEW", "EXTERNAL_ACTION"];
    if (allowed.includes(v)) return v;
    // sensible defaults: global tasks with a metric -> AUTO, else review.
    if (type === "special") return metric ? "AUTO_METRIC" : "MODERATOR_REVIEW";
    return "MODERATOR_REVIEW";
  }

  private taskWriteData(task: TaskDto, current?: TaskDocument | null) {
    const type = task.type || current?.type || "default";
    const v2ActivityId = this.normalizeV2ActivityId(
      task.v2ActivityId ?? current?.v2ActivityId,
    );
    if (type === "default" && !v2ActivityId) {
      throw new BadRequestException(
        "Default Earlyland task must be linked to an activity",
      );
    }

    const name = String(task.name ?? current?.name ?? "").trim();
    if (!name) throw new BadRequestException("Task title is required");

    const points = Number(task.points ?? current?.points ?? 0);
    if (!Number.isFinite(points) || points < 0) {
      throw new BadRequestException("Task points must be a positive number");
    }
    const goal = Number(task.goal ?? current?.goal ?? 0);
    if (!Number.isFinite(goal) || goal < 0) {
      throw new BadRequestException("Task goal must be a positive number");
    }

    const projectIdValue = String(task.projectId ?? current?.projectId ?? "").trim();
    if (projectIdValue && !mongoose.Types.ObjectId.isValid(projectIdValue)) {
      throw new BadRequestException("Invalid legacy project");
    }

    const metric = String(task.metric ?? current?.metric ?? "").trim();
    const completionMode = this.normalizeCompletionMode(
      task.completionMode ?? current?.completionMode,
      type,
      metric,
    );
    const targetValue = Number(task.targetValue ?? current?.targetValue ?? goal ?? 0);
    const allowedStatus = ["draft", "scheduled", "active", "paused", "ended", "archived"];
    const rawStatus = String(task.taskStatus ?? current?.taskStatus ?? "active").trim();
    const taskStatus = allowedStatus.includes(rawStatus) ? rawStatus : "active";
    const allowedRepeat = ["once", "daily", "weekly", "unlimited"];
    const rawRepeat = String(task.repeatMode ?? current?.repeatMode ?? "once").trim();
    const repeatMode = allowedRepeat.includes(rawRepeat) ? rawRepeat : "once";

    return {
      name,
      date: task.date ?? current?.date,
      link: String(task.link ?? current?.link ?? "").trim(),
      description: String(task.description ?? current?.description ?? ""),
      smallDescription: String(
        task.smallDescription ?? current?.smallDescription ?? "",
      ),
      time: String(task.time ?? current?.time ?? "").trim(),
      points,
      goal,
      status: task.status ?? current?.status ?? "not started",
      validationKey: task.validationKey ?? current?.validationKey,
      type,
      ...(projectIdValue && {
        projectId: new mongoose.Types.ObjectId(projectIdValue),
      }),
      v2ActivityId,
      ...(v2ActivityId ? { activityEntity: "fomo_v2" as const } : {}),
      accessTier: this.normalizeAccessTier(
        task.accessTier ?? current?.accessTier,
      ),
      scope: "global" as const,
      origin: "admin" as const,
      // canonical completion / lifecycle
      completionMode,
      metric,
      operator: String(task.operator ?? current?.operator ?? ">=").trim() || ">=",
      targetValue: Number.isFinite(targetValue) ? targetValue : 0,
      taskStatus,
      deadline: task.deadline ?? current?.deadline,
      difficulty: String(task.difficulty ?? current?.difficulty ?? "").trim(),
      repeatMode,
      cooldownSec: Math.max(0, Number(task.cooldownSec ?? current?.cooldownSec ?? 0) || 0),
      maxCompletions: Math.max(0, Number(task.maxCompletions ?? current?.maxCompletions ?? 0) || 0),
      maxCompletionsPerDay: Math.max(0, Number(task.maxCompletionsPerDay ?? current?.maxCompletionsPerDay ?? 0) || 0),
      steps: this.normalizeSteps(task.steps ?? current?.steps),
    };
  }

  private normalizeSteps(raw: any): any[] {
    let arr = raw;
    if (typeof raw === "string") {
      try { arr = JSON.parse(raw); } catch { arr = []; }
    }
    if (!Array.isArray(arr)) return [];
    return arr.map((s: any, i: number) => ({
      id: String(s?.id || `step_${i + 1}`),
      order: Number(s?.order ?? i + 1),
      title: String(s?.title || "").trim(),
      description: String(s?.description || ""),
      actionLabel: String(s?.actionLabel || ""),
      actionUrl: String(s?.actionUrl || ""),
      estimatedMinutes: Number(s?.estimatedMinutes || 0),
      optional: Boolean(s?.optional || false),
      verificationMode: String(s?.verificationMode || ""),
      verificationHint: String(s?.verificationHint || ""),
    })).filter((s: any) => s.title);
  }

  private isPublishedActivity(activity?: FomoV2ActivityDocument | null): boolean {
    return Boolean(
      activity &&
        activity.publicationStatus === "published" &&
        activity.publishedSnapshot &&
        activity.publishedMetadata &&
        !activity.hiddenAt,
    );
  }

  private effectiveTaskAccessTier(
    task: Pick<Task, "accessTier">,
    activity?: FomoV2ActivityDocument | null,
  ): "public" | "prime" {
    return task.accessTier === "prime" ||
      activity?.publishedMetadata?.accessTier === "prime" ||
      activity?.accessTier === "prime"
      ? "prime"
      : "public";
  }

  private async requireTaskAccess(
    task: TaskDocument,
    user: UserDocument,
  ): Promise<FomoV2ActivityDocument | null> {
    const activity = await this.requireLinkedActivity(task.v2ActivityId);
    if (task.type === "default" && task.v2ActivityId && !this.isPublishedActivity(activity)) {
      throw new ForbiddenException("Linked Earlyland activity is not published");
    }

    const viewerAccess = await this.activityAccessPolicy.resolve(
      this.effectiveTaskAccessTier(task, activity),
      user.toObject ? user.toObject() : user,
    );
    if (!viewerAccess.allowed) {
      throw new ForbiddenException(
        viewerAccess.reason === "nft_required"
          ? "Spaceport NFT is required for this Prime task"
          : "Prime task access is unavailable",
      );
    }
    return activity;
  }

  private userKeys = {
    hoursOnline: "hoursOnline",
    portfolioBalance: "portfolioBalance",
  };

  private getValidationKey(key: TaskValidationKeys): string {
    switch (key) {
      case "Comments on Topic":
        return "comments";
      case "Hours online":
        return "hoursOnline";
      case "Invited Users":
        return "refLvlOne";
      case "NFT Deals":
        return "deals";
      case "Portfolio Balance":
        return "portfolioBalance";
      default:
        return "";
    }
  }

  // ── Canonical progress helpers (P12/P13) ──────────────────────────────────
  private async upsertProgress(
    task: TaskDocument | any,
    userId: string,
    patch: Record<string, any>,
  ): Promise<void> {
    const { $inc, ...setPatch } = patch || {};
    const update: Record<string, any> = {
      $set: {
        taskType: task.type,
        activityId: task.v2ActivityId || undefined,
        completionMode: task.completionMode || "",
        targetValue: Number(task.targetValue || task.goal || 0),
        ...setPatch,
      },
    };
    if ($inc) update.$inc = $inc;
    await this.progressModel.findOneAndUpdate(
      { taskId: task._id, userId: oid(userId), attempt: 1 },
      update,
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  /** Resolve the canonical metric value for a task and whether the condition is met. */
  private async evaluateMetric(
    task: TaskDocument | any,
    user: any,
  ): Promise<{ value: number; connected: boolean; met: boolean; target: number }> {
    const extra: Record<string, number> = {};
    if (task.metric === "content.comments") {
      extra.comments = await this.commentModel.countDocuments({
        isTopic: true,
        author: user._id,
      });
    }
    const resolved = this.metricResolver.resolve(task.metric, user, extra);
    const target = Number(task.targetValue || task.goal || 0);
    const op = String(task.operator || ">=");
    const v = resolved.value;
    const met =
      op === ">="
        ? v >= target
        : op === ">"
        ? v > target
        : op === "="
        ? v === target
        : op === "<="
        ? v <= target
        : op === "<"
        ? v < target
        : false;
    return { value: v, connected: resolved.connected, met, target };
  }

  // ── Anti-fraud (P5) — rule-based riskFlags + score, never auto-reject ──────
  private hashEvidence(evidence: any): string {
    const s = JSON.stringify(evidence || {});
    if (!s || s === "{}") return "";
    return crypto.createHash("sha256").update(s).digest("hex");
  }

  private async computeRisk(
    task: any,
    userId: string,
    evidenceHash: string,
    startedAt?: Date | null,
  ): Promise<{ flags: string[]; score: number }> {
    const flags: string[] = [];
    // TOO_FAST — submitted far quicker than the estimated duration.
    const estMin = Math.max(
      0,
      ...(Array.isArray(task.steps) ? task.steps.map((s: any) => Number(s.estimatedMinutes || 0)) : [0]),
      Number(task.estimatedMinutes || 0),
    );
    if (estMin > 0 && startedAt) {
      const elapsedMin = (Date.now() - new Date(startedAt).getTime()) / 60000;
      if (elapsedMin < estMin * 0.2) flags.push("TOO_FAST");
    }
    // DUPLICATE_EVIDENCE — same evidence hash already used (any user/task).
    if (evidenceHash) {
      const dup = await this.progressModel.countDocuments({ evidenceHash });
      if (dup > 0) flags.push("DUPLICATE_EVIDENCE");
    }
    // COMPLETION_BURST — too many task completions by this user in 60s.
    const burst = await this.txModel.countDocuments({
      userId,
      eventType: { $in: this.TASK_EVENT_TYPES },
      status: "awarded",
      awardedAt: { $gte: new Date(Date.now() - 60000) },
    });
    if (burst >= 5) flags.push("COMPLETION_BURST");
    const score = Math.min(100, flags.length * 34);
    return { flags, score };
  }

  // ── Canonical presentation DTO (P4) — all interpretation on the backend ────
  private statusForUser(task: any, prog: any, metricMet: boolean): string {
    if (prog?.state === "completed") return "completed";
    if (prog?.state === "rejected") return "rejected";
    if (prog?.state === "under_review" || prog?.state === "submitted") return "waiting_review";
    if (task.completionMode === "AUTO_METRIC") return metricMet ? "completed" : (prog ? "in_progress" : "not_started");
    if (metricMet && task.completionMode === "USER_CLAIM") return "claimable";
    return prog?.state === "in_progress" ? "in_progress" : "not_started";
  }

  async buildPresentation(type: TaskTypes, userId: string): Promise<any[]> {
    const raw = await this.getTasks(type, { userId }, { _id: userId, role: ["user"] });
    const progressDocs = await this.progressModel
      .find({ userId: oid(userId), taskId: { $in: raw.map((t: any) => t._id) } })
      .lean();
    const progByTask = new Map(progressDocs.map((p: any) => [String(p.taskId), p]));
    return raw.map((t: any) => {
      const prog = progByTask.get(String(t._id));
      const goal = Number(t.targetValue || t.goal || 0);
      const value = Number(t.value || 0);
      const metricMet = t.metric ? Boolean(t.metricMet) : value >= goal;
      const status = this.statusForUser(t, prog, metricMet);
      const claimable =
        t.completionMode === "USER_CLAIM" && metricMet && status !== "completed";
      const steps = (t.steps || []).map((s: any) => ({
        ...s,
        done: Boolean(prog?.stepsState?.[s.id]?.done),
      }));
      return {
        id: String(t._id),
        title: t.name,
        description: t.description || t.smallDescription || "",
        scope: t.type === "default" ? "earlyland" : "core",
        activity: t.v2ActivityId ? String(t.v2ActivityId) : null,
        xpReward: Number(t.points || 0),
        difficulty: t.difficulty || "",
        access: t.accessTier || "public",
        completionMode: t.completionMode || "MODERATOR_REVIEW",
        repeat: t.repeatMode || "once",
        metric: t.metric || "",
        progress: {
          value,
          goal,
          percent: goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : (status === "completed" ? 100 : 0),
          connected: t.metric ? Boolean(t.metricConnected) : true,
        },
        status,
        claimable,
        deadline: t.deadline || null,
        steps,
        rejectionReason: prog?.rejectionReason || "",
        clarificationRequest: prog?.clarificationRequest || "",
      };
    });
  }

  // ── Presentation-ready tasks for a single EarlyLand Activity ──────────────
  // Frontend does NOT stitch business logic: it receives ready-to-render tasks
  // plus (for an authenticated user) the personal tasker/progress state.
  async buildActivityTasks(activityId: string, userId?: string): Promise<any[]> {
    if (!activityId || !mongoose.Types.ObjectId.isValid(activityId)) return [];

    // Only surface tasks that are live for participation.
    const rows = await this.taskModel
      .find({
        v2ActivityId: oid(activityId),
        taskStatus: { $in: ["active", "scheduled", "ended"] },
      })
      .sort({ date: 1, _id: 1 })
      .lean();

    const uid = userId && mongoose.Types.ObjectId.isValid(userId) ? userId : "";
    const progByTask = new Map<string, any>();
    if (uid) {
      const progs = await this.progressModel
        .find({ userId: oid(uid), taskId: { $in: rows.map((t: any) => t._id) } })
        .lean();
      progs.forEach((p: any) => progByTask.set(String(p.taskId), p));
    }

    const engaged = ["in_progress", "submitted", "under_review", "completed", "rejected"];
    return rows.map((t: any) => {
      const prog = progByTask.get(String(t._id));
      const goal = Number(t.targetValue || t.goal || 0);
      const value = Number(t.value || 0);
      const metricMet = t.metric ? Boolean(t.metricMet) : value >= goal;
      const status = this.statusForUser(t, prog, metricMet);
      const addedToTasker = Boolean(prog?.addedToTasker) || engaged.includes(prog?.state);
      let taskerState = "available";
      if (status === "completed") taskerState = "completed";
      else if (status === "waiting_review") taskerState = "under_review";
      else if (status === "in_progress" || status === "claimable") taskerState = "in_progress";
      else if (addedToTasker) taskerState = "added";
      return {
        id: String(t._id),
        title: t.name,
        description: t.description || t.smallDescription || "",
        activity: String(activityId),
        xpReward: Number(t.points || 0),
        difficulty: t.difficulty || "",
        access: t.accessTier || "public",
        completionMode: t.completionMode || "MODERATOR_REVIEW",
        deadline: t.deadline || null,
        status,
        taskerState,
        addedToTasker,
        canRemove: addedToTasker && status === "not_started",
        claimable: t.completionMode === "USER_CLAIM" && metricMet && status !== "completed",
        progress: {
          value,
          goal,
          percent: goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : (status === "completed" ? 100 : 0),
        },
        stepsTotal: (t.steps || []).length,
        stepsDone: (t.steps || []).filter((s: any) => prog?.stepsState?.[s.id]?.done).length,
      };
    });
  }


  async toggleStep(taskId: string, userId: string, stepId: string, done: boolean): Promise<any> {
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new NotFoundException("Task not found");
    const key = `stepsState.${stepId}`;
    await this.progressModel.findOneAndUpdate(
      { taskId: task._id, userId: oid(userId), attempt: 1 },
      {
        $set: {
          taskType: task.type,
          activityId: task.v2ActivityId || undefined,
          completionMode: task.completionMode || "",
          state: "in_progress",
          startedAt: new Date(),
          [key]: { done, completedAt: done ? new Date() : null },
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
    const prog = await this.progressModel.findOne({ taskId: task._id, userId: oid(userId), attempt: 1 }).lean();
    const required = (task.steps || []).filter((s: any) => !s.optional);
    const allDone = required.length > 0 && required.every((s: any) => (prog as any)?.stepsState?.[s.id]?.done);
    return { success: true, allRequiredDone: allDone };
  }

  async getDiagnostics(): Promise<any> {
    const rows = await this.progressModel
      .find({ $or: [{ riskFlags: { $exists: true, $ne: [] } }, { riskScore: { $gt: 0 } }] })
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();
    const tasks = await this.taskModel.find({}, { name: 1 }).lean();
    const users = await this.userModel.find({ _id: { $in: rows.map((r: any) => r.userId) } }, { username: 1, name: 1, email: 1 }).lean();
    const tName = new Map(tasks.map((t: any) => [String(t._id), t.name]));
    const uName = new Map(users.map((u: any) => [String(u._id), u.username || u.name || u.email]));
    const counters: Record<string, number> = { TOO_FAST: 0, DUPLICATE_EVIDENCE: 0, COMPLETION_BURST: 0, COOLDOWN_ATTEMPT: 0, XP_CAP_REACHED: 0 };
    for (const r of rows as any[]) for (const f of r.riskFlags || []) counters[f] = (counters[f] || 0) + 1;
    return {
      counters,
      usersWithFlags: new Set((rows as any[]).map((r) => String(r.userId))).size,
      rows: (rows as any[]).map((r) => ({
        userId: r.userId,
        user: uName.get(String(r.userId)) || "—",
        taskId: r.taskId,
        task: tName.get(String(r.taskId)) || "—",
        flags: r.riskFlags || [],
        riskScore: r.riskScore || 0,
        state: r.state,
        at: r.updatedAt,
      })),
    };
  }

  async getTasks(
    type: TaskTypes,
    query?: any,
    viewer?: Record<string, any>,
  ): Promise<Array<any>> {
    const roles = (Array.isArray(viewer?.role) ? viewer?.role : [viewer?.role])
      .map((role) => String(role || "").trim())
      .filter(Boolean);
    const isStaff = roles.some((role) => role === "admin" || role === "moderator");
    let data = await this.taskModel.aggregate([
      { $match: { type } },
      {
        $lookup: {
          from: this.projectModel.collection.name,
          localField: "projectId",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: this.userModel.collection.name,
          localField: "awardedUsers",
          foreignField: "_id",
          as: "awarded",
          pipeline: [
            { $project: { _id: 1, email: 1, name: 1, nickname: 1, avatar: 1 } },
          ],
        },
      },
      {
        $lookup: {
          from: this.userModel.collection.name,
          localField: "usersRequests",
          foreignField: "_id",
          as: "requeries",
          pipeline: [
            { $project: { _id: 1, email: 1, name: 1, nickname: 1, avatar: 1 } },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    if (!isStaff) {
      const viewerId = String(viewer?._id || "").trim();
      if (type === "default") {
        const activityIds = data.map((task) => task.v2ActivityId).filter(Boolean);
        const activities = activityIds.length
          ? await this.fomoV2ActivityModel.find({ _id: { $in: activityIds } })
          : [];
        const activityById = new Map(
          activities.map((activity) => [String(activity._id), activity]),
        );
        const filtered: any[] = [];
        for (const task of data) {
          if (task.v2ActivityId) {
            const activity = activityById.get(String(task.v2ActivityId));
            if (!this.isPublishedActivity(activity)) continue;
            const viewerAccess = await this.activityAccessPolicy.resolve(
              this.effectiveTaskAccessTier(task, activity),
              viewer,
            );
            if (!viewerAccess.allowed) continue;
          }
          filtered.push(task);
        }
        data = filtered;
      }

      data = data.map((task) => ({
        ...task,
        awardedUsers:
          viewerId && (task.awardedUsers || []).some((id) => String(id) === viewerId)
            ? [viewerId]
            : [],
        usersRequests:
          viewerId && (task.usersRequests || []).some((id) => String(id) === viewerId)
            ? [viewerId]
            : [],
        awarded: undefined,
        requeries: undefined,
      }));
    }

    if (type === "special" && query?.userId) {
      const userId: string = isStaff
        ? String(query.userId)
        : String(viewer?._id || "");
      const userData = await this.userModel.findById(userId);
      for (let i = 0; i < data.length; i++) {
        const task = data[i];
        if (!userData) continue;
        // Legacy validationKey-based value (kept for backward compatibility).
        if (this.userKeys[task.validationKey]) {
          task.value = userData[task.validationKey] || 0;
        }
        if (task.validationKey === "comments") {
          const userTopicComments: any = await this.commentModel.find({
            isTopic: true,
            author: new mongoose.Types.ObjectId(userId),
          });
          task.value = userTopicComments?.length || 0;
        }
        if (task.validationKey === "refLvlOne") {
          task.value = userData?.refLvlOne?.length || 0;
        }
        // Canonical metric-based value/progress (P0/P5). Same resolver the
        // AUTO_METRIC claim uses, so the website shows live progress and the
        // Claim button appears exactly when the goal is truly reached.
        if (task.metric) {
          const m = await this.evaluateMetric(task, userData);
          task.value = m.value;
          task.metricConnected = m.connected;
          task.metricMet = m.met;
          const goal = Number(task.targetValue || task.goal || 0);
          task.progressPercent = goal > 0
            ? Math.min(100, Math.round((m.value / goal) * 100))
            : 0;
          task.claimable =
            m.connected && m.met && task.completionMode === "USER_CLAIM";
        }
      }
    }

    return data;
  }

  async getTaskItem(id: string): Promise<Task> {
    return this.taskModel
      .aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        {
          $lookup: {
            from: this.projectModel.collection.name,
            localField: "projectId",
            foreignField: "_id",
            as: "project",
          },
        },
        { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: this.userModel.collection.name,
            localField: "awardedUsers",
            foreignField: "_id",
            as: "awarded",
          },
        },
        {
          $lookup: {
            from: this.userModel.collection.name,
            localField: "usersRequests",
            foreignField: "_id",
            as: "requests",
          },
        },
      ])
      .then((result) => (result.length ? result[0] : {}));
  }

  async createTask(newTask: TaskDto): Promise<Task> {
    const taskData = {
      ...this.taskWriteData(newTask),
      validationKey: this.getValidationKey(newTask.validationKey),
    };
    const activity = await this.requireLinkedActivity(taskData.v2ActivityId);
    taskData.accessTier = this.effectiveTaskAccessTier(taskData, activity);

    return this.taskModel.create(taskData);
  }

  async updateTask(id: string, updatedTask: TaskDto): Promise<Task> {
    const current = await this.taskModel.findById(id);
    if (!current) throw new NotFoundException("Task not found");
    const taskData = this.taskWriteData(updatedTask, current);
    const activity = await this.requireLinkedActivity(taskData.v2ActivityId);
    taskData.accessTier = this.effectiveTaskAccessTier(taskData, activity);

    // P10 — bump version only when a MATERIAL condition changes so that
    // historical progress snapshots remain valid and are never rewritten.
    const material = (
      Number(current.points || 0) !== Number(taskData.points || 0) ||
      Number(current.goal || 0) !== Number(taskData.goal || 0) ||
      Number(current.targetValue || 0) !== Number(taskData.targetValue || 0) ||
      String(current.metric || "") !== String(taskData.metric || "") ||
      String(current.operator || "") !== String(taskData.operator || "") ||
      String(current.completionMode || "") !== String(taskData.completionMode || "") ||
      String(current.accessTier || "") !== String(taskData.accessTier || "")
    );
    const nextVersion = material ? Number(current.version || 1) + 1 : Number(current.version || 1);

    return this.taskModel.findByIdAndUpdate(
      id,
      { ...taskData, version: nextVersion },
      { new: true },
    );
  }

  async deleteTask(id: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException("Invalid task id");
    const task: any = await this.taskModel.findById(id).lean();
    if (!task) throw new NotFoundException("Task not found");

    // P14 — hard delete is only allowed for drafts with NO user history.
    // Everything else must be archived to preserve progress / XP / analytics.
    const [progressCount, awardCount] = await Promise.all([
      this.progressModel.countDocuments({ taskId: task._id }),
      this.txModel.countDocuments({ sourceType: "task", sourceId: String(task._id), status: "awarded" }),
    ]);
    const hasHistory =
      progressCount > 0 ||
      awardCount > 0 ||
      (Array.isArray(task.awardedUsers) && task.awardedUsers.length > 0) ||
      (Array.isArray(task.usersRequests) && task.usersRequests.length > 0);
    const isDraft = task.taskStatus === "draft";

    if (hasHistory || !isDraft) {
      throw new BadRequestException(
        "Удаление запрещено: у задания есть история выполнения или оно опубликовано. Используйте архивирование.",
      );
    }

    await this.taskModel.findByIdAndDelete(id);
    await this.taskUserStateModel.deleteMany({ taskId: task._id });
    await this.progressModel.deleteMany({ taskId: task._id });
    return { ok: true, id, deleted: true };
  }

  async confirmTaskByUser(taskId: string, userId: string, evidence?: any): Promise<Task> {
    const [task, user] = await Promise.all([
      this.taskModel.findById(taskId),
      this.userModel.findById(userId),
    ]);
    if (!task) throw new NotFoundException("Task not found");
    if (!user) throw new NotFoundException("User not found");
    await this.requireTaskAccess(task, user);

    const existing = await this.progressModel.findOne({ taskId: task._id, userId: oid(userId), attempt: 1 }).lean();
    const evidenceHash = this.hashEvidence(evidence);
    const risk = await this.computeRisk(task, userId, evidenceHash, (existing as any)?.startedAt);

    await this.upsertProgress(task, userId, {
      state: "under_review",
      submittedAt: new Date(),
      startedAt: (existing as any)?.startedAt || new Date(),
      taskVersion: Number(task.version || 1),
      targetSnapshot: Number(task.targetValue || task.goal || 0),
      awardedXpSnapshot: Number(task.points || 0),
      evidence: evidence || {},
      evidenceHash,
      riskFlags: risk.flags,
      riskScore: risk.score,
    });

    return this.taskModel.findByIdAndUpdate(taskId, {
      $addToSet: { usersRequests: new mongoose.Types.ObjectId(userId) },
    });
  }

  /**
   * P0 — MODERATOR_REVIEW approval. The ONLY reward path is the XP Ledger
   * (event `task_completed`, idempotent per user+task). Legacy `points` is no
   * longer incremented as a reward source; `tasks` counter kept for compat.
   */
  async confirmRequest(
    taskId: string,
    userId: string,
    _points: number,
    reviewerId = "",
  ): Promise<any> {
    const [task, user] = await Promise.all([
      this.taskModel.findById(taskId),
      this.userModel.findById(userId),
    ]);
    if (!task) throw new NotFoundException("Task not found");
    if (!user) throw new NotFoundException("User not found");
    await this.requireTaskAccess(task, user);

    const award = await this.xpLedger.award({
      userId,
      eventType: "task_completed",
      source: "admin",
      sourceType: "task",
      sourceId: taskId,
      baseXpOverride: Number(task.points || 0),
      verified: true,
      reason: "Задание проверено и подтверждено",
      metadata: {
        taskId,
        taskType: task.type,
        activityId: task.v2ActivityId ? String(task.v2ActivityId) : "",
        completionMode: task.completionMode || "MODERATOR_REVIEW",
        verifiedBy: "moderator",
      },
      idempotencyKey: `task_completed:${taskId}:${userId}`,
    });

    await this.taskModel.findByIdAndUpdate(taskId, {
      $addToSet: { awardedUsers: new mongoose.Types.ObjectId(userId) },
      $pull: { usersRequests: new mongoose.Types.ObjectId(userId) },
    });
    // Legacy denormalized completed-task counter (NOT an XP source). Only bump
    // on the first (non-duplicate) award to keep it idempotent.
    if (award.status === "awarded") {
      await this.userModel.findByIdAndUpdate(userId, { $inc: { tasks: 1 } });
    }

    await this.upsertProgress(task, userId, {
      state: "completed",
      verifiedAt: new Date(),
      completedAt: new Date(),
      reviewerId,
      xpTransactionId: award.transactionId || "",
      taskVersion: Number(task.version || 1),
      awardedXpSnapshot: Number(task.points || 0),
      targetSnapshot: Number(task.targetValue || task.goal || 0),
      ...(award.status === "awarded" ? { $inc: { completionsCount: 1 } } : {}),
    });

    if (award.status === "awarded") await this.evaluateBadgesSafe(userId);
    return { success: true, xp: award.finalXp, status: award.status };
  }

  async rejectRequest(taskId: string, userId: string, reason = "", note = ""): Promise<any> {
    await this.taskModel.findByIdAndUpdate(taskId, {
      $pull: { usersRequests: new mongoose.Types.ObjectId(userId) },
    });
    await this.progressModel.findOneAndUpdate(
      { taskId: oid(taskId), userId: oid(userId), attempt: 1 },
      {
        $set: {
          state: "rejected",
          rejectionReason: reason || "Отклонено модератором",
          reviewerNote: note || "",
        },
      },
    );
    return { success: true };
  }

  /** P7 — moderator requests clarification; user sees the request, note stays internal. */
  async requestClarification(taskId: string, userId: string, message: string, note = ""): Promise<any> {
    await this.progressModel.findOneAndUpdate(
      { taskId: oid(taskId), userId: oid(userId), attempt: 1 },
      { $set: { clarificationRequest: message || "Требуется уточнение", reviewerNote: note || "" } },
    );
    return { success: true };
  }

  /** P11 — admin-only migration of legacy task arrays into TaskUserProgress. */
  async backfillLegacy(apply = false): Promise<any> {
    const tasks = await this.taskModel.find({}).lean();
    let toCreate = 0, existing = 0, conflicts = 0, created = 0;
    const userIds = new Set<string>();
    for (const t of tasks as any[]) {
      const awarded = (t.awardedUsers || []).map(String);
      for (const uid of awarded) {
        userIds.add(uid);
        const has = await this.progressModel.findOne({ taskId: t._id, userId: oid(uid), attempt: 1 }).lean();
        if (has) { existing++; if ((has as any).state !== "completed") conflicts++; continue; }
        toCreate++;
        if (apply) {
          await this.progressModel.create({
            taskId: t._id,
            userId: oid(uid),
            taskType: t.type,
            activityId: t.v2ActivityId || undefined,
            state: "completed",
            completedAt: t.createdAt || new Date(),
            verifiedAt: t.createdAt || new Date(),
            taskVersion: Number(t.version || 1),
            awardedXpSnapshot: Number(t.points || 0),
            targetSnapshot: Number(t.targetValue || t.goal || 0),
            evidence: { source: "legacy_migration" },
          });
          created++;
        }
      }
    }
    return {
      mode: apply ? "apply" : "dry-run",
      tasksScanned: tasks.length,
      usersAffected: userIds.size,
      willCreate: toCreate,
      created,
      existing,
      conflicts,
    };
  }

  /**
   * Unified user claim. EarlyLand (default) -> `earlyland_task`; global (special)
   * -> `task_completed`. AUTO_METRIC tasks are verified server-side against the
   * canonical metric before any award. All XP flows through the ledger.
   */
  async claimTask(taskId: string, userId: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new NotFoundException("Task not found");
    if (!user) throw new NotFoundException("User not found");

    await this.requireTaskAccess(task, user);

    const mode = String(task.completionMode || "MODERATOR_REVIEW");

    if (mode === "MODERATOR_REVIEW") {
      // A claim on a review task is a submission, not an award.
      await this.confirmTaskByUser(taskId, userId);
      return { success: true, status: "under_review", xp: 0 };
    }

    if (mode === "AUTO_METRIC") {
      const m = await this.evaluateMetric(task, user);
      if (!m.connected) {
        throw new BadRequestException("Метрика ещё не подключена — задание нельзя завершить автоматически");
      }
      if (!m.met) {
        throw new BadRequestException("Условие задания ещё не выполнено");
      }
    }

    const eventType = task.type === "default" ? "earlyland_task" : "task_completed";

    // ── Repeatable completionId + anti-farm (P3/P4) ──────────────────────────
    const now = new Date();
    const repeat = String(task.repeatMode || "once");
    const isoWeek = (d: Date) => {
      const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      const day = t.getUTCDay() || 7;
      t.setUTCDate(t.getUTCDate() + 4 - day);
      const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
      const week = Math.ceil((((t as any) - (yearStart as any)) / 86400000 + 1) / 7);
      return `${t.getUTCFullYear()}-W${week}`;
    };
    let completionId = "once";
    if (repeat === "daily") completionId = now.toISOString().slice(0, 10);
    else if (repeat === "weekly") completionId = isoWeek(now);
    else if (repeat === "unlimited" || repeat === "custom") completionId = String(now.getTime());
    const idempotencyKey =
      repeat === "once"
        ? `${eventType}:${taskId}:${userId}`
        : `${eventType}:${taskId}:${userId}:${completionId}`;

    const prevProgress = await this.progressModel.findOne({
      taskId: task._id,
      userId: oid(userId),
      attempt: 1,
    });
    if (task.cooldownSec > 0 && prevProgress?.completedAt) {
      const elapsed = (now.getTime() - new Date(prevProgress.completedAt).getTime()) / 1000;
      if (elapsed < task.cooldownSec) {
        throw new BadRequestException("Задание на кулдауне — попробуйте позже");
      }
    }
    if (task.maxCompletions > 0 && (prevProgress?.completionsCount || 0) >= task.maxCompletions) {
      throw new BadRequestException("Достигнут лимит выполнений этого задания");
    }

    const award = await this.xpLedger.award({
      userId,
      eventType,
      source: "system",
      sourceType: "task",
      sourceId: taskId,
      baseXpOverride: Number(task.points || 0),
      verified: true,
      reason: task.type === "default" ? "Задание EarlyLand выполнено" : "Задание выполнено",
      metadata: {
        taskId,
        taskType: task.type,
        activityId: task.v2ActivityId ? String(task.v2ActivityId) : "",
        completionMode: mode,
        completionId,
        taskVersion: Number(task.version || 1),
        verifiedBy: mode === "AUTO_METRIC" ? "auto" : "claim",
      },
      idempotencyKey,
    });

    const already = user.claimedTasks.some((t) => t.taskId.toString() === taskId);
    if (!already) {
      user.claimedTasks.push({ taskId: oid(taskId), date: new Date() });
      await user.save();
    }
    await this.taskModel.findByIdAndUpdate(taskId, {
      $addToSet: { awardedUsers: oid(userId) },
    });

    await this.upsertProgress(task, userId, {
      state: "completed",
      verifiedAt: new Date(),
      completedAt: new Date(),
      xpTransactionId: award.transactionId || "",
      taskVersion: Number(task.version || 1),
      awardedXpSnapshot: Number(task.points || 0),
      targetSnapshot: Number(task.targetValue || task.goal || 0),
      ...(award.status === "awarded"
        ? { $inc: { completionsCount: 1 } as any }
        : {}),
    });
    if (task.type === "default") {
      await this.taskUserStateModel.findOneAndUpdate(
        { taskId: task._id, userId: user._id },
        { $set: { status: "completed" } },
        { upsert: true, setDefaultsOnInsert: true },
      );
    }

    if (award.status === "awarded") await this.evaluateBadgesSafe(userId);
    return { success: true, status: award.status, xp: award.finalXp, completionId };
  }

  // ───────────────────────────── ADMIN / CRM ────────────────────────────────
  getMetricsCatalog() {
    return this.metricResolver.getCatalog();
  }

  private since(days: number): Date {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - Math.max(1, days));
    return d;
  }

  async getAdminOverview(days = 30): Promise<any> {
    const since = this.since(days);
    const [
      activeTasks,
      totalTasks,
      earlylandActive,
      pendingReviewLegacy,
      pendingReviewProgress,
      inProgressUsers,
      completedProgress,
      rejectedProgress,
      xpAgg,
      completionsAgg,
    ] = await Promise.all([
      this.taskModel.countDocuments({ taskStatus: { $in: ["active", "scheduled"] } }),
      this.taskModel.countDocuments({}),
      this.taskModel.distinct("v2ActivityId", { type: "default", taskStatus: "active" }),
      this.taskModel.aggregate([
        { $project: { n: { $size: { $ifNull: ["$usersRequests", []] } } } },
        { $group: { _id: null, total: { $sum: "$n" } } },
      ]),
      this.progressModel.countDocuments({ state: { $in: ["submitted", "under_review"] } }),
      this.progressModel.distinct("userId", { state: { $in: ["in_progress", "submitted", "under_review"] } }),
      this.progressModel.countDocuments({ state: "completed" }),
      this.progressModel.countDocuments({ state: "rejected" }),
      this.txModel.aggregate([
        { $match: { eventType: { $in: this.TASK_EVENT_TYPES }, status: "awarded" } },
        { $group: { _id: null, xp: { $sum: "$finalXp" }, cnt: { $sum: 1 } } },
      ]),
      this.txModel.countDocuments({
        eventType: { $in: this.TASK_EVENT_TYPES },
        status: "awarded",
        awardedAt: { $gte: since },
      }),
    ]);

    const totalAwarded = (xpAgg[0]?.cnt || 0) + rejectedProgress;
    const avgCompletion = totalAwarded > 0
      ? Math.round(((xpAgg[0]?.cnt || 0) / totalAwarded) * 100)
      : 0;

    return {
      periodDays: days,
      kpis: {
        activeTasks,
        totalTasks,
        usersInProgress: (inProgressUsers || []).length,
        completionsInPeriod: completionsAgg,
        completionsTotal: xpAgg[0]?.cnt || 0,
        pendingReview: (pendingReviewLegacy[0]?.total || 0) + pendingReviewProgress,
        rejected: rejectedProgress,
        xpAwarded: xpAgg[0]?.xp || 0,
        completedTotal: completedProgress,
        avgCompletionRate: avgCompletion,
        activeCampaigns: (earlylandActive || []).filter(Boolean).length,
      },
    };
  }

  async getAdminAnalytics(days = 30): Promise<any> {
    const since = this.since(days);
    const [byDay, byEvent, topTasks] = await Promise.all([
      this.txModel.aggregate([
        {
          $match: {
            eventType: { $in: this.TASK_EVENT_TYPES },
            status: "awarded",
            awardedAt: { $gte: since },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$awardedAt" } },
            completions: { $sum: 1 },
            xp: { $sum: "$finalXp" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.txModel.aggregate([
        { $match: { eventType: { $in: this.TASK_EVENT_TYPES }, status: "awarded" } },
        { $group: { _id: "$eventType", completions: { $sum: 1 }, xp: { $sum: "$finalXp" } } },
      ]),
      this.txModel.aggregate([
        { $match: { eventType: { $in: this.TASK_EVENT_TYPES }, status: "awarded", sourceType: "task" } },
        { $group: { _id: "$sourceId", completions: { $sum: 1 }, xp: { $sum: "$finalXp" } } },
        { $sort: { completions: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Enrich top tasks with names.
    const ids = topTasks.map((t) => t._id).filter((id) => mongoose.Types.ObjectId.isValid(id));
    const tasks = ids.length
      ? await this.taskModel.find({ _id: { $in: ids.map((i) => oid(i)) } }, { name: 1, type: 1, points: 1 }).lean()
      : [];
    const nameById = new Map(tasks.map((t: any) => [String(t._id), t]));

    return {
      periodDays: days,
      byDay: byDay.map((d) => ({ date: d._id, completions: d.completions, xp: d.xp })),
      coreVsEarlyland: byEvent.map((e) => ({
        group: e._id === "earlyland_task" ? "EarlyLand" : "Core/Global",
        eventType: e._id,
        completions: e.completions,
        xp: e.xp,
      })),
      topTasks: topTasks.map((t) => ({
        taskId: t._id,
        name: nameById.get(String(t._id))?.name || "—",
        type: nameById.get(String(t._id))?.type || "",
        completions: t.completions,
        xp: t.xp,
      })),
    };
  }

  async getReviewQueue(): Promise<any[]> {
    // Legacy source of truth for pending review = task.usersRequests.
    const rows = await this.taskModel.aggregate([
      { $match: { usersRequests: { $exists: true, $ne: [] } } },
      { $unwind: "$usersRequests" },
      {
        $lookup: {
          from: this.userModel.collection.name,
          localField: "usersRequests",
          foreignField: "_id",
          as: "user",
          pipeline: [
            { $project: { _id: 1, email: 1, name: 1, username: 1, photo: 1, fomoId: 1, activityXP: 1, fomoScore: 1, rank: 1 } },
          ],
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          taskId: "$_id",
          taskName: "$name",
          taskType: "$type",
          points: "$points",
          completionMode: "$completionMode",
          activityId: "$v2ActivityId",
          user: "$user",
        },
      },
    ]);
    // P10 — enrich with anti-fraud diagnostics + submission time from the
    // canonical TaskUserProgress so moderators see WHY something is flagged.
    if (!rows.length) return rows;
    const pairs = rows
      .filter((r: any) => r.taskId && r.user?._id)
      .map((r: any) => ({ taskId: r.taskId, userId: r.user._id }));
    const progs: any[] = pairs.length
      ? await this.progressModel
          .find({ $or: pairs.map((p) => ({ taskId: p.taskId, userId: p.userId })) })
          .lean()
      : [];
    const progByKey = new Map(progs.map((p: any) => [`${String(p.taskId)}:${String(p.userId)}`, p]));
    return rows.map((r: any) => {
      const p = progByKey.get(`${String(r.taskId)}:${String(r.user?._id)}`);
      return {
        ...r,
        riskFlags: p?.riskFlags || [],
        riskScore: p?.riskScore || 0,
        submittedAt: p?.submittedAt || null,
        startedAt: p?.startedAt || null,
        evidence: p?.evidence && Object.keys(p.evidence).length ? p.evidence : null,
      };
    });
  }

  /** P7 — Customer 360 tasks tab. XP is read from the Ledger, never recomputed. */
  /* ─────────── Personal Tasker (canonical: membership on TaskUserProgress) ───────────
   * "Добавить в мои задачи" / "Убрать". Tasker, Board и Calendar — это разные
   * представления одного и того же TaskUserProgress (без отдельной коллекции).
   */
  async addToMyTasks(taskId: string, userId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestException("Invalid id");
    }
    const task: any = await this.taskModel.findById(oid(taskId)).lean();
    if (!task) throw new NotFoundException("Task not found");

    const uid = oid(userId);
    let progress: any = await this.progressModel
      .findOne({ taskId: oid(taskId), userId: uid })
      .sort({ attempt: -1 });

    if (!progress) {
      progress = await this.progressModel.create({
        taskId: oid(taskId),
        userId: uid,
        taskType: task.type || "special",
        activityId: task.v2ActivityId || null,
        completionMode: task.completionMode || "",
        state: "not_started",
        targetSnapshot: task.targetValue || task.goal || 0,
        taskVersion: task.version || 1,
        addedToTasker: true,
        addedAt: new Date(),
      });
    } else {
      progress.addedToTasker = true;
      if (!progress.addedAt) progress.addedAt = new Date();
      if (!progress.activityId && task.v2ActivityId) progress.activityId = task.v2ActivityId;
      await progress.save();
    }
    return { ok: true, taskId, state: progress.state, addedToTasker: true, addedAt: progress.addedAt };
  }

  async removeFromMyTasks(taskId: string, userId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestException("Invalid id");
    }
    const uid = oid(userId);
    const progress: any = await this.progressModel
      .findOne({ taskId: oid(taskId), userId: uid })
      .sort({ attempt: -1 });
    if (!progress) return { ok: true, taskId, addedToTasker: false };
    if (!["not_started"].includes(progress.state)) {
      throw new BadRequestException("Задача уже в работе — её нельзя убрать из личного списка");
    }
    progress.addedToTasker = false;
    progress.addedAt = null;
    await progress.save();
    return { ok: true, taskId, addedToTasker: false };
  }

  // P1 — "Start" transition for the unified Task Detail. Thin state helper over
  // the canonical TaskUserProgress: not_started/rejected → in_progress. It does
  // NOT change the task engine or award anything.
  async startMyTask(taskId: string, userId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestException("Invalid id");
    }
    const task: any = await this.taskModel.findById(oid(taskId)).lean();
    if (!task) throw new NotFoundException("Task not found");
    const uid = oid(userId);
    let progress: any = await this.progressModel
      .findOne({ taskId: oid(taskId), userId: uid })
      .sort({ attempt: -1 });
    if (!progress) {
      progress = await this.progressModel.create({
        taskId: oid(taskId),
        userId: uid,
        taskType: task.type || "special",
        activityId: task.v2ActivityId || null,
        completionMode: task.completionMode || "",
        state: "in_progress",
        startedAt: new Date(),
        targetSnapshot: task.targetValue || task.goal || 0,
        taskVersion: task.version || 1,
        addedToTasker: true,
        addedAt: new Date(),
      });
    } else {
      if (["completed", "submitted", "under_review"].includes(progress.state)) {
        throw new BadRequestException("Задачу нельзя начать в текущем статусе");
      }
      progress.state = "in_progress";
      progress.addedToTasker = true;
      if (!progress.startedAt) progress.startedAt = new Date();
      if (!progress.addedAt) progress.addedAt = new Date();
      if (!progress.activityId && task.v2ActivityId) progress.activityId = task.v2ActivityId;
      await progress.save();
    }
    return { ok: true, taskId, state: progress.state };
  }

  async getMyTasker(userId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestException("Invalid userId");
    }
    const uid = oid(userId);
    const engagedStates = ["in_progress", "submitted", "under_review", "completed", "rejected"];
    const progress: any[] = await this.progressModel
      .find({ userId: uid, $or: [{ addedToTasker: true }, { state: { $in: engagedStates } }] })
      .sort({ updatedAt: -1 })
      .lean();

    const taskIds = progress.map((p) => p.taskId).filter(Boolean);
    const tasks: any[] = taskIds.length
      ? await this.taskModel
          .find({ _id: { $in: taskIds } }, { name: 1, type: 1, points: 1, v2ActivityId: 1, date: 1, endDate: 1, completionMode: 1, accessTier: 1 })
          .lean()
      : [];
    const taskById = new Map(tasks.map((t: any) => [String(t._id), t]));

    const taskerState = (p: any): string => {
      if (p.state === "not_started") return p.addedToTasker ? "added" : "available";
      return p.state;
    };

    const items = progress.map((p) => {
      const t = taskById.get(String(p.taskId)) || {};
      const date = t.date || t.endDate || null;
      return {
        taskId: String(p.taskId),
        name: t.name || "—",
        activityId: p.activityId ? String(p.activityId) : t.v2ActivityId ? String(t.v2ActivityId) : null,
        accessTier: t.accessTier || "public",
        completionMode: p.completionMode || t.completionMode || "",
        taskerState: taskerState(p),
        state: p.state,
        addedToTasker: !!p.addedToTasker,
        addedAt: p.addedAt || null,
        xp: p.awardedXpSnapshot || t.points || 0,
        progressPercent: p.progressPercent || 0,
        date,
        deadline: t.endDate || null,
        completedAt: p.completedAt || null,
      };
    });

    const board = {
      added: items.filter((i) => i.taskerState === "added"),
      in_progress: items.filter((i) => i.taskerState === "in_progress"),
      review: items.filter((i) => ["submitted", "under_review"].includes(i.taskerState)),
      completed: items.filter((i) => i.taskerState === "completed"),
    };

    const calendar = items
      .filter((i) => !!i.date)
      .map((i) => ({ taskId: i.taskId, name: i.name, date: i.date, taskerState: i.taskerState, xp: i.xp }));

    return {
      kpis: {
        total: items.length,
        added: board.added.length,
        inProgress: board.in_progress.length,
        review: board.review.length,
        completed: board.completed.length,
        xpEarned: items.filter((i) => i.state === "completed").reduce((s, i) => s + (i.xp || 0), 0),
      },
      items,
      board,
      calendar,
    };
  }

  async getUserTasks(userId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestException("Invalid userId");
    }
    const uid = oid(userId);
    const [progress, xpAgg, tasks] = await Promise.all([
      this.progressModel.find({ userId: uid }).sort({ updatedAt: -1 }).lean(),
      this.txModel.aggregate([
        { $match: { userId, eventType: { $in: this.TASK_EVENT_TYPES }, status: "awarded" } },
        { $group: { _id: null, xp: { $sum: "$finalXp" }, cnt: { $sum: 1 } } },
      ]),
      this.taskModel.find({}, { name: 1, type: 1, points: 1, v2ActivityId: 1 }).lean(),
    ]);
    const taskById = new Map(tasks.map((t: any) => [String(t._id), t]));
    const enrich = (p: any) => ({
      taskId: p.taskId,
      name: taskById.get(String(p.taskId))?.name || "—",
      taskType: p.taskType,
      state: p.state,
      progressPercent: p.progressPercent || 0,
      currentValue: p.currentValue || 0,
      targetValue: p.targetSnapshot || p.targetValue || 0,
      xp: p.awardedXpSnapshot || taskById.get(String(p.taskId))?.points || 0,
      taskVersion: p.taskVersion || 1,
      reviewerId: p.reviewerId || "",
      xpTransactionId: p.xpTransactionId || "",
      completedAt: p.completedAt || null,
      submittedAt: p.submittedAt || null,
    });
    const active = progress.filter((p: any) => ["in_progress", "not_started"].includes(p.state)).map(enrich);
    const pending = progress.filter((p: any) => ["submitted", "under_review"].includes(p.state)).map(enrich);
    const history = progress.filter((p: any) => ["completed", "rejected"].includes(p.state)).map(enrich);
    return {
      kpis: {
        inProgress: active.length,
        completed: history.filter((h) => h.state === "completed").length,
        pendingReview: pending.length,
        rejected: history.filter((h) => h.state === "rejected").length,
        xpFromTasks: xpAgg[0]?.xp || 0,
        completionsTotal: xpAgg[0]?.cnt || 0,
      },
      active,
      pending,
      history,
    };
  }

  async listAdminTasks(group: "global" | "earlyland", activityId?: string): Promise<any[]> {
    const type = group === "global" ? "special" : "default";
    const match: Record<string, any> = { type };
    if (activityId && mongoose.Types.ObjectId.isValid(activityId)) {
      match.v2ActivityId = oid(activityId);
    }
    const rows = await this.taskModel.aggregate([
      { $match: match },
      {
        $addFields: {
          awardedCount: { $size: { $ifNull: ["$awardedUsers", []] } },
          requestsCount: { $size: { $ifNull: ["$usersRequests", []] } },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    // Attach progress counts + metric connectivity for global tasks.
    const taskIds = rows.map((r) => r._id);
    const progressAgg = taskIds.length
      ? await this.progressModel.aggregate([
          { $match: { taskId: { $in: taskIds } } },
          { $group: { _id: { taskId: "$taskId", state: "$state" }, n: { $sum: 1 } } },
        ])
      : [];
    const progByTask: Record<string, Record<string, number>> = {};
    for (const p of progressAgg) {
      const tid = String(p._id.taskId);
      progByTask[tid] = progByTask[tid] || {};
      progByTask[tid][p._id.state] = p.n;
    }

    return rows.map((r) => {
      const prog = progByTask[String(r._id)] || {};
      const completed = (prog.completed || 0) + (r.awardedCount || 0);
      const metricConnected = r.metric ? this.metricResolver.isConnected(r.metric) : null;
      return {
        _id: r._id,
        name: r.name,
        type: r.type,
        points: r.points,
        goal: r.goal,
        metric: r.metric || "",
        metricLabel: r.metric ? this.metricResolver.labelOf(r.metric) : "",
        metricConnected,
        operator: r.operator || ">=",
        targetValue: r.targetValue || r.goal || 0,
        completionMode: r.completionMode || "MODERATOR_REVIEW",
        taskStatus: r.taskStatus || "active",
        accessTier: r.accessTier || "public",
        difficulty: r.difficulty || "",
        date: r.date,
        deadline: r.deadline,
        activityId: r.v2ActivityId || null,
        validationKey: r.validationKey || "",
        counts: {
          completed,
          inProgress: prog.in_progress || 0,
          underReview: (prog.under_review || 0) + (prog.submitted || 0) + (r.requestsCount || 0),
          rejected: prog.rejected || 0,
        },
      };
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // P1 — Unified single-task presentation (canonical, public-safe). Used by the
  // public Task Detail drawer (Activity, List, Board, Calendar). The frontend
  // never computes status/claimability/CTAs — everything is resolved here.
  // Internal moderator notes / evidence are NEVER exposed.
  // ───────────────────────────────────────────────────────────────────────────
  async buildTaskDetail(taskId: string, userId?: string): Promise<any> {
    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      throw new BadRequestException("Invalid task id");
    }
    const task: any = await this.taskModel.findById(oid(taskId)).lean();
    if (!task) throw new NotFoundException("Task not found");

    const uid = userId && mongoose.Types.ObjectId.isValid(userId) ? userId : "";
    let prog: any = null;
    if (uid) {
      prog = await this.progressModel
        .findOne({ taskId: oid(taskId), userId: oid(uid) })
        .sort({ attempt: -1 })
        .lean();
    }

    // Metric evaluation (only when a metric-backed task and an authed user).
    const goal = Number(task.targetValue || task.goal || 0);
    let value = 0;
    let metricConnected = true;
    let metricMet = goal > 0 ? false : true;
    if (task.metric && uid) {
      try {
        const user = await this.userModel.findById(uid);
        if (user) {
          const m = await this.evaluateMetric(task, user);
          value = m.value;
          metricConnected = m.connected;
          metricMet = m.met;
        }
      } catch {
        /* metric resolution best-effort */
      }
    } else if (!task.metric) {
      metricMet = value >= goal;
    }

    const status = this.statusForUser(task, prog, metricMet);
    const engaged = ["in_progress", "submitted", "under_review", "completed", "rejected"];
    const addedToTasker = Boolean(prog?.addedToTasker) || engaged.includes(prog?.state);

    let taskerState = "available";
    if (status === "completed") taskerState = "completed";
    else if (status === "waiting_review") taskerState = "under_review";
    else if (status === "rejected") taskerState = "rejected";
    else if (status === "in_progress" || status === "claimable") taskerState = "in_progress";
    else if (addedToTasker) taskerState = "added";

    const steps = (task.steps || [])
      .slice()
      .sort((a: any, b: any) => Number(a.order || 0) - Number(b.order || 0))
      .map((s: any) => ({
        id: s.id,
        order: s.order,
        title: s.title,
        description: s.description || "",
        actionLabel: s.actionLabel || "",
        actionUrl: s.actionUrl || "",
        estimatedMinutes: s.estimatedMinutes || 0,
        optional: Boolean(s.optional),
        done: Boolean(prog?.stepsState?.[s.id]?.done),
      }));

    // Resolve the parent activity title (public-safe).
    let activity: any = null;
    if (task.v2ActivityId) {
      const act: any = await this.fomoV2ActivityModel
        .findById(task.v2ActivityId)
        .lean();
      if (act) {
        const title =
          act?.content?.title ||
          act?.publishedContent?.title ||
          act?.publishedMetadata?.projectName ||
          act?.slug ||
          "Activity";
        activity = { id: String(act._id), title, slug: act.slug || "", accessTier: act.accessTier || "public" };
      } else {
        activity = { id: String(task.v2ActivityId), title: "Activity", slug: "", accessTier: task.accessTier || "public" };
      }
    }

    // Dynamic canonical CTA set (single source of truth for the UI).
    const actions: string[] = [];
    const mode = task.completionMode || "MODERATOR_REVIEW";
    if (!addedToTasker && status === "not_started") actions.push("add");
    if (addedToTasker && status === "not_started") {
      actions.push("start");
      actions.push("remove");
    }
    if (status === "in_progress") {
      if (mode === "USER_CLAIM" && metricMet) actions.push("claim");
      else if (mode === "MODERATOR_REVIEW" || mode === "EXTERNAL_ACTION") actions.push("submit");
      // AUTO_METRIC completes automatically — no manual CTA.
    }
    if (status === "claimable") actions.push("claim");
    if (status === "rejected") actions.push("submit"); // resubmit

    const estimatedMinutes =
      Number(task.estimatedMinutes || 0) ||
      (Array.isArray(task.steps)
        ? task.steps.reduce((s: number, x: any) => s + Number(x.estimatedMinutes || 0), 0)
        : 0);

    return {
      id: String(task._id),
      title: task.name,
      description: task.description || task.smallDescription || "",
      activity,
      scope: task.type === "default" ? "earlyland" : "core",
      xpReward: Number(task.points || 0),
      difficulty: task.difficulty || "",
      estimatedMinutes,
      access: task.accessTier || "public",
      completionMode: mode,
      repeat: task.repeatMode || "once",
      deadline: task.deadline || null,
      link: task.link || "",
      metric: task.metric || "",
      progress: {
        value,
        goal,
        percent: goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : status === "completed" ? 100 : 0,
        connected: task.metric ? metricConnected : true,
      },
      status,
      taskerState,
      addedToTasker,
      claimable: mode === "USER_CLAIM" && metricMet && status !== "completed",
      canRemove: addedToTasker && status === "not_started",
      steps,
      stepsTotal: steps.length,
      stepsDone: steps.filter((s: any) => s.done).length,
      actions,
      // Public-safe moderation feedback only. Internal notes are never included.
      rejectionReason: prog?.rejectionReason || "",
      clarificationRequest: prog?.clarificationRequest || "",
      completedAt: prog?.completedAt || null,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // P12/P13 — Soft archive lifecycle for a Task. Archiving hides the task from
  // live feeds (buildActivityTasks excludes `archived`) but preserves
  // TaskUserProgress, XP history and analytics.
  // ───────────────────────────────────────────────────────────────────────────
  async archiveTask(id: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException("Invalid task id");
    const task = await this.taskModel.findByIdAndUpdate(
      id,
      { $set: { taskStatus: "archived" } },
      { new: true },
    );
    if (!task) throw new NotFoundException("Task not found");
    return { ok: true, id, taskStatus: task.taskStatus };
  }

  async unarchiveTask(id: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException("Invalid task id");
    const task = await this.taskModel.findByIdAndUpdate(
      id,
      { $set: { taskStatus: "active" } },
      { new: true },
    );
    if (!task) throw new NotFoundException("Task not found");
    return { ok: true, id, taskStatus: task.taskStatus };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // P6/P7/P8 — EarlyLand funnel + audience + XP read-model. Uses ONLY canonical
  // sources: TaskUserProgress (per-user task state) + XpTransaction (Ledger) +
  // EarlyLandAccessGrant. No parallel math is introduced.
  //
  // Funnel: View Activity → Open Task → Add to My Tasks → Start → Submit →
  // Approved → XP Awarded. "View/Open" are not event-tracked yet, so they are
  // reported honestly (tracked:false) instead of being faked.
  // ───────────────────────────────────────────────────────────────────────────
  async getEarlyLandFunnel(days = 30): Promise<any> {
    const since = this.since(days);

    // EarlyLand tasks = canonical `default` type (activity-linked).
    const elTasks: any[] = await this.taskModel
      .find({ type: "default" }, { _id: 1, points: 1, accessTier: 1, v2ActivityId: 1, name: 1 })
      .lean();
    const elTaskIds = elTasks.map((t) => t._id);
    const primeTaskIds = new Set(elTasks.filter((t) => t.accessTier === "prime").map((t) => String(t._id)));

    const progress: any[] = elTaskIds.length
      ? await this.progressModel.find({ taskId: { $in: elTaskIds } }).lean()
      : [];

    const uniq = (arr: any[]) => new Set(arr.map((x) => String(x))).size;

    // Funnel user sets (distinct users at each canonical step).
    const addedUsers = progress.filter((p) => p.addedToTasker || ["in_progress", "submitted", "under_review", "completed", "rejected"].includes(p.state));
    const startedUsers = progress.filter((p) => p.startedAt || ["in_progress", "submitted", "under_review", "completed", "rejected"].includes(p.state));
    const submittedUsers = progress.filter((p) => p.submittedAt || ["submitted", "under_review", "completed", "rejected"].includes(p.state));
    const approvedUsers = progress.filter((p) => p.state === "completed");

    const addBy = uniq(addedUsers.map((p) => p.userId));
    const startBy = uniq(startedUsers.map((p) => p.userId));
    const submitBy = uniq(submittedUsers.map((p) => p.userId));
    const approveBy = uniq(approvedUsers.map((p) => p.userId));

    // XP awarded via the Ledger for EarlyLand task events.
    const xpAgg = await this.txModel.aggregate([
      { $match: { eventType: { $in: this.TASK_EVENT_TYPES }, status: "awarded" } },
      { $group: { _id: null, xp: { $sum: "$finalXp" }, cnt: { $sum: 1 }, users: { $addToSet: "$userId" } } },
    ]);
    const xpAwarded = xpAgg[0]?.xp || 0;
    const xpUsers = (xpAgg[0]?.users || []).length;
    const xpAwards = xpAgg[0]?.cnt || 0;

    const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);

    const funnel = [
      { key: "view", label: "View Activity", labelRu: "Просмотр активности", users: null, tracked: false },
      { key: "open", label: "Open Task", labelRu: "Открытие задания", users: null, tracked: false },
      { key: "add", label: "Add to My Tasks", labelRu: "Добавлено в мои задачи", users: addBy, tracked: true },
      { key: "start", label: "Start", labelRu: "Начато", users: startBy, tracked: true },
      { key: "submit", label: "Submit", labelRu: "Отправлено на проверку", users: submitBy, tracked: true },
      { key: "approved", label: "Approved", labelRu: "Одобрено", users: approveBy, tracked: true },
      { key: "xp", label: "XP Awarded", labelRu: "XP начислено", users: xpUsers, tracked: true },
    ].map((step, i, arr) => {
      const prev = arr.slice(0, i).reverse().find((s: any) => s.users !== null);
      const base = arr.find((s: any) => s.users !== null)?.users || 0;
      return {
        ...step,
        conversionFromPrev: step.users === null || !prev ? null : pct(step.users, prev.users),
        conversionFromStart: step.users === null ? null : pct(step.users, base),
        dropOff: step.users === null || !prev ? null : Math.max(0, prev.users - step.users),
      };
    });

    // Audience KPIs.
    const activeSince = (d: number) => uniq(progress.filter((p) => p.updatedAt && new Date(p.updatedAt) >= this.since(d)).map((p) => p.userId));
    const primeUserSet = uniq(progress.filter((p) => primeTaskIds.has(String(p.taskId))).map((p) => p.userId));
    const publicUserSet = uniq(progress.filter((p) => !primeTaskIds.has(String(p.taskId))).map((p) => p.userId));

    // Access-source (from grants, best-effort — model injected optionally).
    let grantStats = { active: 0, expired: 0, revoked: 0 };
    if (this.grantModel) {
      const now = new Date();
      const [active, expired, revoked] = await Promise.all([
        this.grantModel.countDocuments({ revokedAt: null, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }),
        this.grantModel.countDocuments({ revokedAt: null, expiresAt: { $ne: null, $lte: now } }),
        this.grantModel.countDocuments({ revokedAt: { $ne: null } }),
      ]);
      grantStats = { active, expired, revoked };
    }

    // Per-activity breakdown.
    const byActivityMap: Record<string, any> = {};
    for (const t of elTasks) {
      const aid = t.v2ActivityId ? String(t.v2ActivityId) : "unlinked";
      byActivityMap[aid] = byActivityMap[aid] || { activityId: aid, tasks: 0, added: 0, started: 0, submitted: 0, approved: 0, potentialXp: 0 };
      byActivityMap[aid].tasks += 1;
      byActivityMap[aid].potentialXp += Number(t.points || 0);
    }
    for (const p of progress) {
      const t = elTasks.find((x) => String(x._id) === String(p.taskId));
      const aid = t?.v2ActivityId ? String(t.v2ActivityId) : "unlinked";
      const row = byActivityMap[aid];
      if (!row) continue;
      if (p.addedToTasker || p.startedAt) row.added += 1;
      if (p.startedAt || ["in_progress", "submitted", "under_review", "completed", "rejected"].includes(p.state)) row.started += 1;
      if (p.submittedAt || ["submitted", "under_review", "completed", "rejected"].includes(p.state)) row.submitted += 1;
      if (p.state === "completed") row.approved += 1;
    }

    return {
      periodDays: days,
      audience: {
        uniqueUsers: uniq(progress.map((p) => p.userId)),
        active1: activeSince(1),
        active7: activeSince(7),
        active30: activeSince(30),
        primeUsers: primeUserSet,
        publicUsers: publicUserSet,
        grants: grantStats,
      },
      funnel,
      xp: {
        awarded: xpAwarded,
        recipients: xpUsers,
        awards: xpAwards,
        perUser: xpUsers > 0 ? Math.round((xpAwarded / xpUsers) * 10) / 10 : 0,
      },
      tasks: {
        total: elTasks.length,
        prime: primeTaskIds.size,
        public: elTasks.length - primeTaskIds.size,
        potentialXp: elTasks.reduce((s, t) => s + Number(t.points || 0), 0),
      },
      byActivity: Object.values(byActivityMap).sort((a: any, b: any) => b.approved - a.approved).slice(0, 20),
    };
  }

}
