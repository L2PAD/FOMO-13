import { API } from "../../config/api";
import { LoginType } from "../../types/global_types";
import { setTokenCookie } from "../../helpers/cookieToken";
import getWalletToken from "../getWalletToken";

export default async (
  loginData: LoginType
): Promise<{ isSuccess: boolean; error?: string; requires2FA: boolean }> => {
  try {
    const token = getWalletToken();

    const res = await fetch(`${API}/user/login`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const data = await res.json();

    if (data?.statusCode > 300) {
      return { isSuccess: false, error: data?.message, requires2FA: false };
    }

    const accessToken: string | undefined = data?.accessToken;

    if (accessToken && !data?.requires2FA) setTokenCookie(accessToken);
    if (accessToken && data?.requires2FA)
      setTokenCookie(accessToken, "temp-tkn");

    return {
      isSuccess: !!accessToken,
      error: data?.message,
      requires2FA: !!data?.requires2FA,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, error: "", requires2FA: false };
  }
};
