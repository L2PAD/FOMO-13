import { API } from "../../config/api";
import { ICollection } from "../../types/global_types";

export default async (
  id: string
): Promise<{ isSuccess: boolean; collection: ICollection | object }> => {
  try {
    const res = await fetch(`${API}/collections/${id}`, {
      method: "GET",
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, collection: data || {} };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, collection: {} };
  }
};
