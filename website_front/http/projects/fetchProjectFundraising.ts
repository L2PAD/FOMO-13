import { API } from "../../config/api";
import { parseProjectReadQuery, withQuery } from "./projectReadQuery";

export default async (
  slugOrId: string,
  query = ""
): Promise<{ isSuccess: boolean; data: any }> => {
  try {
    const { params } = parseProjectReadQuery(query);
    const path = `/fomo-v2/projects/${encodeURIComponent(slugOrId)}/fundraising`;
    const res = await fetch(
      `${API}${withQuery(path, params)}`,
      {
        method: "GET",
      }
    );

    const data = await res.json();

    return { isSuccess: res.status < 300, data };
  } catch {
    return { isSuccess: false, data: null };
  }
};

export const fetchProjectFundingRounds = async (
  project: string,
  query = ""
): Promise<{ isSuccess: boolean; data: any[] }> => {
  try {
    const params = new URLSearchParams(String(query).replace(/^\?/, ""));
    params.delete("readModel");
    const path = `/fomo-v2/funding-feed/projects/${encodeURIComponent(
      project
    )}/rounds`;
    const res = await fetch(`${API}${withQuery(path, params)}`, {
      method: "GET",
    });
    const payload = await res.json();
    const rounds = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.rounds)
        ? payload.rounds
        : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.fundraising)
            ? payload.fundraising
            : [];

    return { isSuccess: res.status < 300, data: rounds };
  } catch {
    return { isSuccess: false, data: [] };
  }
};
