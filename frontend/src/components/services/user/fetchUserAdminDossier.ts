import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from "../config";
import { IReturnData } from "../types";

export type UserAdminDossierSection =
  | "summary"
  | "portfolios"
  | "otc"
  | "p2p"
  | "withdraws"
  | "deposits"
  | "comments"
  | "support"
  | "appeals"
  | "logs";

interface FetchUserAdminDossierParams {
  section?: UserAdminDossierSection;
  offset?: number;
  limit?: number;
}

export default async (
  userId: string,
  params: FetchUserAdminDossierParams = {}
): Promise<IReturnData> => {
  try {
    const token = getAccessToken();

    if (!token) {
      throw new Error("Not authorized");
    }

    const queryParams = new URLSearchParams();

    if (params.section) queryParams.append("section", params.section);
    if (params.offset !== undefined) queryParams.append("offset", String(params.offset));
    if (params.limit !== undefined) queryParams.append("limit", String(params.limit));

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const response = await fetch(configureUrl(`user/${userId}/admin-dossier${queryString}`), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();

    return {
      success: response.status < 300,
      data,
    };
  } catch (error) {
    return {
      success: false,
      data: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
