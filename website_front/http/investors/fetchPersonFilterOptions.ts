import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export type PersonFilterOptionsResponse = {
  sectors?: string[];
  specializations: string[];
};

const emptyFilters: PersonFilterOptionsResponse = {
  sectors: [],
  specializations: [],
};

export default async function fetchPersonFilterOptions(
  query = ""
): Promise<PersonFilterOptionsResponse> {
  try {
    const accessToken: string | null = getAuthToken();
    const res = await fetch(`${API}/investors/persons/filter-options${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) return emptyFilters;

    const data = await res.json();

    const sectors = Array.isArray(data?.sectors) ? data.sectors : [];
    const specializations = Array.isArray(data?.specializations)
      ? data.specializations
      : sectors;

    return {
      sectors,
      specializations,
    };
  } catch (error) {
    console.log(error);

    return emptyFilters;
  }
}
