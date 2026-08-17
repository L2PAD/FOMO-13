import { API } from "../../config/api";
import { deleteTokenCookie, setTokenCookie } from "../../helpers/cookieToken";
import { RegistrationType } from "../../types/global_types";
import getAuthToken from "../getAuthToken";
import getTempToken from "../getTempToken";
import getWalletToken from "../getWalletToken";

export default async (code: string): Promise<{ isSuccess: boolean }> => {
  try {
    const token = getAuthToken() || getTempToken();
    console.log(token);
    const res = await fetch(`${API}/auth/2fa/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();
    const accessToken: string | undefined = data?.accessToken;
    accessToken && setTokenCookie(accessToken);
    accessToken && deleteTokenCookie("temp-tkn");

    return { isSuccess: res.status < 300 };
  } catch (error) {
    console.log(error);

    return { isSuccess: false };
  }
};
