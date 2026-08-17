import { API } from "../config/api";
import getAuthToken from "./getAuthToken";

export type FomoV2FlagEntityType =
  | "market_project"
  | "ico_project"
  | "backer"
  | "person";
export type FomoV2FlagType = "green" | "yellow" | "red";

export interface CreateFomoV2FlagPayload {
  entityType: FomoV2FlagEntityType;
  entityId: string;
  flagType: FomoV2FlagType;
  title?: string;
  description: string;
  sourceUrl?: string;
}

export const createFomoV2Flag = async (
  payload: CreateFomoV2FlagPayload
): Promise<{ isSuccess: boolean; data?: any; error?: string; status?: number }> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return {
        isSuccess: false,
        error: "Not auth",
        status: 401,
      };
    }

    const response = await fetch(`${API}/fomo-v2/flags`, {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return {
      isSuccess: response.status < 300 && data?.ok !== false,
      data,
      status: response.status,
      error: response.status < 300 ? undefined : data?.message || response.statusText,
    };
  } catch (error: any) {
    return {
      isSuccess: false,
      error: error?.message || "Flag submit failed",
    };
  }
};
