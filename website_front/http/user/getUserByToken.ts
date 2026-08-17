import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export default async (): Promise<any> => {
  try {
    const accessToken: string | null = getAuthToken();

    if (!accessToken) return {
      isFullAuth: false,
      isAuth: false
    }

    const res = await fetch(`${API}/user/initial/data`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });


    const userData = await res.json();

    // A wallet-authenticated + activated account counts as logged in even
    // without an email (email confirmation may be skipped in this env).
    if (!res.ok || (!userData?.isActive && !userData?.email && !userData?.wallet)) return {
      isFullAuth: false,
      isAuth: false
    }

    return { ...userData, isAuth: true, isFullAuth: !!accessToken && userData?.isActive };
  } catch (error) {
    console.log(error);

    return false;
  }
};
