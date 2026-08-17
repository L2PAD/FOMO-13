import getAccessToken from "../utils/getAccessToken";
import { configureUrl } from "./config";

const authHeaders = () => ({
  Authorization: `Bearer ${getAccessToken()}`,
  "Content-Type": "application/json",
});

const req = async <T>(path: string, method = "GET", body?: any): Promise<{ success: boolean; data: T | any; status: number }> => {
  try {
    const res = await fetch(configureUrl(path), {
      method,
      headers: authHeaders(),
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { success: res.ok, data, status: res.status };
  } catch (e) {
    return { success: false, data: null, status: 0 };
  }
};

/* ── Email (Resend) ── */
export const getEmailSettings = () => req<any>("admin/settings/email", "GET");
export const updateEmailSettings = (body: any) => req<any>("admin/settings/email", "PUT", body);
export const testEmailSettings = () => req<any>("admin/settings/email/test", "POST");

/* ── 2FA (state flow: disabled → setup_pending → enabled) ── */
export const setup2FA = () => req<any>("auth/2fa/setup", "GET");
export const verify2FA = (code: string) => req<any>("auth/2fa/verify", "POST", { code });
export const disable2FA = (code: string) => req<any>(`auth/2fa/disable/${encodeURIComponent(code)}`, "POST");
export const get2FAStatus = () => req<any>("admin/settings/2fa-status", "GET");

/* ── AI Provider (OpenAI / Emergent) & pricing ── */
export const getAiSettings = () => req<any>("admin/entitlements/ai/settings", "GET");
export const updateAiSettings = (body: any) => req<any>("admin/entitlements/ai/settings", "POST", body);
export const testAiConnection = (body?: any) => req<any>("admin/entitlements/ai/settings/test", "POST", body || {});
export const getAiPricing = () => req<any>("admin/entitlements/ai/pricing", "GET");
export const upsertAiPrice = (body: any) => req<any>("admin/entitlements/ai/pricing", "POST", body);
export const setAiPriceActive = (id: string, active: boolean) => req<any>(`admin/entitlements/ai/pricing/${encodeURIComponent(id)}/active`, "POST", { active });
