import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export default async (img: File): Promise<boolean> => {
  try {
    const formData = new FormData();

    formData.append("img", img);

    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/user/photo`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const data = await res.json();

    return !!data;
  } catch (error) {
    console.log(error);

    return false;
  }
};
