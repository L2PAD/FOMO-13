import getAuthToken from "../getAuthToken";
import { IReturnData } from "../../helpers/types";
import { API } from "../../config/api";
import getWalletToken from "../getWalletToken";

export type ReportType =
  | "impersonality"
  | "inappropriateBehavior"
  | "underageAccount";
export type ReportSubType = "me" | "publicFigure" | "someoneIknow";

export interface ICreateReportPayload {
  userId: string;
  type: ReportType;
  subType: ReportSubType | null;
  body?: string;
  attachment?: string;
}

export default async function createReport(
  data: ICreateReportPayload
): Promise<IReturnData> {
  try {
    const token: string | null = getWalletToken();

    if (!token) throw new Error("Not authenticated");

    const response = await fetch(`${API}/reports`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    });

    const message = await response.json();

    return { success: response.ok, data: message };
  } catch (error) {
    console.error("Error creating report:", error);
    return { success: false, data: error };
  }
}
