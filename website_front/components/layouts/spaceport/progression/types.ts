export type BadgeStatus = "earned" | "progress" | "locked";

export interface Badge {
  name: string;
  requirement: string;
  status: BadgeStatus;
  progressPercent?: number;
  progressLabel?: string;
}

export interface Requirement {
  label: string;
  progressPercent: number;
  hint: string;
  complete: boolean;
}
