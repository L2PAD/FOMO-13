import { API } from "../../config/api";

export default async (): Promise<{ isSuccess: boolean; layout: any }> => {
  try {
    const res = await fetch(`${API}/layout/socialmedia`, {
      method: "GET",
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, layout: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, layout: {} };
  }
};
