export type DifficultyLevel = "Easy" | "Medium" | "Hard" | (string & {});
export type StatusType = "Active" | "Upcoming" | "Ended" | (string & {});
export type TaskFrequency =
  | "Daily tasks"
  | "Weekly tasks"
  | "Monthly tasks"
  | "Ongoing tasks"
  | (string & {});

export type TagVariant = "deadline" | "type" | "green" | "default";

export interface CardTag {
  label: string;
  variant?: TagVariant;
}

export interface EarlylandCardData {
  id: string;
  interactionId?: string;
  projectLogo?: string;
  projectName?: string;
  type?: string;
  isHot?: boolean;
  status?: StatusType;
  isFavourite?: boolean;
  category?: string;
  difficulty?: DifficultyLevel;
  reward?: string;
  tags?: CardTag[];
  description?: string;
  descriptionHtml?: string;
  timeEstimate?: string;
  cost?: string;
  raised?: string;
  startDate?: string;
  endDate?: string;
  progress?: number;
  taskType?: TaskFrequency;
  isLocked?: boolean;
  // FOMO (Team) Tasks presentation — drives the compact indicator + Prime glow
  hasFomoTasks?: boolean;
  fomoTasksCount?: number;
  commentsCount?: number;
  isPrime?: boolean;
}
