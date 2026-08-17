import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type TaskUserProgressDocument = HydratedDocument<TaskUserProgress>;

// Per-user progress/lifecycle for a task. This is the CANONICAL progress record
// (P12). It is distinct from the TASK lifecycle status. EarlylandTaskUserState
// is kept as a compatibility mirror for the public site.
export type TaskUserProgressState =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'completed'
  | 'rejected';

@Schema({ collection: 'task_user_progress', timestamps: true })
export class TaskUserProgress {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  taskId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ enum: ['default', 'special'], default: 'special', index: true })
  taskType: 'default' | 'special';

  @Prop({ type: mongoose.Schema.Types.ObjectId, index: true })
  activityId?: mongoose.Types.ObjectId;

  @Prop({
    enum: [
      'not_started',
      'in_progress',
      'submitted',
      'under_review',
      'completed',
      'rejected',
    ],
    default: 'not_started',
    index: true,
  })
  state: TaskUserProgressState;

  @Prop({ default: 0 })
  currentValue: number;

  @Prop({ default: 0 })
  targetValue: number;

  @Prop({ default: 0 })
  progressPercent: number;

  @Prop({ default: '' })
  completionMode: string;

  @Prop({ type: Date, default: null })
  startedAt: Date | null;

  @Prop({ type: Date, default: null })
  submittedAt: Date | null;

  @Prop({ type: Date, default: null })
  verifiedAt: Date | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ default: '' })
  reviewerId: string;

  @Prop({ default: '' })
  rejectionReason: string;

  @Prop({ default: '' })
  xpTransactionId: string;

  @Prop({ default: 1 })
  attempt: number;

  // ── Version snapshot (P10) — frozen at award time ──────────────────────────
  @Prop({ default: 1 })
  taskVersion: number;

  @Prop({ default: 0 })
  awardedXpSnapshot: number;

  @Prop({ default: 0 })
  targetSnapshot: number;

  // ── Review lifecycle (P9) ──────────────────────────────────────────────────
  @Prop({ default: '' })
  reviewerNote: string;

  @Prop({ default: '' })
  clarificationRequest: string;

  @Prop({ default: 0 })
  completionsCount: number;

  // ── Personal Tasker membership (canonical, no separate collection) ──────────
  // User's "Добавить в мои задачи" intent. Tasker / Board / Calendar are all
  // views over this same TaskUserProgress record.
  @Prop({ default: false, index: true })
  addedToTasker: boolean;

  @Prop({ type: Date, default: null })
  addedAt: Date | null;

  // Per-user step completion map: { [stepId]: { done, completedAt } } (P1)
  @Prop({ type: Object, default: {} })
  stepsState: Record<string, { done: boolean; completedAt?: Date }>;

  // Anti-fraud diagnostics (P5). Never auto-reject; surfaced to moderators.
  @Prop({ type: [String], default: [] })
  riskFlags: string[];

  @Prop({ default: 0 })
  riskScore: number;

  @Prop({ default: '' })
  evidenceHash: string;

  @Prop({ type: Object, default: {} })
  evidence: Record<string, any>;
}

export const TaskUserProgressSchema =
  SchemaFactory.createForClass(TaskUserProgress);

TaskUserProgressSchema.index(
  { taskId: 1, userId: 1, attempt: 1 },
  { unique: true, name: 'uniq_task_user_attempt' },
);
