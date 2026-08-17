import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export const isFomoV2PersonsDetailEnabled = () =>
  process.env.NEXT_PUBLIC_PERSONS_DETAIL_V2 !== "false" &&
  process.env.NEXT_PUBLIC_BACKERS_V2 !== "false";

export const fetchFomoV2Persons = async (path = "", query = "") => {
  const accessToken: string | null = getAuthToken();
  const normalizedPath = path ? `/${path.replace(/^\/+/, "")}` : "";
  const res = await fetch(
    `${API}/fomo-v2/backers/persons${normalizedPath}${query || ""}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const data = await res.json();

  return { data, res };
};
