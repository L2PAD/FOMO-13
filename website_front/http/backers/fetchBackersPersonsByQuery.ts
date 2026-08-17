import fetchPersonsByQuery from "../investors/fetchPersonsByQuery";
import type {
  PersonListItem,
  PersonsFilterOptions,
  PersonsListResponse,
} from "../investors/fetchPersonsByQuery";
import { fetchFomoV2Backers, isFomoV2BackersEnabled } from "./backersApi";

export type { PersonListItem, PersonsFilterOptions, PersonsListResponse };

const emptyResponse: PersonsListResponse = {
  isSuccess: false,
  persons: [],
  items: [],
  total: 0,
  totalCount: 0,
};

export default async function fetchBackersPersonsByQuery(
  query = ""
): Promise<PersonsListResponse> {
  if (!isFomoV2BackersEnabled()) {
    return fetchPersonsByQuery(query);
  }

  try {
    const { data, res } = await fetchFomoV2Backers("persons", query);
    const persons = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.persons)
        ? data.persons
        : [];
    const total = Number(data?.total ?? data?.totalCount ?? 0);

    return {
      isSuccess: res.ok && !data?.message,
      persons,
      items: persons,
      total,
      totalCount: total,
      page: data?.page,
      limit: data?.limit,
      totalPages: data?.totalPages,
      filterOptions: data?.filterOptions,
    };
  } catch {
    return emptyResponse;
  }
}
