import { API } from "../../config/api";

export default async (): Promise<{ isSuccess: boolean; about: any }> => {
  try {
    const res = await fetch(`${API}/about`, {
      method: "GET",
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, about: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, about: {} };
  }
};
