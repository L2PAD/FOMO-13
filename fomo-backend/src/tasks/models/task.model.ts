import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { TaskValidationKeys } from "../dto/task.dto";

export type TaskDocument = HydratedDocument<Task>;

export type TaskTypes = 'default' | 'special'

export type TaskStatus = 'completed' | 'in progress' | 'not started'

export type TaskAccessTier = 'public' | 'prime'

// How a task is verified/completed (canonical completion mode).
export type TaskCompletionMode =
  | 'AUTO_METRIC'
  | 'USER_CLAIM'
  | 'MODERATOR_REVIEW'
  | 'EXTERNAL_ACTION'

// Lifecycle status of the TASK itself (not the user's progress).
export type TaskLifecycleStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'ended'
  | 'archived'

export type TaskRepeatMode = 'once' | 'daily' | 'weekly' | 'unlimited'

@Schema()
export class Task {
    @Prop({ required: true })
    name: string;
  
    @Prop()
    date: Date;

    @Prop()
    link:string

    @Prop()
    description:string

    @Prop()
    smallDescription:string

    @Prop({default:'not started'})
    status:TaskStatus

    @Prop()
    validationKey:string

    @Prop()
    goal:number

    @Prop()
    time: string;
  
    @Prop({ required: false })
    projectId: mongoose.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, required: false, index: true })
    v2ActivityId?: mongoose.Types.ObjectId;

    @Prop({ enum: ['fomo_v2'], default: 'fomo_v2' })
    activityEntity?: 'fomo_v2';

    @Prop({ enum: ['public', 'prime'], default: 'public', index: true })
    accessTier: TaskAccessTier;

    @Prop({ enum: ['global'], default: 'global', index: true })
    scope: 'global';

    @Prop({ enum: ['admin'], default: 'admin' })
    origin: 'admin';
  
    @Prop({default:[]})
    awardedUsers:Array<mongoose.Types.ObjectId>

    @Prop({default:[]})
    usersRequests:Array<mongoose.Types.ObjectId>

    @Prop({default:'default'})
    type:TaskTypes

    @Prop({default:0})
    points:number 

    // ── Canonical completion / lifecycle (P1/P13) ────────────────────────────
    @Prop({
      enum: ['AUTO_METRIC', 'USER_CLAIM', 'MODERATOR_REVIEW', 'EXTERNAL_ACTION'],
      default: 'MODERATOR_REVIEW',
      index: true,
    })
    completionMode: TaskCompletionMode;

    // Canonical metric key for AUTO_METRIC tasks (e.g. "portfolio.balance").
    @Prop({ default: '' })
    metric: string;

    @Prop({ enum: ['>=', '>', '=', '<=', '<'], default: '>=' })
    operator: string;

    // Target value for AUTO_METRIC (mirrors `goal`, kept explicit for the engine).
    @Prop({ default: 0 })
    targetValue: number;

    // Lifecycle status of the TASK (distinct from per-user progress state).
    @Prop({
      enum: ['draft', 'scheduled', 'active', 'paused', 'ended', 'archived'],
      default: 'active',
      index: true,
    })
    taskStatus: TaskLifecycleStatus;

    @Prop({ type: Date })
    deadline: Date;

    @Prop({ default: '' })
    difficulty: string;

    @Prop({ enum: ['once', 'daily', 'weekly', 'unlimited'], default: 'once' })
    repeatMode: TaskRepeatMode;

    // ── Repeatable / anti-farm limits (P3/P4) ────────────────────────────────
    @Prop({ default: 0 })
    cooldownSec: number;

    @Prop({ default: 0 })
    maxCompletions: number;

    @Prop({ default: 0 })
    maxCompletionsPerDay: number;

    // ── Versioning (P10) ─────────────────────────────────────────────────────
    // Bumped whenever a material condition changes (reward/goal/metric/mode/access).
    // Historical TaskUserProgress keeps its own snapshot so past completions never
    // change retroactively.
    @Prop({ default: 1 })
    version: number;

    // ── EarlyLand multi-step instructions (P1) ───────────────────────────────
    // Steps are the INSTRUCTION for completing ONE task. They never award XP by
    // themselves — the whole task awards once. Per-user step state lives in
    // TaskUserProgress.stepsState, not here.
    @Prop({ type: [Object], default: [] })
    steps: Array<{
      id: string;
      order: number;
      title: string;
      description?: string;
      actionLabel?: string;
      actionUrl?: string;
      estimatedMinutes?: number;
      optional?: boolean;
      verificationMode?: string;
      verificationHint?: string;
    }>;

    @Prop({default:new Date()})
    createdAt:Date
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ type: 1, v2ActivityId: 1, accessTier: 1, date: 1 });
TaskSchema.index({ type: 1, date: 1 });
