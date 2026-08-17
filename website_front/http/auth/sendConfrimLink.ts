import { API } from "../../config/api";
import { RegistrationType } from "../../types/global_types";
import getWalletToken from "../getWalletToken";

export default async (): Promise<boolean> => {
  try {
    const token = getWalletToken();

    const res = await fetch(`${API}/auth/send-confirm`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const accessToken = await res.json();

    if (accessToken?.statusCode > 300) {
      return false;
    }

    return true;
  } catch (error) {
    console.log(error);

    return false;
  }
};
