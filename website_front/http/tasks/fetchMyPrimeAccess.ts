import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export interface PrimeAccess {
  hasAccess: boolean;
  mode: string | null;
  matchedBy: string | null;
  reason: string | null;
  requirements: string[];
  expiresAt: string | null;
  authenticated: boolean;
}

// Resolves the current user's EarlyLand Prime access on the backend, honouring
// the CRM-configured mode (PUBLIC / NFT / BACKEND_GRANT / OR / AND) + grants.
export default async (): Promise<PrimeAccess | null> => {
  try {
    const accessToken = getAuthToken();
    const res = await fetch(`${API}/fomo-v2/activities/my-access`, {
      method: "GET",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data?.hasAccess !== "boolean") return null;
    return data as PrimeAccess;
  } catch (error) {
    console.log(error);
    return null;
  }
};
