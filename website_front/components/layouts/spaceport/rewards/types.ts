export type RewardStatus = "ready" | "claimed" | "locked";

export interface RewardItem {
  id: string;
  name: string;
  requirement: string;
  progress: string;
  progressComplete: boolean;
  status: RewardStatus;
  progressPercent?: number;
  badgeKey?: string;
  claimXp?: number;
}

export interface HowToStep {
  number: number;
  title: string;
  description: string;
}
