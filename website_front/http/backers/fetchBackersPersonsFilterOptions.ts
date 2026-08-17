import fetchPersonFilterOptions from "../investors/fetchPersonFilterOptions";
import type {
  PersonFilterOptionsResponse,
} from "../investors/fetchPersonFilterOptions";
import { fetchFomoV2Backers, isFomoV2BackersEnabled } from "./backersApi";

export type { PersonFilterOptionsResponse };

const emptyFilters: PersonFilterOptionsResponse = {
  sectors: [],
  specializations: [],
};

export default async function fetchBackersPersonsFilterOptions(
  query = ""
): Promise<PersonFilterOptionsResponse> {
  if (!isFomoV2BackersEnabled()) {
    return fetchPersonFilterOptions(query);
  }

  try {
    const { data, res } = await fetchFomoV2Backers(
      "persons/filter-options",
      query
    );

    if (!res.ok) return emptyFilters;

    const sectors = Array.isArray(data?.sectors) ? data.sectors : [];
    const specializations = Array.isArray(data?.specializations)
      ? data.specializations
      : sectors;

    return {
      sectors,
      specializations,
    };
  } catch {
    return emptyFilters;
  }
}
