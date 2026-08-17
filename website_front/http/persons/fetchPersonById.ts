import { API } from "../../config/api";
import { IPerson } from "../../types/global_types";
import {
  fetchFomoV2Persons,
  isFomoV2PersonsDetailEnabled,
} from "./personsV2Api";

const fetchLegacyPersonById = async (
  id: string
): Promise<{ isSuccess: boolean; person: IPerson | null; status?: number }> => {
  if (!id) {
    return { isSuccess: false, person: null };
  }

  try {
    const res = await fetch(`${API}/persons/${encodeURIComponent(id)}`, {
      method: "GET",
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300 && !data?.message,
      person: res.status < 300 ? data?.person || data : null,
      status: res.status,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, person: null };
  }
};

export default async (
  id: string
): Promise<{ isSuccess: boolean; person: IPerson | null; status?: number }> => {
  if (!id) {
    return { isSuccess: false, person: null };
  }

  if (!isFomoV2PersonsDetailEnabled()) {
    return fetchLegacyPersonById(id);
  }

  try {
    const { data, res } = await fetchFomoV2Persons(encodeURIComponent(id));
    const person = data?.person || data;

    if (res.ok && data?.ok !== false && person && !data?.message) {
      return {
        isSuccess: true,
        person,
        status: res.status,
      };
    }
  } catch (error) {
    console.log(error);
  }

  return fetchLegacyPersonById(id);
};
