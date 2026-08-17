export interface FlagItem {
  text: string;
}

export interface TimelineEvent {
  label: string;
  date: string;
}

export interface StepItem {
  id?: string;
  title: string;
  description: string;
  descriptionHtml?: string;
  image?: string;
  timeEstimate?: string;
  isCompleted?: boolean;
  isLocked?: boolean;
  ctaType?: "website" | "address";
  ctaUrl?: string;
  ctaLabel?: string;
  ctaAddress?: string;
}

export type SocialLinkType =
  | "website"
  | "twitter"
  | "telegram"
  | "discord"
  | "custom";

export interface SocialLink {
  type: SocialLinkType;
  url: string;
}

export interface ScoreItem {
  label: string;
  value: string;
}

import type { EarlylandCardData } from "../Feed/FeedCard/types";
export type SimilarProjectItem = EarlylandCardData;

export interface WeekPhase {
  label: string;
  subtitle: string;
  status: "available" | "locked";
  unlocksIn?: string;
}

export interface ActivityWorkspace {
  calendar: {
    added: boolean;
    eventsCount?: number;
    nextDate?: string | null;
    href?: string;
  };
  board: {
    added: boolean;
    cardId?: string | null;
    status?: string | null;
    notePreview?: string | null;
    href?: string;
  };
  fomoTasks: {
    count: number;
    available: number;
    inProgress: number;
    review: number;
    completed: number;
    totalXp: number;
    href?: string;
  };
}

export interface ProjectDetailsData {
  id: string;
  interactionId?: string;
  projectLogo?: string;
  projectName: string;
  type: string;
  status: string;
  isFavourite?: boolean;
  userReaction?: "like" | "dislike" | "hot" | "interested" | null;
  likesCount?: number;
  dislikesCount?: number;
  isAddedToCalendar?: boolean;
  completedStepIds?: string[];
  stepsCompleted?: number;
  stepsTotal?: number;
  stepsProgress?: number;

  // Meta bar
  cost: string;
  category: string;
  difficulty: string;
  reward: string;
  taskType?: string;

  // Progress
  startDate: string;
  endDate: string;
  progress: number;

  // Social links row
  socialLinks?: SocialLink[];

  // About
  aboutText?: string;
  aboutHtml?: string;
  totalRaised?: string;
  fundingType?: string;

  // FOMO Review
  reviewText?: string;
  reviewHtml?: string;
  reviewScores?: ScoreItem[];
  isReviewLocked?: boolean;

  // Activity Metrics (right sidebar)
  riskLevel?: string;
  riskLevelColor?: "green" | "yellow" | "red";
  complexity?: string;
  timeRequired?: string;
  potentialReward?: string;
  potentialRewardColor?: "green" | "yellow" | "red";

  // Timeline (right sidebar)
  timeline?: TimelineEvent[];

  // Flags (right sidebar)
  greenFlags?: FlagItem[];
  yellowFlags?: FlagItem[];
  redFlags?: FlagItem[];

  // Tasks / Steps
  taskTitle?: string;
  taskDescription?: string;
  taskDescriptionHtml?: string;
  taskCtaLabel?: string;
  taskCtaUrl?: string;
  taskProgress?: number;
  taskCompletedSteps?: number;
  taskTotalSteps?: number;
  steps?: StepItem[];
  taskSuccessMessage?: string;
  isTasksLocked?: boolean;
  weekPhases?: WeekPhase[];
  repeatableCyclesDone?: number;
  isExpired?: boolean;

  // EL-1: server-driven Activity Workspace state (canonical Calendar/Board/Tasks)
  workspace?: ActivityWorkspace;

  // You May Also Like
  similarProjects?: SimilarProjectItem[];
}
