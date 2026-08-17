import { API } from "../../config/api";
import { IBannerItem } from "../../types/global_types";

export default async (
  path: string
): Promise<{ isSuccess: boolean; list: Array<IBannerItem> }> => {
  try {
    const res = await fetch(`${API}/banner/${path}`, {
      method: "GET",
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, list: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, list: [] };
  }
};
