import getAuthToken from "../getAuthToken";
import { API } from "../../config/api";

export interface CreateAppealPayload {
  reason: string;
  description: string;
  email: string;
  attachments?: string[];
}

export interface CreateAppealResponse {
  isSuccess: boolean;
  error?: string;
}

export const createAppeal = async (
  dealId: string,
  payload: CreateAppealPayload
): Promise<CreateAppealResponse> => {
  try {
    const accessToken: string | null = getAuthToken();
    const res = await fetch(`${API}/deals/appeal/${dealId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      error: data?.message || "",
    };
  } catch (error) {
    console.error("Create appeal error:", error);
    return {
      isSuccess: false,
      error: "Unexpected error while creating appeal",
    };
  }
};
