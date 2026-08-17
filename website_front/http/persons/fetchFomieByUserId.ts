import { API } from "../../config/api";
import { IPerson } from "../../types/global_types";

export default async (
  id: string
): Promise<{ isSuccess: boolean; person: IPerson | null; status?: number }> => {
  if (!id) {
    return { isSuccess: false, person: null };
  }

  try {
    const res = await fetch(
      `${API}/persons/${encodeURIComponent(id)}?type=fomies`,
      {
        method: "GET",
      }
    );

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
