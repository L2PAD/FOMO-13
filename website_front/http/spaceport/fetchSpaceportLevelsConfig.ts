import { API } from "../../config/api";

export type SpaceportPrivilegeStatus = "active" | "planned";

export interface SpaceportLevelPrivilegeConfig {
  key: string;
  label: string;
  status: SpaceportPrivilegeStatus;
}

export interface SpaceportLevelRequirementConfig {
  metric: string;
  label: string;
  required: number;
  current: number;
  met: boolean;
  progressPercent: number;
}

export interface SpaceportLevelConfig {
  level: number;
  name: string;
  reached: boolean;
  isCurrent: boolean;
  isNext: boolean;
  requirements: SpaceportLevelRequirementConfig[];
  metRequirements: number;
  totalRequirements: number;
  privileges: SpaceportLevelPrivilegeConfig[];
}

export interface SpaceportGlobalXpRankConfig {
  key: string;
  name: string;
  order: number;
  minXp: number;
  maxXp: number;
  icon: string;
}

export interface SpaceportLevelsConfigResponse {
  levels: SpaceportLevelConfig[];
  globalXpRanks: SpaceportGlobalXpRankConfig[];
}

const EMPTY: SpaceportLevelsConfigResponse = { levels: [], globalXpRanks: [] };

/**
 * Fetch the PUBLIC, backend-driven SpacePort level ladder (Lv.1–Lv.5) with real
 * requirements and "What You Unlock" privileges. Single source of truth lives in
 * the backend (SPACEPORT_LEVEL_RULES) — nothing here is hardcoded/invented.
 */
export default async function fetchSpaceportLevelsConfig(): Promise<SpaceportLevelsConfigResponse> {
  try {
    const res = await fetch(`${API}/user/spaceport/levels-config`, { method: "GET" });

    if (!res.ok) {
      return EMPTY;
    }

    const data = (await res.json()) as SpaceportLevelsConfigResponse;

    return {
      levels: Array.isArray(data?.levels) ? data.levels : [],
      globalXpRanks: Array.isArray(data?.globalXpRanks) ? data.globalXpRanks : [],
    };
  } catch (error) {
    console.warn("[Spaceport][fetchSpaceportLevelsConfig] failed", error);
    return EMPTY;
  }
}
