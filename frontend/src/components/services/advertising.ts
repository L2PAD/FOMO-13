import getAccessToken from "../utils/getAccessToken";
import { configureUrl } from "./config";

const authHeaders = () => ({ Authorization: `Bearer ${getAccessToken()}`, "Content-Type": "application/json" });

const req = async <T = any>(path: string, method = "GET", body?: any): Promise<{ success: boolean; data: T | any; status: number }> => {
  try {
    const res = await fetch(configureUrl(path), {
      method, headers: authHeaders(), credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    return { success: res.ok && json?.success !== false, data: json?.data ?? json, status: res.status };
  } catch {
    return { success: false, data: null, status: 0 };
  }
};

export interface AdPlacement {
  code: string; adminName: string; group: string; surface: string; route: string;
  format: string; devices: string[]; allowedCreativeTypes: string[]; maxHeadline: number; maxDescription: number;
  cta: boolean; aspectDesktop: string; aspectMobile: string; availability: string; legacy?: string; enabled?: boolean;
  mode?: string; rotateAdSeconds?: number; rotateFormSeconds?: number;
  live: { avgViewablePerDay: number; avgCtr: number; uniqueReach: number; competingCampaigns: number; dataQuality: string; estimatedInventoryPerDay: number; inventoryIsBaseline: boolean };
}
export interface AdCampaign {
  _id: string; name: string; advertiserName: string; objective: string; status: string;
  pricingModel: string; rate: number; budget: number; spend: number; startAt?: string; endAt?: string;
  timezone?: string; pacing?: string; demo?: boolean; report?: any;
  placements: string[]; priority: number; targeting: any; frequencyCap: any; creativeCount?: number;
  stats: { impressions: number; viewable: number; clicks: number; uniqueSessions: number; spend: number; ctr: number; viewability: number };
}
export interface AdCreative {
  _id: string; campaignId: string; type: string; brandName: string; logoUrl: string; imageUrl: string; mobileImageUrl: string;
  headline: string; description: string; ctaLabel: string; destinationUrl: string; sponsoredLabel: string; variant: string; displaySize: string; alt: string; enabled: boolean;
  template?: string; kindOverride?: string; progress?: number; progressLabel?: string; demo?: boolean;
  highlights?: { label: string; value: string; link?: string; source?: string }[];
}

export const listPlacements = () => req<AdPlacement[]>("ads/admin/placements");
export const setPlacementEnabled = (code: string, enabled: boolean) => req(`ads/admin/placements/${code}`, "PATCH", { enabled });
export const updatePlacement = (code: string, body: any) => req(`ads/admin/placements/${code}`, "PATCH", body);
export const analyticsOverview = (days = 30, includeDemo = false) => req("ads/admin/analytics/overview?days=" + days + (includeDemo ? "&includeDemo=true" : ""));
export const analyticsCampaign = (id: string) => req("ads/admin/analytics/campaign/" + id);
export const forecast = (body: any) => req("ads/admin/forecast", "POST", body);

export const listCampaigns = (q: Record<string, string> = {}) => {
  const s = new URLSearchParams(q).toString();
  return req<AdCampaign[]>("ads/admin/campaigns" + (s ? "?" + s : ""));
};
export const getCampaign = (id: string) => req<AdCampaign & { creatives: AdCreative[] }>("ads/admin/campaigns/" + id);
export const createCampaign = (body: any) => req("ads/admin/campaigns", "POST", body);
export const updateCampaign = (id: string, body: any) => req("ads/admin/campaigns/" + id, "PATCH", body);
export const setCampaignStatus = (id: string, status: string) => req("ads/admin/campaigns/" + id + "/status", "PATCH", { status });
export const deleteCampaign = (id: string) => req("ads/admin/campaigns/" + id, "DELETE");

// Advertiser reports
export const getCampaignReport = (id: string) => req("ads/admin/campaigns/" + id + "/report");
export const updateReportConfig = (id: string, body: any) => req("ads/admin/campaigns/" + id + "/report", "PATCH", body);
export const generateReport = (id: string) => req("ads/admin/campaigns/" + id + "/report/generate", "POST");
export const sendReport = (id: string) => req("ads/admin/campaigns/" + id + "/report/send", "POST");

export const listCreatives = (campaignId: string) => req<AdCreative[]>(`ads/admin/campaigns/${campaignId}/creatives`);
export const createCreative = (campaignId: string, body: any) => req(`ads/admin/campaigns/${campaignId}/creatives`, "POST", body);
export const updateCreative = (id: string, body: any) => req("ads/admin/creatives/" + id, "PATCH", body);
export const deleteCreative = (id: string) => req("ads/admin/creatives/" + id, "DELETE");

export const listAdvertisers = () => req("ads/admin/advertisers");
export const createAdvertiser = (body: any) => req("ads/admin/advertisers", "POST", body);

export const listAdRequests = (status = "") => req("ads/admin/requests" + (status ? "?status=" + status : ""));
export const adRequestCounts = () => req("ads/admin/requests/counts");
export const updateAdRequestStatus = (id: string, status: string) => req(`ads/admin/requests/${id}/status`, "PATCH", { status });
export const aiGenerateRequestCampaign = (id: string) => req(`ads/admin/requests/${id}/ai-generate`, "POST");
export const approveRequestCampaign = (id: string) => req(`ads/admin/requests/${id}/approve`, "POST");
export const rejectRequestCampaign = (id: string) => req(`ads/admin/requests/${id}/reject`, "POST");
