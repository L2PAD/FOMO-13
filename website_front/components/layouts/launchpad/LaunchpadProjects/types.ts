export type LaunchpadStatus =
  | "Staking Live"
  | "Claim Available"
  | "Upcoming"
  | "Completed"
  | "Ended"
  | (string & {});

export type FeaturedBadgeVariant = "featured" | "live" | "outline" | "blue";

export interface FeaturedBadge {
  label: string;
  variant?: FeaturedBadgeVariant;
}

export interface LaunchpadProject {
  id: string;
  logo?: string;
  name: string;
  category: string;
  status?: LaunchpadStatus;
  raise?: string;
  allocation?: string;
  participants?: string;
  timeLeft?: string;
  progress?: number;
  isEligible?: boolean;
}

export interface FeaturedProjectData extends LaunchpadProject {
  description?: string;
  badges?: FeaturedBadge[];
}

export interface HowItWorksStep {
  num: string;
  title: string;
  desc: string;
}
