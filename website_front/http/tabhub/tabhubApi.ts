import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export const isTabHubV2Enabled = () =>
  process.env.NEXT_PUBLIC_TABHUB_V2 !== "false";

export const getTabHubBaseUrl = () =>
  `${API}${isTabHubV2Enabled() ? "/fomo-v2/tabs" : "/tabs"}`;

export const buildTabHubUrl = (path?: string) => {
  const normalizedPath = path ? path.replace(/^\/+/, "") : "";

  return normalizedPath
    ? `${getTabHubBaseUrl()}/${normalizedPath}`
    : getTabHubBaseUrl();
};

export const buildTabHubActionPath = (
  action: "save" | "pin",
  id: string
) => {
  return isTabHubV2Enabled() ? `${id}/${action}` : `${action}/${id}`;
};

export const getTabHubAuthHeaders = (
  contentType?: "json"
): HeadersInit => {
  const accessToken: string | null = getAuthToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (contentType === "json") {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};
