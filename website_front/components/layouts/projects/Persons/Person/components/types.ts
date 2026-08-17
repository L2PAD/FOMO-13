import { ISocialMediaItem, IUser } from "../../../../../../types/global_types";
import { IFomiesWithRefetch } from "../../../../../../pages/crypto/fomies/[id]";

export const FOMIES_TABS = ["Overview", "Follow Me", "Comparison"] as const;

export type FomiesTab = (typeof FOMIES_TABS)[number];

export interface FomiesPersonData extends IFomiesWithRefetch {
  activityXP?: number;
  commentsCount?: number;
  averageRoi?: number;
  createdAt?: Date | string;
  createDate?: Date;
  claimedTasks?: Array<{
    taskId?: string;
    date?: Date | string;
  }>;
  activity?: Array<string>;
  followers?: Array<string>;
  following?: Array<string>;
  hoursOnline?: number;
  numberOfDeals?: number;
  portfolio?: Array<string>;
  portfolioBalance?: number;
  points?: number;
  predictionAccuracy?: number | string;
  predictionAccuracyPercent?: number | string;
  photo?: string;
  refLvlOne?: Array<string>;
  refLvlTwo?: Array<string>;
  spaceportNftCount?: number | null;
  spaceportNftCountStatus?: "ready" | "no-wallet" | "unavailable";
  spaceportNftContract?: string;
  specialization?: string;
  telegramData?: {
    name?: string;
  };
  twitterData?: {
    name?: string;
    photo?: string;
    username?: string;
  };
  username?: string;
  verificationStatus?: boolean;
  wallet?: string;
}

export interface FomiesAuthUser extends Partial<IUser> {
  isFullAuth?: boolean;
  socialNetworks?: Record<string, string> | ISocialMediaItem[];
}

export interface FomiesWatchlist {
  persons?: Array<{
    _id?: string;
  }>;
}

export interface FomiesHeaderActionsProps {
  desktopSocialLinks: Array<{ key: string; href: string }>;
  isActionsPopoverOpen: boolean;
  isFollowing: boolean;
  isMobile: boolean;
  mode: "mobile" | "toolbar" | "right-panel";
  isOwnProfile: boolean;
  isSocialsPopoverOpen: boolean;
  isWatchListProject: boolean;
  mobileSocialLinks: Array<{ key: string; href: string }>;
  onCloseActionsPopover: () => void;
  onCloseSocialsPopover: () => void;
  onDislike: () => void;
  onFollowButtonClick: () => void;
  onLike: () => void;
  onToggleActionsPopover: () => void;
  onToggleSocialsPopover: () => void;
  onUpdateWatchlist: () => void;
  personData: FomiesPersonData;
}
