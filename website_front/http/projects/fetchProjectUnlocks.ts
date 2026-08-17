import { API } from "../../config/api";
import { parseProjectReadQuery, withQuery } from "./projectReadQuery";

export default async (
  slugOrId: string,
  query = ""
): Promise<{ isSuccess: boolean; data: any }> => {
  try {
    const { params } = parseProjectReadQuery(query);
    if (!params.has("events")) params.set("events", "upcoming");
    if (!params.has("eventsLimit")) params.set("eventsLimit", "10");
    const path = `/fomo-v2/projects/${encodeURIComponent(slugOrId)}/unlocks`;

    const res = await fetch(
      `${API}${withQuery(path, params)}`,
      {
        method: "GET",
      }
    );

    const data = await res.json();

    return { isSuccess: res.status < 300, data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, data: null };
  }
};
