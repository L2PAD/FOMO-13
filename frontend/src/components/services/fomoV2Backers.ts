import getAccessToken from "../utils/getAccessToken";
import { configureUrl } from "./config";
import { IReturnData } from "./types";

type BackerAdminType = "funds" | "persons";

const request = async (
  path: string,
  method: "PATCH" | "DELETE"
): Promise<IReturnData> => {
  try {
    const token: string = getAccessToken();

    if (!token) {
      throw new Error("Not auth");
    }

    const response = await fetch(configureUrl(path), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));

    return { success: response.status < 300, data };
  } catch (error) {
    console.log(error);
    return { success: false, data: error };
  }
};

export const changeFomoV2BackerStatus = (
  type: BackerAdminType,
  id: string,
  status: string
) =>
  request(
    `admin/fomo-v2/backers/${type}/${encodeURIComponent(id)}/status/${encodeURIComponent(status)}`,
    "PATCH"
  );

export const toggleFomoV2BackerSponsoredStatus = (
  type: BackerAdminType,
  id: string
) =>
  request(
    `admin/fomo-v2/backers/${type}/${encodeURIComponent(id)}/sponsored`,
    "PATCH"
  );

export const toggleFomoV2BackerEralashStatus = (
  type: BackerAdminType,
  id: string
) =>
  request(
    `admin/fomo-v2/backers/${type}/${encodeURIComponent(id)}/eralash`,
    "PATCH"
  );

export const toggleFomoV2BackerRedStatus = (
  type: BackerAdminType,
  id: string
) =>
  request(
    `admin/fomo-v2/backers/${type}/${encodeURIComponent(id)}/red-status`,
    "PATCH"
  );

export const removeFomoV2Backer = (type: BackerAdminType, id: string) =>
  request(`admin/fomo-v2/backers/${type}/${encodeURIComponent(id)}`, "DELETE");
