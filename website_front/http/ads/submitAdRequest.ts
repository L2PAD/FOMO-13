import { API } from "../../config/api";

export interface AdRequestPayload {
  projectName: string;
  email: string;
  contactName?: string;
  telegram?: string;
  website?: string;
  adType?: string;
  placement?: string;
  budget?: string;
  message?: string;
  source?: string;
}

export default async (payload: AdRequestPayload): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await fetch(`${API}/ads/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    return { success: !!json?.success, message: json?.message };
  } catch (e) {
    return { success: false, message: "network" };
  }
};
