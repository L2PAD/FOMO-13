import mongoose from "mongoose";
import { TaskAccessTier, TaskStatus , TaskTypes, TaskCompletionMode, TaskLifecycleStatus, TaskRepeatMode } from "../models/task.model";

export class TaskDto {
  name: string;
  date: Date;
  link: string;
  description: string;
  time: string;
  projectId?: mongoose.Types.ObjectId;
  v2ActivityId?: mongoose.Types.ObjectId | string;
  activityEntity?: 'fomo_v2';
  accessTier?: TaskAccessTier;
  awardedUsers?: Array<any>;
  usersRequests?: Array<any>;
  type: TaskTypes;
  points: number;
  smallDescription: string;
  status: TaskStatus;
  validationKey: TaskValidationKeys;
  goal:number
  // Canonical completion / lifecycle (P1/P13)
  completionMode?: TaskCompletionMode;
  metric?: string;
  operator?: string;
  targetValue?: number;
  taskStatus?: TaskLifecycleStatus;
  deadline?: Date;
  difficulty?: string;
  repeatMode?: TaskRepeatMode;
  cooldownSec?: number;
  maxCompletions?: number;
  maxCompletionsPerDay?: number;
  steps?: any;
}


export type TaskValidationKeys = 'Portfolio Balance' |  'Invited Users' |  'NFT Deals' |  'Hours online' | 'Comments on Topic'
