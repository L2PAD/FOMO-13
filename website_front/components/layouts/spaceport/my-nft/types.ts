import { NFTRequirement } from "./NFTHiddenDetailsModal";
import { NFTAchievement } from "./NFTSingularityDetailsModal";

export type Rarity = "Common" | "Rare" | "Epic" | "Legendary" | "FOMO Gold";
export type CollectionFilter = "all" | "staked" | "ready";

export interface NFTItem {
  id: string;
  name: string;
  number: string;
  rarity: Rarity;
  image: string;
  views: number | string;
  floorPrice: string;
  hiddenRarity: boolean;
  priceEth: string;
  priceUsd: string;
  staked: boolean;
  tokenId?: string;
  status?: "Staked" | "Unstaked";
  floorPriceEth?: string;
  properties?: Array<{ label: string; value: string }>;
  stakingHistory?: Array<{
    id: string;
    name: string;
    date: string;
    xp: string;
    value?: string;
    valueTone?: "positive" | "neutral";
  }>;
  rewards?: Array<{
    id: string;
    name: string;
    date: string;
    status: "Claimed" | "Pending";
  }>;
  timeToNextLevel?: string;
  progressPercent?: number;
  totalStakedDays?: number;
  totalStakedUnits?: number;
  stakingRewardUnitLabel?: string;
  nextRewardTarget?: string;
  nextRewardUnlock?: string;
  stakingStartedAt?: string;
  stakingSeconds?: number;
  singularityNotice?: string;
  requirements?: NFTRequirement[];
  benefits?: string[];
  tradingRestriction?: string;
  singularityRarity?: boolean;
  congratsNotice?: string;
  achievements?: NFTAchievement[];
  tradingRestrictions?: string[];
}

export interface ShardItem {
  id: string;
  name: string;
  rarity: Rarity;
  image: string;
  selected: boolean;
}

export interface CrossingEntry {
  id: string;
  inputs: Array<{ name: string; rarity: Rarity }>;
  output: { name: string; rarity: Rarity };
  time: string;
}
